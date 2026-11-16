# Proposal

## Why

`add-trip-planning` 已交付服务端 trip 持久化与 plan v1 契约，但前端仍以 `sessionStorage` 中的"已选目的地"和"旅游总天数"承载规划上下文：刷新靠会话级缓存、无法表达多天/地点顺序/未排期地点，也没有"激活行程"这一统一入口。页面之间（城市、景点、政策、交通规则）各自消费零散状态，带宠匹配仍按"第一只宠物"或"全部宠物"各自为政。本变更以前端 trip 上下文替换这套临时状态，让服务端 trip 成为唯一规划载体。

## What Changes

- **BREAKING** 移除 `pawtrip.selectedDestination` 与 `pawtrip.tripDuration` 两个 `sessionStorage` 键；`/cities` 不再以"输入天数后选定目的地"进入规划，改为"选定城市创建行程草稿"。
- 新增 TanStack Store 作为激活行程的运行时上下文：`draft`（未确认）、`active`（与 DB 同构的 trip）、`cache`（城市/宠物/地点详情）与面板 UI 状态；**localStorage 只持久化 `activeTripId`**，行程内容以 store 为准，刷新后按 id 重新拉取。
- 新增 Trips Tab（`/trips`）：列出全部已持久化行程，支持激活/取消激活/删除；同一时间最多一个激活行程，只有取消激活后才能创建新行程。
- 城市页选定城市后进入草稿态：左下角面板顶部以 tag 展示城市、天数（前端限 1–7）、宠物（单只），仅草稿期可编辑；确认后 `POST /api/trips` 落库并锁定。
- 激活行程后：`/cities` 只展示该城市详情；`/attractions` 只推荐该城市景点，天 tab 来自 `plan.days`；政策匹配统一为"有激活宠物则只匹配该宠物，否则匹配全部宠物"，并以宠物名 tag 展示结论。
- 行程面板使用 React Bits AnimatedList 组件悬浮于左下角；展开后高度铺满页面、宽度增大并使页面内容向右挤压；按天分组（含"未排期"），支持同天排序、跨天拖动与拖入/拖出未排期，同日允许同一地点重复。
- 景点加入行程支持"加入第 N 天"或"暂不排期"；确认前禁止添加地点。
- 已激活行程的计划编辑采用**乐观更新 + 约 600ms 防抖 `PUT`**，面板展示保存中/已保存/保存失败可重试。
- `/api/locations/attractions` 列表响应新增每项 `petPolicies`，使列表卡片能够按统一匹配主体展示逐宠物 tag（新增式字段，不破坏既有字段）。

## Capabilities

### New Capabilities

- `trip-context`: 前端激活行程上下文——TanStack Store 状态与 `activeTripId` 持久化、草稿/确认/激活/取消激活、Trips 页、左下角行程面板、计划编辑与自动保存、统一政策匹配主体。
- `trip-attractions`: 行程上下文下的景点浏览——按激活行程城市筛选、天 tab 与 `plan.days` 对齐、"加入第 N 天/暂不排期"入口、列表与详情按统一主体展示宠物 tag，以及列表 `petPolicies` 公开契约。

### Modified Capabilities

- `destination-selection`: `/cities` 在无激活行程时保持候选列表并支持创建草稿；有激活行程时只展示该城市详情；候选卡片匹配标签从"第一只宠物"改为逐宠物 tag；删除 `sessionStorage` 选定与天数要求。
- `web-app-shell`: 新增 Trips Tab 与路由同步；顶栏目的地 chip 由行程上下文替代；左下角行程面板的折叠/展开与内容右挤布局；登出清除 `activeTripId`。
- `transport-rules-comparison-page`: 存在激活行程且已绑定宠物时，「是否推荐」列只评估该宠物；否则保持逐只宠物评估。

## Impact

- 前端：新增 `lib/trip`（store、actions、selectors、持久化、统一匹配主体）、`routes/_authenticated/trips.tsx`、全局 `trip-panel`、AnimatedList vendor 组件与拖拽层；改造 `cities.tsx`、`attractions/*`、`destinations/$adcode/policy.tsx`、`transport-rules.tsx`、`__root.tsx`、`_authenticated.tsx`；删除 `lib/selected-destination.ts`、`lib/trip-duration.ts`。
- 后端：`LocationQueryController`/查询服务为景点列表增加 `petPolicies` 字段；不修改 trip 契约、不新增迁移。
- 依赖：新增 `@tanstack/store`、`@tanstack/react-store`（0.11.x）与 `@dnd-kit/core`、`@dnd-kit/sortable`（跨天拖拽）；AnimatedList 以 vendor 方式引入并移除默认 hugeicons 依赖。
- 测试：新增 store/匹配纯函数单测、Trips 与行程面板 Playwright 用例；重写 `destination-selection` 与 `trip-duration-input` 相关 E2E；补充景点列表 `petPolicies` 后端用例。
- 文档：更新 `docs/knowledge/architecture/README.md` 的前端 trip 上下文、统一政策匹配主体与景点列表契约。
- 风险：① 旧 `sessionStorage` 键与现有 E2E 断言需同步清理；② AnimatedList 为 vendor 组件，升级需手动合并；③ 拖拽与列表自身键盘/选中行为存在交互冲突，需要单独验证；④ 景点列表响应扩展需确认既有消费方兼容；⑤ 草稿不持久化，刷新即丢失，需要清晰的放弃/重进入口。