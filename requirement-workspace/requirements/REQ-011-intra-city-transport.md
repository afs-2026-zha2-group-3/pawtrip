---
id: REQ-011
title: 途内交通推荐（打车/步行）
status: in-change
discovery: Go (2026-11-17)
impact: ../analysis/REQ-011/impact-brief.md
deep_dive: ../analysis/REQ-011/deep-dive.md
sources:
  - ../intents/REQ-011-intra-city-transport.md
  - apps/web/src/components/trip/trip-panel.tsx
  - apps/web/src/lib/trip/store.ts
  - apps/server/src/main/java/com/pawtrip/server/trip/TripPlanValidator.java
  - apps/server/src/main/java/com/pawtrip/server/infrastructure/amap/transport/AmapTransport.java
  - openspec/specs/trip-planning/spec.md
  - openspec/specs/trip-context/spec.md
  - docs/knowledge/architecture/README.md
  - docs/knowledge/external/README.md
  - https://lbs.amap.com/api/webservice/guide/api/newroute
---

# REQ-011：途内交通推荐（打车/步行）

## Discovery Decision

Go — 需求边界明确：在既有行程面板（TripPanel）按天视图中，为相邻两个景点插入途内交通段行；打车/步行由服务端代理高德路线规划 2.0 估算参考费用区间与时长，地铁/公交仅静态提示不可携宠；方式选择复用 `plan_json` v1 既有的 `stop.toNext` 契约与防抖保存。`toNext` 字段、高德传输层/配置、景点经纬度均已存在，属"扩展既有能力"，无候选缺失或覆盖不明。

## 六字段

1. **id**：REQ-011
2. **statement**：已登录用户的激活行程在行程面板按天视图中，每两个相邻景点之间展示一段途内交通：用户可在「打车 / 步行」间选择，系统经服务端调用高德路线规划 2.0 估算并展示参考费用区间与预计时长；地铁/公交仅静态提示「不可携带宠物上车」，不可选、不调用 API；打车段行内展示携宠乘车小字提示（宠物专车/司机同意/航空箱）；每天第一个景点行前按绑定宠物档案与当天景点政策对比展示小字提醒（牵引绳/体型超限）；用户显式选择后将方式与估算快照写入 `plan_json` 的 `stop.toNext`（`drive`=打车、`walk`=步行）与新增可选 `stop.toNextEstimate`（时长 + 费用区间），随既有防抖保存持久化；打开视图优先展示已存快照、不调高德，刷新后恢复。
3. **actors**：
   - 已登录用户：查看按天行程、选择每段途内交通方式、查看费用与时长参考
   - 前端应用 `apps/web`（TripPanel / trip store）：渲染交通段行、发起估算查询、写入 `toNext` 与 `toNextEstimate` 快照并触发防抖保存
   - 服务端 `apps/server`（trip 模块 + 高德路线规划适配器）：校验归属与参数、读取景点坐标、代理高德算路、返回估算结果
   - 高德 Web 服务（外部依赖）：路线规划 2.0 驾车/步行接口
   - 公共交通运营方政策（静态数据来源）：地铁/公交不可携宠的统一提示口径，MVP 人工整理、前端写死
4. **rationale**：用户往往到了当地才发现打不到愿意接宠物的车；在按天行程中提前给出每段的参考费用与时长，可降低现场不确定性。MVP 不做实时计价、可携宠筛选（Release 2）与站内叫车，保持低耦合的展示 + 估算能力。
5. **acceptance hints**：
   - AC-1（按天展示）：某天有 n（n≥2）个景点时，按天视图展示 n−1 个交通段行；仅 1 个或 0 个景点时不展示段行
   - AC-2（与地点关联）：每个段行紧邻其对应的上一景点行渲染，语义为「该景点 → 下一景点」；当天最后一个景点无段行
   - AC-3（费用与时长）：选择打车时展示 `taxi_cost` ±20% 的费用区间与预计时长（分钟）；选择步行时展示预计时长（分钟）与费用 ¥0
   - 默认方式：`toNext` 未设置时 UI 默认按打车展示估算；`plan_json` 中 `toNext` 保持为空，直到用户显式选择
   - 公共交通：每天标题下展示一条「地铁/公交：不可携带宠物上车」类静态提示（该天有交通段时），不可选择、不触发算路
   - 打车携宠提示：每个当前方式为打车的段行内展示小字提示「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」类语义；步行段与同 POI 段不展示
   - 每天政策对比提醒：当天任一景点 `leashRequired=true` → 每天首个景点行前小字「当天需携带牵引绳」（档案 `hasLeash=false` 加强「请自备」）；景点设体重/肩高上限且绑定宠物超限 → 警示「您的宠物超出XX景点限制（≤Xkg/≤Ycm）」，未超限不提示；纯前端派生、不写库
   - 持久化：切换方式后 `stop.toNext` 与估算快照 `stop.toNextEstimate {durationMinutes, costLowYuan, costHighYuan}`（步行 0/0）一并更新，触发既有防抖 `PUT /api/trips/{id}`；刷新后从 `plan_json` 恢复方式与快照
   - 快照优先：已有快照的段打开视图时直接展示存值、不调高德；无快照时按需查询；`toNext` 已选但快照为空时估算成功后补写
   - 失败兜底：高德 Key 缺失、上游失败或景点坐标缺失时，段行展示「估算暂不可用」，不阻塞方式选择与行程保存；选择时估算不可用 → 仅存方式、快照留空
   - 相邻景点相同：该段不调用高德、不计算价格与预估时间，仅在景点行下方展示一行小字提醒用户景点相同
