## Why

登录后所有页面的滚动都发生在文档根上，顶部导航会随页面滚走；地点浏览页再用 `100svh - 80px` 硬编码抵消 header，而外层 `min-h-svh` 使文档始终多出 80px，导致地图与 header 一起滚动、出现“假滚动”。需要把固定导航与滚动归属收进应用外壳，让每个页面只滚动真正需要滚动的区域。

## What Changes

- 应用外壳改为固定高度壳层：`body` 占满视口且不滚动，顶部导航固定在滚动区外，内容区作为默认滚动视口（`flex-1 min-h-0 overflow-y-auto`）。
- 移除 `100svh - 80px`、`100svh - 280px` 等 header 高度硬编码，改用 flex 高度分配。
- 地点浏览页（`lg+`）：行程面板、地点列表、地图三栏定高；仅地点列表与行程面板内容各自滚动，地图固定并吃满可用高度。
- 普通页面（首页、我的宠物、城市浏览、交通规则、我的行程、行程单、管理页、政策详情）只有内容区滚动；我的宠物与首页在常规视口下不出现滚动条。
- 矮视口兜底：内容超出时允许内容区滚动，不做强制裁剪。
- 打印 / PDF 导出：`@media print` 把壳层恢复为普通文档流，保证行程单完整分页导出。
- 政策详情页 `#banned-breeds` 锚点滚动改由内容滚动容器承担，对应 e2e 断言同步调整。
- 顶部导航在窄屏支持横向滚动，避免被 `overflow-hidden` 裁切。
- 城市浏览页 sticky 政策面板的 `max-h` 改为相对内容滚动区计算。
- 移动端（`<lg`）地点浏览保持内容区整体滚动，不引入多栏固定。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `web-app-shell`: 新增“固定外壳与分区滚动”要求，明确顶部导航固定在滚动区外、内容区为默认滚动视口、各页面滚动归属、矮视口兜底与打印重置。
- `trip-attractions`: 修改“地点浏览与 Agent 面板的自适应布局”要求，明确 `lg+` 三栏定高、地图固定、仅地点列表与行程面板内部滚动，并移除 header 高度偏移假设。

## Impact

- 前端布局：`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/_authenticated.tsx`、`apps/web/src/styles.css`、`apps/web/src/routes/_authenticated/attractions/index.tsx`、`apps/web/src/components/trip/trip-panel.tsx`、`apps/web/src/routes/_authenticated/cities.tsx`、`apps/web/src/components/layout/page-frame.tsx` 及相关页面容器。
- 测试：`e2e/destination-selection.spec.ts` 的锚点滚动断言；地点浏览分区滚动与打印相关断言需补充或调整。
- 无后端 API、数据库与依赖变更。
