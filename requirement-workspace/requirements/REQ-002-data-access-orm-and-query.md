---
id: REQ-002
title: 数据访问、请求与错误处理规范化改造
status: in-change
discovery: Go (2026-11-13)
impact: ../analysis/REQ-002/impact-brief.md
deep_dive: ../analysis/REQ-002/deep-dive.md
sources:
  - apps/server/pom.xml
  - apps/server/src/main/resources/application.yml
  - apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java
  - apps/server/src/test/java/com/pawtrip/server/greeting/GreetingApiTest.java
  - apps/web/package.json
  - apps/web/src/router.tsx
  - apps/web/src/routes/__root.tsx
  - apps/web/src/routes/index.tsx
  - docs/knowledge/architecture/README.md
  - openspec/specs/greeting/spec.md
  - openspec/specs/home-page/spec.md
---

# REQ-002: 数据访问、请求与错误处理规范化改造

## Discovery Decision

Go — 候选能力清晰：保持现有问候语链路行为不变，将后端 `greeting` 数据访问从 `JdbcTemplate` 改为 Spring Data JPA 仓库，将首页取数从 `useEffect` + `fetch` 改为 TanStack Query；在此基础上补齐前后端统一的错误契约与前端 request 层。与 Living Spec `greeting`、`home-page` 对齐，无能力冲突（2026-11-13）。2026-11-13 与需求方确认扩展范围，纳入 Problem Details 与统一 request。

## 六字段

1. **id**:REQ-002
2. **statement**:保持 `GET /api/greeting` 的成功响应不变，后端改用 Spring Data JPA 仓库读取 SQLite `greeting` 表，生产代码不再使用 `JdbcTemplate` 或手写 SQL；前端首页改用 TanStack Query 获取 `/api/greeting`，不再使用 `useEffect` + `fetch` 自行管理请求状态；同时建立统一的后端 Problem Details 错误契约与前端 typed request 层，错误在路由级统一呈现并记录日志。
3. **actors**:
   - 访客:打开首页,看到问候语或统一的错误页
   - 前端应用 `apps/web`:通过 TanStack Query 与 `request` 层请求、解析错误并渲染
   - 后端应用 `apps/server`:通过 JPA 仓库读取数据库,通过全局异常处理返回 Problem Details
   - 开发者:维护数据访问、请求层与错误契约
4. **rationale**:为后续 PawTrip 功能建立统一的 ORM 数据访问、前端服务端状态管理与错误处理方式,减少裸 SQL、重复的请求状态代码和零散的错误响应,同时保持现有接口与页面正常路径行为不变。
5. **acceptance hints**:
   - `GET /api/greeting` 仍返回 `200`、`Content-Type: application/json` 与 `{"message":"Hello World"}`
   - 后端新增 `Greeting` 实体与 `GreetingRepository`;控制器只依赖仓库;生产代码中不存在对 `greeting` 表的 `JdbcTemplate` 或手写 SQL 查询
   - 应用配置使用 Hibernate 社区 SQLite 方言;Flyway 继续管理 schema;Hibernate `ddl-auto` 为 `none`
   - 前端 QueryClient 通过 router context 提供;首页使用集中定义的 query options;组件中不存在 `useEffect` + `fetch` 请求
   - 后端错误统一返回 `application/problem+json`,包含 `status`、`code`、`detail`、`instance`;成功响应不套壳
   - 问候语不存在时返回 `404` + `code=GREETING_NOT_FOUND`;未捕获异常返回 `500` + `code=INTERNAL_ERROR`,不暴露堆栈
   - 前端所有服务端请求经过统一 `request` 层,非 2xx 解析为 typed `ApiError`;4xx 不重试,网络错误/5xx 最多重试 2 次
   - 前端首次加载失败进入路由 `errorComponent` 并提供重试;后台刷新失败保留缓存数据并记录日志;根路由提供 `notFoundComponent`
   - 后端测试、错误路径测试与前端构建通过
