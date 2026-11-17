---
id: kb.architecture.overview
title: Pawtrip architecture overview
area: architecture
---

# Pawtrip 架构概览

## 仓库结构

```text
pawtrip/
├─ apps/
│  ├─ web/      frontend: npm repo
│  └─ server/   backend: maven repo
└─ package.json npm workspace
```

## 技术栈

### 前端（apps/web）

- Vite 8、React 19、TanStack Router / Start、Tailwind CSS 4
- shadcn/ui，底层 primitive 为 Base UI（`@base-ui/react`，`base-nova` 风格）

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080
- 数据访问：Spring Data JPA + Hibernate 社区 SQLite 方言（`org.hibernate.community.dialect.SQLiteDialect`）
- schema 管理：Flyway 12.4.0；JPA `ddl-auto=none`，不自动建表或改表
- 数据库：SQLite 文件 `apps/server/data/pawtrip.db`，由 Flyway 迁移建表；当前迁移覆盖问候语（`V1`）、账号与角色（`V2`–`V3`）、地点/行政区与政策（`V4`–`V7`、`V9`）、宠物档案与犬种（`V8`、`V10`–`V14`）、城市养犬政策（`V15`）、全城市允许类型/品种种子（`V16`）、行程（`V17`）与行程大交通方式（`V18`）；测试账号由种子脚本按需注入
- 数据库文件属于本地运行产物，已由 `.gitignore` 排除

### 地图集成分层

后端地图能力按应用端口与基础设施适配器组织：

```text
com.pawtrip.server
├─ application/
│  ├─ model/maps/          内部地点搜索请求、分页元数据、原始 POI JSON 及路线估算请求/结果 record（REQ-011）
│  └─ port/maps/           应用功能调用的地点搜索端口与路线估算端口 RouteEstimatePort（REQ-011）
└─ infrastructure/amap/
   ├─ config/              高德服务端配置（AMAP_API_KEY 等）
   ├─ transport/           共用同步 HTTP 客户端、凭据注入及安全错误转换
   └─ api/                 高德具体 API 适配器（POI 搜索与路线估算 AmapRouteEstimateAdapter，REQ-011）
```

依赖方向为应用功能依赖 `application.port.maps`，`infrastructure.amap.api` 实现该端口并依赖共享传输和配置；应用模型不依赖 Controller、HTTP 响应类型或高德传输。POI 搜索仅是内部能力，不增加 Controller、`/api/pois/*` 路由或单独的 `poi` 包。路线估算（REQ-011）以独立 `RouteEstimatePort` 接入（不扩展 PlaceSearchPort），适配器只做协议解析，±20% 费用区间/分钟向上取整/步行 ¥0 换算在 `trip.TripRouteEstimateService`，端点 `GET /api/trips/{tripId}/route-estimate` 挂 trip 模块；外部协议见 [高德路线规划 2.0](../external/amap-route-planning.md)。高德凭据只从服务端配置读取，缺失时应用仍可启动，实际调用再以类型化错误失败。

### 地点查询与管理

`com.pawtrip.server.location` 是地点查询与管理功能模块，包含共享只读查询、管理员地点与城市 API、应用服务、地点/行政区/照片持久化实体及 Spring Data 仓库。管理 API 位于 `/api/admin/**`，由 Spring Security 在服务端要求 `ADMIN`；高德候选查询调用 `application.port.maps.PlaceSearchPort`，不得直接依赖 `infrastructure.amap` 实现。

