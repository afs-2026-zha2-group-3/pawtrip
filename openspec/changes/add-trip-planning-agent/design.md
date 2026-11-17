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

在 TanStack Start 的 server route（`src/routes/api/agent.ts`，`createFileRoute('/api/agent')({ server: { handlers: { POST } } })`）中运行 TanStack AI 对话循环并返回 SSE；前端使用 `@tanstack/ai-react` 的 `useChat` 与 `fetchServerSentEvents` 处理流式对话。`createServerFn` 也能返回 `Response` 并支持 streaming，但 SSE 端点选择 server route 更直接，也与 TanStack AI 的 `toServerSentEventsResponse` 用法一致。模型提供方为智谱开放平台，经其 OpenAI 兼容接口接入：

- `baseURL`：`https://open.bigmodel.cn/api/paas/v4`
- 认证：服务端环境变量 `BIGMODEL_API_KEY`，以 `Authorization: Bearer` 发送；密钥不得进入浏览器或客户端 bundle。
- 适配器：`openaiCompatible`（`@tanstack/ai-openai/compatible`），声明可用模型；默认模型 `glm-5.3`，可通过服务端环境变量覆盖。
- 流式：服务端 `toServerSentEventsResponse`，客户端 `fetchServerSentEvents`。

智谱的 `tool_choice` 仅支持 `auto`，因此方案输出使用专用工具调用（`propose_trip_plan`）承载结构化计划，再由前端 schema 重新校验，不依赖 provider 特有的结构化输出参数。采用该方式与现有 TypeScript/TanStack 栈一致；AgentScope 会额外引入 Python Agent 服务，对本次单个行程 Agent 并非必要。

工具定义采用明确 allowlist。对 Pawtrip 行程/宠物/地点的读取和行程应用操作由浏览器端工具执行，以复用同源请求、现有 Spring Session/CSRF 行为及前端状态。服务端负责对话和模型调用，不注册直接修改 Spring trip API 的服务端工具。

### Start 服务端与 Spring 会话衔接

Start server route 运行在 Node 运行时，不能依赖浏览器的 Vite dev proxy。实现约定：

- 服务端通过 `PAWTRIP_API_BASE_URL` 访问 Spring（本地默认 `http://localhost:8080`；E2E 后端为 `http://127.0.0.1:18080`；生产为同源反向代理后的内部地址）。
- 每次模型调用前，Agent route handler 读取入站请求的 `Cookie` 并原样转发给 `GET /api/auth/me`；仅当返回 200 时继续，`401` 直接返回未认证且不读取用户数据。
- 浏览器端工具仍通过同源 `/api` 访问后端，携带 `JSESSIONID` 与 `XSRF-TOKEN`；服务端不持久化用户 Cookie。
- 生产部署要求 Web 与 API 同源（或显式配置 Cookie 域）。会话超时为 30 分钟；对话中途失效时终止流并提示重新登录。
- `BIGMODEL_API_KEY` 与 `PAWTRIP_API_BASE_URL` 由部署环境注入；本地开发使用 shell 环境变量或显式加载的 server-only env，不假设 `apps/web/.env` 会自动进入 `process.env`。`.env.example` 增加对应占位符。

### 规划工作区与激活行程状态分离

规划工作区维护目标类型、目标 trip 快照和待审核方案，不把未激活 trip 写入 `tripStore.active`；除用户确认创建新行程外，不因 Agent 操作改变 `activeTripId`。

- 新行程：分两阶段。第一阶段通过现有 `startDraft`/`updateDraft` 协助用户完成城市、天数与宠物草稿；草稿仍只存在于内存，用户确认后经现有确认流程创建空计划行程并激活。现有确认逻辑内嵌在 TripPanel，实施时抽出共享的创建动作（名称生成、宠物校验、激活与查询刷新），供手动流程与 Agent 共用；Agent 启动草稿前必须缓存城市名称，避免名称退化为 adcode。第二阶段在激活行程上继续搜索与编排地点：方案留在规划工作区预览，用户确认后通过批量动作整体替换 `plan` 并 bump revision，触发现有防抖保存。存在激活行程时，创建前须完成或取消待发送保存、确认取消激活，并处理未确认草稿；创建失败时提示可恢复原行程激活。
- 激活行程：应用前重新读取目标行程详情；确认后通过一个前端批量应用动作整体替换 `plan`，保持 `name`、`totalDays`、`transportMode` 不变，并增加保存 revision 以触发现有防抖自动保存。现有 `setPlan` 不增加 revision，不应直接作为 Agent 批量提交的唯一动作。
- 未激活已有行程：应用前重新读取目标行程详情，以详情中的 `name`、`totalDays`、`transportMode` 与审核后的 `plan` 调用现有 `updateTrip`，并刷新对应查询数据；不激活该行程。目标返回 `404` 时终止并告知用户；`updatedAt` 与预览时不同时要求重新审核。

不采用模型直接生成任意 API 请求，也不要求 Agent 逐条模拟鼠标点击。浏览器侧的类型化业务动作比 DOM 自动化更可靠，并能保留可见预览和用户确认。

### Agent UI 与对话生命周期

Agent 聊天状态与待审核方案挂载在登录后的全局布局（与 TripPanel 同级），不随页面路由切换销毁；刷新页面后对话与待审核方案丢失，与本变更“不做跨会话持久化”的非目标一致。切换规划目标时，旧目标的全部待审核方案 MUST 失效并要求重新生成。

### 复用共享已保存地点列表作为 Agent 地点目录

Agent 的地点查找只针对 Pawtrip 已保存地点，不调用 AMap 候选搜索，也不使用 `/api/admin/**`。使用现有登录后可读接口：

