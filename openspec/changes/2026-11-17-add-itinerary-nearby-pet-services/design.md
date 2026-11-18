# Design

## Context

动机见 `proposal.md` - Why。实现基线（PR #75，父提交 `ca7f96f`）：

- 后端地点查询由 `LocationQueryService` 只读 `pawtrip_location`；列表/详情已支持区域、类型、宠物友好与锚点距离；仓库层有原生查询与派生查询两套入口。
- `pawtrip_location` 已保存 `longitude`、`latitude`、`region_code`、`type_group`；高德快照 `business_json` 含 `opentime_week`、`opentime_today`。
- 行程条目由 `buildItinerary` 从激活行程与地点详情缓存派生，已有 `poiId` 但未暴露给卡片内容。
- 前端地点浏览页对医院/用品店仍传 `petFriendlyOnly`，并展示“显示全部地点”开关；卡片政策区对未配置规则统一显示“未配置”。
- 约束：零迁移、零新依赖、管理端行为不变。

## Goals / Non-Goals

**Goals**

- 行程单内以一次按需查询展示同城最近医院与用品店，避免行程页初始 N 次请求。
- 医院/用品店在地点浏览页始终可见，筛选语义在前后端一致。
- 让未配置宠物规则的基础服务不被误读为“禁止携宠”。

**Non-Goals**

- 不做电话、导航、地图打点、营业中状态判断。
- 不做多候选、距离阈值配置、按距离排序列表。
- 不实时调用高德；营业时间为已保存快照。
- 不改变行程计划结构、保存格式、数据库 schema 或管理端接口。

## Decisions

### D1 同城范围与“最近”口径

`nearbyServices` 以景点 `regionCode` 前 4 位（`regionLevel="city"`）调用 `findLocations(regionCode, "city", typeGroup, 0)`，在内存中计算 Haversine 距离并取最小者；距离并列按地点 `id` 升序。

- 备选 A：复用 5km 锚点筛选 — 用户明确要求同城最近，5km 会导致周边无服务时栏目空白；弃。
- 备选 B：新增 SQL 距离排序 — SQLite 无内置 Haversine，原生 SQL 复杂且与既有 Java 距离计算重复；同城地点量有限，内存计算更简单；弃。

### D2 响应契约与空值

新增 `NearbyServices(NearbyService hospital, NearbyService supplies)`；`NearbyService` 含 `poiId`、`name`、`address`、`distanceMeters`（取整到米）、`openingHours`。类别无结果、候选无坐标或景点无坐标时返回 `null`；未知 POI 抛 `LOCATION_NOT_FOUND`（404）。

- 备选：返回空数组 — 前端需要区分“未查询/无结果/失败”，固定两字段更直接；弃。

### D3 营业时间回退

`openingHours` 读取 `business_json.opentime_week`，缺失时回退 `opentime_today`，都缺失为 `null`。复用既有 `businessField` 解析，非法 JSON 视同缺失。

### D4 列表筛选豁免

仓库层 `petFriendlyOnly=0 OR type_group IN ('pet-hospital','pet-supplies') OR max_pets_per_person >= 1`，同时作用于 `findLocationPage`、列表与地图查询。前端 `petRulesApplyTo(typeGroup)` 对两类返回 `false`，查询时传 `petFriendlyOnly=false`，并隐藏“显示全部地点”开关与提示。

- 备选：仅前端过滤 — 后端仍会隐藏未配置地点，无法满足“始终可见”；弃。
- 备选：新增独立接口 — 与共享列表契约重复；弃。

### D5 未配置政策的展示

`isPetPolicyConfigured` 统一判定；`matchLocationPolicyForType` 对免筛选类型且未配置政策直接返回 `friendly`。徽章显示“不限宠物”，政策区显示“允许所有宠物，无额外限制”，地图 chips 显示“允许所有宠物”。

- 备选：继续显示“未配置” — 会被用户理解为“状态未知/可能禁止”，与“基础服务始终可用”诉求冲突；弃。

### D6 行程单懒加载

`NearbyPetServices` 使用原生 `<details>`，`onToggle` 更新 `open`；查询 `enabled: open`，默认收起时不请求。展开后展示加载/空/错误三态。

- 备选：行程页预取所有景点服务 — N 个景点 N 次请求，且多数用户不会展开；弃。

### D7 距离与文案

复用 `formatDistanceKm`（一位小数公里），文案“距{景点名}约 X.Xkm”；地址缺失“地址未收录”，营业时间缺失“暂无”。附近服务请求失败不影响政策区与其他卡片内容。

## Risks / Trade-offs

| # | 风险 | 权衡 |
|---|---|---|
| R1 | 只展示各 1 家，较远时价值有限 | 优先保证栏目可用与视线简洁；多候选列入 followups |
| R2 | 营业时间可能过期 | DB-only 是既有约束；实时校验为后续需求 |
| R3 | 同城最近可能跨行政区 | 符合已确认口径；不额外限制区县 |
| R4 | 医院/用品店豁免后可能展示大量未配置地点 | 类型范围有限且用户主动切换；隐藏开关避免误解 |
| R5 | Living Spec 尚无附近服务要求 | 本 change ADDED requirement 在归档时合并 |