6. **links to evidence**:
   - 现有实现:`apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java`、`apps/web/src/routes/index.tsx`
   - Living Spec:`openspec/specs/greeting/spec.md`、`openspec/specs/home-page/spec.md`
   - 架构说明:`docs/knowledge/architecture/README.md`
   - 选型研究:Spring Data JDBC 官方支持库不含 SQLite;Spring Boot 4.1.2 管理 Hibernate 7.4.13.Final,其 `hibernate-community-dialects` 包含 `org.hibernate.community.dialect.SQLiteDialect`
   - TanStack Start 官方集成方式:`setupRouterSsrQueryIntegration` + `getRouter` 内创建 `QueryClient`
   - Spring Problem Details 官方文档:https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html
   - TanStack Query 官方最佳实践:query functions / retries / important defaults / query cancellation / useQuery `throwOnError`
   - 2026-11-13 需求方决策:扩展现有 change;错误契约用 Problem Details;前端错误用路由错误页 + 日志;traceId 与 toast 暂缓;英文 detail + 稳定 code

## Ready 形状

### Intent

在不改变接口正常路径和页面可见行为的前提下,把后端数据访问统一到 Spring Data JPA、把前端取数统一到 TanStack Query,并建立 Problem Details 错误契约与统一 request 层,为后续功能提供可复用的实现与错误处理基线。

### Actors 与权限边界

- 访客(无认证)
- 前端 `apps/web`(展示方,不拥有数据)
- 后端 `apps/server`(接口与数据读取方)
- 开发者(实现与约定维护方)

权限边界:无用户账户与权限体系(非目标)。

### In / Out Scope

**In**

- 后端引入 Spring Data JPA 与 Hibernate 社区 SQLite 方言
- 新增 `Greeting` 实体与 `GreetingRepository`,替换 `GreetingController` 中的 `JdbcTemplate`
- 保持 Flyway 迁移与 `greeting` 表结构不变
- 前端引入 TanStack Query 与 TanStack Start SSR 集成
- 首页改用集中 query options + `useQuery`,移除 `useEffect` + `fetch`
- 后端新增 `@RestControllerAdvice`,错误统一返回 RFC 9457 Problem Details;错误码 `VALIDATION_ERROR`、`GREETING_NOT_FOUND`、`INTERNAL_ERROR`
- 问候语不存在时返回 `404`;未捕获异常返回 `500` 且不暴露堆栈
- 前端新增统一 `request` 层与 typed `ApiError`;4xx 不重试,网络错误/5xx 最多重试 2 次
- 前端新增路由 `errorComponent` 与 `notFoundComponent`;首次加载失败显示错误页并可重试,后台刷新失败保留旧数据并记录日志
- 请求取消:queryFn 将 `AbortSignal` 传入 `request`
- 同步更新架构知识与 OpenSpec 能力规格
- 保持现有后端集成测试、错误路径测试与前端构建通过

**Out**

- `GET /api/greeting` 正常路径的路径、状态码、响应体或字段变更
- `greeting` 表结构、种子数据或迁移版本变更
- 新增写接口、问候语管理 UI 或多语言
- 成功响应统一 envelope
- toast 通知、traceId/请求 ID、错误码到中文文案的 i18n 映射(后续 change)
- SSR 预取 / server function 取数改造
- TanStack Query Devtools、仓库层单测、Hibernate SQL 日志、SQLite 写并发策略(均为非阻塞后续项)
- 部署、CI/CD 与跨域方案

### Scenarios + AC Hints

**S1 接口行为不变**

- Given 后端已启动且 `greeting` 表存在种子记录
- When 客户端发起 `GET /api/greeting`
- Then 返回 `200`、`Content-Type: application/json` 与 `{"message":"Hello World"}`

**S2 后端通过 JPA 仓库读取**

- Given 后端使用 Spring Data JPA 配置
- When 检查 `GreetingController` 与相关生产代码
- Then 控制器只依赖 `GreetingRepository`
- And 生产代码中不存在对 `greeting` 表的 `JdbcTemplate` 或手写 SQL 查询

**S3 首页通过 TanStack Query 取数**

- Given 后端已启动且 `/api/greeting` 可用
- When 访客打开首页
- Then 页面展示接口返回的 `message`
- And 请求由 TanStack Query 发起,组件中不存在 `useEffect` + `fetch`

**S4 构建与测试不回归**

- Given 改造完成
- When 执行后端测试与前端构建
- Then 现有 `GreetingApiTest` 与错误路径测试通过,前端构建成功

**S5 问候语不存在**