- `GET /api/locations/types`：所有登录用户可读，返回共享地点类型目录及高德 typecode 映射；管理端 AMap 搜索与用户/管理端筛选复用同一目录。
- `GET /api/locations`：所有登录用户可读，按数据库分页查询已保存地点，不调用高德。支持可选 `regionCode`、`typeGroup`、`petFriendlyOnly`、`page`、`pageSize`；普通用户必须传区域，管理员可省略区域查询全部。区域支持省或城市级行政区并匹配其下级地区；`petFriendlyOnly=true` 时只返回 `max_pets_per_person >= 1` 的地点。分页默认第 1 页、每页 20 条，按地点 ID 升序。
- 共用列表项包含 `poiId`、名称、类型、地址、经纬度、区域、游玩时间、`maxPetsPerPerson` 与完整 `petPolicies`。列表不得返回原始 POI、`business` 或照片详情。
- `GET /api/locations/{poiId}`：登录用户可读的地点浏览详情，返回基础信息与 8 项政策字段，不返回照片、`business` 或原始 POI JSON；不存在返回 `404 LOCATION_NOT_FOUND`。
- 管理员专属操作仍位于 `/api/admin/**`：`GET /api/admin/regions` 读取区域树；`GET /api/admin/locations/amap` 搜索高德候选；`GET /api/admin/locations/{poiId}` 读取管理编辑详情；`POST /api/admin/locations` 与 `PATCH /api/admin/locations/{poiId}` 创建或更新地点。地点详情与创建/更新请求通过可选 `petPolicies` 对象维护政策。
- 城市管理 API：`GET /api/admin/cities` 按省份、级别、关键词筛选并以城市为单位服务端分页（默认第 1 页、每页 10 条，列表在内存中筛选与切片）；范围内包含全部 `level='city'` 记录与无市级子节点的省级叶节点。`GET /api/admin/cities/{adcode}` 返回详情；`PATCH /api/admin/cities/{adcode}` 接受可选 `petPolicies`（8 项整体替换，字段 `null` 清空）与可选 `allowedDogBreedIds`（整体替换、空数组清空、重复去重）。未知 adcode 返回 `404 REGION_NOT_FOUND`；非叶省份或非法值返回 `400 VALIDATION_ERROR`。前端 `/admin/cities` 仅管理员可见，复用地点页的服务端分页表格与 8 项政策表单。

### 城市养犬政策模块（policy）

`com.pawtrip.server.policy` 提供城市养犬政策的只读查询：

- `GET /api/cities/{adcode}/pet-policy`：需登录；可选 `breedId`。返回 `adcode`、`name`、`covered`、`areaScope`、`policies[]`、`bannedBreeds[]`、`allowedBreeds[]`、`source{title,note}`、`updatedMonth` 与 `match{breedId,breedName,matched,allowed}|null`。
- 已收录以 `city_pet_policy` 是否存在该 `adcode` 行为准（`covered=true`）；未收录返回 `200 + covered:false`，未知 adcode 返回 `404 CITY_NOT_FOUND`。
- 数据模型：`city_pet_policy` 保存政策条目 JSON、来源与更新月份；`city_banned_dog_breed` 以 `(adcode, dog_breed_id)` 关联 `dog_breed`。V15 建表并写入珠海（`440400`，严格管理区、2025-07），映射 8 个可选犬种；珠海通告中其余 30 个品种不在 `dog_breed` 词表内，不参与判定。
- `allowedBreeds` 来自 `city_allowed_dog_breed`：V16 为全部城市级行政区预置 `allowed_pet_types='CAT,DOG'` 与 7 个非烈性品种（词表同 `dog_breed`），之后由 `/admin/cities` 整体替换维护。名单为空时页面显示“暂未收录可携带犬种”，不得据此推断允许。
- 后端 `match` 仅在传入合法 `breedId` 且该品种至少出现在禁养或可携带关联中时返回：`matched=true` 表示命中禁养，`allowed=true` 表示在可携带名单；两者都未命中返回 `null`（不判定）。
- 用户端政策页 `/destinations/$adcode/policy` 以 `breedId=null` 查询，随后在前端 `lib/trip/policy-match.ts` 的 `matchCityPolicy` 中按统一政策匹配主体逐宠物按犬种名称判定：命中禁养 → `unfriendly`；在可携带名单 → `friendly`；可携带名单为空 → `unconfigured`；其余 → `unjudgeable`。`/cities` 城市详情卡展示政策要点、可携带犬种示例与“查看完整城市政策”入口。
- 与 `GET /api/destinations` 的区分：候选接口的 `policyCovered`/`bannedBreeds` 仍为占位值；真实城市政策只从本接口读取。

