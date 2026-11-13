# G1 decision — refactor-data-access-and-query

- Gate:G1(Align)
- Change id:`refactor-data-access-and-query`
- Input artifacts:
  - Delta Spec:[backend-data-access/spec.md](specs/backend-data-access/spec.md)
  - Delta Spec:[frontend-data-fetching/spec.md](specs/frontend-data-fetching/spec.md)
  - AC/DoV review:[dov-ac-review.md](dov-ac-review.md)
  - Consistency lint:[consistency-lint.md](consistency-lint.md)
  - Upstream:[proposal.md](proposal.md)、[REQ-002](../../../requirement-workspace/requirements/REQ-002-data-access-orm-and-query.md)
- Findings:
  - **Scope**:与 proposal 一致,`backend-data-access`、`frontend-data-fetching` 两个新增能力完整覆盖 What Changes;既有 `greeting` / `home-page` 行为规格不变;无静默扩张或遗漏。
  - **Ambiguity**:blocking OQ 全部 resolved;SQLite 方言、客户端取数边界、接口契约不变均已确认。无未解决阻塞歧义。
  - **Conflict**:无。`openspec validate refactor-data-access-and-query` 通过;consistency lint 为 Pass(0 BLOCKER / 0 WARNING / 2 SUGGESTION)。
  - **Accepted partial**:AC-3 为 Partial——接口失败/超时、空表、数据库不可用与写入并发不进入 Delta,已由 proposal Non-Goals 显式排除;IO/SA 接受。
- Decision:**Pass**
- Conditions + owners:无(Pass,无整改条件)
- Residual risks(已知并接受,非阻塞条件):
  - Hibernate `SQLiteDialect` 为社区模块,复杂查询/DDL 能力有限;由派生查询、Flyway 管理 schema 与接口集成测试兜底,负责人 Dev。
  - `@tanstack/react-router-ssr-query` 与当前 Router 版本的 peer 兼容性需在实现时验证,负责人 Dev。
  - “无 JdbcTemplate / 无 useEffect fetch”目前依赖人工 review,无自动化门禁,负责人 Dev。
  - 前端暂无自动化组件测试,以构建与浏览器验收覆盖,负责人 Dev/QA。
- Approvers:IO=Echo Luo;SA=Echo Luo
- Timestamp:2026-11-13T22:35:00+08:00
- Recorded by:Qoder agent(依据用户显式 G1 确认;签核人 IO/SA=Echo Luo)

## Revision 2 — scope expansion(2026-11-13)

- 触发原因:需求方要求补齐前后端统一错误处理与 request 层,并选择扩展现有 change。
- Input artifacts:
  - [proposal.md](proposal.md)(scope revision 2)
  - Delta Specs:[backend-data-access](specs/backend-data-access/spec.md)、[frontend-data-fetching](specs/frontend-data-fetching/spec.md)、[backend-error-handling](specs/backend-error-handling/spec.md)、[frontend-api-request](specs/frontend-api-request/spec.md)
  - [dov-ac-review.md](dov-ac-review.md)、[consistency-lint.md](consistency-lint.md)
  - [design.md](design.md)(D1–D12)、[tasks.md](tasks.md)
  - [REQ-002](../../../requirement-workspace/requirements/REQ-002-data-access-orm-and-query.md)
- Findings:
  - **Scope**:新增 `backend-error-handling`、`frontend-api-request`;既有正常路径能力不变;无静默扩张。
  - **Ambiguity**:错误契约(Problem Details)、前端 request 最佳实践、错误呈现(路由错误页 + 日志)、traceId/toast 暂缓、英文 detail + 稳定 code 均已确认。
  - **Conflict**:无。`openspec validate --strict` 通过;consistency lint 0 BLOCKER / 0 WARNING / 3 SUGGESTION。
  - **Accepted partial**:原 AC-3 已因新增错误路径场景转为 Pass;数据库不可用与写入并发仍为非目标。
- Decision:**Pass**
- Conditions + owners:无(Pass,无整改条件)
- Residual risks:
  - 错误码前后端各自维护,缺少自动契约校验,负责人 Dev。
  - 前端无自动化组件测试,错误 UI 由浏览器 E2E 覆盖,负责人 Dev/QA。
  - traceId、toast 与成功 envelope 为显式非目标。
- Approvers:IO=Echo Luo;SA=Echo Luo
- Timestamp:2026-11-13T23:06:00+08:00
- Recorded by:Qoder agent(依据用户显式 G1 revision 2 确认;签核人 IO/SA=Echo Luo)

## Next

- Pass → 进入 P3/P4:实现错误处理、更新验证并停在 G2 前。
