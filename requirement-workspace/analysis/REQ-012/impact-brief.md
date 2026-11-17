# REQ-012 Impact Brief — 行程景点锚点与 5km 附近筛选

- 生成日期：2026-11-17
- 上游需求：[REQ-012 行程景点锚点与 5km 附近筛选](../../requirements/REQ-012-nearby-location-filter.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：锚点固定为激活行程中已按天排期的景点；5km 筛选仅作用于餐厅和酒店；酒店默认列表并在“离景点最近”下拉中选锚点；餐厅未选锚点时门禁；5km 内已加入行程的地点照常显示；结果按距离升序并显示距离；固定 5km，Haversine 直线距离；无 schema 迁移，新增 V20 珠海测试数据种子。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-012 | 行程景点锚点与 5km 附近筛选 | ready-for-spec | `requirements/REQ-012-nearby-location-filter.md` |

阻塞开放问题：0；DoR BLOCKER：0；非阻塞未决项：2（5km 是否可配置、多景点距离口径，均已 deferred 到上游或后续需求）。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-attractions/spec.md`：地点浏览页以激活行程城市为上下文、类型筛选、宠物友好筛选、加入行程/未排期、详情弹窗。
- `openspec/specs/location-management/spec.md`：已保存地点、类型目录与管理端行为。
- `openspec/changes/unify-location-browsing/`：共享 `GET /api/locations`、类型目录、用户/管理复用；该 change 已完成任务但尚未归档，本需求需在其 delta 之上叠加。

**当前后端实现**

- `apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java`：`GET /api/locations/types`、`GET /api/locations`、`GET /api/locations/{poiId}`。
- `LocationQueryService.java`：区域校验、分页参数校验、`petFriendlyOnly` 过滤。
- `LocationQueryResponses.java`：`LocationSummary` 已包含 `longitude`/`latitude`；`LocationDetail` 不包含坐标。
- `PawtripLocationRepository.java`：`findLocationPage` 原生分页查询，按区域前缀、类型、宠物友好过滤，`ORDER BY id ASC`。
- `apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql`：`longitude REAL`、`latitude REAL`，允许 `NULL`。
- 种子数据：`V19__seed_zhuha_locations.sql` 导入 873 条珠海地点，开发库坐标齐全。

**当前前端实现**

- `apps/web/src/routes/_authenticated/attractions/index.tsx`：类型单选（默认景点）、宠物友好/显示全部地点、分页、地点卡片与详情弹窗。
- `apps/web/src/queries/locations.ts`：`LocationListParams`、查询 key 与 URL 参数；当前只有 `regionCode`、`typeGroup`、`petFriendlyOnly`、分页。
- `apps/web/src/lib/trip/types.ts`：行程计划只保存 `poiId`；`cache.locations` 保存地点详情。
- `apps/web/src/components/trip/trip-panel.tsx`：按 `poiId` 拉取地点详情并缓存名称与 `typeGroup`。
- `apps/web/src/routes/_authenticated/attractions/-location-card.tsx`：卡片已显示“第 N 天”标识与政策 tag。

**测试与夹具**

- `apps/server/src/test/java/com/pawtrip/server/location/`：地点查询 API 测试。
- `e2e/attraction-pet-rules.spec.ts`：地点浏览类型筛选、详情、加入行程。
- `scripts/seed-e2e-attractions.mjs`：E2E 地点夹具；当前所有地点经纬度写入 `NULL`，且没有餐厅夹具。
- `scripts/run-e2e.mjs`：启动测试服务、迁移和种子。

**上游业务输入**

- GitHub issue #20（US-12 宠物友好食宿推荐与选择）：先选景点后推荐食宿；多景点距离口径仍为开放问题。
- GitHub issue #27（US-08 宠物友好酒店筛选）、#28（US-17 宠物友好餐厅筛选）：宠物友好筛选已由现有政策字段承接。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `GET /api/locations` | 支持区域、类型、`petFriendlyOnly`、分页 | 增加可选 `nearPoiId`；锚点校验、5km 过滤、距离排序、过滤后分页 |
| `LocationSummary` | 已含经纬度、政策、游玩时间 | 增加可空 `distanceMeters`；仅在请求带 `nearPoiId` 时有值 |
| `LocationQueryService` | 区域校验、分页校验、数据库分页 | 增加锚点解析、Haversine 计算、距离过滤与排序；过滤后分页 |
| `PawtripLocationRepository` | `findLocationPage` 返回分页 | 增加按区域/类型/宠物友好读取候选集合的查询，供距离过滤使用；原分页查询保留 |
| 数据库 | `longitude`/`latitude` 可空 | **不变**；不新增列或迁移 |
| 前端查询 | `LocationListParams` 无距离参数 | 增加 `nearPoiId`；查询 key 包含该参数；仅餐厅/酒店在已选锚点时传入 |
| 地点浏览页 | 类型、宠物友好、分页 | 酒店类型下默认列表 + “离景点最近”下拉；景点类型下保留锚点选择器；餐厅门禁空态；距离筛选、距离展示、页码重置 |
| 锚点候选 | 不存在 | 从激活行程 `plan.days[].stops` 与地点详情缓存派生，仅 `typeGroup=attraction`，按 `poiId` 去重 |
| 行程面板/缓存 | 拉取所有 stop 详情并缓存 | 复用；不改变行程计划结构 |
| 测试 | API、查询、E2E 夹具无坐标/无餐厅 | API 距离与锚点测试；前端查询/门禁/候选单测；E2E 夹具补经纬度与 5km 内/外餐厅、酒店 |
| Living Spec | `trip-attractions` 已被 `unify-location-browsing` 修改 | 新增 delta：酒店下拉/默认列表、餐厅门禁、5km 筛选、查询契约；不改 `location-management` |
| 文档 | 地点浏览与地点 API 说明 | 更新 `docs/knowledge/architecture/README.md`（可选接口说明） |

## 4. Blast radius

- **直接受影响**：用户地点浏览页、共享地点列表接口、前端地点查询、地点 API 测试与 E2E 夹具。
- **不受影响**：管理端地点管理页面与写入 API、高德候选搜索、认证与角色、CSRF、Problem Details、数据库 schema 与迁移、行程计划结构、行程保存、宠物档案、目的地选择、交通规则页。
- **运行拓扑**：不变；浏览器 → Vite `/api` 代理 → Spring Boot → SQLite。距离在既有查询中计算，不新增外部服务。

## 5. Artifact impact

- **Specs**：修改 `trip-attractions` 一个 capability；`location-management` 无需求变更（仅共享接口增加可选参数，管理端不传）。
- **Tests**：后端 API 测试、前端查询/组件单测、Playwright E2E 需要新增或更新。
- **Docs / KB**：地点 API 与浏览页说明需要补充 `nearPoiId`、距离字段与门禁行为。
- **OpenSpec**：新建 `add-nearby-location-filter` change 包，包含 proposal、design、delta spec、tasks。
- **Gate**：P1/P2 工件产出后需人工 G1 评审；本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：一个 change 覆盖后端距离查询、前端锚点/门禁/展示与测试；不拆成“后端 change + 前端 change”，否则会出现接口已改但页面不可用的中间态。
- **Agile**：可拆为“酒店默认列表+下拉”“餐厅门禁”“5km 过滤与距离展示”三个薄故事，但共享同一查询契约，建议单 change 交付。
- **依赖顺序**：先让后端支持可选 `nearPoiId` 并保持旧行为，再接入前端；`unify-location-browsing` 的共享列表接口是前置基线。
- **上游边界**：US-12 的多景点距离聚合与自动食宿推荐不在本 change；US-08/US-17 的宠物友好筛选继续复用。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 坐标系一致性 | 高德 POI 为 GCJ-02；锚点与候选来自同一数据源，不混用 WGS84；不引入第三方地理编码 |
| 风险 R2 | 坐标为 `NULL` | 数据库允许为空；候选 null 排除，锚点 null 返回校验错误；E2E 夹具当前全为 null，必须补坐标 |
| 风险 R3 | 距离过滤改变分页 | 现有分页按 `id ASC`；带距离筛选时改为距离升序且总数基于过滤后集合；测试覆盖页码、总数、排序 |
| 风险 R4 | 锚点名称解析 | 行程只存 `poiId`；复用详情查询与缓存，加载完成前不可选；失败时该候选不出现 |
| 风险 R5 | 跨城锚点 | 行程允许加入其他城市地点；选中后 5km 内结果可能为空；空态需说明“该锚点附近暂无匹配地点” |
| 风险 R6 | 与未归档 change 叠加 | `unify-location-browsing` 已完成但未归档；本 change 的 `trip-attractions` delta 需基于其统一后的列表能力，归档顺序需协调 |
| 风险 R7 | 入口位置 | 用户已把景点加入行程但仍看到门禁，容易把“加入行程”误解为“选锚点”；酒店改为默认列表 + “离景点最近”下拉，餐厅门禁文案明确提示回景点页选择 |
| 风险 R8 | 数据规模 | 当前每城每类型数百条；服务端在区域/类型/宠物友好集合上做距离过滤；若数据量显著增长再考虑 SQL 下推或空间索引 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`add-nearby-location-filter`。
- 理由：酒店下拉、餐厅门禁、距离过滤和距离展示共享同一查询契约与同一页面状态；拆分会造成接口与页面不同步。
- 规模预估：S–M；无 schema 迁移、无管理端 UI、无新依赖；V20 仅追加珠海测试数据。
- 依赖：`unify-location-browsing` 提供的共享 `GET /api/locations` 与类型目录。
