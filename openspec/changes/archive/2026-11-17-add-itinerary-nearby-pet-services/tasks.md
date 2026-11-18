# Tasks

> 说明：本 change 为 PR #75 的补登记；以下任务均已由提交 `f160d71` 实现并验证，复选框按实际完成状态勾选。

## 1. 后端附近服务接口

- [x] 1.1 `LocationQueryController` 新增 `GET /api/locations/{poiId}/nearby-services`，返回 `NearbyServices`。验证：`LocationQueryApiTest.nearbyServicesReturnNearestHospitalAndSuppliesWithOpeningHours`。
- [x] 1.2 `LocationQueryService` 实现同城最近服务：区域城市级范围、Haversine 距离、按距离再按地点 ID 取最小、类别无结果返回 `null`。验证：同一测试断言最近医院/用品店与距离。
- [x] 1.3 景点经纬度缺失返回两个 `null`；未知 POI 返回 404。验证：`nearbyServicesReturnNullsWithoutAnchorCoordinates`、`nearbyServicesForUnknownPoiReturn404`。
- [x] 1.4 营业时间 `opentime_week` 优先、`opentime_today` 回退。验证：测试夹具分别覆盖两种字段与断言值。

## 2. 后端筛选豁免

- [x] 2.1 `PawtripLocationRepository` 的分页、列表与地图查询在 `petFriendlyOnly=1` 时豁免 `pet-hospital` / `pet-supplies`。验证：`petFriendlyFilterDoesNotHideHospitalsOrSupplyStores`。
- [x] 2.2 `LocationTypeCatalog` 提取医院/用品店类型键常量，避免魔法字符串。验证：`LocationQueryApiTest` 全绿。

## 3. 前端附近服务

- [x] 3.1 `queries/locations.ts` 新增 `NearbyPetService`、`NearbyPetServices`、query key 与 `nearbyPetServicesQueryOptions`。验证：`locations-browsing.test.ts`。
- [x] 3.2 `lib/trip/itinerary.ts` 为 stop 条目暴露 `poiId`。验证：`itinerary.test.ts`。
- [x] 3.3 新增 `components/trip/nearby-pet-services.tsx`：折叠、展开懒加载、加载/空/错误态、距离/地址/营业时间文案。验证：`nearby-pet-services.test.tsx`。
- [x] 3.4 行程单景点卡片在“详细携宠政策”后挂载组件。验证：`npm run build` 与服务端渲染构建通过。

## 4. 前端筛选豁免与政策展示

- [x] 4.1 `attraction-pet-rules.ts` 新增 `petRulesApplyTo`、`isPetPolicyConfigured`。验证：`attraction-pet-rules.test.ts`。
- [x] 4.2 `policy-match.ts` 新增 `matchLocationPolicyForType`，免筛选类型未配置政策时返回 `friendly`。验证：`policy-match.test.ts`。
- [x] 4.3 地点浏览页对医院/用品店不传 `petFriendlyOnly`、隐藏“显示全部地点”开关与提示、调整空态与计数。验证：`npm run build` + 类型检查。
- [x] 4.4 卡片、详情弹窗、地图卡片传入 `typeGroup`；徽章“不限宠物”、政策区“允许所有宠物，无额外限制”、地图 chips 文案。验证：`npm run build`；组件文案由纯函数测试与实现审查覆盖。

## 5. 集成验证

- [x] 5.1 后端 `mvn -f apps/server/pom.xml clean test`：233 tests，0 failures / 0 errors。
- [x] 5.2 前端 `npm run test -w apps/web`：28 files / 207 tests 通过；`npm run build` 成功。
- [x] 5.3 PR #75 CI 全绿：Server tests、Web build、Browser E2E 均通过。
- [x] 5.4 `openspec validate "2026-11-17-add-itinerary-nearby-pet-services" --strict` 通过（P2/P3 补登记后复核）。
