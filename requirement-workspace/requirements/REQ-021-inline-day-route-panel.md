---
id: REQ-021
title: 行程单右侧常驻当天路线规划
status: p1-ready
discovery: Go (2026-11-19)
sources:
  - ../intents/REQ-021-inline-day-route-panel.md
  - openspec/specs/trip-itinerary/spec.md
  - apps/web/src/routes/_authenticated/itinerary.tsx
  - apps/web/src/components/trip/day-route-dialog.tsx
  - apps/web/src/components/trip/day-route-map.tsx
  - apps/web/src/components/layout/page-frame.tsx
  - e2e/day-route-planning.spec.ts
---

# REQ-021：行程单右侧常驻当天路线规划

## Discovery Decision

Go（2026-11-19，light intake）— 用户以文字明确要求：把「查看当天路线规划」按钮打开的弹窗内容放到行程单页面右侧，打开页面即可查看。用户补充前提：行程单只有完成计划后才可查看，因此每天的地点是已确认的。三点交互口径已确认：宽屏整页滚动 + 右栏吸顶；窄屏（<1024px）堆叠到行程单下方；删除按钮与 `DayRouteDialog`。与 Living Spec 的关系清楚：把 `trip-itinerary` 的「当天路线规划入口与弹窗」改为「当天路线规划面板」，路线绘制、距离时长标注、降级与空态四类要求保持不变（仅投影位置从弹窗改到常驻面板）。不改城市、行程计划、交通方式选择与外部接口。REQ-020 曾实现「两列一屏 + 左列内滚」后整体回退，本次不复用该布局，改为整页滚动 + 右栏 sticky。

## 六字段

1. **id**：REQ-021
2. **statement**：已登录用户打开 `/itinerary`（行程单已创建）时，页面右侧在宽屏（≥1024px）常驻展示当前选中天（默认 `Day 1`）的路线规划面板，无需点击任何按钮即可查看地图、编号标记、折线与距离/时长标注；切换 `Day N` 标签时右栏内容同步切换为该天。宽屏采用整页滚动 + 右栏吸顶，行程内容随页面滚动时面板保持可见；窄屏（<1024px）时面板按同一内容堆叠在当天行程明细之后、「未排期」之前。原「查看当天路线规划」按钮与 `DayRouteDialog` 删除，不存在隐藏入口。面板内容与现有弹窗一致：标题「第 N 天路线规划」、日期与城市描述、空天/缺坐标/单点/地图与失败提示。路线面板 MUST NOT 进入 PDF 打印与图片导出。行程单未完成守卫、已结束只读、导出、携带清单与天切换等既有行为保持不变。
3. **actors**：
   - 已登录用户：打开行程单即查看当天路线，切换 Day 查看其他天路线
   - 前端 `apps/web`：行程单两列布局、右栏 sticky、面板渲染与 Day 联动；`PageFrame` 增加可供行程单加宽的宽度能力
   - 路线数据：沿用 `buildDayRoute` 与现有地点缓存，不新增后端接口或字段
4. **rationale**：路线规划是行程单的核心信息，藏在按钮后需要额外一次点击才能看到，且弹窗会遮挡行程明细、无法与地点时间线对照。改为常驻右栏后，用户打开行程单即可对照当天地点与路线；整页滚动 + 吸顶既保留现有滚动习惯，又避免 REQ-020「左列内滚」造成的交互改动。删除按钮与弹窗可减少重复入口与状态（`routeDialogOpen`）。
5. **acceptance hints**：
   - AC-1：已创建行程单的 `/itinerary` 页面在宽屏（≥1024px）打开后，右侧立即展示当前选中天的路线面板，无需任何点击；默认选中 `Day 1`
   - AC-2：页面不再存在「查看当天路线规划」按钮与 `DayRouteDialog` 弹窗，也不存在隐藏触发入口
   - AC-3：点击 `Day N` 标签后，右栏标题变为「第 N 天路线规划」，描述同步该天日期与城市，地图/标记/折线/标注刷新为该天路线
   - AC-4：宽屏采用整页滚动 + 右栏吸顶；滚动行程明细时面板保持可见且不遮挡左列内容；主内容容器加宽以容纳两列，其他页面宽度不变
   - AC-5：窄屏（<1024px）时页面保持单列，面板堆叠在当天行程明细之后、「未排期」之前，随页面滚动，不出现弹窗
   - AC-6：面板内容与现弹窗一致：标题、日期城市、「当天暂无地点」「地点缺少坐标，无法绘制路线」「当天只有一个地点，无需路线」、地图加载/缺 Key/失败/部分失败提示与缺坐标提示；空态或单点不发起算路
   - AC-7：PDF 打印与图片导出不包含路线面板、地图、折线与距离时长标签；打印仍输出原有行程单内容
   - AC-8：行程单未完成守卫、已结束只读提示、导出按钮、携带清单、天切换与未排期分组行为不变；E2E 改为断言常驻面板，删除「打开/关闭弹窗」路径