### 用户端地点浏览与行程规划（REQ-009）

用户端 `/attractions` 页面展示为“地点浏览”，保留既有路由。存在激活行程时，页面固定以 `active.cityAdcode` 查询共享 `GET /api/locations`，默认类型为“景点”；不提供城市选择。无激活行程（含仅有草稿）时展示“先创建或激活行程”空态且不请求地点列表。地点类型切换重置为第一页；默认宠物友好筛选传 `petFriendlyOnly=true`，开启“显示全部地点”传 `false`。所有类型地点详情均可展示逐宠物政策，并提供“添加到行程”和“暂不排期”操作。页面不展示天数 Tabs；添加选择器由 `active.totalDays` 生成“第 1 天”至“第 N 天”。详情在列表页内打开，关闭后保留筛选与分页；不提供 `/attractions/$poiId` 独立路由。

地点浏览不新增数据库迁移；E2E 夹具由 `scripts/seed-e2e-attractions.mjs` 写入临时 E2E 库，不触碰 `apps/server/data/pawtrip.db`。

### 目的地候选功能模块

`com.pawtrip.server.destination` 是目的地候选功能模块（US-47），只读、无写入端点：

- `GET /api/destinations`：需登录（沿用 `/api/**` 认证链，未登录 `401 UNAUTHENTICATED`）；返回全部城市级行政区候选数组（`level='city'`，按名称排序，`@EntityGraph` 一次性抓取允许品种），每项含 `adcode`、`name`、`province`（父级省名）、`policyCovered`、`bannedBreeds[]`、`allowedPetTypes`（string|null）、`allowedDogBreedIds`（number[]）、`maxSinglePetShoulderHeightCm`（number|null）。可选查询参数：`keyword`（服务端按城市名/省份 trim 后 contains 过滤）、`petFriendly=true`（服务端叠加筛选：每人限养数 `max_pets_per_person` 为 null 或 >=1，且传 `petType`（CAT/DOG，非法 400）时 `allowed_pet_types` **须非 null 且含该类型（null=不允许）**，且 `petType=DOG` 传 `breedId` 时城市允许品种列表为空（未配置）或含该 id，且传 `shoulderHeightCm` 时城市肩高上限为 null（不限制）或 >= 该值；未传档案参数退化为仅限养数规则）。后端不引用宠物档案模块，匹配输入由前端传参。
- 政策数据暂缓（2026-11-16 需求方移除原 V14 政策种子迁移）：`policyCovered` 占位恒为 `false`、`bannedBreeds` 占位恒为空数组；收录状态与禁养名单的数据源确定后恢复（判断点在 `DestinationController` 留 TODO）。原摘录稿存档于 `openspec/changes/destination-selection/seed-data.md`。**例外**：V16 按需求方指定为**全部城市级行政区**注入 `allowed_pet_types='CAT,DOG'` 与 7 个非烈性允许品种（柯基犬/贵宾犬/金毛寻回犬/拉布拉多寻回犬/比熊犬/博美犬/哈士奇，`city_allowed_dog_breed`，词表同 `dog_breed`）；肩高上限未配置（null=不限制）。真实城市养犬政策已由 `GET /api/cities/{adcode}/pet-policy` 提供，本候选接口的政策占位字段仍保持。
- 禁养匹配纯函数 `breedHitsBanList`（档案品种 × 名单，精确匹配）保留于前端 `lib/destination-matching.ts` 并附单测，但当前 UI 不再使用；目的地候选卡改用 `matchCityCandidate` 展示逐宠物 tag，禁养提醒与完整政策由城市政策页承担。后端不引用宠物档案模块（档案由外部 US-01 change 交付）；选定城市只创建前端草稿，确认后由 trip-context 调用 `POST /api/trips` 持久化。
- 迁移版本：本模块全城市允许类型/品种种子为 **V16**；`V15` 已被城市养犬政策（`city_pet_policy`）占用，`V17`/`V18` 为行程与行程大交通方式。新增迁移前需复核 main 最新版本号。


