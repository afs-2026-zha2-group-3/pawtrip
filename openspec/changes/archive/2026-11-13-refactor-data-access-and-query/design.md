## Context

REQ-001 的问候语链路当前由 `GreetingController` 直接使用 `JdbcTemplate` 查询,首页使用 `useEffect` + `fetch` 取数。G1 已通过的 Delta Spec 要求建立两项约定:

- `backend-data-access`:Spring Data JPA 仓库、简单查询避免裸 SQL、Flyway 管理 schema、SQLite 使用 Hibernate 社区方言
- `frontend-data-fetching`:TanStack Query、每请求 QueryClient、集中 query options、保持客户端取数边界

本设计只替换实现方式,不改变 `GET /api/greeting` 契约、数据库 schema 或页面可见行为。

## Goals / Non-Goals

**Goals:**

- 后端以 Spring Data JPA 仓库读取 `greeting`,移除 `JdbcTemplate` 与手写 SQL
- 前端以 TanStack Query 获取 `/api/greeting`,移除 `useEffect` + `fetch`
- 后端以 Problem Details 统一错误契约,前端以 `request` + typed `ApiError` 统一请求与错误
- 保持现有接口集成测试、错误路径测试与前端构建通过
- 为后续功能提供可复用的实体/仓库、query options 与错误处理模式

**Non-Goals:**

- 不改变接口路径、状态码、响应体或字段
- 不改变 `greeting` 表结构、Flyway 迁移或种子数据
- 不新增写接口、管理 UI、多语言、权限
- 不引入成功响应统一 envelope
- 不引入 toast 通知、traceId / 请求 ID、错误码到中文文案的 i18n 映射
- 不做 SSR 预取/server function 改造
- 不引入 TanStack Query Devtools、仓库层单测、Hibernate SQL 日志或 SQLite 写并发策略

## Decisions

### D1. 保留 SQLite,使用 Spring Data JPA + Hibernate 社区方言

- **Context**:Spring Data JDBC 官方方言列表不含 SQLite,直接使用会导致应用启动失败;Spring Data JPA 可通过 Hibernate 社区方言支持 SQLite。
- **Decision**:保留 SQLite;引入 `spring-boot-starter-data-jpa` 与 `org.hibernate.orm:hibernate-community-dialects`,配置 `spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect`。版本由 Spring Boot 4.1.2 BOM 管理(Hibernate `7.4.13.Final`)。
- **Rejected alternatives**:
  - Spring Data JDBC + 自定义 `JdbcDialect`:需要自行维护方言与 ID 生成行为,后续写入风险高。
  - Spring Data JDBC + H2:官方支持更好,但会破坏既有 SQLite 约束并改变本地数据文件。
  - JPA + 自定义 Hibernate 方言:社区方言已覆盖,重复造轮子。

### D2. 实体与仓库采用最小映射,查询使用派生方法

- **Context**:当前只有 `greeting(id, message)` 一张表和一次读取。
- **Decision**:新增 `Greeting` 实体映射既有表;`GreetingRepository extends JpaRepository<Greeting, Long>`,使用 `findFirstByOrderByIdAsc()` 派生查询。ID 使用 `GenerationType.IDENTITY`,为后续写入预留但不新增写接口。
- **Rejected alternatives**:
  - `findAll()` + 内存取首条:语义弱且多取数据。
  - `@Query` 手写 JPQL:当前查询可由方法名表达,无需 SQL。
  - 返回实体给控制器:会泄漏持久化模型,改用 `GreetingResponse(String message)` record。

### D3. Schema 仍由 Flyway 管理,JPA 不自动改表

- **Context**:SQLite 方言对 DDL 自动演进支持有限,现有 `V1__create_greeting.sql` 已是权威 schema。
- **Decision**:`spring.jpa.hibernate.ddl-auto=none`;Flyway 继续建表与种子;`spring.jpa.open-in-view=false` 避免请求级延迟加载。
- **Rejected alternatives**:
  - `ddl-auto=update`:会与 Flyway 争夺 schema 权威,且 SQLite 方言对 ALTER 支持有限。
  - `ddl-auto=validate`:SQLite 类型/约束校验易产生噪声,收益低。

