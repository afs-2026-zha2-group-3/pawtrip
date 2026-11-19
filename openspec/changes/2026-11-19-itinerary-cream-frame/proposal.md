# Proposal

## Why

2026-11-19 用户要求行程单页面除边框颜色外整体恢复 main 分支版本：路线规划回到「查看当天路线规划」按钮 + 弹窗，页面恢复自然滚动与原有页框宽度。此前新增的右侧常驻路线面板、一屏内滚与加宽页框一并撤销。随后用户补充要求行程单页框去掉阴影，仅保留淡奶黄描边。

## What Changes

- `itinerary.tsx` 恢复 main 版本结构：`DayRouteDialog` 弹窗、`查看当天路线规划` 按钮、正常页面滚动、`PageFrame` 默认宽度。
- 页面主框保留淡奶黄描边（`border-2 border-paw-accent-soft`，`#FFEFD6`），并移除页框阴影。
- 删除 `day-route-panel.tsx`；恢复 `day-route-dialog.tsx` 与 `day-route-map.tsx`。
- 撤销 `2026-11-19-inline-day-route-panel` 变更包。
- 恢复 main 的 `e2e/itinerary.spec.ts` 与 `e2e/day-route-planning.spec.ts`，并补一条页框描边断言。

## Impact

- 影响页面：`/itinerary`。
- 不影响地点浏览页常驻行程面板、我的行程页、城市浏览页、交通规则页的既有行为与奶黄边框。