### 前端行程上下文（trip-context）

前端以服务端 trip 为唯一规划载体，`apps/web/src/lib/trip/` 与 `queries/trips.ts` 组成运行时上下文：

- **store 形状**（`lib/trip/types.ts` / `store.ts`）：TanStack Store 单例 `tripStore`，`TripState = { draft, active, cache, panel, save, hydration, saveRevision }`。`active` 与 DB 字段同构（`id`、`name`、`cityAdcode`、`petId`、`totalDays`、`transportMode`、`plan`、`createdAt`、`updatedAt`），不附加视图字段；`plan` 为 v1 `{version, days, unscheduled}`；`transportMode` 为 `flight`/`high_speed_rail`/`train`/`drive` 或 `null`；`cache` 仅存内存中的城市、宠物与地点详情，供面板与匹配使用。
- **生命周期**：`/cities` 无行程时展示候选；点击“选定”调用 `startDraft` 创建仅内存草稿并展开左下角面板，页面切到城市详情，不调用 `POST /api/trips`。面板在草稿期可改天数（1–7）与单只宠物；确认时自动生成 `{城市名} · {totalDays}天 · {宠物名}` 并 `POST /api/trips`，成功后 `setActive` 并写入 `activeTripId`；“放弃草稿”回到候选列表。刷新会丢失未确认草稿。
- **持久化与 hydrate**（`persistence.ts` / `hydrate.ts`）：localStorage 只写 `pawtrip.activeTripId`；登录后的客户端挂载读取该 id 并 `GET /api/trips/{id}`。成功写入 `active` 并补全城市/宠物缓存；`404`/`401` 清除 id 与本地状态；网络失败保留 id，`hydration = idle` 并展示重试入口。SSR 阶段 store 为空且不读取存储。登出执行 `clearTripContext()` 清除 id、草稿、行程与缓存，再调用 `queryClient.clear()`。
- **Trips 页**（`/trips`）：列出本人行程（后端按 id 升序），join 城市名与宠物名；支持激活、取消激活、删除。同一时间最多一个激活行程；存在激活行程时创建入口不可用；存在草稿时禁止激活其他行程；删除激活中的行程先取消激活再 `DELETE`，失败恢复原状态。
- **行程面板**（`components/trip/trip-panel.tsx`）：基于 vendored `components/ui/animated-list.tsx`（移除了默认项与 hugeicons，增加不可选中的分组表头），按 `active.totalDays` 渲染每天表头 + stops + “未排期”分组；标签行展示城市、天数、宠物，已选择大交通时追加“大交通 · {方式}”tag。展开态在桌面端固定左侧约 364px 并使页面内容在剩余区域居中，移动端为全屏面板；`/login` 不渲染。拖拽使用 `@dnd-kit/core` + `@dnd-kit/sortable`，每天与未排期作为可放置容器，支持同日排序、跨天移动、拖入/拖出未排期；同日允许重复 `poiId`，视图 key 由 `container:index:poiId` 派生。
- **自动保存**（`save.ts`）：地点编辑与交通方式选择先乐观更新 store，再由 `_authenticated` 布局监听 `saveRevision` 触发约 600ms 防抖 `PUT`，请求体为 `{name, totalDays, plan, transportMode}`。版本号守卫只允许最新响应改写状态；失败保留本地并提供重试；`400 VALIDATION_ERROR` 时重新拉取详情并以服务端数据为准。保存状态（保存中/已保存/保存失败）展示在面板标签行。
- **统一政策匹配主体**（`policy-subjects.ts` / `policy-match.ts`）：存在激活行程且已绑定宠物时只匹配该宠物，否则匹配全部宠物；宠物加载失败展示“暂时无法读取宠物”而非“无宠物”。结论统一为 `friendly | unfriendly | unjudgeable | unconfigured`，以“宠物名 · 结论”tag 展示，覆盖城市候选、城市政策页、地点列表/详情与交通规则推荐列。
- **旧状态清理**：已删除 `lib/selected-destination.ts` 与 `lib/trip-duration.ts`；启动/登录后清理 `pawtrip.selectedDestination`、`pawtrip.tripDuration` 残留键；顶栏目的地 chip 移除。交通方式改存 active trip，`pawtrip:selected-transport-mode` 不再读写，旧值不参与业务。
- **途内交通段行与政策提醒（REQ-011）**：面板每天相邻景点间插入交通段行（`lib/trip/transport-segments.ts` 派生 + `components/trip/transport-segment.tsx` 渲染，n 景点→n−1 段，同 POI 仅小字提醒，段行不可拖拽）；展示快照优先（`stop.toNextEstimate`），无快照时经 `routeEstimateQueryOptions` 查估算（有快照/同 POI 时 enabled=false，成功后条件回填 `backfillStopEstimate`）；默认展示态由 `displayToNext` 派生不写库，显式选择任一方式经 `setStopTransport` 写库并走既有防抖 PUT；估算失败行内兜底「估算暂不可用」（该查询显式 `throwOnError:false`，不命中全局错误边界），仍可仅存方式。大交通自驾（`transportMode=drive`）时段行默认驾车仅时长，下拉可显式选打车/步行/驾车（选驾车写 `self_drive` + 费用 0/0 快照），隐藏每天公交提示；切换大交通不改写已存选择/快照。每天首景点行前渲染宠物政策对比提醒（`lib/trip/day-policy.ts` 纯函数：牵引绳聚合 + 严格超限警示，复用地点缓存与激活宠物，无新增请求不写库）。

