# G3 decision — 2026-11-18-companion-hints

- Gate: G3（Archive）
- Change id: `2026-11-18-companion-hints`（REQ-018 伙伴提示气泡，US-52）
- Inputs:
  - archive: `openspec/changes/archive/2026-11-18-companion-hints/`（proposal / specs / design / tasks / atdd-design / alignment-self-check / dov-ac-review / consistency-lint / g1 / g2 / ci-report / change-summary 全部随迁移入归档目录，tasks 36/36）
  - living specs: `openspec/specs/companion-hints/spec.md`（新建，+5 requirements / 21 scenarios）；Delta 归档前补 `## Purpose`，无其他 Living Spec 变更
  - validate: `openspec validate companion-hints --strict` 通过；`validate --all --strict` 29 passed / 2 failed，失败为 main 既有 `trip-attractions`、`trip-planning` 超长需求告警（非本 change 引入）
  - implementation PR: #151（`feat/companion-hints` → `main`，合并提交 `764a08b`，merged 2026-11-19T01:26:58Z，CI 全绿）
  - archive commit: `0f9c4f4`（G2/P5 工件 + 归档 + Living Spec，位于 `feat/companion-hints`）；随后同步 main `dc2f285`（PR #148 / #152）得 merge 提交 `23b89f7`
  - sync re-verify（2026-11-19，合并 main 后）：vitest 366 passed、`tsc --noEmit` 通过、`npm run build -w apps/web` 成功、定向 E2E `companion-hints` + `trip-planning-agent` 11/11 通过；按 SA 指示不再重跑全量 E2E（G2 已有全量 104/104 记录）
- Dimension results:
  - archive completeness: Pass（P1–P5 工件齐全，tasks 36/36，`.openspec.yaml` 随目录归档）
  - living spec merge: Pass（`companion-hints` 新建 5 需求 / 21 场景，结构与 Purpose 校验通过）
  - registry/handoff: Pass（REQ-018 状态 `archived`，归档路径、PR、CI、G2 与 P5 记录已回写）
  - KB update: Skipped（仓库未配置知识库同步，不声称 KB lint/index 通过）
- Defect grades: CRITICAL 0 / WARNING 0 / SUGGESTION 0
- Decision: **Pass**
- Waivers / conditions: 无
- Approvers: SA=用户 **TANTA6**（2026-11-19，本会话明确指示「直接定稿 G3」并以分支合并入 main 作为归档验收）
- Timestamp: 2026-11-19（Asia/Shanghai）

## 备注

- G2 残余风险（CI Backend tests 按变更检测跳过、tsc 不在 CI 门禁、无独立 CD、E2E 仅断言关键短语、提示仅内存）已在 `g2-decision.md` 记录为 accepted，G3 无新增风险。
- 合并 main（`dc2f285`）后 `agent-panel.tsx` 与 PR #148 入口视觉改动自动合并，`panelOpen` 隐藏气泡逻辑与「面板展开隐藏悬浮入口」共存，定向 E2E 已验证。
- 归档提交 `0f9c4f4` 与 main 同步 merge 提交 `23b89f7` 随本分支合入 main；本 G3 记录位于归档目录内，一并落地。
- 本记录不写分支 tip 哈希，以 `git log origin/main` 为准。