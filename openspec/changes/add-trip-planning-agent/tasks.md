# Tasks

## 0. 测试与运行环境准备

- [x] 0.1 为 `apps/web` 补充组件测试环境：安装并配置 `jsdom`（或 `happy-dom`）与 `@testing-library/react`，或明确 UI 行为只由 Playwright 覆盖；组件测试可用 `@shadcn/helpers/tanstack-ai`（`pnpm add @shadcn/helpers`）的 `createChat`/`transport()` 生成确定性流式 fixture。确保 `cd apps/web && npm test` 能运行对应测试。验证 `cd apps/web && npm test` 通过。

## 1. 确认并复用共享地点目录接口

- [x] 1.1 确认 Agent 使用现有登录后可读接口：`GET /api/locations`（普通用户必填城市级 `regionCode`；不传 `typeGroup` 一次取全部类型；`petFriendlyOnly=false`；`pageSize` 上限 100；无名称检索）与 `GET /api/locations/{poiId}`；记录分页抓取、页数上限与本地名称匹配策略。`GET /api/locations/types` 仅用于展示类型标签。明确 `regionCode` 只用城市级 adcode（E2E 为 `440400`）；`440402` 是地点 `region_code`，不可作为查询参数。确认 `TripService.validatePoiIds` 只校验 POI 存在、不校验同城，同城约束由前端工具强制。验证 `openspec validate add-trip-planning-agent` 通过。

## 2. 建立受保护的 Agent 对话入口

