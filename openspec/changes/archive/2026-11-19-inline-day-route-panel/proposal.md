# Proposal

## Why

路线规划目前藏在「查看当天路线规划」按钮后的弹窗里（2026-11-19 用户诉求）。用户希望打开行程单就能在右侧看到当天路线，无需额外点击，也不希望弹窗遮挡行程明细。行程单仅在计划完成后可查看，每天地点已确认，因此面板可以常驻而无需处理草稿状态。

## What Changes

- 删除「查看当天路线规划」按钮、`routeDialogOpen` 状态与 `DayRouteDialog` 弹窗；路线内容改为 `/itinerary` 内嵌面板，打开页面即可查看。
- 宽屏（≥1024px）采用整页滚动 + 右栏吸顶：左列为当天行程明细与未排期，右列为路线面板；窄屏（<1024px）面板堆叠在当天行程明细之后、未排期之前。
- `PageFrame` 新增仅供行程单使用的加宽能力，其他页面保持默认 `max-w-3xl`。
- 面板与 `Day` 标签联动：切换天即刷新标题、日期城市与地图内容；沿用现有 `DayRouteMap`、路线文案与降级逻辑。
- 面板 MUST NOT 进入 PDF 打印与图片导出。
- 重写 `e2e/day-route-planning.spec.ts` 的打开方式与关闭断言，改为常驻面板断言。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-itinerary`：将「当天路线规划入口与弹窗」改为「当天路线规划面板」；将「路线弹窗空态」重命名为「路线面板空态」；同步「当天路线绘制」「路线距离与时长标注」「路线规划不可用时的降级」中的投影措辞；修改「携带清单入口与进度」与「携带清单弹窗与操作」中依赖路线按钮/弹窗的表述，行为不变。

## Impact

- **前端页面**：`apps/web/src/routes/_authenticated/itinerary.tsx`、新增 `components/trip/day-route-panel.tsx`、删除 `components/trip/day-route-dialog.tsx`、`components/layout/page-frame.tsx`。
- **测试**：`e2e/day-route-planning.spec.ts`、`e2e/itinerary.spec.ts`（回归）；`lib/trip/day-route.test.ts` 不变。
- **后端 / 数据**：无接口、字段或迁移变化。
- **导出**：PDF 与图片导出范围不变，面板被排除。
