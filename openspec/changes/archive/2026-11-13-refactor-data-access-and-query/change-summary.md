# Change summary — refactor-data-access-and-query

## Intent

在不改变 `GET /api/greeting` 契约与首页正常展示的前提下，把后端数据访问统一到 Spring Data JPA、前端取数统一到 TanStack Query，并补齐前后端统一的 request 层与错误处理约定。对应 REQ-002（scope revision 2）。

## What shipped

- 后端引入 Spring Data JPA 与 Hibernate 社区 SQLite 方言；`Greeting`、`GreetingRepository` 替换 `GreetingController` 中的 `JdbcTemplate`，schema 仍由 Flyway 管理（`ddl-auto=none`）。
- 后端错误统一为 RFC 9457 Problem Details（`application/problem+json`）+ 稳定字段 `code`：`GREETING_NOT_FOUND`、`VALIDATION_ERROR`、`INTERNAL_ERROR`；未捕获异常记录服务端日志并返回通用 500。
- 前端引入 TanStack Query；`QueryClient` 在 `getRouter` 内创建并通过 router context 注入，query options 集中在 `apps/web/src/queries/`。
- 新增统一 `request` / typed `ApiError` 层：Problem Details 解析、10s 超时、`AbortSignal`、网络错误映射。
- 重试仅限网络错误与 5xx（最多 2 次）；4xx 不重试。
- 首次加载失败进入根路由 `errorComponent` 并可重试；后台刷新失败保留缓存并记录日志；未知路由使用 `notFoundComponent`。
- 同步更新架构/外部依赖知识库与 OpenSpec change 全套 artifacts。
- PR #4 已合并：`38ca56b4`（merge commit）；G2 记录随 PR #5 合并：`72a36e7`。
- Living Spec：新增 `openspec/specs/backend-data-access/`、`backend-error-handling/`、`frontend-data-fetching/`、`frontend-api-request/`；既有 `greeting`、`home-page` 不变。
- 归档位置：`openspec/changes/archive/2026-11-13-refactor-data-access-and-query/`。
- KB update：`Skipped (not configured)` —— 仓库未配置 KB 自动校验，未宣称 KB 校验通过。

## Verify highlights

- Local verify：`docs/ai4se-plugins/20261113-232000-local-verify-report.md`，Overall Pass。
- CI：`docs/ai4se-plugins/20261113-232500-pipeline-report.md`，E1 全绿；PR 三轮与合并后 main CI 均通过。
- 后端测试：`GreetingApiTest`、`GreetingNotFoundApiTest`、`GlobalExceptionHandlerTest`、`ServerApplicationTests` 全部通过。
- 前端构建：`npm run build`（client + SSR）通过。
- E2E：正常展示 "Hello World"、数据变更跟随、404 Problem Details、首次失败错误页与重试、后台刷新失败保留缓存、未知路由。
- 非目标反向验证：无 toast / 成功 envelope / traceId；无写接口；V1 迁移未改；页面与 query 函数无直接 `fetch`。

## Residual risks

- Hibernate `SQLiteDialect` 为社区模块，复杂查询/DDL 能力有限；保持派生查询与 Flyway 管理 schema。
- 前端无自动化组件测试，错误 UI 由本地浏览器 E2E 覆盖；CI 不执行浏览器 E2E。
- 后台刷新失败仅记录 console 日志，缺少 traceId/上报通道（显式非目标）。
- 错误码前后端各自维护，缺少自动契约校验。
- CI 未配置 secret scan / SAST / 依赖审计；仓库无 CD 流水线。

## Links

- Proposal / Design / Tasks：同目录 `proposal.md`、`design.md`、`tasks.md`。
- ATDD 与对齐自检：同目录 `atdd-design.md`、`alignment-self-check.md`、`consistency-lint.md`。
- PR：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/4 （G2 记录补录 PR #5）
- Local verify：`docs/ai4se-plugins/20261113-232000-local-verify-report.md`
- Pipeline report：`docs/ai4se-plugins/20261113-232500-pipeline-report.md`
- G1 / G2 decision：同目录 `g1-decision.md`、`g2-decision.md`
