# Design

## Context

地点页 `apps/web/src/routes/_authenticated/attractions/index.tsx` 当前是单列列表，使用共享 `GET /api/locations` 获取带经纬度和距离的地点摘要。项目已有服务端高德 Web 服务 Key（`AMAP_API_KEY`），但没有前端地图 SDK。高德官方要求 JS API 2.0 使用 Web端 JS API Key，并在 2021-12 后配合安全密钥；推荐通过 Loader 加载。详见 `docs/knowledge/external/README.md` 与高德官方 JS API 文档。

## Goals / Non-Goals

**Goals:**

- 用高德 JS API 2.0 在地点页展示当前筛选下的全部点位。
- 地图与列表共享筛选条件，marker 与卡片选中联动。
- 没有 JS Key 或 SDK 加载失败时，列表仍可用，地图显示明确占位。
- 不新增后端接口或数据库迁移，先把地图主链跑通。

**Non-Goals:**

- 押金/清洁费与宠物设施的数据建模；当前数据库没有对应字段，地图卡片不展示这两类信息。
- 地图样式精修、聚合、路线规划、定位、导航。
- 生产级安全密钥代理（本期先用 Vite 环境变量直连，生产需改为 `serviceHost` 代理）。
- 针对大地图数据的分页/裁剪服务端接口。

## Decisions

### D1. 使用高德 JS API 2.0，并通过 Vite 环境变量配置

- 使用 `VITE_AMAP_JS_KEY` / `VITE_AMAP_SECURITY_CODE`，Vite 通过 `envDir: "../.."` 读取仓库根目录 `.env`；只有 `VITE_` 前缀会暴露到前端。
- 采用自定义脚本加载器（`apps/web/src/lib/amap/loader.ts`），不新增 npm 依赖；设置 `window._AMapSecurityConfig` 后加载 `https://webapi.amap.com/maps?v=2.0&key=...`。
- 未配置 Key 时返回 `amap-missing-key`，地图组件显示占位；SDK 加载失败显示“地图加载失败”。
- 生产环境建议改为代理 `serviceHost`，避免安全密钥进入前端 bundle；本期先保证本地/演示可用。

### D2. 地图点位复用现有列表接口，前端取完所有分页

- 新增 `mapLocationsQueryOptions`：用 `pageSize=100` 请求 `GET /api/locations`，根据 `totalPages` 循环取完全部页面。
- 筛选参数与列表一致：`regionCode`、`typeGroup`、`petFriendlyOnly`、`nearPoiId`；地图不受列表当前页码影响。
- 备选方案：新增 `GET /api/locations/map` 轻量点位接口。当前单城单类型约几百条，前端 2–3 次请求即可；先不扩后端契约，数据量增长后再切换。

### D3. 桌面左右布局，地图列吸附

- 页面改为 `max-w-[1400px]`，桌面 `lg:grid-cols-[minmax(0,1fr)_420px]`；地图列 `lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)]`。
- 移动端单列，地图在列表下方，高度 `h-80`。
- 左侧仍保留现有筛选栏、卡片、分页和详情弹窗；地图是附加列，不改变列表数据流。

### D4. marker 与卡片通过 `mapFocusPoiId` 联动

- 页面新增 `mapFocusPoiId`，与详情弹窗的 `selectedPoiId` 分离。
- marker 点击设置 `mapFocusPoiId`，卡片显示高亮环；地图定位并打开基础 InfoWindow。
- 卡片新增“在地图查看”图标按钮，设置 `mapFocusPoiId`，地图定位到该 marker。
- InfoWindow 内容只展示名称、类型、地址和锚点距离；HTML 内容经过转义，避免地点名/地址注入。

### D5. 无 Key/加载失败降级

- `amapJsKey()` 为空时不请求地图点位、不加载 SDK，地图列显示“地图未配置”占位及环境变量提示。
- SDK 加载失败显示“地图加载失败”；列表和筛选完全不受影响。
- E2E 运行器强制设置空 Key，避免 CI 依赖高德外网 SDK 和瓦片。

### D6. 地图详情卡片复用现有 JSON 摘要字段

- InfoWindow 保留基础信息，并增加“查看详情”按钮；点击后关闭 InfoWindow，在地图列内打开 `MapLocationCard`。
- 卡片展示名称、类型、地址、锚点距离、首张照片、评分、商圈/标签、宠物政策、逐宠物结论和行程操作；照片与评分复用 REQ-013 已有的 `coverPhotoUrl`/`rating`，`keytag`/`businessArea` 从现有 `poi_json`/`business_json` 解析，不新增 schema 列。
- 共享详情接口不返回原始 `photos`、`business` 或 `poi` JSON；字段缺失时返回 `null`，卡片不伪造押金、清洁费或宠物设施。
- 测试地点 V23/V24 通过 V25 关联同名真实 POI 的 JSON，保证照片/评分可展示；开发库已直接更新。
- 备选方案：新增独立详情卡片接口。当前摘要字段足以支撑卡片，且避免额外 DTO/请求，不采用。

## Risks / Trade-offs

- [浏览器无法访问高德域名] → 地图加载失败，显示占位；列表仍可用。部署前需确认网络和域名白名单。
- [安全密钥暴露在前端 bundle] → 本期使用直连方案；生产需改为代理 `serviceHost`，并限制域名白名单。
- [点位分页请求次数随数据增长] → 当前单城单类型几百条，2–3 次请求可接受；后续可加地图专用轻量接口或聚合。
- [E2E 无法验证真实地图] → E2E 只验证无 Key 占位和列表回归；真实地图需在有 Key 的环境目视验证。
- [地图样式与设计稿不完全一致] → 本期只保证功能；样式精修和自定义 marker 后续再做。

## Migration Plan

1. 配置 `VITE_AMAP_JS_KEY` / `VITE_AMAP_SECURITY_CODE`（或先不配置，验证占位和列表）。
2. 前端部署后确认浏览器可访问高德域名、Key 域名白名单正确。
3. 回滚：移除地图列/组件即可；列表和筛选不依赖地图。
4. 无 schema 迁移；V25 仅关联测试地点的现有 `poi_json`/`business_json`，回滚可恢复测试 JSON。

## Open Questions

- 生产环境是否使用代理 `serviceHost`，还是继续直连安全密钥？
- 后续是否需要地图专用轻量点位接口/聚合？
- 地图弹窗的押金/清洁费与宠物设施何时补数据字段？当前照片/评分/商圈已通过现有 JSON 摘要字段展示；押金/清洁费和设施仍需新字段。
