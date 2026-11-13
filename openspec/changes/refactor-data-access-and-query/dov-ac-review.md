# AC / DoV review — refactor-data-access-and-query

- 生成日期:2026-11-13
- 输入:
  - [proposal.md](proposal.md)
  - [backend-data-access/spec.md](specs/backend-data-access/spec.md)
  - [frontend-data-fetching/spec.md](specs/frontend-data-fetching/spec.md)
  - 上游需求:[REQ-002](../../../requirement-workspace/requirements/REQ-002-data-access-orm-and-query.md)
- 评审范围:P2 Delta Spec;不含业务实现

## Acceptance criteria (AC)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 Requirement 至少有一个可测试 AC | Pass | `specs/backend-data-access/spec.md` 4 个 Requirement 均有 `#### Scenario`;`specs/frontend-data-fetching/spec.md` 4 个 Requirement 均有 `#### Scenario` | 场景可通过代码/配置检查与既有接口测试验证 |
| AC-2 AC 可观察,无模糊措辞 | Pass | 场景均给出具体检查对象:仓库依赖、无 `JdbcTemplate`/手写 SQL、`ddl-auto` 关闭、Query 发起请求、无 `useEffect` + `fetch`、query options 复用 | 未使用“appropriately / quickly / works well”等模糊词 |
| AC-3 高风险负向/边界场景已覆盖 | Pass | 新增 `backend-error-handling` 的 404/500/校验场景与 `frontend-api-request` 的首次失败、后台刷新失败、未知路由场景;数据库不可用与写入并发仍在 Non-Goals | 错误路径已进入 Delta;剩余排除项明确 |
| AC-4 AC 不是伪装的实现细节 | Pass | 两个原约定能力与两个错误处理能力均以可检查的代码/配置/接口事实表达,而非“做得合适” | 本次变更目标即建立实现与错误处理约定,属于有意为之 |
| AC-5 错误响应可测试 | Pass | `backend-error-handling/spec.md`:404/500/校验均有状态码、媒体类型与 `code` 断言 | 可用 MockMvc 隔离验证 |
| AC-6 错误呈现可观察 | Pass | `frontend-api-request/spec.md`:首次失败进入错误页、后台失败保留缓存、未知路由进入 `notFoundComponent` | 浏览器 E2E 可验证 |
| AC-7 重试与取消可验证 | Pass | 4xx 不重试、5xx/网络最多 2 次、`AbortSignal` 传入 request | 可通过 Network/单元测试观察 |
| AC-8 成功响应不变 | Pass | 两个错误处理能力均明确成功响应不套 envelope | 现有 `GreetingApiTest` 断言 |

## Definition of verified (DoV)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal Capabilities 仅列 `backend-data-access`、`frontend-data-fetching`;两份 Delta Spec 一一对应 | 无静默扩张或遗漏 |
| DoV-2 歧义已列出或解决 | Pass | [REQ-002](../../../requirement-workspace/requirements/REQ-002-data-access-orm-and-query.md) 的 blocking OQ 全部 resolved;non-blocking 均 deferred | 无未解决阻塞歧义 |
| DoV-3 IO/SA 关注点已记录 | Pass | 本文“Residual concerns”列出方言、SSR 兼容性、失败态与测试覆盖风险 | G1 人工签核另行记录,不在本评审中代替 |
| DoV-4 未声称业务实现完成 | Pass | 本 change 尚未修改生产代码;评审仅针对 Delta Spec | — |
| DoV-5 Requirement 可追溯到 proposal / 已批准需求 | Pass | 见下方 traceability 表 | 每条 Requirement 均能落到 proposal What Changes 或 REQ-002 acceptance hints |
| DoV-6 扩围后范围仍与 proposal 一致 | Pass | proposal 新增 `backend-error-handling`、`frontend-api-request`;Delta Spec 一一对应 | 2026-11-13 scope revision 2 |
| DoV-7 扩围决策已记录 | Pass | REQ-002 Open Questions:扩展现有 change、Problem Details、路由错误页 + 日志、traceId/toast 暂缓、英文 detail + 稳定 code | 需 G1 revision 重新签核 |

