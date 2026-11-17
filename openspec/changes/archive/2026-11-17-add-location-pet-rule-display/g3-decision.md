# G3 decision — add-location-pet-rule-display

- Gate: G3 (Merge & Archive)
- Change id: `add-location-pet-rule-display`
- Inputs:
  - Living merge / archive: `openspec archive add-location-pet-rule-display --yes`；归档到 `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/`；Living Spec 新增 `attraction-pet-rules`（6 requirements）并更新 `web-app-shell`（11 requirements）
  - Change summary: `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/change-summary.md`
  - Archive completeness: 归档目录包含 proposal、specs、design、tasks、ATDD、DoV、G1/G2、ci-report、change-summary 与 G3
  - Merge/CI: PR #50 squash 合并 `070c881`；最终 CI head `2d91bd2` 的 Browser E2E / Server / Web build 全绿
  - G1 Revision 3 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）
- Findings:
  - Merge: PR #50 已合入 main；REQ 编号从 REQ-008 改为 REQ-009（main 已占用 REQ-008）。
  - Conflicts: 合并 main 时解决导航、cities import、routeTree、registry/handoff 与 E2E 顺序冲突；采用 main PR #52 的 E2E admin 宠物隔离修复。
  - Archive completeness: 完整；change 已移入 archive；`attraction-pet-rules` 与 `web-app-shell` 的 delta 已合并。
  - Living Spec evolution: main 后续 PR #60 `feat/unify-location-browsing` 已将 `attraction-pet-rules` 更新为“激活行程 + 弹窗详情”语义，并把导航扩展为 6 个 Tab；本归档保留历史工件，Living Spec 以 main 最新为准。
  - Validation: 本 change 的归档工件有效；`openspec validate --all --strict` 另有 5 个既有 Purpose WARNING 与 main 的 active change `unify-location-browsing` 的 `trip-attractions` delta ERROR（非本变更引入，交由该 change 处理）。
  - Harness / Rules evolve needed?: 无立即项；后续建议见 AO 附件。
  - KB update: `Skipped (not configured)`（按 `scripts/README.md` 基线约定）；不声称 KB 校验通过。
- Decision: **Pass**
- Conditions + owners: 无；残余关注点：AC-2 依赖 US-48（SA）、默认列表依赖 `maxPetsPerPerson` 数据维护（PO/SA）、归档 PR 为 docs/spec-only（无产品代码变更）
- Approvers: SA=RANLE
- Timestamp: 2026-11-17T08:35:21+0800
- AO asks / follow-ups（附件，非 G3 条件）:
  - AC-2 行程内展示在 US-48 落地后接入。
  - 为 `allowed_pet_types` / 肩高补管理入口（另开需求）。
  - 既有 auth capability 的 Purpose 占位可另开文档清理。

> 本记录依据具名 SA 的明确决定转写；用户明确要求“归档G3”，决策由 SA=RANLE 作出，代理不代为决策。归档与 Living Spec 合并已完成。
