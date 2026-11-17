# G1 决策记录：行程开始日期持久化

- Change ID：`2026-11-17-add-trip-start-date`
- Gate：G1 Align
- 决策：Pass
- 时间：2026-11-17（Asia/Shanghai）
- IO：Kitty Su
- SA：HARLAN HUANG

## 输入材料

- `proposal.md`
- `specs/trip-planning/spec.md`
- `specs/trip-context/spec.md`
- `design.md`
- `tasks.md`
- `change-summary.md`
- `alignment-self-check.md`
- `npx --no-install openspec validate 2026-11-17-add-trip-start-date --strict`：通过
- `npx --no-install openspec validate --specs`：23/23 通过

## 对齐结论

- 本变更只持久化开始日期：`trip` 增加可空 `start_date`（`yyyy-MM-dd`），结束日期由 `startDate + totalDays - 1` 派生，不新增 `end_date`。
- 契约保持向后兼容：`startDate` 可选或 `null`；`PUT` 为整量更新，省略即 `null`；非空值校验真实日历日期。
- 前端只做透传：创建弹窗提交 `startDate`，防抖保存携带 `active.startDate`，不新增日期编辑 UI。
- 与 `2026-11-17-calendar-range-picker` 修改同一组 requirement：两个 change 同分支、同一 PR 交付；合并后先归档日历变更，再归档本变更。
- 本变更按精简 SDD 流程交付：proposal/specs/design/tasks/change-summary/alignment 完整；未单独产出 ATDD Design 与 DoV Review，G1/G2 记录已按实名口径补录。

## 条件与责任人

- 本变更无阻塞条件。
- G2 为 Conditional，整改项与 owner 见 `g2-decision.md`（owner=SCOTT）。

> 本记录依据用户明确指示补录：IO=Kitty Su、SA=HARLAN HUANG；G1 决策 Pass 由用户在 2026-11-17 确认。G3 待合并归档后另行签署。
