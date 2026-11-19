# ATDD design — 2026-11-18-companion-hints

- Change：`2026-11-18-companion-hints`（REQ-018 / US-52 伙伴提示）
- 输入：`specs/companion-hints/spec.md`（5 需求 / 21 场景）、`design.md`（D1–D8）、`requirement-workspace/analysis/REQ-018/{impact-brief,deep-dive}.md`
- 范围：前端纯交互能力；零后端、零迁移、零新依赖
- 实施口径：遵循本仓库约定「前端不按 TDD 实现」——P4 直接实现业务代码，测试与实现同步补齐；E2E 新增用例计数受 30 上限约束
- Rules 对齐：`@rule:typescript-testing`（Vitest + Testing Library + Playwright）；沿用现有测试产品与 CI，不新建 CI 语义

## 1. 分层结论

| # | Delta 场景（原文主题） | 层 | 附加值 | 理由（优先级 / 信号） |
|---|---|---|---|---|
| 1 | R1「点击入口打开 Agent 面板」 | Component + E2E | Accessibility（advisory） | 点击后 `agent-panel` 可见、关闭后入口仍在（优先级 2） |
| 2 | R1「不新增第二个浮动头像」 | Component + E2E | — | 断言 `agent-fab` 数量为 1、无 `companion-avatar`，入口保留原 `Bot` 图标与样式（优先级 2） |
| 3 | R1「入口不依赖激活行程」 | Component + E2E（回归） | — | 既有 `agent-panel.test.tsx` 首用例已覆盖无激活行程（优先级 2） |
| 4 | R2「有档案时使用宠物名署名」 | Component | — | `/api/pets` 返回「豆豆」→ 标题「豆豆 · 伙伴提示」（优先级 2） |
| 5 | R2「无档案时使用默认署名」 | Component | — | `/api/pets` 返回空数组 → 标题「豆包 · 伙伴提示」（优先级 2） |
| 6 | R2「关闭气泡」 | Component | — | 点击关闭按钮后气泡消失、入口仍可用（优先级 2） |
| 7 | R3「切换页面自动展示」 | Component + E2E | — | pathname 变化后自动出现（优先级 2） |
| 8 | R3「同一路径不重复弹出」 | Component | — | 同 pathname 重渲染不再次展示（优先级 2） |
| 9 | R3「五秒后自动关闭」 | Component + E2E | — | fake timers 4999ms 仍展示、5000ms 关闭（优先级 2） |
| 10 | R3「新气泡替换旧气泡」 | Unit + Component | — | store id 递增；旧定时器不得关闭新气泡（优先级 3 + 2） |
| 11 | R3「跨页事件优先」 | Component | — | 事件未过期不弹本页 hint；事件关闭后补弹（优先级 2） |
| 12 | R4「保存档案反馈」 | E2E（扩断言）+ Unit | — | `say` 透传 mood；既有 paws spec 断言 `data-mood`（优先级 2） |
| 13 | R4「选择城市反馈」 | E2E（扩断言）+ Unit | — | 禁养 `danger`；推荐集为空 `info`（优先级 2） |
| 14 | R4「加入景点反馈」 | E2E（扩断言）+ Unit | — | 政策限制 `warn`；否则 `ok`（优先级 2） |
| 15 | R4「选择交通方式反馈」 | E2E（扩断言）+ Unit | — | `ok` / `warn` / `danger` 三档（优先级 2） |
| 16 | R4「逐页提示全覆盖」 | E2E + 源码检查 | — | 7 页依次导航均有非空气泡，且文案互不相同（优先级 2） |
| 17 | R5「气泡不阻塞页面操作」 | Component + E2E | Accessibility（advisory） | `role="status"`、无 `dialog`、不夺取焦点、底层可点击（优先级 2） |
| 18 | R5「窄窗口气泡收窄」 | Component + E2E | Responsiveness（advisory） | `w-[min(20rem,calc(100vw-2rem))]`；375px 视口不溢出（优先级 2） |
| 19 | R5「管理端不展示气泡」 | Component + E2E | Security（advisory） | `/admin/*` 无气泡但 `agent-fab` 可用（优先级 2） |
| 20 | R5「登录页不渲染入口」 | E2E（回归） | Security（advisory） | `/login` 无 `agent-fab`；既有 `trip-planning-agent` 已断言（优先级 2） |
| 21 | R5「状态不持久化」 | Unit + E2E | — | 无 storage 写入；reload 后不弹，直到发生 pathname 切换（优先级 2） |

