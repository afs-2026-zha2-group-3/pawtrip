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

在 TanStack Start 的 server route（`src/routes/agent.ts`，`createFileRoute('/agent')({ server: { handlers: { POST } } })`）中运行 TanStack AI 对话循环并返回 SSE；前端使用 `@tanstack/ai-react` 的 `useChat` 与 `fetchServerSentEvents('/agent')` 处理流式对话。端点不使用 `/api` 前缀：当前 Vite dev server 将 `/api` 全部代理到 Spring，而 TanStack Start 的 SSR 中间件在 Vite 代理之后安装，`/api/agent` 在本地与 E2E 中会被 Spring 截获。生产反向代理同样必须把 `/agent` 路由到 Web Node 进程，其余 `/api` 路由到 Spring。`createServerFn` 也能返回 `Response` 并支持 streaming，但 SSE 端点选择 server route 更直接，也与 TanStack AI 的 `toServerSentEventsResponse` 用法一致。模型提供方为智谱开放平台，经其 OpenAI 兼容接口接入：

- `baseURL`：`https://open.bigmodel.cn/api/paas/v4`
- 认证：服务端环境变量 `BIGMODEL_API_KEY`，以 `Authorization: Bearer` 发送；密钥不得进入浏览器或客户端 bundle。
- 适配器：`openaiCompatible`（`@tanstack/ai-openai/compatible`），声明可用模型；默认模型 `glm-5.3`，可通过服务端环境变量覆盖。
- 流式：服务端 `toServerSentEventsResponse`，客户端 `fetchServerSentEvents`。

智谱的 `tool_choice` 仅支持 `auto`，因此方案输出使用专用工具调用（`propose_trip_plan`）承载结构化计划，再由前端 schema 重新校验，不依赖 provider 特有的结构化输出参数。采用该方式与现有 TypeScript/TanStack 栈一致；AgentScope 会额外引入 Python Agent 服务，对本次单个行程 Agent 并非必要。

工具定义采用明确 allowlist。对 Pawtrip 行程/宠物/地点的读取和行程应用操作由浏览器端工具执行，以复用同源请求、现有 Spring Session/CSRF 行为及前端状态。服务端负责对话和模型调用，不注册直接修改 Spring trip API 的服务端工具。

服务端必须显式把工具 schema 传给模型：`chatParamsFromRequest` 返回客户端声明的工具，服务端使用 `mergeAgentTools`（或等价逻辑）按 allowlist 过滤后传入 `chat({ tools })`；客户端通过 `useChat({ tools })` 注册实际执行函数。服务端只传无 `execute` 的 schema 定义或过滤后的客户端声明，不把带浏览器执行逻辑的 `.client()` 工具直接交给服务端执行；客户端额外声明的 allowlist 之外的工具必须被忽略。

### Start 服务端与 Spring 会话衔接

Start server route 运行在 Node 运行时，不能依赖浏览器的 Vite dev proxy。实现约定：

- 服务端通过 `PAWTRIP_API_BASE_URL` 访问 Spring（本地默认 `http://localhost:8080`；E2E 后端为 `http://127.0.0.1:18080`；生产为同源反向代理后的内部地址）。
- 每次模型调用前，Agent route handler 读取入站请求的 `Cookie` 并原样转发给 `GET /api/auth/me`；仅当返回 200 时继续，`401` 直接返回未认证且不读取用户数据。
- 浏览器端工具仍通过同源 `/api` 访问后端，携带 `JSESSIONID` 与 `XSRF-TOKEN`；服务端不持久化用户 Cookie。
- 生产部署要求 Web 与 API 同源（或显式配置 Cookie 域）。会话超时为 30 分钟；对话中途失效时终止流并提示重新登录。
- `BIGMODEL_API_KEY` 与 `PAWTRIP_API_BASE_URL` 由部署环境注入；本地开发使用 shell 环境变量或显式加载的 server-only env，不假设 `apps/web/.env` 会自动进入 `process.env`。`.env.example` 增加对应占位符。

### 规划工作区与激活行程状态分离

规划工作区维护目标类型、目标 trip 快照和待审核方案，不把未激活 trip 写入 `tripStore.active`；除用户确认创建新行程外，不因 Agent 操作改变 `activeTripId`。

