## Context

PawTrip 当前只有问候语链路:后端 `GET /api/greeting` 公开,前端 `/` 与 `/about` 公开,统一错误契约已采用 RFC 9457 Problem Details,前端请求统一经过 `apps/web/src/lib/http/request.ts` 与 TanStack Query。仓库没有账号表、认证依赖或会话配置。

本设计引入最小登录闭环,约束来自:

- REQ-003:Spring Security 服务端会话 cookie、保护全部业务接口、前端未登录跳 `/login`、登录成功进入 `/`、顶部导航登出
- Spring Boot 4.1.2 BOM 管理 Spring Security `7.1.2`
- Spring Security 7 官方推荐:`csrf.spa()`、`formLogin`、`logout`、`sessionManagement`
- 既有问题:SSR 期间前端不能请求相对 `/api` URL;现有接口测试无认证
- 安全规则:`@rule:security-baseline`、`@rule:no-hardcoded-secrets`、`@rule:java-security`

## Goals / Non-Goals

**Goals:**

- 数据库账号 + BCrypt 密码校验 + Spring Security 服务端会话
- 登录、当前用户、登出三个认证接口,错误统一为 Problem Details
- 全部 `/api/**` 业务接口默认要求认证,已登录时问候语契约不变
- SPA CSRF、会话固定保护、30 分钟超时、`HttpOnly` + `SameSite=Lax`
- 前端登录页、受保护路由、已登录导航登出与全局 401 失效
- 现有测试更新为带认证并通过,新增安全路径测试和人工 E2E

**Non-Goals:**

- 注册、找回/修改密码、用户管理、角色/资源级授权、多租户
- 记住我、OAuth2/SSO、MFA、Passkey
- 登录限流、失败锁定、审计告警
- 多实例会话共享、Spring Session、分布式缓存
- 生产 HTTPS、`Secure` cookie、部署与反向代理
- SSR 阶段认证预取、登录后回跳原目标页
- 前端自动化组件测试框架或 E2E 运行器

## Decisions

### D1. 认证载体使用 Spring Security 服务端 HTTP Session

- **Context**:需求明确要求“Spring Security 服务端会话 cookie”,前端是 SPA。
- **Decision**:使用 Spring Security 默认的 `HttpSession` 认证持久化与 `JSESSIONID` cookie;认证状态只保存在服务端,前端不持有令牌。显式声明 `sessionCreationPolicy(IF_REQUIRED)`。
- **Rejected alternatives**:
  - JWT:与“服务端会话 cookie”需求冲突,且需要前端存储令牌。
  - 自研 token/session 表:重复 Spring Security 已有能力,安全风险高。
  - Spring Session JDBC:当前单实例,增加依赖与表结构,超出最小范围。

### D2. 登录使用 Spring Security `formLogin` + JSON 成功/失败处理器

- **Context**:前端需要自己的 `/login` 页面和 JSON 错误,同时希望复用框架的会话固定、CSRF 与认证失败处理。
- **Decision**:配置 `formLogin`:
  - `loginPage("/login")` 关闭默认生成登录页(该路径由前端 SPA 拥有)
  - `loginProcessingUrl("/api/auth/login")`
  - 自定义 `AuthenticationSuccessHandler` 返回 `200 application/json` 与当前用户名
  - 自定义 `AuthenticationFailureHandler` 返回 `401 application/problem+json` 与 `INVALID_CREDENTIALS`
  - 登录页提交 `application/x-www-form-urlencoded` 的 `username`/`password`
- **Rejected alternatives**:
  - 自研 JSON 登录控制器 + `AuthenticationManager`:需要手工保存 `SecurityContext`、处理会话固定与 CSRF token 轮换,容易遗漏安全步骤;官方文档也建议优先使用框架过滤器。
  - 自研 JSON `AuthenticationConverter` + 自定义过滤器:控制力更强但代码量与测试面明显增加,当前无此必要。
  - 默认 HTML 登录页/重定向:不适合 SPA,且与 401 JSON 契约冲突。

