## Why

当前 PawTrip 的 `/api/**` 与全部前端页面完全公开，没有任何身份边界。引入最小用户登录与会话能力，既满足“未登录不可访问业务数据”的当前需求，也为后续个性化功能提供可信身份基础。

上游需求:[REQ-003](../../../requirement-workspace/requirements/REQ-003-user-login.md)
影响分析:[impact-brief.md](../../../requirement-workspace/analysis/REQ-003/impact-brief.md)

## What Changes

- 新增 `app_user` 表（迁移仅建表），账号由独立脚本 `scripts/seed-users.mjs` 注入且仅存 BCrypt 哈希；新增 JPA 实体、仓库与 `UserDetailsService`
- 后端引入 `spring-boot-starter-security`，使用服务端 `HttpSession` + `JSESSIONID` cookie；不使用 JWT 或前端存储令牌
- 新增认证接口：
  - `POST /api/auth/login`（表单编码）成功返回当前用户并建立会话，失败返回 `401 INVALID_CREDENTIALS`
  - `GET /api/auth/me` 返回当前用户，未登录返回 `401 UNAUTHENTICATED`
  - `POST /api/auth/logout` 使会话失效并返回 `204`
- 保护全部 `/api/**` 业务接口；未认证请求返回 `401 application/problem+json`，不返回 HTML 或重定向
- 启用 CSRF SPA 模式（`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header）；非安全方法缺少/无效 token 返回 `403 ACCESS_DENIED`
- 启用会话固定保护（`changeSessionId`）与 30 分钟会话超时；会话 cookie 使用 `HttpOnly`、`SameSite=Lax`
- 新增安全错误码 `UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED`，安全过滤器与 MVC 异常处理输出同一 Problem Details 结构
- 前端新增 `/login` 页面与认证查询；未登录访问任意非 `/login` 页面重定向 `/login`，登录成功跳转 `/`
- 前端顶部导航仅在已登录时显示“退出登录”；登出后清理认证缓存并跳转 `/login`
- 前端 `request` 层支持同源凭据、CSRF 头与表单编码；`401` 触发认证失效
- **BREAKING**: `/api/**` 业务接口现在要求已认证会话；现有未认证客户端会收到 `401`
- 保持已登录时 `GET /api/greeting` 的路径、状态码与响应体不变

## Capabilities

### New Capabilities

- `backend-authentication`: 数据库账号、Spring Security 服务端会话、登录/当前用户/登出接口、业务接口保护、CSRF 与会话安全。
- `frontend-authentication`: 登录页、认证查询、路由守卫、登出按钮与前端认证状态。

### Modified Capabilities

- `backend-error-handling`: 以新增要求方式扩展安全层 `401/403` 错误码与 Problem Details 输出。
- `frontend-api-request`: 以新增要求方式扩展同源凭据、CSRF 头与 `401` 认证失效。
- `greeting`: 问候语查询接口增加“已认证会话”前置条件，已登录时响应契约不变。
- `home-page`: 未登录访问首页跳转 `/login`，已登录时继续展示问候语。

## Impact

- **代码**:
  - `apps/server/pom.xml`、`application.yml`:Spring Security 依赖、会话 cookie 与超时配置
  - 新增 `apps/server/src/main/resources/db/migration/V2__create_app_user.sql`（仅建表）
  - 新增 `scripts/seed-users.mjs`（测试账号注入，`npm run seed:users`）
  - 新增后端安全配置、账号实体/仓库/`UserDetailsService`、认证控制器、安全错误写入器
  - 更新 `GlobalExceptionHandler`、`ApiErrorCode` 与现有接口测试
  - `apps/web/src/lib/http/request.ts`、`lib/query-client.ts`:CSRF、凭据与 401 失效
  - 新增 `apps/web/src/queries/auth.ts`、`routes/login.tsx`、受保护布局/守卫
  - 更新 `apps/web/src/components/Header.tsx`、`routes/__root.tsx`、`router.tsx`
- **依赖**:`spring-boot-starter-security`、`spring-security-test`（测试）；不新增前端 HTTP 客户端
- **数据**:新增 `app_user` 表；测试账号由种子脚本按需注入；`greeting` 表与数据不变
- **文档 / KB**:更新架构、外部依赖与运行说明；不记录明文密码
- **上游 / 下游**:上游 REQ-003；下游为后续用户数据与权限功能
- **风险**:现有测试需全部带认证；安全过滤器错误输出需与 MVC 一致；SPA CSRF 与 SSR 相对 URL 需按官方方式实现；登录限流为已知例外

## Non-Goals

- 注册、找回密码、修改密码、用户管理、账号禁用管理界面
- 角色/权限模型、资源级授权、多租户
- 记住我、OAuth2/SSO、MFA、Passkey
- 登录限流、失败锁定、审计日志与告警（在安全例外中记录）
- 多实例会话共享、Spring Session/JDBC、分布式缓存
- 生产 HTTPS、`Secure` cookie、部署与反向代理配置
- SSR 阶段认证预取、登录后回跳原目标页（固定回 `/`）
- 前端自动化组件测试框架或 E2E 运行器

## Spec ID

- REQ-003 · change `add-user-login`(2026-11-14)
