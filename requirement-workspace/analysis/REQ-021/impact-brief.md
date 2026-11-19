# REQ-021 Impact Brief — 行程单右侧常驻当天路线规划

- 生成日期：2026-11-19
- 上游需求：[REQ-021 行程单右侧常驻当天路线规划](../../requirements/REQ-021-inline-day-route-panel.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：整页滚动 + 右栏吸顶；窄屏 <1024px 堆叠到行程单下方；删除按钮与弹窗。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-021 | 行程单右侧常驻当天路线规划 | p1-ready | `requirements/REQ-021-inline-day-route-panel.md` |

阻塞开放问题：0（4 blocking + 4 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-itinerary/spec.md`
  - 「当天路线规划入口与弹窗」（267 行起）：按钮 + 弹窗、关闭保持选中天、导出不含弹窗；本需求改为常驻面板，需 MODIFIED 并改名。
  - 「当天路线绘制」（291 行起）：编号标记、Walking/Driving 映射、同 `poiId` 不发起算路；行为不变，仅触发描述由「打开弹窗」改为「查看面板」，P2 需按 G1 口径决定是否更新场景措辞。
  - 「路线距离与时长标注」（315 行起）：距离取米数、时长快照优先；不变。
  - 「路线规划不可用时的降级」（338 行起）：缺坐标/缺 Key/单段失败；不变，场景措辞含「打开路线弹窗」。
  - 「路线弹窗空态」（363 行起）：空天与单点；以 REMOVED + ADDED 迁移为「路线面板空态」，保留文案与「不发起算路」约束。
- 「携带清单入口与进度」（383 行起）与「携带清单弹窗与操作」（405 行起）引用了「查看当天路线规划」同层与「复用路线规划一致的交互形态」；删除按钮/弹窗后需 MODIFIED 清理表述，行为不变。
- REQ-020 已合并结果：变更包 `openspec/changes/2026-11-19-itinerary-cream-frame/` 保留 `/itinerary` 淡奶黄描边；REQ-020 首版的 `2026-11-19-inline-day-route-panel` 变更包已撤销，本需求重新建立，不复用旧包。

**当前前端实现**

- `apps/web/src/routes/_authenticated/itinerary.tsx`
  - `105`：`selectedDay`（默认 1）；`106`：`routeDialogOpen`（本次删除）。
  - `259`：`!active.planCompleted` 守卫——面板只在已完成行程单页面出现。
  - `340–344`：`PageFrame` + 淡奶黄描边 `border-2 border-paw-accent-soft`。
  - `395–446`：Day `Tabs` 与右侧操作区；`436–444` 为「查看当天路线规划」按钮（本次删除）。
  - `448–453`：`DayRouteDialog` 挂载（本次删除）。
  - `461–468`：`DayDetail` 映射（`printing` 时展开全部天）。
  - `470–487`：未排期分组。
- `apps/web/src/components/trip/day-route-dialog.tsx`：`DialogContent max-w-3xl print:hidden`；容器 `data-testid="day-route-dialog"`；标题「第 ${day.day} 天路线规划」；描述 `dateLabel · city`；分支空天 `day-route-empty`、全缺坐标 `day-route-all-missing`、单点 `day-route-single`、否则地图。本次提炼为面板或删除（无其他使用方，见下）。
- `apps/web/src/components/trip/day-route-map.tsx`：容器 `h-[420px] w-full`、`data-testid="day-route-map"`；状态 loading/missing-key/error；`RouteFallback`（`day-route-placeholder`）、`day-route-failure`、`day-route-missing`；按 `routeKey` 重绘，卸载时销毁地图。
- `apps/web/src/lib/trip/day-route.ts`：`buildDayRoute`、`DAY_ROUTE_*_TEXT` 常量、距离/时长格式化；本次复用，不改。
- `apps/web/src/components/layout/page-frame.tsx:15`：`<main class="... max-w-3xl ...">`，`className` 只作用于内层 `section`；两列布局需要行程单可用的加宽能力。

**测试现状**

- `e2e/day-route-planning.spec.ts`：`232–233` helper 点击按钮并取 `day-route-dialog`；`257` 与 `337` 点击「关闭弹窗」；`342` 断言 `day-route-dialog` 数量为 0——全部需改为常驻面板断言。
- `apps/web/src/lib/trip/day-route.test.ts`：路线构建与文案单测，不依赖弹窗，保持不变。
- `e2e/itinerary.spec.ts`：行程单整体回归；需确认无弹窗相关断言（当前未见）。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| 入口 | 按钮「查看当天路线规划」打开弹窗 | 删除按钮；面板常驻右栏，打开即见 |
| 弹窗组件 | `DayRouteDialog`（`max-w-3xl` Dialog） | 改为行程单内嵌面板组件（名称待 P2，如 `DayRoutePanel`），删除 Dialog 壳 |
| 页面状态 | `routeDialogOpen` | 删除；仅保留 `selectedDay` |
| 布局 | 单列 `max-w-3xl`，整页滚动 | 宽屏两列：左列行程内容 + 右列 sticky 面板；窄屏单列堆叠（面板在 `DayDetail` 后、未排期前） |
| 容器宽度 | `PageFrame` 固定 `max-w-3xl` | `PageFrame` 增加加宽能力；仅行程单启用，其他页面默认不变 |
| Day 联动 | 打开弹窗前先选天 | 面板直接绑定 `selectedDay`，切换即刷新 |
| 导出 | 弹窗 `print:hidden` + 独立图片导出容器 | 面板 `print:hidden`，不进入图片导出容器 |
| 测试标识 | `day-route-dialog` + 地图各标识 | `day-route-panel` + 保留地图各标识 |
| Living Spec | 「当天路线规划入口与弹窗」「路线弹窗空态」；携带清单两需求引用路线按钮/弹窗 | REMOVED + ADDED 迁移为「当天路线规划面板」「路线面板空态」；绘制/降级/携带清单以 MODIFIED 更新措辞，行为不变 |

## 4. Blast radius

- **直接受影响**：`/itinerary` 页面布局与状态；路线面板组件（由弹窗改造）；`PageFrame` 宽度能力；`e2e/day-route-planning.spec.ts`。
- **不受影响**：路线数据与算法（`day-route.ts`）、高德加载器、地点缓存与查询、行程计划与保存、交通段展示、携带清单、伙伴提示、城市选择、其他页面宽度与导航、后端与数据库。
- **兼容性**：无接口/字段/迁移变化；无本地存储或 URL 状态变化；刷新后仍默认 `Day 1`。
- **外部依赖**：无新增；高德 JS Key 缺失时仍走 `day-route-placeholder` 降级。
- **数据迁移**：无。

## 5. Artifact impact

- **Specs**：`trip-itinerary` REMOVED「当天路线规划入口与弹窗」「路线弹窗空态」；ADDED「当天路线规划面板」「路线面板空态」；MODIFIED「当天路线绘制」「路线规划不可用时的降级」「携带清单入口与进度」「携带清单弹窗与操作」（清理表述，行为不变）。
- **Tests**：
  - E2E：`day-route-planning.spec.ts` 删除按钮/关闭路径，改为进入页面即断言 `day-route-panel` 与当前天内容；保留绘制、快照、失败、空态、缺 Key 用例；新增窄屏堆叠与导出隔离断言（计入 ≤30 上限）。
  - 前端单测：现有 `day-route.test.ts` 不变；如新增面板组件可从弹窗测试迁移（当前无组件级弹窗测试）。
  - 后端：无。
- **Docs / KB**：无需更新 HTTP 契约；如 `docs/knowledge/` 记录页面结构，P4 同步一句面板位置说明。
- **OpenSpec**：P2 新建变更包（建议 `2026-11-19-inline-day-route-panel`），P1 完成后经 G1 评审。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载「布局加宽 → 面板内嵌 → 删按钮/弹窗 → 测试重写」。布局与面板共享同一页面契约，拆分会出现「有面板无位置」或「有位置无内容」的不可验收中间态。
- **Agile**：可拆 3 个薄故事：宽屏两列与 sticky（AC-1/4）→ Day 联动与面板内容（AC-3/6）→ 删入口与测试/导出隔离（AC-2/5/7/8）。
- **依赖顺序**：`PageFrame` 计宽能力 → 面板组件（去 Dialog）→ 页面两列与 sticky → 删除按钮/状态/文件 → E2E/单测 → OpenSpec 同步。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 高德地图在 sticky 容器内尺寸/交互异常 | 右栏宽度固定后地图 `w-full`；切换 Day 由 `routeKey` 重建；本地需在 ≥1024px 真实浏览器验证拖拽与缩放 |
| 风险 R2 | `PageFrame` 加宽影响其他页面 | 加宽能力默认关闭；仅 `/itinerary` 传入；回归其他页面截图/宽度断言 |
| 风险 R3 | 重复 REQ-020 回退原因（左列内滚/一屏锁定） | 本次明确整页滚动 + 右栏 sticky，不设左列独立滚动，不锁页面高度 |
| 风险 R4 | 打印/图片导出混入面板 | 面板容器 `print:hidden`；图片导出使用独立隐藏容器，面板不在其 DOM 内；E2E/目视核验 |
| 风险 R5 | E2E 依赖按钮与关闭动作失效 | 重写 helper 为等待 `day-route-panel`；逐条替换 `257/337/342` 行断言；全量 E2E 回归 |
| 风险 R6 | 窄屏顺序埋没面板 | 窄屏面板紧跟当天 `DayDetail`、位于未排期之前；保持与选中天相邻 |
| 风险 R7 | 面板默认天与打印全量天冲突 | 打印态沿用 `printing` 展开全部 `DayDetail`，面板整体隐藏，不参与打印 |
| **blocker** | 无 | 无未知外部依赖；无后端与数据变化 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`2026-11-19-inline-day-route-panel`（REQ-020 旧包已撤销，新建同名口径）。
- 理由：布局、面板与入口删除共享同一页面与状态契约，拆分会造成入口/位置/内容不可独立验收。
- 规模预估：S–M；1 个容器能力 + 1 个页面布局改造 + 1 个弹窗组件改造（去 Dialog）+ 1 个 E2E 重写；无新依赖、无后端改动。
- 工作切片（change 内顺序）：T1 `PageFrame` 计宽 → T2 面板组件（去 Dialog、保留内容分支）→ T3 页面两列/sticky/窄屏 → T4 删除按钮与状态/文件 → T5 E2E 与单测 → T6 全量验证与 OpenSpec 复验。