- R = `companion-hints` 需求序号；合计 21 个 Delta 场景，全部有层归属，无遗漏。
- 业务情绪判定（`ok/info/warn/danger`）复用既有 `evaluateRuleForPet`、`violatedLimitTags`、`matchCityCandidate` 结果，不新增纯函数层；mood 透传由 Unit 覆盖，判定组合由 E2E 覆盖。

## 2. 测试清单（P4 同步补齐，前端不红测先行）

### 2.1 单元 — `apps/web/src/lib/companion/store.test.ts`（新增）

```text
U1 say 生成 kind="event" 气泡，mood 透传，id 递增
U2 say 第二次立即替换旧气泡，同一时刻最多一个 bubble
U3 dismiss() 无参关闭；dismiss(旧 id) 不关闭新气泡
U4 showHint() 无 hint 时 no-op；有 hint 时生成 kind="hint"、mood="info"
U5 setHint 同 path + 同 text 返回原引用（no-op）；不同 text 更新
U6 clearHint(path) 只清匹配 path，不影响新页面 hint
U7 resetForTests 恢复 initialCompanionState
U8 所有动作不读写 localStorage / sessionStorage
```

### 2.2 组件 — `apps/web/src/components/companion/companion.test.tsx`（新增）

测试夹具：`vi.mock("@tanstack/react-router")` 提供可变 `pathname`；`QueryClientProvider` + `retry: false`；`fetch` 返回 `/api/pets` 档案或空数组；渲染 `<AgentPanel />`（气泡与入口同容器）。

```text
C1 首挂载不自动展示（刷新语义）：已有 hint 也不弹
C2 pathname 变化后自动展示一次本页 hint
C3 同一 pathname 重渲染（查询/状态变化）不重复展示
C4 展示后 4999ms 仍在，5000ms 自动关闭
C5 新事件气泡立即替换 hint 气泡，计时从新气泡重新开始
C6 未过期事件气泡存在时不弹 hint；事件关闭后补弹 hint
C7 有档案署名「豆豆 · 伙伴提示」；无档案署名「豆包 · 伙伴提示」
C8 关闭按钮关闭气泡，`agent-fab` 仍可用
C9 点击 `agent-fab` 打开 `agent-panel`；面板已开时再次点击不关闭；入口保留原 `Bot` 图标与 `aria-expanded`；打开面板时展示中的气泡立即隐藏并被丢弃，关闭面板后不重新弹出（`agent-panel.test.tsx` 覆盖）
C10 页面只存在一个 `agent-fab`，不存在 `companion-avatar`
C11 `/admin/locations` 不展示气泡，但 `agent-fab` 可见可点
C12 气泡 `role="status"`、`aria-live="polite"`；无 `dialog`；无「AI 规划」按钮
C13 气泡类名含 `w-[min(20rem,calc(100vw-2rem))]` 与 `bottom-full`
C14 气泡展示时底层按钮可点击，`document.activeElement` 未被气泡夺取
C15 hint 为 `null`（数据未就绪）时 pathname 切换也不展示气泡
```

时间相关用例使用 `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`，其余用例使用真实计时器；每个用例后恢复并 `companionActions.resetForTests()`。

### 2.3 Agent 入口 — `apps/web/src/components/agent/agent-panel.test.tsx`（扩展现有 13 项）

