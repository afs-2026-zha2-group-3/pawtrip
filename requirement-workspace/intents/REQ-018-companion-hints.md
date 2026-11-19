# REQ-018 原始意图：伙伴提示（豆包伙伴气泡）

> 来源：用户故事 US-52（2026-11-18）；编号 REQ-018（REQ-017 之后顺延）。分支 `feat/companion-hints`（自 main `dfe8f97` 拉取）。
> 需求方在实现前两次修订集成方向，最终口径以「需求澄清」第 1、2 条为准。

## 用户原话（用户故事摘要）

### Story

在每个登录后页面提供一个以宠物名字说话的伙伴形象；伙伴用气泡给出当前页面的下一步建议与业务操作反馈，让用户始终知道「接下来做什么」，同时把分散在各页的内联提示收敛为统一、可预期的对话式反馈。

### Business Background

- 页面内的引导文案分散在标题、空态与卡片小字中，用户完成一个动作后缺少一致的下一步提示。
- 宠物档案、城市筛选、交通规则、行程单之间存在跨页流程，用户容易在页面之间迷路。
- 已有的 AI Chatbot 入口只承担对话，不承担页面级引导，入口价值未被充分利用。

### System Limitation

- 当前没有全局伙伴形象与气泡能力；各页提示风格与口径不统一。
- 页面级提示与业务事件反馈没有统一接口，业务自行实现会进一步碎片化。
- 右下角已有独立 Agent 入口，若再加一个伙伴头像会出现两个入口、职责重叠。

### Enhancement & Solution

- 全局伙伴：登录后所有业务页面使用同一套伙伴入口与气泡；气泡标题为「<宠物名> · 伙伴提示」，无档案时默认「豆包」。
- 统一接口：提供 `say(text, mood)`，情绪 `ok / info / warn / danger` 映射到气泡边框色；新气泡替换旧气泡。
- 逐页情境提示：首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单各有对应的进入情境提示。
- 业务事件反馈：保存宠物档案、选择城市、加入景点、选择交通规则、切换行程、创建/导出行程单等事件统一经 `say()` 反馈。
- 入口整合：复用现有 Chatbot 入口承载伙伴气泡；点击入口打开 AI 面板。
- 边界：`/login` 与 `/admin/*` 不显示伙伴提示。

### Acceptance Criteria（故事原文口径，含后续修订）

- **AC-1 全局与署名**：登录后每个业务页面都有伙伴入口；气泡标题为「<宠物名> · 伙伴提示」；无档案时显示「豆包」；入口不依赖激活行程存在。
- **AC-2 页面情境提示**：进入每个受支持页面后自动出现该页情境提示；七类页面无提示盲区。
- **AC-3 统一情绪接口**：业务事件统一经 `say(text, mood)` 发出，四种情绪对应不同边框色；业务页面不自建气泡。
- **AC-4 自动消失与替换**：气泡自动消失；新气泡立即替换旧气泡，计时重新开始。
- **AC-5 窄窗口**：窄桌面窗口下入口保持右下角，气泡收窄且不遮挡关键操作。
- **AC-6 非模态**：气泡不阻塞滚动、点击与页面操作；同一时刻最多一个气泡。
- **AC-7 入口整合**：复用现有 Chatbot 入口；点击入口打开 AI 面板；原有对话、方案预览与确认能力不变。

## 需求澄清（2026-11-18 对话确认）

1. **气泡出现在现有 Chatbot**：伙伴气泡必须挂在现有 Chatbot 入口上方，不新增第二个浮动头像。
2. **复用现有 Chatbot 入口**：沿用 `agent-fab` 的位置与样式，作为伙伴入口与 AI 入口的同一实体。
3. **每切换页面就出现气泡**：路由 pathname 变化后自动展示当前页情境提示；同一路径的重渲染不重复弹出。
4. **展示 5 秒后自动关闭**：用户明确改为 5 秒（覆盖故事中的 4.6 秒）。
5. **点击就是 AI 面板**：点击 Chatbot 入口直接打开既有 AgentPanel，不再先展示提示气泡。
6. **新气泡替换旧气泡**：自动关闭计时以最新气泡为准；跨页业务事件反馈优先于本页情境提示，不叠加两个气泡。
7. **气泡署名**：取宠物档案第一只宠物的名字；无档案时默认「豆包」。
8. **气泡内容**：情境/事件文案 + 情绪边框 + 关闭按钮；不再需要气泡内单独的「AI 规划」按钮，入口本身即 AI 入口。
9. **管理端**：`/admin/*` 不展示伙伴气泡，但保留既有 Chatbot 入口（避免移除管理端既有 Agent 能力）；`/login` 本身不在登录后外壳，自然无入口。
10. **非模态**：气泡不接管焦点、不阻塞页面；打开 AgentPanel 时如需隐藏气泡可关闭，不强制。

## 现状（代码证据，2026-11-18 调查）

- 现有 Chatbot 入口：main 基线 `apps/web/src/components/agent/agent-panel.tsx` 渲染 `data-testid="agent-fab"`，`fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg`，点击 `agentActions.toggleOpen()`。
- AgentPanel：同一文件渲染右侧 Sheet（`z-[60]`，桌面 400px），全局挂载于 `apps/web/src/routes/_authenticated.tsx`。
- 入口状态：`apps/web/src/lib/agent/store.ts` 提供 `open` 与 `setOpen/toggleOpen`；`apps/web/src/lib/agent/selectors.ts` 提供 `useAgentOpen`。
- 宠物档案：`apps/web/src/queries/pets.ts` 的 `petsQueryOptions()` 提供第一只宠物名字与照片。
- 页面：`routes/_authenticated/{index,paws,cities,transport-rules,trips,itinerary}.tsx`、`routes/_authenticated/attractions/index.tsx`。
- 提示现状：各页空态与内联小字分散存在；无全局伙伴 store、无 `say()`、无气泡组件（main 基线）。
- 测试先例：`apps/web/src/components/agent/agent-panel.test.tsx`（jsdom + mock 路由）、`e2e/trip-planning-agent.spec.ts`、`e2e/attraction-pet-rules.spec.ts` 使用 `agent-fab` 打开面板。
- 当前工作分支已有未对齐的 WIP：独立 `components/companion/companion.tsx` 头像、4.6 秒、点击头像展示提示；需按第 1–5 条修订为 Chatbot 入口内集成。

## 方案取舍记录

- A（选定）复用现有 Chatbot 入口 + 其上气泡：不新增入口，符合需求方明确要求；`agent-fab` 的 E2E 与可访问名称可延续。
- B 独立伙伴头像 + 删除 `agent-fab`：会产生入口替换与 E2E 迁移成本，且与「复用现有入口」冲突，放弃。
- C 两个入口并存（伙伴头像 + Chatbot）：职责重叠、右下角拥挤，放弃。
- D 气泡内再放「AI 规划」按钮：入口已可直接打开面板，按钮重复，放弃。