- 新行程：分两阶段。第一阶段通过现有创建行程确认弹窗（`-city-trip-dialog.tsx`）协助用户完成城市、起止日期与宠物配置：天数由 `daysBetween` 含首尾计算且 MUST 为 1–7；用户在弹窗中确认后创建空计划行程并激活。实施时从弹窗抽出共享的创建动作（名称生成、宠物校验、`cacheCity`、激活与查询刷新）供手动流程与 Agent 共用；Agent 通过客户端工具打开同一弹窗并预填配置，提交仍由用户点击「确定」完成，不新增创建入口。第二阶段在激活行程上继续搜索与编排地点：方案留在规划工作区预览，用户确认后通过批量动作整体替换 `plan` 并 bump revision，触发现有防抖保存。存在激活行程时，`/cities` 的选定入口不可用，创建前必须完成待发送保存；保存失败不得取消激活或创建新行程。保存成功后确认取消激活再创建，创建失败时提示可恢复原行程激活。
- 激活行程：应用前先完成待发送的本地自动保存，保存失败则中止应用；重新读取目标行程详情并比较 `updatedAt`。确认后通过一个前端批量应用动作整体替换 `plan`，保持 `name`、`totalDays`、`transportMode` 不变，并增加保存 revision 以触发现有防抖自动保存。现有 `setPlan` 不增加 revision，不应直接作为 Agent 批量提交的唯一动作。保存返回 400 时保留待审核方案并明确提示方案未生效，不把服务端回滚误报为应用成功。
- 未激活已有行程：应用前重新读取目标行程详情，以详情中的 `name`、`totalDays`、`transportMode` 与审核后的 `plan` 调用现有 `updateTrip`，并刷新对应查询数据；不激活该行程。目标返回 `404` 时终止并告知用户；`updatedAt` 与预览时不同时要求重新审核。

不采用模型直接生成任意 API 请求，也不要求 Agent 逐条模拟鼠标点击。浏览器侧的类型化业务动作比 DOM 自动化更可靠，并能保留可见预览和用户确认。

### Agent UI 与对话生命周期

Agent 以“全局浮动入口 + 可展开面板”呈现，挂在登录后的全局布局（`AuthenticatedShell` 内，与 TripPanel 同级），不随页面路由切换销毁。实现原则：AI 渲染与对话能力尽量复用现成组件——shadcn AI Elements 模式负责渲染、TanStack AI 负责对话状态与流式、shadcn Sheet 负责容器（详见 `docs/knowledge/external/ai-elements.md`）；自研仅限 Pawtrip 业务特有部分（parts 映射层、方案卡片/差异预览、业务确认流程），不重造消息布局、滚动跟随、流式渲染或工具卡片：

- 入口：右下角固定圆形按钮（`data-testid="agent-fab"`，带 aria-label），所有登录后页面可见，不依赖激活行程；TripPanel 位于左下角，两者不重叠。未登录时不渲染。
- 面板容器：shadcn/ui Sheet（base 变体，`npx shadcn@latest add sheet` 拷入项目），不复用 TripPanel（其内部耦合 dnd-kit 排序逻辑）。以受控 `open` 驱动（开关状态仅存内存，刷新后回到收起态），`SheetContent side="right"`；按非模态使用（Base UI Dialog `modal=false`、移除 Backdrop）：页面保持可见可交互，不因点击页面关闭，仅通过入口按钮或面板内关闭按钮收起，ESC 可关闭。展开态样式在默认 Sheet 上定制，镜像 TripPanel 悬浮态（`border bg-card shadow-xl rounded-xl`）：小屏 `fixed inset-0` 全屏滚动，`lg: inset-y-4 right-4 left-auto w-[400px]`。z-index 高于 TripPanel（含其小屏全屏展开态）。
- 对话区：直接采用 AI Elements 的 Chat 组合（`npx shadcn@latest add message-scroller message bubble input-group`）：Message Scroller 负责滚动锚点与自动跟随流式回复（`scrollAnchor` 放在用户消息），Bubble 渲染正文，Prompt Input 承担输入框与发送；不自研滚动跟随或消息布局。
- parts 映射：TanStack AI `useChat` 的 `UIMessage` parts 渲染到对应 AI Elements 模式——`text` → Bubble，`thinking` → Reasoning，`tool-call`/`tool-result` → Tool 卡片（地点查找、地点详情、方案提案等 Pawtrip 工具调用对用户可见），加载态用 Spinner；自研仅限此映射层与 Reasoning/Tool 模式的按需拷贝。
- 方案卡片（唯一的较大自研件）：`propose_trip_plan` 的结构化方案渲染为基于 Card/Button 的自研方案卡片，含与目标行程现有计划的差异预览及确认/拒绝按钮；结构化差异不走通用 markdown 渲染。
- 功能收口在面板内：对话、目标选择、方案预览与确认/拒绝（含创建新行程确认弹窗预填、取消当前激活行程确认）全部在面板内完成，不跳转页面。
- 刷新页面后对话与待审核方案丢失，与本变更“不做跨会话持久化”的非目标一致。切换规划目标时，旧目标的全部待审核方案 MUST 失效并要求重新生成。

