---
id: REQ-018
title: 伙伴提示（豆包伙伴气泡）
status: p1-ready
discovery: Go (2026-11-18)
sources:
  - ../intents/REQ-018-companion-hints.md
  - openspec/specs/trip-planning-agent/spec.md
  - openspec/specs/web-app-shell/spec.md
  - openspec/specs/paws-page/spec.md
  - openspec/specs/destination-selection/spec.md
  - openspec/specs/trip-attractions/spec.md
  - openspec/specs/trip-context/spec.md
  - openspec/specs/trip-itinerary/spec.md
---

# REQ-018：伙伴提示（豆包伙伴气泡）

## Discovery Decision

Go（2026-11-18，light intake）— 候选能力明确：把现有右下角 Chatbot 入口扩展为全局伙伴入口，其上渲染非模态气泡，提供逐页情境提示与业务事件反馈；气泡署名取第一只宠物名字（无档案默认「豆包」），统一 `say(text, mood)` 接口与四档情绪；路由切换后自动展示 5 秒并自动关闭，点击入口直接打开既有 AgentPanel。与现有 Living Spec 关系清楚：新增 `companion-hints` 能力；修改 `trip-planning-agent`（入口形态与打开方式）与 `web-app-shell`（挂载边界）。不改变后端、数据库、计划结构、Agent 对话能力与既有内联提示。关键事实（2026-11-18 代码核实）：main 基线 `agent-fab` 固定右下角 `z-[70]`，点击 `agentActions.toggleOpen()`；AgentPanel 已在 `_authenticated.tsx` 全局挂载；宠物档案由 `petsQueryOptions()` 提供；当前不存在伙伴 store/气泡。

## 六字段

1. **id**：REQ-018
2. **statement**：已登录用户在全部业务页面使用同一个右下角 Chatbot 入口；入口上方可展示非模态伙伴气泡。气泡标题为「<第一只宠物名> · 伙伴提示」，无宠物档案时默认「豆包」。进入或切换页面（pathname 变化）后，气泡自动展示当前页情境提示，并在 5 秒后自动关闭；新的气泡立即替换旧气泡并重新计时。业务事件（保存宠物档案、选择城市、加入景点、选择大交通方式、切换行程、创建行程单、导出成功/失败等）统一通过 `say(text, mood)` 发出反馈，`mood` 取 `ok / info / warn / danger` 并映射到不同边框色；业务页面不得自建气泡。点击 Chatbot 入口直接打开既有 AgentPanel，对话、方案预览与确认能力保持不变。气泡不阻塞页面滚动与点击；窄桌面窗口下入口保持右下角，气泡收窄并限制在视口内。`/login` 与 `/admin/*` 不展示伙伴气泡；`/admin/*` 保留既有 Chatbot 入口。
3. **actors**：
   - 已登录用户：查看情境提示、接收业务反馈、点击入口打开 AI 面板
   - 前端 `apps/web`：伙伴 store、入口与气泡渲染、逐页 hint 声明、业务事件调用 `say()`
   - 既有 AgentPanel：被入口打开；面板能力不变
   - 管理员：`/admin/*` 不展示伙伴气泡，但保留既有 Chatbot 入口
   - 后端：不受影响（零改动）
4. **rationale**：跨页流程（建档 → 选城 → 选交通 → 加景点 → 生成行程单）缺少一致的下一步提示，用户容易迷路；把提示收敛到一个可预期的伙伴气泡，能让每个页面都回答「接下来做什么」。复用现有 Chatbot 入口避免两个右下角入口职责重叠，也延续既有 E2E 与可访问名称。统一 `say()` 避免各业务重复实现气泡与颜色口径。
5. **acceptance hints**：
   - AC-1：登录后任一业务页面右下角均有 Chatbot 入口；气泡标题为「豆豆 · 伙伴提示」；无档案时为「豆包 · 伙伴提示」；入口不依赖激活行程
   - AC-2：依次进入首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单，每次 pathname 变化后自动出现该页情境提示；同一路径重渲染不重复弹出
   - AC-3：保存档案、选择城市、加入景点、选择交通方式、切换行程、创建/导出行程单等事件经 `say()` 反馈；`ok/info/warn/danger` 对应四种边框色；页面无自建气泡
   - AC-4：气泡展示 5 秒后自动关闭；期间出现新气泡时旧气泡立即消失且计时重置；同一时刻最多一个气泡
   - AC-5：窄桌面窗口下入口保持右下角，气泡宽度收窄且不超出视口，不遮挡关键操作
   - AC-6：气泡为 `role="status"` 非模态浮层，不阻塞滚动/点击；不强制焦点
   - AC-7：点击 Chatbot 入口打开 AgentPanel；面板关闭后入口仍可用；`/admin/*` 无伙伴气泡但保留入口；`/login` 无入口