```text
A1 既有「shows the global entry without an active trip and opens the panel」保持通过
A2 入口点击语义改为 setOpen(true)：面板打开后再次点击入口不关闭面板
A3 增加 router mock 后，`/admin/locations` 下入口仍可见、无气泡
A4 `/api/pets` 为空时标题回退「豆包」
```

现有用例的 `fetch` 已对 `/api/pets` 返回 `[]`；增加 `useRouterState` mock 时保持默认 `/`，避免改动既有断言。

### 2.4 E2E — `e2e/companion-hints.spec.ts`（新增 5 项）

```text
E1 showsOneHintPerPageWhileNavigating
   `signIn` 后依次导航 /paws → /cities → /attractions → /transport-rules → /trips → /itinerary → /
   每页断言气泡可见、标题含「· 伙伴提示」、正文非空；收集正文，断言至少 5 个不同文案
E2 dismissesHintAfterFiveSeconds
   导航触发气泡 → 3s 时仍可见 → 7s 内消失；期间无新气泡
E3 opensAgentPanelFromTheOnlyEntry
   气泡展示时点击 `agent-fab` → `agent-panel` 可见，且 `companion-bubble` 立即消失
   关闭面板后入口仍可见，气泡不重新弹出（count == 0）
   `agent-fab` count == 1，且无 `companion-avatar`
E4 suppressesBubbleOnAdminPages
   进入 `/admin/locations` → 无 `companion-bubble`，`agent-fab` 可见
E5 doesNotRestoreBubbleAfterReload
   触发气泡 → reload → 立即无气泡（等待 1s 仍无）→ 导航到另一页后才出现
```

- 新增 E2E 用例 5 个，满足「单 change E2E ≤ 30」上限。
- 回归：`trip-planning-agent`（入口/面板）、`attraction-pet-rules`（`agent-fab` 点击）、`app-shell-layout`（固定层）、`paws-pet-management`、`city-pet-policy`、`rule-recommendation-and-selection`（业务事件源）。

### 2.5 业务事件断言（扩展现有 spec，不新增用例）

在既有业务用例末尾追加气泡断言，触发真实业务动作后读取 `companion-bubble` 的 `data-mood` 与正文：

```text
B1 paws-pet-management.spec.ts
   保存完整档案 → data-mood="ok" 且正文含「Mimi的档案已保存」
   （不完整档案会被表单校验拦截，warn 分支为历史数据防御文案，E2E 不可达）
B2 city-pet-policy.spec.ts
   宠物犬种不在城市允许名单时选择该城市 → data-mood="danger"；
   destination-selection.spec.ts E15 普通选择 → "ok"；
   E2 推荐集为空 → "info"
B3 attraction-pet-rules.spec.ts
   加入存在政策限制的景点 → data-mood="warn"；
   加入无限制且满足上限的住宿 → "ok"
B4 transport-rules.spec.ts / rule-recommendation-and-selection.spec.ts
   选择满足档案的方式 → "ok"；超重/肩高/检疫不满足 → "warn"；
   当前规则数据无 not_allowed 条目，danger 分支无 E2E 触发路径
```

气泡可能 5 秒后自动关闭，断言必须在动作完成后立即执行；若动作伴随跳转，事件气泡优先展示，断言不依赖本页 hint 文案。B1/B4 的不可达分支由 `transport-rules.tsx` 与 `-pet-dialogs.tsx` 的防御逻辑保留，不为其新增测试专用数据。

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 单元/组件 | `cd apps/web && npx vitest run` | 定向 `npx vitest run src/lib/companion src/components/companion src/components/agent`；依赖需先安装 |
| 类型/构建 | `npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build -w apps/web` | 前端契约与构建 |
| 本地 E2E | `node scripts/run-e2e.mjs e2e/companion-hints.spec.ts`，再跑回归 spec | 运行器提供临时 DB 与全量迁移 |
| 规格校验 | `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` | 工件一致性 |
| CI | 现有 web / e2e 工作流 | 不新增 CI 语义；PR 触发即门禁 |
| 源码检查 | `rg "useCompanionHint" apps/web/src/routes` | 确认 7 页均有声明，无提示盲区 |

