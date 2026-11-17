# Proposal

## Why

Pawtrip 目前的行程规划依赖用户手动选择城市、宠物和地点；地点浏览也受激活行程上下文限制。增加行程规划 Agent 后，用户可以用自然语言描述城市、天数、宠物和想去的地点，并在 Pawtrip UI 中审核、应用计划，而无需先激活某个行程。

## What Changes

- 在登录后的应用中提供可独立于当前激活行程使用的行程规划 Agent。
- Agent 支持从零规划新行程，并支持选择、编辑当前激活或已保存但未激活的行程；编辑目标不因 Agent 操作而被隐式激活。
- 存在激活行程时，从零创建新行程须先经用户明确确认取消当前激活行程，再沿用现有创建确认流程；同一时间仍不超过一个激活行程。
- Agent 仅使用 Pawtrip 已收录地点；不得自行搜索地图、调用地图搜索或编造地点 ID。用户指定的地点无法在 Pawtrip 地点中匹配时，需说明未收录或请用户消歧。
- Agent 通过现有普通用户只读地点接口 `GET /api/locations` 按规划目标城市查询已收录地点，覆盖全部地点类型；不新增后端地点接口。
- Agent 生成的计划或变更先在 UI 中预览，用户明确确认后，才通过前端行程操作与现有行程 API 创建或更新数据。新行程遵循现有创建确认流程并在创建后激活；编辑未激活行程后仍保持未激活。
- 行程仍遵循现有模型边界：单城市、单宠物及既有 `TripPlan` 结构；新行程天数沿用前端草稿的 1–7 天限制，已有行程的 `totalDays` 不由 Agent 修改。

## Capabilities

### New Capabilities

- `trip-planning-agent`: 定义 Agent 的可用性、规划目标选择、基于 Pawtrip 已收录地点生成计划、用户确认与前端应用行为。

### Modified Capabilities

- None. Agent 的规划工作区与现有激活行程上下文并存；本变更不改变普通地点浏览页必须以激活行程为上下文的既有行为，也不修改现有 trip CRUD 契约。

## Impact

- 前端：`apps/web/src/routes/_authenticated.tsx`、全局应用外壳、`apps/web/src/lib/trip/` 与 `apps/web/src/queries/`；需区分 Agent 规划目标与 `tripStore.active`。
- TanStack Start / TanStack AI：新增服务端对话编排及浏览器端工具；当前 `apps/web` 尚未集成 TanStack AI，本次使用 `@tanstack/ai`、`@tanstack/ai-react` 与 `@tanstack/ai-openai/compatible`。
- 行程保存：激活行程复用现有 UI 状态与自动保存路径；未激活行程通过用户确认后的前端流程调用现有 trip 更新接口；新行程遵循现有创建流程。
- 地点查询：复用登录后可读的共享接口 `GET /api/locations`（普通用户必填 `regionCode`）与 `GET /api/locations/{poiId}`；按规划目标城市与全部 `typeGroup` 分页查询，不新增地点接口。
- 外部模型服务：使用智谱开放平台（BigModel）的 OpenAI 兼容接口 `https://open.bigmodel.cn/api/paas/v4`，服务端 Bearer 密钥；默认模型 `glm-5.3`，具体可用模型与限流以官方文档为准。
