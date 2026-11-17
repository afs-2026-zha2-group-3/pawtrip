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
// src/routes/api/agent.ts
import { createFileRoute } from "@tanstack/react-router";
import {
  chat,
  chatParamsFromRequest,
  toServerSentEventsResponse,
} from "@tanstack/ai";

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, threadId, runId } = await chatParamsFromRequest(request);
        const stream = chat({ adapter: bigmodel("glm-5.3"), messages, threadId, runId });
        return toServerSentEventsResponse(stream);
      },
    },
  },
});
```

客户端：

```ts
const { messages, sendMessage } = useChat({
  connection: fetchServerSentEvents("/api/agent"),
  threadId: "trip-planning",
});
```

## 工具

- 使用 `toolDefinition({ name, description, inputSchema, outputSchema })` 定义。
- `.server(fn)` 在服务端执行，`.client(fn)` 在浏览器执行；Pawtrip 的读取与写入工具应使用 `.client()`，复用同源会话与前端状态。
- 工具输入必须用 Zod 等运行时 schema 校验；模型输入始终视为不可信。

## 注意事项

- 兼容适配器对模型能力采取乐观声明；上游拒绝工具调用或结构化输出时，需要在集成测试中暴露并降级。
- 生产环境需要 Node/Edge 运行时承载 Start server route；浏览器端不保存模型密钥。
- TanStack AI 版本仍快速演进，升级前需回归流式、工具与错误事件。

## 官方文档

- 概览：https://tanstack.com/ai/latest/docs
- OpenAI 兼容适配器：https://tanstack.com/ai/latest/docs/adapters/openai-compatible
- 工具：https://tanstack.com/ai/latest/docs/tools/tools