- Given `greeting` 表为空
- When 客户端发起 `GET /api/greeting`
- Then 返回 `404` 与 `application/problem+json`
- And 响应体包含 `code=GREETING_NOT_FOUND`、`status=404`、`instance=/api/greeting`
- And 不包含堆栈或内部异常信息

**S6 未捕获异常**

- Given 后端发生未预期异常
- When 请求经过全局异常处理
- Then 返回 `500` 与 `application/problem+json`
- And 响应体包含 `code=INTERNAL_ERROR`
- And 服务端记录错误日志,响应不暴露堆栈

**S7 前端首次加载失败**

- Given 首页首次请求 `/api/greeting` 失败且无缓存数据
- When 页面渲染
- Then 进入路由 `errorComponent`,展示错误信息与重试入口
- And 不展示空白的成功态页面

**S8 前端后台刷新失败**

- Given 首页已有缓存问候语
- When 后台重新请求失败
- Then 保留已有文本
- And 记录错误日志,不进入阻断式错误页

**S9 未知路由**

- Given 访客访问不存在的路由
- When 路由匹配失败
- Then 展示根路由 `notFoundComponent`
- And 不出现默认的裸 "Not Found" 文案

**Boundary**:写入接口、业务字段校验、toast 通知、traceId、i18n 文案映射、SSR 预取与写入并发不在本次验收范围。

### Constraints

- 技术栈固定:Spring Boot 4.1.2 / Java 21 / SQLite / Flyway;TanStack Start / React 19 / Vite 8
- Spring Data JDBC 官方不支持 SQLite,本次不采用;Spring Data JPA 通过 `org.hibernate.orm:hibernate-community-dialects` 的 `SQLiteDialect` 支持 SQLite
- Spring Boot 4.1.2 BOM 管理 Hibernate `7.4.13.Final`,无需显式指定方言包版本
- schema 仍由 Flyway 管理,JPA `ddl-auto=none`
- 接口正常路径契约与页面正常路径行为不变
- 前端继续客户端取数:TanStack Start SSR 期间相对 URL `/api/greeting` 不能直接请求
- 错误响应采用 RFC 9457 Problem Details(`application/problem+json`),成功响应不套壳
- 后端 `detail` 使用英文,`code` 保持稳定;前端后续按 `code` 做中文映射
- 前端使用 TanStack Query v5 推荐模式:`queryFn` 接收 `AbortSignal`、4xx 不重试、`QueryCache`/`MutationCache` 全局错误回调、`throwOnError` 交给路由错误页
- traceId、toast、成功响应 envelope 不在本次范围
- 规格先行:实现前形成 OpenSpec change(@rule:spec-first)

### Context

REQ-001 已完成最小全链路(见 `openspec/changes/archive/2026-11-13-hello-world-greeting/`)。当前后端在 `GreetingController` 中直接使用 `JdbcTemplate` 查询,前端在首页使用 `useEffect` + `fetch`。第一次 P4 已完成 JPA 与 TanStack Query 接入;随后需求方决定扩展范围,补齐前后端统一错误处理与 request 层。本次仍不改变正常路径与页面可见行为,但会新增错误响应契约、错误路径 UI 与错误测试。

### Affected Capabilities

