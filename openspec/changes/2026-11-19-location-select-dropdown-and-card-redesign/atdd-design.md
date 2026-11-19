# ATDD Design — 地点选择下拉与地点卡片改版

- Change：`2026-11-19-location-select-dropdown-and-card-redesign`（REQ-019）
- 上游：`specs/{trip-attractions,web-app-shell,location-management}/spec.md`、`design.md`、`dov-ac-review.md`
- 性质：P3 计划工件；本文件先于 P4 生产代码落盘，红绿顺序与任务一一对应，不作为实现已完成证据。

## 分层与责任

| 层 | 覆盖内容 | 证据形式 |
|---|---|---|
| API | `description` 字段的迁移、列表与详情返回、未配置为 `null` | `LocationQueryApiTest`、`LocationSchemaMigrationTest` |
| Unit | 简介回退纯函数、类型参数白名单、既有查询键/URL 回归 | `apps/web` vitest |
| E2E | 导航下拉、URL 类型、全量列表、可选锚点、卡片结构、简介回退、入口移除、分页重置 | Playwright（真实后端 + 临时库） |
| 代码走查 | 地图详情卡简介（CI 无高德 JS Key，地图列渲染占位） | P4 走查记录 + `locationDescription()` 单元证据 |

## API 层（后端 TDD，红先行）

| ID | Scenario | 用例 | 红（先失败） | 绿（转通过） |
|---|---|---|---|---|
| A1 | 地点简介字段 / 列表返回简介 | `LocationQueryApiTest.defaultListReturnsOnlyFriendlyAttractionsInCity`：`poi-zhu-a` 的 `description` 等于夹具文案 | 临时移除 `LocationSummary.description` 与 `from(...)` 透传 → 断言失败 | 恢复字段与透传 |
| A2 | 地点简介字段 / 详情返回简介 | `LocationQueryApiTest.detailReturnsEightPoliciesAndNoAdminOnlyFields`：详情 `description` 等于夹具文案 | 同上移除 `LocationDetail.description` → 断言失败 | 恢复字段与透传 |
| A3 | 地点简介字段 / 未配置简介 | 同一列表用例：`poi-zhu-e` 的 `description` 为 `null`；不写空字符串 | 字段缺失时 JSON 无该键 → 断言失败 | 实体映射为 `null` 时序列化为 `null` |
| A4 | 地点简介字段（迁移面） | `LocationSchemaMigrationTest`：`pawtrip_location` 表含 `description` 列且可空 | 移除 `V31` 建列语句 → 断言失败 | `V31__add_location_description.sql` 新增可空列 |
| A5 | 迁移幂等 | 既有迁移测试：Flyway 顺序 `V30 → V31`、无重复 UPDATE | `V31` 保留两条 `B02F400HUL` UPDATE → 走查记录为红 | 删除重复 UPDATE，仅保留截图口径文案 |

约束：

- 后端不新增写入接口，不在查询路径调用高德；A1–A3 只读数据库。
- A5 是迁移内容约束，不新增断言用例时以迁移脚本 diff 走查为准（`design.md` D7）。

## Unit 层（前端，先写测试后实现）

| ID | 覆盖 | 用例位置 | 用例要点 |
|---|---|---|---|
| U1 | 简介回退 | `apps/web/src/lib/location-summary.test.ts` 新增 `locationDescription` | `description` 非空优先；`description` 为 `null`/空串/纯空白回退 `address`；二者皆空返回 `地址未收录` |
| U2 | 类型白名单 | 同上新增 `normalizeLocationType` | `hotel`/`restaurant` 原样；`attraction`、`undefined`、`park`、大小写变体、数组等非法值一律视为 `attraction` |
| U3 | 评分徽标数据 | 既有 `displayRating` 用例 | 缺失、空白、非数值隐藏；合法值原样（评分徽标渲染依赖此口径） |
| U4 | 查询键回归 | 既有 `locations-browsing.test.ts` | `typeGroup`、`nearPoiId`、`petFriendlyOnly`、页码与 `pageSize` 参数不变；仅新增字段不影响键 |

- U1/U2 直接服务于卡片、详情弹窗、地图卡与 `validateSearch`，不引入额外抽象层。
- 红：`locationDescription` / `normalizeLocationType` 尚不存在时导入与断言失败。

## E2E 层（Playwright）

复用夹具：珠海 `440400` 下 7 个景点、4 个餐厅、3 个酒店、医院与用品店；`trip-helpers.ts` 的 `signIn`、`resetTrips`、`createActiveTripViaApi`、`withTripPanelNotBlocking`。

