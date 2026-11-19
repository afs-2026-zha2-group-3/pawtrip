# Proposal

## Why

US-52 要求每个登录后页面都有以宠物名字说话的伙伴提示，统一承接下一步建议与规则/操作反馈。当前提示散落在内联文案（途内携宠小字、政策对比、行程单提醒等），口径与样式不统一；各业务若自行实现气泡会进一步碎片化。右下角已有 Chatbot 入口，再加独立伙伴头像会造成两个入口职责重叠，因此伙伴提示应挂在现有 Chatbot 入口上。

## What Changes

- **复用现有 Chatbot 入口**：沿用 `agent-fab` 的位置、样式、测试标识与可访问名称；点击入口 SHALL 直接打开既有 AgentPanel，不再新增第二个浮动头像。
- **全局伙伴气泡**：入口上方渲染非模态气泡，标题为「<宠物名> · 伙伴提示」，宠物名取宠物档案第一只；无档案时默认「豆包」。气泡展示正文与情绪边框，提供关闭按钮，不提供单独的「AI 规划」按钮（入口即 AI 入口）。
- **统一提示接口**：新增 `lib/companion` store，提供 `say(text, mood)`；情绪 `ok / info / warn / danger` 决定气泡边框色；新气泡替换旧气泡；气泡展示 5 秒后自动关闭（需求方 2026-11-18 确认，覆盖故事中的 4.6 秒）。
- **逐页情境提示**：新增 `useCompanionHint`，首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单分别声明情境提示；每次 pathname 切换后自动展示一次，同路径重渲染不重复。
- **业务事件反馈**：保存宠物档案、选择城市、加入景点、选择大交通方式、切换行程、创建行程单、导出成功/失败等统一经 `say()` 反馈。
- **边界**：`/login` 不渲染入口；`/admin/*` 不展示伙伴气泡，但保留既有 Chatbot 入口，避免移除管理端既有 Agent 能力。既有页面内联提示（途内携宠小字、政策对比提醒）保留，与伙伴气泡互补。

## Capabilities

### New Capabilities

- `companion-hints`: 伙伴入口与气泡、统一 `say()` 接口、逐页情境提示矩阵、5 秒自动关闭与窄窗适配、挂载边界。

### Modified Capabilities

- 无。既有 `trip-planning-agent` 已要求「点击右下角圆形入口打开面板」，`web-app-shell` 已覆盖登录后外壳；本变更不改变其契约，入口与气泡边界由新增 `companion-hints` 自包含。

## Impact

- 前端：`apps/web/src/components/agent/agent-panel.tsx`（入口与气泡）、新增 `lib/companion/`、`routes/_authenticated.tsx`（挂载与边界）、`routes/_authenticated/{index,paws,cities,transport-rules,trips,itinerary}.tsx`、`routes/_authenticated/attractions/index.tsx`、`routes/_authenticated/-pet-dialogs.tsx`。
- 测试：新增伙伴 store/组件/逐页 hint 单测；扩展 `agent-panel.test.tsx`；保留既有 `agent-fab` E2E，新增 `e2e/companion-hints.spec.ts`。
- 无后端、表结构、迁移或依赖变更。
