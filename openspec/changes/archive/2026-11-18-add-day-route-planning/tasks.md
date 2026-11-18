# Tasks

- Design: [design.md](design.md)
- ATDD design: [atdd-design.md](atdd-design.md)

> 红测先行：1.1–1.3 必须先写并确认失败，再进入实现任务。验收证据以 `atdd-design.md` §2–§5 为准。

## 1. 验收红测（先写，必须失败）

- [x] 1.1 扩展 `apps/server/src/test/java/com/pawtrip/server/location/LocationQueryApiTest.java`：新增 `detailReturnsCoordinatesForSavedLocation`（`poi-zhu-a` → 113.5/22.1）与 `detailReturnsNullCoordinatesWhenMissing`（`poi-zhu-c` → 两个 null）；运行 `./mvnw -Dtest=LocationQueryApiTest test` 确认因字段缺失失败。
- [x] 1.2 新增 `apps/web/src/lib/trip/day-route.test.ts`：覆盖段构造、同 POI skip、缺坐标 unroutable、方式映射、距离格式、时长快照优先与向上取整、0/1 stop 空态；运行 `npm run test -w apps/web -- day-route` 确认因模块不存在失败。
- [x] 1.3 新增 `e2e/day-route-planning.spec.ts` 与假 AMap 注入脚本，覆盖 `atdd-design.md` §2.3 全部用例；运行 `npm run test:e2e -- e2e/day-route-planning.spec.ts` 确认因按钮/弹窗不存在失败。

## 2. 后端坐标契约

- [x] 2.1 `LocationQueryResponses.LocationDetail` 增加可空 `Double longitude`、`Double latitude`，`from` 从 `PawtripLocation` 读取；`LocationQueryService.toDetail` 传入坐标，仍只读数据库。
- [x] 2.2 1.1 红测转绿；确保 `readsOnlyDatabaseWithoutCallingAmap` 仍通过，详情响应不含 `photos`/`business`/`poi`。

## 3. 前端契约与纯函数

- [x] 3.1 `apps/web/src/queries/locations.ts` 的 `LocationBrowseDetail` 增加可空 `longitude`/`latitude`；既有字段与消费方不变。
- [x] 3.2 新增 `apps/web/src/lib/trip/day-route.ts`：按 `day.entries` 顺序构造编号地点与段（route / skip / unroutable），同 `poiId` 跳过、缺坐标标记、方式映射 `walk`/`drive`/`self_drive`；不改写 `TripPlan`。
- [x] 3.3 `day-route.ts` 提供距离格式化（`850 米`、`1.2 公里`）、时长选择（快照优先，否则 `ceil(seconds/60)`）与标签文案。
- [x] 3.4 1.2 单测转绿；`npx tsc --noEmit -p apps/web/tsconfig.json` 通过。

## 4. 高德 loader 与地图

- [x] 4.1 `apps/web/src/lib/amap/loader.ts` 增加 `AMap.plugin`、`AMap.Driving`、`AMap.Walking`、`AMap.Polyline`、`AMap.Text` 最小类型与加载封装；保持单例、错误语义与 `window.AMap` 优先行为。
- [x] 4.2 新增 `apps/web/src/components/trip/day-route-map.tsx`：创建地图、逐段算路、拼接 `steps[].path` 绘制折线、编号标记、`AMap.Text` 标注、`setFitView`、卸载清理与迟到回调忽略。
- [x] 4.3 覆盖状态：加载中、无 Key 占位、单段失败提示、全部缺坐标提示；失败不伪造直线或距离，不阻塞其他段。

## 5. 路线弹窗与行程单入口

- [x] 5.1 新增 `apps/web/src/components/trip/day-route-dialog.tsx`：标题「第 N 天路线规划」、有开始日期时展示该天日期与城市；内容 `print:hidden`；关闭不改当前 Day。
- [x] 5.2 `apps/web/src/routes/_authenticated/itinerary.tsx` 在 Day 标签行右侧新增「查看当天路线规划」按钮并接入弹窗开关；按钮作用于当前 `selectedDay`，切换 Day 后自动跟随。
- [x] 5.3 确认弹窗不进入 PDF/图片导出 DOM；既有导出用例保持绿。

## 6. E2E 夹具与用例

- [x] 6.1 `scripts/seed-e2e-attractions.mjs` 新增 `e2e-route-b`、`e2e-route-c` 两个含坐标的景点夹具（`maxPetsPerPerson: 0`）；不得修改 `e2e-zhu-b`/`e2e-zhu-c` 的 null 坐标。
- [x] 6.2 在 `e2e/day-route-planning.spec.ts` 实现假 AMap 注入：`Map`/`plugin`/`Driving`/`Walking`/`Polyline`/`Text`/`Marker` 最小实现、`window.__routeResults` 队列、`data-testid` DOM 输出与调用记录。
- [x] 6.3 完成绘制与标注用例：Day 2 弹窗、3 标记 2 折线、`1.2 公里 · 20 分钟`、`850 米 · 2 分钟`、Driving/Walking 各一次、同 POI 仅一次算路。
- [x] 6.4 完成降级与空态用例：缺坐标、单段失败、无 Key、当天 0 地点、单地点；均断言不发/少发算路且其他内容可用。
- [x] 6.5 完成只读与反向用例：打开/关闭期间无 `PUT /api/trips`；导出回归；无 Weather/Transfer/Riding 插件；`image-export-surface` 不含路线标签。

## 7. 验证

- [x] 7.1 `cd apps/server && ./mvnw test`（Windows `mvnw.cmd`）全绿。
- [x] 7.2 `npm run test -w apps/web`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build` 全绿。
- [x] 7.3 `npm run test:e2e -- e2e/day-route-planning.spec.ts` 与全量 `npm run test:e2e` 全绿。
- [x] 7.4 `npx --no-install openspec validate 2026-11-18-add-day-route-planning --strict` 通过。

## 8. 规格与文档同步

- [x] 8.1 复核 `specs/trip-itinerary/spec.md`、`specs/location-management/spec.md` 与实现口径一致；如有调整同步 proposal/design。
- [x] 8.2 `docs/knowledge/interfaces/http-api.md` 补 `GET /api/locations/{poiId}` 的 `longitude`/`latitude` 可空字段。
- [x] 8.3 如实现中新增测试夹具或状态文案，回写 `atdd-design.md` 与 `design.md`，保持工件一致。
