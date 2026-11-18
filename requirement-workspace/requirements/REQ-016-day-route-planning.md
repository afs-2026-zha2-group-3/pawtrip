---
id: REQ-016
title: 行程单当天路线规划
status: ready-for-split
discovery: Go (2026-11-18)
sources:
  - ../intents/REQ-016-day-route-planning.md
  - openspec/specs/trip-itinerary/spec.md
  - openspec/specs/location-management/spec.md
  - openspec/specs/trip-planning/spec.md
---

# REQ-016：行程单当天路线规划

## Discovery Decision

Go（2026-11-18，light intake）— 候选能力明确：在既有 `/itinerary` 行程单的 Day 标签行旁增加「查看当天路线规划」按钮，弹窗内按当天地点顺序调用高德 JS 路线规划并绘制折线，标注距离与时长。与现有 Living Spec 关系清楚：扩展 `trip-itinerary`（入口、弹窗、绘制、标注、降级、空态），扩展 `location-management`（用户端地点详情坐标字段）；不改变 `trip-planning` 的计划结构。关键事实（2026-11-18 代码核实）：坐标在 `pawtrip_location`、不在 `trip`/`plan_json`；用户端地点详情未下发坐标；高德 JS loader 已存在但未暴露路线插件；行程单已缓存地点详情，可直接消费新增坐标字段。天气经用户明确排除。

## 六字段

1. **id**：REQ-016
2. **statement**：已登录用户在 `/itinerary` 行程单中选择某一天后，可点击 Day 标签行右侧「查看当天路线规划」打开该天路线弹窗；弹窗按行程单当天地点顺序展示编号标记，并对相邻两个不同 `poiId` 且坐标齐全的地点，按该段显示交通方式调用高德 JS 路线规划（步行段用 `AMap.Walking`、打车与驾车段用 `AMap.Driving`），以返回路径绘制折线；每条折线标注距离（取高德算路米数，按「N 米」或「N.N 公里」展示）与时长（优先取该段已保存的 `toNextEstimate.durationMinutes`，无快照时取高德算路秒数向上取整）；坐标由 `GET /api/locations/{poiId}` 新增的可空 `longitude`/`latitude` 提供（只读 `pawtrip_location`）；全程只读，不修改行程计划、不写库、不影响 PDF/图片导出；缺坐标、缺高德 JS Key、单段算路失败时给出非阻塞提示且不伪造路线；当天无地点或仅一个地点时展示明确空态且不发起算路。
3. **actors**：
   - 已登录用户：在行程单中查看某天路线、距离与时长，据以调整出行预期
   - 前端 `apps/web`：Day 标签行入口、路线弹窗、高德路线插件调用、折线与标注、降级与空态
   - 后端 `apps/server`：用户端地点详情响应新增只读坐标字段（无迁移、无上游调用、无写接口）
   - 高德 JS API 2.0：提供驾车/步行路线几何、距离与时长
   - 管理员：不受影响（无管理端界面变化）
4. **rationale**：现有行程单按天列出地点与段交通方式，但用户无法直观看到当天实际行走路径与总距离；复用既有高德 JS 能力与已保存坐标即可在不改计划模型的前提下提供可验证的路线视图，帮助用户评估当天安排是否紧凑、交通方式是否合理。
5. **acceptance hints**：
   - AC-1：`/itinerary` 的 Day 标签行右侧存在「查看当天路线规划」按钮；点击打开当前选中天的弹窗，标题为「第 N 天路线规划」，有开始日期时同时展示该天日期；关闭后仍保持原选中天，计划与保存状态不变
   - AC-2：弹窗按行程单顺序绘制编号标记；相邻不同 `poiId` 且坐标齐全时按方式绘制折线：`walk` → 步行路线，`drive`/`self_drive` → 驾车路线；相邻同 `poiId` 不发起算路
   - AC-3：每段已绘制折线标注距离与时长；距离 850 米显示「850 米」、1234 米显示「1.2 公里」；时长快照 20 分钟且算路 18 分钟时显示 20 分钟，无快照且算路 61 秒时显示 2 分钟；标注不写回计划
   - AC-4：地点缺坐标、未配置高德 JS Key、单段算路失败时弹窗展示非阻塞提示，其他路段与行程单其余内容继续可用；不画直线、不虚构距离
   - AC-5：当天无地点展示「当天暂无地点」且不发请求；当天仅一个地点展示编号标记并提示「当天只有一个地点，无需路线」
   - AC-6：`GET /api/locations/{poiId}` 在既有字段上返回可空 `longitude`/`latitude`，值直接来自已保存地点记录；缺失为 `null`；不调用高德、不下发原始 POI/`business`/照片列表
   - AC-7：路线弹窗不进入 PDF 与图片导出；行程计划、交通方式选择、政策提醒、既有导出行为均不变
