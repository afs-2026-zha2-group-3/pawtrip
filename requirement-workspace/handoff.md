# Handoff — requirement workspace → OpenSpec

- **Workdir path:** `requirement-workspace/` (override if relocated)
- **OpenSpec changes root:** `openspec/changes/`
- **Rule:** Copy or link stabilized requirements into a change package. This
  workdir is never the long-term Living Spec authority (`openspec/specs/`).

| Artifact | Destination | Notes |
|---|---|---|
| `requirements/` entries | `openspec/changes/<id>/` proposal inputs | After `/sdd:pre-spec-req` |
| Ready / analysis packs | change package or archive | Project convention |

## Current mappings

| requirement | change package | status |
|---|---|---|
| REQ-001 | `openspec/changes/archive/2026-11-13-hello-world-greeting/` | G2 Pass;G3 Pass(SA=Echo Luo);已归档,Living Spec 已合并 |
| REQ-002 | `openspec/changes/archive/2026-11-13-refactor-data-access-and-query/` | G1 Revision 2 Pass、G2 Pass(IO/SA=Echo Luo)、G3 Pass(SA=Echo Luo);已归档,4 个 Living Spec 已合并 |
| REQ-003 | `openspec/changes/archive/2026-11-13-add-user-login/` | 已归档;G1 Pass(IO/SA=Echo Luo)、G2 Pass(VL=Echo Luo)、G3 Pass(SA=Echo Luo);PR #7、#8 已合并;Living Spec 已合并;KB update 文档化 SKIP |
| REQ-004 | `openspec/changes/archive/2026-11-13-refactor-web-ui-with-shadcn/` | G1 Pass(IO/SA=Echo Luo)、G2 Pass(IO/SA/VL=Echo Luo)、G3 Pass(SA=Echo Luo);PR #10、#11 已合并;已归档,3 个 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-005 | `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/` | Archived;G1 Pass;G2 Pass(VL=RANLE);G3 Pass(SA=RANLE);PR #37/#38 已合并;Living Spec 已同步 |
| REQ-006 | `openspec/changes/transport-pet-rules-comparison/` | G2 Conditional Pass(2026-11-16):P2 工件全覆盖(proposal/specs×3/design/tasks)、AC-DoV 复核 0 blocking Fail、ATDD 设计(仅 E2E)、P3 质量检查 Overall Pass;已实现(规则对比页 + 8 条规则，W4 已闭合)；本地验证 Overall Partial(`20261116-124503-local-verify-report.md`)；G2 记录 `g2-decision.md`；分支已推送，CI 全绿(机器证据，`20261116-143430-pipeline-report.md`)；PR #45 已建(base=main) |
| REQ-007 | `openspec/changes/add-rule-recommendation-and-selection/` | G2 Conditional Pass(2026-11-16):推荐列 + 交通方式单选 + `sessionStorage` 缓存；后端零改动(复用 `GET /api/pets`)；本地验证 Overall Partial(`20261116-133200-local-verify-report.md`)；G2 记录 `g2-decision.md`；分支已推送，CI 全绿(机器证据，同上一行报告)；依赖 REQ-006 先合并；PR #46 已建(base 先取 REQ-006 分支) |