- **ADDED** `backend-data-access`:后端关系型数据访问统一使用 Spring Data JPA 仓库,简单查询避免裸 SQL;schema 继续由 Flyway 管理
- **ADDED** `frontend-data-fetching`:前端服务端状态统一使用 TanStack Query,集中定义 query options,避免 `useEffect` + `fetch` 自行管理请求
- **ADDED** `backend-error-handling`:后端统一使用 Problem Details 错误契约、全局异常处理与稳定错误码
- **ADDED** `frontend-api-request`:前端统一 request 层、typed `ApiError`、重试策略与路由级错误呈现
- **MODIFIED** 无:既有 `greeting`、`home-page` 的正常路径行为不变,不修改其行为规格

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | SQLite 是否保留,JPA 方言如何处理? | SA / Dev | Confirmed:保留 SQLite;使用 Hibernate 7.4.13 `hibernate-community-dialects` 的 `org.hibernate.community.dialect.SQLiteDialect`(已检查 jar) |
| blocking | resolved | 前端取数放在客户端还是 SSR loader? | Dev | Confirmed:保持客户端 `useQuery`;SSR 期间相对 URL 不能直接请求,避免 loader 预取 |
| blocking | resolved | 是否改变接口或数据库契约? | Product / Dev | Confirmed:不改变;仅替换实现方式 |
| blocking | resolved | 约定应修改既有能力规格还是新增能力? | SA / Dev | Confirmed:既有 `greeting` / `home-page` 行为不变;新增 `backend-data-access`、`frontend-data-fetching` 两个约定能力 |
| blocking | resolved | 统一错误处理放在新 change 还是扩展现有 change? | Product / SA | Confirmed(2026-11-13):扩展当前 change,更新规格后重新过 G1 |
| blocking | resolved | 后端错误响应契约? | SA / Dev | Confirmed:Problem Details(RFC 9457),扩展 `code`;成功响应不套壳 |
| blocking | resolved | 前端 HTTP 层方案? | Dev | Confirmed:按 TanStack Query 官方最佳实践,自研轻量 `request` + typed `ApiError`;不引入 axios/ky |
| blocking | resolved | 前端错误呈现方式? | Product / Dev | Confirmed:路由 `errorComponent` + 日志;首次加载失败可重试,后台刷新失败保留旧数据;不引入 toast |
| blocking | resolved | 是否现在实现 traceId? | Dev | Confirmed:暂缓;后续可观测性 change 再补 |
| blocking | resolved | 错误文案语言与契约? | Product / Dev | Confirmed:后端英文 `detail` + 稳定 `code`;前端后续按 code 映射中文 |
| non-blocking | deferred | 是否增加 TanStack Query Devtools? | Dev | 后续解决;不影响本次验收 |
| non-blocking | deferred | 是否补充仓库层单测? | QA / Dev | 后续解决;现有 API 集成测试覆盖行为 |
| non-blocking | deferred | 是否启用 Hibernate SQL 日志? | Dev | 后续解决;仅在需要排查时开启 |
| non-blocking | deferred | SQLite 写入并发 / WAL 策略? | Dev | 后续解决;当前链路只读 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| WARNING | resolved | `docs/knowledge/architecture/README.md` | 仍描述 `JdbcTemplate` 与手写 fetch,改造后会过时 | 在本 change 中同步更新数据访问与前端取数说明 |
| SUGGESTION | resolved | `docs/knowledge/external/README.md` | 缺少 Spring Data JPA / TanStack Query 的官方文档来源 | 实现时补充官方文档链接 |
| WARNING | resolved | `openspec/specs/greeting/spec.md`、`openspec/specs/home-page/spec.md` | 现有规格只描述行为,未约束实现方式 | 既有行为规格不改;新增 `backend-data-access`、`frontend-data-fetching` 两个约定 capability 承载可验证约束 |
| WARNING | resolved | 后端现有错误处理 | `IllegalStateException` 直接落到默认 500,无稳定错误码与 Problem Details | 新增 `backend-error-handling` capability 与全局异常处理 |
| WARNING | resolved | 前端现有错误处理 | `fetch` 仅抛普通 `Error`,无 typed 错误、无重试策略、无路由错误页 | 新增 `frontend-api-request` capability 与统一 request 层 |
| WARNING | resolved | TanStack Query v5 行为 | v5 已从 `useQuery` 移除 `onError`,不能按旧模式设计 | 使用 `QueryCache`/`MutationCache` 全局回调与 `throwOnError` |

BLOCKER 数:0。

## Evidence / Verification Notes

- 现有后端使用 `JdbcTemplate` 直接查询:`apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java:12`、`:20`
- 现有前端使用 `useEffect` + `fetch`:`apps/web/src/routes/index.tsx:11`
- 现有数据源与迁移:`apps/server/src/main/resources/application.yml`、`apps/server/src/main/resources/db/migration/V1__create_greeting.sql`
- Spring Data JDBC 官方支持库清单不含 SQLite(官方 Getting Started)
- Spring Boot 4.1.2 BOM 的 `hibernate.version` 为 `7.4.13.Final`;对应 `hibernate-community-dialects` jar 中存在 `org/hibernate/community/dialect/SQLiteDialect.class`
- TanStack Start 官方推荐在 `getRouter` 内创建 `QueryClient`、放入 router context,并调用 `setupRouterSsrQueryIntegration`
