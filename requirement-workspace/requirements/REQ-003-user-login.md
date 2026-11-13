---
id: REQ-003
title: 用户登录与会话保护
status: in-analysis
discovery: Go (2026-11-14)
impact: ../analysis/REQ-003/impact-brief.md
sources:
  - apps/server/pom.xml
  - apps/server/src/main/resources/application.yml
  - apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java
  - apps/server/src/main/java/com/pawtrip/server/error/GlobalExceptionHandler.java
  - apps/server/src/test/java/com/pawtrip/server/greeting/GreetingApiTest.java
  - apps/web/src/router.tsx
  - apps/web/src/routes/__root.tsx
  - apps/web/src/components/Header.tsx
  - apps/web/src/lib/http/request.ts
  - apps/web/src/lib/query-client.ts
  - apps/web/src/queries/greeting.ts
  - openspec/specs/greeting/spec.md
  - openspec/specs/home-page/spec.md
  - openspec/specs/backend-error-handling/spec.md
  - openspec/specs/frontend-api-request/spec.md
  - docs/knowledge/rules/security/security-baseline.md
  - docs/knowledge/rules/security/no-hardcoded-secrets.md
---

# REQ-003: 用户登录与会话保护

## Discovery Decision

Go — 当前仓库没有账号体系，`/api/**` 与所有前端页面均完全公开。需求方要求引入最小用户登录：Spring Security 服务端会话 cookie、保护全部业务接口、前端未登录跳转 `/login`、登录成功进入现有首页 `/`、顶部导航新增登出按钮。能力边界清晰，与既有 `greeting`、`home-page`、`backend-error-handling`、`frontend-api-request` 规格存在需要显式修改的前置条件（2026-11-14）。

## 六字段

1. **id**:REQ-003
2. **statement**:为 PawTrip 增加基于 Spring Security 服务端会话（`JSESSIONID` cookie）的用户登录能力：所有业务 API 在未认证时返回 `401` Problem Details；前端所有非 `/login` 页面在未登录时跳转 `/login`，登录成功后进入现有首页 `/`；顶部导航在已登录时显示登出按钮，登出后会话失效并回到 `/login`。
3. **actors**:
   - 未登录访客:访问页面被引导到 `/login`;直接调用业务 API 得到 `401`
   - 已登录用户:登录后访问首页与业务接口;通过顶部导航登出
   - 前端应用 `apps/web`:承载登录页、路由守卫、认证状态与登出交互
   - 后端应用 `apps/server`:校验凭据、保存服务端会话、保护 `/api/**`、返回统一错误
   - 开发者 / 运维:维护账号种子、会话与安全配置
4. **rationale**:业务接口当前无任何身份边界。引入最小登录与会话能力，为后续个性化、用户数据与权限功能提供可信身份基础，同时把会话、CSRF 与错误契约纳入既有 Problem Details 规范。
5. **acceptance hints**:
   - 新增 `app_user` 表；迁移不注入账号，本地/测试账号由 `scripts/seed-users.mjs` 注入，数据库中只存 BCrypt 哈希
   - 后端引入 `spring-boot-starter-security`；服务端会话使用 `JSESSIONID` cookie，不使用 JWT 或前端存储令牌
   - `GET /api/greeting` 等全部 `/api/**` 业务接口在未登录时返回 `401` + `application/problem+json` + `code=UNAUTHENTICATED`，不返回 HTML 重定向
   - `POST /api/auth/login` 接受用户名/密码表单编码；成功返回 `200`、当前用户名并建立会话；失败返回 `401` + `code=INVALID_CREDENTIALS`，不区分用户名不存在或密码错误
   - `GET /api/auth/me` 已登录返回 `200` + 当前用户名；未登录返回 `401` + `code=UNAUTHENTICATED`
   - `POST /api/auth/logout` 成功后返回 `204`，会话失效；使用旧 cookie 访问业务 API 返回 `401`
   - 启用 CSRF 保护，使用 `XSRF-TOKEN` cookie 与 `X-XSRF-TOKEN` 请求头；登录、登出等非安全方法缺少或使用无效 token 时返回 `403` + `code=ACCESS_DENIED`
   - 登录后执行会话固定保护（`changeSessionId`）；会话默认 30 分钟超时；会话 cookie 为 `HttpOnly`、`SameSite=Lax`
   - 前端新增 `/login` 页面；未登录访问 `/`、`/about` 及其他页面均重定向到 `/login`；登录成功跳转 `/`
   - 顶部导航仅在已登录时显示“退出登录”；登出成功后清理认证缓存并跳转 `/login`
   - 已登录时 `GET /api/greeting` 的路径、状态码与响应体保持不变
   - 现有后端测试更新为带认证通过；新增未认证、登录失败、登出、CSRF 与 `me` 接口测试；前端构建通过
