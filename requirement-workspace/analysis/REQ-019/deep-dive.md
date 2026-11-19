# REQ-019 Deep Dive — 地点选择下拉与地点卡片改版

- 上游：[REQ-019 地点选择下拉与地点卡片改版](../../requirements/REQ-019-location-select-dropdown-and-card-redesign.md)
- 已确认口径：仅改「地点浏览」；酒店/餐厅默认全量；简介来自后端字段；类型状态放 URL。
- 本文只固化 P1 可验收语义与测试分层，具体视觉尺寸与决策编号由 P2 design 定稿。

## 1. 导航与类型交互契约

- 顶部导航将 `TabsTrigger`「地点浏览」替换为「地点选择」下拉；触发器可见文案保持「地点选择」，右侧 chevron；下拉 `aria-label` 为「地点选择」。
- 下拉选项固定为「景点」「酒店」「餐厅」；当前类型选项带选中标记；当前页面标题与选中态一致（景点/酒店/餐厅）。
- 选择「景点」→ `navigate({ to: "/attractions", search: {} })`；选择「酒店/餐厅」→ `search: { type: "hotel" | "restaurant" }`。
- 在 `/attractions` 之外的页面选择选项，同样导航到上述地址；其余导航项（首页、我的宠物、城市浏览、交通规则、我的行程、管理项）保持原行为。
- 激活态：导航下拉在 `/attractions` 下保持当前类型；离开 `/attractions` 后下拉不显示类型选中态，但入口始终可用。

## 2. URL 与页面状态契约

- `validateSearch` 白名单：仅 `type=hotel|restaurant` 生效；缺失或非法值视为景点，且不把非法值写回 URL。
- 页面由 `Route.useSearch()` 读取 `typeGroup = type ?? "attraction"`；不再保留类型 state，也不再调用 `setTypeGroup`。
- 类型变化：页码重置为 1；保留激活行程城市、搜索词、keytag chip、锚点与「显示全部地点」状态。
- 刷新、前进/后退由路由查询参数恢复类型；不存在本地存储。
- `locationTypesQueryOptions` 不再驱动页内切换；如需标题/类型 code 可继续复用，但下拉选项与顺序由前端固定。

## 3. 门禁移除与锚点语义

- 删除 `gated` 变量及其在查询 `enabled`、加载判断、空态、地图占位与分页分支中的全部引用。
- 酒店与餐厅在未选锚点时请求 `typeGroup=hotel|restaurant` 的城市全量列表；请求不再携带 `nearPoiId`。
- 选中锚点后：请求携带 `nearPoiId`，服务端 5km 过滤、距离升序与 `distanceMeters` 展示不变。
- 清除锚点：`anchorPoiId=null`、页码重置，恢复全量列表。
- 酒店与餐厅共用 `anchorPoiId`；两类之间切换保留锚点并重置页码。
- 激活行程变化或锚点景点被移出行程：清空锚点，回到全量列表；不再有「餐厅恢复门禁」行为。
- 无已排期景点：锚点下拉禁用，占位「离景点最近」，不阻断列表。
- 「显示全部地点」仅影响景点类型的宠物规则筛选；酒店/餐厅行为不变。

## 4. 卡片与简介展示契约

- 卡片结构（自上而下）：
  1. 封面：沿用 `LocationCover`，比例与圆角按截图；无图时保留中性占位。
  2. 封面叠加层：左上「宠物友好」徽标（叠层配色）与 `keytag` 标签；右上圆形评分徽标（白底、星标 + 数值）。
  3. 标题：地点名称；保留已加入行程的「第 N 天」标记。
  4. 简介：`description ?? address ?? "地址未收录"`，两行截断。
  5. 距离/政策标签：`anchorName` + `distanceMeters` 文案、政策说明与限制标签保持不变。
  6. 底部操作：左侧「查看详情」；右侧「Day 1 +」紧凑触发器，展开后可选第 1..N 天或「暂不排期」。
- 无障碍与测试标识：
  - `PetFriendlyBadge` 文案保持「宠物友好 / 禁止携带 / 未配置 / 不限宠物」。
  - `LocationRating` 保留 `data-testid="location-rating"`。
  - `DaySelect` 的 `aria-label` 必须为「添加到行程」；触发器可见文案为「Day 1 +」形态。
  - 卡片根与标题保留 `data-slot="card"`、`data-slot="card-title"`。
- 评分缺失：不渲染评分徽标；封面与标签布局不塌陷。
- keytag 缺失：不渲染 keytag 标签；宠物友好徽标与评分照常。
- 详情弹窗与地图详情卡：在类型/地址区域展示同一简介取值；缺失回退地址。
- 加入行程的回调与 `stopPropagation` 边界保持，卡片整体点击仍用于地图定位。

## 5. 后端数据契约

- 表：`pawtrip_location` 增加 `description TEXT`，可空。
- 迁移：`V31__add_location_description.sql`；不动其他列、索引与约束。
- 列表 `LocationSummary` 与详情 `LocationDetail` 增加 `description`（可空）；字段顺序不影响 JSON 客户端。
- 写入：本轮不新增管理端编辑接口；仅迁移与种子写入。`updateDescription` 供测试夹具使用。
- 种子：珠海演示与 E2E 夹具补文案；未覆盖地点保持 `NULL`。
- 外部依赖：简介不从高德实时拉取；无新依赖、无新环境变量。
- 兼容性：前端 `LocationSummary.description` 必填可空、`LocationBrowseDetail.description` 可选可空，兼容旧响应。