6. **links to evidence**：
   - 按天视图与地点行渲染：`apps/web/src/components/trip/trip-panel.tsx`
   - `toNext` 透传与计划编辑：`apps/web/src/lib/trip/store.ts`、`apps/web/src/lib/trip/plan.ts`
   - `toNext` 服务端校验（`walk`/`drive`/`transit`）：`apps/server/src/main/java/com/pawtrip/server/trip/TripPlanValidator.java`
   - 高德共享传输与 Key 配置：`apps/server/src/main/java/com/pawtrip/server/infrastructure/amap/transport/AmapTransport.java`、`apps/server/src/main/resources/application.yml`
   - 景点经纬度：`pawtrip_location`（`LocationQueryResponses.LocationSummary` 含 `longitude`/`latitude`）
   - 既有契约：`openspec/specs/trip-planning/spec.md`（Plan JSON v1）、`openspec/specs/trip-context/spec.md`（面板与防抖保存）
   - 高德路线规划 2.0 官方文档：https://lbs.amap.com/api/webservice/guide/api/newroute （2026-11-17 核对：驾车 `route.taxi_cost` 为基础字段；驾车/步行时长需 `show_fields=cost`，单位秒；坐标经度在前、小数 ≤6 位）

## Ready 形状

### Intent

让携宠出行用户在查看每天行程时，就能知道相邻景点之间「打车大概多少钱、多久；步行多久」，并选定每段的途内交通方式；公共交通明确告知不可携宠，避免到了当地临时找车。

### Actors 与权限边界

- 已登录用户可操作激活行程的途内交通选择；估算接口 MUST 要求登录，且只能估算本人行程关联的景点段（沿用 trip 归属校验口径）。
- 未登录用户由既有认证守卫拦截；本需求不改变权限模型与 Spring Security 放行名单。
- 高德 Key 仅存在于服务端配置；前端 MUST NOT 直接调用高德或接触 Key。

### In / Out Scope

**In**

- TripPanel 按天视图中相邻景点间的交通段行：方式选择（打车/步行）+ 参考费用区间与预计时长
- 服务端估算 API（登录保护）+ 高德路线规划 2.0 适配器（步行/驾车），沿用端口/适配器架构与共享传输层
- 地铁/公交「不可携带宠物上车」静态提示（前端写死，MVP 统一口径）
- 打车段行内携宠乘车小字提示（宠物专车/司机同意/航空箱，前端写死，语义固定）
- 每天宠物政策对比提醒（绑定宠物档案 × 当天已排期景点政策：牵引绳聚合 + 体型超限警示，纯前端派生，复用既有政策缓存与宠物查询）
- `stop.toNext` 方式选择与 `stop.toNextEstimate` 估算快照的写入、防抖保存与刷新恢复（复用既有保存链路；Plan JSON v1 增量扩展可选字段）

**Out**

- 租车安排（原始 Story 四类之一；用户 2026-11-17 最新口径未覆盖，记为 Out，后续需求另立）
- 实时计价、站内叫车、可携宠筛选（Release 2）
- 公共交通算路调用与可携宠公共交通判定
- 服务端估算缓存策略（缓存细节留 P3 设计；估算 API 本身不写库，快照由前端随 PUT 写入）
- `plan_json` 破坏性结构变更（本次仅增量新增可选 `toNextEstimate`，version 保持 1，旧数据兼容）、新增导航 Tab 或路由
- 大交通（`transportMode`）与交通规则页行为