6. **links to evidence**：
   - 意图与已决口径：[intents/REQ-016-day-route-planning.md](../intents/REQ-016-day-route-planning.md)
   - 行程单页面与 Day 切换：`apps/web/src/routes/_authenticated/itinerary.tsx:84`、`:277-291`、`:381`
   - 行程模型与交通方式：`apps/web/src/lib/trip/types.ts`、`apps/web/src/lib/trip/itinerary.ts:47`、`:86`、`apps/web/src/lib/trip/plan.ts:13-20`
   - 交通快照：`TripStop.toNextEstimate`（`durationMinutes`/费用区间）；REQ-011 Living Spec `trip-route-estimate`
   - 坐标存储：`apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql:24-25`；`apps/server/src/main/java/com/pawtrip/server/location/PawtripLocation.java:32-34`
   - 用户端详情：`apps/server/src/main/java/com/pawtrip/server/location/LocationQueryResponses.java:76`、`LocationQueryService.java:99-102`；前端 `apps/web/src/queries/locations.ts:62`
   - 地图能力：`apps/web/src/lib/amap/loader.ts`；`apps/web/src/routes/_authenticated/attractions/-location-map.tsx`
   - 弹窗组件：`apps/web/src/components/ui/dialog.tsx`
   - 影响分析：[analysis/REQ-016/impact-brief.md](../analysis/REQ-016/impact-brief.md)
   - Deep-dive：[analysis/REQ-016/deep-dive.md](../analysis/REQ-016/deep-dive.md)

## Ready 形状

### Intent

让用户在行程单内直接看到「这一天怎么走」：按当天顺序把地点连成真实高德路线，并在每段折线上给出距离与时长，帮助判断当天安排与交通方式是否合理。

### Actors 与权限边界

- 已登录用户：沿用行程单既有登录保护与属主边界；路线视图只读。
- 后端：仅扩展用户端地点详情的只读坐标字段；无新增写接口、无迁移、无管理端入口。
- 前端：路线数据完全由现有行程计划 + 地点详情缓存 + 高德 JS 计算得出；不新增全局 store，不写 `plan_json`。
- 高德 JS Key：沿用 `VITE_AMAP_JS_KEY` 与 `VITE_AMAP_SECURITY_CODE` 配置；未配置时按降级处理。

### In / Out Scope

**In**

- `/itinerary` Day 标签行右侧「查看当天路线规划」按钮与当前天路线弹窗（标题含天数与可选日期）
- 当天地点按行程顺序的编号标记；相邻不同地点按 `walk`/`drive`/`self_drive` 调用高德 JS 路线插件并绘制折线
- 折线距离与时长标注（快照优先、算路兜底、格式规则）
- 缺坐标 / 缺 Key / 单段失败的降级提示；无地点 / 单地点空态
- 用户端地点详情响应新增可空 `longitude`/`latitude`（只读 `pawtrip_location`）
- 前端高德 loader 扩展路线插件与折线/文本能力
- 后端 API 测试、前端纯函数与组件测试、E2E 覆盖

**Out**

- 天气展示、天气接口、可查询日期判断（用户明确不做）
- 行程计划结构变更、坐标写入 `trip`/`plan_json`、路线结果落库
- 后端代算路线接口、服务端缓存路线
- 拖拽调整地点顺序、路线内编辑地点、导航跳转/实时路况
- 管理端界面、地点数据维护、高德 Key 管理页面
- PDF/图片导出包含路线弹窗

### Scenarios + AC Hints

#### S1：入口与弹窗（AC-1）

