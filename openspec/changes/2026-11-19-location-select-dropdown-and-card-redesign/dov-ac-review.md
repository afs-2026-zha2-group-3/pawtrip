# AC / DoV Review — 地点选择下拉与地点卡片改版

变更：`2026-11-19-location-select-dropdown-and-card-redesign`（REQ-019）

范围：核对 REQ-019 验收要求、Delta Spec、Design、Tasks 与当前证据；P2 做规格/设计复核，P4 依据本地验证结果复核 DoV-7/DoV-10；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 导航下拉 | Pass | Delta `trip-attractions`「地点选择导航与类型页面」与 `web-app-shell`「顶部居中横向导航」「Tab 与路由同步」；Design D1；Tasks 2.1 | 选项固定三项；其余导航不变；`/attractions` 无 Tab 选中、下拉保持激活态 |
| AC-2 URL 类型与刷新保持 | Pass | Delta「地点选择导航与类型页面」「地点类型筛选」；Design D2；Tasks 2.2 | `?type=hotel\|restaurant`；非法值回退景点；刷新/前进后退保持 |
| AC-3 酒店/餐厅默认全量 | Pass | Delta「酒店与餐厅的默认列表与可选锚点」「行程景点锚点选择」；Design D3；Tasks 3.1 | 未选锚点直接请求全量；无门禁空态；无已排期景点时锚点禁用 |
| AC-4 可选锚点筛选 | Pass | Delta「行程景点锚点选择」「酒店与餐厅的默认列表与可选锚点」；Design D3；Tasks 3.2 | 5km、距离升序与共用锚点不变；切换类型重置页码 |
| AC-5 卡片结构 | Pass | Delta「地点卡片概览与简介」「地点卡片封面与评分」；Design D5/D6；Tasks 4.1–4.2 | 4:3 封面叠层、右下角评分徽标、标题、简介、Day 1 +；保留可访问名 |
| AC-6 简介字段与回退 | Pass | Delta「地点简介字段」；Design D7；Tasks 1.1–1.3、4.3 | 可空列；列表/详情返回；三处统一回退地址；不触发外部请求 |
| AC-7 页内类型入口移除与回归 | Pass | Delta「地点类型筛选」；Design D3/D4；Tasks 2.2、3.1 | 移除三个入口；搜索、chips、分页、地图联动保持 |
| AC-8 测试同步 | Pass | Tasks 5.1–5.2；Design D8；下方追溯表 | E2E 辅助与文案更新；新增断言计入 ≤30 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、三份 Delta、`design.md` Goals/Non-goals | 导航、URL 类型、门禁、卡片、简介均在范围内；医院入口、管理端简介、算法与导出明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` D1–D8；P1 OQ 8/8 resolved | 下拉结构、URL 契约、门禁、卡片细节、简介回退均定稿 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks / Trade-offs；下方 Residual concerns | E2E 破坏、空数据、截图标签缺口、查看详情偏差、迁移重复均有缓解 |
| DoV-4 Delta Spec 可校验 | Pass | `npx --no-install openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict` → valid（2026-11-19） | 四份 MODIFIED 需求保留既有场景名；一处 RENAMED + 同名 MODIFIED；两份 ADDED 需求结构完整 |
| DoV-5 场景覆盖与追溯 | Pass | 下方 Requirement ↔ Scenario ↔ AC ↔ Task 表 | 9 个 Requirement、37 个 Scenario；AC-1…AC-8 全部有场景与任务承接 |
| DoV-6 任务可执行 | Pass | `tasks.md` 5 组 14 项 | 每项含动作与验证点；P3 将补 ATDD 分层与红绿顺序 |
| DoV-7 实施交叉证据 | Pass | P4 完成（2026-11-19）：`gated`/`setTypeGroup` 残留已清除，页面可编译；`npm run build -w apps/web` ✓、`tsc -p apps/web/tsconfig.json --noEmit` ✓、vitest 372 passed、后端 `./mvnw test` 272/0/0 | Tasks 1.1–5.4 全部勾选；两处偏差见 Tasks §7 |
| DoV-8 跨 REQ 一致性 | Pass | P1 `analysis/REQ-019/impact-brief.md` §3–§4；`design.md` Non-goals | 不改城市、行程、政策匹配、地图、导出、伙伴提示契约 |
| DoV-9 迁移可验证 | Pass | `design.md` Migration；`V31__add_location_description.sql` | 可空列、无回填、可安全回滚；种子仅演示与 E2E |
| DoV-10 E2E 与全量验证 | Pass | `node scripts/run-e2e.mjs attraction-pet-rules.spec.ts nearby-location-filter.spec.ts companion-hints.spec.ts transport-rules.spec.ts` 通过；全量 `node scripts/run-e2e.mjs` → 109 passed（含 `admin-location-management`），服务端临时库未污染工作区数据库 | E13 用 `page.route` 桩 2 页数据验证切类型回第 1 页；地图详情卡简介无 Key 环境不可达，记待目视验证 |

## Requirement ↔ Scenario ↔ AC ↔ Task 追溯

| Delta Requirement | 类型 | Scenario 数 | AC | Tasks |
|---|---|---|---|---|
| 地点选择导航与类型页面 | ADDED | 3 | AC-1、AC-2 | 2.1–2.2 |
| 地点卡片概览与简介 | ADDED | 3 | AC-5、AC-6 | 4.1–4.3 |
| 地点类型筛选 | MODIFIED | 4 | AC-1、AC-2、AC-7 | 2.1–2.2 |
| 地点卡片封面与评分 | MODIFIED | 5 | AC-5 | 4.1–4.2 |
| 行程景点锚点选择 | MODIFIED | 6 | AC-3、AC-4 | 3.1–3.2 |
| 酒店与餐厅的默认列表与可选锚点 | RENAMED + MODIFIED | 4 | AC-3、AC-4、AC-7 | 3.1–3.2 |
| 地点简介字段 | ADDED | 3 | AC-6 | 1.1–1.3、4.3 |
| 顶部居中横向导航 | MODIFIED | 1 | AC-1 | 2.1 |
| Tab 与路由同步 | MODIFIED | 8 | AC-1、AC-7 | 2.1 |

- 合计 37 个场景：3 + 3 + 4 + 5 + 6 + 4 + 3 + 1 + 8 = 37，全部有 AC 与任务归属。
- 既有 5km 算法、距离文案与政策匹配由回归用例覆盖，不新增场景。

## Residual concerns

- **E2E 导航依赖（已收敛）**：4 个 spec 已改用 `combobox` 名「地点选择」或直接访问 URL；`NAV_TABS` 与 `transport-rules` 前 5 项文案同步为「地点选择」。
- **保留「查看详情」**：截图未展示该按钮；为避免详情弹窗失去入口并保持既有 E2E，设计采用低强调 ghost 文字按钮。若后续要求完全按截图，可改为标题区域打开详情并删除按钮。
- **截图第二个地点标签**：数据模型仅有单个 `keytag`，不臆造「户外区域」；只展示实际存在的标签。
- **景点锚点选择器**：Living Spec 仍保留「景点类型下行程景点锚点选择器」条目，但基线页面未见该控件；本 change 不新增也不删除该能力，P3/P4 不为其写新测试。
- **无锚点餐厅列表数量**：ATDD E6 预期 4 条，实际 3 条。需求 Non-goal 明确不改「宠物友好筛选」，「最近餐厅」（每人限养 0）仍被默认过滤，故按需求口径断言（3 条）并在 spec 内注释。
- **地图详情卡简介待目视**：无高德 JS Key 的 E2E 环境无法打开地图详情卡；该路径由 `locationDescription` 单测与代码评审覆盖，需在有 Key 环境确认。
- **G1 已签署；G2/G3 未签署**：本记录不代签。
- **UI 修订（2026-11-19）**：导航下拉合并为「景点」「酒店和餐厅」，酒店与餐厅共用同一页面并由页内「酒店」「餐厅」tag 切换；列表与地图并入同一外框。变更包随之新增「地点列表与地图同框」需求、`design.md` D9、`tasks.md` 第 8 组；`openspec validate --strict` 通过。E2E 辅助改为「导航选酒店和餐厅 + 页内 tag」，目标 5 spec 37 passed、全量 109 passed；`tsc`/vitest 372/build 通过；3003 目视确认下拉两项、tag 切换与同框布局（无高德 Key，地图区为占位）。

## Review outcome

P4 完成后复核为 **Pass（文档 + 本地实施证据）**：9 个 Delta Requirement、37 个 Scenario 与 REQ-019 的 8 条 AC 全部可追溯，`openspec validate --strict` 通过；DoV-7/DoV-10 已依据 build、tsc、vitest 372、后端 272、E2E 109 passed 转 Pass。UI 修订（2026-11-19）后新增「地点列表与地图同框」需求，Delta 场景增至 39 个，目标 37 + 全量 109 E2E、tsc/vitest/build 均通过。残余缺口为地图详情卡简介需有 Key 环境目视验证，以及餐厅条数按需求 Non-goal 的口径偏差（已在 `nearby-location-filter.spec.ts` 注释与 Tasks §7 记录）。本结果不代表 G2/G3 已批准，也不代表 CI 已通过。