## 4. 数据与夹具策略

- **组件夹具**：
  - router mock：`let pathname = "/"`，mock 的 `useRouterState` 读取该变量；测试通过 `act(() => { pathname = "/paws"; rerender(<AgentPanel />); })` 驱动切换。
  - pets：`/api/pets` 默认返回 `[]`；署名用例返回 `[{ id: 1, name: "豆豆", ... }]`。
  - 状态：`beforeEach` 调用 `companionActions.resetForTests()` 与 `agentActions.resetForTests()`，避免跨用例残留。
  - 时间：仅 C4/C5 使用 fake timers，其余真实计时器，防止 TanStack Query 微任务挂起。
- **E2E 种子**：复用 `signIn` / `resetTrips` / `pets` / `createActiveTripViaApi`；默认 worker 独立账号，宠物档案由既有 seed 提供。
  - E1 使用「有档案、无激活行程」统一前置，避免每页数据差异导致文案漂移；只断言标题、非空与文案差异，不锁死每页精确文案。
  - E2 以真实时钟观察 3s/7s 两个窗口，容忍 CI 抖动；不使用 Playwright clock，避免与 SSR 注水冲突。
  - E5 reload 后等待 `html[data-app-ready='true']` 再断言，防止把注水前空白误判为「无气泡」。
- **确定性**：无外部服务、无随机数；mood 通过 `data-mood` 暴露给 E2E，文案只做包含匹配。

## 5. Non-goals 与反向验证

| Non-goal（design / proposal Out） | 反向用例 | 层 |
|---|---|---|
| 不新增第二个浮动头像 | `agent-fab` count == 1，无 `companion-avatar`；入口保留原 `Bot` 图标 | Component C9/C10 + E2E E3 |
| 气泡内不做「AI 规划」按钮 | 查询按钮不存在 | Component C12 |
| 不做语音、动画角色、对话输入 | 气泡内无输入框与动画节点 | Component 检查 |
| 不持久化提示历史/已读 | U8 无 storage 写入；E5 reload 无气泡 | Unit + E2E |
| 不改变 Agent 面板对话/工具/方案布局 | 既有 `agent-panel.test.tsx` 13 项与 `trip-planning-agent` 回归 | Component + E2E |
| 不移除各页既有内联提示 | 各业务页回归 spec 通过 | E2E |
| 不改 `trip-planning-agent` / `web-app-shell` Living Spec | 无对应 delta 目录；`openspec validate --strict` 通过 | 检查 |
| 零后端、零迁移、零新依赖 | `git diff --name-only` 不含 `apps/server`、迁移与 `package.json` 依赖 | 检查 |

## 6. NFR

不纳入。本 change 无新增性能、可观测性、韧性要求；可访问性（`role="status"`、不抢焦点、键盘可达）与窄窗适配已作为 AC 覆盖，不另起 NFR 套件。5 秒自动关闭是功能验收项，不计入性能 NFR。

## 7. 口径澄清（P3 对齐结论）

1. **首挂载与刷新不自动展示**：`autoShownPath` 初始化为当前 pathname，只有发生 pathname 切换才自动弹；满足「每切换页面出现」与「刷新后不保留上次提示」。
2. **事件优先**：未过期 `event` 气泡存在时不弹本页 hint，且不写入 `autoShownPath`；事件关闭后同一 pathname 补弹 hint。
3. **计时**：统一 5000ms；定时器按 `bubble.id` 校验，旧计时器不得关闭新气泡。
4. **边界**：`/login` 无入口与气泡；`/admin/*` 无气泡但保留入口。
5. **结构**：入口与气泡处于同一 `fixed right-4 bottom-4 z-[70]` 容器，气泡 `absolute right-0 bottom-full`，不新增独立头像。
