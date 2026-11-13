---
id: kb.architecture.overview
title: Pawtrip architecture overview
area: architecture
---

# Pawtrip 架构概览

## 仓库结构

```text
pawtrip/
├─ apps/
│  ├─ web/      frontend: npm repo
│  └─ server/   backend: maven repo
└─ package.json npm workspace
```

## 技术栈

### 前端（apps/web）

- Vite 8、React 19、TanStack Router / Start、Tailwind CSS 4
- shadcn/ui

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080
- 数据访问：Spring Data JPA + Hibernate 社区 SQLite 方言（`org.hibernate.community.dialect.SQLiteDialect`）
- schema 管理：Flyway 12.4.0；JPA `ddl-auto=none`，不自动建表或改表
- 数据库：SQLite 文件 `apps/server/data/pawtrip.db`，由 Flyway 迁移建表（`V1` 问候语、`V2` 用户表）；测试账号由种子脚本按需注入
- 数据库文件属于本地运行产物，已由 `.gitignore` 排除

## 运行拓扑

```text
Browser (http://localhost:3000)
   │  GET /api/greeting
   ▼
Vite dev server ── /api proxy ──▶ Spring Boot (http://localhost:8080)
                                      │
                                      ▼
                              SQLite apps/server/data/pawtrip.db
```

## 数据与接口

- `greeting` 表：`id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`；当前单条记录由迁移写入。
- `GET /api/greeting`：需登录；通过 `GreetingRepository.findFirstByOrderByIdAsc()` 读取单条问候语，返回 `200` + `application/json` + `{"message":"Hello World"}`；未登录返回 `401 UNAUTHENTICATED`。
- 首页通过 TanStack Query 在客户端请求同源 `/api/greeting`，仅展示响应中的 `message`，不在前端硬编码文案。
- 错误响应统一为 RFC 9457 Problem Details（`application/problem+json`），并扩展稳定字段 `code`；成功响应不套统一 envelope。

## 认证与授权

- 登录方式：Spring Security 表单登录（`formLogin`），登录处理地址 `POST /api/auth/login`，使用服务端会话 `JSESSIONID`；不使用 JWT，也不在前端存储认证令牌。
- 账号来源：数据库 `app_user` 表（`username` 唯一、`password_hash` 为 BCrypt 哈希、`enabled` 控制启用）。Flyway `V2__create_app_user.sql` 仅建表，不注入账号；本地/测试账号由 `npm run seed:users`（`scripts/seed-users.mjs`）以 bcrypt cost 10 哈希后幂等写入。
- 会话：`server.servlet.session.timeout=30m`；会话 cookie 为 `HttpOnly`、`SameSite=Lax`；登录成功后通过 `changeSessionId()` 更换会话 ID 防止会话固定。
- 授权规则：`/api/auth/login|me|logout`、`/error` 与 ERROR dispatch 放行；`/api/**` 需认证；其余请求 `denyAll`。
- 认证接口：`GET /api/auth/me` 返回当前用户名；`POST /api/auth/logout` 成功后返回 `204`。
- CSRF：启用 `csrf.spa()` 与 `CookieCsrfTokenRepository`，服务端通过 `CsrfCookieFilter` 下发可读的 `XSRF-TOKEN` cookie；前端对非安全方法回传 `X-XSRF-TOKEN` 头。
- 错误语义：安全过滤链中的未认证/拒绝访问与 MVC 层输出相同 Problem Details（`application/problem+json` + 稳定 `code`），不会返回 HTML 登录页或 `302`；未认证为 `401 UNAUTHENTICATED`，CSRF/权限不足为 `403 ACCESS_DENIED`，登录失败为 `401 INVALID_CREDENTIALS`，响应不区分用户名是否存在。
- 日志：登录失败与异常日志不记录密码、哈希或会话 ID。

### 前端认证

