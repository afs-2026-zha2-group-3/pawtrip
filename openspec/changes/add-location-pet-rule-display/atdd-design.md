# ATDD Design — add-location-pet-rule-display（Revision 2）

- 日期：2026-11-16（Revision 3，G1 重签前）
- 上游：`specs/attraction-pet-rules/spec.md`（6 需求）、`specs/web-app-shell/spec.md`（1 需求）、`dov-ac-review.md`、`design.md`、`tasks.md`
- 修订说明：Revision 2 移除三档 `entry_policy`/`entry_note` 与新增迁移；默认列表按 `maxPetsPerPerson >= 1`；公开页只读数据库。Revision 3 新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入，城市浏览页不内嵌入口。

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `@SpringBootTest` + `@AutoConfigureMockMvc` + 独立 SQLite（`target/*.db`），参照 `AdminLocationApiTest`；新增 `apps/server/.../location/LocationQueryApiTest.java` | 单端点契约：默认 `maxPetsPerPerson >= 1`、全部模式、详情 `petPolicies`、分页、401/404/400、角色、无高德调用 |
| E2E | Playwright，新增 `e2e/attraction-pet-rules.spec.ts`；真实后端 + 独立 E2E SQLite；复用 `destination-selection.spec.ts` 的登录与城市选择模式 | 用户可见路径：`/cities` 选定城市 → 查看景点 → 默认/全部 → 详情 → 空态 → Tab 选中 |
| Defer UT | 前端 `maxPetsPerPerson` 三态 badge 纯函数、字段格式化纯函数 | apply 期 unit-level TDD，本文不展开 UT 套件 |

NFR 测试：用户 2026-11-16 确认 **out of scope**（本 change 无 SLA/并发/可观测性新需求），仅 API + E2E 功能验收。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 建议附加 | 依据 |
|---|---|---|---|---|
| A1 | `GET /api/locations/attractions?regionCode=440400` 默认只返回 `maxPetsPerPerson >= 1` 景点；非景点不返回（列表/API） | API | Security（advisory） | 单端点 body 契约 |
| A2 | `includeWithoutRules=true` 返回该城市全部景点；摘要含可空 `maxPetsPerPerson`（列表口径/API） | API | — | 单端点 body 契约 |
| A3 | 区县级 `region_code` 通过城市前缀归入所选城市（例如 440402 归 440400）（列表/API） | API | — | 城市匹配契约 |
| A4 | 详情返回 `petPolicies` 的 8 个可空字段；`NULL` 保持 `null`（详情/API） | API | — | 单端点 body 契约 |
| A5 | 未认证请求列表/详情 → `401 UNAUTHENTICATED`（API 权限） | API | Security（advisory） | Problem Details |
| A6 | 不存在的 `poiId` → `404 LOCATION_NOT_FOUND`（API 错误） | API | — | 单端点状态码 |
| A7 | `regionCode` 缺失/非法、`page/pageSize` 非法 → `400`（API 错误） | API | — | 查询参数契约 |
| A8 | `USER` 角色可读列表与详情；不要求 `ADMIN`（API 权限） | API | Security（advisory） | 角色边界 |
| A9 | 列表/详情只读数据库，不调用高德（API 反向） | API | — | `verifyNoInteractions(placeSearchPort)` |
| A10 | 分页：`pageSize=1` 翻页返回不同条目与正确 `totalPages`（API 分页） | API | — | 分页契约 |
| A11 | 反向：不存在公开写入端点（POST/PATCH/DELETE）（Non-goal 只读） | API | — | 路由面断言 |
| A12 | 反向：管理 API 详情不含三档/说明字段；公开详情不含照片/business（Non-goal） | API | — | JSON 字段 absence |
| E1 | 选定珠海 → 自动进入 `/attractions` 并选中“景区浏览”Tab；默认只显示 `maxPetsPerPerson >= 1` 景点；酒店与其他城市景点不出现（列表/入口） | E2E | — | 跨页面 UI |
| E2 | 打开“显示全部景点” → 0 显示“禁止携带”、NULL 显示“未配置”；宠物友好景点显示“宠物友好”；酒店仍不出现（三态/切换） | E2E | — | UI 可见 + 过滤 |
| E3 | 宠物友好景点详情：数量/体重/肩高/布尔/费用/允许类型值正确；空字段不显示（详情/字段语义） | E2E | — | UI 可见 |
| E4 | 禁止携带/未配置景点详情：状态正确；全部政策为空时显示“暂无携宠政策”（三态/详情） | E2E | — | UI 可见 |
| E5 | 从景区页切回城市浏览，重选杭州 → 自动回到景区 Tab；默认只显示友好景点；珠海景点不出现（城市切换） | E2E | — | 跨页面状态 |
| E6 | 未选目的地直接打开 `/attractions` → 提示 + 去 `/cities`；不发起景点列表请求（未选城市） | E2E | — | UI + 网络 absence |
| E7 | `/attractions` 与 `/attractions/{poiId}` 下“景区浏览”Tab 选中；“城市浏览”不选中（web-app-shell） | E2E | — | 导航状态 |
| E8 | 选定广州 → 无已保存景点 → “该城市暂无已保存景点”（空态） | E2E | — | UI 空态 |
| E9 | 选定南京（仅有 0/NULL 政策）→ 默认“暂无宠物友好的已保存景点”；切换全部后显示 0/NULL 状态（空态/切换） | E2E | — | UI 空态 + 切换 |
| E10 | 反向：`/attractions` 无城市选择器、无类型筛选、无编辑/保存/删除/加入行程；详情无编辑入口（Non-goals） | E2E | — | absence 断言 |
| E11 | 登出后重新登录，直接打开 `/attractions` 仍提示先选目的地（登出清理） | E2E | — | 跨页面状态 |
| E12 | 反向：`/cities` 不内嵌景点列表，不显示“查看{城市}景点”按钮（Non-goal） | E2E | — | absence 断言 |