### 服务端行程规划（trip-planning）

- `com.pawtrip.server.trip` 新增 `Trip` 实体、`TripRepository`、`TripService`、`TripController`；Flyway **V17** 创建 `trip` 表：`user_id`、`name`、`city_adcode`、`pet_id`、`total_days`、`plan_json`、`created_at`、`updated_at`，索引 `(user_id, id)`；**V18** 增加可空 `transport_mode`，CHECK 仅允许 `flight` / `high_speed_rail` / `train` / `drive`。
- 城市与宠物在创建后不可变：`city_adcode` 必须为城市级 `administrative_region`，`pet_id` 必须属于当前用户；更新接口只接收 `name`、`totalDays`、`plan`、`transportMode`。
- `plan_json` v1：`{"version":1,"days":[{"day":1,"stops":[{"poiId":"...","toNext":"walk","toNextEstimate":{"durationMinutes":12,"costLowYuan":40,"costHighYuan":60}}]}],"unscheduled":[{"poiId":"..."}]}`。`toNext` 仅 `walk` / `drive` / `transit` / `self_drive`（REQ-011 扩展），全部可选且不做下一天引用校验；可选 `toNextEstimate` 快照（REQ-011）三字段均必填：`durationMinutes` 非负整数分钟、`costLowYuan`/`costHighYuan` 非负数值且 low≤high，非法返回 `400 VALIDATION_ERROR`，合法快照 PUT→详情往返原样保留；`days`、`stops`、`unscheduled` 均可为空，空计划合法并作为新建默认值。`unscheduled` 按 `poiId` 去重，已排期地点从池中移除；同一 `poiId` 可在 `days` 重复。
- `poiId` 只校验存在于 `pawtrip_location`（不校验城市归属）；`day` 唯一且在 `1..totalDays`；`totalDays` 调小到低于计划最大 `day` 返回 `400 VALIDATION_ERROR`。
- API：`GET/POST /api/trips`、`GET/PUT/DELETE /api/trips/{id}`；均需登录且只能访问本人 trip，列表返回摘要不含 `plan` 与 `transportMode`，详情/创建/更新返回完整计划；未找到返回 `404 TRIP_NOT_FOUND`。
- 途内交通估算（REQ-011）：`GET /api/trips/{tripId}/route-estimate?fromPoiId&toPoiId&mode`，`mode ∈ {walk, drive}`；需登录且仅限本人 trip（否则 `404 TRIP_NOT_FOUND`），缺参/非法 mode/poiId 不存在或坐标缺失 `400 VALIDATION_ERROR`，上游失败/Key 缺失 `502 UPSTREAM_FAILURE`（不泄露 Key 与原始报文）；响应 `{mode, durationMinutes, costLowYuan, costHighYuan}`：驾车费用为 `taxi_cost` ±20%、时长分钟向上取整，步行费用 0/0；只读估算，不修改 `plan_json`（快照由前端经既有防抖 PUT 落库）。换算在 `TripRouteEstimateService`，外部协议见 [高德路线规划 2.0](../external/amap-route-planning.md)。
- `transportMode`：可空；创建/更新请求可携带，非法值返回 `400 VALIDATION_ERROR`；详情与创建/更新响应返回该字段。交通方式选择在规则页触发 `tripActions.setTransportMode`，并走同一防抖保存链路。
- 宠物删除：`trip.pet_id` 外键为 `ON DELETE RESTRICT`；删除被 trip 引用的宠物返回 `409 PET_IN_USE`，未被引用的宠物保持 `204`。
- 前端已按 trip-context 接入本接口：草稿确认调用 `POST /api/trips`，Trips 页激活调用 `GET /api/trips/{id}`，计划编辑与交通方式选择以防抖 `PUT` 保存；不修改后端契约，也不新增迁移。

