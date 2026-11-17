# Proposal

## Why

Pawtrip 目前的行程规划依赖用户手动选择城市、宠物和地点；地点浏览也受激活行程上下文限制。增加行程规划 Agent 后，用户可以用自然语言描述城市、天数、宠物和想去的地点，并在 Pawtrip UI 中审核、应用计划，而无需先激活某个行程。

## What Changes

- 在登录后的应用中提供可独立于当前激活行程使用的行程规划 Agent。
- Agent 支持从零规划新行程，并以当前激活行程作为修改目标；切换激活行程只在 Trips 页面进行，面板内不提供目标切换。
- 存在激活行程时，从零创建新行程须先经用户明确确认取消当前激活行程，再沿用现有创建确认流程；同一时间仍不超过一个激活行程。
- Agent 仅使用 Pawtrip 已收录地点；不得自行搜索地图、调用地图搜索或编造地点 ID。用户指定的地点无法在 Pawtrip 地点中匹配时，需说明未收录或请用户消歧。
- Agent 通过现有普通用户只读地点接口 `GET /api/locations` 按当前激活行程城市查询已收录地点，覆盖全部地点类型；不新增后端地点接口。
- 新行程分两阶段：Agent 先通过现有创建行程确认弹窗协助用户确认城市、起止日期与宠物（天数由日期区间含首尾计算，须为 1–7），用户在弹窗中确认后创建并激活空计划行程；随后 Agent 继续搜索与编排地点，计划变更先在 UI 中预览，用户明确确认后才写入行程。
- Agent 的行程修改先读取当前激活行程的最新计划与版本，再使用增量操作（添加/移除/按位置插入地点、调整未排期）生成方案，不整份替换现有计划，避免丢失用户已有行程；排序与跨天移动通过移除后重新插入表达。
- 行程仍遵循现有模型边界：单城市、单宠物及既有 `TripPlan` 结构；新行程天数沿用前端创建弹窗的日期区间（含首尾）1–7 天限制，已有行程的 `totalDays` 不由 Agent 修改。
- Agent 的文本回复使用 TanStack Markdown 渲染（标题、列表、粗体、代码、链接）；用户消息保持纯文本。用户消息以靠右气泡显示；Agent 消息不使用气泡或背景，直接渲染在面板中并渐显；消息不显示头像、图标或身份标签。

## Capabilities

### New Capabilities

- `trip-planning-agent`: 定义 Agent 的可用性、以激活行程为规划目标、基于 Pawtrip 已收录地点生成计划、增量修改、用户确认与前端应用行为。

### Modified Capabilities

- None. Agent 直接使用现有激活行程上下文；本变更不改变普通地点浏览页必须以激活行程为上下文的既有行为，也不修改现有 trip CRUD 契约。

## Impact

- 前端：`apps/web/src/routes/_authenticated.tsx`、全局应用外壳、`apps/web/src/lib/trip/` 与 `apps/web/src/queries/`；Agent 以右下角圆形入口按钮 + 可展开面板呈现，对话、预览与确认等全部操作在面板内完成；Agent 直接以 `tripStore.active` 为规划目标。
- TanStack Start / TanStack AI：新增服务端对话编排及浏览器端工具；当前 `apps/web` 尚未集成 TanStack AI，本次使用 `@tanstack/ai`、`@tanstack/ai-react`、`@tanstack/ai-openai/compatible` 与 `@tanstack/markdown`（React 渲染入口与流式扩展）。Agent 使用同源 `/agent` SSE 端点，不使用 `/api` 前缀，避免现有 Vite `/api` 代理与生产反向代理把请求转发给 Spring；服务端只向模型暴露固定 allowlist 工具。前端渲染复用 shadcn AI Elements（base 变体，拷贝代码）与 Sheet；Agent 文本以 TanStack Markdown 渲染，用户消息保持纯文本。自研仅限方案卡片与 parts 映射层。
- 行程保存：激活行程复用现有 UI 状态与自动保存路径；新行程遵循现有创建流程；应用成功后从面板移除待审核方案。
- 地点查询：复用登录后可读的共享接口 `GET /api/locations`（普通用户必填 `regionCode`）与 `GET /api/locations/{poiId}`；按当前激活行程城市与全部 `typeGroup` 分页查询，不新增地点接口。
- 外部模型服务：使用智谱开放平台（BigModel）的 OpenAI 兼容接口 `https://open.bigmodel.cn/api/paas/v4`，服务端 Bearer 密钥；默认模型 `glm-5.3`，具体可用模型与限流以官方文档为准。
- 验证：本版本 E2E 仅使用珠海固定数据，查询城市为 `440400`；`440402` 仅作为地点 `region_code`，不引入其他城市夹具；E2E runner 注入 `PAWTRIP_API_BASE_URL` 与 `PAWTRIP_AGENT_PROVIDER=fake`；模型调用通过可注入的 fake provider 完成，CI 不访问智谱。
