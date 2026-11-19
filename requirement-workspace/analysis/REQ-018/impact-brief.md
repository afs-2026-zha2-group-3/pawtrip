# REQ-018 Impact Brief — 伙伴提示（豆包伙伴气泡）

- 生成日期：2026-11-18
- 上游需求：[REQ-018 伙伴提示](../../requirements/REQ-018-companion-hints.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：复用现有 Chatbot 入口；气泡在入口上方；每次 pathname 切换自动展示；5 秒自动关闭；点击入口打开 AgentPanel；事件反馈统一 `say()`；`/login` 无入口、`/admin/*` 无气泡但保留入口。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-018 | 伙伴提示（豆包伙伴气泡） | p1-ready | `requirements/REQ-018-companion-hints.md` |

阻塞开放问题：0（12 blocking + 4 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-planning-agent/spec.md`：Agent 为全局可折叠面板，入口按钮右下角，打开面板；本需求修改入口形态与打开方式，面板内部能力不变。
- `openspec/specs/web-app-shell/spec.md`：登录后外壳、导航、滚动容器与全局面板挂载；本需求补充伙伴气泡挂载与 `/admin/*` 边界。
- `openspec/specs/paws-page/spec.md`、`destination-selection/spec.md`、`trip-attractions/spec.md`、`transport-rules-comparison-page/spec.md`、`trip-context/spec.md`、`trip-itinerary/spec.md`：提供档案、城市、地点、交通规则、激活行程与行程单的既有行为；本需求只读消费。
- 无 `companion-hints` 能力，需新建。

**当前前端实现（main 基线）**

- `apps/web/src/components/agent/agent-panel.tsx`：`AgentPanel` 渲染 `data-testid="agent-fab"`（`fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg`，`Bot` 图标，点击 `toggleOpen`）与右侧 Sheet（`z-[60]`，桌面 400px）；无气泡。
- `apps/web/src/lib/agent/store.ts`：`open`、`proposals`、`allowedPoi`、`newTripFlow`；`setOpen/toggleOpen`。
- `apps/web/src/lib/agent/selectors.ts`：`useAgentOpen` 等。
- `apps/web/src/routes/_authenticated.tsx`：认证外壳全局挂载 `<AgentPanel />`；不区分 `/admin/*`。
- `apps/web/src/queries/pets.ts`：`petsQueryOptions()`（第 54 行）返回当前用户宠物列表；第一只宠物提供名字与照片。
- 页面提示现状：各页空态/内联小字分散在 `routes/_authenticated/{index,paws,cities,transport-rules,trips,itinerary}.tsx` 与 `attractions/index.tsx`；无统一 store/组件。
- 宠物照片工具：`apps/web/src/lib/pet-photo.ts` 的 `photoDataUrl`；装饰贴纸 `apps/web/src/assets/paw-sticker-sm.png`。
- 样式工具：`apps/web/src/lib/utils.ts` 的 `cn`；shadcn/Base UI `Button`。

**当前工作分支 WIP（未提交，需按本 REQ 收敛）**

- `apps/web/src/lib/companion/store.ts`：`mood`、`bubble`、`hint`、`nextId` 与 `setHint/showHint/clearHint/say/dismiss`。
- `apps/web/src/lib/companion/selectors.ts`、`use-companion-hint.ts`：订阅与 pathname 绑定。
- `apps/web/src/components/companion/companion.tsx`：独立头像、4.6 秒、点击头像展示提示；与最新口径冲突。
- `apps/web/src/routes/_authenticated.tsx`：额外挂载 `<Companion />`；`agent-fab` 已被移除（WIP）。
- 七个页面已接入 `useCompanionHint` 与 `say()`；`agent-panel.tsx` 当前无 `agent-fab`。

**测试与夹具**

- `apps/web/src/components/agent/agent-panel.test.tsx`：jsdom + mock `@tanstack/react-router`，首个用例依赖 `agent-fab`。
- `e2e/trip-planning-agent.spec.ts`、`e2e/attraction-pet-rules.spec.ts`：通过 `agent-fab` 打开面板。
- `e2e/app-shell-layout.spec.ts`：认证外壳与导航回归。
- 无伙伴气泡 E2E。

**知识库 / 规则**

- `docs/knowledge/rules/`：`@rule:spec-first`、前端查询与组件约定。
- `docs/knowledge/interfaces/http-api.md`：本需求无接口变更，无需更新。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| 伙伴 store | 无 | 新增 `lib/companion`：`hint`、`bubble`、`nextId`；`say(text, mood)`、`setHint/showHint/clearHint/dismiss`；新气泡替换旧气泡 |
| 页面提示接入 | 各页内联分散 | 新增 `useCompanionHint(text)`：pathname 变化时登记/清理 hint；七个页面声明文案 |
| 气泡组件 | 无 | 新增气泡渲染（署名、情绪边框、关闭按钮、5 秒自动关闭、窄窗宽度），挂在 Chatbot 入口上方 |
| Chatbot 入口 | `agent-fab` + `Bot` 图标，点击切换面板 | 保留位置/测试标识/可访问名；点击 `setOpen(true)`；其上渲染伙伴气泡 |
| 全局挂载 | `_authenticated.tsx` 挂载 AgentPanel | 仍由 AgentPanel 承载入口与气泡，不额外挂载独立伙伴头像；`/admin/*` 抑制气泡 |
| 逐页状态 | 各页自行提示 | 每页通过 `useCompanionHint` 声明；加载中不展示，避免闪现错误提示 |
| 业务事件 | 内联文案/无反馈 | 保存档案、选城、加景点、选交通、切行程、创建/导出行程单统一 `say()` |
| 情绪样式 | 无 | `ok` 绿 / `info` 品牌橙 / `warn` 琥珀 / `danger` 红；仅边框色与状态点 |
| 既有内联提示 | 存在 | 保留；伙伴气泡互补，不删除 |
| 后端 / 数据库 | — | 零改动；无迁移、无新接口、无新依赖 |
| Living Spec | `trip-planning-agent` 入口与 `web-app-shell` 外壳 | ADDED `companion-hints`；MODIFIED `trip-planning-agent`（入口打开方式）；MODIFIED `web-app-shell`（气泡挂载边界） |

## 4. Blast radius

- **直接受影响**：右下角 Chatbot 入口（行为与附属气泡）、七个业务页面的提示声明与业务事件回调、`_authenticated.tsx` 挂载方式、`agent-panel.tsx` 入口渲染。
- **不受影响**：Agent 对话/工具/方案/确认、宠物档案数据契约、城市筛选与政策、地点浏览与加入景点逻辑、交通规则判定、行程保存与激活、行程单生成/导出内容、后端与数据库。
- **兼容性**：不新增接口与字段；`agent-fab` 测试标识保留，既有 E2E 可用；`/admin/*` 既有入口保留，仅新增「无气泡」规则。
- **外部依赖**：无。
- **数据迁移**：无。

## 5. Artifact impact

- **Specs**：ADDED `companion-hints`（入口/署名/`say()`/提示矩阵/自动关闭/窄窗/挂载边界）；MODIFIED `trip-planning-agent`（入口复用与点击打开面板）；MODIFIED `web-app-shell`（气泡挂载与 `/admin/*` 规则）。
- **Tests**：
  - 前端单测：`companion/store`（替换、dismiss、hint 同路径去重）；`agent-panel`/气泡（自动出现、5 秒关闭、点击入口打开面板、署名兜底、`/admin/*` 抑制）。
  - E2E：`e2e/companion-hints.spec.ts`（逐页出现、5 秒自动关闭、点击入口打开面板）；回归 `trip-planning-agent`、`attraction-pet-rules`、`app-shell-layout`。
- **Docs / KB**：无接口变更；不需要更新 `http-api`。可在归档阶段补一行能力说明，非 P1 必需。
- **OpenSpec**：已建立 change `2026-11-18-companion-hints`（proposal / delta specs / tasks），需 `openspec validate --strict` 通过；P1 仅修订 proposal 与需求工件，delta specs 在 P2 复核。
- **Gate**：P1 工件产出后需人工 G1 评审；本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载「伙伴 store → 入口/气泡 → 逐页 hint → 业务事件 → 单测/E2E」。单独拆分会造成「有 store 无入口」或「有气泡无提示」的不可验收中间态。
- **Agile**：可拆 3 个薄故事：入口与气泡（AC-1/4/7）→ 逐页提示（AC-2）→ 业务反馈（AC-3/5/6）。
- **依赖顺序**：store 与选择器 → 入口/气泡与自动关闭 → 逐页 hint → 业务事件 → 单测 → E2E 回归。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 路由切换时序 | 页面数据未就绪时 hint 为 `null`，避免先弹「无档案」再弹正确文案；pathname 变化只自动展示一次 |
| 风险 R2 | 事件与页面提示竞争 | 事件气泡未过期时优先；事件消失后再允许本页 hint，不叠加两个气泡 |
| 风险 R3 | 既有入口 E2E 破坏 | 保留 `agent-fab` 测试标识与可访问名称；点击由 `toggleOpen` 改为 `setOpen(true)`，既有「打开面板」断言不变 |
| 风险 R4 | 管理端回归 | 只抑制气泡，不移除入口；`/login` 不在认证外壳，天然无入口 |
| 风险 R5 | 窄窗遮挡 | 气泡 `min(20rem, 100vw - 2rem)` 且位于入口上方；不锁定页面滚动或点击 |
| 风险 R6 | 页面提示遗漏/重复 | 七个受支持页面逐一声明；同一 hint 文本 + path 不重复触发；E2E 覆盖全部路径 |
| 风险 R7 | 性能/重渲染 | store 选择器只订阅 `bubble` 与 `hint`；定时器随气泡 id 清理，避免旧计时关闭新气泡 |
| 风险 R8 | 需求口径漂移 | 当前 WIP 的独立头像/4.6 秒/点击展示提示均为旧口径；P4 按本 REQ 收敛，P2 同步 delta spec 措辞 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`2026-11-18-companion-hints`（已建立）。
- 理由：入口、气泡、逐页提示与业务反馈共享同一 store 与展示契约；拆分会造成入口/提示不可独立验收。
- 规模预估：S–M；1 个前端 store + 1 个入口/气泡组件 + 七个页面少量接入 + 1 组单测 + 1 个 E2E；零后端、零迁移、零新依赖。
- 工作切片（change 内顺序）：T1 store 与选择器（含单测）→ T2 入口/气泡与 5 秒关闭 → T3 逐页 hint → T4 业务事件 → T5 单测与既有 Agent 测试 → T6 E2E 与回归 → T7 OpenSpec 措辞同步与验证。
