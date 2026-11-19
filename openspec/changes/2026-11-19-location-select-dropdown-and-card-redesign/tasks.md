# Tasks

- Spec ID：`2026-11-19-location-select-dropdown-and-card-redesign`
- 设计依据：[design.md](design.md)；ATDD 分层与红绿顺序：[atdd-design.md](atdd-design.md)；AC/DoV 复核：[dov-ac-review.md](dov-ac-review.md)；一致性：[consistency-lint.md](consistency-lint.md)
- 顺序按 ATDD 红先行：先失败断言（红），再实现转绿；前端卡片与导航直接实现并同步单测，E2E 新增 ≤30 条。

## 1. 后端简介字段（A1–A5）

- [x] 1.1 红：扩展 `LocationQueryApiTest` 断言列表 `poi-zhu-a` 有 `description`、`poi-zhu-e` 为 `null`，详情返回 `description`；临时移除 DTO 字段/透传确认失败。验证：`./mvnw test` 失败输出与 A1–A3 一致。
- [x] 1.2 红：`LocationSchemaMigrationTest` 断言 `pawtrip_location` 含可空 `description` 列。验证：移除建列语句后该断言失败。
- [x] 1.3 绿：`V32__add_location_description.sql` 只保留一条 `B02F400HUL` UPDATE（截图口径「沿着林间小径慢慢走，和毛孩子一起享受山海绿意。」）与演示/E2E 种子文案；无重复 UPDATE、无索引与约束变更。
- [x] 1.4 绿：`PawtripLocation` 增加 `description` 映射、getter 与 `updateDescription`；`LocationSummary`、`LocationDetail` 增加 `description` 并透传。验证：`./mvnw test` 全绿。
- [x] 1.5 `scripts/seed-e2e-attractions.mjs` 为夹具写入 `description`（「无坐标景点」「珠海无名景点」保持无简介，用于回退用例）。验证：E2E 种子后接口返回符合 A1–A3。

## 2. 前端纯函数单测（U1–U4）

- [x] 2.1 红：`location-summary.test.ts` 新增 `locationDescription` 用例（description 优先 / 空串与空白回退 address / 皆空回退「地址未收录」）。验证：函数缺失时导入失败。
- [x] 2.2 红：新增 `normalizeLocationType` 用例（`hotel`/`restaurant` 原样；其余含 `park`、`undefined`、`Attraction`、数组视为 `attraction`）。验证：函数缺失时导入失败。
- [x] 2.3 绿：`lib/location-summary.ts` 实现两个纯函数；`queries/locations.ts` 的 `LocationSummary`/`LocationBrowseDetail` 增加 `description` 字段。
- [x] 2.4 回归：`locations-browsing.test.ts` 与 `displayRating` 用例不改口径并通过。验证：`npm run test -w apps/web`。

## 3. 导航与类型状态（E1–E4、E17–E18）

- [x] 3.1 `__root.tsx`：移除 `attractions` 的 `TabsTrigger`，新增外层胶囊容器与「地点选择」`Select`（`aria-label="地点选择"`，选项固定景点/酒店/餐厅）；`activeTab` 在 `/attractions` 返回空；`onValueChange` 导航到 `/attractions` 或 `?type=…`。
- [x] 3.2 `attractions/index.tsx`：`validateSearch` 使用 `normalizeLocationType`；类型取自 `Route.useSearch()`；`typeGroup` 由类型派生，切换时 `setPage(1)`。
- [x] 3.3 更新 `companion-hints.spec.ts`（`NAV_TABS`）与 `transport-rules.spec.ts`（前 5 项文案）为「地点选择」。验证：两个 spec 通过。
- [x] 3.4 新增 E1（下拉切酒店/返回景点）、E2（刷新保持餐厅）、E3（`/attractions` 无 Tab 选中、下拉激活）、E4（`?type=park` 回退景点）。

## 4. 门禁移除与可选锚点（E5–E9、E13）