- **Given** 已登录用户打开 `/itinerary`，当前选中 `Day 2`
- **When** 点击 Day 标签行右侧「查看当天路线规划」
- **Then** 打开标题为「第 2 天路线规划」的弹窗；存在开始日期时标题同时展示该天日期
- **And** 关闭弹窗后仍选中 `Day 2`，计划与保存状态不变

#### S2：按方式绘制路线（AC-2）

- **Given** 当天相邻两个不同地点坐标齐全，交通方式分别为打车、步行、自驾
- **When** 打开该天路线弹窗
- **Then** 打车与自驾段用驾车路线折线，步行段用步行路线折线
- **And** 地点按行程顺序展示编号标记

#### S3：同地点跳过（AC-2）

- **Given** 当天连续加入同一个 `poiId`
- **When** 打开路线弹窗
- **Then** 该相邻段不发起算路，其余路段正常绘制

#### S4：距离与时长标注（AC-3）

- **Given** 某段快照 20 分钟、高德算路 18 分钟、距离 1234 米；另一段无快照、算路 61 秒、距离 850 米
- **When** 查看路线
- **Then** 第一段标注「1.2 公里」与 20 分钟；第二段标注「850 米」与 2 分钟
- **And** 标注不写回行程计划

#### S5：降级（AC-4）

- **Given** 某地点缺坐标，或前端未配置高德 JS Key，或高德对某段返回失败
- **When** 用户打开路线弹窗
- **Then** 展示对应非阻塞提示；涉及路段不绘制，其他路段继续绘制
- **And** 行程单其他内容仍可正常使用，不伪造直线或距离

#### S6：空态（AC-5）

- **Given** 当天没有地点，或只有一个地点
- **When** 打开路线弹窗
- **Then** 无地点展示「当天暂无地点」且不发起算路；单地点展示编号标记并提示「当天只有一个地点，无需路线」

#### S7：坐标契约（AC-6）

- **Given** 某已保存地点经纬度为 `113.5`、`22.1`；另一地点无坐标
- **When** 已登录用户请求 `GET /api/locations/{poiId}`
- **Then** 前者返回 `longitude=113.5`、`latitude=22.1`，后者两者均为 `null`
- **And** 响应不包含原始 POI、`business` 或照片列表，后端不调用高德

#### S8：只读与导出回归（AC-7）

- **Given** 用户打开过路线弹窗后关闭
- **When** 导出 PDF 或图片
- **Then** 导出内容不包含地图、折线与距离时长标签
- **And** 行程计划、交通方式选择、政策提醒与既有导出一致

### Constraints

- 坐标唯一来源为 `pawtrip_location.longitude/latitude`，经 `GET /api/locations/{poiId}` 只读下发；不得在 `trip`/`plan_json` 新增坐标，不得迁移 schema。
- 路线方式映射：`walk → AMap.Walking`；`drive` 与 `self_drive → AMap.Driving`；`transit` 已在 `displayToNext` 归一，不单独处理。
- 距离格式：`< 1000` 米显示「N 米」；`>= 1000` 米显示一位小数公里「N.N 公里」。
- 时长：优先 `toNextEstimate.durationMinutes`；无快照时 `Math.ceil(seconds / 60)`；不写回计划。
- 高德调用：仅在前端使用 JS API 2.0；不新增后端路线接口；不改 Key 配置方式（`VITE_AMAP_JS_KEY`、`VITE_AMAP_SECURITY_CODE`）。
- 只读边界：不调用 `tripActions` 写操作；不触发保存；弹窗内容不进入打印/导出 DOM 路径。
- 降级：缺坐标、缺 Key、单段失败均为非阻塞提示；同 `poiId` 段不请求；无地点/单地点不发请求。
- 前端遵循 TanStack Query/request 层约定与 shadcn 组件语言；错误提示沿用现有界面语言。
- 实现前形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。

### Context