### D3. 账号来源使用数据库表 + `UserDetailsService`

- **Context**:需求方选择“数据库用户表 + 种子账号”;现有持久化栈为 Spring Data JPA + SQLite + Flyway。
- **Decision**:新增 `app_user` 表、`AppUser` 实体、`AppUserRepository.findByUsername`、`AppUserDetailsService` 与 `BCryptPasswordEncoder` bean。依赖 Spring Boot 自动配置的 `DaoAuthenticationProvider`/`AuthenticationManager`;实现后以集成测试验证登录链路。
- **Rejected alternatives**:
  - 内存单账号:需求方明确选择数据库用户表,且不利于后续多用户。
  - `DelegatingPasswordEncoder`:当前只有 BCrypt,显式 `BCryptPasswordEncoder` 更简单、种子哈希格式更直接。
  - Spring Data JDBC:项目已统一 JPA。

### D4. 新增 `app_user` 表,账号由独立种子脚本注入

- **Context**:需要可重复使用的本地/测试账号,但需求方明确要求迁移不注入账号数据。
- **Decision**:新增 `V2__create_app_user.sql`,仅建表:
  - `app_user(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1)`
  - 迁移中不包含 `INSERT`,不写入任何账号
  - 新增 `scripts/seed-users.mjs`,脚本内定义若干测试账号/密码,运行时用 `bcryptjs`(cost 10)生成哈希,并以 `ON CONFLICT(username)` 幂等写入
  - 脚本默认写入 `apps/server/data/pawtrip.db`,支持通过参数或 `SEED_DB` 指定其他数据库;表不存在时提示先启动后端执行迁移
  - 自动化测试仍自行创建随机密码用户,不依赖种子脚本
- **Rejected alternatives**:
  - 迁移写入账号:需求方明确排除。
  - 迁移写入明文密码:违反安全规则。
  - 环境变量注入密码:增加启动复杂度,且不易定义多个账号。
  - 测试硬编码密码:仍可能被扫描为 secret;运行时生成更干净。

### D5. 授权规则显式限定公开认证端点

- **Context**:后端只提供 API;需要保证业务接口默认受保护,同时允许登录、会话探测与登出。
- **Decision**:
  - `dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()` 与 `/error` 放行,保证错误响应可渲染
  - `/api/auth/login`、`/api/auth/me`、`/api/auth/logout` 放行
  - `/api/**` 要求 `authenticated()`
  - `anyRequest().denyAll()`(后端不承载页面与静态资源)
  - `httpBasic` 与 `rememberMe` 显式关闭
- **Rejected alternatives**:
  - 默认配置:会生成登录页与 Basic 认证,不符合 SPA/JSON 需求。
  - `anyRequest().permitAll()` + 方法级注解:容易漏保护,不满足“保护所有业务接口”。

### D6. CSRF 使用 Spring Security 7 的 SPA 模式

- **Context**:会话 cookie 认证的状态变更请求必须防 CSRF;前端是 SPA,需要从 JavaScript 读取 token。
- **Decision**:`csrf(csrf -> csrf.spa())`。该方法在 Spring Security 7 中设置 `CookieCsrfTokenRepository.withHttpOnlyFalse()` 与 `SpaCsrfTokenRequestHandler`;token 写入 `XSRF-TOKEN` cookie,客户端通过 `X-XSRF-TOKEN` header 回传。登录成功由 `CsrfAuthenticationStrategy` 轮换 token,登出由 `CsrfLogoutHandler` 清理 token。前端在应用启动时通过 `GET /api/auth/me` 获取 token。
- **Rejected alternatives**:
  - 关闭 CSRF:违反 `@rule:security-baseline`。
  - 仅依赖 `SameSite=Lax`:不能覆盖同站攻击面,且安全基线明确要求 CSRF 保护。
  - 手写 `CookieCsrfTokenRepository` + 自定义 handler:`.spa()` 已是 7.x 官方封装,重复实现无收益。

