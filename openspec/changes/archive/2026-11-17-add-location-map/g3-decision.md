# G3 decision — add-location-map

- Gate: G3 (Merge & Archive)
- Change id: `add-location-map`
- Inputs:
  - Living merge / archive: `openspec archive add-location-map --yes`；归档到 `openspec/changes/archive/2026-11-17-add-location-map/`；Living Spec `trip-attractions` 新增 2 个 requirement
  - Change summary: `openspec/changes/archive/2026-11-17-add-location-map/change-summary.md`
  - Archive completeness: proposal、specs、design、tasks、ATDD、DoV、G1/G2、ci-report、change-summary、consistency-lint、followups
  - Merge / CI: PR #69 squash 合并 `6c8f8e3`；Server / Web / Browser E2E 3/3 全绿（E2E 138 passed）
  - G1 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）
  - Tasks: 6.5 已由接口测试、媒体 E2E 与人工验证闭环
- Findings:
  - Merge: PR #69 已合入 main；地图详情卡片复用 main 已有的 `coverPhotoUrl`/`rating`，仅新增 `keytag`/`businessArea`。
  - Conflicts: 与 REQ-013 的媒体字段和 E2E 夹具合并；V22 迁移编号让位为 V25。
  - Archive completeness: 完整；delta 已合并到 `trip-attractions`。
  - Living Spec evolution: 无需额外演进；真实地图人工验收与密钥代理进入 `followups.md`。
  - Validation: 归档前 `openspec validate add-location-map --strict` 通过；归档合并 `trip-attractions` +2 requirements 成功；归档后 `openspec validate --all --strict` 24 passed / 0 failed。
  - KB update: 未配置自动 KB 更新；外部 JS API 文档已手动更新。
  - Harness / Rules evolve needed?: 无立即项；真实地图人工验收清单可作为后续 harness 候选。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；残余关注点：真实地图链路人工验收（VL/SA）、生产密钥代理（SA）、V22 数据复核（VL）
- Approvers: SA=RANLE
- Timestamp: 2026-11-17T15:05:00+0800
- AO asks / follow-ups（附件，非 G3 条件）:
  - 补 mock `window.AMap` 的组件测试，覆盖 marker 联动与错误分支。
  - 生产环境改用 `serviceHost` 代理安全密钥。
  - 地图点位数据增长后引入轻量点位接口。

> 本记录依据具名 SA 的明确决定转写；用户明确指示现在归档并补 G3，决策由 SA=RANLE 作出，代理不代为决策。归档与 Living Spec 合并已完成。