## 运行拓扑

```text
Browser (http://localhost:3000)
   │  GET /api/greeting
   ▼
Vite dev server ── /api proxy ──▶ Spring Boot (http://localhost:8080)
                                      │
                                      ▼
                              SQLite apps/server/data/pawtrip.db
```

## 数据与接口

- `greeting` 表：`id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`；当前单条记录由迁移写入。
- `GET /api/greeting`：需登录；通过 `GreetingRepository.findFirstByOrderByIdAsc()` 读取单条问候语，返回 `200` + `application/json` + `{"message":"Hello World"}`；未登录返回 `401 UNAUTHENTICATED`。
- 首页通过 TanStack Query 在客户端请求同源 `/api/greeting`，仅展示响应中的 `message`，不在前端硬编码文案。
- 错误响应统一为 RFC 9457 Problem Details（`application/problem+json`），并扩展稳定字段 `code`；成功响应不套统一 envelope。

### 宠物接口与品种

- 宠物接口：`GET/POST /api/pets`、`GET/PUT/DELETE /api/pets/{id}`，均需登录且只能访问本人宠物；请求体包含 `name`、`petType`、`weightKg`、`shoulderHeightCm`、`hasLeash`、`hasVaccinationProof`、可选 `photo`（base64）与 `dogBreedId`。
- 品种：`dog_breed` 表保存 20 条常见犬种；`GET /api/dog-breeds` 按名称升序返回 `id`、`name`、`officialAggressive`。`pet.dog_breed_id` 为可空外键（`ON DELETE SET NULL`）。
- 校验：类型为 `DOG` 时 `dogBreedId` 必填且必须存在；类型为 `CAT` 时不得携带品种；历史无品种的狗可读取，详情显示“未设置”，编辑保存前必须补选。
- 响应：宠物详情与列表返回嵌套 `dogBreed` 对象；无品种时为 `null`。

## 认证与授权