6. **links to evidence**：
   - 意图与确认口径：[intents/REQ-021-inline-day-route-panel.md](../intents/REQ-021-inline-day-route-panel.md)
   - 页面与入口：[itinerary.tsx](../../apps/web/src/routes/_authenticated/itinerary.tsx#L436)（按钮 436–444、弹窗挂载 448–453、Day 标签 395–417、`DayDetail` 461–468、未排期 470–487）
   - 未完成守卫：[itinerary.tsx:259](../../apps/web/src/routes/_authenticated/itinerary.tsx#L259)
   - 弹窗内容：[day-route-dialog.tsx](../../apps/web/src/components/trip/day-route-dialog.tsx)
   - 地图与状态：[day-route-map.tsx](../../apps/web/src/components/trip/day-route-map.tsx)
   - 路线构建与文案：[day-route.ts](../../apps/web/src/lib/trip/day-route.ts)
   - 页面容器：[page-frame.tsx](../../apps/web/src/components/layout/page-frame.tsx#L15)
   - 既有 E2E：[day-route-planning.spec.ts](../../e2e/day-route-planning.spec.ts#L231)
   - Living Spec：[trip-itinerary/spec.md](../../openspec/specs/trip-itinerary/spec.md#L267)（入口与弹窗 267、绘制 291、距离时长 315、降级 338、空态 363）
   - 影响分析：[analysis/REQ-021/impact-brief.md](../analysis/REQ-021/impact-brief.md)、Deep-dive：[analysis/REQ-021/deep-dive.md](../analysis/REQ-021/deep-dive.md)

## Ready 形状

### Intent

让路线规划成为行程单的一部分而不是二级入口：打开行程单即在地图旁对照当天地点顺序、路线、距离与时长；切换 Day 即切换路线，滚动查看明细时地图仍在视野内。

### Actors 与权限边界

- 已登录用户：查看路线面板；权限与现有登录保护、行程归属校验一致。
- 前端：只读消费现有行程计划与地点缓存；不新增写操作、不触发保存。
- 后端：无接口、字段、迁移变化；高德 JS 走现有前端加载器。
- 导出：打印与图片导出保持原范围，面板不参与。

### In / Out Scope

**In**

- `/itinerary` 宽屏两列布局：左列为当天行程明细与未排期，右列为路线面板（吸顶）
- 面板随 `Day N` 切换同步更新；默认展示 `Day 1`
- 删除「查看当天路线规划」按钮、`routeDialogOpen` 状态与 `DayRouteDialog` 文件
- `PageFrame` 提供行程单可用的加宽能力（默认值保持其他页面不变）
- 面板内容与降级文案保持现弹窗口径；测试标识由弹窗改为面板
- E2E `day-route-planning.spec.ts` 改断言常驻面板；相关单测同步

**Out**

- 改变路线绘制、交通方式映射（`walk`→Walking，`drive`/`self_drive`→Driving）、距离/时长算法或快照优先规则
- 改变行程计划结构、`buildDayRoute` 入参或保存逻辑
- 新增后端接口、数据库字段或迁移
- 路线面板进入 PDF 打印或图片导出
- 其他页面宽度、导航、城市选择、携带清单、伙伴提示的视觉与行为
- 拖拽排序、交通段编辑等行程单编辑能力（不在本页）

### Scenarios + AC Hints

#### S1：打开即见（AC-1）

- **Given** 用户已创建并完成行程计划，进入 `/itinerary`
- **When** 页面加载完成
- **Then** 宽屏右侧直接展示「第 1 天路线规划」面板与地图内容
- **And** 页面上没有「查看当天路线规划」按钮

#### S2：切换 Day 同步（AC-3）

- **Given** 右栏展示 `Day 1` 路线
- **When** 用户点击 `Day 2` 标签
- **Then** 右栏标题变为「第 2 天路线规划」，描述为该天日期与城市
- **And** 地图重新绘制第 2 天的标记、折线与标注
- **And** 页面不触发保存或计划修改

#### S3：滚动吸顶（AC-4）

- **Given** 宽屏下行程明细长于一屏
- **When** 用户向下滚动页面
- **Then** 右栏路线面板保持可见（吸顶），左列内容正常滚动
- **And** 面板不遮挡左列文字与操作

#### S4：窄屏堆叠（AC-5）

- **Given** 视口宽度小于 1024px
- **When** 用户打开行程单
- **Then** 页面为单列，路线面板出现在当天行程明细之后、「未排期」之前
- **And** 无弹窗入口，面板随页面滚动

#### S5：空态与降级（AC-6）

- **Given** 当天无地点 / 地点缺坐标 / 仅一个地点 / 高德 Key 未配置 / 单段算路失败
- **When** 右栏渲染该天
- **Then** 分别展示「当天暂无地点」「地点缺少坐标，无法绘制路线」/ 部分缺坐标提示、「当天只有一个地点，无需路线」、地图未配置提示、部分或全部失败提示
- **And** 行程明细与其他内容不受阻塞

#### S6：导出隔离（AC-7）

- **Given** 行程单右侧展示路线面板
- **When** 用户导出 PDF 或图片
- **Then** 导出内容不包含路线地图、折线或距离时长标签

#### S7：既有行为保持（AC-8）

- **Given** 行程尚未创建行程单 / 行程已结束
- **When** 用户进入行程单
- **Then** 未完成时仍显示「尚未创建行程单」守卫（无右栏面板）；已结束时仍可查看并显示只读提示
- **And** 导出、携带清单、天切换与未排期行为不变

### Constraints

- 断点固定为 1024px（Tailwind `lg`）：≥1024px 两列，<1024px 单列堆叠。
- 宽屏为整页滚动 + 右栏 sticky；不得引入左列独立滚动容器或页面高度锁定。
- 右栏吸顶偏移与宽度、左列/右栏比例由 P2 design 定稿；`PageFrame` 加宽只作用于行程单，默认值下其他页面宽度不变。
- 面板默认天与页面 `selectedDay` 共用同一状态；不新增重复的 Day 状态。
- 面板不新增数据请求：沿用 `buildDayRoute(day, locations)` 与现有 `locations` 缓存。
- 面板内容、文案与 `day-route.ts` 常量保持一致，逐字复用现有文案。
- 地图与失败/缺坐标提示的测试标识保留（`day-route-map`、`day-route-empty`、`day-route-all-missing`、`day-route-single`、`day-route-failure`、`day-route-missing`、`day-route-placeholder`）；容器标识由 `day-route-dialog` 改为 `day-route-panel`。
- 面板 MUST `print:hidden`；图片导出使用独立隐藏容器，面板不得进入该容器。
- 保留 `/itinerary` 页框淡奶黄描边（REQ-020 已合并结果），不得回退。
- 遵循 `@rule:spec-first`：P2 变更包以 REMOVED + ADDED 迁移弹窗需求（原场景名均含「弹窗」，行为已改变），其余 MODIFIED 需求保留原场景名；E2E 更新计入 ≤30 上限。

### Context

- 行程单只有 `active.planCompleted` 为真时才渲染内容（`itinerary.tsx:259` 守卫），因此面板无需处理草稿或未确认地点；已结束行程仍可查看（只读）。
- REQ-020 首版曾做「两列一屏 + 左列内滚」，用户要求除描边外全部恢复 main；本次布局明确改为整页滚动 + 右栏 sticky，避免重复该回退原因。
- 现弹窗为 `max-w-3xl` 居中浮层；改为右栏后地图宽度受右栏宽度约束，`DayRouteMap` 容器为 `w-full` 自适应，高度沿用 `h-[420px]`（P2 可微调）。
- `PageFrame` 当前 `<main>` 固定 `max-w-3xl`（768px），两列在 768px 内不可用；加宽仅为行程单启用，`className` 仍作用于内层 section。
- 图片导出依赖隐藏的 `image-export-surface`，与页面布局互不影响；打印依赖 `printing` 状态展开全部 Day，右栏须在打印态隐藏。
- 现有 E2E `day-route-planning.spec.ts` 的 helper 依赖按钮与关闭动作，需改为等待常驻面板并按 Day 断言。

### Affected Capabilities

- **MODIFIED** `trip-itinerary`：将「当天路线规划入口与弹窗」与「路线弹窗空态」以 REMOVED + ADDED 迁移为「当天路线规划面板」「路线面板空态」（打开即见、右栏常驻、Day 联动、窄屏堆叠、导出排除）；「当天路线绘制」「路线规划不可用时的降级」保持行为，仅更新「弹窗」投影措辞；「携带清单入口与进度」「携带清单弹窗与操作」清理对路线按钮/弹窗的表述，行为不变。
- 不改 `destination-selection`、`trip-planning`、`trip-context`、`trip-attractions`、`trip-route-estimate`、`trip-packing-checklist`、`web-app-shell`、`ui-foundation` 的既有要求；`PageFrame` 加宽属于实现手段，不改变其他页面可观察行为。
- 后端与数据无变化。

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 宽屏滚动方式？ | Product | 已决（2026-11-19）：整页滚动 + 右栏吸顶 |
| OQ-2 | blocking | resolved | 窄屏（<1024px）如何展示？ | Product | 已决：堆叠到行程单下方，统一常驻，不使用弹窗 |
| OQ-3 | blocking | resolved | 原按钮与弹窗如何处理？ | Product | 已决：删除「查看当天路线规划」按钮与 `DayRouteDialog`，不留隐藏入口 |
| OQ-4 | blocking | resolved | 面板默认展示哪一天？ | Product | 已决：与页面选中天一致，默认 `Day 1` |
| OQ-5 | non-blocking | resolved | 面板是否进入导出？ | SA | 已决：不进入 PDF 打印与图片导出 |
| OQ-6 | non-blocking | resolved | 主容器宽度如何调整？ | SA | 已决：`PageFrame` 增加行程单可用的加宽能力，其他页面不变；具体宽度/比例由 P2 design 定稿 |
| OQ-7 | non-blocking | resolved | 面板标题与描述？ | Product | 已决：保持「第 N 天路线规划」+「日期 · 城市」，与现弹窗文案一致 |
| OQ-8 | non-blocking | resolved | 地图高度与测试标识？ | Dev | 已决：高度沿用 `h-[420px]`（P2 可微调）；保留地图与状态测试标识，容器改为 `day-route-panel` |
