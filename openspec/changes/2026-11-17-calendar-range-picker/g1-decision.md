# G1 决策记录：单日历区间选择

- Change ID：`2026-11-17-calendar-range-picker`
- Gate：G1 Align
- 决策：Pass
- 时间：2026-11-17（Asia/Shanghai）
- IO：Kitty Su
- SA：HARLAN HUANG

## 输入材料

- `proposal.md`
- `specs/trip-context/spec.md`
- `specs/destination-selection/spec.md`
- `design.md`
- `atdd-design.md`
- `dov-ac-review.md`
- `tasks.md`
- `alignment-self-check.md`
- `npx --no-install openspec validate 2026-11-17-calendar-range-picker --strict`：通过

## 对齐结论

- 本变更限定为创建行程弹窗的日期交互：两个原生日期输入替换为单月历区间选择，保留宠物选择、创建/取消与 1–7 天校验。
- 选择语义明确：无开始、已有完整区间、点击更早日期均重新开始；同日选择形成 1 天区间。
- 不新增后端接口、数据库迁移或第三方依赖；日期持久化不在本变更范围，由 `2026-11-17-add-trip-start-date` 承接。
- 与 `2026-11-17-add-trip-start-date` 修改同一组 requirement：两个 change 同分支、同一 PR 交付；合并后先归档本变更，再归档日期持久化变更。
- 补齐了变更目录缺失的 `.openspec.yaml`（`schema: spec-driven`）。

## 条件与责任人

- 本变更无阻塞条件。
- G2 为 Conditional，整改项与 owner 见 `g2-decision.md`（owner=SCOTT）。

> 本记录依据用户明确指示补录：IO=Kitty Su、SA=HARLAN HUANG；G1 决策 Pass 由用户在 2026-11-17 确认。G3 待合并归档后另行签署。
