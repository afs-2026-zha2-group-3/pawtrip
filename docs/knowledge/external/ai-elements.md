---
id: kb.external.ai-elements
title: shadcn AI Elements（base 变体）与 TanStack AI UI 集成要点
area: external
---

# shadcn AI Elements（base 变体）

行程规划 Agent 的前端面板计划使用 shadcn AI Elements。以下事实截至 2026-11，来自官方文档（ui.shadcn.com）；实施时以官方模式页面为准，不得凭记忆补 API。

## 形态与获取方式

- AI Elements 是“模式（patterns）”，不是 npm 包：官方页面代码直接拷贝进项目，代码归项目所有，可自由定制。
- 本仓库 `apps/web/components.json` 为 `style: "base-nova"`（Base UI 系），与 AI Elements 的 base 变体一致；`npx shadcn@latest add <name>` 拷入即得 base-nova 版本。

## 与 Agent 面板相关的模式

| 模式 | 用途 | 安装（`npx shadcn@latest add ...`） |
|------|------|------|
| Chat | 会话线程；用户消息为滚动锚点，回复在其下流式 | `message-scroller message bubble input-group` |
| Message / Bubble | 单轮消息与气泡 | 随 Chat 安装 |
| Prompt Input | 输入框 + 发送 | 随 Chat 安装（基于 Input Group） |
| Reasoning | 模型思考流（可折叠展示） | 按模式页命令（依赖 Trace 等基础组件） |
| Tool | 一次工具调用从 input 到 output 的卡片 | 按模式页命令（依赖 Trace） |
| Confirmation | 工具执行前的批准/拒绝提示 | 按模式页命令 |
| Plan / Task / Chain of Thought | 步骤类展示 | 按模式页命令（依赖 Trace） |
| Suggestion | 一键发送的候选提示 | 按模式页命令 |

- Chat 的关键语义：`scrollAnchor` 放在用户消息上，`autoScroll` 在用户停留在“实时边缘”时跟随流式回复。
- Reasoning、Tool、Plan 等步骤类模式都构建在 Trace 之上，形状一致；部分模式还需 Code Block。
- 每个模式页会列出它需要的其他组件；拷贝时以该页安装命令为准。

## Sheet（base 变体）

- 安装：`npx shadcn@latest add sheet`；扩展自 Dialog，API 参考 Base UI Dialog。
- `SheetContent` 支持 `side="right|left|top|bottom"` 与 `showCloseButton={false}`。
- 默认模态（有遮罩、点击外部关闭）。Agent 面板需要“TripPanel 式悬浮、页面可交互”：以受控 `open` + Base UI Dialog 的 `modal=false` 非模态使用；代码已拷入项目，允许定制（去掉 Backdrop、改为悬浮定位）。

## 与 TanStack AI 的对接

- 消息来自 `useChat()`（`@tanstack/ai-react`）的 `UIMessage`；AI Elements 只负责渲染，建议 parts 映射：
  - `text` → Bubble 正文（流式）；
  - `thinking` → Reasoning；
  - `tool-call` / `tool-result` → Tool 卡片（对用户展示 Pawtrip 工具调用）；
  - `structured-output` / 自定义方案（如 `update_trip_plan` 的增量结果）→ 自研方案卡片（Card + 差异预览 + 确认/拒绝）。
- 数据链路仍是 `fetchServerSentEvents('/agent')` + `useChat`；AI Elements 不引入新的传输层。

## @shadcn/helpers/tanstack-ai（可选，测试/开发 fixture）

- 安装：`pnpm add @shadcn/helpers`；导入 `@shadcn/helpers/tanstack-ai`。
- `createChat().user(...).assistant(({ writer }) => ...)` 生成 TanStack `UIMessage[]`；`chat.transport()` 产出本地 `ConnectConnectionAdapter`，把脚本化对话按 AG-UI 事件回放给 `useChat`（文本逐词流式、thinking、tool-call/tool-result）。
- 适用：无模型、无网络的组件测试与 UI 开发；`transport({ delayMs: 0 })` 可做确定性断言。
- 限制（官方 Adapter Differences）：只回放 text/reasoning/tool-call；`structured-output` 与自定义事件不在回放范围内。
- E2E 全链路仍用服务端 `PAWTRIP_AGENT_PROVIDER=fake`，两者互补。

## 官方文档

- AI Elements 总览：https://ui.shadcn.com/docs/ai-elements
- Chat：https://ui.shadcn.com/docs/ai-elements/base/chat
- Tool：https://ui.shadcn.com/docs/ai-elements/base/tool
- Reasoning：https://ui.shadcn.com/docs/ai-elements/base/reasoning
- Sheet（base）：https://ui.shadcn.com/docs/components/base/sheet
- TanStack AI helper：https://ui.shadcn.com/docs/helpers/tanstack-ai

## 本项目实现（2026-11 复核）

- 组件以 vendored 形式位于 `apps/web/src/components/ui/`：`sheet.tsx`、`message-scroller.tsx`、`message.tsx`、`bubble.tsx`、`input-group.tsx`；未新增 npm 依赖，保持 base-nova 风格。
- Agent 面板使用 `Sheet` 受控 `open` + `modal={false}`、仅渲染 Popup（无 Backdrop），桌面端 `lg:inset-y-4 lg:right-4 lg:w-[400px]`，小屏 `inset-0`；z-index（面板 60、入口 70、Select 80、Dialog 100）保证高于 TripPanel 与表单弹窗。
- `MessageScroller` 在用户位于底部时自动跟随流式内容；parts 映射在 `components/agent/agent-panel.tsx`，轮次过程模型在 `lib/agent/messages.ts`：用户消息为靠右浅绿气泡，`thinking` 不展示，`tool-result` 不展示且不打断标签合并，`tool-call` 与中间说明组成过程区（相邻同名工具合并为 `xN`，完成后折叠为可展开的「过程」），本轮最后一个 `tool-call` 之后的文本作为最终回复交给 `components/agent/agent-markdown.tsx` 渲染；处理期间只显示单条「正在思考」；`update_trip_plan` 使用 `components/agent/proposal-card.tsx` 展示差异与确认/拒绝。
- 未使用 `@shadcn/helpers/tanstack-ai`；组件测试通过 mock `useChat` 覆盖入口/面板/方案卡片，E2E 通过服务端 fake provider 覆盖完整流式链路。