- [x] 2.1 先阅读 `docs/knowledge/external/tanstack-ai.md` 与 `docs/knowledge/external/bigmodel.md`，再按官方文档集成 `@tanstack/ai`、`@tanstack/ai-react` 与 `@tanstack/ai-openai`（`/compatible` 子路径），用 `openaiCompatible` 接入智谱 `https://open.bigmodel.cn/api/paas/v4`，默认模型 `glm-5.3`；在 `src/routes/agent.ts` 提供 `/agent` SSE server route（避开 `/api` 代理），并在登录布局挂载全局聊天状态；`.env.example` 增加 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`、`PAWTRIP_AGENT_PROVIDER` 占位符。模型凭据仅从服务端 `BIGMODEL_API_KEY` 读取。服务端使用 `chatParamsFromRequest` 解析请求，并用 `mergeAgentTools` 或等价逻辑按固定 allowlist 过滤客户端工具后传给 `chat({ tools })`；客户端通过 `useChat({ tools })` 注册执行函数。验证 dev 下 `/agent` 请求到达 Start 而非 Spring，`cd apps/web && npm test` 与根目录 `npm run build` 通过。
- [x] 2.2 为 Agent server route 接入会话校验：通过 `PAWTRIP_API_BASE_URL` 访问 Spring，把入站 `Cookie` 转发给 `GET /api/auth/me`，仅 200 时继续；确认本地 env 加载方式（shell 或显式 server-only 加载），补充集成测试覆盖未认证、会话过期、正常放行与 allowlist 外的工具声明被忽略，验证未经认证的 Agent 请求被拒绝。

## 3. 实现 Pawtrip 只读工具和规划工作区

- [x] 3.1 实现浏览器端 Pawtrip 地点查找与详情读取工具：按规划目标城市缓存目录（React Query），调用 `GET /api/locations` 以 `pageSize=100` 分页抓取全部类型（上限 20 页，截断时提示并允许按 `typeGroup` 缩小），在本地按名称/地址匹配；仅允许引用真实 Pawtrip 地点 ID，并按目标城市目录校验同城，后端不负责该校验；补充匹配、歧义、未收录、无地点、分页上限与跨城市地点拒绝测试，验证 `cd apps/web && npm test` 通过。
- [x] 3.2 实现规划工作区与两阶段新行程：从 `-city-trip-dialog.tsx` 抽出共享的创建动作（名称生成、宠物校验、`cacheCity`、激活与查询刷新）供手动弹窗与 Agent 共用；Agent 通过客户端工具打开同一 `CityTripDialog` 并预填城市/起止日期/宠物，提交仍由用户在弹窗内点击「确定」完成，天数由 `daysBetween` 含首尾计算且为 1–7，Agent 不新增创建入口。创建后的待审核方案留在规划工作区，不写入 `tripStore.active`；只有用户确认应用后才通过批量动作替换计划并 bump revision。支持激活与未激活行程目标；存在激活行程时，`/cities` 的选定入口不可用，新建目标须经用户确认取消当前激活，取消前先完成待发送保存（失败则不取消）。补充目标选择、不隐式激活、保存 flush、取消激活确认及未确认方案不入库测试，验证 `cd apps/web && npm test` 通过。
- [x] 3.3 将城市、宠物、天数、单城市地点约束与 Pawtrip 确定性宠物政策结果提供给 Agent 规划流程；补充新行程 1–7 天、无宠物、已有行程天数/城市/宠物不变及政策结论测试，验证 `cd apps/web && npm test` 通过。

## 4. 实现方案审核与行程应用

- [x] 4.1 优先用现成组件搭建 Agent UI，不自研 AI 渲染：先阅读 `docs/knowledge/external/ai-elements.md`，用 `npx shadcn@latest add sheet message-scroller message bubble input-group`（按需再加 reasoning/tool 等模式）拷入 base-nova 组件。在登录后的全局布局实现右下角圆形入口（`data-testid="agent-fab"`，`fixed bottom-4 right-4`）与面板（`data-testid="agent-panel"`）：Sheet 以受控 `open` + 非模态（`modal=false`、移除 Backdrop）驱动，展开态定制为镜像 TripPanel 悬浮态（小屏 `fixed inset-0`，`lg: inset-y-4 right-4 left-auto w-[400px]`），z-index 高于 TripPanel，开关状态仅存内存；不自研滚动跟随与消息布局（Message Scroller 的 `scrollAnchor` 放用户消息、自动跟随流式）。按 parts 映射渲染：`text`→Bubble、`thinking`→Reasoning、`tool-call`/`tool-result`→Tool 卡片、加载态用 Spinner；自研仅限 `propose_trip_plan` 方案卡片（Card + 差异预览 + 确认/拒绝）与目标选择。方案由前端 schema 校验（目标 `tripId`、允许 `poiId` 集合、`day` 唯一且 1..totalDays、`toNext`、`unscheduled` 去重）；`propose_trip_plan` 只面向已持久化行程，新行程先经创建行程确认弹窗创建并激活后再以该 `tripId` 提案；切换目标后旧提案失效；对话、目标选择、预览与确认全部在面板内完成，不依赖激活行程存在。补充无激活行程、激活行程和未激活行程、入口可见性与面板开关的界面测试（组件测试可用 `@shadcn/helpers/tanstack-ai` 的 `createChat`/`transport()` 生成确定性流式 fixture），验证 `cd apps/web && npm test` 通过。
- [x] 4.2 实现用户明确确认后应用方案：新行程先经创建行程确认弹窗确认创建空计划行程并激活（存在激活行程时先完成保存并取消激活），创建后的计划变更与激活行程一致；激活行程在应用前先完成待发送的本地自动保存（失败则中止），并比较 `updatedAt`，通过增加保存 revision 的批量前端动作整体替换计划并触发自动保存；未激活行程在应用前重新读取详情，保留 `name`/`totalDays`/`transportMode`，仅整体替换 `plan` 并刷新查询；保存返回 400 时保留预览并提示方案未生效，不把服务端回滚误报为应用成功。补充确认、拒绝、未确认不入库、本地待保存改动、目标 404、目标已变更、跨标签页变更、保存失败、400 回滚与地点失效测试，验证 `cd apps/web && npm test` 通过。

## 5. 集成验证与文档

- [x] 5.1 补充端到端验收：查询城市使用珠海 `440400`，`440402` 仅作为地点 `region_code`，不引入其他城市夹具；更新 `scripts/run-e2e.mjs` 注入 `PAWTRIP_API_BASE_URL=http://127.0.0.1:18080` 与 `PAWTRIP_AGENT_PROVIDER=fake`，CI 不访问智谱；验证 E2E 下 `/agent` 不被 `/api` 代理转发。以下 Agent 流程均通过右下角入口（`agent-fab`）打开面板（`agent-panel`）并在面板内操作：覆盖创建行程确认弹窗创建（含已有激活行程时先取消激活）、创建后继续编排、未确认不入库、中途放弃留下行程、修改激活行程、修改未激活行程、未登录拒绝、无宠物、目录截断提示和 Pawtrip 地点未命中；目标城市无地点、保存 400 等边界用组件测试覆盖。验证相关 E2E 用例通过。
- [x] 5.2 更新中文架构知识文档，说明 Agent 与 trip 上下文、工具权限、地点数据边界、全局入口与面板形态（AI Elements 模式与 Sheet 安装清单）及智谱 BigModel / TanStack AI 配置；复核 `docs/knowledge/external/{bigmodel,tanstack-ai,ai-elements}.md` 的来源与日期（截至 2026-11），补充 `/agent` server route、`mergeAgentTools`/allowlist 示例、`/agent` 与 `/api` 的反向代理分工、生产禁用 fake provider 与模型调用限流/配额，并确保与实现一致（含 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`、`PAWTRIP_AGENT_PROVIDER` 与模型覆盖变量），运行根目录 `npm run build`、`cd apps/web && npm test` 和 `cd apps/server && ./mvnw test`。

## 6. 修正 Agent 规划上下文与方案应用

- [x] 6.1 移除 Agent 面板的规划目标切换：面板只展示当前激活行程名称；Agent 的城市、宠物、天数与最新 `plan` 直接来自 `tripStore.active`；激活行程变化时清空旧提案与按行程隔离的地点集合。验证 `cd apps/web && npm test` 覆盖激活行程跟随与旧提案失效。
- [x] 6.2 用 `update_trip_plan` 替换 `propose_trip_plan`：工具只接受增量操作（添加/移除地点、调整未排期），执行时读取当前激活行程的最新 `plan` 并在其上应用；上下文携带当前 `plan`，避免模型基于过期快照整份替换。补充保留既有地点、引用未查询地点、目标非激活行程与非法操作的测试。
- [x] 6.3 应用成功后从 agent store 移除待审核方案，卡片消失；失败保留并提示。组件测试覆盖成功移除与拒绝/失败保留。
- [x] 6.4 更新 E2E：激活行程后修改、应用后卡片消失、增量插入保留既有地点；同步 `docs/knowledge/architecture/README.md` 与外部文档中的工具与上下文说明。
- [x] 6.5 新增 `get_trip_plan` 读取工具：从 `tripStore.active` 读取最新计划（按天排序、附带已知地点名称）并返回 `revision`；Agent 上下文不再携带计划快照。
- [x] 6.6 `update_trip_plan` 增加 `baseRevision` 校验：与当前 `updatedAt`、`saveRevision` 和计划内容不一致时拒绝并要求重新读取，保证先读后改。
- [x] 6.7 允许 `add_stop` 引用当前计划中已有的 poiId，通过 `remove_stop` + `add_stop(position)` 支持同天排序与跨天移动；补充先读后改、过期版本拒绝与排序测试。
- [x] 6.8 将 Agent 进度展示改为面向用户的单条状态：thinking → 正在规划行程、find_locations → 正在搜集景点、get_trip_plan → 正在读取最新行程、update_trip_plan → 正在编辑行程等；已完成步骤折叠为「已完成 N 个步骤」，同一时刻最多一个活动状态。
- [x] 6.9 用户点击「拒绝」时同样关闭待审核方案卡片（清空提案），行程保持不变；同步组件测试与 E2E。

## 7. 扩展地点详情推荐信息

- [x] 7.1 扩展 `get_location_detail`：后端地点详情从 `poi_json` 解析自然语言类型（`type`）与行政区（`pname`/`cityname`/`adname`），并返回周营业时间；Agent 工具输出评分、自然语言类型、行政区、标签、商圈与营业时间，移除 `typeGroup` 等无自然语义代码和原始政策字段。补充后端详情与浏览器工具测试，验证 `cd apps/server && ./mvnw test`、`cd apps/web && npm test` 通过。
- [x] 7.2 调整系统提示词：`update_trip_plan` 生成方案后只提示用户在下方方案卡片中确认或拒绝，不在对话中复述或总结逐日安排与地点清单；同步 spec 场景。
- [x] 7.3 隐藏工具调用之间的过程消息：渲染层只展示用户消息与不含工具调用的最终回复，过程进度由单条状态提示承担。补充消息过滤与面板测试。

## 8. Markdown 渲染与消息呈现

- [ ] 8.1 引入 `@tanstack/markdown`：Agent 最终文本使用 `@tanstack/markdown/react` 渲染，流式使用 `streamingMarkdownExtension()`，关闭 `frontmatter`、`headingIds` 与 `allowHtml`；用户消息保持纯文本。
- [ ] 8.2 调整消息呈现：用户消息靠右气泡；Agent 消息去掉气泡与背景，直接以 Markdown 内容块显示；不显示头像、图标或身份标签。
- [ ] 8.3 实现平滑流式渐显：维护原始文本与展示文本，按 `requestAnimationFrame`/固定时间片合并细碎增量并以稳定速率揭示；新增尾部短 opacity 过渡或底部渐变遮罩；流结束立即补齐剩余文本；`prefers-reduced-motion` 直接显示；消息切换或卸载时清理动画帧与缓冲。
