# G3 decision — admin-edit-location-pet-policies

- Gate: G3 (Merge & Archive)
- Change id: `admin-edit-location-pet-policies`
- Inputs:
  - living-merge / archive: PR #38（`archive/admin-edit-location-pet-policies`）；Living Spec `openspec/specs/location-management/spec.md` 已同步两个新增 Requirement；`openspec validate --specs` 14 passed / 0 failed；`openspec list --json` 无 active change
  - change-summary: `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/change-summary.md`
  - archive completeness: 归档目录包含 proposal、design、tasks、ATDD、DoV、G1/G2 决策、ci-report、spec delta 与 change-summary
- Findings:
  - Merge: 功能 PR #37 已 squash 合入 main（`dcb4690`）。
  - Conflicts: 无。
  - Archive completeness: 完整；change 已移入 `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/`。
  - Harness / Rules evolve needed?: 无立即项；可选 follow-up 见下。
  - 说明：归档 PR #38 为 docs/spec-only，head 无 CI check；产品代码与 CI 全绿的 PR #37 一致。
- Decision: Pass
- Conditions + owners: 无
- Approvers: SA=RANLE
- AO asks / follow-ups（附件，非 G3 条件）:
  - 后续需求考虑暴露上游 `allowedPetTypes` / `maxSinglePetShoulderHeightCm`。
  - US-17 / US-25 的公共页面与行程内政策展示。
  - 本机 Maven wrapper 缓存对齐问题可另开工具链修复。
- Timestamp: 2026-11-16T13:25:20+0800

> 本记录依据具名 SA 的明确决定转写；决策由 RANLE 作出，代理不代为决策。