| ID | Scenario | 文件与用例 | 断言要点 | 性质 |
|---|---|---|---|---|
| E1 | 地点选择导航与类型页面 / 从导航切换到酒店、返回景点 | `attraction-pet-rules.spec.ts` 新增「nav dropdown switches hotel and back to attraction」 | 打开「地点选择」下拉选「酒店」→ URL `/attractions?type=hotel`、标题「酒店」、下拉当前项为「酒店」；再选「景点」→ URL `/attractions`、标题「景点」 | 新增 |
| E2 | 地点选择导航与类型页面 / 刷新保持类型 | 同上新增「refresh keeps the type」 | 直达 `/attractions?type=restaurant` 后 reload → 仍为餐厅列表，「地点选择」可用 | 新增 |
| E3 | 导航与路由同步 / 直接访问行程单 | `attraction-pet-rules.spec.ts` E7 改为「no tab selected on attraction routes」 | `/attractions` 与 `/attractions?type=hotel` 下 5 个 Tab 均 `aria-selected=false`，下拉触发器为激活态；详情弹窗打开后仍无 Tab 选中 | 改造 |
| E4 | 地点类型筛选 / 非法类型回退景点 | 同上新增「illegal type falls back to attraction」 | `/attractions?type=park` → 标题「景点」，无错误提示、无空白 | 新增 |
| E5 | 地点类型筛选 / 默认浏览景点、切换类型 | 既有 E1 与 E3 | 默认 `/attractions` 仅该城景点；切换后仅该城酒店/餐厅 | 改造 |
| E6 | 酒店与餐厅的默认列表与可选锚点 / 未选锚点切换到餐厅、酒店 | `nearby-location-filter.spec.ts` 重写前两个用例 | 未选锚点切酒店：可见「珠海某酒店」「附近酒店」「远处酒店」；切餐厅：可见全部 4 个餐厅（无坐标餐厅不出现在 5km 过滤场景，此处无锚点时可见）；`请先在景点页选择行程景点` 数量为 0 | 改造 |
| E7 | 行程景点锚点选择 / 酒店页选择已排期景点作为锚点；酒店与餐厅的默认列表与可选锚点 / 餐厅和酒店共用锚点 | `nearby-location-filter.spec.ts` 重写「filters hotels…shares the anchor」 | 酒店选「情侣路」→ 远处酒店消失、卡片带「距情侣路约 0.6km」；切餐厅保留锚点 → 附近餐厅可见、最近/远处/无坐标餐厅不出现 | 改造 |
| E8 | 行程景点锚点选择 / 清除酒店锚点；锚点景点被移出行程 | 重写「clears the anchor…」 | 锚点 Select 选「不限景点」→ 恢复全量、页码回到第 1 页；移除情侣路 → 锚点清空、恢复全量且无门禁空态 | 改造 |
| E9 | 行程景点锚点选择 / 锚点无坐标 | 既有「shows a clear error when the hotel anchor has no coordinates」 | 错误文案保留；「清除锚点」后恢复酒店全量（不再是门禁空态） | 改造 |
| E10 | 地点卡片概览与简介 / 卡片展示简介与评分；地点卡片封面与评分 / 封面展示、评分展示 | `attraction-pet-rules.spec.ts` media E1 扩写 | 封面 `4:3`（宽高比≈1.333）；宠物友好徽标、keytag、`location-rating` 均在封面区域内（几何包含关系）；简介显示 `description`；卡片内无独立地址 `<p>`；`Day 1 +` 触发器 `aria-label="添加到行程"` 且含「Day 1」 | 改造 |
| E11 | 地点卡片概览与简介 / 简介缺失回退地址；地点卡片封面与评分 / 无照片占位、加载失败降级 | media E1 与 media E7 扩写 | 「无坐标景点」简介回退其地址；「珠海无名景点」显示「地址未收录」；无照片/坏图仍显示中性占位且无「获取图片」 | 改造 |
| E12 | 地点卡片概览与简介 / 详情同步简介 | media E7 扩写 | 「珠海渔女」详情弹窗展示 `description`；「珠海无名景点」详情展示「地址未收录」 | 改造 |
| E13 | 地点类型筛选 / 类型变更重置分页 | 同上新增「switching type resets to page 1」 | `page.route` 拦截 `/api/locations` 返回 2 页桩数据 → 翻到「第 2 / 2 页」→ 下拉切酒店 → 发起请求 `page=1`，UI 显示「第 1 / 2 页」 | 新增 |
| E14 | 地点选择导航与类型页面 / 页内入口移除 | `attraction-pet-rules.spec.ts` 新增「no in-page type controls」 | 「地点类型筛选」「返回景点选择」「选择住宿/餐厅」在景点、酒店、餐厅三种状态下数量均为 0 | 新增 |
| E15 | 酒店与餐厅的默认列表与可选锚点 / 宠物医院与宠物用品店不受门禁影响 | 既有 `attraction-pet-rules.spec.ts` E2 | 医院/用品店入口与列表行为保持不变（回归） | 回归 |
| E16 | 行程景点锚点选择 / 未排期景点不出现在候选、重复景点去重 | 既有锚点候选行为 | 候选仅含已排期且去重的景点（回归；本次不改候选构造） | 回归 |
| E17 | 顶部居中横向导航 / 打开任意受保护页面 | `transport-rules.spec.ts` 导航文案数组 | 前 5 项为「首页」「我的宠物」「城市浏览」「地点选择」「交通规则」 | 改造 |
| E18 | 顶部居中横向导航（伙伴提示面） | `companion-hints.spec.ts` `NAV_TABS` | 数组含「地点选择」；`/attractions` 仍触发气泡且入口保留 | 改造 |
| E19 | 行程景点锚点选择 / 景点页选择已排期景点作为锚点 | 无自动化 | 基线页面不存在该控件，本次不新增也不删除（`design.md` Non-goals）；不写新用例 | 不覆盖 |