### D7. 安全过滤器错误统一由 Problem Details 写入器输出

- **Context**:认证入口、登录失败、CSRF/授权拒绝发生在 MVC 之外,`@RestControllerAdvice` 不会处理;但前端错误契约必须一致。
- **Decision**:
  - 新增 `SecurityProblemWriter`(注入 `ObjectMapper`),输出 `application/problem+json`,字段包含 `type`、`title`、`status`、`detail`、`instance`、`code`
  - 自定义 `AuthenticationEntryPoint` 输出 `401 UNAUTHENTICATED`
  - 自定义 `AccessDeniedHandler` 输出 `403 ACCESS_DENIED`
  - 登录失败处理器输出 `401 INVALID_CREDENTIALS`
  - `ApiErrorCode` 增加上述三个错误码;MVC 侧新增 `UnauthenticatedException` 供 `GET /api/auth/me` 主动返回 401
  - 登出成功使用 `HttpStatusReturningLogoutSuccessHandler` 返回 `204`
- **Rejected alternatives**:
  - 让安全过滤器重定向到 HTML:违反 JSON API 契约。
  - 在过滤器中直接拼字符串 JSON:易与既有 Problem Details 结构漂移。
  - 让 401/403 落到默认空响应:前端无法获得稳定 `code`。

### D8. 会话固定、超时与无状态请求缓存

- **Context**:登录必须防会话固定;未认证的 API 请求不应无谓创建 session。
- **Decision**:
  - `sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()))`
  - `requestCache(cache -> cache.disable())`:登录成功由前端固定跳 `/`,不需要保存原始请求
  - `application.yml` 设置 `server.servlet.session.timeout: 30m`
  - cookie 设置 `http-only: true`、`same-site: lax`、`secure: false`(本地开发;生产另行处理)
  - 不配置并发会话上限与记住我
- **Rejected alternatives**:
  - `newSession` / `migrateSession`:`changeSessionId` 是 Servlet 3.1+ 默认且保留必要属性。
  - 保存原始请求并回跳:产品明确固定回 `/`。
  - 未认证请求也创建 session:浪费资源且放大会话固定面。

### D9. 后端代码按 `auth` 包聚合

- **Context**:现有后端按 `greeting`、`error` 分包。
- **Decision**:新增 `com.pawtrip.server.auth`:
  - `AppUser`、`AppUserRepository`、`AppUserDetailsService`
  - `AuthController`(`GET /api/auth/me`)
  - `SecurityConfig`、`SecurityProblemWriter`、JSON 成功/失败处理器
  - 错误码与 `UnauthenticatedException` 留在 `error` 包
- **Rejected alternatives**:
  - 全部塞进 `ServerApplication`:不可维护。
  - 新建独立模块:当前规模不值得。

### D10. 前端使用受保护布局组件作为认证门

- **Context**:TanStack Start 默认 SSR;SSR 期间相对 `/api` 请求不可用(既有设计已确认)。路由守卫需要覆盖直接访问、刷新与客户端导航。
- **Decision**:
  - 新增 pathless 布局 `apps/web/src/routes/_authenticated.tsx`,将 `/` 与 `/about` 移入其下(URL 不变)
  - 布局组件使用 `useQuery(authQueryOptions)`:
    - SSR 阶段或查询 pending:渲染中性加载态,不请求相对 URL
    - 未认证(401):渲染 `<Navigate to="/login" replace />`
    - 已认证:渲染 `<Outlet />`
  - `/login` 位于布局之外,保持公开
  - 不使用 `beforeLoad` 在服务端 `await` 相对 URL;认证检查只在客户端执行
- **Rejected alternatives**:
  - `beforeLoad` + `ensureQueryData` 无条件执行:SSR 阶段相对 URL 失败。
  - 服务端认证预取/server function:超出本次范围,且需要额外的后端地址配置。
  - 在根路由统一守卫:会把 `/login` 也拦住,需要额外排除逻辑。

