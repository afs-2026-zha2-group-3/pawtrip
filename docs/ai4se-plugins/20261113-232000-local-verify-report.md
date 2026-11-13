# Local Verify Report: refactor-data-access-and-query

**Date:** 2026-11-13 (timezone: Asia/Shanghai, UTC+8)
**Root:** C:\Users\luoec3\workspace\ita\pawtrip
**Scope:** local+evidence
**Change id:** refactor-data-access-and-query
**Scope revision:** 2（新增 Problem Details 与前端 request/错误呈现）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Pass |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | **Pass** |

**PR gate:** Pass — 不阻塞 `/sdd:pr-submit`。本次尚未创建 PR；提交 PR 需用户明确授权。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | `docs/feedback/verification-commands.md` | 0 | Vite client + SSR build 成功 |
| `cd apps/server && ./mvnw test` | `docs/feedback/verification-commands.md` | 0 | 4 个测试类各 1 个用例，Failures: 0, Errors: 0 |
| `openspec validate refactor-data-access-and-query --strict` | 本地 OpenSpec CLI | 0 | Change is valid |

补充手工验证:

| 检查 | 结果 |
|---|---|
| `GET http://localhost:8080/api/greeting` | `200` + `application/json` + `{"message":"Hello World"}` |
| 首页 `http://localhost:3000/` | 展示 "Hello World" |
| Network `/api/greeting` | `fetch` 200，每次页面加载 1 次 |
| 修改数据库 `message` 后刷新 | 页面展示 "Hello PawTrip"；恢复后重新展示 "Hello World" |
| 空表时 `GET /api/greeting` | `404` + `application/problem+json`，`code=GREETING_NOT_FOUND`，`detail` 为英文 |
| E2E-5 首次加载失败（后端不可用） | 根路由错误页展示 `ApiError.detail`（如 "Request failed with status 502"），提供重试 |
| E2E-5 重试 | 恢复后端后点击重试，页面重新展示 "Hello World" |
| E2E-6 后台刷新失败 | 保留缓存 "Hello World"；`/api/greeting` 重试 3 次（502）后由 `QueryCache.onError` 记录 "Query failed"，不替换页面 |
| E2E-7 未知路由 `/does-not-exist` | 根路由 `notFoundComponent` 展示 "Page not found" |
| 500 未捕获异常 | `GlobalExceptionHandlerTest` 断言 `500` + `INTERNAL_ERROR` + 通用 detail，服务端记录错误日志 |

验证后已恢复干净数据库（"Hello World"）并停止前后端进程，8080/3000 端口已释放。

## Code-review highlights

- 后端 `GreetingController` 已移除 `JdbcTemplate`，改为注入 `GreetingRepository`，使用 `findFirstByOrderByIdAsc()` 派生查询，接口契约不变。
- 新增 `Greeting` 实体与 `GreetingRepository`；ID 使用 `IDENTITY`，为后续写入预留。
- `application.yml` 配置 Hibernate 社区 SQLite 方言、`ddl-auto=none`、`open-in-view=false`、`spring.mvc.problemdetails.enabled=true`；Flyway 继续管理 schema。
- 后端错误统一走 `GlobalExceptionHandler`：`ApiException` → 领域错误码，校验异常 → `VALIDATION_ERROR`，未捕获异常 → `INTERNAL_ERROR`；Problem Details 扩展稳定字段 `code`，成功响应不套壳。
- 前端在 `getRouter` 内创建 `QueryClient`，通过 router context 与 `setupRouterSsrQueryIntegration` 接入 SSR；根路由改为 `createRootRouteWithContext`。
- 新增 `apps/web/src/lib/http/api-error.ts` 与 `request.ts`：统一 JSON headers、10s 超时、`AbortSignal`、Problem Details 解析与 typed `ApiError`；`ApiError.isRetryable` 区分 4xx 与网络/5xx。
- `QueryClient` 仅对可重试错误重试（最多 2 次），`throwOnError` 只把首次加载失败交给路由错误边界；`QueryCache`/`MutationCache` 全局 `onError` 记录日志。
- 根路由新增 `errorComponent` 与 `notFoundComponent`；后台刷新失败保留缓存数据。
- 架构与外部依赖知识库已同步更新；未修改 Flyway 迁移、表结构或接口字段。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | `tasks.md` 31/31 已勾选 |
| V2 | Requirement coverage | Pass | [fact] | 4 个 Delta Spec 的 Requirement 均有实现证据 |
| V3 | Scenario coverage | Pass | [fact] | API 场景由 4 个后端测试覆盖；E2E-1 ~ E2E-7 由浏览器/Network/Console 验证；反向场景由检索覆盖 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 见下方映射 |
| V5 | Spec drift | Pass | [fact] | 实现与 Delta Spec / design 一致；接口、表结构与页面正常路径行为未变 |
| V6 | Design follow-through | Pass | [fact] | D1–D12 均落地 |
| V7 | Code pattern fit | Pass | [fact] | 构造器注入、record DTO、按功能包组织、集中 query options、集中 HTTP 层 |
| V8 | Upstream basis | Pass | [fact] | 所有改动可追溯到 `tasks.md`；变更包外仅有流程记录 |

