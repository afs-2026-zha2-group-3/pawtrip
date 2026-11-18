# REQ-015 Impact Brief — 行程单当天路线规划

- 生成日期：2026-11-18
- 上游需求：[REQ-015 行程单当天路线规划](../../requirements/REQ-015-day-route-planning.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：Day 标签行右侧按钮作用于当前选中天；弹窗内地图；按段显示方式调用高德 JS 路线（`walk` 步行、`drive`/`self_drive` 驾车）；距离取高德、时长快照优先否则向上取整；坐标由用户端地点详情只读下发；不做天气；完全只读、不进导出。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-015 | 行程单当天路线规划 | ready-for-split | `requirements/REQ-015-day-route-planning.md` |

阻塞开放问题：0（7 blocking + 3 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-itinerary/spec.md`：行程单入口、按天汇总与日期、时间线与途内交通、地点政策展开、当天提醒、导出 PDF/图片与打印隐藏外框；无路线地图要求。
- `openspec/specs/trip-route-estimate/spec.md`：途内交通估算与 `toNext`/`toNextEstimate` 快照语义（REQ-011）；本需求只读消费快照，不改契约。
- `openspec/specs/trip-planning/spec.md`：`TripPlan` v1 结构与 stop 字段；本需求不修改计划结构。
- `openspec/specs/trip-context/spec.md`：激活行程、天切换与上下文缓存；本需求复用选中天，不新增上下文。
- `openspec/specs/location-management/spec.md`：用户端共享地点列表与详情、封面/评分/政策字段；详见 `### Requirement: 用户端地点封面与评分字段`；尚无详情坐标要求。
- `openspec/specs/trip-attractions/spec.md`：地点浏览与详情弹窗；本需求不修改。
- `openspec/specs/backend-data-access/spec.md`、`backend-error-handling/spec.md`、`frontend-data-fetching/spec.md`、`frontend-api-request/spec.md`：约束实现方式（JPA、RFC 9457、TanStack Query），不修改。

**当前后端实现**

- `apps/server/src/main/java/com/pawtrip/server/location/LocationQueryResponses.java:76`：`LocationDetail` 无坐标字段。
- `apps/server/src/main/java/com/pawtrip/server/location/LocationQueryService.java:57-61`、`:99-105`：`detail` 从 `locationRepository.findByPoiId` 取实体并 `toDetail`；`toDetail` 只读取照片、`business_json` 字段。
- `apps/server/src/main/java/com/pawtrip/server/location/PawtripLocation.java:32-34`、`:119-125`：实体已有 `Double longitude/latitude` 与 getter。
- `apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql:24-25`：`pawtrip_location.longitude REAL`、`latitude REAL`；坐标已入库，无需迁移。
- `apps/server/src/main/java/com/pawtrip/server/trip/TripPlan.java`：计划 stop 只有 `poiId`、`toNext`、`toNextEstimate`，无坐标；`trip` 表（V17/V18/V20）无坐标列。

**当前前端实现**

- `apps/web/src/routes/_authenticated/itinerary.tsx:84`：`selectedDay` 状态；`:277-291`：`Tabs`/`TabsTrigger` Day 切换；`:381`：`day.dateLabel ?? 第 N 天`；`:128-129`：已按 `poiId` 预取地点详情并 `cacheLocation`。
- `apps/web/src/lib/trip/itinerary.ts:47`、`:86`：交通段 `displayMode` 与 `displayToNext`；`apps/web/src/lib/trip/plan.ts:13-20`：`walk | drive | self_drive` 归一规则。
- `apps/web/src/lib/amap/loader.ts`：高德 JS 2.0 单例加载、`Map`/`Marker`/`InfoWindow` 类型与缺 Key 拒绝；**未暴露 `AMap.plugin`、`AMap.Polyline`、`AMap.Text`**。
- `apps/web/src/routes/_authenticated/attractions/-location-map.tsx`：地图初始化、标记、InfoWindow、缺 Key/错误降级先例。
- `apps/web/src/components/ui/dialog.tsx`：可复用 `Dialog` 原语（`Dialog`、`DialogContent`、`DialogHeader`、`DialogTitle`、`DialogDescription`）。
- `apps/web/src/queries/locations.ts:62-76`：`LocationBrowseDetail` 无坐标字段；`LocationSummary`（列表）已有可空 `longitude/latitude`。
- 导出：`itinerary.tsx` 的打印/图片导出路径与 `trip-itinerary` 的「打印输出隐藏应用外框」「导出图片」要求；路线弹窗需与其隔离。

**测试与夹具**

- `apps/server/src/test/java/com/pawtrip/server/location/LocationQueryApiTest.java:335`、`:344`：详情空政策与地图卡片字段测试；适合新增坐标断言与缺坐标 `null` 断言。
- `apps/web/src/lib/trip/transport-segments.test.ts`、`store-transport.test.ts`：交通方式与快照纯逻辑测试先例。
- `e2e/itinerary.spec.ts`：以 `e2e-zhu-a/b/c/d`、`startDate: 2026-12-01`、2 天计划种子；适合新增路线弹窗 E2E。
- `e2e/attraction-pet-rules.spec.ts` 或地图相关 E2E：高德缺 Key/地图降级先例可参考。

**知识库**

- `docs/knowledge/interfaces/http-api.md`：HTTP 契约登记处（地点详情需补坐标字段）。
- `docs/knowledge/` 中高德/地图与前端数据获取相关条目；实现前按 AGENTS.md 要求先查知识库再编码。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `LocationDetail` 响应 | 无坐标 | 新增 `Double longitude`、`Double latitude`；来源 `PawtripLocation.getLongitude/getLatitude`；缺失为 `null`；不改其他字段 |
| `LocationQueryService.toDetail` | 只读照片与 `business_json` | 把实体坐标传入 `LocationDetail.from`；仍只读数据库，不调用高德 |
| `LocationBrowseDetail`（前端） | 无坐标 | 新增可空 `longitude/latitude`；既有消费方不受影响 |
| 高德 loader | 仅 Map/Marker/InfoWindow | 扩展 `AMap.plugin`、`AMap.Polyline`、`AMap.Text`（或等价）类型与加载；保持单例与错误语义 |
| 行程单页面 | Day 标签行仅 Tabs | 标签行右侧新增「查看当天路线规划」按钮；持有弹窗开关状态；不改 `selectedDay` 语义 |
| 路线弹窗 | 不存在 | 新增弹窗组件：标题（第 N 天 + 可选日期）、地图容器、编号标记、折线、距离/时长标注、降级/空态 |
| 路线纯逻辑 | 不存在 | 新增纯函数：由当天 stops + 地点详情生成段列表（跳过同 `poiId`、缺坐标标记）、距离格式、时长选择与取整；含单测 |
| 行程快照 | `toNextEstimate` 已存在 | 只读消费 `durationMinutes`；不改写、不新增字段 |
| 导出路径 | 已隔离打印/图片 | 路线弹窗不进入导出 DOM；回归验证 PDF/图片不含路线内容 |
| Living Spec | `trip-itinerary`、`location-management` 无相关要求 | MODIFIED 两能力 delta（ADDED 需求） |
| 知识库 | `http-api` 无坐标字段 | 归档后补地点详情坐标字段与路线视图说明 |

## 4. Blast radius

- **直接受影响**：`/itinerary` 页面 Day 标签行与新增弹窗、高德 loader、用户端地点详情 API 响应、地点详情前端类型。
- **不受影响**：行程计划结构、交通方式选择与 `toNextEstimate` 写入逻辑、地点列表接口、管理端地点管理、城市/推荐/档案能力、认证与权限边界、PDF/图片导出内容（需回归确认隔离）。
- **兼容性**：详情响应只增可空字段，既有消费方不受影响；高德 loader 扩展为向后兼容；无迁移、无新依赖、无运行拓扑变化。
- **外部依赖**：高德 JS API 2.0 路线规划可用性影响首次打开体验；未配置 Key 或配额失败按降级处理，不阻塞页面。

## 5. Artifact impact

- **Specs**：MODIFIED `trip-itinerary`（入口/弹窗、绘制、标注、降级、空态）、MODIFIED `location-management`（详情坐标字段）。
- **Tests**：后端 `LocationQueryApiTest` 新增坐标与 `null` 用例；前端路线纯函数单测（段构建/跳过/缺坐标/格式/时长）；组件或 E2E 覆盖入口、弹窗、绘制与降级；`e2e/itinerary.spec.ts` 扩展。
- **Docs / KB**：`interfaces/http-api.md` 补详情坐标字段；必要时补高德路线视图说明。
- **OpenSpec**：已建立 change `2026-11-18-add-day-route-planning`（proposal/design/tasks/delta specs），`openspec validate --strict` 通过。
- **Gate**：P1/P2 工件产出后需人工 G1 评审；本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载「详情坐标契约 → loader 扩展 → 路线纯逻辑 → 弹窗与页面入口」。拆开会产生不可验收中间态（有坐标无消费方，或有弹窗无坐标）。
- **Agile**：可拆 3 个薄故事（详情坐标 → 路线计算与地图绘制 → 页面入口与降级/空态），按依赖顺序交付。
- **依赖顺序**：后端坐标字段先行（保持旧行为）→ 前端类型与纯函数 → loader 插件 → 弹窗与入口 → E2E/文档。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 高德插件加载时序 | `AMap.plugin([...], cb)` 必须在 `loadAmap()` 成功后调用；封装为 Promise 并在弹窗卸载时清理 overlay/map，避免重复实例 |
| 风险 R2 | 坐标缺失或为 `0` | 以 `null` 判断而非 falsy；`0` 是合法经度值但中国范围内不常见，仍按数值处理；缺坐标段跳过并提示 |
| 风险 R3 | 高德算路失败/配额 | 单段 `catch`，展示段落失败提示，不影响其他段；不伪造直线或距离 |
| 风险 R4 | 弹窗与导出隔离 | 导出走独立渲染/打印路径；确认路线弹窗不插入打印 DOM；E2E 回归 PDF/图片 |
| 风险 R5 | 多段并发请求 | 高德 JS 插件回调式 API；按段串行或受控并发，避免大量同时算路；弹窗关闭后忽略迟到回调 |
| 风险 R6 | 时长语义混淆 | 快照时长是「行程单口径」，算路时长是「实时路径口径」；按需求固定快照优先，避免用户看到与时间线不一致 |
| 风险 R7 | 测试依赖外部网络 | E2E/CI 无高德 Key 时走缺 Key 降级用例；路线几何与格式用纯函数单测；真实算路仅本地冒烟 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`2026-11-18-add-day-route-planning`（已建立）。
- 理由：坐标契约、路线纯逻辑、loader 与弹窗入口共同构成一条验收链（打开弹窗 → 标记 → 折线 → 距离时长）；拆分会产生不可独立验收的中间态。
- 规模预估：M；无迁移、无新依赖、1 个后端响应扩展、前端新增弹窗与地图逻辑。
- 工作切片（change 内任务顺序）：T1 详情坐标契约与测试 → T2 loader 插件与类型 → T3 路线纯逻辑与单测 → T4 弹窗/地图/入口 → T5 降级空态与 E2E → T6 文档与 Spec 同步。
