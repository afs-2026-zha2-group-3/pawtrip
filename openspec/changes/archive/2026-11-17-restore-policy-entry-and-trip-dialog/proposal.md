## Why

2026-11-17 的统一地点浏览改造把「选定城市」变成了草稿流程：点击「选定」后候选列表被城市详情视图替换，页面内嵌政策要点，用户还要在左下角面板再次编辑天数与宠物并确认。需求方复查后认为这偏离了原始设计：

- 政策应只在政策页通过「查看政策」入口查看，候选页不应内嵌政策内容。
- 选定城市后应先用一个确认弹窗收集出行日期，确认即创建行程并直接进入该城市的景点选择，而不是停留在城市详情页。

## What Changes

- `/cities` 恢复为始终展示候选列表；存在激活行程或草稿时不再切换为城市详情视图。
- 每张候选卡片恢复「查看政策」链接，跳转 `/destinations/{adcode}/policy`；候选页不展示政策要点或禁养/可携带名单。
- 点击「选定」改为打开「创建行程」对话框：目的地固定为所选城市；填写开始与结束日期，按日期推导 1–7 天行程；选择携带宠物（默认第一只）；不提供景点选择。
- 确认对话框调用 `POST /api/trips` 创建并激活行程，写入 `activeTripId`，随后跳转 `/attractions` 展示该城市景点；取消不产生任何写入。
- 同一时间只支持一个激活行程：存在激活行程时候选列表仍展示，但「选定」不可用，需先在 Trips 取消激活后才能新建。
- 起止日期当前只用于推导 `totalDays`，行程模型不新增日期字段；行程名仍为「城市 · N天 · 宠物名」。
- 移除「激活行程下的城市详情」行为与对应规格；草稿面板与草稿状态保留在代码中但不再有 UI 入口（后续可单独清理）。
- 同步更新受影响 E2E：选城对话框、日期校验、政策入口、景点跳转。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `destination-selection`: 候选列表不再因激活行程或草稿切换视图；选定城市改为确认弹窗；新增候选卡片政策入口；移除激活行程下的城市详情。
- `trip-context`: 移除「草稿创建与确认」的用户路径，改为「创建行程确认弹窗」直接创建并激活行程。

## Impact

- 前端路由与组件：`apps/web/src/routes/_authenticated/cities.tsx`、新增 `-city-trip-dialog.tsx`、`apps/web/src/lib/trip/duration.ts`。
- 前端类型：修正 `apps/web/src/lib/trip/store.ts` 的 `TransportMode` 导入来源（修复既有 `tsc` 报错，不新增导出）。
- 测试：`e2e/trip-helpers.ts`、`e2e/destination-selection.spec.ts`、`e2e/trip-duration-input.spec.ts`、`e2e/trips-panel.spec.ts`、`e2e/transport-rules.spec.ts`、`e2e/attraction-pet-rules.spec.ts`、`e2e/city-pet-policy.spec.ts`；新增 `apps/web/src/lib/trip/duration.test.ts`。
- 无后端 API、数据库迁移与依赖变更。