6. **links to evidence**:
   - 现有后端入口与接口:`apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java`
   - 现有错误契约:`apps/server/src/main/java/com/pawtrip/server/error/GlobalExceptionHandler.java`、`openspec/specs/backend-error-handling/spec.md`
   - 现有前端请求与路由:`apps/web/src/lib/http/request.ts`、`apps/web/src/router.tsx`、`apps/web/src/components/Header.tsx`
   - Living Spec:`openspec/specs/greeting/spec.md`、`openspec/specs/home-page/spec.md`、`openspec/specs/frontend-api-request/spec.md`
   - Spring Boot 4.1.2 BOM 管理 Spring Security `7.1.2`（2026-11-14 通过 `./mvnw help:evaluate` 确认）
   - Spring Security 7.1 官方文档:CSRF 与 SPA 配置（`csrf.spa()`）、会话管理、会话固定、登出、表单登录
   - TanStack Router 官方文档:Authenticated Routes（`beforeLoad` + `redirect`）
   - 安全规则:`@rule:security-baseline`、`@rule:no-hardcoded-secrets`、`@rule:java-security`
   - 2026-11-14 需求方决策:账号来自数据库用户表 + 种子账号；登录成功进入现有首页 `/`
   - 2026-11-14 需求方修订:账号不在 Flyway 迁移中注入,改由 `scripts/seed-users.mjs` 在测试/本地环境注入,脚本内定义账号与密码

## Ready 形状

### Intent

在不改变已登录用户首页正常路径的前提下，为前后端增加最小但完整可验证的会话登录闭环：数据库账号、Spring Security 服务端会话、登录/当前用户/登出接口、业务接口保护、前端登录页与路由守卫、顶部导航登出。安全边界采用 Spring Security 官方推荐配置，错误继续遵守既有 Problem Details 契约。

### Actors 与权限边界

- 未登录访客:只能访问 `/login` 与公开认证接口；不能读取任何业务数据
- 已登录用户:可访问全部业务页面与业务 API；无角色区分
- 前端 `apps/web`:负责页面引导与展示，不承担服务端授权
- 后端 `apps/server`:唯一的认证与授权边界；所有业务 API 必须经过 Spring Security
- 权限边界:本次只区分“已认证/未认证”，不引入角色、资源级权限或多租户

### In / Out Scope

**In**

