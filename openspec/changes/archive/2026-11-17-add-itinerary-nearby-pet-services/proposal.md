# Proposal

## Why

用户在行程单确定当天景点后，仍需要临时跳转地点浏览页查找宠物医院与用品店；同时宠物医院/用品店被“宠物友好”筛选隐藏，未配置 `maxPetsPerPerson` 的基础服务会直接消失。把同城最近服务放进景点卡片，并让医院/用品店始终可见，可减少行程中的查找成本（REQ-015，2026-11-17 用户诉求，PR #75）。

## What Changes

- 新增 `GET /api/locations/{poiId}/nearby-services`：以景点 POI 的 `region_code` 定位同城范围，返回直线距离最近的宠物医院与宠物用品店各至多 1 家；含 `poiId`、`name`、`address`、`distanceMeters`、`openingHours`。距离使用 Haversine 直线距离，并列按地点 ID 升序；**不应用 5km 距离筛选，也不应用宠物友好筛选**。
- 营业时间读取高德快照 `business_json.opentime_week`，缺失时回退 `opentime_today`，都缺失返回 `null`，前端显示“暂无”。
- 行程单景点卡片在“详细携宠政策”折叠区之后新增“附近宠物服务”折叠栏目，默认收起；展开时才请求接口，展示加载/空/错误态。距离显示“距{景点名}约 X.Xkm”（一位小数），地址缺失显示“地址未收录”。景点缺经纬度时展示“暂无附近宠物服务”，不阻塞卡片其他内容。
- 宠物医院与宠物用品店不应用宠物友好筛选：共享地点列表与地图查询对这两类始终返回当前城市全部已保存地点，并隐藏“显示全部地点”开关；医院/用品店未配置宠物规则时，卡片徽章显示“不限宠物”、逐宠物 tag 为“友好”、政策区显示“允许所有宠物，无额外限制”、地图 chips 显示“允许所有宠物”。
- 行程条目派生新增 `poiId`，供卡片发起附近服务查询。
- 无数据库迁移、无新依赖；管理端接口与写入能力不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`
  - **ADDED**「行程景点附近宠物服务」：行程单景点卡片的折叠栏目、同城最近医院/用品店接口契约、距离与营业时间规则、空/错误/无坐标降级。
  - **MODIFIED**「景点列表政策字段与逐宠物 tag」：明确宠物医院与宠物用品店不应用宠物友好筛选、不展示“显示全部地点”开关，未配置规则时展示“不限宠物/友好”。
  - **MODIFIED**「餐厅的选择门禁」：未选锚点时医院/用品店既不应用宠物规则筛选，也不应用距离筛选。

## Impact

- **后端**：`LocationQueryController` 新增 `/{poiId}/nearby-services`；`LocationQueryService` 新增同城最近服务计算；`LocationQueryResponses` 新增响应记录；`PawtripLocationRepository` 的 `petFriendlyOnly` 条件豁免医院/用品店；`LocationTypeCatalog` 常量提取。
- **前端**：行程单挂载 `NearbyPetServices`；`queries/locations.ts` 新增类型与查询；`lib/trip/itinerary.ts` 暴露 `poiId`；`lib/attraction-pet-rules.ts` 与 `lib/trip/policy-match.ts` 新增免筛选与未配置判定；地点浏览页、卡片、详情弹窗、地图卡片调整筛选与文案。
- **数据库与依赖**：零迁移、零新依赖；只读 `pawtrip_location`、`location_photo`、`business_json` 快照。
- **测试**：后端 `LocationQueryApiTest` 覆盖免筛选、最近服务、无坐标与 404；前端 vitest 覆盖组件、纯函数与查询；CI E2E 全量回归。
- **文档**：Living Spec 尚无“行程景点附近宠物服务”要求，本 change 以 ADDED 落地；医院/用品店免筛选已在 Living Spec，以 MODIFIED 对齐。
