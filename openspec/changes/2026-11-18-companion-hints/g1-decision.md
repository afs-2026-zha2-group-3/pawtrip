# G1 decision — companion-hints

- Gate: G1（Align）
- Change id: `2026-11-18-companion-hints`（REQ-018 伙伴提示 / US-52）
- Status: 已签署（2026-11-18）
- Inputs:
  - `proposal.md`、`specs/companion-hints/spec.md`（ADDED，5 需求 21 场景）
  - `design.md`（D1–D8：入口复用、状态模型、自动展示与事件优先、5 秒计时、展示与情绪、页面/事件接入、边界、测试与回滚）
  - `tasks.md`（4 组 26 项，含实现收敛、单测、E2E 与验证命令）
  - 复核：`dov-ac-review.md`（AC-1…AC-7 全追溯；DoV-1–DoV-6、DoV-8 Pass，DoV-7 Partial，DoV-9 N/A，DoV-10 待执行）、`consistency-lint.md`（0 BLOCKER / 0 WARNING / 3 SUGGESTION，Verdict Pass）
  - P2 质量清单：`docs/ai4se-plugins/20261118-172301-quality-checklist-report.md`（Overall Pass，P2-3 G1 未代签）
  - P1 质量清单：`docs/ai4se-plugins/20261118-171753-quality-checklist-report.md`（Overall Pass）
  - 上游需求：`requirement-workspace/requirements/REQ-018-companion-hints.md`（AC-1…AC-7、S1–S9，12 blocking + 4 non-blocking OQ 全部 resolved，DoR BLOCKER=0）；`intents/REQ-018-companion-hints.md`；`analysis/REQ-018/{impact-brief,deep-dive}.md`
  - 校验：`npx --no-install openspec change validate 2026-11-18-companion-hints --strict` 通过（2026-11-18）
- G1 预审修正（已合入变更包）：
  1. 按需求方最新口径重写 Delta：复用既有 Chatbot 入口、点击直接打开面板、每次 pathname 切换自动展示、5000ms 自动关闭、移除气泡内「AI 规划」按钮。
  2. 删除不再需要的 `trip-planning-agent` 与 `web-app-shell` MODIFIED delta：既有 Living Spec 已要求「点击右下角圆形入口打开面板」，新增 `companion-hints` 自包含入口与气泡边界。
  3. 补齐 `design.md`、`dov-ac-review.md`、`consistency-lint.md` 与可执行 tasks。
- Findings:
  - 范围：Delta 与 proposal What Changes、REQ-018 In/Out 一致；单 Change 交付「入口复用 + 气泡 + 逐页提示 + 业务反馈 + 5 秒关闭 + 边界」。独立头像、第二入口、气泡内 AI 按钮、持久化、Agent 面板改造、后端/迁移/新依赖均未混入。
  - 歧义：无未决 blocking 项。入口形态、点击行为、署名与默认名、四档情绪、自动触发、事件优先、替换计时、管理端与登录页边界均已在 design 定稿并落入 Delta。
  - 冲突：既有 `trip-planning-agent` 已覆盖「圆形入口打开面板」，无需修改；`web-app-shell` 外壳契约不变；不改档案、城市、地点、交通规则、行程与导出行为；既有内联提示保留。
  - 残余风险（非阻塞，IO/SA 知悉）：
    1. 当前工作分支 WIP 仍为旧口径（独立头像、4.6 秒、点击头像展示提示、已移除 `agent-fab`），P4 必须按 Design D1/D5 收敛。
    2. 依赖未安装，单测/E2E 未运行；DoV-7 Partial、DoV-10 待执行，不据此宣称 P4 完成。
    3. 管理端按「抑制气泡、保留既有 Chatbot 入口」解释故事中的「admin 不出现伙伴」，避免移除管理端既有 Agent 能力。
    4. 事件气泡与页面提示存在时序竞争，依赖 `createdAt` 优先级与 `bubble.id` 计时；P4 单测覆盖快速连续事件。
    5. 气泡状态仅存内存、刷新丢失，符合需求，不写服务端。
    6. 既有 `trip-planning-agent` / `attraction-pet-rules` E2E 依赖 `agent-fab`；点击语义由 toggle 改为 open，需回归确认。
- Decision: **Pass**
- Conditions + owners: 无（Pass）。上述 6 项为非阻塞知悉项，已有归属（P4）或运行期降级，不构成 Gate 条件。
- Approvers: IO=用户（TANTA6）；SA=用户（TANTA6）（用户 2026-11-18 选择本人同人签署，沿袭 REQ-011 / REQ-016 / REQ-017 G1 同人签署先例）
- Timestamp: 2026-11-18

> 本记录为人工 G1 决定的落盘，不构成 G2/G3 授权。下一步：P3（`atdd-design.md`、`alignment-self-check.md` 与红绿排序），随后 P4 按本变更包收敛实现并运行验证。
