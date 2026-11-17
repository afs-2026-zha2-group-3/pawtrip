# Proposal

## Why

携宠出行用户往往到了当地才发现打不到愿意接宠物的车，且无法预知景点间的交通成本与耗时（REQ-011）。行程面板已按天展示景点顺序，`plan_json` v1 已预留 `stop.toNext` 交通方式字段但无 UI；本次在按天视图中补齐相邻景点间的途内交通估算与方式选择，让用户规划时即可掌握每段「打车大概多少钱、多久；步行多久」，并明确公共交通不可携宠。

## What Changes

- 行程面板按天视图在相邻景点行之间插入途内交通段行：大交通为公共交通（飞机/高铁/火车）或未选择时用户可在「打车 / 步行」间选择，展示参考费用区间与预计时长；段行不可拖拽，不改变既有拖拽行为。
- 大交通自驾联动（2026-11-17 第 5 轮修订）：`transportMode=drive` 时段行默认展示「驾车」（仅预估时长、无费用，派生默认不写库），每段提供「选择其他途内交通方式」下拉（打车/步行）与可显式选回的驾车；显式选择任一方式（含驾车）后写库（驾车=`self_drive`，快照费用 0/0 仅存不展示；打车/步行按既有规则）；自驾模式隐藏每天公交提示，携宠提示跟随段实际方式（切为打车的段恢复展示），政策提醒不变；切换大交通不改写已存选择，切回公共交通后恢复原选择展示；只读复用既有 `active.transportMode`，不改大交通选择与交通规则页行为。
- 新增服务端估算 API（登录 + 行程归属保护）：`GET /api/trips/{tripId}/route-estimate?fromPoiId&toPoiId&mode`，`mode ∈ {walk, drive}`；服务端读取景点坐标并代理高德路线规划 2.0（驾车取 `taxi_cost` ±20% 费用区间与时长，步行费用 ¥0 与时长）。估算接口本身无状态、不写库。
- 新增高德路线规划端口与适配器，复用既有 `AmapTransport`/`AmapProperties` 共享传输层；Key 仅服务端，缺失可启动、调用以类型化错误失败。
- 方式选择与估算快照落库（推翻早前「估算不落库」决策）：用户选择方式后写入 `stop.toNext`（`drive`=打车、`walk`=步行、`self_drive`=驾车）与新增可选快照字段 `stop.toNextEstimate {durationMinutes, costLowYuan, costHighYuan}`，复用乐观更新 + 约 600ms 防抖整量 `PUT` 保存链路；刷新后优先展示已存快照、不再调用估算接口，切换方式时重新估算并更新快照。`toNext` 未设置时 UI 按大交通派生默认方式展示（非自驾：打车；自驾：驾车），不写库。
- 选择时估算不可用则仅保存 `toNext`、快照留空，待后续估算查询成功后回填快照并触发保存。
- 地铁/公交「不可携带宠物上车」静态提示每天一条（该天有交通段且大交通非自驾时），不可选择、不触发算路。
- 每个当前展示方式为打车的段行内展示携宠小字提示「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」（含非自驾默认打车展示与自驾模式下切为打车的段；驾车/步行段与同 POI 段不展示）。
- 每天第一个景点行前（day 标题与公交提示之后）展示宠物政策对比小字提醒（纯前端派生，复用既有景点政策缓存与绑定宠物档案；2026-11-17 位置修订，替换早前天末位置）：任一景点需牵引绳 → 「当天需携带牵引绳」（档案未登记时加强「请自备」）；景点设体重/肩高上限且宠物超限 → 点名景点与限额的警示，未超限不提示；不写库、不新增后端接口。
- 相邻同一 POI 段不调用高德、不展示价格/时长/选择器、不写入 `toNext`/`toNextEstimate`，仅在景点行下方展示一行小字提醒景点相同。
- 估算失败（Key 缺失/上游失败/坐标缺失）段行展示「估算暂不可用」，不阻塞方式选择与行程保存。
- 范围外：租车、实时计价、站内叫车、可携宠筛选（Release 2）、公共交通算路、`plan_json` 破坏性结构变更（本次仅增量扩展可选字段与 `toNext` 新增枚举值 `self_drive`，version 保持 1）、新增导航 Tab/路由、大交通选择本身与交通规则页行为（仅只读复用 `transportMode`）。

## Capabilities

### New Capabilities

