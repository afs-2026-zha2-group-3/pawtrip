# Design

## Context

动机见 `proposal.md`；行为契约见 `specs/trip-route-estimate/spec.md`、`specs/trip-context/spec.md` 与 `specs/trip-planning/spec.md`。塑造本方案的现状与约束：

- 后端已有高德分层：`application.port.maps.PlaceSearchPort` ← `infrastructure.amap.api.AmapPlaceSearchAdapter` ← 共享 `AmapTransport.getJson(path, params)`（通用 GET，自动附加 key/output）+ `AmapProperties`/`AmapConfiguration`（`amapRestClient`，超时配置）。Key 缺失抛 `AmapTransportException(MISSING_API_KEY)`，应用可启动。
- 错误体系：`GlobalExceptionHandler` 将 `PlaceSearchException` 映射为 Problem Details（`MISSING_CONFIGURATION`/`UPSTREAM_FAILURE` → `ApiErrorCode.UPSTREAM_FAILURE`，502）。估算沿用同一模式。
- trip 模块：`TripController`（`/api/trips`，`Authentication` 注入）→ `TripService.findOwnedTrip(userId, tripId)`（`findByIdAndUserId`，非本人 → `TripNotFoundException` 404）；`PawtripLocationRepository.findAllByPoiIdIn` 已用于 poiId 存在性校验，`PawtripLocation` 含经纬度。
- 持久化关键事实：`TripPlanValidator.parseStops` 仅读 `poiId`/`toNext` 并重建 `TripPlan.TripStop(poiId, toNext)`，**未知字段会被丢弃**；快照落库必须同步扩展 `TripPlan.TripStop` record 与解析/校验/序列化，否则 PUT 后快照静默丢失。
- 前端：`trip-panel.tsx` 以 `rows` useMemo 派生 HeaderRow + StopRow（header 已是非拖拽行，模式可复用）；`store.ts` 的 `moveStop` 已透传 `toNext`，但无 setter；`queries/trips.ts` 走统一 `request` 层 + `queryOptions`；保存为乐观更新 + `saveRevision` 递增触发约 600ms 防抖整量 PUT。
- 政策提醒数据已就绪：面板按 poiId 懒加载并缓存景点详情（`tripStore.cache.locations`，含 `petPolicies`：leashRequired/maxSinglePetWeightKg/maxSinglePetShoulderHeightCm 等 8 可空字段）；`activePet` 已由 `petsQueryOptions` + `active.petId` 派生（含 hasLeash/weightKg/shoulderHeightCm）；trip 绑定唯一宠物且 `pet_id` 不可变（trip-planning 契约）——每天政策对比可纯前端派生，无需新后端接口。
- 外部文档：高德路线规划 2.0 已于 2026-11-17 从官网核对（驾车 `route.taxi_cost` 基础字段、`show_fields=cost` → `paths[].cost.duration` 秒、坐标「经度,纬度」≤6 位小数、可选 `origin_id`/`destination_id`）；知识库仅有链接，详细条目须在本设计落地前补入 `docs/knowledge/external/`（DoR WARNING，knowledge-first 规则）。

## Goals / Non-Goals

**Goals:**

- 估算能力以独立端口/适配器接入，不污染 POI 搜索端口与共享传输层。
- 业务换算（±20%、分钟向上取整、步行 ¥0）与上游协议解析分离，均可单测。
- 前端段行为派生展示层，不改既有拖拽/保存契约；`toNext` + `toNextEstimate` 快照写入复用既有防抖链路，刷新后快照优先展示、不再请求估算。
- Plan JSON v1 仅增量扩展可选快照字段，version 保持 1，存量数据与旧客户端兼容。
- 每天政策对比提醒为纯前端派生纯函数，复用既有政策缓存与绑定档案，不新增后端接口、不写库。

**Non-Goals:**

- 服务端估算缓存、限流与并发控制策略（P3 决定，见 Open Questions）。
- 公共交通算路、可携宠筛选、实时计价、租车。
- `plan_json` 破坏性结构变更（本次仅增量可选字段）、数据库 schema、Spring Security 放行名单、导航结构变更。

## Decisions

### D1：新增 `RouteEstimatePort`，不扩展 `PlaceSearchPort`

`application.port.maps` 新增 `RouteEstimatePort`（入参/出参为 `application.model.maps` 下的 record：起终点坐标 + poiId + mode；出参为原始估算 `taxiCostYuan`（可空）+ `durationSeconds`）。备选「在 PlaceSearchPort 加方法」被否：知识库明确告诫共享层不应固化为 POI 专用，搜索与算路是两类上游能力，分开端口保持内聚。

### D2：适配器只做协议，换算放应用服务

