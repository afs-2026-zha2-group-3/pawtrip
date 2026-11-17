# Proposal

## Why

创建行程弹窗原先用两个原生 `<input type="date">` 分别填写开始与结束日期：用户要分别点开浏览器日期控件，看不到已选区间，也容易填出结束早于开始的组合。需求方希望改成截图中的单一日历：在同一张月历上依次点选开始日与结束日，区间以连续色带高亮。

## What Changes

- 新增前端 `CalendarRange` 日历组件：月切换、星期表头、点击选开始/结束、区间连续高亮、起止端点实心圆角。
- 创建行程弹窗移除两个原生日期输入，改为单个「出行日期」日历；天数提示实时显示「行程共 N 天（起 至 止）」或「已选择 X 开始，请再选择结束日期」。
- 选择语义：无开始日期、已有完整区间或点击早于当前开始日期时，以该日期重新开始选择；否则该日期作为结束日期。
- 1–7 天限制、缺日期提示、宠物选择、创建与取消流程保持不变。单日历下不再能表达「结束早于开始」，移除该错误分支与对应用例。
- E2E 助手新增 `pickCalendarDate`（按 `data-month` 自动翻月），`setTripDates` 改为点日历；同步 `destination-selection` 与 `trip-duration-input`。
- 同步 living spec 中创建行程弹窗的日期交互与无效范围场景。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-context`: `创建行程确认弹窗` 改为在单一日历上依次选择起止日期，并明确重新选择语义。
- `destination-selection`: `选定城市与创建行程确认` 同步单日历交互与无效范围场景。

## Impact

- 前端组件：新增 `apps/web/src/components/ui/calendar-range.tsx`；修改 `apps/web/src/routes/_authenticated/-city-trip-dialog.tsx`。
- 测试：`e2e/trip-helpers.ts`、`e2e/destination-selection.spec.ts`、`e2e/trip-duration-input.spec.ts`。
- 规格：`openspec/specs/trip-context/spec.md`、`openspec/specs/destination-selection/spec.md`。
- 无后端接口、数据库迁移、依赖变更。日期持久化不在本变更范围，由 `2026-11-17-add-trip-start-date` 负责。
