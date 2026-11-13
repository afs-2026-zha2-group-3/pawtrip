## Why

REQ-001 已经打通 SQLite → Spring Boot → React 的最小链路,但后端仍在控制器里直接使用 `JdbcTemplate` 手写 SQL,前端仍在组件里用 `useEffect` + `fetch` 管理请求状态。为了让后续功能复用统一的数据访问与前端取数方式,需要在不改变接口和页面行为的前提下完成一次实现层改造。

上游需求:[REQ-002](../../../requirement-workspace/requirements/REQ-002-data-access-orm-and-query.md)
影响分析:[impact-brief.md](../../../requirement-workspace/analysis/REQ-002/impact-brief.md)

## What Changes

- 后端引入 Spring Data JPA 与 Hibernate 社区 SQLite 方言,新增 `Greeting` 实体和 `GreetingRepository`
- `GreetingController` 改为依赖仓库,移除 `JdbcTemplate` 与手写 `SELECT`;`GET /api/greeting` 契约不变
- 前端引入 `@tanstack/react-query` 与 `@tanstack/react-router-ssr-query`,在 `getRouter` 内创建 QueryClient 并接入 router context
- 首页改用集中定义的 query options + `useQuery`,移除 `useEffect` + `fetch`
- 后端新增全局异常处理,错误统一返回 RFC 9457 Problem Details,使用稳定 `code`;问候语不存在返回 `404`,未捕获异常返回 `500` 且不暴露堆栈
- 前端新增统一 `request` 层与 typed `ApiError`;4xx 不重试,网络错误/5xx 最多重试 2 次;`queryFn` 支持 `AbortSignal`
- 前端新增路由 `errorComponent` 与 `notFoundComponent`;首次加载失败可重试,后台刷新失败保留缓存数据并记录日志
- 新增后端错误路径测试与前端错误路径 E2E
- 同步更新架构知识,记录后端 JPA 仓库、Problem Details、前端 TanStack Query 与 request/error 约定
- 不改变 `greeting` 表结构、Flyway 迁移、接口正常路径响应或页面正常路径行为
- 无 **BREAKING** 变更

## Capabilities

### New Capabilities

- `backend-data-access`: 后端关系型数据访问统一使用 Spring Data JPA 仓库,简单查询避免裸 SQL;schema 继续由 Flyway 管理,`ddl-auto` 关闭。
- `frontend-data-fetching`: 前端服务端状态统一使用 TanStack Query,集中定义 query options,避免 `useEffect` + `fetch` 自行管理请求状态。
- `backend-error-handling`: 后端错误统一使用 RFC 9457 Problem Details、全局异常处理与稳定错误码;成功响应不套壳。
- `frontend-api-request`: 前端统一 request 层、typed `ApiError`、重试策略、取消与路由级错误呈现;不引入 toast。

### Modified Capabilities

- 无。既有 `greeting`、`home-page` 的可观察行为不变,不修改其行为规格。

## Non-Goals

- 不改变 `GET /api/greeting` 的路径、状态码、响应体或字段
- 不改变 `greeting` 表结构、Flyway 迁移版本或种子数据
- 不新增写接口、问候语管理 UI、多语言或用户权限
- 不引入成功响应统一 envelope
- 不引入 toast 通知、traceId / 请求 ID、错误码到中文文案的 i18n 映射
- 不做 SSR 预取 / server function 取数改造
- 不引入 TanStack Query Devtools、仓库层单测、Hibernate SQL 日志或 SQLite 写并发策略
- 不涉及部署、CI/CD 与跨域方案

## Impact

- **代码**:
  - `apps/server/pom.xml`、`application.yml`:新增 Spring Data JPA、Hibernate 社区方言与 JPA 配置
  - `apps/server/src/main/java/com/pawtrip/server/greeting/`:新增 `Greeting`、`GreetingRepository`,改造 `GreetingController`
  - `apps/web/package.json`、`router.tsx`、`routes/__root.tsx`、`routes/index.tsx`:接入 TanStack Query
  - 新增 `apps/web/src/queries/greeting.ts`
  - 后端新增全局异常处理、错误码与 Problem Details 映射;新增错误路径测试
  - 前端新增 `request` / `ApiError`、QueryClient 错误回调、根路由 `errorComponent` / `notFoundComponent`
- **依赖**:`spring-boot-starter-data-jpa`、`org.hibernate.orm:hibernate-community-dialects`、`@tanstack/react-query`、`@tanstack/react-router-ssr-query`;不新增 HTTP 客户端或 toast 依赖
- **数据**:SQLite 文件、`greeting` 表结构与种子数据不变
- **文档 / KB**:更新 `docs/knowledge/architecture/README.md`;补充外部依赖文档来源
- **上游 / 下游**:无外部系统;下游为首页与后续功能的数据访问实现
- **风险**:Hibernate 社区 SQLite 方言的复杂查询能力有限;TanStack Query SSR 集成需验证 peer 兼容性;前端继续保持客户端取数以规避 SSR 相对 URL 问题;错误契约需前后端保持一致,错误页需避免吞掉后台刷新错误
- **工作量**:M(约 1–1.5 人日,原 JPA/Query 改造已完成,新增错误处理与 request 层)

## Spec ID

- REQ-002 · change `refactor-data-access-and-query`(scope revision 2,2026-11-13)
