# Tasks

## 1. 确认并复用共享地点目录接口

- [ ] 1.1 确认 Agent 使用现有登录后可读接口：`GET /api/locations`（普通用户必填 `regionCode`；`typeGroup` 覆盖 5 类；`petFriendlyOnly`、`page`/`pageSize`，`pageSize` 上限 100；无名称检索）与 `GET /api/locations/{poiId}`；确认查询范围为规划目标城市全部地点类型，并在设计与知识文档记录分页抓取与本地名称匹配策略。验证 `openspec validate add-trip-planning-agent` 通过。
- [ ] 1.2 确认 `unify-location-browsing` 已同步到主 specs 或归档；若主 specs 仍描述旧 `/api/locations/attractions`，先完成同步，再实现本变更的地点工具。

## 2. 建立受保护的 Agent 对话入口

- [ ] 2.1 按 TanStack AI 官方文档集成 `@tanstack/ai`、`@tanstack/ai-react` 与 `@tanstack/ai-openai`（`/compatible` 子路径），用 `openaiCompatible` 接入智谱 `https://open.bigmodel.cn/api/paas/v4`，默认模型 `glm-5.3`；模型凭据仅从服务端 `BIGMODEL_API_KEY` 读取。验证 `cd apps/web && npm test` 与根目录 `npm run build` 通过。
- [ ] 2.2 为 Agent 服务端入口接入 Pawtrip 登录会话校验，拒绝未认证调用且不信任客户端提交的用户 ID；补充认证测试并验证未经认证的 Agent 请求被拒绝。

## 3. 实现 Pawtrip 只读工具和规划工作区

- [ ] 3.1 实现浏览器端 Pawtrip 地点查找与详情读取工具：按规划目标城市调用 `GET /api/locations`，遍历全部 `typeGroup`、以 `pageSize=100` 分页抓取，并在本地按名称/地址匹配；仅允许引用真实 Pawtrip 地点 ID；补充匹配、歧义、未收录与分页不足测试，验证 `cd apps/web && npm test` 通过。
- [ ] 3.2 实现独立于 `tripStore.active` 的规划工作区，支持新建、激活行程和未激活已保存行程三类目标；存在激活行程时，新建目标须经用户确认取消当前激活；补充目标选择、不隐式激活及取消激活确认测试，验证 `cd apps/web && npm test` 通过。
- [ ] 3.3 将城市、宠物、天数、单城市地点约束与 Pawtrip 确定性宠物政策结果提供给 Agent 规划流程；补充新行程 1–7 天、已有行程天数/城市/宠物不变及政策结论测试，验证 `cd apps/web && npm test` 通过。

## 4. 实现方案审核与行程应用

- [ ] 4.1 在登录后的全局应用中提供 Agent 界面和结构化方案/差异预览；方案通过专用工具调用返回并由前端 schema 校验；补充无激活行程、激活行程和未激活行程下的界面测试，验证 `cd apps/web && npm test` 通过。
- [ ] 4.2 实现用户明确确认后应用方案：新行程复用创建流程（存在激活行程时先取消激活），激活行程通过增加保存 revision 的批量前端动作触发自动保存，未激活行程通过现有更新流程保存且保持未激活；补充确认、拒绝、取消激活及保存失败测试，验证 `cd apps/web && npm test` 通过。

## 5. 集成验证与文档

- [ ] 5.1 补充端到端验收，覆盖从零规划创建（含已有激活行程时先取消激活）、修改激活行程、修改未激活行程、未登录拒绝和 Pawtrip 地点未命中；验证相关 E2E 用例通过。
- [ ] 5.2 更新中文架构知识文档，说明 Agent 与 trip 上下文、工具权限、地点数据边界及智谱 BigModel 配置（含 `BIGMODEL_API_KEY` 与模型覆盖变量）；补录 BigModel 与 TanStack AI 知识文档；验证文档与最终实现一致，并运行根目录 `npm run build`、`cd apps/web && npm test` 和 `cd apps/server && ./mvnw test`。