### Scenarios + AC Hints

#### S1：按天展示交通段（AC-1 / AC-2）

- **Given** 激活行程第 1 天串联了 3 个景点
- **When** 用户查看第 1 天行程
- **Then** 景点行之间展示 2 个交通段行，每段关联其相邻两景点；当天最后一个景点之后无段行

#### S2：打车估算（AC-3）

- **Given** 某段当前方式为打车（`toNext=drive`）且两景点坐标齐全
- **When** 用户查看该段
- **Then** 服务端调用高德驾车算路，段行展示 `taxi_cost` ±20% 的费用区间（元）与预计时长（分钟）

#### S3：步行估算（AC-3）

- **Given** 某段当前方式为步行（`toNext=walk`）
- **When** 用户查看该段
- **Then** 服务端调用高德步行算路，段行展示预计时长（分钟）与费用 ¥0

#### S4：公共交通静态提示（每天一条）

- **Given** 某天存在至少一个交通段
- **When** 用户查看该天行程
- **Then** 该天标题下展示一条「地铁/公交：不可携带宠物上车」类静态提示；公共交通不可选择、不触发算路请求；无交通段的天不展示该提示

#### S5：方式选择持久化与恢复

- **Given** 某段当前为打车且已展示估算
- **When** 用户切换为步行
- **Then** 该 stop 的 `toNext` 更新为 `walk`，`toNextEstimate` 更新为步行快照（费用 0/0 + 时长），触发既有防抖 `PUT`；刷新页面后该段恢复为步行并直接展示已存快照（不调高德）

#### S6：估算失败兜底

- **Given** 高德 Key 缺失、上游算路失败或某景点坐标缺失
- **When** 用户查看该段
- **Then** 段行展示「估算暂不可用」类提示；方式选择与行程保存不受阻塞；用户此时选择方式则仅写入 `toNext`、`toNextEstimate` 留空

#### S7：单景点天不展示段行（边界）

- **Given** 某天只有 1 个或 0 个景点
- **When** 用户查看该天
- **Then** 不展示任何交通段行

#### S8：方式切换重新估算

- **Given** 某段已展示打车估算（快照或实时）
- **When** 用户切换为步行（或反向）
- **Then** 段行重算并展示对应方式的估算，同时更新 `toNextEstimate` 快照；同一「景点对 + 方式」的重复查看 MAY 使用前端查询缓存，不重复请求

#### S9：未选择时默认打车展示

- **Given** 某段对应 stop 的 `toNext` 为空（新建或从未选择）
- **When** 用户查看该段
- **Then** UI 默认按打车展示估算；`plan_json` 中该 stop 的 `toNext` 保持为空，不触发额外保存；用户显式选择后才写入

#### S10：相邻同一 POI（小字提醒，不算路）

- **Given** 同一天相邻两个 stop 为同一 `poiId`（既有契约允许重复添加）
- **When** 用户查看该段
- **Then** 不调用高德、不展示价格与预估时间、不渲染方式选择器；仅在该景点行下方展示一行小字提醒景点相同（文案语义固定，措辞 P3 统一）；不写入 `toNext` 与 `toNextEstimate`

#### S11：快照优先展示与补写

- **Given** 某 stop 已存 `toNext` 与 `toNextEstimate` 快照
- **When** 用户打开按天视图
- **Then** 该段直接展示快照值，不发起估算请求
- **Given** 某 stop 已选 `toNext` 但 `toNextEstimate` 为空（选择时估算不可用）
- **When** 该段估算查询成功
- **Then** 展示估算结果并将快照补写落库（触发既有防抖保存）

#### S12：打车段携宠小字提示

- **Given** 某段当前展示方式为打车（含 `toNext` 为空时默认按打车展示）
- **When** 用户查看该段
- **Then** 段行内展示小字提示「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」类语义（文案语义固定，措辞 P3 统一）
- **Given** 某段当前方式为步行，或相邻两景点为同一 POI
- **When** 用户查看该段
- **Then** 不展示该打车携宠提示

#### S13：每天宠物政策对比提醒（每天首个景点行前小字，2026-11-17 位置修订替换天末）

