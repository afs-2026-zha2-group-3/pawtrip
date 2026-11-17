# G3 decision — add-city-personalized-recommendation

- Gate: G3 (Merge & Archive)
- Change id: `add-city-personalized-recommendation`（归档目录 `2026-11-17-add-city-personalized-recommendation`）
- Inputs:
  - living-merge / archive: 归档 PR #95（`archive/city-recommendation-and-itinerary-export` → main）；`npx openspec archive add-city-personalized-recommendation --yes` 成功；Living Spec `destination-selection`（+3 Requirement）与 `paws-page`（+1 新增 / ~1 修改）已同步；`openspec validate --all` 26 passed / 0 failed；`openspec list` 仅剩 main 自带的 `2026-11-17-city-browse-policy-panel`（非本分支范围）
  - change-summary: 归档目录 `change-summary.md`
  - archive completeness: proposal、design、tasks（30/30 [x]）、ATDD、DoV、alignment、G1/G2 决策、spec delta 与 change-summary 齐备；CI 证据共用同分支 `2026-11-17-export-itinerary-pdf/ci-report.md`
- Findings:
  - Merge: 功能 PR #93 已 merge 合入 main（`bfadb49`）；CI 证据 PR #94 已合入（`c03f536`）。
  - Conflicts: 两次 main 同步冲突均已解决并全量复验（cities.tsx 分页×REQ-014、Flyway V26→V28）。
  - Archive completeness: 完整；change 已移入 `openspec/changes/archive/2026-11-17-add-city-personalized-recommendation/`。
  - KB update: `scripts/kb-lint.sh` 输出 SKIP（not configured），按既有政策记为 Skipped，不声称 KB 已校验；词表登记 `domain/city-feature-tags.md` 与 http-api.md 已随功能 PR 合入。
  - Harness / Rules evolve needed?: 无立即项；可选 follow-up 见下。
  - 说明：归档 PR 为 openspec/requirement-workspace-only，不匹配三个 workflow 的 path filter，head 与合并后均无 CI run——属预期；产品代码与 CI 全绿的 PR #93 一致。
- Decision: Pass
- Conditions + owners: 无
- Approvers: SA=SUKI（用户 2026-11-17 交互指定并批准）
- AO asks / follow-ups（附件，非 G3 条件）:
  - 同分城市拼音序需求（当前口径为服务器码点序，已注明）。
  - 多宠偏好综合打分（当前取第一只）。
  - CI secret-scan/SAST/audit 缺口（仓库级，另立 change）。
- Timestamp: 2026-11-17T23:25:00+0800

> 本记录依据具名 SA 的明确决定转写；决策由 SUKI 作出，代理不代为决策。