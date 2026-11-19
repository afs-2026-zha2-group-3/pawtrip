---
id: REQ-019
title: 地点选择下拉与地点卡片改版
status: p1-ready
discovery: Go (2026-11-19)
sources:
  - ../intents/REQ-019-location-select-dropdown-and-card-redesign.md
  - openspec/specs/trip-attractions/spec.md
  - openspec/specs/location-management/spec.md
  - openspec/specs/web-app-shell/spec.md
  - apps/web/src/routes/__root.tsx
  - apps/web/src/routes/_authenticated/attractions/index.tsx
---

# REQ-019：地点选择下拉与地点卡片改版

## Discovery Decision

Go（2026-11-19，light intake）— 用户以截图明确要求：顶部「地点浏览」改为「地点选择」下拉（景点/酒店/餐厅），选择后进入对应类型页面；地点卡片按截图重构（封面叠层标签、评分徽标、简介、Day 添加入口）。三点澄清已确认：仅改该导航项；酒店/餐厅默认全量列表；简介由后端新增字段。与现有 Living Spec 的关系清楚：修改 `trip-attractions` 的类型入口（导航下拉替代页内筛选）与酒店/餐厅门禁，新增卡片概览与简介要求；修改 `location-management` 的用户端地点契约（新增可空 `description`）。不改变城市、行程、政策匹配、地图联动与导出的既有能力。

## 六字段

1. **id**：REQ-019
2. **statement**：已登录用户在顶部导航「地点选择」下拉中选择「景点」「酒店」或「餐厅」后，进入 `/attractions` 并看到对应类型的地点列表；当前类型由 URL `type` 查询参数表达（景点缺省、`hotel`、`restaurant`），刷新与前进/后退保持类型。酒店与餐厅直接展示激活行程城市下的全量已保存地点，不再因未选择锚点而门禁；「离景点最近」锚点筛选保留为可选，选中后按 5km 过滤并展示距离。地点卡片按截图展示：封面图上叠放宠物友好徽标、keytag 标签与评分徽标；封面下方展示名称、简介、距离与政策标签；底部右侧提供「Day 1 +」形态的添加入口，其无障碍名称为「添加到行程」。简介优先使用地点 `description`，缺失时回退地址；详情弹窗与地图详情卡同步展示简介。页内「地点类型筛选」「返回景点选择」「选择住宿/餐厅」入口移除，其余导航项与页面既有搜索、chips、分页、地图联动、加入行程能力保持不变。
3. **actors**：
   - 已登录用户：通过导航下拉切换地点类型，浏览与搜索卡片，添加地点到行程
   - 前端 `apps/web`：导航下拉、类型查询参数、卡片与详情/地图卡渲染
   - 后端 `apps/server`：地点列表与详情返回可空 `description`
   - 既有数据：`pawtrip_location` 新增可空列，珠海演示与 E2E 夹具补种子文案
4. **rationale**：当前类型入口藏在页内按钮与下拉中，用户需要先进入「景点」再跳到「住宿/餐厅」，且餐厅被锚点门禁挡住；把类型选择提升到主导航并让酒店/餐厅默认可见，能缩短路径并让页面标题与导航一致。卡片缺少简介与明确的添加入口，用户难以快速理解地点并完成「加入行程」，因此按截图统一信息层级。
5. **acceptance hints**：
   - AC-1：顶部导航存在「地点选择」下拉，选项为「景点」「酒店」「餐厅」；其余导航项文案与行为不变；选择后进入对应页面，下拉中对当前类型有选中标记
   - AC-2：`/attractions` 类型由 `?type=hotel|restaurant` 驱动，景点为 `/attractions`；刷新、前进与后退保持类型；列表标题分别显示「景点」「酒店」「餐厅」
   - AC-3：酒店与餐厅未选锚点时直接请求并展示激活行程城市的全量列表，不出现门禁空态；无已排期景点时「离景点最近」下拉禁用并提示
   - AC-4：「离景点最近」锚点筛选保留；选中后 5km 过滤与距离展示不变；清除后恢复全量；酒店与餐厅共用锚点，切换类型保留锚点并重置页码
   - AC-5：卡片封面叠放宠物友好徽标、keytag 标签与评分徽标；展示名称、简介、距离与政策标签；底部右侧「Day 1 +」入口可展开选择天或暂不排期，无障碍名称为「添加到行程」
   - AC-6：`pawtrip_location` 新增可空 `description`；用户端列表与详情返回该字段；缺失时卡片、详情弹窗与地图详情卡回退展示地址；简介不触发高德实时补拉
   - AC-7：页内不再出现「地点类型筛选」「返回景点选择」「选择住宿/餐厅」；搜索、keytag chips、显示全部地点、分页、地图联动、详情弹窗与加入行程行为保持
   - AC-8：E2E 与单测同步更新导航与类型切换选择器；新增酒店/餐厅默认列表、简介展示与回退断言