- **Given** 当天任一已排期景点 `leashRequired=true`
- **When** 用户查看该天
- **Then** 该天第一个景点行前展示小字「当天需携带牵引绳」类语义；绑定宠物档案 `hasLeash=false` 时加强「档案未登记牵引绳，请自备」类语义
- **Given** 当天某景点设 `maxSinglePetWeightKg`/`maxSinglePetShoulderHeightCm` 上限，且绑定宠物档案对应值超限（严格大于）
- **When** 用户查看该天
- **Then** 该天首个景点行前小字警示「您的宠物超出XX景点限制（≤Xkg/≤Ycm）」类语义（点名超限景点与限额）
- **Given** 宠物未超限、档案对应值缺失、景点政策均为 null、或当天无景点
- **When** 用户查看该天
- **Then** 不展示对应提醒项；提醒不写库、不新增后端接口；未排期景点不计入当天聚合

### Constraints

- 技术栈沿用 React 19 / TanStack Router / TanStack Query / shadcn/ui（Base UI）与 Spring Boot；不引入新状态库或 HTTP 客户端。
- 高德调用 MUST 走 `application.port.maps` 端口 + `infrastructure.amap.api` 适配器，复用 `AmapTransport` 与 `AmapProperties`；Key 缺失时应用可启动，调用以类型化错误失败（沿用既有约定）。
- 高德路线规划 2.0：驾车 `GET /v5/direction/driving`（`route.taxi_cost` 基础字段，元，字符串）、步行 `GET /v5/direction/walking`；时长需 `show_fields=cost`（`paths[].cost.duration`，秒）；坐标「经度,纬度」小数 ≤6 位；建议携带 `origin_id`/`destination_id`（POI ID）提升准确性。
- `plan_json` v1 增量扩展：`stops` 元素新增可选 `toNextEstimate {durationMinutes, costLowYuan, costHighYuan}`（可省略/为 null，数值 ≥0，时长为整数分钟）；version 保持 1，旧数据无该字段仍合法；`toNext ∈ {walk, drive, transit}` 不变；UI 仅提供 `walk`/`drive`，`drive` 展示为「打车」；`TripPlanValidator`/`TripPlan.TripStop` 需扩展解析与序列化（当前会丢弃未知字段）。
- 保存链路复用 trip-context 的乐观更新 + 约 600ms 防抖整量 `PUT`；不引入乐观锁。
- 估算 API 本身 MUST NOT 写库；快照由前端随 `PUT` 写入 `plan_json`；无快照时前端以 TanStack Query 按「景点对 + 方式」缓存查询结果。
- 每天政策对比提醒为纯前端派生：复用面板既有 `tripStore.cache.locations`（含 `petPolicies`）与 `petsQueryOptions` 绑定的 `activePet`；不新增后端接口/字段/迁移，不写库；体型判定以景点体重/肩高上限为准（DB 无独立「仅小型犬」字段），超限比较为严格大于，档案值缺失时不警示。
- 实现前需形成 OpenSpec 变更规格，遵循 `@rule:spec-first`；高德路线规划文档需补入知识库（当前仅有链接）。

### Context

行程面板按天分组渲染 `plan.days[].stops`，支持拖拽排序/跨天移动；`stop.toNext` 已在前后端契约中存在但无 UI。服务端已有高德 POI 搜索适配器与共享传输层，知识库明确路线规划 2.0 为"未来扩展参考"，本次落地。景点表含经纬度与 POI ID，可直接作为算路起终点。

### Affected Capabilities

