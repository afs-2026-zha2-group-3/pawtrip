# Proposal

## Why

用户确定当天景点后，仍只能按整座城市浏览餐厅和酒店，无法判断哪些食宿地点在景点附近。现有地点表已保存经纬度，列表接口也返回坐标，在此基础上增加“以行程景点为锚点的 5km 附近筛选”，可以把“先选景点、再安排食宿”的规划顺序落到现有地点浏览页，减少跨区域选择。

## What Changes

- 在酒店类型下新增“离景点最近”下拉：候选只来自激活行程中已按天排期的景点，按 `poiId` 去重，支持清除；未排期景点与其他类型不参与。酒店列表默认展示，选择锚点后按 5km 过滤。
- 在景点类型下保留“行程景点锚点”选择器，供餐厅筛选使用；餐厅未选锚点时保留“请先在景点页选择行程景点”的门禁空态且不请求列表；酒店下拉与景点页选择器共用同一锚点。
- 共享地点列表接口 `GET /api/locations` 增加可选 `nearPoiId`：按锚点与候选的经纬度计算 Haversine 距离，仅返回 `≤5km` 的地点，按距离升序、距离相同按既有稳定顺序，并在过滤后分页。
- 距离筛选结果增加 `distanceMeters`；列表卡片显示“距{锚点名}约 X.Xkm”（一位小数）。
- 距离筛选与激活行程城市、地点类型、宠物友好/显示全部地点条件叠加；5km 内已加入行程的餐厅/酒店照常显示。
- 锚点景点被移出行程或激活行程变化时自动清空锚点；酒店恢复默认全量列表，餐厅恢复门禁；无坐标候选排除，锚点无坐标时提示且不发起查询。
- 本轮只做列表与锚点下拉功能；地图、小型犬/大型犬/低押金/免清洁费/搜索、卡片视觉与评分/押金字段暂不做。
- 不新增数据库列或 schema 变更；新增 V20 珠海测试酒店/餐厅数据种子用于本地验证；不改变行程计划结构、管理端地点管理、高德搜索或认证授权。

## Non-Goals

- 不实现自动推荐、评分、多景点距离聚合或食宿排序策略。
- 不引入地图 SDK、地图弹窗/右侧地图联动、用户定位、驾车距离、路径规划或高德周边搜索。
- 不做小型犬/大型犬/低押金/免清洁费/搜索等筛选 chips，不做卡片视觉与评分/押金字段改造。
- 不新增数据库列或 schema 变更，不新增地点类型。
- 不改变行程 `TripPlan` 结构、行程保存方式或已加入地点的展示规则。
- 不持久化锚点（不写 `sessionStorage`/`localStorage`/服务端），不保存用户偏好。
- 不修改管理端地点管理、高德候选搜索与地点写入行为。
- 不提供在线订座、酒店预订或价格比较。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`：地点浏览页新增酒店默认列表与“离景点最近”下拉、景点页锚点选择、餐厅门禁、5km 距离筛选、距离排序与展示，以及共享地点列表接口的可选 `nearPoiId` 查询契约。

## Impact

- **后端 API**：`GET /api/locations` 增加可选 `nearPoiId`；响应摘要增加可空 `distanceMeters`；锚点非法时返回 `400 VALIDATION_ERROR`。未提供该参数时保持既有行为。
- **后端实现**：`LocationQueryController`、`LocationQueryService`、`LocationQueryResponses`、`PawtripLocationRepository`；距离在服务端计算，不调用高德。
- **前端**：地点浏览页 `apps/web/src/routes/_authenticated/attractions/`、地点查询 `apps/web/src/queries/locations.ts`、行程地点缓存/选择器；复用现有 shadcn/ui 组件与 TanStack Query。
- **测试与夹具**：新增地点 API 距离与锚点校验测试、前端查询/候选单测、酒店下拉与餐厅门禁 E2E；E2E 地点夹具需补经纬度与 5km 内/外餐厅、酒店。
- **数据库与依赖**：不新增 schema 迁移或依赖；`longitude`/`latitude` 维持可空；V20 为珠海测试数据种子。
- **前置基线**：依赖 `unify-location-browsing` 提供的共享 `GET /api/locations` 与类型目录；该 change 已完成并已随 origin/main 归档，本 change 的 delta 在其 Living Spec 之上叠加。
