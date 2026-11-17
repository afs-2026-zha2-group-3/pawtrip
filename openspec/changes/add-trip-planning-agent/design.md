# Design

## Context

参见 `proposal.md` 的动机与范围。当前 `apps/web` 使用 TanStack Start、React Query 和 TanStack Store，但尚未集成 TanStack AI。登录后的 `_authenticated` 布局承载全局行程面板；`tripStore.active` 是现有编辑与自动保存上下文。未激活已保存行程可通过现有查询/更新函数读取和保存，但没有独立的前端编辑工作区。

用户端地点数据通过登录后可读的共享列表接口 `GET /api/locations` 获取：普通用户必须传 `regionCode`（省/市级 adcode），可选 `typeGroup`、`petFriendlyOnly`、`page`/`pageSize`（`pageSize` 上限 100）；地点详情通过 `GET /api/locations/{poiId}`。该列表不提供名称检索，也不返回原始 POI、`business` 或照片详情。管理员地点接口不能供普通用户 Agent 使用。

## Goals / Non-Goals

**Goals:**

- 让 Agent 对话和规划服务可在有无激活行程时使用。
- 将 Agent 的规划目标与全局 `active` 状态分离，允许针对新行程、激活行程或未激活的本人行程构建待审核方案。
- Agent 仅访问 Pawtrip 已收录地点；地点读取保持普通用户权限边界。
- 所有行程变更在 UI 中明确展示并经用户确认后，复用现有创建/保存契约。

**Non-Goals:**

- 让模型直接写 trip API、数据库或地点库。
- 地图搜索、未收录地点创建、多城市/多宠物 trip、具体时间表、酒店预订或导航路线规划。
- 聊天记录跨会话持久化方案。
- 启用智谱联网搜索、知识库或其它平台工具；模型只用于对话与 Pawtrip 工具选择。

## Decisions

### 通过 TanStack AI 的 OpenAI 兼容适配器接入智谱 BigModel

在 TanStack Start 服务端函数中运行 TanStack AI 对话循环；前端使用 `@tanstack/ai-react` 的 `useChat` 处理流式对话。模型提供方为智谱开放平台，经其 OpenAI 兼容接口接入：

- `baseURL`：`https://open.bigmodel.cn/api/paas/v4`
- 认证：服务端环境变量 `BIGMODEL_API_KEY`，以 `Authorization: Bearer` 发送；密钥不得进入浏览器或客户端 bundle。
- 适配器：`openaiCompatible`（`@tanstack/ai-openai/compatible`），声明可用模型；默认模型 `glm-5.3`，可通过服务端环境变量覆盖。
- 流式：服务端 `toServerSentEventsResponse`，客户端 `fetchServerSentEvents`。

智谱的 `tool_choice` 仅支持 `auto`，因此方案输出使用专用工具调用（`propose_trip_plan`）承载结构化计划，再由前端 schema 重新校验，不依赖 provider 特有的结构化输出参数。采用该方式与现有 TypeScript/TanStack 栈一致；AgentScope 会额外引入 Python Agent 服务，对本次单个行程 Agent 并非必要。

工具定义采用明确 allowlist。对 Pawtrip 行程/宠物/地点的读取和行程应用操作由浏览器端工具执行，以复用同源请求、现有 Spring Session/CSRF 行为及前端状态。服务端负责对话和模型调用，不注册直接修改 Spring trip API 的服务端工具。

### 规划工作区与激活行程状态分离

规划工作区维护目标类型、目标 trip 快照和待审核方案，不把未激活 trip 写入 `tripStore.active`，也不因 Agent 操作改变 `activeTripId`。

- 新行程：没有激活行程时，用户确认后复用现有创建流程；存在激活行程时，先要求用户明确确认取消当前激活行程，取消成功后再创建；创建失败时提示用户可重新激活原行程。创建后按现有行为成为激活行程。
- 激活行程：确认后通过一个前端批量应用动作更新计划，并增加保存 revision 以触发现有防抖自动保存。现有 `setPlan` 不增加 revision，不应直接作为 Agent 批量提交的唯一动作。
- 未激活已有行程：确认后从前端调用现有 `updateTrip` 语义，并刷新对应查询数据；不激活该行程。

