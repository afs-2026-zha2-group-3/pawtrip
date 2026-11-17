---
id: REQ-012
title: 行程景点锚点与 5km 附近筛选
status: ready-for-spec
discovery: Go (2026-11-17)
impact: ../analysis/REQ-012/impact-brief.md
deep_dive: ../analysis/REQ-012/deep-dive.md
sources:
  - ../intents/REQ-012-nearby-location-filter.md
  - apps/web/src/routes/_authenticated/attractions/index.tsx
  - apps/web/src/lib/trip/types.ts
  - apps/web/src/lib/trip/store.ts
  - apps/web/src/queries/locations.ts
  - apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java
  - apps/server/src/main/java/com/pawtrip/server/location/LocationQueryService.java
  - apps/server/src/main/java/com/pawtrip/server/location/PawtripLocationRepository.java
  - apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql
  - openspec/specs/trip-attractions/spec.md
  - openspec/changes/unify-location-browsing/
  - docs/knowledge/architecture/README.md
---

# REQ-012：行程景点锚点与 5km 附近筛选

## Discovery Decision

Go（2026-11-17）。需求边界已通过需求方确认：锚点固定为激活行程中**已按天排期**的景点；5km 距离筛选仅作用于**餐厅和酒店**；酒店列表默认展示，并在酒店页“离景点最近”下拉中选择锚点后过滤；餐厅未选锚点时保留门禁；5km 内已加入行程的地点照常显示；结果按距离升序并显示距离。2026-11-17 需求方进一步确认最终酒店页以“离景点最近”下拉为锚点入口，UI 样式、地图、小型犬/大型犬/低押金/免清洁费/搜索暂缓。现有地点表已持久化经纬度，列表接口已返回经纬度并支持区域、类型、宠物友好筛选，因此不需要 schema 迁移；新增 V23 珠海测试酒店/餐厅数据种子用于本地验证，也不需要新的地点数据源。

该需求是上游 US-12「宠物友好食宿推荐与选择」在现有地点浏览页上的一个垂直切片：先由用户显式选择一个行程景点作为距离参照，再浏览附近餐厅和酒店；不实现自动食宿推荐、多景点距离聚合或在线预订。US-08/US-17 的宠物友好筛选继续复用现有政策字段与筛选语义。

术语：本文中的“酒店”对应界面现有类型标签“住宿”（`typeGroup=hotel`）；“餐厅”对应 `typeGroup=restaurant`。

## 六字段

1. **id**：REQ-012
2. **statement**：已登录用户存在激活行程时，可以在地点浏览页的“酒店”类型下通过“离景点最近”下拉，或在“景点”类型下通过锚点选择器，从已按天排期的行程景点中单选一个锚点；酒店默认展示该城市全部已保存酒店，选择锚点后只显示与锚点经纬度直线距离不超过 5km 的酒店并按距离升序显示距离；餐厅在未选锚点时显示门禁，选择锚点后同样按 5km 过滤。
3. **actors**：
   - 已登录用户：选择/清除锚点，切换地点类型，浏览餐厅和酒店
   - 地点浏览页 `apps/web`：提供酒店“离景点最近”下拉、景点页锚点选择、餐厅门禁、距离展示与空态
   - 后端地点查询：按锚点坐标计算距离、过滤、排序和分页
   - 激活行程：提供已按天排期的景点 `poiId` 集合
4. **rationale**：用户在确定当天景点后，需要围绕景点安排用餐和住宿；用单个已排期景点作为锚点可以把“先选景点、再看附近食宿”的规划顺序直接落到现有浏览页，复用经纬度与统一地点查询，不引入地图组件、路径规划或新的持久化结构。
5. **acceptance hints**：
   - 锚点候选只来自 `plan.days[].stops` 中 `typeGroup=attraction` 的地点，按 `poiId` 去重；`unscheduled` 中的景点不出现。
   - 锚点选择器只在“景点”类型下显示；选择或清除锚点不改变当前景点列表结果。
   - 酒店类型下显示“离景点最近”下拉，景点类型下保留锚点选择器；两者共用同一候选与锚点状态。
   - 未选锚点时，切到“餐厅”显示门禁空态且不发起餐厅列表请求；切到“酒店”默认展示该城市全部已保存酒店，不因未选锚点门禁；仍可切回“景点”“宠物医院”“宠物用品店”。
   - 锚点已选时，餐厅和酒店共用该锚点；两类之间切换保留锚点，页码重置为第 1 页。
   - 距离使用 Haversine 直线距离，`≤5000m` 含边界；候选地点坐标为 `NULL` 时排除；锚点坐标为 `NULL` 时不能应用并提示。
   - 结果按距离升序，距离相同按既有稳定顺序；卡片显示“距{锚点名}约 X.Xkm”（一位小数）。
   - 距离筛选与激活行程城市、宠物友好/显示全部地点筛选是 AND 关系；5km 内已加入行程的餐厅/酒店照常显示。
   - 锚点景点被移出行程、或激活行程变化后，锚点自动清空；酒店恢复默认全量列表，餐厅恢复门禁。
   - 分页总数、页数和是否还有下一页均基于距离过滤后的结果。
