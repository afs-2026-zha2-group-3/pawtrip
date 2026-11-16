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
| REQ-007 | `openspec/changes/archive/2026-11-16-transport-pet-rules-comparison/` | 原登记 REQ-006,main 已将 REQ-006 用于「选择目的地」,本需求改编号 REQ-007;G1 Pass(2026-11-16,签署人 kitty,IO+SA 同人);G2 Conditional Pass(VL=kitty,见 `g2-decision.md`);PR #45 已合并(`e1169b4`);本地验证 Pass(前端 17 / 后端 63 / e2e 32),合并 main 后 vitest 39 passed,CI 全绿;G2 条件全部收口（窄屏 Tab 目视于 2026-11-16 转 accepted waiver）;G3 Pass(SA=kitty,2026-11-16);已归档,Living Spec 已合并(+12 requirements);KB update SKIP(未配置) |
| REQ-008 | `openspec/changes/archive/2026-11-16-add-rule-recommendation-and-selection/` | 原登记 REQ-007,因规则页需求改为 REQ-007 而顺延为 REQ-008;G2 Conditional Pass(2026-11-16):推荐列 + 交通方式单选 + `sessionStorage` 缓存；后端零改动(复用 `GET /api/pets`)；本地验证 Overall Partial(`20261116-133200-local-verify-report.md`)；G2 记录 `g2-decision.md`；依赖 REQ-007 已合并（PR #45）；PR #46 已合并入 `main`（`39d0f2a`）；G2 剩余 2 项条件为延后执行，不阻塞 G3;G3 Pass(SA=kitty,2026-11-16);已归档,Living Spec 已合并(+2 requirements);无独立 g1-decision/atdd-design/dov-ac-review（缺口已由 SA 接受） |
| REQ-009 | `openspec/changes/add-location-pet-rule-display/` | 原登记 REQ-008，因 main 已将 REQ-008 用于规则推荐，2026-11-16 合并时改编号为 REQ-009；Revision 3：公开页 DB-only；默认 `maxPetsPerPerson >= 1`；移除 `entry_policy`/`entry_note` 与迁移；详情展示现有 8 字段；新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入；P1–P3 同步；P4 实现完成；本地验证 Pass；PR #50 CI 全绿；G1 Revision 3 Pass(IO=SUKI,SA=RANLE)；G2 Pass(VL=RANLE)；合并后 P5 归档；AC-2 延后 US-48；归档顺序需在 destination-selection 之后 |
