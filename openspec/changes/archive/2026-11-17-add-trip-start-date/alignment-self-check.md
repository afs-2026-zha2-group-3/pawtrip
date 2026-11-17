# Alignment self-check — 2026-11-17-add-trip-start-date

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | `specs/trip-planning/spec.md`、`specs/trip-context/spec.md`、`design.md` | 只存 `startDate`、结束日期派生、可空兼容、PUT 整量更新均有对应决策 |
| Spec → Tasks | Pass | `tasks.md` 1.1–3.2 | 迁移、实体、契约、校验、前端透传、E2E、回归均有任务 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 设计决策均可落到任务；未引入 `end_date` 或日期编辑 UI |
| Task verifiability | Pass | `change-summary.md` Verify highlights | 每项有测试类、命令或可观察结果 |
| Cross-change order | Pass with note | `design.md`、`tasks.md` Workflow follow-up | 必须与日历 change 同 PR，先归档日历、再归档本 change |

## Scenario → Evidence

| Requirement / Scenario | Evidence |
|---|---|
| 开始日期持久化：创建带开始日期 | `TripApiTest.persistsStartDateInSummaryAndDetail` |
| 开始日期持久化：创建不带开始日期 | `TripApiTest.createsTripWithDefaultEmptyPlan`（省略字段）与 `TripApiTest.acceptsExplicitNullStartDate`（显式 `"startDate": null`） |
| 开始日期持久化：非法开始日期 | `TripApiTest.rejectsInvalidStartDate` |
| 开始日期持久化：更新开始日期 | `TripApiTest.updatesAndClearsStartDate` |
| 开始日期持久化：整量更新省略开始日期 | `TripApiTest.updatesAndClearsStartDate` |
| Trip CRUD：摘要与详情包含开始日期 | `TripApiTest.persistsStartDateInSummaryAndDetail` |
| 激活行程上下文：刷新恢复 `startDate` | `e2e/trip-duration-input.spec.ts` 创建后刷新断言 |
| 创建行程确认弹窗：确认持久化 `startDate` | `e2e/trip-duration-input.spec.ts` + `activeTripDetail` |
| 创建行程确认弹窗：日历选择与重新选择 | 由 `2026-11-17-calendar-range-picker` 的日历用例覆盖 |
| 计划编辑与自动保存：PUT 携带 `startDate` | `apps/web/src/lib/trip/save.test.ts` 断言请求体携带 `startDate: "2026-12-01"` |

## Gaps / residual risks

- G1 已 Pass（IO=Kitty Su、SA=HARLAN HUANG），G2 已 Pass（VL=SCOTT）；G3 待归档后签署。
- 全量 CI 已由 PR #66 的 Server / Web / Browser E2E 三工作流覆盖并通过。

## Outcome

**Pass（实现与本地验证）**：规格、设计、任务与本地测试一致；跨 change 的 requirement 重叠已通过「同一 PR + 先日历后日期」的归档顺序约束处理。PR #66 三工作流已通过，Gate 决策见 G1/G2/G3 记录。
