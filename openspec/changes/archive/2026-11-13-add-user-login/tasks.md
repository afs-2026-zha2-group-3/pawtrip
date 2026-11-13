> 关联:[design.md](design.md) · [atdd-design.md](atdd-design.md) · Delta Spec:[backend-authentication](specs/backend-authentication/spec.md) / [frontend-authentication](specs/frontend-authentication/spec.md) / [backend-error-handling](specs/backend-error-handling/spec.md) / [frontend-api-request](specs/frontend-api-request/spec.md) / [greeting](specs/greeting/spec.md) / [home-page](specs/home-page/spec.md)
>
> 负责人:**Dev**=实现负责人;**QA**=验收核对。

## 1. 后端:依赖、会话配置与数据库(Dev)

- [x] 1.1 `apps/server/pom.xml` 增加 `spring-boot-starter-security`;测试 scope 增加 `spring-security-test`
- [x] 1.2 `application.yml` 增加 `server.servlet.session.timeout=30m`、cookie `http-only=true`、`same-site=lax`、`secure=false`
- [x] 1.3 新增 `V2__create_app_user.sql`:仅创建 `app_user(id, username UNIQUE, password_hash, enabled)`,不写入账号
- [x] 1.4 新增 `scripts/seed-users.mjs`:脚本内定义测试账号与密码,使用 bcrypt(cost 10)生成哈希并幂等 upsert;支持指定数据库路径
- [x] 1.5 启动后端确认 Flyway 执行 V2 且 `app_user` 为空;运行 `npm run seed:users` 后账号存在,`greeting` 表未受影响

## 2. 后端:账号模型与 UserDetails(Dev)

- [x] 2.1 新增 `AppUser` 实体映射 `app_user`,ID 使用 `GenerationType.IDENTITY`
- [x] 2.2 新增 `AppUserRepository extends JpaRepository<AppUser, Long>`,提供 `findByUsername(String)`
- [x] 2.3 新增 `AppUserDetailsService implements UserDetailsService`,将 `username`、`password_hash`、`enabled` 映射为 `UserDetails`
- [x] 2.4 新增 `BCryptPasswordEncoder` bean;不引入明文密码或 `{noop}` 编码

## 3. 后端:Security 配置与认证接口(Dev)

- [x] 3.1 新增 `SecurityConfig`:`csrf(csrf -> csrf.spa())`、`formLogin` 使用 `/api/auth/login`、`logout` 使用 `/api/auth/logout`、关闭 `httpBasic`/`rememberMe`
- [x] 3.2 配置授权规则:`/api/auth/login|me|logout`、`/error` 与 ERROR dispatch 放行;`/api/**` 需认证;其余 `denyAll`
- [x] 3.3 配置会话:`sessionFixation().changeSessionId()`、`requestCache().disable()`;确认未认证请求不创建 session
- [x] 3.4 新增 JSON 登录成功/失败处理器:成功返回当前用户名,失败返回 `401 INVALID_CREDENTIALS`
- [x] 3.5 新增 `SecurityProblemWriter`、`AuthenticationEntryPoint`、`AccessDeniedHandler`、登出 204 处理器;媒体类型 `application/problem+json`
- [x] 3.6 `ApiErrorCode` 增加 `UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED`;新增 `UnauthenticatedException`
- [x] 3.7 新增 `AuthController` 的 `GET /api/auth/me`:已登录返回用户名,未登录抛出 `UnauthenticatedException`
- [x] 3.8 确认登录响应设置 `JSESSIONID`,`HttpOnly`、`SameSite=Lax`;登录后会话 ID 发生更换

## 4. 后端:测试更新与新增(Dev;QA 核对)

- [x] 4.1 更新 `GreetingApiTest`:未认证 `GET /api/greeting` 返回 `401 UNAUTHENTICATED`;使用真实登录会话后返回原 `200` 契约
- [x] 4.2 新增 `AuthApiTest`:正确凭据登录成功、错误凭据 `401 INVALID_CREDENTIALS`、`me` 已登录/未登录、登出 `204` 与会话失效
- [x] 4.3 新增 CSRF 测试:非安全方法缺少/无效 token 返回 `403 ACCESS_DENIED`;携带有效 token 通过
- [x] 4.4 新增会话固定测试:登录前后会话 ID 不同,旧会话不能访问业务 API
- [x] 4.5 测试用户使用运行时随机密码 + `PasswordEncoder` 写入临时 SQLite;不在测试代码硬编码密码
- [x] 4.6 运行 `cd apps/server && ./mvnw test`,确认全部测试通过且原有成功路径断言未放宽

