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
| REQ-005 | `openspec/changes/destination-selection/` | P1/P2 完成;G1 Pass(IO/SA=HARLAN HUANG,见 change 内 g1-decision.md);G1 Revision 已落实:档案=外部依赖(add-pet-schema),chip 保留;P3 完成;G2 Pass(IO/SA=HARLAN HUANG,见 g2-decision.md);P4 进行中(后端+前端 UT 绿,E2E 实现中);分支 `feat/destination-selection`(本地,不推送) |
