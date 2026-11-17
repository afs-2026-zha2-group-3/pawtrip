# Change summary — 2026-11-17-calendar-range-picker

- Change id: `2026-11-17-calendar-range-picker`
- 状态：实现与本地验证完成；未提交、未建 PR、未归档
- 分支：`feat/add-trip-start-date`（同一分支承载 `calendar-range-picker` 与 `add-trip-start-date` 两个 change，计划一个 PR 交付）

## Intent

把创建行程弹窗中「开始日期 / 结束日期」两个原生日期输入替换为一张单日历，在同一张月历上依次点选起止日期，并高亮所选区间。

## What shipped

- 新增 `apps/web/src/components/ui/calendar-range.tsx`：单月视图、前后翻月、星期表头、点击选开始/结束、区间连续色带与端点圆角；再次点击或点击更早日期会重新开始选择。
- `apps/web/src/routes/_authenticated/-city-trip-dialog.tsx`：日期区域改为「出行日期」日历，保留宠物选择、创建/取消与 1–7 天校验；天数提示显示「行程共 N 天（起 至 止）」。
- `e2e/trip-helpers.ts`：新增 `pickCalendarDate`（按 `data-month` 翻月），`setTripDates` 改为点日历。
- `e2e/destination-selection.spec.ts`、`e2e/trip-duration-input.spec.ts`：同步单日历交互；「结束早于开始」用例替换为「重新开始区间」。
- living specs：`trip-context`、`destination-selection` 的创建行程弹窗 requirement 与场景同步。
- 无新增依赖、后端接口或数据库改动。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` |
| 受影响 E2E | Pass（组合运行） | `destination-selection` + `trip-duration-input`：19 passed；运行包含日期持久化改动，不能单独证明本 change，最终以同一 PR 的 CI 为准 |
| 浏览器结构验证 | Pass | 5 天区间端点/底色正确；跨月 9 天提示超限；缺结束日期提示；月切换正常 |
| OpenSpec validate | Pass | `npx --no-install openspec validate 2026-11-17-calendar-range-picker --strict` |
| G1 / G2 / G3 | G1 Pass（IO=Kitty Su、SA=HARLAN HUANG）；G2 Conditional（VL=SCOTT）；G3 待签 | `g1-decision.md`、`g2-decision.md` |
| 全量 E2E / CI | 未运行 | 待 PR 阶段补齐 |

## Residual risks / follow-ups

1. 自研日历不支持方向键导航；如后续多处使用日期选择，应评估换用成熟日历库。
2. 与 `2026-11-17-add-trip-start-date` 修改同一组 requirement：同一 PR 合并后必须先归档本变更，再归档日期持久化变更。本变更 delta 中的「起止日期 MUST NOT 持久化」是过渡文本，最终由日期 change 翻转。
3. `-city-trip-dialog.tsx` 与 E2E 文件同时含两个 change 的 hunk，按路径拆不开；计划一个 PR 交付两个 change。
4. 全量 E2E 与 CI 尚未在本变更上执行。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/destination-selection/spec.md`、`specs/trip-context/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