- [x] 4.1 删除 `gated` 与全部引用（查询 `enabled`、加载态、空态、地图占位、分页条件）；删除 `enterNearbyLocations`、`backToAttractions` 与页内「地点类型筛选」「返回景点选择」「选择住宿/餐厅」。
- [x] 4.2 锚点 Select 增加「不限景点」选项（值 `""`）用于清除；清除时 `anchorPoiId = null`、`page = 1`；锚点失效或行程变化时同样恢复全量。空态文案按类型生成。
- [x] 4.3 重写 `nearby-location-filter.spec.ts`：E6 未选锚点全量（酒店/餐厅、无门禁空态）、E7 5km 与共用锚点、E8 清除与移出行程、E9 无坐标错误与清除后全量。
- [x] 4.4 新增 E13：`page.route` 桩 2 页数据 → 翻页后联动下拉切类型 → 请求 `page=1` 且 UI 回第 1 页。
- [x] 4.5 新增 E14：三种类型下「地点类型筛选」「返回景点选择」「选择住宿/餐厅」数量均为 0。

## 5. 卡片、详情与简介回退（E10–E12）

- [x] 5.1 `LocationCover` 改为 `aspect-[4/3]`；`-location-card.tsx` 重构为封面叠层（`PetFriendlyBadge tone="overlay"`、keytag、右下角 `LocationRating variant="badge"`）、标题、简介（`locationDescription`）、可选距离/政策行、底部「查看详情」+ 紧凑 `DaySelect`；删除独立地址行。
- [x] 5.2 `-day-select.tsx` 增加 `variant="compact"`：深色胶囊、`Day 1` + `Plus`、`aria-label="添加到行程"`；详情弹窗与地图卡保持默认样式。
- [x] 5.3 详情弹窗 `-location-detail-dialog.tsx` 与地图卡 `-map-location-card.tsx` 使用 `locationDescription` 展示简介。
- [x] 5.4 扩写 media E1（4:3、叠层几何、简介、Day 1 +、无地址行）、media E7（详情简介与回退、无照片/坏图降级）、E11（「无坐标景点」回退地址、「珠海无名景点」回退「地址未收录」）。

## 6. 全量验证

- [x] 6.1 `npm run build`、`npm run test -w apps/web`、`apps/server ./mvnw test`。
- [x] 6.2 `node scripts/run-e2e.mjs attraction-pet-rules.spec.ts nearby-location-filter.spec.ts companion-hints.spec.ts transport-rules.spec.ts`；补充 `admin-location-management.spec.ts` 回归。
- [x] 6.3 浏览器实测：下拉切换、刷新保持、非法 type、锚点清除、卡片视觉与简介回退；无高德 Key 时记录地图详情卡为待验证。
- [x] 6.4 回填 `dov-ac-review.md` DoV-7/DoV-10 证据与 `registry.md`、`handoff.md`；G2/G3 留待人工签署。

## 7. P4 执行记录（2026-11-19）

- 后端按 TDD 红先行：A1–A3（列表/详情 `description`）与列存在性断言先红后绿；`./mvnw test` → 272 tests / 0 failures / 0 errors。
- 前端按约定直接实现并同步单测：`location-summary.test.ts` 新增 `locationDescription` 与 `normalizeLocationType` 用例；vitest 49 files / 372 tests passed；`tsc -p apps/web/tsconfig.json --noEmit` 与 `npm run build -w apps/web` 通过。
- E2E：`attraction-pet-rules`、`nearby-location-filter`、`companion-hints`、`transport-rules` 四个目标 spec 通过；全量 `node scripts/run-e2e.mjs` → 109 passed（含 `admin-location-management`）。
- 偏差 1：无锚点餐厅列表为 3 条（ATDD E6 写 4 条）。「宠物友好筛选规则不变」为需求 Non-goal，`最近餐厅`（每人限养 0）仍被过滤；按需求口径断言并在 spec 内注明原因。
- 偏差 2：`Route.useSearch()` 透出原始 `type` 字符串，页面层再做一次 `normalizeLocationType()`，否则 `?type=park` 会以 `typeGroup=park` 请求后端并 400。
- 待验证：地图详情卡（`-map-location-card.tsx`）简介渲染在无高德 JS Key 的 E2E 环境不可达，由 `locationDescription` 单测与代码评审覆盖，需在有 Key 环境目视确认。
- 目视验证修复：紧凑 `DaySelect` 在 `value={null}` 的 placeholder 状态下被基础样式 `data-placeholder:text-muted-foreground` 覆盖，深色胶囊内「Day 1 +」不可见；改为按 variant 分别设置 `data-placeholder:text-white` / `data-placeholder:text-foreground`。修复后重跑 `attraction-pet-rules` + `nearby-location-filter` → 21 passed。
- G2/G3 未签署，等待人工评审；本记录不代表 Gate 已批准。