6. **links to evidence**：
   - 意图与已决口径：[intents/REQ-018-companion-hints.md](../intents/REQ-018-companion-hints.md)
   - 现有入口与面板：[agent-panel.tsx](../../apps/web/src/components/agent/agent-panel.tsx)（main 基线 `agent-fab` 与 Sheet）
   - 入口状态：[store.ts](../../apps/web/src/lib/agent/store.ts)、[selectors.ts](../../apps/web/src/lib/agent/selectors.ts)
   - 全局挂载：[apps/web/src/routes/_authenticated.tsx](../../apps/web/src/routes/_authenticated.tsx)
   - 宠物档案查询：[apps/web/src/queries/pets.ts](../../apps/web/src/queries/pets.ts)
   - 逐页提示落点：`routes/_authenticated/{index,paws,cities,transport-rules,trips,itinerary}.tsx`、`routes/_authenticated/attractions/index.tsx`
   - 既有内联提示与政策匹配：`lib/trip/policy-match.ts`、`data/transport-rule-match.ts`
   - 测试先例：[agent-panel.test.tsx](../../apps/web/src/components/agent/agent-panel.test.tsx)、[e2e/trip-planning-agent.spec.ts](../../e2e/trip-planning-agent.spec.ts)、[e2e/attraction-pet-rules.spec.ts](../../e2e/attraction-pet-rules.spec.ts)
   - 影响分析：[analysis/REQ-018/impact-brief.md](../analysis/REQ-018/impact-brief.md)
   - Deep-dive：[analysis/REQ-018/deep-dive.md](../analysis/REQ-018/deep-dive.md)
   - OpenSpec change：`openspec/changes/2026-11-18-companion-hints/`

## Ready 形状

### Intent

让每个登录后页面都有一个说话一致、位置统一的伙伴：自动告诉用户当前页的下一步，业务动作完成后给出统一情绪反馈；伙伴复用现有 Chatbot 入口，点击即可继续用 AI 规划，从而把「页面引导」与「AI 助手」收敛为一个入口。

### Actors 与权限边界

- 已登录用户：普通业务页面可见入口与气泡；管理端可见既有入口但无伙伴气泡。
- 前端：伙伴状态仅存于内存；不持久化气泡、不写服务端。
- AgentPanel：入口打开面板；面板能力与状态语义不变。
- 后端 / 数据库 / 外部服务：不参与、零改动。

### In / Out Scope

**In**

- 复用 `agent-fab` 位置与样式作为伙伴入口；入口点击打开 AgentPanel
- 入口上方非模态气泡：署名、情绪边框、关闭按钮、5 秒自动关闭、新气泡替换
- 全局伙伴 store：`say(text, mood)`、`setHint/showHint/clearHint/dismiss`
- `useCompanionHint`：页面声明情境提示，pathname 变化后自动展示一次
- 七类页面情境提示：首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单
- 业务事件反馈：保存档案、选择城市、加入景点、选择交通方式、切换行程、创建/导出行程单
- 窄窗口适配；`/login` 与 `/admin/*` 不展示气泡
- 单测（store/组件）与 E2E（逐页出现、5 秒关闭、点击入口打开面板）

**Out**

- 新增第二个伙伴头像或独立浮动入口
- 气泡内单独的「AI 规划」按钮（入口即 AI 入口）
- 语音、动画角色、气泡对话输入
- 服务端持久化已读/提示历史、A/B 或多语言
- 改变 Agent 对话、方案、工具调用与面板布局
- 移除各页既有内联提示（如途内携宠小字、政策对比提醒），二者互补
- 后端、数据库迁移、依赖或运行拓扑变化

### Scenarios + AC Hints

#### S1：入口与署名（AC-1 / AC-7）

- **Given** 已登录用户有宠物档案「豆豆」
- **When** 进入 `/cities`
- **Then** 右下角 Chatbot 入口可见；气泡标题为「豆豆 · 伙伴提示」
- **And** 无档案用户看到「豆包 · 伙伴提示」

