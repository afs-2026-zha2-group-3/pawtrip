# G3 decision — add-intra-city-transport-estimate

- Gate: G3（Merge & Archive）
- Change id: `add-intra-city-transport-estimate`（REQ-011 途内交通推荐：打车/步行/驾车，含大交通自驾联动）
- Inputs:
  - living-merge 结果：`npx openspec archive add-intra-city-transport-estimate --yes` 成功，归档为 `openspec/changes/archive/2026-11-17-add-intra-city-transport-estimate/`；Living Spec 更新：`trip-context` +8 requirements、`trip-planning` ~1 MODIFIED、`trip-route-estimate` 新建（+3 requirements），合计 +11 / ~1 / -0
  - change-summary：`openspec/changes/archive/2026-11-17-add-intra-city-transport-estimate/change-summary.md`
  - 归档完备性证据：`openspec validate --all` → **26 passed / 0 failed**；原 change 目录 15 个工件（proposal/design/atdd-design/tasks/dov-ac-review/g1/g2/ci-report/change-summary/smoke 两件/3 份 delta specs/.openspec.yaml）全部随迁移入归档目录，无遗漏
  - G2：`g2-decision.md`（Pass，VL=tantine）；PR #67 已合并入 `main`
- Findings:
  - **合并结果**：PR #67 由 VL 确认后合并入 `main`（merge commit）；CI 证据工件与 G2 记录以纯 docs 提交直接推入 `main`（未触发 CI，路径过滤预期行为）。
  - **冲突处置**：合并 `origin/main`（+17 提交，含 startDate/行程确认弹窗重构）时 3 处冲突（`TripResponses.java`、`store.ts`、`requirement-workspace/handoff.md`）均已按双方语义合并解决；后续 E1 按 main 新交互适配并在 tasks 6.1 留痕，无静默行为漂移。
  - **归档完备性**：通过（见 Inputs）。
  - **KB update**：`scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured for this project.`（exit 0），按本仓既有政策记 `Skipped (not configured)`；**未声称** KB lint / index / 一致性通过。
  - **Harness / Rules 演进**：暂不需要单独演进。可选后续：`/sdd:evolve`（如沉淀「合并 main 后 E1 语义适配」为通用检查项）与 `/sdd:followups`（登记 reduced-motion SUGGESTION 与 E10 时间常量跟踪项），均不阻塞本次归档。
- Decision: **Pass**
- Conditions + owners: 无（Pass）。后续可选非阻塞项：
  1. reduced-motion 入场动画完全禁用（SUGGESTION，owner=待排期）
  2. E10 拖拽等待常量与 AnimatedList 动画参数联动（跟踪项，owner=测试维护）
- Approvers: SA=**HARLAN**（用户确认签署，2026-11-17）；AO asks：无
- Timestamp: 2026-11-17

## 备注

- 本记录位于归档目录内，随归档 PR 一并提交；registry/handoff 状态同步为 Archived。
- 分支 tip 哈希不写入本记录（G2/G3 Record Strategy），以 `git log origin/main` 为准。