- 新增用例数：E1、E2、E4、E13、E14 共 5 条 ≤ 30；其余为既有用例改造或回归。
- 地图详情卡简介（E12 的地图部分）不纳入 E2E：CI 无高德 JS Key，地图列渲染占位；由 `locationDescription()` 单元测试 + P4 代码走查覆盖。
- 医院入口（`行程单附近宠物服务`）与地图联动不改，沿用既有回归。

## E2E 辅助改造

| 位置 | 改造 |
|---|---|
| `e2e/attraction-pet-rules.spec.ts` `openAttractions` | 改为点击「地点选择」下拉并选「景点」，或直接 `page.goto("/attractions")` |
| 同文件 `selectType`、`scheduleAttractionAndSelectAnchor` | 删除「返回景点选择」「选择住宿/餐厅」分支与延迟排期兜底，改为下拉选类型 |
| `e2e/nearby-location-filter.spec.ts` `chooseType`/`chooseAnchor`/`clearAnchor` | `chooseType` 走导航下拉；`clearAnchor` 改为锚点 Select 的「不限景点」选项 |
| `e2e/companion-hints.spec.ts`、`e2e/transport-rules.spec.ts` | 导航文案由「地点浏览」改为「地点选择」 |
| 导航等待 | `trip-helpers.ts` 的 `signIn` 仍以「城市浏览」Tab 为就绪信号，不受影响；凡以「地点浏览」Tab 为信号的用例全部改为下拉或 URL |

## What is written before production code（红绿顺序）

1. **A1–A3 失败断言**：先扩展 `LocationQueryApiTest` 并确认红（临时移除 DTO 字段/透传）。
2. **A4–A5 迁移断言与脚本约束**：`LocationSchemaMigrationTest` 加列断言确认红；`V31` 删除重复 UPDATE。
3. **后端转绿**：实体字段、DTO 透传、迁移建列与种子文案。
4. **U1–U2 失败单测**：`locationDescription`、`normalizeLocationType` 断言先红。
5. **前端实现转绿**：导航下拉、`validateSearch`、门禁移除、卡片与 `DaySelect`、详情/地图卡取值。
6. **E1–E19 用例改造与新增**：先改辅助与既有断言使其对新结构红，再实现转绿；E13 用桩数据先红。
7. **全量验证**：`npm run build -w apps/web`、`npm run test -w apps/web`（vitest）、`apps/server ./mvnw test`、`node scripts/run-e2e.mjs attraction-pet-rules.spec.ts nearby-location-filter.spec.ts companion-hints.spec.ts transport-rules.spec.ts`。
8. **浏览器实测**：下拉切换、刷新保持、锚点清除、卡片视觉与简介回退；地图详情卡在配置 JS Key 的环境记录截图，未配置则记录为待验证。

## 非目标反向检查

- 不新增主导航项、医院/用品店入口：E17/E18 数组长度与内容断言。
- 不改 5km 半径与距离文案：E7 断言的「约 0.6km」「约 0.7km」保持不变。
- 不改地图加载与联动：地图列占位行为沿用既有媒体用例。
- 不改行程保存与 `stop` 结构：E5/E7 的 `PUT /api/trips/{id}` 等待逻辑不变。
- 不新增卡片字段：E10 不断言押金/清洁费。
- 管理端不改：`admin-location-management.spec.ts` 不修改。

## NFR 与排除项

- 性能：未新增接口调用与外部请求；列表仍单次分页请求，地图仍每页 100 条拉全量。
- 可访问性：下拉 `aria-label="地点选择"`、`DaySelect` 保持 `添加到行程`；Tab 无选中时下拉承担激活态语义（D1）。
- 安全：简介为纯文本渲染，不使用 `dangerouslySetInnerHTML`。
- 排除：AI 生成简介、高德实时补拉、管理端编辑简介、押金/清洁费、多选 chips。

## 风险与待验证

- **E13 依赖桩数据**：桩响应需与 `Page<LocationSummary>` 结构一致，否则断言会先因渲染失败告红。
- **E10 几何断言**：叠层标签在窄卡片可换行，几何断言用「包含于封面」而非固定坐标。
- **地图详情卡**：CI 无 Key 无法自动化，P4 需明确记录未验证或本地手动验证。
- **夹具不足**：单城市地点数均 < 20，真实分页无法自然触发，故 E13 使用桩数据。
- **G2/G3**：本文件不代签。