#### S2：逐页自动提示（AC-2）

- **Given** 用户停留在首页
- **When** 依次切换到我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单
- **Then** 每次 pathname 变化后自动出现该页情境提示
- **And** 同一路径重渲染不重复弹出

#### S3：5 秒自动关闭（AC-4）

- **Given** 气泡已展示
- **When** 5 秒内没有新气泡
- **Then** 气泡自动关闭
- **And** 5 秒内出现新气泡时旧气泡立即替换并重新计时

#### S4：点击入口打开 AI 面板（AC-7）

- **Given** 入口可见且气泡正在或未展示
- **When** 用户点击入口
- **Then** AgentPanel 打开
- **And** 关闭面板后入口仍可用

#### S5：统一情绪反馈（AC-3）

- **Given** 用户在业务页面完成动作
- **When** 保存档案成功 / 命中禁养或超重 / 加入景点成功 / 导出失败
- **Then** 气泡分别以 `ok / warn|danger / ok / danger` 边框展示
- **And** 页面不新增自建气泡

#### S6：事件优先不叠加（AC-4 / AC-6）

- **Given** 用户从城市页创建行程并跳转
- **When** 新页面加载完成
- **Then** 跨页事件反馈先展示；事件气泡消失后才允许展示本页情境提示
- **And** 同一时刻最多一个气泡

#### S7：窄窗口（AC-5）

- **Given** 桌面窗口宽度明显收窄
- **When** 气泡展示
- **Then** 入口保持右下角，气泡收窄且不超出视口
- **And** 不遮挡页面关键操作

#### S8：边界页面（AC-7）

- **Given** 用户位于 `/login` 或 `/admin/*`
- **When** 页面渲染
- **Then** `/login` 无入口；`/admin/*` 无伙伴气泡但保留既有 Chatbot 入口

#### S9：非模态（AC-6）

- **Given** 气泡正在展示
- **When** 用户滚动页面或点击其他控件
- **Then** 操作不被阻塞
- **And** 气泡不夺取焦点

### Constraints

- 入口沿用 main 基线 `agent-fab`：`fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg`；`data-testid` 与可访问名称保留或提供等价替代。
- 气泡位于入口上方，宽度 `min(20rem, 100vw - 2rem)`；窄窗不溢出。
- 署名取宠物档案第一只宠物；无档案默认「豆包」。
- 气泡展示时长 5000ms；新气泡重置计时；同一时刻最多一个。
- 情绪映射：`ok` 绿、`info` 品牌橙、`warn` 琥珀、`danger` 红（边框色；具体色值由 design 定稿）。
- 自动展示只在 pathname 变化后发生一次；`bubble.kind === "event"` 且未过期时优先，不被本页 hint 覆盖。
- 气泡为 `role="status"` + `aria-live="polite"`，不抢焦点；提供关闭按钮与可访问名称。
- `/login` 无入口；`/admin/*` 无气泡，保留既有入口。
- 状态仅内存；刷新后气泡与提示丢失，不做持久化。
- 零后端、零迁移、零新依赖；遵循 `@rule:spec-first` 与前端既有 TanStack Query/Store 约定。

### Context

- 现有 `agent-fab` 与 AgentPanel 由 `trip-planning-agent` 与 `web-app-shell` 既有要求覆盖；本需求只扩展入口的行为与展示，不改变面板内部能力。
- 宠物档案、城市筛选、政策匹配、交通规则、行程与行程单能力均已存在；伙伴只读取现有数据与页面状态，不新增数据契约。
- US-80 已移除城市/规则页浮动行程面板；伙伴入口不得依赖激活行程存在。
- 当前工作分支已有未对齐 WIP（独立头像、4.6 秒、点击头像展示提示），P4 需按本 REQ 收敛为「Chatbot 入口 + 5 秒自动气泡 + 点击打开面板」。

### Affected Capabilities