6. **links to evidence**：
   - 用户地点浏览页：`apps/web/src/routes/_authenticated/attractions/index.tsx`
   - 行程计划结构与已加入状态：`apps/web/src/lib/trip/types.ts`、`store.ts`、`plan.ts`
   - 地点列表查询与详情查询：`apps/web/src/queries/locations.ts`
   - 地点查询后端：`apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java`、`LocationQueryService.java`、`LocationQueryResponses.java`、`PawtripLocationRepository.java`
   - 经纬度列：`apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql`
   - 地点浏览既有契约：`openspec/specs/trip-attractions/spec.md`
   - 共享地点列表变更（已归档，Living Spec 基线）：`openspec/changes/unify-location-browsing/`
   - 架构说明：`docs/knowledge/architecture/README.md`

## Ready 形状

### Intent

在已有“激活行程城市 + 地点类型 + 宠物友好”浏览能力之上，增加一个由用户显式选择的行程景点锚点；餐厅和酒店按锚点 5km 范围过滤、按距离排序并显示距离，帮助用户在已确定景点周边安排食宿。

### Actors 与权限边界

- 仅已登录用户可访问地点浏览页；未登录由既有认证守卫拦截。
- 锚点、距离筛选和门禁都是页面行为，不改变服务端授权模型。
- 后端地点列表接口仍要求登录；区域、类型、宠物友好过滤保持现有契约。
- 锚点必须是 `typeGroup=attraction` 的已保存地点；服务端无法验证该景点是否属于当前用户的激活行程，行程归属由前端页面保证。

### In / Out Scope

**In**

- 酒店类型下的“离景点最近”下拉：候选来自激活行程已按天排期的景点，去重，可清除
- 景点类型下的锚点选择器：供餐厅筛选使用，与酒店下拉共用候选和状态
- 酒店列表默认展示；餐厅在未选锚点时的门禁空态与返回景点入口
- 锚点在餐厅和酒店之间共用；切换类型保留锚点并重置页码
- 服务端按锚点经纬度执行 5km Haversine 过滤、距离升序排序与过滤后分页
- 列表项返回 `distanceMeters`，卡片显示距离
- 锚点失效（移出行程、切换激活行程）时自动清空；酒店恢复全量，餐厅恢复门禁
- 无坐标地点排除、锚点无坐标提示、无已排期景点时的提示
- 后端 API 测试、前端查询/组件单测与 E2E 覆盖

**Out**

- 小型犬/大型犬/低押金/免清洁费/搜索等筛选 chips
- 地图、地图弹窗与右侧地图联动
- 酒店卡片的图片、评分、押金/清洁费等视觉与字段改造
- 自动推荐餐厅/酒店、评分、推荐理由或食宿排序策略
- 一天多个景点时的距离聚合口径（最近、几何中心、分组）与自动推荐
- 地图组件、用户定位、驾车距离、路径规划或高德周边搜索
- 在线订座、酒店预订、价格比较
- 新增地点类型、数据库列或迁移
- 修改行程 `TripPlan` 结构、行程保存方式或已加入地点的展示规则
- 锚点跨刷新持久化、服务端保存用户偏好
- 管理端地点管理、高德候选搜索与地点写入行为

### Scenarios + AC Hints

#### S1：酒店页选择已排期景点作为锚点

- **Given** 激活行程第 1 天已加入景点“长隆海洋王国”
- **When** 用户在“酒店”类型下的“离景点最近”下拉中选择“长隆海洋王国”
- **Then** 锚点显示为“长隆海洋王国”
- **AND** 酒店列表只显示该锚点 5km 内的酒店

#### S1b：景点页选择锚点供餐厅使用