`infrastructure.amap.api.AmapRouteEstimateAdapter` 实现端口：驾车 `GET /v5/direction/driving`、步行 `GET /v5/direction/walking`，均带 `show_fields=cost` 与 `origin_id`/`destination_id`；坐标统一格式化 ≤6 位小数（经度在前）；解析 `route.taxi_cost` 与 `paths[0].cost.duration`，字符串缺失/非数值 → 类型化 `RouteEstimateException`；捕获 `AmapTransportException` 映射为 `RouteEstimateException`（`MISSING_CONFIGURATION`/`UPSTREAM_FAILURE`），沿用 `PlaceSearchException` → `GlobalExceptionHandler` → `UPSTREAM_FAILURE`(502) 的既有映射模式，不暴露 Key 与原始报文。

±20% 区间、秒→分钟向上取整、步行费用 0 放在 trip 模块新服务 `TripRouteEstimateService`。备选「全部在适配器完成」被否：业务规则与上游协议耦合后难以单测，且步行 ¥0 是产品决策而非高德返回。

### D3：估算端点挂 trip 模块，归属校验复用既有口径

`TripController` 新增 `GET /{tripId}/route-estimate?fromPoiId&toPoiId&mode`。`TripRouteEstimateService` 流程：`userId(username)` → `findByIdAndUserId`（404）→ 参数校验（mode ∈ {walk, drive}、poiId 非空）→ `findAllByPoiIdIn` 校验存在性并取坐标（缺失 → `400 VALIDATION_ERROR`）→ 调端口 → 换算 → 响应 record `{mode, durationMinutes, costLowYuan, costHighYuan}`。

接口只校验「本人行程 + poiId 存在」，不要求该 poiId 对当前出现在 plan 中或相邻——API 为通用估算能力，相邻语义由前端派生层保证。备选「校验段必须属于 plan」被否：拖拽重排与估算查询存在竞态，强校验会引入无谓失败。

### D4：前端段行为派生行，`samePoi` 短路

`trip-panel.tsx` 的 `rows` 派生扩展：相邻 stop 间插入 SegmentRow（方式选择器 + 估算展示 + 加载/不可用态）；段行展示方式为打车（含默认）时行内渲染携宠小字提示（前端常量：宠物专车/司机同意/航空箱），步行段隐藏；`fromPoiId === toPoiId` 时改渲染景点行下方小字提醒（无选择器、无携宠提示、不发请求）；天标题下在该天有段时渲染一条公共交通静态提示（前端常量）。SegmentRow/提醒/提示均不进入 SortableContext 的 items（与既有 HeaderRow 同模式），拖拽索引计算不受影响。

### D5：store 新增 `setStopTransport`（含快照）与回填 action，默认方式仅 UI

`types.ts` 的 `TripStop` 增加可选 `toNextEstimate?: {durationMinutes: number; costLowYuan: number; costHighYuan: number} | null`。`tripActions.setStopTransport(ref: StopRef, toNext: "walk" | "drive", estimate: ToNextEstimate | null)`：定位 day/index 的 stop，同时写入 `toNext` 与 `toNextEstimate`（估算不可用时传 `null`，仅存方式）并 `bumpRevision`（复用防抖 PUT）；`moveStop`/`takeStop`/`insertStop` 透传 `toNextEstimate`（与既有 `toNext` 透传同模式）。另增 `backfillStopEstimate(ref, estimate)`：仅当该 stop `toNext` 已设且快照为空时写入并 `bumpRevision`，避免覆盖用户新选择。展示态取 `stop.toNext ?? "drive"`，不写回 store；存量 `transit` 同样按 `drive` 展示、不改写。备选「默认值落库」被否：用户已决默认仅 UI，避免无交互产生保存。

### D6：估算查询按「景点对 + 方式」缓存，快照存在时禁用

`queries/trips.ts` 新增 `routeEstimateQueryOptions(tripId, fromPoiId, toPoiId, mode)`，key `["trips", "route-estimate", tripId, from, to, mode]`，走统一 `request` 层；`enabled` = 段行可见 && 非 samePoi && 该 stop 无 `toNextEstimate` 快照（快照优先展示，不发请求）；切换方式时先清空旧快照再启用新方式查询。查询成功且 stop `toNext` 已设、快照为空 → 调 `backfillStopEstimate` 回填并触发保存。失败不重试或低重试（避免配额浪费），错误态渲染「估算暂不可用」。`staleTime`/缓存 TTL 与服务端缓存留 P3（Open Questions）。

### D7：Plan JSON v1 增量扩展 `toNextEstimate`，validator 同步扩展