## Traceability

| Requirement | Proposal What Changes | REQ-002 acceptance hint |
|---|---|---|
| 关系型数据访问使用 Spring Data JPA 仓库 | 后端引入 Spring Data JPA;控制器改为依赖仓库,移除 `JdbcTemplate` | 后端新增实体与仓库;无 `JdbcTemplate`/手写 SQL |
| 裸 SQL 例外需显式记录 | 简单查询避免裸 SQL | 减少裸 SQL;复杂查询保留仓库内 `@Query` |
| Schema 由 Flyway 管理 | 表结构与 Flyway 迁移不变 | Flyway 继续管理 schema;`ddl-auto=none` |
| SQLite 使用 Hibernate 社区方言 | 引入 Hibernate 社区 SQLite 方言 | 配置 `org.hibernate.community.dialect.SQLiteDialect`;接口行为不变 |
| 服务端数据通过 TanStack Query 获取 | 首页改用集中 query options + `useQuery`,移除 `useEffect` + `fetch` | 组件中无 `useEffect` fetch |
| QueryClient 按请求生命周期创建 | 在 `getRouter` 内创建 QueryClient 并接入 router context | QueryClient 通过 router context 提供 |
| 查询键与 query options 集中定义 | 新增 `apps/web/src/queries/greeting.ts` | 首页使用集中定义的 query options |
| 保持客户端取数边界 | 前端继续客户端取数,不做 SSR loader 预取 | 规避 SSR 相对 URL 请求问题 |
| 错误统一使用 Problem Details | 后端新增全局异常处理;错误响应改为 Problem Details | 错误为 `application/problem+json`,含 `code`/`status`/`detail` |
| 使用稳定错误码 | 新增 `ApiErrorCode` 与领域异常 | `GREETING_NOT_FOUND`、`VALIDATION_ERROR`、`INTERNAL_ERROR` |
| 全局异常处理 | `@RestControllerAdvice` 集中映射 | 控制器不拼装错误 JSON |
| 服务端错误日志 | 5xx 记录堆栈,4xx 不记录 | 日志与响应分离 |
| 服务端请求统一经过 request 层 | 新增 `request` 层;query options 只调用 request | 组件无直接 fetch |
| 统一 typed ApiError | Problem Details 解析为 `ApiError` | 404/网络错误场景 |
| 按错误类型重试 | QueryClient `retry` 策略 | 4xx 不重试,5xx/网络最多 2 次 |
| 请求可取消 | `queryFn` 传递 `AbortSignal` | 卸载/失效时取消 |
| 路由级错误呈现 | 根路由 `errorComponent`/`notFoundComponent` | 首次失败可重试;后台失败保留缓存 |
| 全局错误日志 | `QueryCache`/`MutationCache` onError | 不引入 toast |

## Residual concerns

- Hibernate `SQLiteDialect` 为社区模块,复杂 JPQL / DDL 能力有限;缓解方式为派生查询 + Flyway 管理 schema。
- `@tanstack/react-router-ssr-query` 与当前 Router 版本的 peer 兼容性需在安装时验证;冲突时回退为手动 `QueryClientProvider`。
- 数据库不可用与写入并发仍为显式非目标;错误路径(空表 404、500、前端错误页)已纳入本次范围。
- 前端暂无自动化组件测试,错误 UI 以浏览器 E2E 覆盖。
- 错误契约需前后端保持一致;`detail` 为英文,前端后续按 `code` 做中文映射。

## Outcome

- AC/DoV:无阻塞 Fail;原 AC-3 的 Partial 已通过新增错误路径场景转为 Pass。
- 结论:Delta Spec 可作为 G1 revision 输入;本文件不构成 Gate 决策。