- **Given** 激活行程第 1 天已加入景点“长隆海洋王国”
- **When** 用户在地点浏览页的“景点”类型下打开锚点选择器并选择“长隆海洋王国”
- **Then** 锚点显示为“长隆海洋王国”
- **AND** 当前景点列表内容不因选择锚点而变化

#### S2：未排期景点不作候选

- **Given** 激活行程的“未排期”分组包含景点“情侣路”，按天 stops 中没有该景点
- **When** 用户打开任一锚点选择控件
- **Then** “情侣路”不出现在候选中

#### S3：未选锚点切到餐厅被拦截

- **Given** 用户尚未选择锚点
- **When** 用户把地点类型切换为“餐厅”
- **Then** 页面显示“请先在景点页选择行程景点”的空态
- **AND** 不发起餐厅列表请求
- **AND** 页面提供返回“景点”类型的入口

#### S4：未选锚点切到酒店默认展示

- **Given** 用户尚未选择锚点
- **When** 用户把地点类型切换为“酒店”
- **Then** 页面默认展示该城市已保存酒店
- **AND** 不显示门禁空态
- **AND** 若行程中没有已排期景点，“离景点最近”下拉禁用并提示

#### S5：宠物医院与宠物用品店不受门禁影响

- **Given** 用户尚未选择锚点
- **When** 用户切换到“宠物医院”或“宠物用品店”
- **Then** 列表按现有城市、类型和宠物友好条件正常请求与展示
- **AND** 不应用距离筛选

#### S6：餐厅 5km 过滤

- **Given** 锚点为“长隆海洋王国”，其坐标为 `(113.5, 22.1)`
- **When** 用户切换到“餐厅”
- **Then** 列表只包含与锚点直线距离 `≤5km` 的餐厅
- **AND** 与锚点距离 `5.01km` 的餐厅不出现

#### S7：5km 边界包含

- **Given** 某餐厅与锚点的计算距离为 `5000m`
- **When** 用户应用距离筛选
- **Then** 该餐厅出现在结果中

#### S8：距离升序与距离文案

- **Given** 锚点已选，5km 内有距离为 `800m`、`2300m`、`4200m` 的餐厅
- **When** 列表渲染
- **Then** 顺序为 `800m`、`2300m`、`4200m`
- **AND** 卡片分别显示“距{锚点名}约 0.8km”“约 2.3km”“约 4.2km”

#### S9：酒店和餐厅共用锚点

- **Given** 用户已在酒店类型下通过“离景点最近”选中锚点并查看结果
- **When** 用户切换到“餐厅”
- **Then** 餐厅列表使用同一锚点执行 5km 过滤
- **AND** 不显示餐厅门禁
- **AND** 页码重置为第 1 页

#### S10：与宠物友好筛选叠加

- **Given** 锚点已选，5km 内同时存在宠物友好和非宠物友好餐厅
- **When** 用户关闭“显示全部地点”
- **Then** 结果只包含满足 `maxPetsPerPerson >= 1` 的 5km 内餐厅
- **AND** 打开“显示全部地点”后结果包含 5km 内全部餐厅

#### S11：已加入行程的地点照常显示

- **Given** 某餐厅与锚点距离 2km，且已加入行程第 2 天
- **When** 用户查看 5km 内餐厅
- **Then** 该餐厅仍出现在结果中
- **AND** 卡片保留既有的“第 2 天”标识

#### S12：锚点失效自动清空

- **Given** 用户已选择锚点“长隆海洋王国”，当前正在浏览酒店
- **When** 用户在行程面板中把该景点移出行程
- **Then** 锚点自动清空
- **AND** 酒店列表恢复默认全量列表
- **AND** 若当前为餐厅，则恢复门禁空态

#### S13：无已排期景点

- **Given** 激活行程的按天 stops 中没有任何景点
- **When** 用户打开酒店“离景点最近”下拉或景点页锚点选择器
- **Then** 控件禁用并提示先向某一天添加景点
- **AND** 酒店列表仍默认展示
- **AND** 餐厅保持门禁

#### S14：锚点无坐标

- **Given** 某已排期景点在 `pawtrip_location` 中经纬度为 `NULL`
- **When** 用户尝试把它作为锚点
- **Then** 页面提示该景点缺少坐标、无法计算距离
- **AND** 不发起距离筛选查询

#### S15：无坐标候选地点排除