`TripPlan.TripStop` record 增加 `toNextEstimate` 组件（嵌套 record `{durationMinutes, costLowYuan, costHighYuan}`，可空）；`TripPlanValidator.parseStops` 解析并校验：可省略/null；有值时三字段齐全且为数值，`durationMinutes` 为 ≥0 整数、费用 ≥0 且 low ≤ high，非法 → `ApiException(VALIDATION_ERROR)`；序列化经 `objectMapper.writeValueAsString(plan)` 自然携带（null 字段不输出，与既有 `toNext` 一致）。version 保持 1，无数据库迁移（快照存于既有 `plan_json` 列）。备选「独立表/列存快照」被否：快照与 stop 一一对应且随计划整体读写，独立存储引入同步与归属复杂度，无当前用例支撑。

### D8：每天政策对比为纯函数派生，每天首个景点行前非拖拽行渲染

`lib/trip/` 新增纯函数（如 `day-policy.ts`）：入参当天 stops、`cache.locations`、`activePet`，输出 `{leash: "required" | "required-no-leash" | null, sizeWarnings: [{poiId, name, weightLimitKg?, heightLimitCm?}]}`。规则：poiId 去重；任一 `leashRequired=true` → required，`activePet.hasLeash=false` → required-no-leash；体重/肩高任一维度档案值严格大于景点上限 → 该景点入 sizeWarnings（档案值缺失或缓存未加载 → 跳过，不警示）；未排期景点不参与。`trip-panel.tsx` 在每天第一个 StopRow 前渲染政策提醒行（day 标题与公交提示之后；与 HeaderRow 同模式，不进 SortableContext），无触发项不渲染（2026-11-17 用户位置修订：替换早前天末位置）。备选「服务端聚合接口」被否：数据已全量在前端缓存，新接口徒增往返与归属校验成本；备选「存 plan_json」被否：提醒为派生展示，随政策/档案变化应即时重算，落库会过时。

## Risks / Trade-offs

- [高德 Key 无驾车算路权限或配额不足] → P3 前用真实 Key 冒烟两个端点；失败走 502 + 前端兜底，不阻塞主流程。
- [`taxi_cost`/`duration` 字符串缺失或非数值] → 适配器类型化解析，异常统一映射 `UPSTREAM_FAILURE`，单测覆盖畸形响应。
- [每天 n−1 段并发请求带来延迟与配额压力] → 前端按 key 缓存、切换方式换 key；并发/限流细节 P3 设计。
- [坐标精度 >6 位小数被高德拒绝] → 适配器统一格式化，单测断言。
- [与 `unify-location-browsing` 面板文件文本冲突] → 仅更名级交集，概率低；合并 main 后复验面板渲染与 E2E。
- [段行插入影响 dnd-kit 索引计算] → 复用 HeaderRow 非拖拽行模式；E2E 覆盖插入段行后的同日/跨天拖拽。
- [trade-off：估算不校验段属于 plan] → 接口可被本人用于任意 poiId 对估算；接受（登录 + 归属已限权，配额风险由缓存缓解）。
- [快照过时（价格/路况变化后仍展示旧值）] → 用户已决快照优先；切换方式即重新估算更新，不做自动过期刷新（MVP）；后续可按 P3 缓存策略演进。
- [validator 扩展引入既有 plan 解析回归] → 先写快照解析/校验/往返单测再改 record，全量 trip 既有测试无回归为门禁。
- [回填与用户切换竞态（旧查询成功覆盖新选择）] → `backfillStopEstimate` 仅在 `toNext` 已设且快照为空时写入；切换方式先清空快照再启用新 key 查询，旧 key 结果不再回填。
- [政策缓存懒加载未完成时提醒短暂缺失] → 纯函数对缺失缓存跳过，加载完成后派生自然重算；不额外发请求（复用既有 missingPoiIds 拉取链路）。

## Migration Plan

无数据库迁移、无配置破坏性变更：新增端点、`toNextEstimate` 可选字段与前端行为均为增量；Key 未配置时应用照常启动、估算走兜底。部署即生效；回滚 = 回退代码：`toNext` 为既有字段，已写入的 `walk`/`drive` 值在旧版本下仍合法；注意旧版 `TripPlanValidator` 会丢弃 `toNextEstimate`，回滚后一旦触发 PUT 快照即丢失（方式保留），无需数据清理，重新部署新版后由回填机制恢复。

## Open Questions

- 前端 `staleTime`/缓存 TTL 与服务端是否加缓存（REQ-011 已 deferred，P3 设计决定，不改规格与任务拆分）。
- 「估算暂不可用」「不可携带宠物上车」「相邻景点相同」「打车携宠提示」「牵引绳/体型超限提醒」具体文案与视觉样式（规格只固定语义，P3 统一）。