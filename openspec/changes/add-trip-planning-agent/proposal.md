# Proposal

## Why

Pawtrip 目前的行程规划依赖用户手动选择城市、宠物和景点；景点列表也受激活行程上下文限制。增加行程规划 Agent 后，用户可以用自然语言描述城市、天数、宠物和想去的地点，并在 Pawtrip UI 中审核、应用计划，而无需先激活某个行程。

## What Changes

- 在登录后的应用中提供可独立于当前激活行程使用的行程规划 Agent。
- Agent 支持从零规划新行程，并支持选择、编辑当前激活或已保存但未激活的行程；编辑目标不因 Agent 操作而被隐式激活。
- Agent 仅使用 Pawtrip 已收录地点；不得自行搜索地图、调用地图搜索或编造地点 ID。用户指定的地点无法在 Pawtrip 地点中匹配时，需说明未收录或请用户消歧。
- Agent 生成的计划或变更先在 UI 中预览，用户明确确认后，才通过前端行程操作与现有行程 API 创建或更新数据。新行程遵循现有创建确认流程；编辑未激活行程后仍保持未激活。
- 行程仍遵循现有模型边界：单城市、单宠物、1–7 天及既有 `TripPlan` 结构；宠物政策结论由确定性代码计算，不由模型自行裁定。
- 地点库的普通用户全量查询接口尚未确定，作为开放问题保留，不在本提案中预先指定 API 形态。

## Capabilities

### New Capabilities

- `trip-planning-agent`: 定义 Agent 的可用性、规划目标选择、基于 Pawtrip 已收录地点生成计划、用户确认与前端应用行为。

### Modified Capabilities

- None. Agent 的规划工作区与现有激活行程上下文并存；本变更不改变普通景点页面必须以激活行程为上下文的既有行为，也不修改现有 trip CRUD 契约。

## Impact

- 前端：`apps/web/src/routes/_authenticated.tsx`、全局应用外壳、`apps/web/src/lib/trip/` 与 `apps/web/src/queries/`；需区分 Agent 规划目标与 `tripStore.active`。
- TanStack Start / TanStack AI：新增服务端对话编排及浏览器端工具；当前 `apps/web` 尚未集成 TanStack AI。
- 行程保存：激活行程复用现有 UI 状态与自动保存路径；未激活行程通过用户确认后的前端流程调用现有 trip 更新接口；新行程遵循现有创建流程。
- 地点查询：现有普通用户景点列表仅按区域查询，管理员地点列表不能供普通用户 Agent 使用；全量 Pawtrip 地点查询的接口设计和归属待定。
- 外部模型服务：需要配置模型提供方凭据；具体提供方和部署配置在设计阶段确认。

## Open Questions

- **普通用户如何查询全部 Pawtrip 已收录地点？** 当前 `GET /api/locations/attractions` 需要 `regionCode` 且仅返回景点；`/api/admin/locations` 受管理员权限保护。需要在实现前决定是否新增普通用户只读查询接口、如何筛选/分页，以及该接口契约由哪个 capability 维护。本变更暂不预设具体 endpoint、参数或响应结构。
