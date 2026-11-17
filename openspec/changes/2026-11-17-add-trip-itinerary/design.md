# Design

## Context

- 当前只支持一个激活行程，`active` 含 `startDate`、`totalDays`、`transportMode`、`plan`；登录后由详情接口恢复。
- 地点详情缓存在 `tripStore.cache.locations`，面板会为缺失 POI 拉取详情；日期只保存 `startDate`，结束日期由天数派生。
- 途内交通已有 `displayToNext`、`toNextLabels`、`routeEstimateQueryOptions` 与估算快照；政策提醒已有 `deriveDayPolicy` / `dayPolicyLines`。
- 食宿、应急、天气与景点排期时间尚无数据源。

## Goals / Non-Goals

**Goals:**

- 页面结构对齐产品稿：Day 切换 + 每天一条时间线 + 可展开政策。
- 复用既有日期、交通与政策口径，不引入第二套计算。
- 行程单独立成路由，后续导出直接复用同一页面。

**Non-Goals:**

- 不接入食宿、应急、天气与具体时间点，不伪造占位数据。
- 不做导出（US-49）、多目的地、打印样式与离线。
- 不改行程数据模型、后端接口或计划编辑流程。

## Decisions

### D1：行程单只读激活行程

页面从 `tripStore` 读取 `active`，与面板、Trips 激活状态同源；城市名优先取缓存，缓存未就绪时从 destinations 查询按 adcode 补全，避免激活时城市缓存未写入导致显示 adcode。destinations 查询仅在激活行程存在且城市缓存未命中时启用。行程恢复期间（`hydration` 为 `idle`/`loading`）展示「正在读取行程…」，只有恢复完成且确无激活行程（`missing` 或 `ready` 且 `active` 为空）时才展示空态，避免首屏空态闪烁；地点详情补拉队列在激活行程变化时重置。

替代方案：按 `tripId` 查询任意行程。需要额外拉取详情、地点与权限校验，且当前产品是单激活行程；后续导出若支持历史行程再扩展。

### D2：日期全部由 `startDate` 派生

每天日期 = `startDate + (day-1)`，用 UTC 自然日计算避免时区偏移；显示「M月D日 周X」。无 `startDate` 时只显示「第 N 天」。结束日期不存储、不读取独立字段。

### D3：Day 切换为本地状态

`Day 1…N` 使用 Tabs 组件，默认第 1 天，同一时刻只渲染一天；刷新后回到第 1 天。避免把展示状态写入 URL 或 store，保持行程数据纯净。

### D4：时间线模型由纯函数生成

`buildItinerary` 把每天展开为 `stop` 与 `transport` 交替的 entries：地点带名称、地址、`petPolicies`；交通段带起止 `poiId`、展示方式与快照估算。UI 只负责渲染，便于单测与后续导出复用。

估算优先使用 `toNextEstimate` 快照；缺失时行程单自行调用 `routeEstimateQueryOptions`，不依赖面板是否展开。打车显示携宠提示；同地点连续显示「与上一景点相同，无需途内交通」，且不展示提示、不发起估算；打车/步行展示费用，自驾只展示时长；失败显示「估算暂不可用」。

### D5：政策详情复用共享字段口径

每个地点用 `<details>/<summary>` 展开「详细携宠政策」，直接复用 `apps/web/src/lib/attraction-pet-rules.ts` 的 `petPolicyFields`，不维护第二套政策展示：`null` 不展示，布尔 `false` 展示「不需要」，数值与费用沿用既有格式化；无任何字段时显示「暂无详细规则」。不新增折叠组件或依赖。

### D6：导航归属 Trips

`/itinerary` 在主导航映射为 Trips 高亮；Trips 与行程单共用「我的行程 / 行程单」分段导航（`aria-current`），面板与激活行程卡片提供直达链接。

### D7：未接入板块直接隐藏

食宿、应急、天气在无数据源时不渲染任何空板块或占位；行程单不展示推测的时间点与商家。单城市口径下不展示跨城分段。

## Risks / Trade-offs

- **无具体时间**：时间线按顺序展示，不显示到达/离开时间；等排期时间数据接入后再补时间槽。
- **估算依赖高德**：接口失败时展示「估算暂不可用」，不阻塞行程单其余内容。
- **地点详情缺失**：页面自行补齐缺失 POI 详情；失败时以 poiId 兜底，不阻塞渲染。
- **打印/导出样式**：本变更未做，US-49 复用页面时再补。
- **单城市限制**：多目的地需求出现时需要扩展日期×城市模型。

## Migration Plan

纯前端新增页面，无数据迁移。回滚删除路由与入口即可。

## Test Strategy

- 单测：`buildItinerary` 覆盖日期跨月/跨年、Day 结构、交通段标签与快照、政策提醒、未排期、无 `startDate` 降级。
- E2E：无激活行程空态；未登录跳转 `/login`；面板与 Trips 激活卡片入口；Trips 高亮与分段导航；Day 切换；地点顺序；共享政策字段（含 `false` → 「不需要」与全 `null` → 「暂无详细规则」）；快照时长/费用、打车提示、估算失败、同地点连续、自驾仅时长；当天提醒与无提醒隐藏；未排期；食宿/应急/天气/具体时间点不渲染；刷新保留。
- 浏览器结构验证：Day tab、日期头、时间线与空天状态。