### D11. 认证查询、登录与登出使用 TanStack Query

- **Context**:现有前端已统一 TanStack Query 与集中 query options。
- **Decision**:
  - 新增 `apps/web/src/queries/auth.ts`:
    - `authQueryOptions`:`queryKey: ["auth","me"]`,`queryFn` 调用 `request("/api/auth/me")`,`retry: false`,`throwOnError: false`,`staleTime: 0`
    - 认证门在 SSR 阶段不启用该查询(`enabled: typeof window !== "undefined"`),hydration 后再请求
  - 登录页使用 `useMutation` 调用 `POST /api/auth/login`(表单编码);成功后 `setQueryData(authQueryOptions.queryKey, user)` 并 `navigate({to:"/"})`;失败展示通用提示
  - 顶部导航使用 `useQuery(authQueryOptions)`;仅已登录显示登出按钮;登出 `useMutation` 调用 `POST /api/auth/logout`,成功后 `queryClient.clear()` 并 `navigate({to:"/login"})`
  - 已登录访问 `/login` 时重定向 `/`
- **Rejected alternatives**:
  - React Context 自管 auth:与现有 Query 缓存重复,且跨路由失效处理更复杂。
  - 在组件中直接 `fetch`:违反既有 `frontend-api-request` 规格。
  - 登录后 `invalidateQueries` 等待重新请求:多一次往返;直接写入返回值更直接,随后仍可后台校验。

### D12. 统一请求层增加同源凭据、CSRF 与表单编码

- **Context**:现有 `request` 只发送 JSON,缺少 cookie/CSRF 语义,无法完成登录与登出。
- **Decision**:
  - `fetch` 显式设置 `credentials: "same-origin"`
  - `body` 为 `URLSearchParams` 时按 `application/x-www-form-urlencoded` 发送;其余对象仍按 JSON 发送
  - 对 `POST/PUT/PATCH/DELETE` 读取 `XSRF-TOKEN` cookie 并设置 `X-XSRF-TOKEN`;缺失时先用原生 `fetch("/api/auth/me", { credentials: "same-origin" })` 触发 cookie,再重试一次
  - SSR 阶段(`typeof document === "undefined"`)跳过 cookie 读取与 CSRF 头,避免服务端访问浏览器 API
  - `401` 继续抛 typed `ApiError`,由 QueryClient 全局错误回调处理;登录 mutation 的 `401` 在页面本地处理
- **Rejected alternatives**:
  - axios/ky:与既有轻量 request 层重复,新增依赖无收益。
  - 不设置 CSRF 头并关闭校验:违反安全基线。
  - 在组件中手工拼 header:分散且容易漏。

### D13. 401 失效处理放在 QueryClient 全局回调

- **Context**:业务请求任意位置都可能返回 401;登录失败的 401 不应触发全局跳转。
- **Decision**:
  - `QueryCache.onError` 中识别 `ApiError.status === 401` 且 queryKey 不是 `["auth","me"]`:清理受保护查询缓存并 `invalidateQueries({ queryKey: ["auth","me"] })`
  - `AuthGate` 观察到 auth query 的 401 → 跳转 `/login`
  - `MutationCache.onError` 不把 401 当成通用错误;登录页自行展示 `INVALID_CREDENTIALS`
  - `401` 属于 4xx,沿用现有“不自动重试”策略
- **Rejected alternatives**:
  - 在 `request` 内直接 `window.location` 跳转:破坏 SPA 路由与测试。
  - 所有 401 都弹 toast:本次不引入 toast,且登录失败应由表单就地提示。
  - 不清理缓存:切换账号后可能短暂展示旧用户数据。

### D14. 测试策略:API 集成测试 + 人工 E2E

