# Tasks

## 1. 地图加载与配置

- [x] 1.1 新增高德 JS API 2.0 客户端加载器，支持 `VITE_AMAP_JS_KEY` / `VITE_AMAP_SECURITY_CODE`、重复加载复用、缺 Key 与加载失败错误；验证前端构建通过。
- [x] 1.2 配置 Vite `envDir` 读取仓库根目录 `.env`，更新 `.env.example` 与 README，说明 JS API Key 与服务端 Web 服务 Key 不同；验证构建和 E2E 环境变量生效。

## 2. 地图点位数据

- [x] 2.1 新增 `mapLocationsQueryOptions`：按 `pageSize=100` 循环取完全部分页，筛选参数与列表一致；新增查询单测验证两页合并与 URL。
- [x] 2.2 在地点页接入地图点位查询，随城市、类型、宠物友好/显示全部、锚点变化刷新；不改变列表分页数据流。

## 3. 地图组件与布局

- [x] 3.1 新增地图组件：marker、基础 InfoWindow、HTML 转义、选中定位、加载/无点位覆盖层；验证前端构建通过。
- [x] 3.2 将地点页改为桌面左列表右地图、地图列吸附，移动端地图在列表下方；验证既有 E2E 列表/筛选/详情用例通过。
- [x] 3.3 卡片新增“在地图查看”，地图 marker 点击与卡片高亮通过 `mapFocusPoiId` 联动；验证 E2E 占位和既有交互通过。

## 4. 降级与测试

- [x] 4.1 未配置 JS Key 时不请求地图点位、不加载 SDK，显示占位；E2E 强制空 Key，验证占位与列表可用。
- [x] 4.2 SDK 加载失败显示错误占位，不阻塞列表；由组件错误分支与占位文案覆盖。
- [x] 4.3 更新 OpenSpec 工件、README 与架构说明；运行前端单测、构建和受影响 E2E。

## 5. 真图验证

- [x] 5.1 在配置真实 Web端 JS API Key 和安全密钥、且浏览器可访问高德域名的环境中验证地图瓦片、marker、InfoWindow 和卡片联动；已通过 DOM/网络请求验证（SDK、瓦片、3 个 marker、InfoWindow、卡片定位），内嵌浏览器无可见表面，截图受限。

## 6. 地图详情卡片与摘要字段

- [x] 6.1 扩展公开详情接口：在既有 `coverPhotoUrl`/`rating` 上返回可选 `keytag`、`businessArea`，从 `poi_json`/`business_json` 解析；补 `LocationQueryApiTest` 验证摘要字段且不返回原始 `photos`/`business`/`poi`。
- [x] 6.2 InfoWindow 增加“查看详情”，点击关闭小气泡并打开 `MapLocationCard`；卡片展示照片、评分、商圈/标签、宠物政策、地址、距离和加入行程操作；前端单测与 build 通过。
- [x] 6.3 新增 V22 测试数据迁移，将 V20/V21 珠海测试地点关联同名真实 POI 的 `poi_json`/`business_json`，提供照片与评分；开发库已更新，后端 178 tests 通过。
- [x] 6.4 在配置 JS Key 的本地页面验证 marker → InfoWindow → “查看详情”卡片；卡片已打开并显示宠物政策、地址和加入行程操作。
- [ ] 6.5 重启本地后端后确认卡片展示照片与评分（当前运行中的后端仍是旧进程，接口尚未返回新增摘要字段）。
