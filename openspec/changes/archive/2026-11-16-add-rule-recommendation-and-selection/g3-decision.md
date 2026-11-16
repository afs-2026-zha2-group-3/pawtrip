# G3 decision — add-rule-recommendation-and-selection

- Gate: G3 (Merge & Archive)
- Change id: `add-rule-recommendation-and-selection`（REQ-008；原登记 REQ-007）
- Inputs:
  - living-merge / archive：`openspec archive add-rule-recommendation-and-selection --yes` 成功（在 REQ-007 之后执行，因本 change 的 delta 依赖 REQ-007 新建的 `transport-rules-comparison-page`）；Living Spec 更新 `transport-rules-comparison-page`（update, +2）；`openspec validate --specs` **16 passed / 0 failed**；`openspec list` 仅剩无关的 active change `destination-selection`
  - change-summary：`openspec/changes/archive/2026-11-16-add-rule-recommendation-and-selection/change-summary.md`
  - archive completeness：归档目录含 `proposal` / `design` / `tasks` / `g2-decision` / `change-summary` / `specs`（1 个 delta）；**无** `g1-decision` / `atdd-design` / `dov-ac-review`（见 Findings）
- Findings:
  - Merge：PR #46 已合并入 `main`（merge commit `39d0f2a`，来源分支 `feat/rule-recommendation-and-selection`，tip `38e47ff`）；PR base 已先由 `feat/transport-rules-comparison` 改为 `main`。
  - Conflicts：合并 REQ-007 分支时 `registry.md` / `handoff.md` / 上游 `g2-decision.md` 三处冲突，已手写解决，G3 时无残留冲突标记。
  - Archive completeness：**工件不齐但可追溯**。本 change 作为 REQ-007 的追加需求提出，未单独走 G1 / ATDD 设计 / DoV 复核；G1 决策随 REQ-007 一并记录，本 change 的验证以 `20261116-133200-local-verify-report.md` + `g2-decision.md` 为准。SA 在此明确：接受该缺口，不再补造 G1/ATDD 工件。
  - CI（E1）：三轮 push run 共 **10/10 job success**（Web / E2E / Server），headSha 与分支 tip 一致，证据见 `docs/ai4se-plugins/20261116-143430-pipeline-report.md`。
  - 本地验证：Overall **Partial**（V3 的 1 个失败态 scenario 缺自动化），非实现缺失；vitest 45 passed / 8 files，后端 `mvnw test` 75 tests BUILD SUCCESS，e2e 35 passed（退出码 1 为 REQ-007 遗留 `EBUSY`）。
  - Harness / Rules evolve needed？：无立即项。
  - 校验提示：本 change 的 delta 合并后 `transport-rules-comparison-page` 无 warning。
- Decision: Pass
- Conditions + owners: 无阻塞条件；G2 的 2 项延后条件随 change 结转（失败态 E2E 待档案页落地时补；`weightKg` / `shoulderHeightCm` 空值保护待后端字段放宽时补），owner=kitty，见 `g2-decision.md`
- Approvers: SA=kitty
- AO asks / follow-ups（附件，非 G3 条件）:
  - 后续 change 应把 `g1-decision` / `atdd-design` 列为归档完备性硬检查项，避免追加需求形成流程缺口。
  - 推荐判定只含体重/肩高/检疫证明三项硬条件，品种、笼具等维度留待后续。
- Timestamp: 2026-11-16T15:46:08+08:00

> 本记录依据具名 SA 的决定转写；Decision 由 kitty 作出，代理不代为决策。
