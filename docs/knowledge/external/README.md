---
id: kb.external.references
title: Pawtrip external dependencies and docs
area: external
---

# 三方依赖与外部文档

## Frontend

### Tanstack

Use the repository's installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `npm exec --no -- intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npm exec --no -- intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

### UI

#### shadcn/ui

- llm index: https://www.shadcn.com.cn/llms.txt
- local skill: [`.agents/skills/shadcn/SKILL.md`](../../../.agents/skills/shadcn/SKILL.md)

## Backend

### Spring Boot 4.1.2

- 依赖版本由 `spring-boot-dependencies:4.1.2` 统一管理。
- 文档:https://docs.spring.io/spring-boot/

### 地图集成：高德 Web 服务与 Spring REST Client

- 高德 POI 2.0：本项目使用 Web 服务 API 的关键词搜索 `/v5/place/text` 与周边搜索 `/v5/place/around`，均为 GET；高德要求服务端 Key，分页每页 1–25 条，同一查询最多获取 200 条。周边搜索未提供关键词和类型时，默认类型为餐饮、生活服务、商务住宅，默认半径为 5000 米。POI 详情的 `photos` 提供照片标题与来源 URL；地点管理后端持久化照片元数据和来源 URL，浏览器直接加载图片，不再由服务器下载或保存图片二进制。图片可用性依赖上游 URL。
- 高德路线规划 2.0：REQ-011 途内交通估算使用驾车 `/v5/direction/driving` 与步行 `/v5/direction/walking`（均 GET，带 `show_fields=cost` 与 `origin_id`/`destination_id`）；驾车取 `route.taxi_cost`（基础字段）与 `paths[0].cost.duration` 秒，步行仅取时长（费用 ¥0 为产品决策）；坐标「经度,纬度」≤6 位小数。驾车参数过长时官方要求改用 POST，因此共用传输层不应固化成 POI 专用动态代理。详细参数/返回字段见 [amap-route-planning.md](amap-route-planning.md)。
- Spring REST Clients：使用 Spring Framework `RestClient` 作为同步、可复用的 HTTP 客户端，不新增第三方客户端依赖；配置连接/读取超时，并在集成边界屏蔽含凭据 URL 和敏感查询参数的底层异常。
- 文档：
  - 高德搜索 POI 2.0：https://lbs.amap.com/api/webservice/guide/api-advanced/newpoisearch
  - 高德路线规划 2.0：https://lbs.amap.com/api/webservice/guide/api/newroute（本地核对条目：[amap-route-planning.md](amap-route-planning.md)）
  - Spring Framework REST Clients：https://docs.spring.io/spring-framework/reference/integration/rest-clients.html
  - Spring Boot Externalized Configuration：https://docs.spring.io/spring-boot/reference/features/external-config.html

### Spring Data JPA / Hibernate / Flyway / SQLite

- `spring-boot-starter-data-jpa`:引入 Spring Data JPA、Hibernate 与事务管理;Hibernate 版本由 Spring Boot BOM 管理(`7.4.13.Final`)。
- `org.hibernate.orm:hibernate-community-dialects`:提供 `org.hibernate.community.dialect.SQLiteDialect`,版本同样由 Spring Boot BOM 管理,无需显式写版本。
- `org.xerial:sqlite-jdbc`:版本由 Spring Boot 管理(`3.53.4.0`),驱动类 `org.sqlite.JDBC`。
- Flyway `12.4.0` 的 `flyway-core` 已注册 SQLite 支持,无需额外的 database 模块;schema 仍由 Flyway 管理,JPA `ddl-auto=none`。
- 迁移目录:`apps/server/src/main/resources/db/migration`;数据库文件:`apps/server/data/pawtrip.db`。
- 文档:
  - Spring Data JPA:https://docs.spring.io/spring-data/jpa/reference/
  - Hibernate 7.4:https://hibernate.org/orm/documentation/7.4/
  - hibernate-community-dialects:https://repo1.maven.org/maven2/org/hibernate/orm/hibernate-community-dialects/
  - Flyway:https://documentation.red-gate.com/flyway
  - SQLite JDBC:https://github.com/xerial/sqlite-jdbc

### Spring Security 7.1.2

