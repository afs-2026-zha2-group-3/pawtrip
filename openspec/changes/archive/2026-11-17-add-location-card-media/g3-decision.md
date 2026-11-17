# G3 decision — add-location-card-media

- Gate: G3 (Merge & Archive)
- Change id: `add-location-card-media`（REQ-013）
- Inputs:
  - Living merge / archive: delta 全 ADDED，内联合并至主 spec——`trip-attractions` +3 requirements（地点卡片封面与评分 / 地点卡片限制费用与政策说明行 / 详情弹窗媒体同步）、`location-management` +1 requirement（用户端地点封面与评分字段）；归档到 `openspec/changes/archive/2026-11-17-add-location-card-media/`
  - Change summary: `change-summary.md`
  - Archive completeness: 归档目录包含 proposal、specs×2、design、tasks、atdd-design、dov-ac-review、alignment-self-check、G1/G2/G3 与 change-summary
  - Merge/CI: PR #65 合并入 main（`fe472ab`，head `791e90f`，2026-11-17T04:53:21Z）；Browser E2E / Server tests / Web build 三条 CI 全 SUCCESS
  - G1 Pass（IO=Kitty，SA=Leo，2026-11-17）；G2 Pass（VL=Scott，2026-11-17）
  - Local verify: `docs/ai4se-plugins/20261117-132353-local-verify-report.md`（Overall Pass：后端 177 / vitest 117 / E2E 108 全绿）
- Findings:
  - Merge: PR #65 已合入 main；无合并冲突遗留（main 侧 E2E 种子口径已在 `e8ad018` 合并时采纳）。
  - Archive completeness: 完整；tasks 13/13 全勾选；工件 4/4 done。
  - Living Spec evolution: 两份主 spec 标题与 Purpose 原样保留，仅追加 ADDED 需求；同步后 `location-management` strict 通过，`trip-attractions` 仅剩既有 TBD Purpose 占位 WARNING（非本变更引入）。
  - Validation: `openspec validate "add-location-card-media" --strict` 通过；`openspec validate --specs --strict` 17 passed / 6 failed，6 个 failed 均为既有问题（backend-authentication / city-management / frontend-authentication / trip-attractions / trip-context 的 TBD Purpose 占位，trip-planning 的既有长需求文本），交由后续文档清理，不阻塞本归档。
  - Harness / Rules evolve needed?: 无立即项。
  - KB update: `Skipped (not configured)`；不声称 KB 校验通过。
- Decision: **Pass**
- Conditions + owners: 无；残余关注点：上游照片 URL 可用性与评分快照时效为已接受权衡（IO/SA）、既有 TBD Purpose 占位另开文档清理（SA）、390px 行程面板抽屉与主导航间距为既有 UI 观察项（SA 排期）
- Approvers: SA=Leo
- Timestamp: 2026-11-17（Asia/Shanghai）

> 本记录依据用户指定角色签署：SA=Leo；用户明确指示「归档」，归档与 Living Spec 合并随本记录执行。