### V4 Requirement ↔ implementation mapping

| Requirement | Implementation evidence |
|---|---|
| 关系型数据访问使用 Spring Data JPA 仓库 | `apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java`、`GreetingRepository.java` |
| 裸 SQL 例外需显式记录 | 当前无裸 SQL；仓库接口只含派生查询 |
| Schema 由 Flyway 管理 | `application.yml`（`ddl-auto=none`）、`V1__create_greeting.sql` 未改 |
| SQLite 使用 Hibernate 社区方言 | `apps/server/pom.xml`、`application.yml`；启动日志 `Database dialect: SQLiteDialect` |
| 服务端数据通过 TanStack Query 获取 | `apps/web/src/routes/index.tsx`、`src/queries/greeting.ts` |
| QueryClient 按请求生命周期创建 | `apps/web/src/router.tsx`（`getRouter` 内创建 + `setupRouterSsrQueryIntegration`） |
| 查询键与 query options 集中定义 | `apps/web/src/queries/greeting.ts` |
| 保持客户端取数边界 | 首页无 loader 预取；Network 请求发生在客户端；SSR 无相对 URL 请求错误 |
| 错误响应使用 Problem Details + 稳定 code | `ApiErrorCode`、`ApiException`、`GlobalExceptionHandler`、`spring.mvc.problemdetails.enabled=true` |
| 未捕获异常统一 500 且不泄露内部细节 | `GlobalExceptionHandler.handleUnexpected`、`GlobalExceptionHandlerTest` |
| 服务端错误可诊断 | `GlobalExceptionHandler` 对未捕获异常记录 error 日志 |
| 前端接口调用统一经过 request 层 | `apps/web/src/lib/http/request.ts`；页面与 query 函数不直接 `fetch` |
| 非 2xx 转换为 typed ApiError | `apps/web/src/lib/http/api-error.ts`、`request.ts` |
| 重试仅限可重试错误 | `apps/web/src/lib/query-client.ts`（`ApiError.isRetryable` 且最多 2 次） |
| 请求可取消 | `request` 合并 `AbortSignal`，query options 传递 `signal` |
| 首次加载失败进入路由错误页 | `__root.tsx` `errorComponent`、`throwOnError` |
| 后台刷新失败保留缓存并记录 | `__root.tsx`、`query-client.ts` `QueryCache.onError`（E2E-6 验证） |
| 未知路由使用 notFoundComponent | `__root.tsx` `notFoundComponent`（E2E-7 验证） |
| 不引入 toast / 成功 envelope / i18n 映射 | 代码检索无 toast、无响应 envelope、无错误码中文映射 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单命令（`npm run build`、`./mvnw test`、`openspec validate --strict`）均 exit 0；仓库无远程 CI |
| E2 AI | Pass | 本报告 + 代码检索 + 浏览器 E2E |
| E3 Human | Pending | G2 人工签核待进行 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | Residual risks + red lines | ✅ |

## Findings

### CRITICAL

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | “无 JdbcTemplate / 无 useEffect fetch / 无直接 fetch”目前依赖人工 review | [inference] | `specs/backend-data-access`、`specs/frontend-data-fetching`、`specs/frontend-api-request` | 后续引入 CI 时增加静态检查 |
| 2 | 后台刷新失败目前只记录 console 日志，缺少上报通道 | [inference] | `apps/web/src/lib/query-client.ts` | traceId / 监控上报已明确暂缓，后续 change 处理 |
| 3 | 未来若改为绝对 URL 或 server function 取数，SSR 边界条款需更新 | [inference] | `specs/frontend-data-fetching` | 在相应 change 中补充例外条款 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | Hibernate `SQLiteDialect` 为社区模块，复杂查询/DDL 能力有限 | 非本次范围 | accepted；保持派生查询与 Flyway 管理 schema |
| 2 | `@tanstack/react-router-ssr-query` peer 兼容性 | 已安装并构建/运行通过，长期升级需回归 | tracking |
| 3 | 前端无自动化组件测试 | 本次不引入测试框架 | accepted；由构建与浏览器 E2E 覆盖 |
| 4 | traceId、错误上报、toast、成功 envelope、i18n 映射为非目标 | G1 Revision 2 已接受 | accepted；后续 change 处理 |
| 5 | QueryClient 复用 `staleTime=30s` 使窗口聚焦刷新受新鲜度影响 | 属预期缓存行为 | accepted；E2E-6 在数据过期后验证了后台刷新路径 |

## Waiver

N/A — no waiver（Overall=Pass）。