6. **links to evidence**：
   - 意图与截图口径：[intents/REQ-019-location-select-dropdown-and-card-redesign.md](../intents/REQ-019-location-select-dropdown-and-card-redesign.md)
   - 现有导航：[__root.tsx](../../apps/web/src/routes/__root.tsx#L203)
   - 地点页类型与门禁：[attractions/index.tsx](../../apps/web/src/routes/_authenticated/attractions/index.tsx)
   - 卡片与控件：[-location-card.tsx](../../apps/web/src/routes/_authenticated/attractions/-location-card.tsx)、[-pet-friendly-badge.tsx](../../apps/web/src/routes/_authenticated/attractions/-pet-friendly-badge.tsx)、[-location-rating.tsx](../../apps/web/src/routes/_authenticated/attractions/-location-rating.tsx)、[-day-select.tsx](../../apps/web/src/routes/_authenticated/attractions/-day-select.tsx)
   - 前端契约：[queries/locations.ts](../../apps/web/src/queries/locations.ts)
   - 后端契约：[LocationQueryResponses.java](../../apps/server/src/main/java/com/pawtrip/server/location/LocationQueryResponses.java#L25)、[PawtripLocation.java](../../apps/server/src/main/java/com/pawtrip/server/location/PawtripLocation.java#L32)
   - 迁移：[V32__add_location_description.sql](../../apps/server/src/main/resources/db/migration/V32__add_location_description.sql)
   - 既有 E2E：`e2e/attraction-pet-rules.spec.ts`、`e2e/nearby-location-filter.spec.ts`、`e2e/companion-hints.spec.ts`、`e2e/transport-rules.spec.ts`
   - 影响分析：[analysis/REQ-019/impact-brief.md](../analysis/REQ-019/impact-brief.md)、Deep-dive：[analysis/REQ-019/deep-dive.md](../analysis/REQ-019/deep-dive.md)
   - OpenSpec change：`openspec/changes/2026-11-19-location-select-dropdown-and-card-redesign/`

## Ready 形状

### Intent

让「地点浏览」成为可预期的地点选择入口：用户在顶部下拉中直接选择景点、酒店或餐厅，页面立即展示该类型；酒店与餐厅无需先选锚点即可浏览，需要距离参考时再选「离景点最近」。同时让每张卡片用封面、标签、评分、简介和「Day 1 +」把「这是什么地方、要不要加入行程」一次说清。

### Actors 与权限边界

- 已登录用户：可见并使用导航下拉与地点操作；权限与现有登录保护一致。
- 前端：只读消费现有地点类型、列表与详情接口；类型状态放在 URL。
- 后端：仅新增可空 `description` 列与响应字段；不改筛选、分页与权限语义。
- 管理端：不在本需求范围；管理端地点编辑不新增简介编辑能力。
- 外部服务：高德实时接口不参与简介生成或补拉。

### In / Out Scope

**In**

- 顶部导航「地点浏览」→「地点选择」下拉（景点/酒店/餐厅）
- `/attractions` 类型由 `?type=` 驱动；移除页内类型控件与门禁空态
- 酒店/餐厅默认全量列表；锚点筛选保留为可选
- 卡片封面叠层标签、评分徽标、名称、简介、距离/政策标签、「Day 1 +」入口
- 后端 `description` 列、列表与详情字段、珠海演示与 E2E 种子文案
- 详情弹窗与地图详情卡展示简介
- 相关 E2E 与单元测试同步

**Out**

- 新增或删除主导航项（除「地点浏览」→「地点选择」）
- 新增宠物医院/宠物用品店的导航入口
- 管理端简介编辑界面或简介自动生成/AI 摘要
- 改变 5km 半径、Haversine 计算、宠物友好筛选与排序规则
- 改变地图加载、列表联动、详情弹窗结构、加入行程与保存逻辑
- 卡片新增押金、清洁费或额外筛选 chips

### Scenarios + AC Hints

#### S1：导航下拉选择酒店（AC-1 / AC-2）

- **Given** 用户已登录并位于任意业务页面
- **When** 用户打开「地点选择」并选择「酒店」
- **Then** 页面进入 `/attractions?type=hotel`，列表标题显示「酒店」
- **And** 下拉中「酒店」为选中态

#### S2：刷新与回退保持类型（AC-2）

- **Given** 用户位于 `/attractions?type=restaurant`
- **When** 用户刷新页面或使用浏览器后退/前进
- **Then** 页面仍展示餐厅列表，标题为「餐厅」

#### S3：未选锚点浏览酒店与餐厅（AC-3）

- **Given** 用户尚未选择「离景点最近」锚点
- **When** 用户从下拉进入「酒店」或「餐厅」
- **Then** 页面直接请求并展示该城市的对应类型列表
- **And** 不显示门禁空态

#### S4：可选锚点筛选（AC-4）

- **Given** 激活行程第 1 天包含景点「长隆海洋王国」
- **When** 用户在酒店类型下选择该锚点
- **Then** 列表只显示 5km 内酒店并展示距离
- **And** 切换到餐厅仍沿用该锚点，页码回到第 1 页

#### S5：清除锚点（AC-4）

- **Given** 用户已选择锚点
- **When** 用户清除锚点
- **Then** 下拉恢复未选态，列表恢复全量

#### S6：卡片结构与加入行程（AC-5）

- **Given** 某地点有封面、评分、keytag 与简介
- **When** 用户浏览列表
- **Then** 封面叠放宠物友好徽标、keytag 与评分徽标
- **And** 展示名称、简介与可选距离/政策标签
- **And** 底部右侧「Day 1 +」入口可展开并加入指定天或暂不排期

#### S7：简介缺失回退（AC-6）

- **Given** 某地点 `description` 为 `null` 且存在地址
- **When** 卡片、详情弹窗或地图详情卡渲染
- **Then** 简介位置展示地址

#### S8：页内类型入口移除（AC-7）

- **Given** 用户位于任一地点类型页面
- **When** 页面渲染
- **Then** 不出现「地点类型筛选」「返回景点选择」「选择住宿/餐厅」
- **And** 搜索、chips、显示全部地点、分页与地图联动正常

### Constraints

- 类型选项仅「景点」「酒店」「餐厅」；「景点」对应 `/attractions`（无 `type` 参数）。
- 酒店、餐厅的 `typeGroup` 仍为 `hotel`、`restaurant`；标题使用需求文案「酒店」，不使用类型目录中的「住宿」。
- 锚点候选只来自激活行程 `plan.days[].stops`，按 `poiId` 去重，不含 `unscheduled`。
- 5km 过滤、距离升序与「距{锚点名}约 X.Xkm」保持不变。
- 简介字段可空；前端回退地址；无简介不触发外部请求。
- 保留既有可访问名与测试标识，避免无关 E2E 回归。
- 卡片视觉以截图为准：封面左上叠层标签、封面右下角评分徽标、卡片底部右侧「Day 1 +」入口；具体尺寸与配色由 P2 design 定稿。
- 遵循 `@rule:spec-first`；前端按仓库约定直接实现并同步测试（不红测先行），E2E 新增用例计入 ≤30 上限。

### Context

- 现有地点页以 `typeGroup` 本地 state + 页内下拉管理类型；本轮改为 URL 查询参数，刷新与前进/后退更可靠。
- 现有「地点类型筛选」下拉实际只列出酒店/餐厅；宠物医院/宠物用品店在基线页面并无入口，因此移除页内下拉不造成新的入口损失。
- `locationTypesQueryOptions` 仍可用于字典/标题，但不再驱动页内类型切换；P2 需同步修改 Living Spec「地点类型筛选」要求。
- 卡片已有封面、评分与政策标签组件；本次是重排与外观增强，不改变数据来源（`coverPhotoUrl`、`rating`、`keytag`、`petPolicies`）。
- 珠海演示与 E2E 夹具使用稳定 `poiId`；简介种子只覆盖这些地点，生产历史数据允许为 `NULL`。

### Affected Capabilities

- **MODIFIED** `trip-attractions`：新增「地点选择导航与类型页面」「地点卡片概览与简介」；修改「地点类型筛选」（导航下拉取代页内筛选）、「地点卡片封面与评分」（4:3 封面、封面右下角评分徽标、移除地址行）、「行程景点锚点选择」（酒店/餐厅默认全量、锚点可选）；将「餐厅的选择门禁」重命名为「酒店与餐厅的默认列表与可选锚点」并取消门禁。
- **MODIFIED** `location-management`：新增「地点简介字段」，用户端列表与详情契约增加可空 `description`。
- **MODIFIED** `web-app-shell`：修改「顶部居中横向导航」与「Tab 与路由同步」，导航由六个 Tab 改为五个 Tab + 「地点选择」下拉，`/attractions` 不选中 Tab 而由下拉保持激活态。
- 不改 `destination-selection`、`trip-planning`、`trip-context`、`trip-itinerary`、`paws-page` 的既有行为。
- 管理端能力不变（无简介编辑 UI）。

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 导航改造范围？ | Product | 已决（2026-11-19）：只把「地点浏览」改为「地点选择」下拉，其余导航不变 |
| OQ-2 | blocking | resolved | 选择酒店/餐厅后展示什么？ | Product | 已决：直接展示激活行程城市全量列表，不要求先选锚点 |
| OQ-3 | blocking | resolved | 卡片简介数据来源？ | Product | 已决：后端新增地点简介字段 |
| OQ-4 | blocking | resolved | 类型状态放在哪？ | SA | 已决：URL `?type=`（景点缺省），刷新/前进后退保持 |
| OQ-5 | non-blocking | resolved | 宠物医院/用品店入口？ | SA | 已决：下拉仅三项；基线页内筛选本就不含这两类，无新增入口损失；P2 同步修改 Living Spec |
| OQ-6 | non-blocking | resolved | 页内类型控件与锚点控件去留？ | SA | 已决：移除类型控件与门禁空态；保留「离景点最近」锚点筛选 |
| OQ-7 | non-blocking | resolved | 简介缺失如何展示？ | Dev | 已决：回退地址；详情弹窗与地图详情卡同口径 |
| OQ-8 | non-blocking | resolved | 评分与标签位置？ | Product | 已决：按截图，标签叠在封面左上，评分徽标在封面右下角，Day 入口在卡片底部右侧 |
