# REQ-019 Impact Brief — 地点选择下拉与地点卡片改版

- 生成日期：2026-11-19
- 上游需求：[REQ-019 地点选择下拉与地点卡片改版](../../requirements/REQ-019-location-select-dropdown-and-card-redesign.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：只改「地点浏览」导航项；酒店/餐厅默认全量列表；简介由后端新增字段；类型状态放 URL。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-019 | 地点选择下拉与地点卡片改版 | p1-ready | `requirements/REQ-019-location-select-dropdown-and-card-redesign.md` |

阻塞开放问题：0（4 blocking + 4 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-attractions/spec.md`
  - 「地点类型筛选」（197 行起）：页面提供单选类型筛选并默认景点；本需求改为导航下拉驱动，需 MODIFIED。
  - 「地点卡片封面与评分」（221 行起）：16:9 封面 + 地址行评分；本需求改为封面叠层 + 封面右下角评分徽标，需新增/修改卡片要求。
  - 「行程景点锚点选择」（313 行起）：酒店提供「离景点最近」；本需求保持并补充默认全量语义。
  - 「餐厅的选择门禁」（358 行起）：餐厅未选锚点时空态且不请求；本需求取消门禁，改名为「酒店与餐厅的默认列表与可选锚点」并 MODIFIED。
  - 「5km 附近筛选与距离展示」（393 行起）：保持不变。
- `openspec/specs/location-management/spec.md`：用户端封面/评分与详情坐标契约；本需求新增可空 `description` 字段。
- 变更包：`openspec/changes/2026-11-19-location-select-dropdown-and-card-redesign/`（proposal、tasks、两份 delta 已建立）。

**当前前端实现**

- `apps/web/src/routes/__root.tsx:203`：`TabsTrigger`「地点浏览」；`isAttractions` 依据 pathname 判断激活态；导航项文案被 `e2e/companion-hints.spec.ts:4` 与 `e2e/transport-rules.spec.ts:44` 断言。
- `apps/web/src/routes/_authenticated/attractions/index.tsx`
  - 路由当前已改为 `validateSearch` 读取 `type`（中间态代码）；类型常量 `TYPE_LABELS`、`NEARBY_TYPE_GROUPS` 已存在。
  - 门禁：约 104 行 `gated`；168/175/189/202 行用于查询 `enabled`；283 行加载判断；672/765 行门禁渲染分支。
  - 页内类型入口：328 行 `changeType`（仍引用已移除的 `setTypeGroup`，当前不可编译）、349 行 `enterNearbyLocations`、352 行 `backToAttractions`；573–655 行工具栏。
  - 标题：533 行景点固定「景点」，其余用类型目录 label（酒店显示「住宿」）。
  - 卡片调用：`LocationCard` 传入 `typeLabel`、`anchorName`、四个回调（483–500、782–800 行）。
- `apps/web/src/routes/_authenticated/attractions/-location-card.tsx`：封面 `aspect-[2.3]` + 标题 + keytag/评分行 + 政策标签 + 地址 + 「查看详情」「添加到行程」；无简介、无封面叠层、无「Day 1 +」。
- `apps/web/src/routes/_authenticated/attractions/-pet-friendly-badge.tsx`：浅色底徽标，未适配封面叠层。
- `apps/web/src/routes/_authenticated/attractions/-location-rating.tsx`：琥珀色内联评分，无圆形徽标形态。
- `apps/web/src/routes/_authenticated/attractions/-day-select.tsx`：触发器文案「添加到行程」，无紧凑「Day 1 +」形态；`aria-label` 已用于无障碍名称。
- `apps/web/src/routes/_authenticated/attractions/-location-detail-dialog.tsx`、`-map-location-card.tsx`：展示类型与地址，无简介。
- `apps/web/src/queries/locations.ts:36,62`：`LocationSummary` 与 `LocationBrowseDetail` 无 `description`。

**当前后端实现**

- `apps/server/.../PawtripLocation.java:32,122,185`：本轮已新增 `description` 字段、getter 与 `updateDescription`。
- `apps/server/.../LocationQueryResponses.java:25,77`：本轮已在列表与详情 record 中增加 `description`。
- `apps/server/src/main/resources/db/migration/V32__add_location_description.sql`：新增可空列并写入 21 条珠海/测试地点简介；注意 `B02F400HUL` 被更新两次（第 8、40 行），后写入的文案覆盖前者，P4 需删除重复。
- `LocationQueryApiTest.java:132,135,326`：本轮已补列表与详情简介断言；`scripts/seed-e2e-attractions.mjs:16,41,58,109,401,434` 已补种子简介。

**测试现状**

- `e2e/attraction-pet-rules.spec.ts:33,262,277`：按 `tab`「地点浏览」进入并断言激活态。
- `e2e/nearby-location-filter.spec.ts`：页内类型切换与锚点选择。
- `e2e/companion-hints.spec.ts:4`、`e2e/transport-rules.spec.ts:44`：导航文案数组含「地点浏览」。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| 主导航 | 固定 Tab「地点浏览」 | 改为「地点选择」下拉（景点/酒店/餐厅）；选择后导航到 `/attractions`（带 `?type=`） |
| 地点类型状态 | 组件内 state + 页内下拉 | URL `?type=` 驱动；移除页内「地点类型筛选」「返回景点选择」「选择住宿/餐厅」 |
| 酒店/餐厅门禁 | 餐厅未选锚点时空态且不请求 | 两类默认请求并展示全量列表；锚点可选 |
| 锚点筛选 | 酒店/餐厅「离景点最近」 | 保留；选后 5km 过滤与距离展示不变，酒店/餐厅共用锚点 |
| 卡片结构 | 封面 → 标题/keytag/评分 → 政策标签 → 地址 → 操作 | 封面叠层（宠物友好/keytag/评分徽标）→ 标题 → 简介 → 距离/政策标签 → 底部「Day 1 +」 |
| 卡片简介 | 地址行 | `description`，缺失回退地址 |
| 详情/地图卡 | 类型 + 地址 | 同步展示简介（缺失回退地址） |
| 后端数据 | 无 `description` | `V32` 新增可空列；列表/详情返回；珠海与 E2E 夹具补文案 |
| 前端契约 | `LocationSummary`/`LocationBrowseDetail` 无简介 | 增加 `description: string \| null`（详情可为可选可空） |
| Living Spec | 类型筛选 + 餐厅门禁 + 卡片封面/评分 + 导航 | MODIFIED「地点类型筛选」「地点卡片封面与评分」「行程景点锚点选择」；RENAMED + MODIFIED「餐厅的选择门禁」→「酒店与餐厅的默认列表与可选锚点」；ADDED「地点选择导航与类型页面」「地点卡片概览与简介」「地点简介字段」；web-app-shell MODIFIED「顶部居中横向导航」「Tab 与路由同步」 |

## 4. Blast radius

- **直接受影响**：顶部导航组件与激活态判断；地点页类型查询、工具栏、标题、门禁分支；地点卡片、徽标、评分、Day 选择控件；详情弹窗与地图卡；用户端地点列表/详情 DTO；`pawtrip_location` 表；相关 E2E 与种子脚本。
- **不受影响**：城市选择与激活行程、宠物政策匹配与标签计算、5km 过滤算法与排序、分页、搜索、keytag chips、地图加载与联动、加入行程/未排期保存、行程单与导出、管理端页面与接口。
- **兼容性**：`type` 缺省为景点，旧链接 `/attractions` 行为不变；`hotel`/`restaurant` 仍是既有 `typeGroup`；`description` 可空，旧数据无需回填；保留 `查看详情`、`添加到行程`、`离景点最近`、`显示全部地点`、`location-rating` 等可访问名与测试标识。
- **外部依赖**：无新增；简介不触发高德实时请求。
- **数据迁移**：`V32` 增加可空列，向后兼容；种子更新仅影响演示与 E2E 数据。

## 5. Artifact impact

- **Specs**：`trip-attractions` 新增 2 个要求、修改 3 个要求；`location-management` 新增 1 个要求。
- **Tests**：
  - 后端：`LocationQueryApiTest` 列表/详情简介断言（已写，P4 运行）。
  - 前端：导航下拉与 URL 类型联动、门禁移除、卡片简介回退的组件/单测（按仓库约定与实现同步补齐）。
  - E2E：更新 `attraction-pet-rules`、`nearby-location-filter`、`companion-hints`、`transport-rules` 的导航与类型辅助函数；新增酒店/餐厅默认列表与简介断言，计入 ≤30 上限。
- **Docs / KB**：P4 完成后更新 `docs/knowledge/interfaces/http-api.md` 的地点 `description` 字段；管理端无新接口。
- **OpenSpec**：变更包已建立；P1 完成后需人工 G1 评审，本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载「导航下拉 → URL 类型 → 门禁移除 → 卡片/简介 → 测试」。导航与页面类型共享同一状态契约，拆分会造成「有入口无页面」或「有页面无入口」的不可验收中间态。
- **Agile**：可拆 3 个薄故事：导航与类型页面（AC-1/2/7）→ 酒店/餐厅默认列表（AC-3/4）→ 卡片与简介（AC-5/6）。
- **依赖顺序**：后端 `description` → 前端契约 → 导航与 URL 类型 → 门禁移除与锚点保留 → 卡片/详情视觉 → E2E 与种子。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 导航下拉替代 Tab 破坏既有 E2E | 保留「地点选择」可访问名与当前类型文案；同步更新 4 个 spec 的导航辅助函数；其余导航不动 |
| 风险 R2 | URL 状态与请求/分页不一致 | `validateSearch` 白名单只接受 `hotel`/`restaurant`；类型变化重置页码；刷新/前进后退由路由驱动 |
| 风险 R3 | 移除门禁后空数据/慢请求暴露 | 恢复既有加载与空态；无已排期景点时锚点下拉禁用并提示；不作为门禁 |
| 风险 R4 | 酒店标题仍显示「住宿」 | 页面标题使用需求文案「酒店」；保留后端类型目录 label 供其他场景 |
| 风险 R5 | 卡片外观改动导致点击/拖拽/地图联动回归 | 保留卡片根 `data-slot`、可访问名与回调；`stopPropagation` 仅包裹操作区 |
| 风险 R6 | 详情/地图卡简介不一致 | 统一取值函数：`description ?? address ?? "地址未收录"` |
| 风险 R7 | 迁移重复更新同一 POI | `V32` 中 `B02F400HUL` 重复 UPDATE；P4 删除后一条，保留截图口径文案 |
| 风险 R8 | 当前分支存在半成品代码 | `index.tsx` 仍引用已移除的 `setTypeGroup` 与 `gated`；P1 不继续实现，P4 一次性收敛并通过编译/测试 |
| **blocker** | 无 | 无阻塞性未知依赖；`description` 可为空，无需数据回填 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`2026-11-19-location-select-dropdown-and-card-redesign`（已建立）。
- 理由：导航、URL 类型、门禁与卡片共享同一页面与查询契约；拆分会造成入口/页面/卡片不可独立验收。
- 规模预估：M；1 个导航组件改动 + 1 个页面状态改造 + 4 个卡片子组件 + 1 个迁移与 DTO + 种子与测试更新；无新依赖。
- 工作切片（change 内顺序）：T1 后端简介 → T2 前端契约 → T3 导航下拉与 URL 类型 → T4 门禁移除与锚点 → T5 卡片/详情视觉 → T6 测试与种子 → T7 验证与 OpenSpec 复验。