### 复用共享已保存地点列表作为 Agent 地点目录

Agent 的地点查找只针对 Pawtrip 已保存地点，不调用 AMap 候选搜索，也不使用 `/api/admin/**`。使用现有登录后可读接口：

- `GET /api/locations`：以规划目标行程的城市级 adcode 作为 `regionCode`（E2E 为 `440400`；`440402` 只是地点的 `region_code`，不可作为查询参数），不传 `typeGroup`，使用 `petFriendlyOnly=false` 与 `pageSize=100` 获取全部类型；抓取结果按城市缓存在会话内（React Query），避免每条消息重复抓取。页数上限设为 20 页；达到上限时停止并告知用户结果可能不完整，允许按 `typeGroup` 缩小范围。当前珠海已保存地点约 871 条，9 页可覆盖。
- `GET /api/locations/{poiId}`：读取候选详情与宠物政策。
- `GET /api/locations/types`：仅用于展示类型标签，不参与抓取循环。

规划目标城市始终可知：新行程必须选定城市，已有行程城市不可变。模型只能引用查询结果中的真实 `poiId`；跨城市、无匹配或未收录的地点按现有场景拒绝或引导。

### 结构化方案由专用工具调用承载

工具 `propose_trip_plan` 只面向已持久化的目标行程；新行程先通过创建行程确认弹窗创建并激活，创建后的编排同样以该行程为 `target`，因此工具不承载创建配置：

- `target`：`{ kind: "existing", tripId: number }`
- `plan`：既有 `TripPlan` v1；`days[].stops[]` 的 `toNext` 可为 `walk`、`drive`、`transit` 或省略
- `summary`：面向用户的变更摘要
- `warnings`：可选字符串数组

约束：`poiId` 必须来自本轮地点工具结果；每轮对话维护“允许 `poiId` 集合”，`propose_trip_plan` 出现集合外的 ID 时整份方案拒绝。`day` 在 `1..totalDays` 且同一计划内唯一；`unscheduled` 去重；同一天允许重复 `poiId`；新建行程的 1–7 天限制由前端创建弹窗的日期区间保证，提案阶段不得修改目标行程的 `totalDays`、城市或宠物。切换目标或重新查询后旧提案失效。前端在应用前用同一 schema 校验。

### 领域约束由 Pawtrip 代码验证

计划沿用既有 `TripPlan` v1 和 trip 服务校验。trip 只有一个城市和一个绑定宠物；新行程天数沿用前端创建弹窗的日期区间（含首尾）1–7 天限制；已有行程的 `totalDays`、城市与绑定宠物不由 Agent 修改。宠物规则以现有确定性匹配函数计算，Agent 可解释结果但不能自行决定友好性。跨城市地点不能加入当前单城市行程。

注意：后端 `TripService.validatePoiIds` 只校验 POI 是否存在，不校验 POI 是否属于目标城市；同城约束必须由 Agent 地点目录与前端 schema 在应用前强制，并补充跨城市地点拒绝测试。

### 会话认证和工具输入按不可信边界处理

Agent 服务端入口必须验证现有登录会话，身份只能来自可信认证结果，不能接受客户端自报 user ID。列表和详情读取仍走当前用户可访问的接口；用户文本及地点内容均作为不可信数据传入模型。工具输入使用严格 schema，并在浏览器执行前重新校验目标、城市、天数与地点 ID；不提供通用 fetch、地图搜索或任意 trip ID 写入工具。模型提供方密钥只存在于服务端环境变量。

