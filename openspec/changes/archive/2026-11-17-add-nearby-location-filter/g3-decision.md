# G3 decision — add-nearby-location-filter

- Gate: G3 (Merge & Archive)
- Change id: `add-nearby-location-filter`
- Inputs:
  - Living merge / archive: `openspec archive add-nearby-location-filter --yes`；归档到 `openspec/changes/archive/2026-11-17-add-nearby-location-filter/`；Living Spec `trip-attractions` 新增 4 个 requirement
  - Change summary: `openspec/changes/archive/2026-11-17-add-nearby-location-filter/change-summary.md`
  - Archive completeness: proposal、specs、design、tasks、ATDD、DoV、G1/G2、ci-report、change-summary、consistency-lint、followups
  - Merge / CI: PR #69 squash 合并 `6c8f8e3`；Server / Web / Browser E2E 3/3 全绿（E2E 138 passed）
  - G1 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）
  - Local verify: `docs/ai4se-plugins/20261117-145634-local-verify-report.md`（Overall Partial，残余风险已列明）
- Findings:
  - Merge: PR #69 已合入 main；rebase 处理了 main 的新提交（V20 让位为 V23–V25、封面/评分字段收敛为 `coverPhotoUrl`/`rating`、E2E 面板遮挡适配）。
  - Conflicts: 主要冲突为 `handoff.md` 与迁移编号；已按 main 优先、REQ-012 追加解决。
  - Archive completeness: 完整；delta 已合并；两个 change 均在 `2026-11-17-add-*` 归档目录。
  - Living Spec evolution: 无需额外演进；后续自动化缺口进入 `followups.md`。
  - Validation: 归档前 `openspec validate add-nearby-location-filter --strict` 通过；归档合并 `trip-attractions` +4 requirements 成功；归档后 `openspec validate --all --strict` 24 passed / 0 failed。
  - KB update: 未配置自动 KB 更新；`docs/knowledge/architecture/README.md` 与 `docs/knowledge/external/README.md` 已手动更新。
  - Harness / Rules evolve needed?: 无双击问题；行程面板遮挡建议后续调整布局或折叠态高度。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；残余关注点：3 个边界自动化缺口（SA/VL）、真实地图人工验收（VL）、生产密钥代理（SA）、地点坐标数据维护（PO/SA）
- Approvers: SA=RANLE
- Timestamp: 2026-11-17T15:05:00+0800
- AO asks / follow-ups（附件，非 G3 条件）:
  - 补 5000m API 边界、景点页锚点不改变列表、行程切换清空锚点的自动化。
  - 评估双列布局下行程面板遮挡卡片按钮的 UI 修复。
  - 生产高德安全密钥改用代理方案。

> 本记录依据具名 SA 的明确决定转写；用户明确指示现在归档并补 G3，决策由 SA=RANLE 作出，代理不代为决策。归档与 Living Spec 合并已完成。
