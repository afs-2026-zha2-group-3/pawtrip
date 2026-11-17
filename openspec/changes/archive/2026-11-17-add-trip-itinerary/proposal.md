# Proposal

## Why

行程信息目前分散在行程面板、地点浏览、交通规则与政策提醒中，用户出行前无法一处确认完整安排。US-48 要求按天汇总行程单；前置的日期持久化（`startDate`）、按天计划、大交通方式、途内交通与地点携宠政策均已具备。

食宿（US-12）、应急（US-13）与天气（US-16）尚无数据源，多目的地也不在当前单城市范围内。本变更先交付可用的单城市行程单：按天切换、地点与途内交通时间线、政策详情与当天提醒；未接入的板块不展示占位，等对应 story 补齐。

## What Changes

- 新增受登录保护的 `/itinerary` 页面，读取当前激活行程。
- 顶部 `Day 1…Day N` 切换；每天显示日期（由 `startDate + day-1` 派生，含星期）、城市与地点数。
- 时间线依次展示地点卡片与途内交通段；交通段显示打车/步行/驾车、估算时长与费用（自驾只显示时长），打车携宠提示，估算失败与同地点连续有兜底。
- 每个地点提供可展开的「详细携宠政策」，复用共享政策字段口径（未配置隐藏、布尔为否显示「不需要」）；底部汇总当天牵引与体型提醒；`unscheduled` 地点单独展示。
- 入口：行程面板头部、Trips 激活行程卡片、Trips/行程单共用的「我的行程 / 行程单」分段导航；`/itinerary` 在主导航中归属 Trips。
- 食宿、应急、天气、具体时间槽与导出不在本变更范围。

## Capabilities

### New Capabilities

- `trip-itinerary`: 行程单页面、按天汇总、时间线与交通段、政策展开、当天提醒、未排期与未接入板块隐藏。

### Modified Capabilities

- `web-app-shell`: `/itinerary` 纳入登录保护，并在主导航中归属 Trips。

## Impact

- 前端路由：新增 `apps/web/src/routes/_authenticated/itinerary.tsx`；修改 `apps/web/src/routes/__root.tsx`、`apps/web/src/routes/_authenticated/trips.tsx`、`apps/web/src/components/trip/trip-panel.tsx`。
- 前端组件与数据：新增 `apps/web/src/components/trip/trip-section-nav.tsx`、`apps/web/src/lib/trip/itinerary.ts`（含单测）。
- 测试：新增 `e2e/itinerary.spec.ts`；`e2e/trip-helpers.ts` 支持 `startDate` 透传。
- 无后端接口、数据库迁移与依赖变更；复用既有 trip、location、route-estimate 接口。