### D4. 控制器返回显式 DTO,保持接口契约

- **Context**:现有接口返回 `Map<String,String>`,契约是 `{"message":"..."}`。
- **Decision**:控制器注入 `GreetingRepository`,使用派生查询,映射为 `record GreetingResponse(String message)`;路径与 JSON 字段保持不变。
- **Rejected alternatives**:
  - 继续返回 `Map`:缺少类型约束。
  - 直接序列化实体:暴露 `id` 等内部字段,改变契约。

### D5. TanStack Query 按 TanStack Start 官方方式接入

- **Context**:TanStack Start 需要每请求独立的 QueryClient,并处理 SSR 脱水/注水;官方提供 `@tanstack/react-router-ssr-query` 集成。
- **Decision**:在 `getRouter` 内创建 `QueryClient`,放入 router context;调用 `setupRouterSsrQueryIntegration({ router, queryClient })`;根路由改为 `createRootRouteWithContext<{ queryClient: QueryClient }>`。
- **Rejected alternatives**:
  - 模块级单例 QueryClient:SSR 下可能跨请求共享缓存。
  - 手动 `QueryClientProvider`:与官方集成重复;仅在 peer 冲突时作为回退。

### D6. 首页保持客户端取数,query options 集中定义

- **Context**:开发期接口通过 Vite `/api` 代理提供;SSR 期间相对 URL 无法直接请求。现有设计已明确客户端取数。
- **Decision**:新增 `apps/web/src/queries/greeting.ts`,用 `queryOptions` 定义 `["greeting"]` 查询;首页使用 `useQuery`。不增加 loader 预取,不使用 `useSuspenseQuery`。
- **Rejected alternatives**:
  - loader + `useSuspenseQuery`:会在服务端触发相对 URL 请求。
  - Start server function:会绕开既有 `/api` 代理契约,超出本次范围。

### D7. 验收沿用现有 API 集成测试 + 人工 E2E

- **Context**:`GreetingApiTest` 已覆盖接口契约;仓库无前端测试框架与 E2E 运行器。
- **Decision**:保留并运行 `GreetingApiTest` 作为 API 层兜底;E2E 以浏览器步骤验证首页展示与 Network 请求;不新增 Playwright/Cypress 或前端组件测试。
- **Rejected alternatives**:
  - 新增前端测试框架:超出本次最小改造范围。
  - 依赖开发库:测试继续使用临时 SQLite 文件,避免污染开发数据。

### D8. 后端错误统一使用 Problem Details

- **Context**:当前未捕获异常会落到默认 500,没有稳定错误码;需求方要求前后端统一错误处理。
- **Decision**:错误响应使用 RFC 9457 `ProblemDetail`,媒体类型 `application/problem+json`,包含标准字段与扩展 `code`。成功响应继续直接返回 DTO,不套 envelope。
- **Rejected alternatives**:
  - 统一 `{code,message,data}` envelope:成功响应也要套壳,偏离 REST。
  - 仅返回 `{message}`:缺少稳定错误码,前端无法按类型处理。

### D9. 全局异常处理与稳定错误码

- **Context**:控制器不应各自拼装错误 JSON;需要区分领域错误、校验错误与未捕获错误。
- **Decision**:新增 `@RestControllerAdvice` 并继承 `ResponseEntityExceptionHandler`;定义 `ApiException` 基类与 `GreetingNotFoundException`;错误码至少包含 `GREETING_NOT_FOUND`、`VALIDATION_ERROR`、`INTERNAL_ERROR`。`detail` 使用英文,`code` 稳定。5xx 记录异常堆栈,4xx 不记录堆栈。
- **Rejected alternatives**:
  - 在控制器内 try/catch:重复且易漏。
  - 前端按 HTTP 状态码猜错误:丢失业务语义。

### D10. 前端统一 request 与 typed ApiError