- **ADDED** `trip-route-estimate`：服务端途内交通估算 API 与高德路线规划 2.0 适配（步行/驾车），含归属校验、参数校验与类型化上游错误
- **MODIFIED** `trip-context`：行程面板按天视图新增交通段行（方式选择、快照优先的估算展示、公共交通静态提示）；`toNext` + `toNextEstimate` 写入触发既有防抖保存
- **MODIFIED** `trip-planning`：Plan JSON v1 `stops` 元素增量新增可选 `toNextEstimate` 快照字段（version 保持 1，旧数据兼容）；校验器扩展解析/序列化与非法快照拒绝
- **CHECKED** `backend-amap-poi-search`：复用共享传输/配置，不改变 POI 搜索行为
- **CHECKED** `attraction-pet-rules`：只读复用景点 `petPolicies` 字段（leashRequired/体重/肩高上限），不改变其展示与查询行为
- **CHECKED** `paws-page`：只读复用宠物档案（weightKg/shoulderHeightCm/hasLeash），不改变档案 CRUD

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 估算由哪个应用提供，高德 Key 放在哪里？ | Dev / SA | `apps/server` 代理算路；Key 仅服务端配置（2026-11-17 用户批准方案） |
| blocking | resolved | 方式选择持久化在哪里，是否改 plan_json 结构？ | Dev / SA | 复用 `stop.toNext`（`drive`/`walk`）；2026-11-17 追加增量扩展可选 `toNextEstimate` 快照字段，version 保持 1、旧数据兼容（S5/S11） |
| blocking | resolved | 展示面在哪里？ | Product / Dev | TripPanel 按天视图相邻景点间的段行；不新增路由（2026-11-17 用户批准） |
| blocking | resolved | 估算何时计算、结果是否落库？ | Dev / SA | 打开当天视图按需计算；**2026-11-17 用户最新决策推翻「不落库」**：选择后方式 + 时长 + 价格以 `toNextEstimate` 快照随 PUT 存入 trip 表；估算 API 本身不写库（S5/S11） |
| blocking | resolved | 费用区间如何得出（高德仅返回单一 taxi_cost）？ | Product | `taxi_cost` ±20%；步行 ¥0（2026-11-17 用户确认「可以」） |
| blocking | resolved | MVP 覆盖哪些交通方式，租车是否在内？ | Product | 用户最新口径：打车/步行参与估算与选择；地铁/公交静态提示不可携宠；租车 Out（2026-11-17） |
| non-blocking | resolved | `toNext` 未设置时段的默认方式是什么？ | Product / Dev | 默认打车（`drive`）仅 UI 展示；`toNext` 保持为空直到用户显式选择（2026-11-17 用户确认，S9） |
| non-blocking | resolved | 估算失败（Key 缺失/上游失败/坐标缺失）时如何展示？ | Dev | 段行显示「估算暂不可用」，不阻塞方式选择与保存（2026-11-17 用户确认，S6） |
| non-blocking | resolved | 公共交通提示按段展示还是每天一条？ | Product / Dev | 每天一条，置于当天标题下；该天无交通段时不展示（2026-11-17 用户确认，S4） |
| non-blocking | resolved | 相邻两景点为同一 POI（零距离）时如何展示？ | Dev | 景点行下方一行小字提醒景点相同；不调用高德、不计算价格与预估时间（2026-11-17 用户最新决策，推翻早前「按 API 如实展示」提案；S10） |
| non-blocking | resolved | 刷新/重新打开视图时已存估算如何展示？ | Product / Dev | 优先展示已存快照、不调高德；切换方式时重算并更新快照（2026-11-17 用户确认；S11） |
| non-blocking | resolved | 选择方式时估算不可用如何落库？ | Dev | 仅存方式、`toNextEstimate` 留空，后续估算成功补写（2026-11-17 用户确认；S6/S11） |
| non-blocking | resolved | 打车携宠提示放在哪里、展示密度？ | Product / Dev | 每个打车段行内小字提示（宠物专车/司机同意/航空箱），步行段不展示（2026-11-17 用户确认「每个打车段行内」；S12） |
| non-blocking | resolved | 「仅小型犬」如何判定（DB 无独立字段）？ | Product / Dev | 景点体重/肩高上限即体型限制；与绑定档案对比，超限才警示、未超限不提示（2026-11-17 用户确认；S13） |
| non-blocking | resolved | 牵引绳提醒是否结合档案？提醒归属哪个需求？ | Product / Dev | 聚合+档案对比（hasLeash=false 加强）；并入 REQ-011 与当前 Change（2026-11-17 用户确认；S13） |
| non-blocking | resolved | 档案体重/肩高缺失或景点政策缓存未加载时如何展示？ | Dev | 无法判定超限则不警示（防御性假设，与「未超限不提示」一致）；缓存加载后自然重算（S13） |
| non-blocking | deferred | 前端缓存 TTL 与服务端是否加缓存？ | Dev | 后续解决（P3 设计决定，不影响应用边界与契约） |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| WARNING | deferred | Constraints / 证据 | 高德路线规划 2.0 参数与返回字段已从官网核对，但知识库仅有链接、无详细文档 | 后续解决：P3 设计前将核对结果补入 `docs/knowledge/external/`，遵循 knowledge-first 规则 |
| SUGGESTION | deferred | 文案 | 「估算暂不可用」「不可携带宠物上车」「打车携宠提示」等具体中文文案与视觉样式未锁死 | 后续解决：规格只固定语义，P3 统一文案 |

BLOCKER 数：0（blocking 与非 blocking 开放问题均已 resolved 或 deferred；⑨–⑫ 见 deep-dive 复检）。