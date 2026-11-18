# Proposal

## Why

行程单已按天展示景点顺序、途内交通方式与估算时长，但用户看不到当天实际怎么走：地点之间只有文字，没有地图路线。需求方要求在每个 `Day N` 日期旁提供「查看当天路线规划」，把当天地点按顺序用高德路线连成折线，并在折线上展示距离与时长。

天气不在本次范围（需求方 2026-11-18 明确取消）。

## What Changes

- 行程单 `Day 1 / Day 2 ...` 标签行右侧新增「查看当天路线规划」按钮，对当前选中天生效；点击打开该天路线弹窗。
- 弹窗内复用现有高德 JS 地图底座：按计划顺序绘制编号地点标记；相邻不同地点按行程单交通方式调用 `AMap.Driving`（打车/驾车）或 `AMap.Walking`（步行）算路并绘制折线。
- 每段折线上方标注「距离 · 时长」。距离取高德算路结果；时长优先取行程单已保存的估算快照，没有快照时取高德算路结果。
- 相邻同 `poiId` 段不发起算路；地点缺坐标、未配置高德 JS Key 或算路失败时展示非阻塞提示，不影响行程单其他内容。
- `GET /api/locations/{poiId}` 在既有详情字段基础上增加可空 `longitude` / `latitude`，供前端复用已缓存的地点详情绘制路线；坐标已存在于数据库，无迁移、无高德调用。
- 不做天气；不修改行程计划、不写后端、不影响 PDF/图片导出。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `trip-itinerary`: 新增「当天路线规划弹窗」能力。
- `location-management`: 新增「用户端地点详情坐标字段」能力。

## Impact

- 前端：`apps/web/src/routes/_authenticated/itinerary.tsx`、`apps/web/src/components/trip/day-route-dialog.tsx`、`apps/web/src/components/trip/day-route-map.tsx`、`apps/web/src/lib/trip/day-route.ts`、`apps/web/src/lib/amap/loader.ts`、`apps/web/src/queries/locations.ts`。
- 后端：`LocationQueryResponses.LocationDetail` 增加两个可空字段；无 schema 迁移。
- 测试：前端单测覆盖路线段构造、距离/时长格式化、缺坐标与同地点跳过；E2E 覆盖按钮、弹窗开关与无 Key 兜底；后端覆盖详情坐标返回。
- 无新增依赖；高德 JS Key 需具备路线规划服务权限。
