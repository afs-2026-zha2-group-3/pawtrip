# Deep-dive — REQ-011 途内交通推荐（打车/步行）

- 日期：2026-11-17
- 上游：[`REQ-011`](../../requirements/REQ-011-intra-city-transport.md)、[`impact-brief`](./impact-brief.md)
- 方向：扩展既有能力（ADDED `trip-route-estimate` + MODIFIED `trip-context`），触发 Phase 2.5

## ① 数据契约

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| 途内交通段（UI 派生，不落库） | 某天有序 stop 序列中的一个相邻对：`(day, fromIndex, fromPoiId, toPoiId)` | `mode: walk \| drive`（显示值；`toNext` 为空时默认 `drive`）；估算结果引用；`samePoi`（from==to 时仅渲染小字提醒，无选择器）；段行不可拖拽 | 随 stop 序列派生：拖拽/增删 stop → 段集合按新相邻关系重算；同 POI 段不调用高德；段本身无独立生命周期 | AC-1/AC-2；S10；`trip-panel.tsx` rows 派生模式 |
| stop.toNext（持久化，既有字段） | `plan_json.days[].stops[]` 单个 stop | `toNext: "walk" \| "drive" \| "transit" \| null`（省略=null）；UI 仅写 `walk`/`drive` | null → walk/drive（用户显式选择）；walk ↔ drive（切换）；transit 为契约保留值，UI 不提供、不主动改写；随防抖 `PUT` 持久化 | `openspec/specs/trip-planning/spec.md` Plan JSON v1 |
| 估算结果（瞬态，不落库） | 「景点对 + 方式」：`(fromPoiId, toPoiId, mode)` | `mode`；`durationMinutes: integer`（由 `cost.duration` 秒换算，向上取整）；打车：`costLowYuan`/`costHighYuan`（`taxi_cost` ×0.8 / ×1.2，元，保留整数或 1 位小数由 P3 定）；步行：费用固定 0 | loading → ready \| unavailable；前端 TanStack Query 缓存，切换方式换 key；不写 `plan_json`、不写 DB | 用户决策（±20%、按需计算、不落库）；高德路线规划 2.0 文档 |
| 估算请求（服务端 API 契约） | 单次查询 | 入参：`tripId`（路径）、`fromPoiId`、`toPoiId`、`mode ∈ {walk, drive}`；出参：`mode`、`durationMinutes`、`costLowYuan`、`costHighYuan`（步行两者为 0）；错误：`401 UNAUTHENTICATED` / `404 TRIP_NOT_FOUND` / `400 VALIDATION_ERROR` / 上游失败类型化错误码（沿用 Problem Details） | 请求 → 校验 → 查坐标 → 高德算路 → 解析换算 → 响应；任一环节失败 → 对应错误响应 | impact-brief §3；`backend-error-handling` |
| 公共交通静态提示（前端常量） | 每天一条 | 文案语义：「地铁/公交：不可携带宠物上车」；无动态字段 | 静态常量，无状态 | 用户 Story 已决（2026-11-15）+ 2026-11-17 每天一条 |

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
| 估算调用 | mode=drive 且坐标齐全 | in，driving + `show_fields=cost`，取 `taxi_cost` 与 duration | S2 |
| 估算调用 | mode=walk 且坐标齐全 | in，walking + `show_fields=cost`，费用 0 | S3 |
| 估算调用 | 公共交通 | out，不调用算路 | Story 已决：仅静态提示 |
| 失败兜底 | Key 缺失 / 上游失败 / `taxi_cost` 或 duration 缺失或非数值 | in，段行「估算暂不可用」，选择与保存不阻塞 | S6（2026-11-17 用户确认） |
| 失败兜底 | 景点坐标缺失（防御） | in，同上兜底；服务端参数/存在性校验失败返回 400 | 用户确认坐标可查得，分支防御性保留 |
| 输入完整性 | 估算请求缺 `fromPoiId`/`toPoiId`/`mode`，或 mode 非法，或 poiId 不存在 | in，`400 VALIDATION_ERROR` | 沿用 trip-planning 校验口径 |
| 输入完整性 | 未登录 / 非本人 trip | in，`401` / `404 TRIP_NOT_FOUND` | 沿用归属校验口径 |
| 零距离段 | 相邻同一 poiId | in，不调用高德、不展示价格/时长/选择器；景点行下方一行小字提醒景点相同；不写 `toNext` | S10（2026-11-17 用户最新决策，推翻早前「按 API 如实展示」；既有契约允许同日重复） |
| 拖拽交互 | stop 同日排序 / 跨天移动 / 拖入拖出未排期 | in，段行按新相邻关系重算；`toNext` 随 stop 移动（既有透传） | trip-context 既有行为不改 |
| 拖拽交互 | 段行本身被拖拽 | out，段行不可拖拽、不参与 SortableContext | 段为派生展示，无独立排序语义 |
| 持久化 | 估算结果写库 | out | 用户已决：不落库 |
| 范围外 | 租车 / 实时计价 / 站内叫车 / 可携宠筛选 | out | 用户最新口径 + Release 2 |

