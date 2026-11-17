# Tasks

## 1. 确认并复用共享地点目录接口

- [ ] 1.1 确认 Agent 使用现有登录后可读接口：`GET /api/locations`（普通用户必填 `regionCode`；不传 `typeGroup` 一次取全部类型；`petFriendlyOnly=false`；`pageSize` 上限 100；无名称检索）与 `GET /api/locations/{poiId}`；记录分页抓取、页数上限与本地名称匹配策略。`GET /api/locations/types` 仅用于展示类型标签。验证 `openspec validate add-trip-planning-agent` 通过。

## 2. 建立受保护的 Agent 对话入口

- [ ] 2.1 先阅读 `docs/knowledge/external/tanstack-ai.md` 与 `docs/knowledge/external/bigmodel.md`，再按官方文档集成 `@tanstack/ai`、`@tanstack/ai-react` 与 `@tanstack/ai-openai`（`/compatible` 子路径），用 `openaiCompatible` 接入智谱 `https://open.bigmodel.cn/api/paas/v4`，默认模型 `glm-5.3`；在 `src/routes/api/agent.ts` 提供 SSE server route，并在登录布局挂载全局聊天状态；`.env.example` 增加 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`、`PAWTRIP_AGENT_PROVIDER` 占位符。模型凭据仅从服务端 `BIGMODEL_API_KEY` 读取。验证 `cd apps/web && npm test` 与根目录 `npm run build` 通过。
- [ ] 2.2 为 Agent server route 接入会话校验：通过 `PAWTRIP_API_BASE_URL` 访问 Spring，把入站 `Cookie` 转发给 `GET /api/auth/me`，仅 200 时继续；确认本地 env 加载方式（shell 或显式 server-only 加载），补充集成测试覆盖未认证、会话过期与正常放行，验证未经认证的 Agent 请求被拒绝。

## 3. 实现 Pawtrip 只读工具和规划工作区

- [ ] 3.1 实现浏览器端 Pawtrip 地点查找与详情读取工具：按规划目标城市缓存目录（React Query），调用 `GET /api/locations` 以 `pageSize=100` 分页抓取全部类型（上限 20 页，截断时提示并允许按 `typeGroup` 缩小），在本地按名称/地址匹配；仅允许引用真实 Pawtrip 地点 ID；补充匹配、歧义、未收录、无地点与分页上限测试，验证 `cd apps/web && npm test` 通过。
- [ ] 3.2 实现规划工作区与两阶段新行程：抽出共享的 `createTripFromDraft`（名称生成、宠物校验、激活与查询刷新）供手动与 Agent 共用；新行程通过现有 `startDraft`/`updateDraft` 完成配置，启动前缓存城市名称；覆盖既有草稿前须经用户确认。创建后的地点编排留在规划工作区，不写 `tripStore.active`，未确认方案不 bump revision；支持激活与未激活行程目标；存在激活行程时，新建目标须经用户确认取消当前激活，取消前先完成待发送保存（失败则不取消）。补充目标选择、不隐式激活、保存 flush、草稿冲突、取消激活确认及未确认方案不入库测试，验证 `cd apps/web && npm test` 通过。
- [ ] 3.3 将城市、宠物、天数、单城市地点约束与 Pawtrip 确定性宠物政策结果提供给 Agent 规划流程；补充新行程 1–7 天、无宠物、已有行程天数/城市/宠物不变及政策结论测试，验证 `cd apps/web && npm test` 通过。

## 4. 实现方案审核与行程应用

- [ ] 4.1 在登录后的全局应用中提供 Agent 界面和结构化方案/差异预览；方案通过 `propose_trip_plan` 工具调用返回并由前端 schema 校验（目标、允许 `poiId` 集合、`day`、`totalDays`、`toNext`、`unscheduled` 去重）；切换目标后旧提案失效；补充无激活行程、激活行程和未激活行程下的界面测试，验证 `cd apps/web && npm test` 通过。
- [ ] 4.2 实现用户明确确认后应用方案：新行程先以配置草稿确认创建空计划行程并激活（存在激活行程时先完成保存并取消激活），创建后的计划变更与激活行程一致；激活行程在应用前比较 `updatedAt`，通过增加保存 revision 的批量前端动作整体替换计划并触发自动保存；未激活行程在应用前重新读取详情，保留 `name`/`totalDays`/`transportMode`，仅整体替换 `plan` 并刷新查询；保存返回 400 时保留预览并提示方案未生效。补充确认、拒绝、未确认不入库、目标 404、目标已变更、跨标签页变更、保存失败、400 回滚与地点失效测试，验证 `cd apps/web && npm test` 通过。

## 5. 集成验证与文档

- [ ] 5.1 补充端到端验收：仅使用珠海（`440400`/`440402`）固定数据，不引入其他城市夹具；运行时注入 `PAWTRIP_API_BASE_URL=http://127.0.0.1:18080` 与 `PAWTRIP_AGENT_PROVIDER=fake`，CI 不访问智谱。覆盖配置草稿创建（含已有激活行程时先取消激活）、创建后继续编排、未确认不入库、中途放弃留下行程、修改激活行程、修改未激活行程、未登录拒绝、无宠物、目录截断提示和 Pawtrip 地点未命中；目标城市无地点、保存 400 等边界用组件测试覆盖。验证相关 E2E 用例通过。
- [ ] 5.2 更新中文架构知识文档，说明 Agent 与 trip 上下文、工具权限、地点数据边界及智谱 BigModel / TanStack AI 配置；复核 `docs/knowledge/external/{bigmodel,tanstack-ai}.md` 的来源与日期（截至 2026-11），补充 Start server route 示例，并确保与实现一致（含 `BIGMODEL_API_KEY`、`PAWTRIP_API_BASE_URL`、`PAWTRIP_AGENT_PROVIDER` 与模型覆盖变量），运行根目录 `npm run build`、`cd apps/web && npm test` 和 `cd apps/server && ./mvnw test`。