- **Given** 5km 范围内存在一家经纬度为 `NULL` 的餐厅
- **When** 用户应用距离筛选
- **Then** 该餐厅不出现在结果中

### Constraints

- 距离固定为 5km，使用 Haversine 大圆距离；不引入地图 SDK、路径规划或第三方距离服务。
- 坐标沿用高德 POI 坐标系（GCJ-02）；锚点与候选地点来自同一坐标系，不混用 WGS84。
- 服务端完成过滤、排序和分页；前端不自行拉取全量数据做距离过滤。
- 不新增数据库列或 Flyway 迁移；`longitude`/`latitude` 允许 `NULL`，筛选时必须排除而不是当作 0。
- 锚点选择是页面内状态，不写入 `sessionStorage`/`localStorage`，也不写入服务端。
- 前端查询复用 `apps/web/src/queries/locations.ts` 与 `lib/http/request.ts`；不新增状态库。
- 页面沿用现有 shadcn/ui Base UI 组件与可访问标签；空态文案只固定语义，不锁死视觉样式。
- 实现前需形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。

### Context

当前地点浏览页默认类型为“景点”，支持类型单选、宠物友好/显示全部地点筛选、分页，并以激活行程城市为唯一范围。行程计划只保存 `poiId`，按天 stops 与 `unscheduled` 分开；行程面板已按 `poiId` 拉取地点详情并缓存名称与 `typeGroup`。后端 `GET /api/locations` 已返回经纬度，但当前分页查询不计算距离。开发库 873 条地点坐标齐全，但数据库列允许 `NULL`。

上游 US-12 已确定“先选景点，后推荐食宿”，并把一天多个景点的距离参照留为开放问题；本需求不实现自动推荐，也不解决多景点聚合，只提供“用户显式选择单个已排期景点作为锚点”的确定性能力。

### Affected Capabilities

- **MODIFIED** `trip-attractions`：地点浏览页新增酒店默认列表与“离景点最近”下拉、景点页锚点选择、餐厅门禁、5km 距离筛选、距离排序与展示，以及对应的服务端查询参数。
- **NO CHANGE** `location-management`：管理端地点列表与编辑行为不变；共享列表接口只增加可选距离参数，不改变管理端调用。
- **NO CHANGE** `trip-planning` / `trip-context`：行程计划结构和保存方式不变。

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 锚点候选是否包含未排期景点？ | Product / Dev | 不包含；只取已按天排期的景点 |
| blocking | resolved | 距离筛选作用于哪些类型？ | Product / Dev | 仅餐厅和酒店 |
| blocking | resolved | 未选锚点能否浏览餐厅/酒店？ | Product / Dev | 酒店默认展示列表；餐厅显示门禁并阻止列表请求 |
| blocking | resolved | 酒店锚点入口放在哪里？ | Product / Dev | 酒店页“离景点最近”下拉；景点页保留锚点选择器供餐厅使用 |
| blocking | resolved | 5km 内已加入行程的地点是否隐藏？ | Product / Dev | 不隐藏，照常显示 |
| blocking | resolved | 排序与距离展示？ | Product / Dev | 距离升序并显示一位小数公里 |
| non-blocking | resolved | 锚点选择是否持久化？ | Dev | 不持久化，仅页面内状态 |
| non-blocking | resolved | 多景点同一天的距离口径？ | Upstream US-12 | 本需求由用户显式选单个锚点；多景点聚合仍由 US-12 决定，不阻塞本需求 |
| non-blocking | deferred | 5km 半径是否需要可配置？ | Product | 本期固定 5km；可配置半径留待后续需求 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | 锚点范围 | 初版歧义：是否所有地点类型都可做锚点 | 已确认锚点固定为已按天排期的景点 |
| BLOCKER | resolved | 筛选范围 | 初版歧义：是否景点也应用 5km | 已确认仅餐厅和酒店应用 |
| BLOCKER | resolved | 门禁 | 初版未定义未选锚点时餐厅/酒店的行为 | 已确认酒店默认列表 + “离景点最近”下拉；餐厅门禁空态且不请求列表 |
| WARNING | resolved | 锚点名称 | 行程只存 `poiId`，页面需要名称才能展示候选 | 复用现有地点详情查询与行程面板缓存；加载完成前不可选 |
| WARNING | resolved | 距离计算位置 | 前端全量过滤会破坏服务端分页 | 由服务端按 `nearPoiId` 过滤、排序和分页 |

BLOCKER 数：0。
