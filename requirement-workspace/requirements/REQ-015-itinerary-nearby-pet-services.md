---
id: REQ-015
title: 行程单景点附近宠物服务与医院/用品店免筛选
status: ready-for-spec
discovery: Go (2026-11-17)
impact: ../analysis/REQ-015/impact-brief.md
sources:
  - ../intents/REQ-015-itinerary-nearby-pet-services.md
  - apps/web/src/routes/_authenticated/itinerary.tsx
  - apps/web/src/components/trip/nearby-pet-services.tsx
  - apps/web/src/lib/trip/itinerary.ts
  - apps/web/src/lib/trip/policy-match.ts
  - apps/web/src/lib/attraction-pet-rules.ts
  - apps/web/src/queries/locations.ts
  - apps/web/src/routes/_authenticated/attractions/index.tsx
  - apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java
  - apps/server/src/main/java/com/pawtrip/server/location/LocationQueryService.java
  - apps/server/src/main/java/com/pawtrip/server/location/PawtripLocationRepository.java
  - openspec/specs/trip-attractions/spec.md
---

# REQ-015：行程单景点附近宠物服务与医院/用品店免筛选

## Discovery Decision

Go（2026-11-17）。用户希望在行程单内直接获得就医与补给信息，减少临时查找。已确认口径：

- “附近”取**景点所在城市**范围内直线距离最近的一家，**不沿用地点浏览页的 5km 筛选**，避免周边没有服务时栏目空白；宠物医院与宠物用品店各展示 1 家。
- 营业时间优先高德快照 `opentime_week`，缺失时回退 `opentime_today`，都缺失显示“暂无”。
- 宠物医院与宠物用品店**不应用宠物友好筛选**，始终返回当前城市该类型的全部已保存地点；地点浏览页对这两类隐藏“显示全部地点”开关。
- 未配置宠物规则的医院/用品店，卡片徽章显示“不限宠物”，逐宠物 tag 为“友好”，政策区显示“允许所有宠物，无额外限制”。

本需求复用既有地点表、城市区域字段、经纬度与高德营业时间快照，**无数据库迁移、无新依赖**。该改动与 REQ-012 的锚点/距离能力共用地点查询与接口测试文件，拆分代价高，经用户确认合并为一个 PR（#75）。

## 六字段

1. **id**：REQ-015
2. **statement**：已登录用户查看激活行程的按天景点时，可在每个景点卡片内展开“附近宠物服务”，看到该景点所在城市内直线距离最近的宠物医院与宠物用品店各 1 家（名称、距离、地址、营业时间）；同时，宠物医院与宠物用品店在地点浏览页不受宠物友好筛选影响，始终展示当前城市该类型的全部已保存地点。
3. **actors**：
   - 已登录用户：在行程单展开附近服务；在地点浏览页查看宠物医院/用品店
   - 后端地点查询：按景点 POI 定位同城最近服务；对医院/用品店放宽宠物友好过滤
   - 前端行程单：按需请求并展示附近服务，处理加载/空/错误态
   - 前端地点浏览页：医院/用品店的筛选语义与卡片政策展示
4. **rationale**：用户在行程中确定景点后，最关心的是“宠物生病去哪、用品在哪买”。把同城最近服务直接放进景点卡片，避免跳转浏览页再按类型筛选；同时修复医院/用品店被宠物规则筛掉导致“找不到”的问题，保证基础服务始终可见。
5. **acceptance hints**：
   - AC-1：行程单每个景点卡片在“详细携宠政策”之后显示可折叠“附近宠物服务”，默认收起。
   - AC-2：展开后才请求 `GET /api/locations/{poiId}/nearby-services`；收起不请求。
   - AC-3：响应包含 `hospital` 与 `supplies` 两个可空对象，字段为 `poiId`、`name`、`address`、`distanceMeters`、`openingHours`。
   - AC-4：同城范围内按 Haversine 直线距离取最近 1 家；距离相同按地点 ID 升序。
   - AC-5：距离展示为“距{景点名}约 X.Xkm”（一位小数）；地址缺失显示“地址未收录”。
   - AC-6：营业时间优先 `opentime_week`，缺失回退 `opentime_today`，都缺失显示“暂无”。
   - AC-7：景点缺经纬度时两类均返回 `null`，前端显示“暂无附近宠物服务”；未知 POI 返回 404。
   - AC-8：加载中显示“正在查找附近宠物服务…”，请求失败显示“暂时无法获取附近宠物服务”，不阻塞卡片其他内容。
   - AC-9：地点列表对宠物医院/用品店始终返回当前城市该类型的全部已保存地点，即使 `petFriendlyOnly=true`。
   - AC-10：地点浏览页对宠物医院/用品店不展示“显示全部地点”开关；空态与计数不按宠物友好口径。
   - AC-11：未配置宠物规则的医院/用品店卡片显示“不限宠物”，逐宠物 tag 显示“友好”，政策区显示“允许所有宠物，无额外限制”；地图详情卡片的政策 chips 显示“允许所有宠物”。
