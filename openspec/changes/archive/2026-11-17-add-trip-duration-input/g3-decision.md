# G3 decision — add-trip-duration-input

- Gate: G3 (Merge & Archive)
- Change id: `add-trip-duration-input`（REQ-010「输入旅游总天数」）
- 补录说明: 2026-11-17 P5 补录。change 包曾被 `f3aab3e` 以 superseded 为由删除而未归档；本次自 `25060a4` 恢复、补齐 G2/change-summary 后按 superseded 归档。
- Inputs:
  - living-merge / archive：按 archive skill 以 `mv` 归档至 `openspec/changes/archive/2026-11-17-add-trip-duration-input/`（保留 `.openspec.yaml`）；**deltas 不合并**（`destination-selection` sync-blocked：MODIFIED 块与现行草稿流程 5 场景不一致；`trip-duration-input` capability 按 superseded 口径不建立）；`openspec validate --specs` **23 passed / 0 failed**
  - change-summary：`openspec/changes/archive/2026-11-17-add-trip-duration-input/change-summary.md`
  - archive completeness：归档目录含 `proposal` / `design` / `tasks` / `specs`（2 个 delta）/ `atdd-design` / `dov-ac-review` / `alignment-self-check` / `g1-decision` / `g2-decision` / `change-summary`，工件齐全
  - KB update：`bash scripts/kb-lint.sh` → `SKIP: KB lint is not configured for this project.`（exit 0），按 `scripts/README.md` 基线记 Skipped（not configured），非阻塞
- Findings:
  - Merge：PR #54 已合并入 `main`（merge commit `1871995`，2026-11-16T11:06:11Z，来源分支 `codex/input-trip-duration`）；CI 4/4 job success（Web build ×2、Browser E2E ×2）。
  - Superseded：PR #55–#58 的 active-trip 架构取代原 `sessionStorage` 方案；现行 `trip-planning` / `trip-context` / `trip-attractions` / `destination-selection` Living Spec 已覆盖取代后行为，无残留旧步进器契约（已核对）。
  - Conflicts：无；本次为纯文档补录，不改生产代码。
  - 流程缺口：change 被取代时直接删除 change 包导致 P4/P5 记录缺失，本次补录收口；建议后续 superseded 一律走归档留痕（见 AO asks）。
  - Harness / Rules evolve needed？：候选一项——superseded 归档路径（见 AO asks），无立即阻塞项。
- Decision: Pass
- Conditions + owners: 无阻塞条件；delta specs 仅作历史证据、不得再合并入 Living Spec（SA）
- Approvers: SA=HARLAN HUANG
- AO asks / follow-ups（附件，非 G3 条件）:
  - 将「superseded 必须归档留痕、不得直接删除 change 包」纳入流程规则候选。
  - registry/handoff 登记应与 change 生命周期同步，避免 REQ-010 这类未登记缺口。
- Timestamp: 2026-11-17T09:14:19+08:00（补录签署）

> 本记录依据具名 SA 的决定转写；Decision 由 HARLAN HUANG 于 2026-11-17 确认，代理不代为决策。