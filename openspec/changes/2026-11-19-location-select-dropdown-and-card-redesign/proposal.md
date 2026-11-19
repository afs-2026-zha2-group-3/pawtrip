# Proposal

## Why

地点浏览页的类型入口目前藏在页内「选择住宿/餐厅」按钮与「地点类型筛选」下拉里，景点卡片也没有设计图要求的封面叠层标签、评分徽标、简介与 Day 添加入口（2026-11-19 用户截图与诉求）。用户希望在顶部导航直接以「地点选择」下拉切换景点、酒店、餐厅，并让酒店/餐厅选中后直接展示该城市全量列表，而不是先被锚点门禁挡住。

## What Changes

- 顶部导航「地点浏览」改为「地点选择」下拉，包含景点、酒店、餐厅三个选项；选择后进入 `/attractions` 的对应类型页面。其余导航项保持现状。
- `/attractions` 的地点类型由 URL 查询参数 `type` 驱动（`attraction` 缺省、`hotel`、`restaurant`），刷新与前进/后退保持类型；移除页内「地点类型筛选」「返回景点选择」与「选择住宿/餐厅」入口。
- 酒店、餐厅选中后直接请求并展示激活行程城市下的全量列表；「离景点最近」锚点筛选保留为可选，选中后仍按 5km 过滤并展示距离。餐厅不再因未选锚点而门禁。
- 地点卡片按设计图重构：封面图叠加宠物友好徽标、`keytag` 与评分徽标；标题、简介、距离与政策标签；底部右侧提供「Day 1 +」添加入口。详情弹窗与地图详情卡同步展示简介。
- 后端 `pawtrip_location` 新增可空 `description` 列；用户端地点列表与详情返回 `description`，前端在缺失时回退到地址。为珠海演示与 E2E 夹具补齐简介文案。
- 同步更新 E2E 与单元测试中的导航、类型切换与卡片选择器。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`：新增「地点选择导航与类型页面」「地点卡片概览与简介」；修改「地点类型筛选」为导航下拉驱动，修改「地点卡片封面与评分」为 4:3 封面叠层与封面右下角评分徽标，修改「行程景点锚点选择」为酒店/餐厅默认全量、锚点可选；将「餐厅的选择门禁」重命名为「酒店与餐厅的默认列表与可选锚点」并取消门禁。
- `web-app-shell`：修改「顶部居中横向导航」与「Tab 与路由同步」，导航由六个 Tab 改为五个 Tab + 「地点选择」下拉，`/attractions` 不选中 Tab 而由下拉保持激活态。
- `location-management`：新增「地点简介字段」要求，共享地点列表与用户详情契约增加可空 `description`。

## Impact

- **后端**：`PawtripLocation`、`LocationQueryResponses`、`LocationQueryService`、Flyway `V31` 迁移；`apps/server` 测试夹具与断言。
- **前端**：`apps/web/src/routes/__root.tsx`（导航下拉）、`routes/_authenticated/attractions/index.tsx`（类型参数与门禁移除）、`-location-card.tsx`、`-pet-friendly-badge.tsx`、`-location-rating.tsx`、`-day-select.tsx`、`-location-detail-dialog.tsx`、`-map-location-card.tsx`、`queries/locations.ts`。
- **测试与种子**：`scripts/seed-e2e-attractions.mjs`、`e2e/attraction-pet-rules.spec.ts`、`e2e/nearby-location-filter.spec.ts`、`e2e/companion-hints.spec.ts`、`e2e/transport-rules.spec.ts`。
- **依赖**：无新增依赖。