## 8. 2026-11-19 导航合并与列表-地图同框

- [x] 8.1 `__root.tsx`：下拉选项改为「景点」「酒店和餐厅」（值 `attraction` / `lodging`），`lodging` 导航到 `/attractions?type=hotel`；下拉选中态由 `hotel`/`restaurant` 共同映射。
- [x] 8.2 `attractions/index.tsx`：酒店/餐厅类型在列表头部渲染「酒店」「餐厅」tag（`aria-label="地点类型"`），点击以 `search: { type }` 导航；景点类型不渲染 tag；既有 `typeGroup` 副作用负责重置页码与 keytag。
- [x] 8.3 `attractions/index.tsx`：列表与地图合并为同一 `section` 外框（统一圆角/描边/背景），内部列表左、地图右并带分隔线；小屏地图堆叠于列表下方；保留 `location-list`、`attractions-map`、`location-map-placeholder` 测试标识；代理面板占位列不并入外框。
- [x] 8.4 同步 E2E：`attraction-pet-rules`（导航选项、页内 tag、E1/E2/E13/E14）、`nearby-location-filter`（`chooseType`）、`companion-hints` / `transport-rules` 文案断言；布局用例断言地图右缘与合并外框齐平。
- [x] 8.5 验证：`npm run build -w apps/web`、`tsc --noEmit`、`npm run test -w apps/web`、目标 E2E，再跑全量 `node scripts/run-e2e.mjs`；浏览器目视合并页与同框布局。
- [x] 8.6 回填 `registry.md`、`handoff.md`、`dov-ac-review.md`；G2/G3 仍待人工签署。

## 9. 执行记录（2026-11-19 导航合并与同框）

- 变更包：`trip-attractions` 新增「地点列表与地图同框」需求与 2 个场景，MODIFIED「地点类型筛选」保留原场景名并新增「页内 tag 切换餐厅」；`web-app-shell` 场景同步为「景点」「酒店和餐厅」；`design.md` 增补 D9，`openspec change validate --strict` 通过。
- 实现：导航下拉两项（`attraction` / `lodging`）；`attractions/index.tsx` 页内 `Tabs` 渲染「酒店」「餐厅」tag，切换走 `search: { type }`；列表与地图合并进同一 `section`，桌面 `36%` 左分隔线，窄屏堆叠；`LocationMap` 占位符支持 `className` 以与外框齐平。
- 验证：`tsc -p apps/web/tsconfig.json --noEmit` 通过；vitest 49 files / 372 tests passed；`npm run build -w apps/web` 通过；目标 E2E 5 spec → 37 passed；全量 `node scripts/run-e2e.mjs` → 109 passed；本地 3003 目视确认下拉两项、页内 tag 切换与同框布局（无高德 Key，地图区为占位）。
- G2/G3 未签署，未提交未推送。

## 10. 2026-11-19 卡片政策标签叠层与地图留边

- [x] 10.1 `-location-card.tsx`：`noteParts` 与 `limitTags` 移至封面左下叠层（为右下评分预留宽度）；封面下方标签行只保留 `PolicyTags`。
- [x] 10.2 `attractions/index.tsx`：地图区改用 `p-3` 内边距并移除分隔线，`LocationMap` 用默认圆角描边，使地图上下左右与外框留出间距。
- [x] 10.3 E2E：`attraction-pet-rules` media E1 断言政策要求标签位于封面内、封面下方仅宠物适住标签；布局用例改为断言地图右缘距外框约 12px 且上下留边。
- [x] 10.4 验证：`tsc --noEmit`、目标单测、`npm run build -w apps/web`、目标 E2E；浏览器目视卡片与地图留边。