- 新增 `app_user` 表、JPA 实体/仓库、`UserDetailsService` 与 BCrypt 密码校验
- 新增 `spring-boot-starter-security` 与服务端会话配置（`JSESSIONID`、30 分钟超时、`HttpOnly`、`SameSite=Lax`、会话固定保护）
- 新增 `POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/logout`
- 保护 `/api/**` 业务接口；未认证返回 `401` Problem Details
- 启用 CSRF 的 SPA 模式（`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header）
- 扩展错误码：`UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED`
- 前端新增 `/login` 页面、认证查询、路由守卫、全局 `401` 失效处理
- 顶部导航新增登出按钮（仅已登录可见）
- 更新受影响的 Living Spec 与现有测试

**Out**

- 注册、找回密码、修改密码、用户管理、账号禁用管理界面
- 角色/权限模型、资源级授权、多租户
- 记住我（remember-me）、OAuth2/SSO、MFA、Passkey
- 登录限流、失败锁定、审计日志与告警（在安全例外中记录）
- 多实例会话共享（Spring Session/JDBC）、分布式缓存
- 生产 HTTPS、`Secure` cookie、部署与反向代理配置
- 前端 SSR 阶段认证预取、登录后回跳原目标页面（固定回 `/`）
- 前端自动化组件测试框架或 E2E 运行器

### Scenarios + AC Hints

**S1 未登录访问业务 API**

- Given 浏览器或客户端没有有效会话
- When 请求 `GET /api/greeting`
- Then 返回 `401` 与 `Content-Type: application/problem+json`
- And 响应体包含 `status=401`、`code=UNAUTHENTICATED`、`instance=/api/greeting`
- And 不返回 HTML 登录页或 `302`

**S2 使用正确凭据登录**

- Given `app_user` 中存在启用的账号
- When `POST /api/auth/login` 提交正确的 `username` 与 `password`（表单编码，并携带有效 CSRF token）
- Then 返回 `200`，响应体包含当前用户名
- And 响应设置 `JSESSIONID` cookie
- And 后续携带该 cookie 的 `GET /api/greeting` 返回 `200`

**S3 使用错误凭据登录**

- Given 账号存在或不存在
- When `POST /api/auth/login` 提交错误凭据
- Then 返回 `401` 与 `code=INVALID_CREDENTIALS`
- And 不建立已认证会话
- And 响应不透露用户名是否存在

**S4 查询当前用户**

- Given 已登录 / 未登录
- When 请求 `GET /api/auth/me`
- Then 已登录返回 `200` 与 `{"username":"<name>"}`
- And 未登录返回 `401` 与 `code=UNAUTHENTICATED`

**S5 登出**

- Given 用户已登录并持有有效会话
- When 携带有效 CSRF token 请求 `POST /api/auth/logout`
- Then 返回 `204`
- And 服务端会话失效
- And 使用旧会话访问 `GET /api/greeting` 返回 `401`

**S6 CSRF 保护**

- Given 用户已登录
- When 对 `POST /api/auth/logout`（或其他非安全方法）缺少或使用无效 `X-XSRF-TOKEN`
- Then 返回 `403` 与 `code=ACCESS_DENIED`
- And 不执行状态变更

**S7 未登录页面跳转**

- Given 浏览器未登录
- When 直接访问 `/`、`/about` 或任意非 `/login` 页面
- Then 前端跳转到 `/login`
- And 不展示需要认证的业务页面内容

**S8 登录成功页面跳转**

- Given 用户在 `/login` 输入有效凭据
- When 登录成功
- Then 前端跳转到 `/`
- And 首页在已登录会话下展示问候语

**S9 顶部导航登出**

- Given 用户已登录并停留在业务页面
- When 点击顶部导航“退出登录”
- Then 前端调用登出接口并清理认证缓存
- And 跳转到 `/login`
- And 顶部导航不再显示登出按钮

**S10 已登录接口契约不回归**

- Given 用户已登录
- When 请求 `GET /api/greeting`
- Then 返回 `200`、`Content-Type: application/json` 与 `{"message":"Hello World"}`
- And 响应结构不新增 envelope

**S11 会话固定保护**

- Given 用户在登录前已持有匿名会话
- When 登录成功
- Then 服务端更换会话 ID
- And 旧会话 ID 不能继续访问业务 API

**Boundary**:注册、找回密码、角色、限流、记住我、多实例会话与生产 TLS 不在本次验收范围。

### Constraints

- 技术栈:Spring Boot 4.1.2 / Java 21 / Spring Security 7.1.2 / SQLite / Flyway；TanStack Start / React 19 / TanStack Query / TanStack Router
- 认证方式限定为服务端 HTTP Session + `JSESSIONID` cookie；不得使用 JWT、localStorage/sessionStorage 令牌
- 密码存储使用 BCrypt；不得提交明文密码
- Spring Security 配置优先使用官方推荐：`csrf.spa()`、`formLogin`、`logout`、`sessionManagement`
- 错误响应保持 RFC 9457 Problem Details，安全层（过滤器）与 MVC 层输出同一结构
- 登录失败信息不区分用户名不存在与密码错误
- 前端继续客户端取数；SSR 阶段不请求相对 URL
- 前端所有请求继续经过统一 `request` 层；不引入新的 HTTP 客户端
- 规格先行：实现前形成 OpenSpec change（@rule:spec-first）

### Context

REQ-001/REQ-002 已完成问候语全链路、TanStack Query 取数与统一 Problem Details。当前 `GET /api/greeting` 无认证即可访问，前端所有路由公开。本次在不改变已登录后首页展示行为的前提下，引入数据库账号、Spring Security 服务端会话、认证接口、业务接口保护与前端登录/登出闭环。现有 `greeting`、`home-page`、`backend-error-handling`、`frontend-api-request` 规格需要补充认证前置条件或安全错误码。

### Affected Capabilities

- **ADDED** `backend-authentication`:数据库账号、Spring Security 服务端会话、登录/当前用户/登出接口、业务接口保护、CSRF 与会话安全
- **ADDED** `frontend-authentication`:登录页、认证查询、路由守卫、登出按钮与认证状态
- **MODIFIED** `backend-error-handling`:新增安全层 `401/403` 错误码与 Problem Details 输出
- **MODIFIED** `frontend-api-request`:请求携带同源凭据与 CSRF 头；`401` 触发认证失效
- **MODIFIED** `greeting`:业务接口增加“已认证”前置条件
- **MODIFIED** `home-page`:未登录访问首页跳转 `/login`

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 账号从哪里来，是否包含注册? | Product / SA | Confirmed(2026-11-14):新增数据库用户表 + 种子账号;不做注册与用户管理 |
| blocking | resolved | 登录成功进入哪个欢迎页? | Product | Confirmed(2026-11-14):现有首页 `/` |
| blocking | resolved | 登录接口使用 JSON 还是表单编码? | Dev | Confirmed:使用 Spring Security `formLogin` 的 `application/x-www-form-urlencoded`，成功/失败处理器返回 JSON;复用框架的会话固定与 CSRF 策略，不自研认证 |
| blocking | resolved | 会话与 CSRF 方案? | SA / Dev | Confirmed:服务端 `HttpSession` + `JSESSIONID`;`csrf.spa()` 提供 `XSRF-TOKEN` cookie 与 `X-XSRF-TOKEN` header;不使用 JWT/localStorage |
| blocking | resolved | 业务接口未认证时返回什么? | SA / Dev | Confirmed:401 Problem Details `UNAUTHENTICATED`，不重定向 HTML |
| blocking | resolved | 种子账号凭据如何提供? | Dev / Security | Confirmed(2026-11-14 修订):迁移不注入账号;`scripts/seed-users.mjs` 内定义本地/测试账号与密码并生成 BCrypt 哈希写入;生产代码与迁移不含明文密码 |
| non-blocking | deferred | 是否增加登录失败限流/账号锁定? | Dev / Security | 后续解决;本次在安全例外中记录（无登录限流基础设施） |
| non-blocking | deferred | 是否支持记住我? | Product | 后续解决;本次会话 30 分钟超时 |
| non-blocking | deferred | 是否多实例共享会话? | Dev / Ops | 后续解决;当前单实例内存会话 |
| non-blocking | deferred | 是否登录后回跳原目标页? | Product | 后续解决;本次固定回 `/` |
| non-blocking | deferred | 是否引入前端测试框架/E2E 运行器? | QA / Dev | 后续解决;本次沿用人工 E2E + 后端集成测试 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| WARNING | resolved | `openspec/specs/greeting/spec.md` | 现有“查询问候语”场景默认未认证可访问,登录后不再成立 | 在 Delta Spec 中为 `greeting` 增加已认证前置条件,保留已登录时响应契约 |
| WARNING | resolved | `openspec/specs/home-page/spec.md` | 现有“访客打开首页”场景与未登录跳转冲突 | 在 Delta Spec 中修改为未登录跳转 `/login`、已登录展示问候语 |
| WARNING | resolved | `openspec/specs/backend-error-handling/spec.md` | 现有错误码不含 `401/403` 安全层错误 | 在 Delta Spec 中新增 `UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED` 与安全层输出要求 |
| WARNING | resolved | `openspec/specs/frontend-api-request/spec.md` | 现有 request 层未定义凭据与 CSRF 头,也未定义 `401` 全局失效 | 在 Delta Spec 中新增同源凭据、CSRF 头与 `401` 认证失效要求 |
| WARNING | resolved | `apps/server` 测试 | 现有接口测试未携带认证,改造后会返回 401 | 更新为带认证断言,并新增未认证/登录/登出/CSRF 测试 |
| WARNING | resolved | 安全基线 | 登录接口没有限流基础设施 | 在 proposal/design 中记录例外与残留风险,后续独立 change 处理 |
| SUGGESTION | resolved | `apps/web/src/components/Header.tsx` | 登出按钮需要认证状态,当前 Header 无数据依赖 | 在 `frontend-authentication` 中定义 Header 读取 auth query,仅已登录渲染按钮 |

BLOCKER 数:0。

## Evidence / Verification Notes

- 后端当前无 Spring Security 依赖:`apps/server/pom.xml`
- 业务接口当前公开:`apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java`
- 现有错误契约:`apps/server/src/main/java/com/pawtrip/server/error/`、`openspec/specs/backend-error-handling/spec.md`
- 前端路由无守卫:`apps/web/src/router.tsx`、`apps/web/src/routes/__root.tsx`
- 顶部导航无登出:`apps/web/src/components/Header.tsx`
- 统一请求层:`apps/web/src/lib/http/request.ts`
- Spring Security 版本:通过 `apps/server` 下 `./mvnw -q help:evaluate -Dexpression=spring-security.version -DforceStdout` 得到 `7.1.2`
- 官方文档:
  - CSRF SPA:`https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html`（`csrf.spa()`，Spring Security 7.0+）
  - Session Management:`https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html`
  - Logout:`https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html`
  - Form Login:`https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html`
  - TanStack Router Authenticated Routes:`https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes`
