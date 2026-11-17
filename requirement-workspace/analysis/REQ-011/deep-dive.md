# Deep-dive — REQ-011 途内交通推荐（打车/步行）

- 日期：2026-11-17
- 上游：[`REQ-011`](../../requirements/REQ-011-intra-city-transport.md)、[`impact-brief`](./impact-brief.md)
- 方向：扩展既有能力（ADDED `trip-route-estimate` + MODIFIED `trip-context`/`trip-planning`），触发 Phase 2.5

## ① 数据契约

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| 途内交通段（UI 派生，不落库） | 某天有序 stop 序列中的一个相邻对：`(day, fromIndex, fromPoiId, toPoiId)` | `mode: walk \| drive`（显示值；`toNext` 为空时默认 `drive`）；估算展示源 = `toNextEstimate` 快照优先，无快照时查询结果；`samePoi`（from==to 时仅渲染小字提醒，无选择器）；段行不可拖拽 | 随 stop 序列派生：拖拽/增删 stop → 段集合按新相邻关系重算；有快照不调高德，无快照按需查询；同 POI 段不调用高德；段本身无独立生命周期 | AC-1/AC-2；S10/S11；`trip-panel.tsx` rows 派生模式 |
| stop.toNext + toNextEstimate（持久化） | `plan_json.days[].stops[]` 单个 stop | `toNext: "walk" \| "drive" \| "transit" \| null`（省略=null，既有字段）；UI 仅写 `walk`/`drive`；新增可选 `toNextEstimate: {durationMinutes: int≥0, costLowYuan: ≥0, costHighYuan: ≥0} \| null`（步行 0/0；version 保持 1，旧数据兼容） | null → walk/drive + 快照（用户显式选择）；walk ↔ drive（切换时重算并更新快照）；选择时估算不可用 → 仅 toNext、快照 null，查询成功后补写；transit 为契约保留值，UI 不提供、不主动改写；随防抖 `PUT` 持久化 | `openspec/specs/trip-planning/spec.md` Plan JSON v1（本次 MODIFIED）；2026-11-17 快照落库决策 |
| 估算结果（API 响应瞬态） | 「景点对 + 方式」：`(fromPoiId, toPoiId, mode)` | `mode`；`durationMinutes: integer`（由 `cost.duration` 秒换算，向上取整）；打车：`costLowYuan`/`costHighYuan`（`taxi_cost` ×0.8 / ×1.2，元，保留整数或 1 位小数由 P3 定）；步行：费用固定 0 | loading → ready \| unavailable；估算 API 本身不写库；选择/补写时由前端随 PUT 写入 `toNextEstimate` 快照；无快照时 TanStack Query 缓存，切换方式换 key | 用户决策（±20%、按需计算、快照落库）；高德路线规划 2.0 文档 |
| 估算请求（服务端 API 契约） | 单次查询 | 入参：`tripId`（路径）、`fromPoiId`、`toPoiId`、`mode ∈ {walk, drive}`；出参：`mode`、`durationMinutes`、`costLowYuan`、`costHighYuan`（步行两者为 0）；错误：`401 UNAUTHENTICATED` / `404 TRIP_NOT_FOUND` / `400 VALIDATION_ERROR` / 上游失败类型化错误码（沿用 Problem Details） | 请求 → 校验 → 查坐标 → 高德算路 → 解析换算 → 响应；任一环节失败 → 对应错误响应 | impact-brief §3；`backend-error-handling` |
| 公共交通静态提示（前端常量） | 每天一条 | 文案语义：「地铁/公交：不可携带宠物上车」；无动态字段 | 静态常量，无状态 | 用户 Story 已决（2026-11-15）+ 2026-11-17 每天一条 |
| 打车携宠提示（前端常量） | 每个当前展示方式为打车的段行内一条 | 文案语义：「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」；无动态字段 | 随段行展示方式显隐：打车（含默认）展示、步行隐藏；同 POI 段不展示 | S12（2026-11-17 用户确认「每个打车段行内」） |
| 每天政策对比提醒（UI 派生，不落库） | 某天已排期 stop 集合 × 绑定宠物档案 | 输入：`cache.locations[poiId].petPolicies`（leashRequired/maxSinglePetWeightKg/maxSinglePetShoulderHeightCm）+ `activePet`（hasLeash/weightKg/shoulderHeightCm）；输出：牵引绳项（required / required-no-leash / 无）+ 超限警示列表（景点名 + 限额值） | 随当天 stop 集合/政策缓存/档案派生重算；poiId 去重；超限=严格大于；档案值缺失或缓存未加载→不警示；不写库、不新增后端请求 | S13（2026-11-17 用户确认）；`trip-panel.tsx` 既有 cache.locations/activePet |