- **Context**:仓库已有 MockMvc 集成测试,无前端测试框架。
- **Decision**:
  - 新增 `spring-security-test` 测试依赖
  - 更新 `GreetingApiTest`:未认证 401;使用真实登录会话后 200;响应契约不变
  - 新增 `AuthApiTest`:登录成功/失败、`me`、登出、CSRF 失败、会话固定、未认证业务接口
  - 测试用户使用运行时随机密码 + `PasswordEncoder` 写入临时 SQLite;不使用演示密码
  - 前端以 `npm run build` + 人工 E2E 覆盖登录、跳转、刷新、登出与直接 URL
- **Rejected alternatives**:
  - 只使用 `@WithMockUser`:无法覆盖登录/登出/CSRF/会话 cookie;仍可作为局部授权测试补充。
  - 引入 Playwright/Cypress:超出当前仓库测试基线。
  - 依赖开发库测试:继续使用临时 SQLite 文件隔离。

### D15. 登录限流作为显式安全例外

- **Context**:`@rule:security-baseline` 要求暴露端点有速率限制或记录例外;当前仓库没有限流基础设施。
- **Decision**:本次不实现登录限流/失败锁定;使用统一失败文案降低账号枚举,并在 proposal/design/交付说明中记录例外与后续独立 change。
- **Rejected alternatives**:
  - 简单的内存计数器:单实例有效但多实例失效,且引入并发与清理逻辑,超出本次最小范围。
  - Bucket4j/网关限流:新增依赖与部署配置,当前无此基础。

## Risks / Trade-offs

- **SPA 登录前 CSRF token 获取** → 应用启动与登录页都会触发 `GET /api/auth/me`;`.spa()` 每次请求加载 token 并写 cookie;请求层在缺失时再补一次获取。
- **SSR 相对 URL** → 认证门仅在客户端执行;SSR 渲染中性加载态,避免服务端请求 `/api`。
- **安全过滤器与 MVC 错误结构漂移** → 共用 `ApiErrorCode` 与 `SecurityProblemWriter`;集成测试同时断言 401/403 的媒体类型与 `code`。
- **现有测试全部失败** → 先加入测试用户与登录辅助,再逐个更新断言;不放宽原有成功路径断言。
- **`routeTree.gen.ts` 手工修改风险** → 新路由由 TanStack dev/build 生成,不手改生成文件。
- **测试账号凭据** → 迁移不注入账号;账号由 `scripts/seed-users.mjs` 幂等写入且只存 BCrypt 哈希;自动化测试使用运行时生成密码。
- **单实例内存会话** → 重启后会话丢失,符合当前本地应用预期;多实例需求另行设计。
- **登录限流缺失** → 已知安全例外,统一失败文案;后续独立 change 增加限流/锁定。
- **Cookie `Secure` 未开启** → 仅本地 HTTP 开发;生产部署必须启用 HTTPS/`Secure`,不在本次范围。

## Migration Plan

1. 后端依赖与配置:加入 Spring Security、会话 cookie/超时配置
2. 新增 `V2__create_app_user.sql`(仅建表)、`scripts/seed-users.mjs`、实体、仓库、`UserDetailsService`、密码编码器
3. 新增 `SecurityConfig`:授权规则、form login、logout、CSRF SPA、会话固定、错误处理器
4. 新增 `AuthController` 与安全错误码/写入器
5. 更新现有后端测试并新增认证/CSRF/登出测试
6. 前端请求层:同源凭据、CSRF、表单编码、401 处理
7. 前端 auth query、登录页、受保护布局、导航登出
8. 重新生成路由树并执行前端构建
9. 人工 E2E:未登录跳转、登录、刷新、登出、直接 API 401、CSRF
10. 更新架构/外部依赖/运行文档与 `alignment-self-check`、`dov-ac-review`、`consistency-lint`

回滚:代码回退即可;`app_user` 为新增表,Flyway 迁移可保留,不影响既有 `greeting` 链路。若必须回滚数据库,删除 `app_user` 表并回退 Flyway 历史需人工确认。

## Open Questions

- 无阻塞问题。
- 非阻塞后续项:登录限流/锁定、记住我、多实例会话、登录后回跳原页面、前端自动化测试运行器;均已在 REQ-003 标记 deferred。
