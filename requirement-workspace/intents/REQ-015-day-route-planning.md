# REQ-015 原始意图：行程单当天路线规划

> 来源：用户对话诉求（2026-11-18）。编号 REQ-015（REQ-014 之后顺延）。分支 `feat/day-route-planning`（自 main `448e74c` 拉取）。

## 用户原话

1. 「拉取一个新的分支 实现路线规划功能」
2. 「在行程单页面 Day1 Day2等日期旁边加一个按钮 查看当天路线规划 调用高德api将选择的地点用折线连起来 将距离和根据行程单上的时间显示在对应的折线上面」
3. 「如果在地图右上角显示当天的天气 可以吗 超出可查询日期天气的就不显示」
4. 「不做天气了」

## 需求澄清（2026-11-18 对话确认）

- 入口位置：`/itinerary` 行程单页，`Day 1 … Day N` 标签行右侧新增「查看当天路线规划」按钮，作用于当前选中的天。
- 展示形式：点击后打开弹窗，弹窗内为地图；不内嵌到时间线，不改变页面布局。
- 路线内容：按行程单当天地点顺序绘制编号标记；相邻两个不同地点之间按该段交通方式调用高德 JS 路线规划，并以折线绘制。
- 标注内容：每段折线显示距离与时长；距离取高德算路结果，时长优先取行程单已保存的 `toNextEstimate.durationMinutes`，无快照时用高德算路秒数向上取整为分钟。
- 天气：明确不做（用户 2026-11-18 决定），弹窗右上角不展示天气，也不引入天气依赖。
- 只读：不改变行程计划、不写库、不触发保存；导出 PDF/图片不包含路线弹窗内容。

## 现状（代码证据，2026-11-18 调查）

- 行程单页：`apps/web/src/routes/_authenticated/itinerary.tsx`，`selectedDay` 状态、`Tabs`/`TabsTrigger` 渲染 `Day N`，`DayDetail` 与 `TransportEntry` 展示时间线与交通段。
- 行程数据：`TripPlan { version:1, days[], unscheduled[] }`；`TripStop { poiId, toNext?, toNextEstimate? }`；`toNext` 枚举 `walk | drive | transit | self_drive`；`displayToNext` 把 `transit` 归一为 `drive`/`self_drive`。
- 交通估算：`TripStop.toNextEstimate` 已含 `durationMinutes`、`costLowYuan`、`costHighYuan`；前端已有交通段构建与估算查询先例。
- 坐标：坐标**不在 `trip` 表**，也不在 `plan_json` 的 stop 上；坐标保存在 `pawtrip_location`（`V4__create_location_management_tables.sql` 的 `longitude REAL`、`latitude REAL`），实体 `PawtripLocation` 已有对应字段。
- 用户端地点详情：`GET /api/locations/{poiId}` 的 `LocationDetail` 当前只有政策、封面、评分、keytag、商圈、营业时间、电话，**未下发经纬度**；行程单在 `itinerary.tsx` 中已通过 `locationBrowseDetailQueryOptions(poiId)` 缓存地点详情。
- 地图能力：`apps/web/src/lib/amap/loader.ts` 已封装高德 JS API 2.0 加载与 Map/Marker/InfoWindow；`attractions/-location-map.tsx` 有地图、标记与缺 Key 降级先例；loader 目前**未暴露 `AMap.plugin` 与路线/折线类型**。
- 迁移现状：现有最新迁移为 V17/V18/V20（trip 相关）与 V4/V25（location 相关）；本需求不改 schema。

## 用户已决口径（2026-11-18）

1. **入口**：Day 标签行右侧按钮，作用于当前选中天。
2. **展示**：弹窗 + 地图；弹窗标题含天数，有开始日期时同时显示该天日期。
3. **路线方式**：跟随行程单该段交通方式；`walk` 用步行路线，`drive` 与 `self_drive` 用驾车路线；相邻同 `poiId` 不算路。
4. **标注**：折线标注距离与时长；时长快照优先，无快照时高德秒数向上取整。
5. **坐标来源**：用户端地点详情新增可空 `longitude`/`latitude`，只读数据库，不调用高德；不在行程表新增坐标列。
6. **不做天气**：无天气接口、无天气 UI、无日期可查询性判断。
7. **不做计划变更**：不改 `plan_json`、不写后端、不导出路线视图。
8. **降级**：缺坐标、缺 Key、单段失败均非阻塞提示，不伪造直线或距离；当天无地点/只有一个地点有明确空态。

## 方案取舍记录

- A（选定）弹窗内高德 JS 路线规划 + 自定义折线：复用现有地图加载与布局，不新增后端路线 API，交互边界清晰。
- B 内嵌地图到时间线：改变行程单布局与打印导出，样式与性能风险大，放弃。
- C 后端代算路线并返回折线：新增服务端依赖与契约，前端已有 JS Key 能力，收益不足，放弃。
- D 不做路线只画直线：无法满足「调用高德 API」与真实距离时长要求，放弃。