- 行程单与按天汇总由 REQ-011 与既有 `trip-itinerary` 交付；交通方式与 `toNextEstimate` 快照已存在（`trip-route-estimate`），本需求只读消费。
- 地点详情在行程单中已按 `poiId` 预取并缓存（`itinerary.tsx` 的 `locationBrowseDetailQueryOptions`），新增坐标字段可直接复用该缓存。
- 高德 JS 地图片段由 REQ-012 的地图能力引入；本需求扩展同一 loader，不引入新的脚本加载方式。
- `/itinerary` 已有打印/导出模式；路线弹窗必须与导出路径隔离。

### Affected Capabilities

- **MODIFIED** `trip-itinerary`：新增当天路线入口、弹窗、绘制、标注、降级与空态需求
- **MODIFIED** `location-management`：用户端地点详情新增可空坐标字段（只读、无迁移）
- 不改 `trip-planning`、`trip-route-estimate`、`trip-context`、`trip-attractions` 的既有行为

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 入口形态与作用范围？ | Product | 已决（2026-11-18，用户确认）：Day 标签行右侧按钮，作用于当前选中天 |
| OQ-2 | blocking | resolved | 地图展示位置？ | Product | 已决（2026-11-18，用户确认方案）：弹窗内地图，不内嵌时间线，不影响导出 |
| OQ-3 | blocking | resolved | 路线方式如何对应行程单？ | SA | 已决（2026-11-18）：跟随段显示方式，`walk` 步行、`drive`/`self_drive` 驾车；同 `poiId` 不算路 |
| OQ-4 | blocking | resolved | 坐标从哪里取？ | SA | 已决（2026-11-18）：`pawtrip_location` 经用户端地点详情只读下发；不在 trip 表新增列 |
| OQ-5 | blocking | resolved | 距离与时长口径？ | Product | 已决（2026-11-18）：距离取高德；时长快照优先、无快照向上取整；格式规则见 Constraints |
| OQ-6 | blocking | resolved | 是否展示天气？ | Product | 已决（2026-11-18，用户明确）：不做天气，无天气 UI/接口/日期判断 |
| OQ-7 | blocking | resolved | 是否允许修改行程计划？ | Product | 已决（2026-11-18）：完全只读，不写库、不触发保存、不进导出 |
| NB-1 | non-blocking | resolved | 缺坐标/缺 Key/单段失败如何呈现？ | Dev | 已决（2026-11-18）：非阻塞提示，跳过对应路段，继续展示其他内容 |
| NB-2 | non-blocking | resolved | 空态文案与请求边界？ | Dev | 已决（2026-11-18）：「当天暂无地点」/「当天只有一个地点，无需路线」；空态不发请求 |
| NB-3 | non-blocking | resolved | 折线标注的技术形态？ | Dev | 已决（2026-11-18）：高德 `Polyline` + `Text`（或等价 overlay）；由 design 定稿 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Open Questions | 7 个 blocking OQ（入口/展示/方式/坐标/口径/天气/只读） | 2026-11-18 与用户确认并随 design 批准，全部 resolved |
| WARNING | resolved | NB-1…NB-3 | 3 个非阻塞细节（降级呈现/空态文案/标注形态） | 2026-11-18 逐项定稿，design.md 已覆盖 |

基础 8 项自检：①意图清晰 ✓ ②actors 与权限边界 ✓ ③范围有界（In/Out）✓ ④场景具体（S1–S8）✓ ⑤异常/边界（缺坐标、缺 Key、单段失败、同地点、无地点、单地点）✓ ⑥结果可验证（路线/距离/时长/提示可观察）✓ ⑦依赖与触点（地点详情坐标、高德 JS、行程快照、弹窗组件）✓ ⑧blocking OQ=0 ✓。⑨数据契约 ✓ ⑩边界分支 ✓ ⑪跨 REQ 一致性 ✓ ⑫展示与测试 ✓（2026-11-18 deep-dive 完成，见 `analysis/REQ-016/deep-dive.md` 第 6 节）。BLOCKER 数：0。影响分析 blocker：0；建议单 change `2026-11-18-add-day-route-planning`（规模 M，无迁移、无新依赖、1 个后端契约扩展 + 前端弹窗/地图）。

## 修订记录

### 2026-11-18 初版

- 依据用户对话与已批准的 OpenSpec design 建立 REQ-016；天气已排除；坐标经地点详情只读下发；路线与标注仅前端计算，不写回计划。