6. **links to evidence**：
   - 行程单页面：`apps/web/src/routes/_authenticated/itinerary.tsx`
   - 附近服务组件与测试：`apps/web/src/components/trip/nearby-pet-services.tsx`、`nearby-pet-services.test.tsx`
   - 行程条目派生：`apps/web/src/lib/trip/itinerary.ts`
   - 地点查询与类型：`apps/web/src/queries/locations.ts`
   - 免筛选与政策展示：`apps/web/src/lib/attraction-pet-rules.ts`、`apps/web/src/lib/trip/policy-match.ts`、`apps/web/src/routes/_authenticated/attractions/index.tsx`
   - 后端接口：`apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java`、`LocationQueryService.java`、`LocationQueryResponses.java`、`LocationTypeCatalog.java`、`PawtripLocationRepository.java`
   - 后端测试：`apps/server/src/test/java/com/pawtrip/server/location/LocationQueryApiTest.java`
   - 现行地点浏览契约：`openspec/specs/trip-attractions/spec.md`

## Ready 形状

### Intent

在行程单景点卡片内提供同城最近宠物医院与用品店；同时修正宠物医院/用品店被宠物友好筛选隐藏的问题，让基础服务始终可见。

### Actors 与权限边界

- 仅已登录用户可访问行程单与地点浏览页；沿用既有认证守卫。
- 附近服务接口要求登录；只读已保存地点，不调用高德实时接口。
- 附近服务范围由景点自身的 `regionCode` 决定，前端不传城市参数，避免越权跨城查询。
- 医院/用品店免筛选只影响公开地点列表查询；管理端接口与写入能力不变。

### In / Out Scope

**In**

- `GET /api/locations/{poiId}/nearby-services`：同城最近医院与用品店各 1 家，含距离与营业时间
- 行程单景点卡片“附近宠物服务”折叠栏目（默认收起、展开懒加载、加载/空/错误态）
- 行程条目向卡片暴露 `poiId`
- 宠物医院/用品店在地点列表查询中跳过宠物友好过滤
- 地点浏览页对医院/用品店隐藏“显示全部地点”、调整空态与提示
- 医院/用品店的“不限宠物”徽章、逐宠物“友好”tag、政策区与地图 chips 文案
- 后端 API 测试、前端组件/纯函数测试

**Out**

- 电话、导航、地图打点、营业中状态判断
- 每类展示多家、距离阈值配置、按距离排序列表
- 高德实时补拉营业时间或周边搜索
- 行程计划结构、保存格式或数据库 schema 变更
- 自动推荐、预约、评价
- 管理端地点编辑界面的筛选语义变更

### Scenarios + AC Hints

#### S1：展开查看附近服务（AC-1～AC-6）

- **Given** 激活行程第 1 天包含景点“香炉湾沙滩”，该景点有经纬度
- **When** 用户展开景点卡片的“附近宠物服务”
- **Then** 请求 `/api/locations/poi/nearby-services`
- **And** 展示最近的宠物医院与用品店（名称、距离、地址、营业时间）

#### S2：收起不请求（AC-1、AC-2）

- **Given** 用户尚未展开“附近宠物服务”
- **When** 行程单渲染
- **Then** 不发起附近服务请求

#### S3：营业时间回退（AC-6）

- **Given** 医院快照只有 `opentime_week`，用品店只有 `opentime_today`
- **When** 展开栏目
- **Then** 医院显示 `opentime_week`，用品店显示 `opentime_today`
- **And** 两者都缺失时显示“暂无”

#### S4：景点无坐标（AC-7）

- **Given** 景点经纬度为 `null`
- **When** 请求附近服务
- **Then** `hospital` 与 `supplies` 均为 `null`
- **And** 前端显示“暂无附近宠物服务”

#### S5：无同城服务（AC-3、AC-7）

- **Given** 景点所在城市没有已保存的医院或用品店
- **When** 展开栏目
- **Then** 对应类别为空，栏目显示“暂无附近宠物服务”

#### S6：请求失败（AC-8）

- **Given** 附近服务接口返回错误
- **When** 展开栏目
- **Then** 显示“暂时无法获取附近宠物服务”
- **And** 景点卡片的政策与其他内容正常展示

#### S7：未知 POI（AC-7）

- **Given** 路径中的 POI 不存在
- **When** 请求附近服务
- **Then** 返回 404

#### S8：医院/用品店免筛选（AC-9）

- **Given** 当前城市存在 `maxPetsPerPerson=null` 的医院/用品店
- **When** 以 `petFriendlyOnly=true` 查询该类型
- **Then** 返回该类型全部已保存地点
- **And** 不因为宠物规则被过滤

#### S9：浏览页不展示“显示全部地点”（AC-10）

- **Given** 用户切换到“宠物医院”或“宠物用品店”
- **When** 浏览列表
- **Then** 不展示“显示全部地点”开关
- **And** 计数与空态按该类型全部地点口径

#### S10：不限宠物展示（AC-11）

- **Given** 医院/用品店的宠物政策字段全为 `null`
- **When** 卡片、详情弹窗或地图详情渲染
- **Then** 徽章显示“不限宠物”
- **And** 逐宠物 tag 显示“友好”
- **And** 政策区显示“允许所有宠物，无额外限制”

### DoR

- 目标、范围与验收 hints 已由用户确认；阻塞开放问题：0
- 复用既有数据与接口，无迁移、无新依赖
- 测试可在本地（后端 API + 前端 vitest）与 CI（E2E）执行
- PR #75 已提交，CI 全绿