工具 allowlist 不包含删除行程、删除宠物、创建或修改地点，也不允许修改已有行程的城市、宠物与天数。发送给模型的字段限于规划所需；不发送照片或账号凭据，并在项目文档中说明第三方模型服务会处理用户文本、宠物与行程数据。

### 验证策略

- 单元与组件测试 mock 模型适配器，不访问网络；覆盖服务端 allowlist 过滤、未认证拒绝与工具 schema 校验。
- `apps/web` 当前只有 Vitest，没有 jsdom/happy-dom/@testing-library；实施前需补充组件测试环境，或明确把 UI 行为测试放在 Playwright。
- E2E 通过 `PAWTRIP_AGENT_PROVIDER=fake` 注入确定性流式响应；E2E runner 需注入 `PAWTRIP_API_BASE_URL` 与 `PAWTRIP_AGENT_PROVIDER`，并验证 `/agent` 不被 `/api` 代理转发。本版本只使用珠海固定数据：查询城市使用 `440400`，`440402` 仅作为地点 `region_code`，不引入其他城市夹具。
- 真实 BigModel 调用只用于手动联调，不进入 CI。

## Risks / Trade-offs

- **共享地点列表无名称检索且数据量较大**（珠海当前约 871 条）→ 按城市缓存目录、页数上限 20 页；超限时告知用户结果可能不完整并允许按类型缩小范围。
- **保存 400 会以服务端数据覆盖本地** → 应用失败时保留预览并明确提示方案未生效，不得静默丢失 Agent 方案。
- **激活行程在另一标签页被修改** → 应用前比较 `updatedAt`，变化时要求重新审核，避免覆盖外部写入。
- **智谱 OpenAI 兼容接口存在差异**（`tool_choice` 仅 `auto`、`temperature` 区间、模型可用性）→ 结构化方案经工具调用与前端校验；实施时依据官方文档验证流式与工具调用行为。
- **存在激活行程时创建新行程需要取消激活** → 采用显式确认；待发送保存失败时不取消激活也不创建，创建失败时才提示可恢复原行程激活，避免用户丢失当前编辑上下文。
- **Agent 与用户共用创建行程确认弹窗** → Agent 预填弹窗时用户可见且可修改，提交前在弹窗内重新核对城市、日期与宠物；取消弹窗不产生任何写入。
- **Start 与 Spring 的会话边界** → 服务端显式转发 Cookie 并校验 `GET /api/auth/me`；生产要求同源部署，禁止信任请求体里的用户 ID。
- **模型可能误匹配同名地点或违反排程偏好** → 展示真实候选与计划差异；含糊候选要求用户选择，应用前由 Pawtrip 代码校验。
- **完整行程更新沿用现有整量保存语义** → 应用前重新读取详情并保留 `name`/`totalDays`/`transportMode`，预览展示完整计划；本次不改变后端 trip CRUD 或引入乐观锁。
- **宠物档案数据会进入模型上下文** → 只传当前规划所需字段与确定性政策结论，不传照片或无关档案信息。
- **`/api` 反向代理与 Agent SSE 路由冲突** → Agent 端点使用 `/agent`；生产反向代理必须把 `/agent` 交给 Web Node、`/api` 交给 Spring，并确认不缓冲 SSE。
- **已登录用户可反复触发模型调用** → 生产需要按用户或会话配置限流/配额；`PAWTRIP_AGENT_PROVIDER=fake` 只允许在非生产环境启用。
- **客户端可能声明额外工具** → 服务端只接受 allowlist 内的工具名，忽略其余声明；工具 schema 与执行函数分离，避免客户端扩展模型能力。

## Migration Plan

本变更不需要数据库迁移，也不改变现有 trip API 契约。部署前配置 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`（可选模型覆盖变量）并验证登录保护；`.env.example` 增加这些占位符。E2E 运行时注入 `PAWTRIP_API_BASE_URL=http://127.0.0.1:18080` 与 `PAWTRIP_AGENT_PROVIDER=fake`。反向代理需将 `/agent` 路由到 Web Node，将 `/api/*` 路由到 Spring；生产环境禁用 fake provider，并为模型调用配置限流/配额。若需要回滚，可隐藏 Agent 入口并关闭 Agent server route，现有行程浏览、创建和保存流程保持可用。