约束：坐标由 `pawtrip_location` 按 `poiId` 读取（用户确认均可查得）；适配器格式化「经度,纬度」≤6 位小数；`taxi_cost`/`duration` 为字符串，解析失败按上游失败处理。

## ② 边界归属

| rule | branch | in / out | rationale |
|---|---|---|---|
| 段行生成 | 某天 n≥2 个 stop | in，生成 n−1 段 | AC-1 |
| 段行生成 | 某天 n=0 或 1 | in，不生成段行、不生成公交提示 | S7；无相邻对 |
| 段行生成 | 当天最后一个 stop | in，其后无段行（`toNext` 不渲染） | AC-2 语义「到下一景点」 |
| 段行生成 | 未排期分组 | in，不生成段行 | 未排期无顺序语义 |
| 段行生成 | 草稿期（无 active trip） | in，不生成段行 | 草稿无 stop（trip-context 既有契约） |
| 默认方式 | `toNext` 为空 | in，UI 默认打车展示；不写库、不触发保存 | S9（2026-11-17 用户确认） |
| 存量值 | `toNext=transit`（契约允许） | in，按默认打车展示，不主动改写；用户显式选择后覆盖 | 契约保留值，UI 仅 walk/drive |
| 方式选择 | 用户选 walk/drive | in，乐观更新 + 防抖 PUT | S5；复用 trip-context 保存链路 |
| 估算调用 | mode=drive 且无快照且坐标齐全 | in，driving + `show_fields=cost`，取 `taxi_cost` 与 duration | S2；有快照时不调用（S11） |
| 估算调用 | mode=walk 且无快照且坐标齐全 | in，walking + `show_fields=cost`，费用 0 | S3；有快照时不调用（S11） |
| 快照展示 | stop 已存 toNextEstimate | in，直接展示存值，不发起估算请求 | S11（2026-11-17 用户确认快照优先） |
| 快照补写 | toNext 已选 + 快照为空 + 查询成功 | in，补写快照并触发防抖保存 | S11；选择时估算不可用的后续收敛 |
| 估算调用 | 公共交通 | out，不调用算路 | Story 已决：仅静态提示 |
| 失败兜底 | Key 缺失 / 上游失败 / `taxi_cost` 或 duration 缺失或非数值 | in，段行「估算暂不可用」，选择与保存不阻塞；此时选择仅写 toNext、快照留空 | S6（2026-11-17 用户确认；快照兜底同日确认） |
| 失败兜底 | 景点坐标缺失（防御） | in，同上兜底；服务端参数/存在性校验失败返回 400 | 用户确认坐标可查得，分支防御性保留 |
| 输入完整性 | 估算请求缺 `fromPoiId`/`toPoiId`/`mode`，或 mode 非法，或 poiId 不存在 | in，`400 VALIDATION_ERROR` | 沿用 trip-planning 校验口径 |
| 输入完整性 | 未登录 / 非本人 trip | in，`401` / `404 TRIP_NOT_FOUND` | 沿用归属校验口径 |
| 零距离段 | 相邻同一 poiId | in，不调用高德、不展示价格/时长/选择器；景点行下方一行小字提醒景点相同；不写 `toNext` 与 `toNextEstimate` | S10（2026-11-17 用户最新决策，推翻早前「按 API 如实展示」；既有契约允许同日重复） |
| 打车携宠提示 | 段当前展示方式为 drive（含 toNext 为空默认） | in，段行内小字提示（宠物专车/司机同意/航空箱） | S12（2026-11-17 用户确认每个打车段行内） |
| 打车携宠提示 | 段当前方式为 walk，或同 POI 段 | in，不展示该提示 | S12；同 POI 段仅景点相同提醒（S10） |
| 政策提醒 | 当天任一景点 leashRequired=true | in，每天首个景点行前小字「当天需携带牵引绳」；档案 hasLeash=false 加强「请自备」 | S13（2026-11-17 用户确认聚合+档案对比） |
| 政策提醒 | 景点设体重/肩高上限且档案对应值超限（严格大于） | in，首个景点行前警示点名超限景点与限额 | S13；DB 无独立「仅小型犬」字段，限额即体型限制 |
| 政策提醒 | 未超限 / 档案值缺失 / 政策均 null / 当天无景点 | in，不展示对应提醒项（缺失不警示为防御性假设） | S13（用户明确未超限不提示） |
| 政策提醒 | 未排期景点 | out，不计入当天聚合 | 未排期无「当天」语义 |
| 政策提醒 | 后端接口/写库 | out，纯前端派生，复用既有缓存与宠物查询 | S13；不改 attraction-pet-rules/paws-page 行为 |
| 拖拽交互 | stop 同日排序 / 跨天移动 / 拖入拖出未排期 | in，段行按新相邻关系重算；`toNext` 随 stop 移动（既有透传） | trip-context 既有行为不改 |
| 拖拽交互 | 段行本身被拖拽 | out，段行不可拖拽、不参与 SortableContext | 段为派生展示，无独立排序语义 |
| 持久化 | 估算快照写库 | in，选择/补写时随 PUT 写入 `toNextEstimate`；估算 API 本身不写库 | 2026-11-17 用户最新决策（推翻早前「不落库」）；S5/S11 |
| 持久化 | toNextEstimate 非法值（负数/非整数时长/缺字段） | in，服务端 `400 VALIDATION_ERROR` | trip-planning MODIFIED 校验口径 |
| 范围外 | 租车 / 实时计价 / 站内叫车 / 可携宠筛选 | out | 用户最新口径 + Release 2 |