- `spring-boot-starter-security` 版本由 Spring Boot BOM 管理（`7.1.2`）；测试使用 `spring-security-test`。
- 使用 `SecurityFilterChain` 配置 `formLogin`（`/api/auth/login`）、`logout`（`/api/auth/logout`）、`csrf(csrf -> csrf.spa())`、`sessionManagement().sessionFixation().changeSessionId()`，并禁用 `httpBasic` 与 `rememberMe`。
- SPA CSRF：`CookieCsrfTokenRepository` 配合 `CsrfCookieFilter` 在响应中下发可读的 `XSRF-TOKEN` cookie，前端以 `X-XSRF-TOKEN` 请求头回传。
- 安全层错误通过自定义 `AuthenticationEntryPoint` / `AccessDeniedHandler` 输出 Problem Details，而不是默认 HTML 页面或重定向。
- 文档：
  - Spring Security 参考：https://docs.spring.io/spring-security/reference/
  - SPA CSRF 配置：https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa
  - 会话管理与会话固定：https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html
  - 表单登录：https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html

### 本地账号种子脚本

- `scripts/seed-users.mjs` 使用 Node 24 内置 `node:sqlite`（`DatabaseSync`）访问开发库，并用根目录 devDependency `bcryptjs` 生成 cost 10 的 BCrypt 哈希后写入 `app_user`。
- 脚本通过 `ON CONFLICT(username)` 幂等 upsert；默认数据库为 `apps/server/data/pawtrip.db`，可用位置参数或 `SEED_DB` 指定其他路径。
- E2E 运行器通过 `SEED_E2E_WORKERS` 为每个 Playwright worker 额外生成 `petowner-wN` 账号（各两只宠物档案），使行程、宠物等用户级数据按 worker 隔离；该模式下脚本拒绝写入默认开发库。
- 文档：
  - bcryptjs:https://github.com/dcodeIO/bcrypt.js
  - Node `node:sqlite`:https://nodejs.org/api/sqlite.html

### 错误响应:Problem Details

- 错误响应采用 RFC 9457 Problem Details(`application/problem+json`),通过 Spring `ProblemDetail` 与 `ResponseEntityExceptionHandler` 输出,扩展稳定字段 `code`。
- 配置 `spring.mvc.problemdetails.enabled=true`,使框架内建异常使用同一格式。
- 文档:
  - RFC 9457:https://www.rfc-editor.org/rfc/rfc9457
  - Spring MVC Problem Details:https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html

### TanStack Router 认证路由

- 使用 pathless layout（`_authenticated.tsx`）包裹受保护页面；守卫在客户端读取 auth query，未登录跳转 `/login`。
- 认证查询仅在客户端启用，避免 SSR 阶段在没有浏览器会话上下文时取数导致误判。
- 文档：
  - Authenticated Routes：https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes
  - Pathless layouts：https://tanstack.com/router/latest/docs/framework/react/guide/route-trees#pathless-routes
  - Router navigation：https://tanstack.com/router/latest/docs/framework/react/guide/navigation

### TanStack Query

- `@tanstack/react-query`:服务端状态、缓存与请求生命周期管理。
- `@tanstack/react-router-ssr-query`:TanStack Start 的 SSR 集成,在 `getRouter` 内创建 `QueryClient` 并接入 router context。
- 约定:query key 与 query function 集中定义在 `apps/web/src/queries/`;页面组件使用 `useQuery`,不使用 `useEffect` + `fetch` 自行管理请求。
- 错误处理约定:HTTP 调用统一经过 `apps/web/src/lib/http/request.ts`,失败抛出 typed `ApiError`;QueryClient 只对网络错误与 5xx 重试(最多 2 次),`throwOnError` 把首次加载失败交给根路由 `errorComponent`,后台刷新失败保留缓存并由 `QueryCache.onError` 记录日志。
- 文档:
  - TanStack Query:https://tanstack.com/query/latest/docs/framework/react/overview
  - TanStack Start + Query:https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query
  - Query retries:https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
  - Query cancellation:https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
  - QueryCache / global error callbacks:https://tanstack.com/query/latest/docs/reference/QueryCache
  - `throwOnError`:https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
