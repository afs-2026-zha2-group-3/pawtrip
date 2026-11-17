# ATDD Design — add-nearby-location-filter

- 日期：2026-11-17
- 上游：`specs/trip-attractions/spec.md`（4 个 ADDED Requirement / 27 个 Scenario）、`dov-ac-review.md`、`design.md`、`tasks.md`
- 补录说明：本文件在 P4 实现完成后补齐 P3 记录，场景编号与仓库现有测试一一对应；不改变已确认的 Delta Spec 与设计决策。

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `@SpringBootTest` + `@AutoConfigureMockMvc` + 独立 SQLite；`apps/server/src/test/java/com/pawtrip/server/location/LocationQueryApiTest.java` | `GET /api/locations` 的 `nearPoiId`、距离过滤、排序、过滤后分页、锚点校验与回归 |
| E2E | Playwright，`e2e/nearby-location-filter.spec.ts`；真实后端 + 临时 E2E SQLite + 种子脚本 | 用户可见路径：添加景点到行程 → 选锚点 → 餐厅门禁/酒店默认 → 5km 过滤 → 距离文案 → 清理锚点 |
| Defer UT | Vitest：`apps/web/src/lib/distance.test.ts`、`apps/web/src/lib/trip/anchors.test.ts`、`apps/web/src/queries/locations-browsing.test.ts` | 距离格式化、锚点候选派生、查询 key/URL 与地图点位分页合并 |

NFR 测试：需求方在 REQ-012 未提出 SLA、并发或可观测性要求，本期 **不纳入** NFR 测试；性能边界（单城单类型数百条内存过滤）记录在 `design.md` Risks，数据量显著增长时再评估。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 对应用例 | 依据 |
|---|---|---|---|---|
| A1 | 5km 内过滤、远处排除、无坐标排除、距离升序、`distanceMeters` 数值与 `totalElements`（5km 筛选/API） | API | `nearbyFilterReturnsOnlyLocationsWithinFiveKmSortedByDistance` | 单端点 body 契约 |
| A2 | 与宠物友好筛选叠加；`pageSize=1` 时 `totalElements`/`hasNext`/`hasPrevious` 基于过滤后结果（筛选 + 分页/API） | API | `nearbyFilterCombinesWithPetFriendlyFilterAndPagination` | 分页契约 |
| A3 | 酒店类型可用；锚点不存在、非景点、无坐标返回 `400 VALIDATION_ERROR`（锚点校验/API） | API | `nearbyFilterSupportsHotelsAndRejectsInvalidAnchors` | 状态码契约 |
| A4 | 未带 `nearPoiId` 时 `distanceMeters` 为 `null` 或省略，既有列表行为不变（回归/API） | API | `databaseListOmitsDistanceMetersWithoutAnchor` | 向后兼容 |
| A5 | Haversine 同点为 0；约 5000m 偏移计算正确（距离函数） | API | `haversineDistanceIsMetersAndHandlesBoundaryOffset` | 距离边界 |
| A6 | 未认证请求列表 → 401（权限/回归） | API | 既有 `unauthenticatedRequestsReturn401` | Problem Details |
| A7 | 列表不调用高德（反向/API） | API | 既有 `verifyNoInteractions(placeSearchPort)` 用例 | 只读数据库 |
| A8 | 既有区域/类型/`petFriendlyOnly`/分页/非法参数回归 | API | `LocationQueryApiTest` 既有用例 | 既有契约 |
| E1 | 未选锚点切餐厅 → 门禁空态、无餐厅请求；切酒店 → 默认列表、下拉禁用提示（门禁/默认列表） | E2E | `requires an anchor before browsing restaurants but shows hotels by default` | UI + 网络 absence |
| E2 | 餐厅 5km 过滤、排序、距离文案；“显示全部地点”后远端仍排除（5km/排序） | E2E | `filters restaurants to 5km around the selected scheduled attraction` | UI 可见 + 过滤 |
| E3 | 酒店默认全量；选择“离景点最近”后只显示 5km 内酒店、距离文案；切餐厅共用锚点（下拉/共用） | E2E | `filters hotels by 离景点最近 and shares the anchor with restaurants` | 跨类型状态 |
| E4 | 锚点景点被移出行程后自动清空，餐厅恢复门禁（失效清理） | E2E | `clears the anchor and restores the gate when the anchor leaves the trip` | 跨页面状态 |
| E5 | 行程中没有已排期景点时，景点页选择器与酒店下拉禁用并提示（无候选） | E2E | `disables the anchor controls when no attraction is scheduled` | UI 禁用态 |
| E6 | 5km 内已加入行程的餐厅仍显示并保留“第 1 天”（已加入地点） | E2E | `keeps an already-added nearby restaurant in the result` | UI 可见 |
| E7 | 未选锚点时宠物医院/宠物用品店不受门禁、不应用距离筛选（门禁边界） | E2E | `does not gate pet hospitals or pet supplies without an anchor` | absence 断言 |
| E8 | 锚点无坐标 → 明确提示“该景点缺少坐标，无法计算距离”；清除后恢复酒店列表（坐标缺失） | E2E | `shows a clear error when the hotel anchor has no coordinates` | UI 错误态 |
| E9 | 清除锚点后餐厅恢复门禁（清除路径） | E2E | `clears the anchor and restores the restaurant gate` | UI + 网络 absence |
| E10 | 未配置高德 JS Key 时地图占位、列表可用（地图 change 的降级场景） | E2E | `shows the map placeholder when the AMap JS key is not configured` | UI 占位 |

