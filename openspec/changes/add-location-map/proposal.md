# Proposal

## Why

地点页已经有经纬度、5km 距离筛选和列表卡片，但没有地图，用户无法直观看到点位分布。现有地点坐标来自高德 GCJ-02，与高德 JS API 2.0 坐标系一致，可以在前端直接渲染地图和 marker。

## What Changes

- 在地点页增加右侧地图：桌面端左右布局、地图列吸附；移动端地图放在列表下方。
- 地图显示当前城市、地点类型、宠物友好/显示全部、锚点 5km 筛选下的全部点位，而不是只显示当前列表页。
- 地图点位通过现有 `GET /api/locations` 分页拉取（`pageSize=100` 循环取完），不新增后端 schema 或 API。
- marker 点击后高亮对应列表卡片并打开基础 InfoWindow（名称、类型、地址、距离）；卡片新增“在地图查看”按钮，点击后地图定位到该 marker。
- InfoWindow 增加“查看详情”：点击后关闭气泡，在地图列内打开详情卡片，展示首张照片、评分、商圈/标签、宠物政策、地址、锚点距离和加入行程操作；缺失字段不伪造。
- 共享地点详情接口在既有 `coverPhotoUrl`/`rating` 上增加可选 `keytag`、`businessArea` 摘要字段，不返回原始 `photos`/`business`/`poi` JSON。
- 通过 `VITE_AMAP_JS_KEY` 和 `VITE_AMAP_SECURITY_CODE` 配置高德 JS API 2.0；未配置或加载失败时显示地图占位，列表功能不受影响。
- 押金/清洁费与宠物设施当前数据库没有对应字段，本期不展示、不伪造；地图样式精修仍不做。

## Non-Goals

- 不新增押金/清洁费与宠物设施字段，也不在地图卡片展示或伪造这两类信息。
- 不做地图样式精修、聚合、路线规划、定位与导航。
- 不在本期实现生产级安全密钥代理（`serviceHost`），生产方案另立。
- 不新增地图专用点位接口、数据库 schema 或迁移。
- 不以 CI 依赖高德外网 SDK 作为验收方式；真实地图由有 Key 环境人工验证。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`：地点页新增地图展示、地图 marker 与列表卡片联动，以及无高德 JS Key 时的降级占位。

## Impact

- **前端**：地点页、地点卡片、新的地图组件与高德加载器、地点查询中的地图点位查询；Vite 环境变量与 E2E 运行器。
- **后端**：地点详情响应在既有 `coverPhotoUrl`/`rating` 上增加 `keytag`/`businessArea` 摘要字段；从现有 `poi_json`/`business_json` 解析，不新增 schema 列。
- **数据库**：V22 将珠海测试地点关联真实 POI 的 `poi_json`/`business_json`，用于卡片照片/评分展示；无 schema 变更。
- **外部依赖**：高德 JS API 2.0，需要 Web端 JS API Key 和安全密钥；需要浏览器访问高德域名并配置域名白名单。E2E 强制不配置 Key，避免依赖外网 SDK。
