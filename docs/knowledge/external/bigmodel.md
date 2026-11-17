---
id: kb.external.bigmodel
title: 智谱开放平台（BigModel）OpenAI 兼容接口
area: external
---

# 智谱开放平台（BigModel）

行程规划 Agent 计划使用智谱开放平台的 OpenAI 兼容接口。以下事实截至 2026-11，来自官方文档；接入时以官方页面为准，不得凭记忆补参数。

## 端点与认证

- Base URL：`https://open.bigmodel.cn/api/paas/v4`
- 对话补全：`POST /chat/completions`（OpenAI 兼容）
- 认证：`Authorization: Bearer <API_KEY>`；Key 在控制台创建，个人、团队与编码套餐的 Key 互不通用。
- 密钥只应通过服务端环境变量注入（Pawtrip 使用 `BIGMODEL_API_KEY`），不得进入浏览器或客户端 bundle。

## OpenAI 兼容范围

- 可直接使用 OpenAI SDK，只需替换 `api_key` 与 `base_url`。
- 支持流式响应（`stream: true`）与函数调用（`tools`、`tool_choice: "auto"`）。
- `tool_choice` 当前仅支持 `auto`；不要依赖 `none` 或指定函数等取值。
- `temperature` 取值区间为 (0,1)，`temperature=0` 不适用。
- 模型可用性与限流以官方模型概览与速率限制页面为准；示例模型为 `glm-5.3`，另有 `glm-5.3-flash`、`glm-5.2` 等。

## 函数调用要点

- 工具定义使用 OpenAI 兼容结构：`{ type: "function", function: { name, description, parameters } }`。
- 模型返回 `tool_calls[]`，包含 `id`、`function.name`、`function.arguments`（JSON 字符串）。
- 应用以 `role: "tool"`、`tool_call_id` 回传结果，再发起下一轮请求。
- 不启用平台自带的联网搜索、知识库等工具；Pawtrip 的地点数据只能来自自身数据库。

## 已知限制

- OpenAI 兼容并非完全等价；升级 SDK 或切换模型前需回归流式与工具调用。
- 无 `temperature=0` 的确定性保证；结构化计划应通过专用工具调用加前端 schema 校验。
- 速率限制、并发与计费随账号套餐变化，自动化测试不得真实调用模型。

## 官方文档

- 快速开始：https://docs.bigmodel.cn/cn/api/introduction
- OpenAI 兼容：https://docs.bigmodel.cn/cn/guide/develop/openai/introduction
- 工具调用：https://docs.bigmodel.cn/cn/guide/capabilities/function-calling
- 模型概览：https://docs.bigmodel.cn/cn/guide/start/model-overview
- 速率限制：https://docs.bigmodel.cn/cn/api/rate-limit
