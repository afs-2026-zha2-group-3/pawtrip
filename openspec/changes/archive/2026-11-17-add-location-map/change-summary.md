# Change summary — add-location-map

## Intent

REQ-012 的地图扩展：地点页展示当前筛选下的全部点位，marker 与列表卡片联动，并提供地图详情卡片；无 JS Key 或 SDK 失败时降级为占位。

## What shipped

- 桌面左右布局（列表 + 地图），移动端地图在列表下方；地图点位复用 `GET /api/locations` 并按 `pageSize=100` 取完全部分页。
- marker 点击高亮列表卡片并打开 InfoWindow；“在地图查看”定位 marker；InfoWindow“查看详情”打开地图详情卡片。
- 详情卡片展示照片、评分、商圈/标签、宠物政策、地址、锚点距离与加入行程；复用 REQ-013 的 `coverPhotoUrl`/`rating`，新增 `keytag`/`businessArea` 摘要字段。
- 高德 JS API 2.0 加载器与 `VITE_AMAP_JS_KEY`/`VITE_AMAP_SECURITY_CODE` 配置；未配置或加载失败显示占位。
- V22 关联测试地点的真实 POI JSON（照片/评分）；无 schema 变更。
- AI4SE 工件：P3/P4 DoV、G1/G2、consistency-lint、followups。

## Verify highlights

- 本地：后端 228 tests、前端 191 tests、build 通过。
- CI（PR #69）：Server 1m17s、Web 36s、Browser E2E 138 passed（10m52s），3/3 全绿。
- 真实地图：SDK/瓦片/3 markers/InfoWindow 通过 DOM 与网络请求验证（内嵌浏览器截图受可见表面限制）。
- PR #69 squash 合并 `6c8f8e3`。
- Gates：G1 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）。

## Residual risks

- 真实地图链路（marker/InfoWindow/卡片联动/筛选刷新）无自动化，依赖有 Key 环境人工验收。
- 生产安全密钥仍为前端直连，需改 `serviceHost` 代理。
- 地图点位全量拉取的请求数随数据增长。
- V22 依赖开发库存在同名真实 POI，否则卡片缺少照片/评分。

## Links

- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/69
- Merge commit: `6c8f8e3`
- Local verify: `docs/ai4se-plugins/20261117-145634-local-verify-report.md`
- Pipeline report: `docs/ai4se-plugins/20261117-145634-pipeline-report.md`
- CI report: `ci-report.md`
- 决策记录：`g1-decision.md`、`g2-decision.md`、`g3-decision.md`
