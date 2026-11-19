# REQ-021 原始意图：行程单右侧常驻当天路线规划

> 来源：用户 2026-11-19 文字诉求；REQ-021（REQ-020 之后顺延）。REQ-020「当天路线规划右移常驻」曾整体回退，本次按新口径重新提出。
> 本文件仅固化意图与已确认口径，不进入实现；分支待 P1 确认后创建。

## 用户原话

> 行程单页面 查看当天路线规划按钮展示的页面放到当前页面的右侧 一打开页面就能查看 只有行程单已完成才可以查看行程单页面 所以每天的地点是已经确认的

## 需求澄清（2026-11-19 对话确认）

1. **滚动方式**：整页滚动 + 右栏吸顶（sticky）。左列行程内容随页面正常滚动，右侧路线面板打开即见并持续可见。
2. **窄屏（<1024px）**：面板堆叠到行程单下方，统一常驻，不依赖弹窗。
3. **按钮与弹窗**：删除「查看当天路线规划」按钮与 `DayRouteDialog`，宽屏窄屏都不再需要入口。

## 关键前提

- `/itinerary` 仅在行程单已完成（`active.planCompleted === true`）时展示；未完成时页面已渲染「先完成行程单」的守卫分支（`itinerary.tsx:259`）。因此面板默认当天地点已确认，无需处理草稿/未确认状态。
- 已结束行程仍可查看行程单与路线面板（只读），与现有行为一致。

## 现状（代码证据，2026-11-19 调查）

- 入口：`apps/web/src/routes/_authenticated/itinerary.tsx:106` 维护 `routeDialogOpen`；`436–444` 行渲染「查看当天路线规划」按钮；`448–453` 行挂载 `DayRouteDialog`。
- 弹窗组件：`apps/web/src/components/trip/day-route-dialog.tsx`，`DialogContent max-w-3xl`，内容为标题「第 N 天路线规划」、日期城市描述与空态/单点/地图分支；测试标识 `day-route-dialog`。
- 地图：`apps/web/src/components/trip/day-route-map.tsx`，固定高度 `h-[420px]`，含加载、缺 Key、失败与部分失败状态；`print` 未处理（弹窗层以 `print:hidden` 隐藏）。
- 路线数据：`apps/web/src/lib/trip/day-route.ts`（`buildDayRoute`、距离/时长文案），已有单测 `day-route.test.ts`。
- 页面容器：`apps/web/src/components/layout/page-frame.tsx` 的 `<main>` 固定 `max-w-3xl`（768px），当前不足以容纳两列；需要为行程单提供更宽的主容器（P2 design 定稿宽度与断点）。
- 页面结构：Day 标签行（`395–446`）与当天 `DayDetail`（`461–468`）、未排期分组（`470–487`）；导出 PDF 用打印样式，导出图片使用独立的隐藏 `image-export-surface`。
- E2E：`e2e/day-route-planning.spec.ts:231–236` 通过按钮打开弹窗；`257–262` 关闭后断言弹窗消失且 Day 保持；`342` 断言弹窗数量为 0。
- 单测：`apps/web/src/lib/trip/day-route.test.ts` 覆盖路线构建与文案，不依赖弹窗。

## 方案取舍记录

- A（选定）整页滚动 + 右栏 sticky：改动集中在行程单页面与 `PageFrame` 宽度能力；打开即见，滚动时地图跟随。
- B 两列一屏 + 左列内滚：页面高度锁定，交互与滚动行为改动大；REQ-020 曾实现后整体回退，放弃。
- C 保留按钮 + 弹窗作为窄屏兜底：与「统一常驻、删除按钮与弹窗」的确认口径冲突，放弃。
- D 新增独立的右侧浮层而非列布局：定位与层级复杂，打印/导出与可访问性成本更高，放弃。

## 已知约束

- 删除入口后不保留隐藏按钮；`DayRouteDialog` 如无其他使用方则删除文件与相关状态。
- 面板内容与现有弹窗一致：标题「第 N 天路线规划」、日期城市描述、空天/无坐标/单点/地图与失败提示。
- 面板 MUST NOT 进入 PDF 打印与图片导出。
- 遵循 `@rule:spec-first`：P1 完成后进入 P2 变更包与 G1，再进入实现。
