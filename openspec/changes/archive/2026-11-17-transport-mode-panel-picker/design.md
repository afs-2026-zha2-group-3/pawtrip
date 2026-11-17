# Design

## Context

- 大交通方式保存在激活行程的 `transportMode`，规则页通过单选调用 `tripActions.setTransportMode`，由 `scheduleTripSave` 防抖整量保存。
- 推荐判定已有纯函数 `evaluateRuleForPet(rule, pet)`，规则页按表格行调用；每种方式有一条代表规则（`getRuleForMode`），飞机默认中国国际航空。
- 行程面板已能拿到激活宠物 `activePet`（按 `active.petId` 从宠物查询结果匹配）。
- UI 组件基于 Base UI / shadcn 风格，仓库尚无 Popover 封装，但 `@base-ui/react` 已包含 Popover primitive。

## Goals / Non-Goals

**Goals:**

- 在行程面板就地选择大交通方式，并看到当前宠物的推荐结论。
- 复用既有判定与保存链路，规则页与面板无状态分叉。
- 不新增依赖、不改后端。

**Non-Goals:**

- 不在浮层内编辑航司或展示完整条款；航司差异仍以规则页为准。
- 不改规则页单选列与表格结构。
- 不为推荐结论引入缓存或服务端接口。

## Decisions

### D1：复用 `evaluateRuleForPet` 与代表规则

新增 `transportModeOptions(pet)` 纯函数，遍历四种方式，用 `getRuleForMode(mode)` 取代表规则并调用既有判定。飞机分支标注「按中国国际航空」，与规则页默认航司一致。避免在面板内复制阈值逻辑，防止两处口径漂移。

替代方案：为面板单独维护推荐文案。会与规则页形成第二套判定，后续规则更新容易漏改。

### D2：封装 Base UI Popover，不引入新依赖

按现有 `components/ui` 约定封装 `Popover`、`PopoverTrigger`、`PopoverContent`，复用 `bg-popover`、`ring-foreground/10`、`data-open/data-closed` 动画类。浮层层级 `z-[60]`，高于行程面板的 `z-50`。

替代方案：用 `Dialog` 或原生 `details`。Dialog 会抢焦点并遮罩页面，不像就地选择；`details` 难以控制外部点击关闭与定位。

### D3：入口形态与既有测试兼容

- 已选择：渲染「大交通 · 方式名」可点击 chip，保留 `data-testid="transport-mode-tag"`，既有 E2E 继续通过。
- 未选择：渲染「选择大交通」虚线入口，`data-testid="transport-mode-picker"`，不使用大交通 tag，符合「未选择不展示方式名 tag」。
- 触发按钮未选择时 `aria-label="选择大交通方式"`，已选择时 `aria-label="大交通方式：{中文名}"`，方式项带 `data-mode` 与 `aria-pressed`，便于键盘操作、读屏回读与 E2E 定位。

### D4：选择即写入 store，沿用防抖保存

点击方式调用 `tripActions.setTransportMode(mode)` 并关闭浮层；`active` 更新触发既有 `scheduleTripSave`，规则页单选读取同一字段自动回显。浮层不持有第二份选择状态。

### D5：规则详情入口放在浮层右上角

标题右侧提供「规则详情 ↗」，跳转 `/transport-rules` 并关闭浮层；不提供航司级深链，避免浮层承担规则编辑职责。

## Risks / Trade-offs

- **飞机按默认航司给结论** → 用户在规则页切换航司后，面板结论仍按中国国际航空；已在浮层标注「按中国国际航空」，差异由规则页兜底。
- **宠物档案不可用** → 只展示方式不展示结论，入口保持可选：加载中显示「正在读取宠物档案…」，读取失败显示「暂时无法读取宠物档案，请稍后重试。」，与规则页的加载/失败/无档案三态口径一致。
- **面板与规则页两处入口** → 都通过 store 写同一个 `transportMode`，无本地副本；防抖保存仍合并为一次 `PUT`。
- **Popover 在移动端窄屏** → 固定宽度 288px，`max-h-(--available-height)` + `overflow-y-auto` 随浮层滚动；面板收起态位于左下角，定位使用 Base UI Positioner。

## Migration Plan

纯前端交互新增，无数据迁移。回滚只需恢复只读标签与移除浮层组件。

## Test Strategy

- 单测：`transportModeOptions` 覆盖无宠物、不满足条件、全部推荐三类。
- E2E：面板浮层展示激活宠物结论与原因；选择后 `PUT` 包含 `transportMode` 且标签更新、刷新后保留；规则详情链接跳转规则页。
- 既有 E2E：规则页推荐列与单选、刷新回显继续通过。
- 浏览器结构验证：入口形态、浮层层级、规则页单选同步。