- 登录方式：Spring Security 表单登录（`formLogin`），登录处理地址 `POST /api/auth/login`，使用服务端会话 `JSESSIONID`；不使用 JWT，也不在前端存储认证令牌。
- 账号来源：数据库 `app_user` 表（`username` 唯一、`password_hash` 为 BCrypt 哈希、`enabled` 控制启用）。Flyway `V2__create_app_user.sql` 仅建表，不注入账号；本地/测试账号由 `npm run seed:users`（`scripts/seed-users.mjs`）以 bcrypt cost 10 哈希后幂等写入。
- 会话：`server.servlet.session.timeout=30m`；会话 cookie 为 `HttpOnly`、`SameSite=Lax`；登录成功后通过 `changeSessionId()` 更换会话 ID 防止会话固定。
- 授权规则：`/api/auth/login|me|logout`、`/error` 与 ERROR dispatch 放行；`/api/admin/**` 需 `ADMIN`；其余 `/api/**` 需认证；其余请求 `denyAll`。
- 认证接口：`GET /api/auth/me` 返回 `{username, role}`；`POST /api/auth/logout` 成功后返回 `204`。
- CSRF：启用 `csrf.spa()` 与 `CookieCsrfTokenRepository`，服务端通过 `CsrfCookieFilter` 下发可读的 `XSRF-TOKEN` cookie；前端对非安全方法回传 `X-XSRF-TOKEN` 头。
- 错误语义：安全过滤链中的未认证/拒绝访问与 MVC 层输出相同 Problem Details（`application/problem+json` + 稳定 `code`），不会返回 HTML 登录页或 `302`；未认证为 `401 UNAUTHENTICATED`，CSRF/权限不足为 `403 ACCESS_DENIED`，登录失败为 `401 INVALID_CREDENTIALS`，响应不区分用户名是否存在。
- 日志：登录失败与异常日志不记录密码、哈希或会话 ID。

### 前端认证

- 认证状态由 `apps/web/src/queries/auth.ts` 的 `authQueryOptions`（query key `["auth","me"]`）统一管理，仅在客户端启用（SSR 阶段不取数）。
- `apps/web/src/routes/_authenticated.tsx` 是 pathless 受保护布局，`/`、`/paws`、`/cities`、`/attractions`、`/transport-rules`、`/trips` 与管理员页面均位于其下；未登录或 `401` 时跳转 `/login`，已登录渲染 `<Outlet />`。
- 登录页 `/login` 使用表单编码提交；成功后将当前用户写入 auth query 缓存并跳转 `/`；已登录访问 `/login` 时跳回 `/`。
- 顶部导航仅在已登录时显示“退出登录”；登出成功后清空 Query 缓存并跳转 `/login`。
- `QueryCache.onError` 对非 auth query 的 `401` 清理受保护缓存并使 auth query 失效，从而触发守卫跳转；登录失败自身的 `401` 不触发全局跳转。
- 请求层显式使用 `credentials: "same-origin"`，从 `XSRF-TOKEN` cookie 读取令牌并写入 `X-XSRF-TOKEN` 请求头；SSR 阶段跳过浏览器 cookie 读取。

## 实现约定

### 后端数据访问

- 关系型数据访问统一使用 Spring Data JPA 仓库；简单查询优先使用派生查询或 JPQL。
- 控制器与服务层不直接使用 `JdbcTemplate` 手写 SQL；原生 SQL 仅在派生查询/JPQL 无法表达时使用，并在代码或变更记录中说明原因。
- schema 由 Flyway 管理，JPA 不执行自动 DDL。

### 后端错误处理

- 业务异常继承 `ApiException` 并携带 `ApiErrorCode`（HTTP 状态、稳定 code、英文 title）。
- `GlobalExceptionHandler` 统一映射领域异常、校验异常与未捕获异常，输出 Problem Details：`type`、`title`、`status`、`detail`、`instance` 与扩展字段 `code`。
- `detail` 使用英文、偏技术化描述，供开发者与错误页展示；不承担面向终端用户的本地化文案职责。
- 未捕获异常记录服务端错误日志并返回 `500` + `INTERNAL_ERROR`，不向客户端泄露堆栈或内部细节。
- `spring.mvc.problemdetails.enabled=true`，框架内建异常也走同一 Problem Details 格式。

### 前端 UI 基础

