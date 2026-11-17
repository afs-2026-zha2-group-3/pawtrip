# ATDD Design

变更：`2026-11-17-calendar-range-picker`

## ATDD layers in scope

### API 层

不新增或修改后端接口。创建行程继续调用既有 `POST /api/trips`，本变更只改变日期收集方式，API 测试无需新增。

### Unit 层

`daysBetween(start, end)` 复用 `apps/web/src/lib/trip/duration.test.ts` 既有用例（同日、跨月、结束早于开始、非法/缺失格式）。日历组件为受控 UI，交互由 E2E 覆盖，不新增组件单测。

### E2E 层

| 场景 | 层级 | 用例 | 归类理由 |
|---|---|---|---|
| 打开对话框展示日历且无选中 | E2E | `destination-selection` E5 | 弹窗初始状态与无写入 |
| 确认后创建行程并跳转景点 | E2E | `destination-selection` E6 | 跨页面流程与 `activeTripId` |
| 只选开始日期或超过 7 天时拒绝 | E2E | `destination-selection` E7 | 表单校验与不发送 `POST` |
| 同一天选两次为 1 天 | E2E | `trip-duration-input` 同日用例 | 含首尾计数与面板天数 |
| 选择 3 天区间 | E2E | `trip-duration-input` 区间用例 | 天数推导与计划天数 |
| 超过 7 天拒绝 | E2E | `trip-duration-input` 超限用例 | 上限提示与不提交 |
| 点击更早日期重新开始 | E2E | `trip-duration-input` 重用例 | 单日历选择语义 |
| 跨月选择 | E2E + 浏览器结构验证 | `pickCalendarDate` 自动翻月 | 月切换与跨月区间提示 |

## What is written before production code

本次为功能完成后补齐的 ATDD 记录。实现与测试同步落地，最终以以下骨架验证用户可见行为：

1. `e2e/trip-helpers.ts`：`pickCalendarDate` 按 `data-month` 翻月并点击 `data-date`；`setTripDates` 改为点日历。
2. `e2e/destination-selection.spec.ts`：E5 断言日历可见且无 `aria-pressed` 日期；E7 改为「只选开始日期」与「超过 7 天」两类拒绝。
3. `e2e/trip-duration-input.spec.ts`：同日、3 天、超 7 天改用日历点击；原「结束早于开始」用例替换为「点击更早日期重新开始区间」。

## Non-goals

- 不覆盖日期持久化（由 `2026-11-17-add-trip-start-date` 的 API 与 E2E 用例负责）。
- 不覆盖日历键盘方向键导航、多语言与过去日期禁用。
- 不改动宠物选择、创建/取消与单激活行程逻辑。