## 11. 执行记录（2026-11-19 标签叠层与地图留边）

- 规格：`trip-attractions` 增补「政策要求标签叠于封面」「封面下方只保留宠物适住标签」场景；「地点列表与地图同框」改为地图在外框内留边、不再贴齐右缘；`design.md` D5/D9 同步；`openspec change validate --strict` 通过。
- 实现：`-location-card.tsx` 把 `noteParts` 与超限红标移到封面左下叠层（右侧为评分预留 `4rem`），正文标签行只保留 `PolicyTags`；`attractions/index.tsx` 地图区改 `p-3` 并移除分隔线，`LocationMap` 恢复默认圆角描边。
- 验证：`tsc --noEmit` 通过；`npm run build -w apps/web` 通过；`npm run test -w apps/web -- src/lib/location-summary.test.ts src/routes/_authenticated/attractions` → 13 passed；`node scripts/run-e2e.mjs attraction-pet-rules.spec.ts app-shell-layout.spec.ts nearby-location-filter.spec.ts` → 25 passed（E1 断言先红后绿）。
- 目视：卡片「公共区域需牵引」位于封面内、「豆豆 · 不友好」位于封面下方；地图与外框上/下/右间距约 13px。
- 未提交、未推送。

## 12. 淡橘色外框（2026-11-19）

- [x] 12.1 行程面板列与列表/地图外框描边改用 `paw-accent` 淡橘色
- [x] 12.2 E2E 或脚本断言外框描边颜色
- [x] 12.3 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 12.4 `openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict`

- 实现：`trip-panel-column`（aside）与 `attractions-region`（section）保留 1px 边框宽度，仅颜色改为 `border-paw-accent`。
- 验证：浏览器实测两处描边均为 `rgb(236, 148, 85)`；`attraction-pet-rules` E1 增加断言并通过；`tsc`/`build` 通过；`validate --strict` valid。未提交、未推送。

## 13. 淡奶黄描边、去阴影与地点卡片统一（2026-11-19）

- [x] 13.1 行程面板列、列表/地图外框与地点卡片描边改用 `paw-accent-soft` 淡奶黄（`#FFEFD6`）
- [x] 13.2 地点浏览页外框、卡片与悬浮行程面板移除阴影
- [x] 13.3 E2E 断言两处外框描边为 `rgb(255, 239, 214)`
- [x] 13.4 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 13.5 `openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict`

- 实现：`trip-panel-column`（aside）与 `attractions-region`（section）保留 1px 边框，颜色改 `border-paw-accent-soft`；`-location-card.tsx` 基础卡片改同色描边并移除阴影；其余页框阴影清理见各自变更包。
- 验证：`attraction-pet-rules` E1 断言 `rgb(255, 239, 214)`；目标 E2E 通过；`validate --strict` valid。未提交、未推送。

## 14. 卡片日期选择入口文案（2026-11-19）

- [x] 14.1 `DaySelect` compact 触发器默认文案由「Day 1」改为「请选择日期」
- [x] 14.2 `attraction-pet-rules` E1 断言默认文案并打开下拉确认「第 1 天」可选
- [x] 14.3 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 14.4 `openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict`

## 15. 选择后入口回显所选日期（2026-11-19）

- [x] 15.1 `DaySelect` compact 版在用户选择后把入口文案回显为「第 N 天」或「暂不排期」，`value` 保持 `null` 以支持重复选择同一天
- [x] 15.2 `attraction-pet-rules` E1 选择「第 1 天」后断言入口文案变为「第 1 天」
- [x] 15.3 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 15.4 `openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict`
- 验证：目标 E2E 33 passed；`validate --strict` valid。未提交、未推送。