- UI 组件统一来自 `apps/web/src/components/ui/`，使用 shadcn/ui 的 Base UI 版本；不引入 Radix 版本或其他 UI 组件库。
- 宠物卡片使用 React Bits Tilted Card 的 TS + Tailwind 变体，以源码形式纳入 `apps/web/src/components/ui/tilted-card.tsx`，不新增运行时依赖，也不引入自定义 CSS 类。
- 页面结构与交互只通过组件库组合和 Tailwind 布局工具类表达；`apps/web/src/styles.css` 仅保留 Tailwind、`shadcn/tailwind.css` 与主题令牌，不新增自定义类。
- 应用外壳位于 `apps/web/src/routes/__root.tsx`：顶部居中的 `Home` / `Paws` / `城市浏览` / `地点浏览` / `交通规则` / `Trips` 六个主 Tab 与真实路由 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules`、`/trips` 同步；管理员额外显示 `地点管理`（`/admin/locations`）与 `城市管理`（`/admin/cities`）两个 Tab；`/attractions` 归入“地点浏览”Tab 选中态；`/` 展示问候语，`/paws` 展示当前用户的宠物画廊并支持查看、编辑、新增与删除；狗类型在表单中必须从 `GET /api/dog-breeds` 选择品种，卡片右下角优先显示狗品种，无品种时回退显示猫/狗类型。`_authenticated` 布局负责行程 hydrate、自动保存与全局行程面板，`/login` 不渲染面板。

### 前端服务端状态

- 服务端数据统一使用 TanStack Query 获取与缓存；`QueryClient` 在 `getRouter` 内按请求创建，并通过 `setupRouterSsrQueryIntegration` 接入 router context。
- query key 与 query function 集中定义在 `apps/web/src/queries/`；页面组件使用 `useQuery`，不使用 `useEffect` + `fetch` 自行管理请求状态。
- 宠物照片以 base64 存储并由 `GET /api/pets` 返回，没有 content type；前端在 `apps/web/src/lib/pet-photo.ts` 按 JPEG/PNG/GIF/WebP 魔数推断 MIME 后生成 data URL，无照片或无法识别时展示占位。
- 依赖 Vite `/api` 代理的相对 URL 接口保持客户端取数，不在 SSR loader 中直接请求。

### 前端请求与错误呈现

- 所有接口调用经过 `apps/web/src/lib/http/request.ts`：统一 JSON headers、超时与 `AbortSignal`、Problem Details 解析，并把非 2xx 响应转换为 typed `ApiError`。页面与 query 函数不直接调用 `fetch`。
- `ApiError` 暴露 `status`、稳定 `code`、`detail`、`instance` 与 `isRetryable`；网络错误与超时映射为可重试错误。
- QueryClient 默认 `staleTime=30s`；仅对可重试错误（网络错误与 5xx）重试，最多 2 次；4xx 不重试。
- 首次加载失败通过 `throwOnError` 进入根路由 `errorComponent`，展示 `ApiError.detail` 并提供重试；后台刷新失败保留缓存数据，仅由 `QueryCache`/`MutationCache` 的 `onError` 记录日志，不替换页面。例外：途内交通估算查询（REQ-011）显式 `throwOnError:false`，失败必须在段行内兜底，不得拖垮整页。
- 未匹配路由由根路由 `notFoundComponent` 呈现；不引入 toast、成功响应 envelope 或 `detail` 到中文文案的 i18n 映射。

## 测试与验证

- 后端：`cd apps/server && ./mvnw test`，包含使用临时 SQLite 文件的接口验收测试与错误路径测试。本地 E2E 前可运行根目录 `npm run seed:users` 注入开发库测试账号；`scripts/run-e2e.mjs` 会为临时库自动执行种子。
- 前端：根目录 `npm run build`；类型检查 `npx tsc --noEmit -p apps/web/tsconfig.json`。
- 端到端：`npm run test:e2e` 通过 `scripts/run-e2e.mjs` 使用临时 SQLite 启动后端（18080）与前端（3100），依次执行用户种子与 `scripts/seed-e2e-attractions.mjs`，覆盖认证、宠物、地点政策、城市政策、交通规则与行程面板；`npx playwright test` 复用同一配置。冷启动后端后确认数据库文件与接口，再启动前端验证登录/登出、受保护路由跳转、`/` 问候语、`/paws`、Tab 切换、前进后退、404 与首页首次加载失败；CORS 不在当前范围。
