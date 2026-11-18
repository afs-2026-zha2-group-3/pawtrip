# Proposal

## Why

全局左下角浮动行程面板与 `/trips` 的行程卡片、`/itinerary` 的行程单内容重复；展开后会遮挡页面主内容，在「我的行程」页尤其明显（2026-11-18 评审截图）。同时 `/trips` 在存在激活行程时禁用「创建新行程」，与「新建即把激活态转到新行程」的实际诉求不符；页面内容直接铺在宠物底纹上，信息密度高时观感杂乱。

## What Changes

- **废弃浮动面板**：应用外壳不再渲染全局左下角行程面板；行程内容与拖拽编辑只在地点浏览页（`/attractions`）左栏内嵌的「每日景点行程」面板中完成。
- **内嵌面板补齐能力**：面板头部展示保存状态与「行程单」入口（行程单已创建时）；途内交通段行改用完整版（默认打车/驾车、估算、加载与失败态），删除仅用于浮动面板的紧凑版。
- **放开新建行程**：「我的行程」页在存在激活行程时仍可创建新行程，新行程创建成功后替换激活行程，原行程保留为普通卡片；未确认草稿仍阻止新建。
- **内容框载**：「我的行程」页内容改用与行程单页一致的 `PageFrame` 白卡容器，宠物背景图案不再直接透出。
- **规格同步**：移除 `web-app-shell` 的「行程面板与内容布局」；`trip-context` 移除「左下角行程面板」，新增内嵌面板与激活行程管理要求。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `web-app-shell`: 删除全局浮动行程面板及其展开/挤压布局要求。
- `trip-context`: 行程面板改为地点浏览页内嵌；`/trips` 允许在激活状态下创建新行程，并以白卡容器承载页面内容。

## Impact

- 前端：`apps/web/src/routes/_authenticated.tsx`（移除全局面板）、`apps/web/src/routes/_authenticated/trips.tsx`（PageFrame + 创建入口）、`apps/web/src/components/trip/trip-panel.tsx`（内嵌面板头部与完整版段行）、`apps/web/src/components/trip/transport-segment.tsx`（删除紧凑版）。
- 测试：`transport-segment.test.tsx`、`trip-panel-timeline.test.tsx`、`trip-panel-policy.test.tsx`；E2E `trips-panel`、`intra-city-transport`、`attractions-timeline-hints`、`itinerary`、`hospital-contact-copy`、`trip-helpers`。
- 无后端、表结构、迁移或依赖变更。