## 6. 测试计划

### 后端（`LocationQueryApiTest`）

1. 列表项返回 `description`；未配置地点为 `null`。
2. 详情返回 `description`；未配置地点省略或为 `null`。
3. 既有分页、类型筛选、附近筛选与权限断言保持通过。

### 前端单测

1. `locations-browsing.test.ts`：列表查询键仍包含 region/type/friendly/nearby/page；新增字段不改变 URL/键语义。
2. 导航下拉（新增或复用路由测试）：选项固定三项；选择酒店/餐厅生成对应 `search`；非法 `type` 回退景点。
3. 简介取值：`description` 优先；为 `null` 时回退 `address`；地址也为空时显示「地址未收录」。
4. 卡片评分缺失不渲染 `location-rating`；`DaySelect` 的 `aria-label` 保持「添加到行程」。

### E2E

- 更新导航辅助：`openAttractions` 改为操作「地点选择」下拉；类型切换改为下拉选项。
- `attraction-pet-rules`：进入景点页、激活态断言改为下拉当前项；既有加入行程/详情断言保持。
- `nearby-location-filter`：酒店/餐厅直接进入即见列表；选择锚点后 5km 过滤；清除后恢复；切换类型保留锚点。
- 新增断言（不新增独立 spec 时可并入既有 spec）：酒店/餐厅未选锚点无门禁空态；卡片简介展示与地址回退；「Day 1 +」可加入指定天。
- `companion-hints`、`transport-rules`：导航文案数组由「地点浏览」更新为「地点选择」；其余导航顺序不变。
- 新增用例总数控制在 ≤30。

### 回归

- `e2e/attractions-timeline-hints.spec.ts`、`e2e/trips-panel.spec.ts`、地图相关用例、`-location-map.test.tsx`。
- 前端 build 与 `tsc --noEmit`；后端 `./mvnw test`。

### 门禁命令

- 前端：`cd apps/web && npx vitest run`；`npm run build -w apps/web`。
- 后端：`cd apps/server && ./mvnw test`。
- E2E：`node scripts/run-e2e.mjs e2e/attraction-pet-rules.spec.ts e2e/nearby-location-filter.spec.ts`。
- 规格：`npx --no-install openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict`。

## 7. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| `trip-attractions` 地点类型筛选（REQ-012） | 页内类型控件 | 由导航下拉 + URL 取代；P2 同步 MODIFIED，避免 Living Spec 与实现冲突 |
| `web-app-shell` 顶部横向导航 / Tab 同步 | 导航组成与选中态 | 六个 Tab 改为五个 Tab + 「地点选择」下拉；`/attractions` 不选中 Tab；G1 预审补充 MODIFIED delta |
| `trip-attractions` 5km 附近筛选（REQ-012） | 锚点与距离 | 算法、半径、排序与文案不变 |
| `trip-attractions` 餐厅门禁（REQ-012） | 餐厅未选锚点 | 本次取消；酒店/餐厅默认全量 |
| `trip-attractions` 卡片封面与评分（REQ-013） | 卡片媒体 | G1 预审补充 MODIFIED：4:3 封面、封面右下角评分徽标、移除地址行；保留媒体降级规则 |
| `trip-attractions` 地图联动 | 卡片点击定位 | 保持回调与列表/地图联动 |
| 行程与加入行程（REQ-011/REQ-016） | 保存与路线 | 不改变 stop 结构与保存逻辑；「Day 1 +」仅复用现有回调 |
| 行程单附近宠物服务（REQ-015） | 医院/用品店 | 不受导航下拉影响；作为其唯一浏览路径继续存在 |
| `companion-hints`（REQ-018） | 导航文案断言 | 仅更新文案数组；提示逻辑不变 |
| `location-management` | 管理端与用户端契约 | 仅新增可空字段；管理端 UI 不变 |
| 后端 / 数据库 | — | V31 可空列；无写接口变化 |

## 8. DoR ⑨–⑫ 结论

- **⑨ 数据契约**：`description` 可空、列表/详情返回、前端回退规则、种子范围与迁移编号均已定稿；无未决字段。
- **⑩ 边界分支**：非法 `type`、刷新/前进后退、未选/已选/清除锚点、无已排期景点、无激活行程、简介缺失、评分缺失、keytag 缺失、卡片操作冒泡、行程只读均有明确行为。
- **⑪ 跨 REQ 一致性**：与类型筛选、5km 筛选、餐厅门禁、卡片媒体、地图联动、加入行程、附近宠物服务、伙伴提示逐项核对；P2 需把「地点类型筛选」纳入 MODIFIED delta。
- **⑫ 展示与测试**：导航、标题、卡片层级、详情/地图简介口径与测试分层已定义；保留既有可访问名与测试标识，回归风险可控。
- 结论：⑨–⑫ 全部 Pass；BLOCKER=0；无阻塞未知依赖。