## 3. 先于生产代码编写（red 顺序）

1. **A1–A10 先红**：新增 `LocationQueryApiTest`，用仓库 helper 造景点/酒店数据；先断言 401/404/400、默认 `>=1`/全部、摘要 `maxPetsPerPerson`、分页与无高德调用 → 驱动仓库查询、只读服务与 API。
2. **A11–A12 先红**：路由面与 JSON absence，随 API 一起转绿。
3. **E1–E9、E12 先红**：新增 `e2e/attraction-pet-rules.spec.ts` 与 E2E 种子脚本；先写“选定城市 → 自动进入景区 Tab → 列表 → 切换 → 详情 → 空态”断言 → 驱动 `/attractions` 页面、导航 Tab 与自动跳转。
4. **E10–E11 反向用例**随主体红→绿。
5. badge 三态/字段格式化纯函数在 apply 期以 UT TDD 补齐（见第 8 节）。

## 4. 本地 vs CI 门禁（对齐既有 Rules，不新造语义）

- 本地 API：`cd apps/server && ./mvnw test`（与 CI 同一测试）
- 本地 E2E：`npm run test:e2e`（无头，与 CI 相同）；有头调试用 `npm run test:e2e:headed`
- CI：既有 GitHub Actions；Playwright Chromium 无头，任一失败即阻断
- 回归：既有 `AdminLocationApiTest`、`DestinationApiTest`、`authentication` / `destination-selection` / `admin-location-management` E2E 必须保持绿（Non-goal「不改既有认证/错误/高德/管理行为」的验证方式）

## 5. 数据 / fixtures 策略

**API 层**

- 每测试类独立 SQLite（`target/attraction-query-api-test.db`，`@DynamicPropertySource` 重置）；Flyway 自动建表；认证用 `SecurityMockMvcRequestPostProcessors.user()`。
- `@BeforeEach` 清空 `location_photo` 与 `pawtrip_location`；仓库 helper 插入：
  - 珠海：情侣路（440402，`maxPetsPerPerson=1` + 全字段）、珠海渔女（440402，`maxPetsPerPerson=0` + 部分字段）、珠海海滨公园（440400，`maxPetsPerPerson=NULL` + 部分字段）、珠海某酒店（`typeGroup=hotel`，`maxPetsPerPerson=1`）。
  - 杭州：西湖（330106，`maxPetsPerPerson=1`）、灵隐寺（330100，`maxPetsPerPerson=0`）。
  - 南京：中山陵（320102，`maxPetsPerPerson=0`）、玄武湖（320102，`maxPetsPerPerson=NULL`）。