- **Context**:当前 `fetch` 只抛普通 `Error`,没有解析 Problem Details,也没有统一超时/取消。
- **Decision**:新增 `request<T>` 封装 `fetch`,解析 JSON 与 Problem Details,非 2xx 抛 `ApiError`;`ApiError` 提供 `status`、`code`、`detail`、`instance`、`isRetryable`。网络错误/超时映射为可重试 `ApiError`。query options 只调用 `request`,不直接 `fetch`。
- **Rejected alternatives**:
  - axios/ky:与 TanStack Query 的重试/缓存职责重叠,当前规模不值得新增依赖。
  - 在组件内直接 `fetch`:无法统一取消、错误解析与重试。

### D11. 按 TanStack Query 官方模式处理重试与错误呈现

- **Context**:TanStack Query v5 已从 `useQuery` 移除 `onError`;官方推荐全局回调、`throwOnError` 与错误边界配合。
- **Decision**:
  - `queryFn` 接收 `AbortSignal` 并传给 `request`。
  - 重试只针对 `ApiError.isRetryable` 且最多 2 次;4xx 不重试。
  - 通过 `QueryCache` / `MutationCache` 的 `onError` 统一记录错误。
  - 首次加载失败通过 `throwOnError` 交给路由 `errorComponent`;后台刷新失败保留缓存数据,仅记录。
  - 根路由新增 `notFoundComponent`;错误页提供 retry。
- **Rejected alternatives**:
  - 在 `useQuery` 上写 `onError`:v5 已移除。
  - 所有错误都进入错误页:后台刷新失败会清空已有内容。
  - 引入 toast:本次需求方选择路由错误页 + 日志。

### D12. 错误文案与可观测性边界

- **Context**:当前没有 traceId、i18n 与 toast 基础设施。
- **Decision**:后端返回英文 `detail` + 稳定 `code`;前端暂时展示 `detail`/通用错误文案,后续按 `code` 做中文映射。traceId、toast 与成功响应 envelope 明确不在本次范围。
- **Rejected alternatives**:
  - 后端直接返回中文 `detail`:前后端耦合,后续 i18n 成本高。
  - 现在引入 traceId:需要额外的过滤器/日志链路,超出本次最小范围。

## Risks / Trade-offs

- Hibernate 社区 SQLite 方言不是核心官方方言,复杂 JPQL/DDL 能力有限 → 保持派生查询与最小映射,不引入复杂查询。
- JPA 增加启动开销与实体生命周期 → 当前单表读取,影响可控。
- `@tanstack/react-router-ssr-query` 与当前 Router 版本可能存在 peer 冲突 → 安装时验证;必要时回退手动 Provider。
- 前端继续客户端取数 → 首屏文本稍晚出现,与现有行为一致。
- “无 JdbcTemplate / 无 useEffect fetch”依赖人工 review → 本次以代码检索与 E2E 证据兜底。
- TanStack Query v5 移除了 `useQuery` 的 `onError` → 必须使用 `QueryCache`/`MutationCache` 全局回调,不能沿用旧教程。
- `throwOnError` 若无条件开启,后台刷新失败可能清空已展示内容 → 仅在无缓存数据时交给错误页。
- Problem Details 的 `detail` 与 `code` 需保持稳定 → 用领域异常与错误码集中定义,避免控制器临时拼装。

## Migration Plan

1. 后端依赖与 JPA 配置
2. 实体、仓库、控制器替换
3. 后端测试转绿
4. 前端依赖与 QueryClient/SSR 集成
5. 首页 query options + `useQuery`
6. 后端 Problem Details、全局异常处理与错误码
7. 前端 `request` / `ApiError`、重试策略、Query 全局错误回调与路由错误页
8. 错误路径测试与前端构建
9. 浏览器 E2E(正常路径 + 错误路径)
10. 知识库与文档收口

无数据库迁移;现有 SQLite 文件与 Flyway 历史保持不变。

## Open Questions

- 无阻塞问题。非阻塞后续项(TanStack Query Devtools、仓库层单测、Hibernate SQL 日志、SQLite 写并发)已在 REQ-002 记录为 deferred。