## 5. 前端:统一请求层(Dev)

- [x] 5.1 `request.ts` 显式设置 `credentials: "same-origin"`,保持现有超时/取消/Problem Details 解析
- [x] 5.2 支持 `URLSearchParams` 表单编码请求体,用于登录
- [x] 5.3 对 `POST/PUT/PATCH/DELETE` 读取 `XSRF-TOKEN` 并发送 `X-XSRF-TOKEN`;缺失时先触发 `GET /api/auth/me` 再重试一次;SSR 阶段跳过浏览器 cookie 读取
- [x] 5.4 保持 `401` 为 typed `ApiError` 且不自动重试;确认 `ApiError.code` 可读取安全错误码

## 6. 前端:认证查询、登录页、守卫与登出(Dev)

- [x] 6.1 新增 `apps/web/src/queries/auth.ts`:`authQueryOptions`(`["auth","me"]`、`retry:false`、`throwOnError:false`),SSR 阶段不启用查询
- [x] 6.2 新增 `apps/web/src/routes/login.tsx`:用户名/密码表单、表单编码登录、成功跳 `/`、失败展示通用提示、已登录访问时跳 `/`
- [x] 6.3 新增 pathless 受保护布局 `_authenticated.tsx`,将 `/` 与 `/about` 移入;SSR 渲染加载态、未登录 `<Navigate to="/login" replace />`、已登录渲染 `<Outlet />`
- [x] 6.4 更新 `Header.tsx`:读取 auth query,仅已登录显示“退出登录”;登出成功后清理 Query 缓存并跳 `/login`
- [x] 6.5 `QueryCache.onError` 对非 auth query 的 `401` 清理受保护缓存并使 auth query 失效;登录失败的 `401` 不触发全局跳转
- [x] 6.6 重新生成 `routeTree.gen.ts`(通过 TanStack dev/build),不手工编辑生成文件
- [x] 6.7 运行根目录 `npm run build`,确认类型检查与构建通过

## 7. 验收:E2E 与反向验证(Dev;QA 核对)

- [x] 7.1 E2E-1:未登录访问 `/`、`/about`、刷新页面,均跳转 `/login` 且不显示问候语
- [x] 7.2 E2E-2:在 `/login` 使用种子脚本注入的账号登录成功,跳转 `/` 并显示 "Hello World";Network 中登录请求含 `X-XSRF-TOKEN`
- [x] 7.3 E2E-3:已登录刷新 `/` 保持登录;直接 curl `GET /api/greeting` 无 cookie 返回 `401 application/problem+json` + `UNAUTHENTICATED`
- [x] 7.4 E2E-4:点击顶部“退出登录”,跳转 `/login`;浏览器后退或直接访问 `/` 再次被拦截;旧会话访问 API 返回 401
- [x] 7.5 E2E-5:错误凭据登录停留在 `/login` 并显示通用提示;响应不含用户名是否存在
- [x] 7.6 反向验证:浏览器存储中无认证令牌;生产代码无 `localStorage` 认证、无 JWT、无明文密码;`greeting` 表与已登录成功响应结构未变
- [x] 7.7 安全基线复核:CSRF 已启用、会话 cookie `HttpOnly`/`SameSite=Lax`、错误响应无堆栈/密码/哈希;登录限流例外已记录

## 8. 文档与 SDD 收口(Dev;QA 复核)

- [x] 8.1 更新 `docs/knowledge/architecture/README.md`:认证、会话、CSRF、前端守卫与 401 处理
- [x] 8.2 更新 `docs/knowledge/external/README.md`:Spring Security 7.1.2 官方文档来源;TanStack Router Authenticated Routes
- [x] 8.3 更新 `README.md`:登录启动说明、`npm run seed:users` 注入测试账号、数据库重置后的迁移与种子流程
- [x] 8.4 更新 `alignment-self-check.md`、`dov-ac-review.md`、`consistency-lint.md`,准备 G1 签核
- [x] 8.5 重新运行后端测试、前端构建与 `openspec validate add-user-login --strict`,记录本地验证证据