## ③ 跨 REQ 一致性

| capability | per-REQ grain + fields | aligned? | anchor |
|---|---|---|---|
| `trip-planning`（Plan JSON v1） | REQ-011 复用 `stop.toNext`（字段与合法值不变，`drive` 语义注释为打车）；增量新增可选 `stop.toNextEstimate`，version 保持 1、旧数据兼容 | yes（本次 MODIFIED，delta 已收敛） | `openspec/specs/trip-planning/spec.md` + 本 change delta |
| `trip-context`（面板/保存） | REQ-011 新增段行与 `toNext` setter；大交通 tag（REQ-008）、拖拽、防抖保存口径不变 | yes | `openspec/specs/trip-context/spec.md` |
| `backend-amap-poi-search` | REQ-011 复用 `AmapTransport`/`AmapProperties`，POI 搜索行为不变；新适配器独立 | yes | `openspec/specs/backend-amap-poi-search/spec.md` |
| REQ-009（景点携宠规则展示，已归档） | 改景点浏览页，不触碰面板段行；无字段交集 | yes | `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/` |
| `unify-location-browsing`（active，PR #60） | attraction 查询/类型更名为 locations；面板仅更名级改动，与段行/估算无字段交集 | yes | `openspec/changes/unify-location-browsing/` |
| REQ-010（总天数 sessionStorage） | 面板按 `active.totalDays` 渲染天分组；天数输入契约不变 | yes | `requirements/REQ-010-trip-duration-input.md` |
| `transport-rules-catalog`（大交通规则常量） | 途内交通提示为独立前端常量，不复用大交通规则数据结构 | yes | `apps/web/src/data/transport-rules.ts` |
| `attraction-pet-rules`（景点政策字段，REQ-009 已归档） | REQ-011 只读复用 `petPolicies` 的 leashRequired/体重/肩高上限做每天聚合对比，不改其展示/查询行为 | yes | `openspec/specs/attraction-pet-rules/spec.md`；`LocationQueryResponses.PetPolicies` |
| `paws-page`（宠物档案） | REQ-011 只读复用绑定档案 weightKg/shoulderHeightCm/hasLeash（面板既有 activePet），不改档案 CRUD | yes | `openspec/specs/paws-page/spec.md`；`PetService` |

## ④ 通知 / 展示契约