不采用模型直接生成任意 API 请求，也不要求 Agent 逐条模拟鼠标点击。浏览器侧的类型化业务动作比 DOM 自动化更可靠，并能保留可见预览和用户确认。

### 复用共享已保存地点列表作为 Agent 地点目录

Agent 的地点查找只针对 Pawtrip 已保存地点，不调用 AMap 候选搜索，也不使用 `/api/admin/**`。使用现有登录后可读接口：

- `GET /api/locations/types`：获取全部地点类型分组。
- `GET /api/locations`：以规划目标行程的城市作为 `regionCode`，遍历全部 `typeGroup`，使用 `petFriendlyOnly=false` 与 `pageSize=100` 分页抓取；接口没有名称检索参数，浏览器工具在本地按名称/地址匹配并处理同名歧义。
- `GET /api/locations/{poiId}`：读取候选详情与宠物政策。

规划目标城市始终可知：新行程必须选定城市，已有行程城市不可变。模型只能引用查询结果中的真实 `poiId`；跨城市、无匹配或未收录的地点按现有场景拒绝或引导。

### 领域约束由 Pawtrip 代码验证

计划沿用既有 `TripPlan` v1 和 trip 服务校验。trip 只有一个城市和一个绑定宠物；新行程天数沿用前端草稿的 1–7 天限制；已有行程的 `totalDays`、城市与绑定宠物不由 Agent 修改。宠物规则以现有确定性匹配函数计算，Agent 可解释结果但不能自行决定友好性。跨城市地点不能加入当前单城市行程。

### 会话认证和工具输入按不可信边界处理

Agent 服务端入口必须验证现有登录会话，身份只能来自可信认证结果，不能接受客户端自报 user ID。列表和详情读取仍走当前用户可访问的接口；用户文本及地点内容均作为不可信数据传入模型。工具输入使用严格 schema，并在浏览器执行前重新校验目标、城市、天数与地点 ID；不提供通用 fetch、地图搜索或任意 trip ID 写入工具。模型提供方密钥只存在于服务端环境变量。

## Risks / Trade-offs

- **共享地点列表无名称检索** → 浏览器工具按类型分页抓取后在本地匹配；目标城市数据量大时需限制抓取页数并在匹配不完整时告知用户。
- **智谱 OpenAI 兼容接口存在差异**（`tool_choice` 仅 `auto`、`temperature` 区间、模型可用性）→ 结构化方案经工具调用与前端校验；实施时依据官方文档验证流式与工具调用行为。
- **存在激活行程时创建新行程需要取消激活** → 采用显式确认，并在创建失败时提示恢复原行程激活，避免用户丢失当前编辑上下文。
- **Start 与 Spring 使用的会话边界可能需要显式衔接** → 在暴露模型调用前验证服务端身份；同源浏览器工具继续通过现有 API 认证，禁止信任请求体里的用户 ID。
- **模型可能误匹配同名地点或违反排程偏好** → 展示真实候选与计划差异；含糊候选要求用户选择，应用前由 Pawtrip 代码校验。
- **完整行程更新沿用现有整量保存语义** → 预览基于已读取的目标行程；本次不改变后端 trip CRUD 或引入乐观锁。
- **宠物档案数据会进入模型上下文** → 只传当前规划所需字段与确定性政策结论，不传照片或无关档案信息。

## Migration Plan

本变更不需要数据库迁移，也不改变现有 trip API 契约。部署前配置 `BIGMODEL_API_KEY`（可选模型覆盖变量）并验证登录保护；若需要回滚，可隐藏 Agent 入口并关闭 Agent 服务端函数，现有行程浏览、创建和保存流程保持可用。