## ③ 跨 REQ 一致性

| capability | per-REQ grain + fields | aligned? | anchor |
|---|---|---|---|
| `trip-planning`（Plan JSON v1） | REQ-011 复用 `stop.toNext`，字段与合法值不变；`drive` 语义注释为打车 | yes | `openspec/specs/trip-planning/spec.md` |
| `trip-context`（面板/保存） | REQ-011 新增段行与 `toNext` setter；大交通 tag（REQ-008）、拖拽、防抖保存口径不变 | yes | `openspec/specs/trip-context/spec.md` |
| `backend-amap-poi-search` | REQ-011 复用 `AmapTransport`/`AmapProperties`，POI 搜索行为不变；新适配器独立 | yes | `openspec/specs/backend-amap-poi-search/spec.md` |
| REQ-009（景点携宠规则展示，已归档） | 改景点浏览页，不触碰面板段行；无字段交集 | yes | `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/` |
| `unify-location-browsing`（active，PR #60） | attraction 查询/类型更名为 locations；面板仅更名级改动，与段行/估算无字段交集 | yes | `openspec/changes/unify-location-browsing/` |
| REQ-010（总天数 sessionStorage） | 面板按 `active.totalDays` 渲染天分组；天数输入契约不变 | yes | `requirements/REQ-010-trip-duration-input.md` |
| `transport-rules-catalog`（大交通规则常量） | 途内交通提示为独立前端常量，不复用大交通规则数据结构 | yes | `apps/web/src/data/transport-rules.ts` |

## ④ 通知 / 展示契约

| trigger or surface | recipient | content + display fields | channel | cardinality | source |
|---|---|---|---|---|---|
| 交通段行 | 已登录用户 | 方式选择器（打车/步行，默认打车）；打车：「约 ¥X–Y · 约 Z 分钟」；步行：「¥0 · 约 Z 分钟」；加载态与「估算暂不可用」态 | TripPanel 按天分组，相邻 stop 行之间 | 每天 n−1 行（n≥2） | AC-1/2/3；S2/S3/S6/S9 |
| 公共交通提示 | 已登录用户 | 静态文案「地铁/公交：不可携带宠物上车」（语义固定，措辞 P3 统一） | TripPanel 当天标题下 | 每天 1 条（该天有段时） | S4（2026-11-17 用户确认每天一条） |
| 保存状态 | 已登录用户 | 复用既有「保存中/已保存/保存失败」tag 与重试 | TripPanel 顶部 save-status | 单例（既有） | trip-context 既有契约 |
| 估算失败提示 | 已登录用户 | 「估算暂不可用」类文案；不弹全局错误、不阻塞交互 | 对应段行内 | 每失败段 1 条 | S6 |
| 相邻景点相同提醒 | 已登录用户 | 「相邻景点相同，无需交通估算」类小字（语义固定，措辞 P3 统一）；无价格/时长 | TripPanel 对应景点行下方 | 每个同 POI 段 1 条 | S10（2026-11-17 用户最新决策） |

无服务端通知（邮件/推送等）需求。

## Probe log

- 2026-11-17：用户批准总体方案（服务端代理、复用 toNext、TripPanel 段行、按需计算不落库、taxi_cost ±20%）。
- 2026-11-17：用户确认默认打车（仅 UI 默认，toNext 保持空直到显式选择）；失败兜底「估算暂不可用」不阻塞；公共交通提示**每天一条**（否决按段提案）；相邻同一 POI 不特殊拦截（用户认为拖拽不会重复；已记录既有契约允许同日重复的事实，分支防御性保留）。
- 2026-11-17：高德路线规划 2.0 文档已从官网核对（taxi_cost 基础字段、show_fields=cost、坐标 ≤6 位小数）；知识库详细条目待 P3 前补入（DoR WARNING deferred）。
- 2026-11-17：用户更新零距离边界决策——相邻同一 POI 段改为景点行下方小字提醒，不调用高德、不计算价格与预估时间（S10、①②④已同步）。

## DoR ⑨–⑫ 复检

- ⑨ 数据契约：交通段、toNext、估算结果、估算请求、静态提示均有粒度/字段/状态转换；无 {TBD}；通过。
- ⑩ 边界枚举：段行生成各分支、默认/存量值、估算成功/失败、输入完整性、零距离、拖拽、范围外均已归属；通过。
- ⑪ 跨 REQ：7 项能力核对全部 aligned，无未收敛 ✗；通过。
- ⑫ 展示契约：段行、每天公交提示、保存状态、失败提示、同 POI 小字提醒均有触发/受众/字段/渠道/基数；通过。

BLOCKER 数：0。