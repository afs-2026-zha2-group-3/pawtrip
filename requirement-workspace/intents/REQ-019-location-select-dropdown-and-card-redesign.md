# REQ-019 原始意图：地点选择下拉与地点卡片改版

> 来源：用户 2026-11-19 截图 + 文字诉求；编号 REQ-019（REQ-018 之后顺延）。分支 `feat/location-select-dropdown-cards`（自 `main` 拉取）。
> 用户随后要求「先走P1」，本文件仅固化意图与已确认口径，不进入实现。

## 用户原话（摘要）

> 拉取新分支，修改地点浏览的页面。如图所示：地点浏览改为地点选择下拉框，包含景点、酒店、餐厅，选择任意一个显示对应的页面。另外景点等卡片也需要按照如图所示修改。

参考截图要点：

- 顶部导航原「地点浏览」变为「地点选择」下拉，选项为「景点」「酒店」「餐厅」。
- 地点卡片：封面图；封面左上叠放「宠物友好」等标签；封面右下角评分徽标；标题；一句简介；卡片底部右侧「Day 1 ⊕」添加入口。
- 列表区标题、搜索框与筛选 chips 保持现有布局风格。

## 需求澄清（2026-11-19 对话确认）

1. **导航范围**：只改「地点浏览」这一项为「地点选择」下拉；「我的宠物」「城市浏览」「交通规则」等其余导航保持不变。
2. **酒店 / 餐厅的展示**：选中后直接展示激活行程城市下该类型的全量已保存列表，不再因未选锚点而门禁；「离景点最近」锚点筛选保留为可选。
3. **卡片简介来源**：由后端新增地点简介字段，不复用地址，也不在前端拼装。

## 现状（代码证据，2026-11-19 调查）

- 导航：`apps/web/src/routes/__root.tsx:203` 为固定 `TabsTrigger`「地点浏览」，无下拉；`isAttractions` 通过 pathname 判断激活态。
- 地点页类型：`apps/web/src/routes/_authenticated/attractions/index.tsx` 目前用组件内 `typeGroup` state（本轮已改为读取 `?type=` 查询参数的中间态代码）；工具栏含「选择住宿/餐厅」「返回景点选择」「地点类型筛选」。
- 门禁：同文件 `gated = nearbyType && anchorPoiId === null`（约 104 行），餐厅未选锚点时展示「请先在景点页选择行程景点」空态且不请求列表；酒店虽默认全量，但工具栏仍以「返回景点选择」组织类型切换。
- 卡片：`-location-card.tsx` 为封面（`aspect-[2.3]`）+ 标题 + keytag/评分行 + 政策标签 + 地址 + 「查看详情」「添加到行程」；简介行当前展示 `location.address`，无简介字段。
- 评分与徽标：`-location-rating.tsx` 为琥珀色星标内联文本；`-pet-friendly-badge.tsx` 为浅色底徽标，未适配封面叠层。
- 添加控件：`-day-select.tsx` 触发器文案为「添加到行程」，无「Day 1 +」紧凑形态。
- 后端：`pawtrip_location` 无简介列；用户端列表与详情 DTO `LocationSummary`/`LocationDetail`（`apps/server/src/main/java/com/pawtrip/server/location/LocationQueryResponses.java:25,77`）不返回简介。
- 测试：`e2e/attraction-pet-rules.spec.ts:33` 以 `getByRole("tab", { name: "地点浏览" })` 进入；`e2e/nearby-location-filter.spec.ts` 依赖页内类型切换；`e2e/companion-hints.spec.ts:4` 与 `e2e/transport-rules.spec.ts:44` 断言导航文案数组。

## 方案取舍记录

- A（选定）导航下拉 + URL `?type=` 驱动：下拉承担类型入口，URL 承担状态，刷新与前进/后退可保持；页面不再重复提供类型切换。
- B 保留页内类型下拉，仅新增导航下拉：两个类型入口并存，状态易不一致，且与用户截图「地点选择」替换「地点浏览」的意图冲突，放弃。
- C 用本地 state 驱动类型：刷新与前进/后退丢失类型，无法满足「选择任一项显示对应页面」的可分享/可回退预期，放弃。
- D 卡片简介复用地址：信息价值低且与截图文案形态不符；经用户确认改为后端简介字段，放弃。
- E 酒店/餐厅继续要求先选锚点：与用户确认的「直接展示全量列表」冲突，放弃。

## 已知约束

- 页内类型筛选当前只暴露酒店/餐厅（`NEARBY_TYPE_GROUPS`），宠物医院/宠物用品店在基线 UI 中并无入口；本次下拉仅含景点/酒店/餐厅，不扩展新类型入口。
- 保留既有可访问名与测试标识：`查看详情`、`添加到行程`、`离景点最近`、`显示全部地点`、`location-rating`，避免无关回归。
- 简介仅对珠海演示与 E2E 夹具补种子文案；其余地点为 `null`，前端回退地址。
- 遵循 `@rule:spec-first`：变更包 `openspec/changes/2026-11-19-location-select-dropdown-and-card-redesign/` 已建立；P1 完成后再进入 P2/P3。
