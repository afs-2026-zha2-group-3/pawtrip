# Change summary — add-nearby-location-filter

## Intent

REQ-012（US-12 垂直切片）：在激活行程已排期景点上选择锚点，按 5km 直线距离浏览餐厅和酒店；餐厅未选锚点时保留门禁，酒店默认展示列表。

## What shipped

- `GET /api/locations` 新增可选 `nearPoiId`：锚点校验、Haversine 5km（含边界）、候选无坐标排除、距离升序、过滤后分页、`distanceMeters`。
- 酒店类型新增“离景点最近”下拉；景点类型保留“行程景点锚点”选择器；两类共用锚点；餐厅未选锚点时门禁。
- 卡片显示“距{锚点名}约 X.Xkm”；锚点移出行程或行程切换时自动清空。
- E2E 夹具补充坐标与 5km 内外/无坐标样本；V23–V25 为珠海测试数据与真实性修正/JSON 补全（编号避让 main 的 V20）。
- E2E 适配双列布局下的行程面板遮挡（`withTripPanelNotBlocking`）。
- AI4SE 工件：REQ-012 需求/分析、P1–P4 DoV、G1/G2、consistency-lint、followups。

## Verify highlights

- 本地：后端 228 tests、前端 191 tests、build 通过。
- CI（PR #69）：Server 1m17s、Web 36s、Browser E2E 138 passed（10m52s），3/3 全绿。
- PR #69 squash 合并 `6c8f8e3`。
- Gates：G1 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）。

## Residual risks

- 恰好 5000m API 边界、景点页锚点不改变列表、行程切换清空锚点缺少直接自动化。
- 真实地图链路依赖有 Key 环境人工验证。
- 生产高德安全密钥仍为前端直连，需改代理。
- 距离筛选依赖地点经纬度维护。

## Links

- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/69
- Merge commit: `6c8f8e3`
- Local verify: `docs/ai4se-plugins/20261117-145634-local-verify-report.md`
- Pipeline report: `docs/ai4se-plugins/20261117-145634-pipeline-report.md`
- CI report: `ci-report.md`
- 决策记录：`g1-decision.md`、`g2-decision.md`、`g3-decision.md`
