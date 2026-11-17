---
id: REQ-011
title: 途内交通推荐（打车/步行）
status: ready-for-split
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
2. **statement**：已登录用户的激活行程在行程面板按天视图中，每两个相邻景点之间展示一段途内交通：用户可在「打车 / 步行」间选择，系统经服务端调用高德路线规划 2.0 估算并展示参考费用区间与预计时长；地铁/公交仅静态提示「不可携带宠物上车」，不可选、不调用 API；所选方式写入 `plan_json` 的 `stop.toNext`（`drive`=打车、`walk`=步行），随既有防抖保存持久化并在刷新后恢复。
3. **actors**：
   - 已登录用户：查看按天行程、选择每段途内交通方式、查看费用与时长参考
   - 前端应用 `apps/web`（TripPanel / trip store）：渲染交通段行、发起估算查询、写入 `toNext` 并触发防抖保存
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
   - 持久化：切换方式后 `stop.toNext` 更新并触发既有防抖 `PUT /api/trips/{id}`；刷新后从 `plan_json` 恢复所选方式
   - 失败兜底：高德 Key 缺失、上游失败或景点坐标缺失时，段行展示「估算暂不可用」，不阻塞方式选择与行程保存
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
- `stop.toNext` 方式选择的写入、防抖保存与刷新恢复（复用既有契约与保存链路）

**Out**

- 租车安排（原始 Story 四类之一；用户 2026-11-17 最新口径未覆盖，记为 Out，后续需求另立）
- 实时计价、站内叫车、可携宠筛选（Release 2）
- 公共交通算路调用与可携宠公共交通判定
- 估算结果落库、服务端估算缓存策略（缓存细节留 P3 设计）
- `plan_json` v1 结构变更（`toNext` 已存在且合法值不变）、新增导航 Tab 或路由
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

- **Given** 某段当前为打车
- **When** 用户切换为步行
- **Then** 该 stop 的 `toNext` 更新为 `walk`，触发既有防抖 `PUT`；刷新页面后该段恢复为步行并展示步行估算

#### S6：估算失败兜底

- **Given** 高德 Key 缺失、上游算路失败或某景点坐标缺失
- **When** 用户查看该段
- **Then** 段行展示「估算暂不可用」类提示；方式选择与行程保存不受阻塞

#### S7：单景点天不展示段行（边界）

- **Given** 某天只有 1 个或 0 个景点
- **When** 用户查看该天
- **Then** 不展示任何交通段行

#### S8：方式切换重新估算

- **Given** 某段已展示打车估算
- **When** 用户切换为步行（或反向）
- **Then** 段行展示对应方式的估算结果；同一「景点对 + 方式」的重复查看 MAY 使用前端查询缓存，不重复请求

#### S9：未选择时默认打车展示

- **Given** 某段对应 stop 的 `toNext` 为空（新建或从未选择）
- **When** 用户查看该段
- **Then** UI 默认按打车展示估算；`plan_json` 中该 stop 的 `toNext` 保持为空，不触发额外保存；用户显式选择后才写入

#### S10：相邻同一 POI（小字提醒，不算路）

- **Given** 同一天相邻两个 stop 为同一 `poiId`（既有契约允许重复添加）
- **When** 用户查看该段
- **Then** 不调用高德、不展示价格与预估时间、不渲染方式选择器；仅在该景点行下方展示一行小字提醒景点相同（文案语义固定，措辞 P3 统一）；不写入 `toNext`

### Constraints

- 技术栈沿用 React 19 / TanStack Router / TanStack Query / shadcn/ui（Base UI）与 Spring Boot；不引入新状态库或 HTTP 客户端。
- 高德调用 MUST 走 `application.port.maps` 端口 + `infrastructure.amap.api` 适配器，复用 `AmapTransport` 与 `AmapProperties`；Key 缺失时应用可启动，调用以类型化错误失败（沿用既有约定）。
- 高德路线规划 2.0：驾车 `GET /v5/direction/driving`（`route.taxi_cost` 基础字段，元，字符串）、步行 `GET /v5/direction/walking`；时长需 `show_fields=cost`（`paths[].cost.duration`，秒）；坐标「经度,纬度」小数 ≤6 位；建议携带 `origin_id`/`destination_id`（POI ID）提升准确性。
- `plan_json` v1 契约不变：`toNext ∈ {walk, drive, transit}` 可省略/为 null；UI 仅提供 `walk`/`drive`，`drive` 展示为「打车」；服务端校验逻辑不改。
- 保存链路复用 trip-context 的乐观更新 + 约 600ms 防抖整量 `PUT`；不引入乐观锁。
- 估算结果 MUST NOT 写入 `plan_json` 或数据库；前端以 TanStack Query 按「景点对 + 方式」缓存。
- 实现前需形成 OpenSpec 变更规格，遵循 `@rule:spec-first`；高德路线规划文档需补入知识库（当前仅有链接）。