- `@MockitoBean PlaceSearchPort` 用于断言无高德交互；不 mock 数据访问。

**E2E 层**

- 新增 `scripts/seed-e2e-attractions.mjs`，由 `scripts/run-e2e.mjs` 在 `seed-users.mjs` 之后、前端启动之前调用；只操作本次临时 E2E 库，不触碰 `apps/server/data/pawtrip.db`。
- 脚本用 `node:sqlite` 插入确定性 `poi_id`（前缀 `e2e-`），`poi_json`/`business_json` 写 `{}`；重复执行按 `poi_id` 覆盖。
- 夹具数据：
  - 珠海：`e2e-zhu-a` 情侣路（440402，`maxPetsPerPerson=1`，数量/体重/肩高/布尔/费用/允许类型）、`e2e-zhu-b` 珠海渔女（440402，`maxPetsPerPerson=0` + 部分字段）、`e2e-zhu-c` 珠海海滨公园（440400，`maxPetsPerPerson=NULL` + 部分字段）、`e2e-zhu-hotel` 珠海某酒店（hotel，`maxPetsPerPerson=1`）。
  - 杭州：`e2e-hz-a` 西湖（330106，`maxPetsPerPerson=1`）、`e2e-hz-b` 灵隐寺（330100，`maxPetsPerPerson=0`）。
  - 南京：`e2e-nj-a` 中山陵（320102，`maxPetsPerPerson=0`）、`e2e-nj-b` 玄武湖（320102，`maxPetsPerPerson=NULL`）；广州不放假数据。
- 清理：E2E 每轮创建/删除临时库；API 每类重置；sessionStorage 随新浏览器上下文天然清空，E11 顺带验证登出清除。

## 6. Non-goals 与反向验证

| Non-goal | 反向用例 | 层 |
|---|---|---|
| 城市选择控件 | E10：`/attractions` 无城市搜索/选择控件 | E2E |
| 城市浏览页内嵌景点/入口 | E12：`/cities` 无景点列表、无“查看景点”按钮 | E2E |
| 地点类型筛选 | E10：无类型筛选控件 | E2E |
| 景点编辑/保存/删除 | E10：详情无编辑/保存/删除入口 | E2E |
| 行程内展示（AC-2） | E10：无“加入行程”/行程区块 | E2E |
| 非景点类型公开列表 | A1/A2、E1/E2：酒店不出现在列表 | API + E2E |
| 新增三档/说明字段 | A12、E10：管理 API 无 `entryPolicy`/`entryNote`；页面无三档录入 | API + E2E |
| 照片/business/原始 POI 展示 | A12：公开详情 JSON 不含这些字段 | API |
| 高德调用 | A9：`verifyNoInteractions(placeSearchPort)` | API |
| 公开写入接口 | A11：POST/PATCH/DELETE 不存在 | API |
| 数据库迁移/新列 | 代码审查：无新 migration、实体无新字段 | 审查 |

## 7. NFR 测试

用户 2026-11-16 确认不纳入：无 SLA、并发、可观测性新需求；不新增性能/日志/指标验收。

## 8. Defer UT 清单（apply 期 TDD）

- 前端 `maxPetsPerPerson` 三态纯函数：`>=1` → 宠物友好；`0` → 禁止携带；`null` → 未配置。
- 前端字段格式化：布尔 `需要/不需要`、费用分转元、允许宠物类型 `猫/狗/猫和狗`、数量/体重/肩高单位、空值隐藏。
- 后端摘要映射：`maxPetsPerPerson` 原样返回；API 测试覆盖主要分支。