| trigger or surface | recipient | content + display fields | channel | cardinality | source |
|---|---|---|---|---|---|
| 交通段行 | 已登录用户 | 方式选择器（打车/步行，默认打车）；估算展示源 = 快照优先、无快照时查询结果；打车：「约 ¥X–Y · 约 Z 分钟」；步行：「¥0 · 约 Z 分钟」；加载态与「估算暂不可用」态 | TripPanel 按天分组，相邻 stop 行之间 | 每天 n−1 行（n≥2） | AC-1/2/3；S2/S3/S6/S9/S11 |
| 公共交通提示 | 已登录用户 | 静态文案「地铁/公交：不可携带宠物上车」（语义固定，措辞 P3 统一） | TripPanel 当天标题下 | 每天 1 条（该天有段时） | S4（2026-11-17 用户确认每天一条） |
| 保存状态 | 已登录用户 | 复用既有「保存中/已保存/保存失败」tag 与重试 | TripPanel 顶部 save-status | 单例（既有） | trip-context 既有契约 |
| 估算失败提示 | 已登录用户 | 「估算暂不可用」类文案；不弹全局错误、不阻塞交互 | 对应段行内 | 每失败段 1 条 | S6 |
| 相邻景点相同提醒 | 已登录用户 | 「相邻景点相同，无需交通估算」类小字（语义固定，措辞 P3 统一）；无价格/时长 | TripPanel 对应景点行下方 | 每个同 POI 段 1 条 | S10（2026-11-17 用户最新决策） |
| 打车携宠提示 | 已登录用户 | 「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」类小字（语义固定，措辞 P3 统一） | TripPanel 对应打车段行内 | 每个当前展示方式为打车的段 1 条（步行/同 POI 段不展示） | S12（2026-11-17 用户确认） |
| 每天政策对比提醒 | 已登录用户 | 牵引绳：「当天需携带牵引绳」（hasLeash=false 加强「请自备」）；体型：「您的宠物超出XX景点限制（≤Xkg/≤Ycm）」（点名超限景点，语义固定，措辞 P3 统一） | TripPanel 当天第一个景点行前（day 标题与公交提示之后） | 每天至多 1 组（无触发项/空天不展示） | S13（2026-11-17 用户确认；同日位置修订：天末→首个景点行前） |

无服务端通知（邮件/推送等）需求。

## Probe log

- 2026-11-17：用户批准总体方案（服务端代理、复用 toNext、TripPanel 段行、按需计算不落库、taxi_cost ±20%）。
- 2026-11-17：用户确认默认打车（仅 UI 默认，toNext 保持空直到显式选择）；失败兜底「估算暂不可用」不阻塞；公共交通提示**每天一条**（否决按段提案）；相邻同一 POI 不特殊拦截（用户认为拖拽不会重复；已记录既有契约允许同日重复的事实，分支防御性保留）。
- 2026-11-17：高德路线规划 2.0 文档已从官网核对（taxi_cost 基础字段、show_fields=cost、坐标 ≤6 位小数）；知识库详细条目待 P3 前补入（DoR WARNING deferred）。
- 2026-11-17：用户更新零距离边界决策——相邻同一 POI 段改为景点行下方小字提醒，不调用高德、不计算价格与预估时间（S10、①②④已同步）。
- 2026-11-17：用户推翻「估算不落库」——选择途内交通后将方式 + 预估时间 + 预估价格存入 trip 表（stop 新增可选 `toNextEstimate` 快照，version 保持 1）；用户确认快照优先展示（不调高德）与失败时仅存方式、成功后补写；trip-planning 升级为 MODIFIED（S5/S6/S8/S11、①②③④已同步）。
- 2026-11-17：用户新增打车携宠提示决策——每个打车段行内小字提示「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」；展示位置用户确认「每个打车段行内」（否决每天一条/全局一条提案），步行段不展示（S12、①②④已同步）。
- 2026-11-17：用户新增每天宠物政策对比提醒决策（并入 REQ-011）——绑定档案 × 当天景点政策，天末小字：牵引绳聚合+档案对比（hasLeash=false 加强）；体型以体重/肩高上限判定，超限才警示、未超限不提示（否决「未超限也展示限额」提案）；纯前端派生不写库（S13、①②③④已同步）。
- 2026-11-17：用户修订政策提醒位置——移到每天第一个景点行前（替换天末位置，用户确认非两处都展示），内容规则不变（S13、②④已同步）。

## DoR ⑨–⑫ 复检

- ⑨ 数据契约：交通段、toNext + toNextEstimate、估算结果、估算请求、静态提示均有粒度/字段/状态转换；无 {TBD}；通过。
- ⑩ 边界枚举：段行生成各分支、默认/存量值、快照展示/补写、估算成功/失败、输入完整性、零距离、拖拽、范围外均已归属；通过。
- ⑪ 跨 REQ：9 项能力核对全部 aligned（含 attraction-pet-rules/paws-page 只读复用），无未收敛 ✗；通过。
- ⑫ 展示契约：段行、每天公交提示、保存状态、失败提示、同 POI 小字提醒、打车携宠提示、每天政策对比提醒均有触发/受众/字段/渠道/基数；通过。

BLOCKER 数：0。