### Context

行程面板按天分组渲染 `plan.days[].stops`，支持拖拽排序/跨天移动；`stop.toNext` 已在前后端契约中存在但无 UI。服务端已有高德 POI 搜索适配器与共享传输层，知识库明确路线规划 2.0 为"未来扩展参考"，本次落地。景点表含经纬度与 POI ID，可直接作为算路起终点。

### Affected Capabilities

- **ADDED** `trip-route-estimate`：服务端途内交通估算 API 与高德路线规划 2.0 适配（步行/驾车），含归属校验、参数校验与类型化上游错误
- **MODIFIED** `trip-context`：行程面板按天视图新增交通段行（方式选择、估算展示、公共交通静态提示）；`toNext` 写入触发既有防抖保存
- **CHECKED** `trip-planning`：Plan JSON v1 的 `toNext` 契约已覆盖本需求，无结构性变更（仅语义注释 `drive`=打车）
- **CHECKED** `backend-amap-poi-search`：复用共享传输/配置，不改变 POI 搜索行为

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 估算由哪个应用提供，高德 Key 放在哪里？ | Dev / SA | `apps/server` 代理算路；Key 仅服务端配置（2026-11-17 用户批准方案） |
| blocking | resolved | 方式选择持久化在哪里，是否改 plan_json 结构？ | Dev / SA | 复用 `stop.toNext`（`drive`/`walk`），v1 结构不变（2026-11-17 用户批准） |
| blocking | resolved | 展示面在哪里？ | Product / Dev | TripPanel 按天视图相邻景点间的段行；不新增路由（2026-11-17 用户批准） |
| blocking | resolved | 估算何时计算、结果是否落库？ | Dev / SA | 打开当天视图按需计算；结果不落库，前端查询缓存（2026-11-17 用户批准） |
| blocking | resolved | 费用区间如何得出（高德仅返回单一 taxi_cost）？ | Product | `taxi_cost` ±20%；步行 ¥0（2026-11-17 用户确认「可以」） |
| blocking | resolved | MVP 覆盖哪些交通方式，租车是否在内？ | Product | 用户最新口径：打车/步行参与估算与选择；地铁/公交静态提示不可携宠；租车 Out（2026-11-17） |
| non-blocking | resolved | `toNext` 未设置时段的默认方式是什么？ | Product / Dev | 默认打车（`drive`）仅 UI 展示；`toNext` 保持为空直到用户显式选择（2026-11-17 用户确认，S9） |
| non-blocking | resolved | 估算失败（Key 缺失/上游失败/坐标缺失）时如何展示？ | Dev | 段行显示「估算暂不可用」，不阻塞方式选择与保存（2026-11-17 用户确认，S6） |
| non-blocking | resolved | 公共交通提示按段展示还是每天一条？ | Product / Dev | 每天一条，置于当天标题下；该天无交通段时不展示（2026-11-17 用户确认，S4） |
| non-blocking | resolved | 相邻两景点为同一 POI（零距离）时如何展示？ | Dev | 景点行下方一行小字提醒景点相同；不调用高德、不计算价格与预估时间（2026-11-17 用户最新决策，推翻早前「按 API 如实展示」提案；S10） |
| non-blocking | deferred | 前端缓存 TTL 与服务端是否加缓存？ | Dev | 后续解决（P3 设计决定，不影响应用边界与契约） |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| WARNING | deferred | Constraints / 证据 | 高德路线规划 2.0 参数与返回字段已从官网核对，但知识库仅有链接、无详细文档 | 后续解决：P3 设计前将核对结果补入 `docs/knowledge/external/`，遵循 knowledge-first 规则 |
| SUGGESTION | deferred | 文案 | 「估算暂不可用」「不可携带宠物上车」等具体中文文案与视觉样式未锁死 | 后续解决：规格只固定语义，P3 统一文案 |

BLOCKER 数：0（blocking 与非 blocking 开放问题均已 resolved 或 deferred；⑨–⑫ 见 deep-dive 复检）。