- **ADDED** `companion-hints`：伙伴入口与气泡、`say(text, mood)`、逐页情境提示、业务事件反馈、自动关闭与窄窗适配、挂载边界
- **MODIFIED** `trip-planning-agent`：入口改为复用现有 Chatbot；点击入口直接打开面板；不再单独描述「气泡内 AI 规划」作为唯一入口
- **MODIFIED** `web-app-shell`：全局入口挂载边界（`/login` 与 `/admin/*` 的气泡/入口规则）
- 不改 `paws-page`、`destination-selection`、`trip-attractions`、`trip-context`、`trip-itinerary`、`backend-*`、`frontend-*` 的既有行为与数据契约

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 伙伴入口形态？ | Product | 已决（2026-11-18，用户确认）：复用现有 Chatbot 入口，不新增第二个头像 |
| OQ-2 | blocking | resolved | 气泡挂载位置？ | Product | 已决：气泡在现有 Chatbot 入口上方 |
| OQ-3 | blocking | resolved | 气泡展示时长？ | Product | 已决：5000ms（覆盖故事中的 4.6 秒） |
| OQ-4 | blocking | resolved | 何时自动出现？ | Product | 已决：每次 pathname 切换自动出现当前页情境提示；同路径重渲染不重复 |
| OQ-5 | blocking | resolved | 点击入口行为？ | Product | 已决：直接打开 AgentPanel，不先展示提示 |
| OQ-6 | blocking | resolved | 署名与默认名？ | Product | 已决：第一只宠物名；无档案默认「豆包」 |
| OQ-7 | blocking | resolved | 情绪与边框色？ | Product | 已决：`ok/info/warn/danger` 四档映射不同边框色 |
| OQ-8 | blocking | resolved | 新气泡与旧气泡关系？ | Product | 已决：新气泡立即替换旧气泡并重置计时；同时最多一个 |
| OQ-9 | blocking | resolved | 逐页提示覆盖哪些页面？ | Product | 已决：首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单 |
| OQ-10 | blocking | resolved | 是否保留气泡内「AI 规划」按钮？ | Product | 已决：不保留；入口本身即 AI 入口 |
| OQ-11 | blocking | resolved | 管理端如何处理？ | SA | 已决：`/admin/*` 不展示伙伴气泡，保留既有 Chatbot 入口，避免移除既有 Agent 能力 |
| OQ-12 | blocking | resolved | 是否持久化？ | Product | 已决：仅内存，刷新丢失 |
| NB-1 | non-blocking | resolved | 事件反馈与页面提示冲突？ | Dev | 已决：事件气泡未过期时优先，过期后补本页提示 |
| NB-2 | non-blocking | resolved | 既有内联提示是否移除？ | Product | 已决：保留，与伙伴气泡互补 |
| NB-3 | non-blocking | resolved | 是否更新既有 `agent-fab` E2E？ | Dev | 已决：保留 `agent-fab` 测试标识，既有用例仅需验证入口打开面板 |
| NB-4 | non-blocking | resolved | 窄窗断点？ | Dev | 已决：用 `min(20rem, 100vw - 2rem)` 自适应，不引入新断点 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Open Questions | 12 个 blocking OQ（入口形态/挂载/时长/触发/点击/署名/情绪/替换/页面覆盖/AI 按钮/管理端/持久化） | 2026-11-18 与需求方确认，全部 resolved |
| WARNING | resolved | NB-1…NB-4 | 事件优先级、内联提示、测试标识、窄窗断点 | 已在 deep-dive 第 1、5 节定稿 |

基础 8 项自检：①意图清晰 ✓ ②actors 与权限边界 ✓ ③范围有界（In/Out）✓ ④场景具体（S1–S9）✓ ⑤异常/边界（无档案、管理端、同路径重渲染、事件冲突、窄窗、关闭/替换）✓ ⑥结果可验证（标题/文案/边框/时长/面板打开可观察）✓ ⑦依赖与触点（入口、面板、档案查询、七个页面、E2E）✓ ⑧blocking OQ=0 ✓。⑨数据契约 ✓ ⑩边界分支 ✓ ⑪跨 REQ 一致性 ✓ ⑫展示与测试 ✓（2026-11-18 deep-dive 完成，见 `analysis/REQ-018/deep-dive.md` 第 7 节）。BLOCKER 数：0。影响分析 blocker：0；建议单 change `2026-11-18-companion-hints`（规模 S–M，零后端/零迁移/零新依赖）。

## 修订记录

### 2026-11-18 初版

- 依据 US-52 建立 REQ-018；按需求方最新确认定稿「复用现有 Chatbot 入口、5 秒自动关闭、每切换页面自动出现、点击入口打开 AI 面板」；管理端保留入口但不出气泡。
