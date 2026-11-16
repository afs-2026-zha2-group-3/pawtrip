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
| REQ-006 | `openspec/changes/destination-selection/` | 原登记 REQ-005,main 已将 REQ-005 用于地点宠物政策,本需求改编号 REQ-006;P1–P4 完成;G1 Pass(IO/SA=HARLAN HUANG,见 change 内 g1-decision.md);G1 Revision 已落实:档案=外部依赖,chip 保留;G2 Pass(IO/SA=HARLAN HUANG,见 g2-decision.md);候选=全部城市级行政区,服务端搜索/限养数筛选,sessionStorage 选定,V14 政策迁移移除留 TODO;分支 `feat/destination-selection` |
| REQ-008 | `openspec/changes/add-location-pet-rule-display/` | Revision 3（2026-11-16）：公开页 DB-only；默认 `maxPetsPerPerson >= 1`；移除 `entry_policy`/`entry_note` 与迁移；详情展示现有 8 字段；新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入，城市浏览页不内嵌入口。P1–P3 已同步；P4 实现完成；本地验证 Pass；PR #50 CI 全绿（Browser E2E/Server/Web build）；**G1 Revision 3 Pass(IO=SUKI,SA=RANLE)**；**G2 Pass(VL=RANLE)**；合并后走 P5 归档；AC-2 延后 US-48；归档顺序需在 destination-selection 之后 |