- `trip-route-estimate`：服务端途内交通估算能力——估算 API 契约（参数/登录与归属校验/错误码/响应字段）、高德路线规划 2.0 步行/驾车适配行为（坐标格式、`taxi_cost` ±20%、时长换算、类型化上游错误）。

### Modified Capabilities

- `trip-context`：行程面板按天视图新增交通段行（方式选择、快照优先展示、估算加载/不可用态、同 POI 小字提醒）、大交通自驾联动（默认驾车/下拉切换/显式选驾车写库/公交提示隐藏/切换不改写）、每天一条公共交通静态提示（非自驾时）、每个打车段行内携宠小字提示（跟随段方式）、每天宠物政策对比提醒（牵引绳/体型超限）；新增 `toNext` + `toNextEstimate` 设置与回填动作并复用既有防抖保存与刷新恢复。
- `trip-planning`：Plan JSON v1 结构增量扩展——`stops` 元素新增可选 `toNextEstimate {durationMinutes, costLowYuan, costHighYuan}` 快照字段（可省略/null，version 保持 1，存量数据兼容）与 `toNext` 新增枚举值 `self_drive`（驾车）；`TripPlan.TripStop` 与 `TripPlanValidator` 需扩展解析/校验/序列化（当前会丢弃未知字段）。

## Impact

- **后端**：trip 模块新增估算端点与服务校验；`TripPlan.TripStop` record 与 `TripPlanValidator` 扩展 `toNextEstimate` 解析/校验/序列化与 `toNext` 枚举 `self_drive`；`application.port.maps` 新增路线规划端口；`infrastructure.amap.api` 新增路线规划适配器（不改 POI 适配器）；沿用 Problem Details 错误码体系；无数据库迁移（快照存于既有 `plan_json`，坐标取自既有 `pawtrip_location`）。
- **前端**：`trip-panel.tsx` 段行渲染（快照优先、按大交通模式的选择器）与每天首个景点行前政策提醒、`lib/trip/` 新增每天政策对比纯函数、`types.ts` 增加 `toNextEstimate` 类型与 `self_drive` 枚举、trip store 新增 `toNext` + 快照 setter 与回填 action（默认展示态按 `active.transportMode` 派生）、新增 route-estimate TanStack Query 查询（key=景点对+方式，有快照时禁用；驾车复用 mode=drive 仅取时长）；沿用统一 request 层，不引入新依赖。
- **外部依赖**：高德 Web 服务新增路线规划调用量（每天 n−1 段 × 方式切换），受 Key 配额与权限约束；P3 前需真实 Key 冒烟验证。
- **规格与文档**：`trip-planning`（Plan JSON v1 结构 MODIFIED）与 `trip-context`（ADDED）出 delta；`backend-amap-poi-search`、`attraction-pet-rules`（petPolicies 字段）、`paws-page`（档案字段）仅只读复用不改；`docs/knowledge/external/` 需补入路线规划 2.0 参数/返回字段文档（当前仅有链接）。
- **测试**：后端适配器/服务/validator 快照与 self_drive 枚举单测、前端 store/段行渲染（快照优先/回填/打车提示显隐/自驾联动）/政策对比纯函数单测、途内交通 E2E（选择-保存-快照恢复、每天提示、打车携宠提示、政策提醒、失败仅存方式、同 POI 提醒、自驾默认驾车/下拉切换/显式选驾车写库/公交提示隐藏/切换不改写）。
- **并行变更**：与 active change `unify-location-browsing`（PR #60 已合并）无能力依赖，面板文件仅更名级交集，合并冲突概率低。

## Effort / Size

- 规模 **M**，约 24 个文件：服务端 ~8（端口/适配器/端点/服务/validator 扩展/单测）、前端 ~8（types/store action/查询/段行/政策对比纯函数/单测）、E2E ~1、delta specs 3、知识库文档 2。
- 建议 1 个 Change 交付完整垂直切片（服务端估算 + 面板段行 + 选择与快照持久化 + 每天政策提醒 + 大交通自驾联动）；不单独拆「高德路线规划基础设施」Change（无独立用户价值）。
- 需求来源：`requirement-workspace/requirements/REQ-011-intra-city-transport.md`（S1–S14，含 2026-11-17 第 5 轮大交通自驾联动修订）；影响分析：`requirement-workspace/analysis/REQ-011/impact-brief.md`；细化：`requirement-workspace/analysis/REQ-011/deep-dive.md`（DoR BLOCKER=0，⑨–⑫ 通过）。