- 认证状态由 `apps/web/src/queries/auth.ts` 的 `authQueryOptions`（query key `["auth","me"]`）统一管理，仅在客户端启用（SSR 阶段不取数）。
- `apps/web/src/routes/_authenticated.tsx` 是 pathless 受保护布局，`/` 与 `/about` 位于其下；未登录或 `401` 时跳转 `/login`，已登录渲染 `<Outlet />`。
- 登录页 `/login` 使用表单编码提交；成功后将当前用户写入 auth query 缓存并跳转 `/`；已登录访问 `/login` 时跳回 `/`。
- 顶部导航仅在已登录时显示“退出登录”；登出成功后清空 Query 缓存并跳转 `/login`。
- `QueryCache.onError` 对非 auth query 的 `401` 清理受保护缓存并使 auth query 失效，从而触发守卫跳转；登录失败自身的 `401` 不触发全局跳转。
- 请求层显式使用 `credentials: "same-origin"`，从 `XSRF-TOKEN` cookie 读取令牌并写入 `X-XSRF-TOKEN` 请求头；SSR 阶段跳过浏览器 cookie 读取。

## 实现约定

### 后端数据访问

- 关系型数据访问统一使用 Spring Data JPA 仓库；简单查询优先使用派生查询或 JPQL。
- 控制器与服务层不直接使用 `JdbcTemplate` 手写 SQL；原生 SQL 仅在派生查询/JPQL 无法表达时使用，并在代码或变更记录中说明原因。
- schema 由 Flyway 管理，JPA 不执行自动 DDL。

### 后端错误处理

- 业务异常继承 `ApiException` 并携带 `ApiErrorCode`（HTTP 状态、稳定 code、英文 title）。
- `GlobalExceptionHandler` 统一映射领域异常、校验异常与未捕获异常，输出 Problem Details：`type`、`title`、`status`、`detail`、`instance` 与扩展字段 `code`。
- `detail` 使用英文、偏技术化描述，供开发者与错误页展示；不承担面向终端用户的本地化文案职责。
- 未捕获异常记录服务端错误日志并返回 `500` + `INTERNAL_ERROR`，不向客户端泄露堆栈或内部细节。
- `spring.mvc.problemdetails.enabled=true`，框架内建异常也走同一 Problem Details 格式。

### 前端服务端状态

- 服务端数据统一使用 TanStack Query 获取与缓存；`QueryClient` 在 `getRouter` 内按请求创建，并通过 `setupRouterSsrQueryIntegration` 接入 router context。
- query key 与 query function 集中定义在 `apps/web/src/queries/`；页面组件使用 `useQuery`，不使用 `useEffect` + `fetch` 自行管理请求状态。
- 依赖 Vite `/api` 代理的相对 URL 接口保持客户端取数，不在 SSR loader 中直接请求。

### 前端请求与错误呈现

- 所有接口调用经过 `apps/web/src/lib/http/request.ts`：统一 JSON headers、超时与 `AbortSignal`、Problem Details 解析，并把非 2xx 响应转换为 typed `ApiError`。页面与 query 函数不直接调用 `fetch`。
- `ApiError` 暴露 `status`、稳定 `code`、`detail`、`instance` 与 `isRetryable`；网络错误与超时映射为可重试错误。
- QueryClient 默认 `staleTime=30s`；仅对可重试错误（网络错误与 5xx）重试，最多 2 次；4xx 不重试。
- 首次加载失败通过 `throwOnError` 进入根路由 `errorComponent`，展示 `ApiError.detail` 并提供重试；后台刷新失败保留缓存数据，仅由 `QueryCache`/`MutationCache` 的 `onError` 记录日志，不替换页面。
- 未匹配路由由根路由 `notFoundComponent` 呈现；不引入 toast、成功响应 envelope 或 `detail` 到中文文案的 i18n 映射。

## 测试与验证

- 后端：`cd apps/server && ./mvnw test`，包含使用临时 SQLite 文件的接口验收测试与错误路径测试。认证 E2E 前先运行根目录 `npm run seed:users` 注入本地测试账号。
- 前端：根目录 `npm run build`。
- 端到端：冷启动后端后确认数据库文件与接口，再启动前端确认首页展示；已覆盖首次加载失败、后台刷新失败与未知路由，CORS 不在当前范围。
- 