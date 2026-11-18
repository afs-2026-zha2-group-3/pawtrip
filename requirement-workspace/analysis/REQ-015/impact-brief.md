# REQ-015 Impact Brief — 行程单景点附近宠物服务与医院/用品店免筛选

- 生成日期：2026-11-17（P1 补充登记，代码已由 PR #75 实现）
- 上游需求：[REQ-015 行程单景点附近宠物服务与医院/用品店免筛选](../../requirements/REQ-015-itinerary-nearby-pet-services.md)
- 已确认口径：同城最近各 1 家、不受 5km 限制；营业时间 `opentime_week` → `opentime_today` → “暂无”；医院/用品店免宠物规则筛选且隐藏“显示全部地点”开关；无迁移、无新依赖。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-015 | 行程单景点附近宠物服务与医院/用品店免筛选 | implemented | `requirements/REQ-015-itinerary-nearby-pet-services.md` |

阻塞开放问题：0；DoR BLOCKER：0；非阻塞未决项：3（电话/导航、多候选、营业中状态，均已列为 Non-goal 或 followups）。

## 2. As-is 资产清单（证据路径）

**Living Spec**

- `openspec/specs/trip-attractions/spec.md`：行程上下文地点浏览、类型筛选、宠物友好筛选、5km 锚点、地图详情。
- 当前 Living Spec 已包含“医院/用品店不受宠物友好筛选”的表述（PR #75 直接修改），但**没有**“行程单附近宠物服务”需求。

**后端**

- `apps/server/src/main/java/com/pawtrip/server/location/LocationQueryController.java`：`GET /api/locations/{poiId}` 与新增 `/{poiId}/nearby-services`。
- `LocationQueryService.java`：区域/分页校验、列表与详情组装；新增 `nearbyServices`、`nearestService`、`toNearbyService`。
- `LocationQueryResponses.java`：新增 `NearbyServices` 与 `NearbyService` 记录。
- `PawtripLocationRepository.java`：`findLocations` / `findLocationPage` 的 `petFriendlyOnly` 条件加入医院/用品店豁免。
- `LocationTypeCatalog.java`：`pet-hospital` / `pet-supplies` 类型键常量化。
- 数据：`pawtrip_location.longitude/latitude/region_code`、`business_json.opentime_week/opentime_today`；无迁移。

**前端**

- `apps/web/src/routes/_authenticated/itinerary.tsx`：景点卡片“详细携宠政策”后挂载 `NearbyPetServices`。
- `apps/web/src/components/trip/nearby-pet-services.tsx`：折叠、懒加载、加载/空/错误态。
- `apps/web/src/lib/trip/itinerary.ts`：行程条目新增 `poiId`。
- `apps/web/src/queries/locations.ts`：新增 `NearbyPetService(s)` 类型、query key 与 query options。
- `apps/web/src/lib/attraction-pet-rules.ts`：`petRulesApplyTo`、`isPetPolicyConfigured`。
- `apps/web/src/lib/trip/policy-match.ts`：`matchLocationPolicyForType`。
- `apps/web/src/routes/_authenticated/attractions/index.tsx`：医院/用品店不传 `petFriendlyOnly`、隐藏开关、调整空态。
- 卡片/弹窗/地图/政策字段组件：`-pet-friendly-badge.tsx`、`-pet-policy-fields.tsx`、`-location-card.tsx`、`-location-detail-dialog.tsx`、`-map-location-card.tsx`。

**测试**

- `apps/server/src/test/java/com/pawtrip/server/location/LocationQueryApiTest.java`：免筛选、最近医院/用品店、无坐标、404。
- `apps/web/src/components/trip/nearby-pet-services.test.tsx`：加载与空态。
- `apps/web/src/lib/attraction-pet-rules.test.ts`、`apps/web/src/lib/trip/policy-match.test.ts`、`apps/web/src/lib/trip/itinerary.test.ts`、`apps/web/src/queries/locations-browsing.test.ts`。
- CI：`Server CI`、`Web CI`、`E2E CI`（PR #75 全绿）。

## 3. As-is → Implemented delta

| 资产 | As-is | Implemented |
|---|---|---|
| 地点 API | 列表/详情/类型 | 新增 `GET /api/locations/{poiId}/nearby-services` |
| 附近服务 | 无 | 同城最近医院/用品店各 1 家，含距离与营业时间 |
| 列表筛选 | 所有类型统一 `petFriendlyOnly` | 医院/用品店豁免；开关隐藏 |
| 卡片政策 | 未配置=“未配置” | 医院/用品店未配置=“不限宠物/友好/允许所有宠物” |
| 行程条目 | 仅 name/address/policy | 新增 `poiId` 供附近服务查询 |
| Living Spec | 无附近服务需求 | 需新增 requirement（当前仅在代码与测试中） |
| 数据库 | — | 不变 |

## 4. Blast radius

- **直接受影响**：行程单景点卡片、共享地点列表查询、医院/用品店浏览与卡片政策展示。
- **不受影响**：行程计划结构与保存、管理端地点编辑、认证/角色、高德候选搜索、餐厅/酒店 5km 锚点语义、地图 marker 数据来源。
- **运行拓扑**：不变；浏览器 → Vite `/api` 代理 → Spring Boot → SQLite。附近服务为 DB-only 查询。

## 5. Artifact impact

- **Specs**：`trip-attractions` 新增“行程景点附近宠物服务”要求；医院/用品店免筛选要求已在 Living Spec，change delta 以 MODIFIED 对齐。
- **Tests**：后端 API 测试与前端组件/纯函数测试已随 PR #75 落地；无需新增迁移或 E2E 种子。
- **Docs / KB**：Living Spec 待 P5 归档合并；KB update 按既有基线 SKIP（未配置）。