未直接自动化、由代码审查覆盖的场景：

| 场景 | 原因 | 证据 |
|---|---|---|
| 景点页选择/清除锚点后景点列表不变 | `nearPoiId` 仅在酒店/餐厅传入 | `attractions/index.tsx` 的 `nearbyType` / `nearbyAnchorPoiId` |
| 激活行程切换后清空锚点 | 依赖行程 ID 变化的 `useEffect`，现有 E2E 未切换激活行程 | `attractions/index.tsx` 行程切换 effect |
| 同一景点出现在多天时去重、`unscheduled` 排除 | 已由单测覆盖规则，E2E 只覆盖单天 | `anchors.test.ts` |
| 恰好 `5000m` 的 API 过滤边界 | 当前无恰好 5000m 候选夹具 | 见 `dov-ac-review.md` 残余风险 |

## 3. 先于生产代码编写（red 顺序）

P3 设计约定以下顺序；P4 已按此落地：

1. **A1–A5 先红**：在 `LocationQueryApiTest` 先写距离过滤、排序、分页、锚点校验与距离函数断言 → 驱动 `nearPoiId` 参数、Haversine、候选集合查询与 `distanceMeters`。
2. **A6–A8 回归先红**：确认未认证、既有筛选与不调用高德行为不变。
3. **Defer UT 先红**：`distance.test.ts`、`anchors.test.ts`、`locations-browsing.test.ts` 覆盖纯函数与查询契约 → 驱动 `distance.ts`、`anchors.ts`、`locations.ts`。
4. **E1–E9 先红**：先写“添加景点 → 选锚点 → 门禁/默认列表 → 5km → 距离文案 → 清理”断言 → 驱动地点页状态与 UI。
5. **E10 随地图 change**：无 Key 占位，证明距离筛选不依赖地图 SDK。

## 4. 本地 vs CI 门禁

- 后端：`cd apps/server && ./mvnw test`
- 前端：`npm run test -w apps/web`、`npm run build`
- E2E：`CI=true npm run test:e2e`（可指定 `e2e/nearby-location-filter.spec.ts e2e/attraction-pet-rules.spec.ts e2e/trips-panel.spec.ts --workers=1`）
- CI：既有 GitHub Actions（Server tests / Web build / Browser E2E）；任一失败阻断
- 回归：`attraction-pet-rules.spec.ts`、`trips-panel.spec.ts` 与既有点地点 API 测试必须保持绿

## 5. 数据 / fixtures 策略

**API 层**

- 每个测试类独立 SQLite；`@BeforeEach` 清空地点与照片表。
- 珠海夹具包含：锚点景点（`113.5, 22.1`）、0/无坐标/不同区域景点、酒店、餐厅（距离约 50m / 200m / 5km 外 / 无坐标）。
- `placeSearchPort` 使用 `@MockitoBean`，用于“不调用高德”断言；不 mock 数据访问。

**E2E 层**

- `scripts/seed-e2e-attractions.mjs` 写入确定性 `poi_id`（`e2e-*`）与经纬度：
  - 锚点景点“情侣路”`113.5, 22.1`；无坐标景点“无坐标景点”。
  - 餐厅：`e2e-restaurant-close`（约 56m，非宠物友好）、`e2e-restaurant-near`（约 222m）、`e2e-restaurant-far`（约 6.7km）、`e2e-restaurant-null`（无坐标）。
  - 酒店：`e2e-zhu-hotel`（约 0.6km）、`e2e-hotel-near`（约 0.7km）、`e2e-hotel-far`（约 6.7km）。
- 脚本只操作临时 E2E 库，不触碰 `apps/server/data/pawtrip.db`；重复执行按 `poi_id` 覆盖。
- V23/V24 为开发库珠海测试酒店/餐厅数据，V24 将坐标修正为真实 POI 坐标；不属于 schema 变更。

## 6. Non-goals 与反向验证

| Non-goal | 反向用例 | 层 |
|---|---|---|
| 自动推荐/评分/多景点聚合排序 | 代码审查：无推荐接口、无评分字段、单锚点参数 | 审查 |
| 地图/定位/驾车距离/路径规划 | 本 Delta 无地图 requirement；地图由独立 change | 审查 |
| 新增数据库列/迁移 | 代码审查：无 schema migration；V23/V24 仅数据种子与坐标修正 | 审查 |
| 锚点持久化 | E2E 重新进入页面不保留；代码审查：`useState` | E2E + 审查 |
| 改变管理端/AMap/认证行为 | A6–A8 回归；管理端测试保持绿 | API |
| 距离筛选作用于景点/宠物医院/用品店 | E7 + 代码审查：`nearbyType` 仅 hotel/restaurant | E2E |
| 排除已加入行程的地点 | E6 | E2E |

## 7. NFR 测试

不纳入。REQ-012 未提出性能、并发或可观测性验收；固定 5km、单城单类型内存过滤的可接受性记录在 `design.md` Risks。

## 8. Defer UT 清单（apply 期 TDD）

- `formatDistanceKm`：米 → 一位小数公里（0、56、560、2224、5000）。
- `scheduledPoiIds` / `attractionAnchors`：按 `poiId` 去重、排除 `unscheduled`、只保留已加载详情的景点、无激活行程返回空。
- `locationsQueryOptions` / `mapLocationsQueryOptions`：`nearPoiId` 进入 query key 与 URL；地图点位 `pageSize=100` 循环取完所有分页。
