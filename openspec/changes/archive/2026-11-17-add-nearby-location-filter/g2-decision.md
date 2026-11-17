# G2 decision — add-nearby-location-filter

- Gate: G2 (Verify)
- Change id: `add-nearby-location-filter`
- Inputs:
  - Local verify: `docs/ai4se-plugins/20261117-145634-local-verify-report.md`（Overall Partial）
  - Pipeline: `docs/ai4se-plugins/20261117-145634-pipeline-report.md`（CI Pass，E1 全绿）
  - CI report: `openspec/changes/add-nearby-location-filter/ci-report.md`
  - PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/69
  - Head commit: `ab408e5`；Merge commit: `6c8f8e3`
- Dimension results:
  - Build: Pass（后端 228 tests、前端 191 tests、Vite build）
  - Static scan: n/a（仓库 CI 基线未配置独立 SAST/secret scan）
  - Code review: Pass（可选 `nearPoiId`、过滤后分页、页面内锚点状态、无 schema 越界）
  - Evidence: Partial（V3 的 3 个边界场景缺自动化；5.3 的 G2/G3 收尾）
  - CI: Pass（Server 1m17s / Web 36s / Browser E2E 138 passed）
  - CD: n/a（仓库无部署 workflow）
- Defect grades:
  - CRITICAL: 无
  - WARNING: 恰好 5000m API 边界、景点页锚点不改变列表、行程切换清空锚点缺自动化；真实地图链路依赖人工验证
  - SUGGESTION: 生产安全密钥代理、地图点位请求增长、距离数据维护
- Decision: **Pass**
- Waivers / conditions + owners: 无（Pass）；残余风险：3 个边界自动化缺口（owner: SA/VL）、真实地图人工验收（owner: VL）、安全密钥代理（owner: SA）、地点坐标数据维护（owner: PO/SA）
- Approvers: VL=RANLE
- Timestamp: 2026-11-17T15:00:00+0800

> 本记录依据具名人类签署人的明确决定转写；用户明确指示按 VL=RANLE 记录 G2 Pass。本地验证为 Partial，CI 全绿，残余风险已在 Inputs 中列明；代理不代为决策。
