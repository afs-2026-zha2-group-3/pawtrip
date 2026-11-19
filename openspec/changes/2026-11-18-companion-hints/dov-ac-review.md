# AC / DoV Review — 伙伴提示（豆包伙伴气泡）

变更：`2026-11-18-companion-hints`

范围：核对 REQ-018（US-52）的验收要求、Delta Spec、Design、Tasks 与当前证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 全局入口与署名 | Pass | Delta `companion-hints`「伙伴气泡复用现有 Chatbot 入口」「气泡署名与内容」；Design D1/D5；Tasks 1.3–1.5、4.2 | 无档案默认「豆包」；入口不依赖激活行程 |
| AC-2 逐页情境提示 | Pass | Delta「路由切换自动展示与自动关闭」「统一提示接口与业务反馈」；Design D3/D6；Tasks 1.2、2.1–2.7、4.3 | 七页全覆盖；数据未就绪不展示；同路径不重复 |
| AC-3 统一情绪反馈 | Pass | Delta「统一提示接口与业务反馈」；Design D2/D5/D6；Tasks 1.1、3.1–3.6 | `ok/info/warn/danger` 四档边框色；页面不自建气泡 |
| AC-4 自动关闭与替换 | Pass | Delta「路由切换自动展示与自动关闭」；Design D4；Tasks 1.1、1.5、4.1 | 5000ms；新气泡替换并重置；同时最多一个 |
| AC-5 窄窗口适配 | Pass | Delta「非模态、窄窗与挂载边界」；Design D5；Tasks 1.3、4.1 | `min(20rem, calc(100vw - 2rem))`，入口保持右下角 |
| AC-6 非模态 | Pass | Delta「非模态、窄窗与挂载边界」；Design D5；Tasks 1.3 | `role="status"` + `aria-live="polite"`；不抢焦点、不阻塞操作 |
| AC-7 入口整合与边界 | Pass | Delta「伙伴气泡复用现有 Chatbot 入口」「非模态、窄窗与挂载边界」；Design D1/D7；Tasks 1.4–1.5、4.2–4.3 | 点击入口直接打开 AgentPanel；`/login` 无入口；`/admin/*` 无气泡但保留入口 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`specs/companion-hints/spec.md`、`design.md` | 入口复用、气泡、逐页提示、事件反馈、5 秒关闭、管理端边界均在范围内；独立头像、第二入口、持久化、Agent 改造明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` Decisions D1–D8；P1 OQ 12/12 resolved | 入口形态、点击行为、5 秒、自动触发、事件优先、管理端、AI 按钮取舍均定稿 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks / Trade-offs；下方 Residual concerns | 查询未就绪、事件竞争、计时器竞态、既有 E2E、管理端、窄窗、WIP 偏离均有缓解 |
| DoV-4 Delta Spec 可校验 | Pass | `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` → valid（2026-11-18） | 仅 ADDED `companion-hints`；既有 `trip-planning-agent` / `web-app-shell` 契约无需修改 |
| DoV-5 场景覆盖与追溯 | Pass | 下方 Requirement ↔ Scenario ↔ AC ↔ Task 表 | 5 个 Requirement、21 个 Scenario；AC-1…AC-7 全部有场景与任务承接 |
| DoV-6 任务可执行 | Pass | `tasks.md` 5 组 35 项 | 每项含动作与验证点；头部链接 `design.md` 与 `atdd-design.md`，末尾列单测、E2E、构建与规格校验命令 |
| DoV-7 实施先行交叉证据 | Pass | 2026-11-18 P4：`companion.tsx` 收敛为气泡组件，`agent-panel.tsx` 保留 `agent-fab`+`Bot` 并挂载气泡；`_authenticated.tsx` 移除旧 `Companion`；`npx vitest run --root apps/web` 364 passed（49 files）；`tsc --noEmit` 无错误；`npm run build -w apps/web` 成功 | 旧口径（独立头像、4600ms、点击头像展示提示）已清除；单测覆盖 store/组件/入口；打开面板时气泡立即隐藏并在关闭面板后不重现 |
| DoV-8 跨 REQ 一致性 | Pass | `design.md` Non-goals / D6；P1 `analysis/REQ-018/impact-brief.md` §3–§4 | 不改档案、城市、地点、交通规则、行程与导出契约；保留既有内联提示 |
| DoV-9 迁移可验证 | N/A | `design.md` Migration | 零数据库迁移、零接口变更、零新依赖 |
| DoV-10 E2E 与全量验证 | Pass | 2026-11-18 P4：`e2e/companion-hints.spec.ts` 5/5；受影响 7 个 spec 45/45；全量 22 个 spec 104/104 通过；`openspec change validate --strict` valid | 新增 E2E 5 项 ≤30；admin 两套回归已修复（管理端不发起宠物预览请求，避免 401 触发全局缓存清理）；面板发送按钮遮挡已修复（入口外壳透传指针） |

## Requirement ↔ Scenario ↔ AC ↔ Task 追溯

| Delta Requirement | Scenario 数 | AC | Tasks |
|---|---|---|---|
| 伙伴气泡复用现有 Chatbot 入口 | 3 | AC-1、AC-7 | 1.4、4.2 |
| 气泡署名与内容 | 3 | AC-1、AC-6 | 1.3、1.5、4.1 |
| 路由切换自动展示与自动关闭 | 5 | AC-2、AC-4 | 1.1–1.2、1.5、4.1、4.3 |
| 统一提示接口与业务反馈 | 5 | AC-2、AC-3 | 1.1–1.2、2.1–2.7、3.1–3.6 |
| 非模态、窄窗与挂载边界 | 5 | AC-5、AC-6、AC-7 | 1.3–1.5、4.2–4.3 |

## Residual concerns

- **5 秒时长**：需求方 2026-11-18 明确 5 秒，覆盖故事中的 4.6 秒；spec/design/tasks 已统一，验收按 5000ms。
- **管理端入口**：`/admin/*` 仅抑制气泡，保留既有 Chatbot 入口，避免移除管理端既有 Agent 能力；与故事「admin 不出现伙伴」按「伙伴提示不出现」解释。
- **事件与页面提示竞争**：事件气泡未过期时优先；依赖 `createdAt` 与 `bubble.id` 计时，测试需覆盖快速连续事件。
- **既有 E2E 回归**：`trip-planning-agent` 与 `attraction-pet-rules` 通过 `agent-fab` 打开面板；保留测试标识，点击语义由 toggle 改为 open，需回归确认。
- **无持久化**：刷新即丢失，符合需求；不写服务端、不发请求。
- **不可达分支**：宠物档案 `warn` 被表单校验拦截、大交通 `danger` 无 `not_allowed` 规则数据，均保留为防御文案，不为其新增测试数据。
- **G1/G2/G3 未签署**：本记录不代签。

## Review outcome

文档层 AC/DoV 检查为 **Pass（规格、设计范围与本地验证）**：Delta Spec、Design、Tasks 与 REQ-018 的 7 条 AC 全部可追溯，规格 `validate --strict` 通过，旧口径已在变更包内收敛；DoV-7 与 DoV-10 已由 2026-11-18 P4 本地实测补齐（vitest 363 / E2E 全量 104 / tsc / build 通过）。本结果不代表 Gate 已批准，也不代表 CI 已通过。