- `GET /api/locations`：以规划目标行程的城市作为 `regionCode`，不传 `typeGroup`，使用 `petFriendlyOnly=false` 与 `pageSize=100` 获取全部类型；抓取结果按城市缓存在会话内（React Query），避免每条消息重复抓取。页数上限设为 20 页；达到上限时停止并告知用户结果可能不完整，允许按 `typeGroup` 缩小范围。当前珠海已保存地点约 871 条，9 页可覆盖。
- `GET /api/locations/{poiId}`：读取候选详情与宠物政策。
- `GET /api/locations/types`：仅用于展示类型标签，不参与抓取循环。

规划目标城市始终可知：新行程必须选定城市，已有行程城市不可变。模型只能引用查询结果中的真实 `poiId`；跨城市、无匹配或未收录的地点按现有场景拒绝或引导。

### 结构化方案由专用工具调用承载

工具 `propose_trip_plan` 的输入：

- `target`：`{ kind: "new" | "existing", tripId?: number }`
- `newTrip`（仅 `new`）：`{ cityAdcode, totalDays, petId }`
- `plan`：既有 `TripPlan` v1；`days[].stops[]` 的 `toNext` 可为 `walk`、`drive`、`transit` 或省略
- `summary`：面向用户的变更摘要
- `warnings`：可选字符串数组

约束：`poiId` 必须来自本轮地点工具结果；每轮对话维护“允许 `poiId` 集合”，`propose_trip_plan` 出现集合外的 ID 时整份方案拒绝。`day` 在 `1..totalDays`；`unscheduled` 去重；同一天允许重复 `poiId`；新行程 `totalDays` 为 1–7；已有行程不得修改 `totalDays`、城市或宠物。切换目标或重新查询后旧提案失效。前端在应用前用同一 schema 校验。

### 领域约束由 Pawtrip 代码验证

计划沿用既有 `TripPlan` v1 和 trip 服务校验。trip 只有一个城市和一个绑定宠物；新行程天数沿用前端草稿的 1–7 天限制；已有行程的 `totalDays`、城市与绑定宠物不由 Agent 修改。宠物规则以现有确定性匹配函数计算，Agent 可解释结果但不能自行决定友好性。跨城市地点不能加入当前单城市行程。

### 会话认证和工具输入按不可信边界处理

Agent 服务端入口必须验证现有登录会话，身份只能来自可信认证结果，不能接受客户端自报 user ID。列表和详情读取仍走当前用户可访问的接口；用户文本及地点内容均作为不可信数据传入模型。工具输入使用严格 schema，并在浏览器执行前重新校验目标、城市、天数与地点 ID；不提供通用 fetch、地图搜索或任意 trip ID 写入工具。模型提供方密钥只存在于服务端环境变量。

工具 allowlist 不包含删除行程、删除宠物、创建或修改地点，也不允许修改已有行程的城市、宠物与天数。发送给模型的字段限于规划所需；不发送照片或账号凭据，并在项目文档中说明第三方模型服务会处理用户文本、宠物与行程数据。

### 验证策略

- 单元与组件测试 mock 模型适配器，不访问网络。
- E2E 通过 `PAWTRIP_AGENT_PROVIDER=fake` 注入确定性流式响应；本版本只使用珠海（`440400`/`440402`）固定数据，不引入其他城市夹具。
- 真实 BigModel 调用只用于手动联调，不进入 CI。

## Risks / Trade-offs

- **共享地点列表无名称检索且数据量较大**（珠海当前约 871 条）→ 按城市缓存目录、页数上限 20 页；超限时告知用户结果可能不完整并允许按类型缩小范围。
- **保存 400 会以服务端数据覆盖本地** → 应用失败时保留预览并明确提示方案未生效，不得静默丢失 Agent 方案。
- **激活行程在另一标签页被修改** → 应用前比较 `updatedAt`，变化时要求重新审核，避免覆盖外部写入。
- **智谱 OpenAI 兼容接口存在差异**（`tool_choice` 仅 `auto`、`temperature` 区间、模型可用性）→ 结构化方案经工具调用与前端校验；实施时依据官方文档验证流式与工具调用行为。
- **存在激活行程时创建新行程需要取消激活** → 采用显式确认，并在取消前完成待发送保存、失败时提示恢复原行程激活，避免用户丢失当前编辑上下文。
- **Agent 与用户共用全局草稿** → 草稿是单一全局状态；Agent 编辑时面板可见，保存前重新确认城市、天数与宠物，避免覆盖用户正在进行的草稿。
- **Start 与 Spring 的会话边界** → 服务端显式转发 Cookie 并校验 `GET /api/auth/me`；生产要求同源部署，禁止信任请求体里的用户 ID。
- **模型可能误匹配同名地点或违反排程偏好** → 展示真实候选与计划差异；含糊候选要求用户选择，应用前由 Pawtrip 代码校验。
- **完整行程更新沿用现有整量保存语义** → 应用前重新读取详情并保留 `name`/`totalDays`/`transportMode`，预览展示完整计划；本次不改变后端 trip CRUD 或引入乐观锁。
- **宠物档案数据会进入模型上下文** → 只传当前规划所需字段与确定性政策结论，不传照片或无关档案信息。

## Migration Plan

本变更不需要数据库迁移，也不改变现有 trip API 契约。部署前配置 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`（可选模型覆盖变量）并验证登录保护；`.env.example` 增加这些占位符。E2E 运行时注入 `PAWTRIP_API_BASE_URL=http://127.0.0.1:18080` 与 `PAWTRIP_AGENT_PROVIDER=fake`。若需要回滚，可隐藏 Agent 入口并关闭 Agent server route，现有行程浏览、创建和保存流程保持可用。
