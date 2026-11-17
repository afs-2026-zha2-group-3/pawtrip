---
id: kb.external.tanstack-ai
title: TanStack AI 集成要点（Start + React）
area: external
---

# TanStack AI

当前 `apps/web` 尚未集成 TanStack AI。计划用它在 TanStack Start 服务端编排对话、在 React 客户端渲染流式消息。以下内容截至 2026-11，来自官方文档；升级版本前需复核。

## 包结构

| 包 | 用途 |
|----|------|
| `@tanstack/ai` | 核心：`chat()`、工具定义、SSE 响应 |
| `@tanstack/ai-react` | `useChat`、`fetchServerSentEvents` |
| `@tanstack/ai-openai` | OpenAI 适配器；`/compatible` 子路径提供通用 OpenAI 兼容适配器 |

## OpenAI 兼容端点

会 `POST /chat/completions` 但没有专属适配器的服务，使用 `openaiCompatible`：

```ts
import { openaiCompatible } from "@tanstack/ai-openai/compatible";

const bigmodel = openaiCompatible({
  name: "bigmodel",
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.BIGMODEL_API_KEY!,
  models: ["glm-5.3"],
});
```

- `models` 支持字符串（乐观默认：文本/图片输入、流式、函数调用、结构化输出）或用 `createModel` 精确声明能力。
- 模型 id 会形成类型安全的联合；未声明的模型是类型错误。
- 单模型场景可直接使用 `openaiCompatibleText(model, { baseURL, apiKey })`。
- 适配器不会自行读取环境变量，`apiKey` 必须显式传入。

## 服务端流式（TanStack Start）

Start 中使用 server route 承载 SSE。`createServerFn` 也能返回 `Response` 并支持 streaming，但 SSE 端点用 server route 更直接：

```ts
// src/routes/agent.ts
import { createFileRoute } from "@tanstack/react-router";
import {
  chat,
  chatParamsFromRequest,
  mergeAgentTools,
  toServerSentEventsResponse,
} from "@tanstack/ai";

export const Route = createFileRoute("/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId, runId, tools } = await chatParamsFromRequest(request);
        const stream = chat({
          adapter: bigmodel("glm-5.3"),
          messages,
          threadId,
          runId,
          // AGENT_TOOL_DEFINITIONS 是 allowlist 内的无 execute 工具定义
          tools: mergeAgentTools(AGENT_TOOL_DEFINITIONS, tools),
        });
        return toServerSentEventsResponse(stream);
      },
    },
  },
});
```

客户端：

```ts
const { messages, sendMessage } = useChat({
  connection: fetchServerSentEvents("/agent"),
  threadId: "trip-planning",
});
```

本仓库的 Vite dev server 将 `/api` 全部代理到 Spring，而 TanStack Start 的 SSR 中间件在 Vite 代理之后安装；因此本项目 Agent 端点使用 `/agent`，不要放在 `/api/agent`。生产反向代理也要把 `/agent` 路由到 Web Node，其余 `/api` 路由到 Spring。

## 工具

- 使用 `toolDefinition({ name, description, inputSchema, outputSchema })` 定义。
- `.server(fn)` 在服务端执行，`.client(fn)` 在浏览器执行；Pawtrip 的读取与写入工具应使用 `.client()`，复用同源会话与前端状态。
- 工具输入必须用 Zod 等运行时 schema 校验；模型输入始终视为不可信。
- 浏览器工具通过 `useChat({ tools })` 注册；服务端必须把工具 schema 传给 `chat({ tools })`，否则模型看不到任何工具。
- `chatParamsFromRequest(request)` 会返回客户端声明的 `tools`；使用 `mergeAgentTools(serverTools, clientTools)`（或等价过滤逻辑）按 allowlist 合并后再传给 `chat()`。服务端只接受 allowlist 内的工具名，忽略客户端额外声明的工具。
- 不要把带浏览器执行逻辑的 `.client()` 工具直接交给服务端执行；服务端应传无 `execute` 的 schema 定义或过滤后的客户端声明。

## 注意事项

- 兼容适配器对模型能力采取乐观声明；上游拒绝工具调用或结构化输出时，需要在集成测试中暴露并降级。
- 生产环境需要 Node/Edge 运行时承载 Start server route；浏览器端不保存模型密钥。
- TanStack AI 版本仍快速演进，升级前需回归流式、工具与错误事件。

## 官方文档

- 概览：https://tanstack.com/ai/latest/docs
- OpenAI 兼容适配器：https://tanstack.com/ai/latest/docs/adapters/openai-compatible
- 工具：https://tanstack.com/ai/latest/docs/tools/tools

## 本项目实现（2026-11 复核）

- 依赖：`@tanstack/ai` 1.4.x、`@tanstack/ai-react` 1.0.x、`@tanstack/ai-openai` 1.1.x。
- `apps/web/src/routes/agent.ts` 使用 `createFileRoute("/agent")({ server: { handlers: { POST } } })`，handler 调用 `handleAgentRequest`（`src/lib/agent/server.ts`）。
- 服务端以 `chatParamsFromRequest` 解析 AG-UI 请求；客户端声明的工具先按固定 allowlist 过滤，再交给 `mergeAgentTools(AGENT_TOOL_DEFINITIONS, filteredClientTools)` 和 `chat({ tools })`。服务端工具定义无 `execute`，实际执行由浏览器 `useChat({ tools })` 中的 `.client()` 实现完成。
- 系统提示通过 `systemPrompts` 传入；上下文 JSON 放在 `forwardedProps.agentContext`，由客户端每次 `sendMessage(text, { body: { agentContext } })` 发送。
- E2E/本地使用 `PAWTRIP_AGENT_PROVIDER=fake`：动态导入 `@tanstack/ai/testing` 的 `fakeText()`，按消息历史脚本化 text/toolCalls；生产环境禁用。
- SSE 端点固定为 `/agent`，不得改为 `/api/agent`；Vite dev 的 `/api` 代理会先于 Start 中间件截获请求。
