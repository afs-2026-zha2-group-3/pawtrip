# ATDD design — 2026-11-18-add-trip-packing-checklist

- Change：`2026-11-18-add-trip-packing-checklist`（REQ-017 行程携带清单与打包进度，US-18 / US-19）
- 输入：`specs/trip-packing-checklist/spec.md`（7 需求 / 28 场景）、`specs/trip-itinerary/spec.md`（3 需求 / 14 场景）、`design.md`（D1–D9）、P1 需求与 impact brief
- 范围：设计 API、组件与 E2E 验收层；模板映射等纯逻辑单测归 `/sdd:atdd-apply` 红绿实施
- Rules 对齐：`@rule:java-testing`（JUnit 5 + AssertJ + MockMvc + 独立 SQLite）、`@rule:typescript-testing`（Vitest + Playwright）；沿用现有测试产品与 CI，不新建 CI 语义

## 1. 分层结论

| # | Delta 场景（原文主题） | 层 | 附加值 | 理由（layer-inference 信号） |
|---|---|---|---|---|
| 1 | tpc「首次生成清单」 | API | — | 状态码 + 响应物品集合（优先级 1） |
| 2 | tpc「重复生成不重置」 | API | — | 200 + 物品 id 集合稳定；幂等为服务端约定（优先级 1） |
| 3 | tpc「访问他人行程」 | API | Security（advisory） | 404 `TRIP_NOT_FOUND` 且不泄露存在性（优先级 1） |
| 4 | tpc「未登录访问」 | API | Security（advisory） | 401 为全局安全边界（优先级 1） |
| 5 | tpc「删除行程级联删除清单」 | API | — | 删除行程后仓库查询为空；迁移测试兜底 FK（优先级 1+3） |
| 6 | tpc「猫的基础清单」 | API + Defer UT | — | 首屏可见总行数与运输包名称；映射细节归 `PackingTemplateTest`（优先级 1） |
| 7 | tpc「狗与飞机场景」 | Defer UT | — | 纯函数映射：航空箱 L、检疫证明、主粮 10（优先级 3） |
| 8 | tpc「牵引绳按档案生成」 | Defer UT | — | `hasLeash` 真假与肩高分档（优先级 3） |
| 9 | tpc「免疫证明按档案生成」 | Defer UT | — | 非飞机且档案为真（优先级 3） |
| 10 | tpc「物品分类固定」 | Defer UT | — | 分类集合与顺序（优先级 3） |
| 11 | tpc「档案变更更新模板项」 | API | — | 体重变化后模板名称刷新、勾选保留（优先级 1） |
| 12 | tpc「行程天数变更更新粮食」 | API | — | 主粮数量按天数刷新、行 id 不变（优先级 1） |
| 13 | tpc「大交通变更增减场景物品」 | API | — | 高铁↔飞机往返：补入/隐藏/恢复且勾选重置（优先级 1） |
| 14 | tpc「自定义项与手动数量保留」 | API | — | 同步后自定义行存在、覆盖数量不被模板改写（优先级 1） |
| 15 | tpc「删除的模板项不复活」 | API | — | 墓碑行跨场景往返仍不出现（优先级 1） |
| 16 | tpc「新增自定义物品」 | API + Component + E2E | — | 201、`CUSTOM`、`templateKey=null`；UI 与持久化（优先级 1+2） |
| 17 | tpc「修改数量并持久化」 | API + E2E | — | PUT 后 GET 仍为新值；刷新后保持（优先级 1+2） |
| 18 | tpc「删除物品」 | API + Component + E2E | — | 204；从响应、进度与列表消失（优先级 1+2） |
| 19 | tpc「非法新增请求」 | API + Component | — | 400 `VALIDATION_ERROR`；前端空名称拦截（优先级 1+2） |
| 20 | tpc「勾选与取消勾选」 | API + Component + E2E | — | 持久化勾选态与 1/4↔0/4 进度（优先级 1+2） |
| 21 | tpc「增删改变分母」 | API + E2E | — | 新增总数 +1、删除后总数 -1，分子不变（优先级 1+2） |
| 22 | tpc「全部完成」 | API + Component + E2E | — | `checked == total`；完成文案（优先级 1+2） |
| 23 | tpc「跨设备保留勾选态」 | E2E（reload）+ API | Compatibility（advisory） | 服务端唯一数据源；同账号重新读取一致（优先级 1+2） |
| 24 | tpc「尚未生成清单」 | API + Component + E2E | — | 404 `PACKING_CHECKLIST_NOT_FOUND` 且不建清单；前端生成引导（优先级 1+2） |
| 25 | tpc「无宠物档案」 | API + Component | — | 409 `PET_PROFILE_REQUIRED`；`/paws` 引导（优先级 1+2） |
| 26 | tpc「响应包含物品契约字段」 | API | — | 7 字段逐项断言（优先级 1） |
| 27 | tpc「自定义物品无模板键」 | API | — | `source=CUSTOM`、`templateKey=null`（优先级 1） |
| 28 | tpc「响应包含进度」 | API | — | `progress.checked/total` 精确值（优先级 1） |
| 29 | ti「展示打包进度」 | E2E | — | 页面文案「已打包 3 / 9 件」与入口同层（优先级 2） |
| 30 | ti「未生成清单」 | E2E | — | 「未生成」且无虚构进度（优先级 2） |
| 31 | ti「导出不包含清单」 | E2E（回归） | — | 打印媒体下入口/进度/弹窗隐藏；既有导出用例回归（优先级 2） |
| 32 | ti「勾选与取消勾选」 | Component + E2E | — | 行勾选态与弹窗/页面进度同步（优先级 2） |
| 33 | ti「新增自定义物品」 | Component + E2E | — | 新物品进入对应分类，总数 +1，刷新仍在（优先级 2） |
| 34 | ti「修改数量」 | E2E | — | 回车/失焦提交，刷新后保持（优先级 2） |
| 35 | ti「删除物品」 | Component + E2E | — | 行消失、总数减少（优先级 2） |
| 36 | ti「操作失败」 | Component | — | 可读错误且列表保留可继续操作（优先级 2+3） |
| 37 | ti「关闭弹窗保持当前天」 | E2E | — | 先切 Day 2，再开/关弹窗，Day 2 仍选中且无 `PUT /api/trips`（优先级 2+3） |
| 38 | ti「尚未生成时引导生成」 | Component + E2E | — | 文案 + 生成按钮，无物品列表（优先级 2） |
| 39 | ti「生成清单」 | Component + E2E | — | 生成后物品出现、页面进度更新（优先级 2） |
| 40 | ti「无宠物档案引导创建」 | Component | — | 409 后展示说明与 `/paws` 链接，不展示生成按钮（优先级 2） |
| 41 | ti「全部完成」 | Component + E2E | — | 100% 与完成文案（优先级 2） |
| 42 | ti「加载失败可重试」 | Component | — | 错误提示 + 重试按钮触发重新请求（优先级 2） |

- tpc = `trip-packing-checklist`；ti = `trip-itinerary`。
- 合计 42 个 Delta 场景（28 + 14），全部有层归属；未列入 API 的映射细节由 `PackingTemplateTest` 承接。
- **Deferred to `/sdd:atdd-apply`（unit-level TDD）**：`PackingTemplate.items()` 的边界与场景组合（体重 5/15、肩高 35/55、自驾晕车药、狗拾便袋、尿垫下限、猫飞机航空箱）、`packingChecklistQueryOptions` 的 404→null 映射、`packingErrorMessage` 映射。核心逻辑必须先写失败单测再实现。

## 2. 生产代码前先写的验收（红测）

### 2.1 API — `PackingChecklistApiTest`（已有 9 项，补 3 项）

已有用例与场景对应：

```text
A1 generatesChecklistAndReturnsSameChecklistOnRepeat      → 场景 1、2、6
A2 requiresAuthenticationAndHidesOtherUsersTrips          → 场景 3、4、24
A3 rejectsGenerationWhenPetProfileIsMissing               → 场景 25
A4 addsUpdatesAndDeletesCustomItems                       → 场景 16、17、18、21、28
A5 rejectsInvalidItemRequests                             → 场景 19
A6 tracksProgressByItemRows                               → 场景 20、22、28
A7 syncsTemplateItemsWithPetAndTripChanges                → 场景 11、12、13
A8 preservesCustomItemsQuantityOverridesAndDeletedTemplateItems → 场景 14、15
A9 deletesChecklistWithTrip                               → 场景 5
```

本轮新增（先红后绿）：

```text
A10 checklistItemsExposeContractFields
    GET 已生成清单：
    - 响应含 tripId/transportMode/totalDays/createdAt/updatedAt/progress/items
    - 模板项含 id/category/name/quantity/checked/source/templateKey，templateKey 非空
    - 自定义项 source=CUSTOM、templateKey=null
A11 updatesCustomItemNameAndCategory
    PUT {"name":"宠物背包","category":"TRAVEL","quantity":2,"checked":true}
    → 200；名称/分类/数量/勾选持久化；GET 仍为新值
A12 reportsFullProgressWhenAllItemsChecked
    逐项 PUT checked=true → GET progress.checked == progress.total
    → 取消其中一项后 checked == total - 1
```

### 2.2 单元 — `PackingTemplateTest`（已有 5 项，补 1 项边界表）

```text
T1 catOnHighSpeedRailGetsCarrierAndDailyFood          （已有）
T2 dogOnFlightGetsCrateAndQuarantineProof             （已有）
T3 leashOnlyWhenProfileHasLeashAndScalesByShoulderHeight （已有）
T4 vaccinationProofFromProfileOutsideFlightScenario   （已有）
T5 categoriesFollowFixedOrderAndSet                   （已有）
T6 boundaryTiersAndScenarioSpecificItems（新增，红测）
   - 体重 5.0→S、5.1→M、15.0→M、15.1→L
   - 肩高 34.9→S、35.0→M、54.9→M、55.0→L
   - transportMode=drive → 含 motion-sickness；狗 → 含 poop-bags
   - totalDays=1 → pee-pads 数量为 1；totalDays=3 → 3
   - 猫 + 飞机 → 含 air-crate、不含 cat-carrier
   - 狗 + 高铁 → 含 dog-carrier（按体重分档）
```

### 2.3 组件 — `packing-checklist-dialog.test.tsx`（已有 4 项，补 5 项）

```text
C1 guidesGenerationAndRendersItemsByCategory        （已有）
C2 guidesToCreatePetProfileWhenMissing              （已有）
C3 persistsChecksAndShowsCompletionState            （已有）
C4 addsCustomItemAndRejectsBlankNames               （已有）
C5 retriesAfterLoadFailure（新增，红测）
   GET 首次 500 → 展示「清单加载失败」与「重试」；点击重试后 GET 成功 → 展示物品
C6 showsEmptyStateAndKeepsAddForm（新增）
   GET 返回 items=[]、total=0 → 「清单暂无物品，可在下方新增」且新增表单可用
C7 deletesItemAndRemovesRow（新增）
   点击「删除 疫苗证明」→ 发出 DELETE；行消失、总数减 1
C8 showsActionErrorAndKeepsList（新增）
   PUT 返回 500 → `role=alert` 可读提示；原有物品仍可见、可继续操作
C9 resetsInvalidQuantityWithoutRequest（新增）
   数量输入 0 后回车 → 不发出 PUT，输入值回滚为原数量
```

### 2.4 E2E — `e2e/packing-checklist.spec.ts`（已有 3 项，补 3 项断言/用例）

```text
E1 generatesTheChecklistAndKeepsCheckedProgressAfterReload     （已有）
E2 persistsCustomItemsQuantityEditsAndDeletions                （已有）
E3 refreshesTemplateItemsOnProfileChangeAndPreservesUserEdits  （已有）
E4 closingDialogKeepsSelectedDay（新增）
   切到 Day 2 → 开/关携带清单 → Day 2 仍激活
   全程监听 `PUT /api/trips` 计数为 0
E5 hidesChecklistOnPrintMedia（新增）
   `page.emulateMedia({ media: "print" })` 后入口、进度、弹窗均不可见
   恢复 screen 后入口可见
E6 seedsProfileChangeIsRestored（并入 E3 的 finally）
   E3 修改豆豆体重后必须在 finally 恢复原体重，避免污染同 worker 其他 spec
```

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地后端 | `cd apps/server && ./mvnw test`（Windows `./mvnw.cmd`） | 先红后绿；定向 `-Dtest=PackingChecklistApiTest,PackingTemplateTest,PackingChecklistSchemaMigrationTest` |
| 本地前端 | `npm run test -w apps/web` | 先红后绿（组件新增 C5–C9）；同时回归既有 vitest |
| 类型/构建 | `npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build` | 前端契约与构建 |
| 本地 E2E | `node scripts/run-e2e.mjs e2e/packing-checklist.spec.ts`，再 `node scripts/run-e2e.mjs` | 运行器临时 DB + 全量迁移 |
| 规格校验 | `npx --no-install openspec validate 2026-11-18-add-trip-packing-checklist --strict` | 工件一致性 |
| CI | 现有 `server.yml` / `web.yml` / `e2e.yml` | 不新增 CI 语义；PR 触发即门禁 |

## 4. 数据与夹具策略

- **API 夹具**：`PackingChecklistApiTest` 独立 SQLite `target/packing-api-test.db?foreign_keys=on`，`@DynamicPropertySource` 每次删除重建；每个用例使用 UUID 用户名隔离用户、宠物与行程。
  - 主用户宠物 `Mimi`：CAT、4.5kg、25cm、`hasLeash=1`、`hasVaccinationProof=0`；他人宠物 `Rex`：DOG、18kg、60cm。
  - `PET_PROFILE_REQUIRED` 通过直连 JDBC 删除宠物行构造（现网接口禁止删除被行程引用的档案）。
  - 模板边界由 `PackingTemplateTest` 直接构造 `Trip`/`Pet` 纯对象，不触库。
  - 迁移安全由 `PackingChecklistSchemaMigrationTest` 在 `@TempDir` 中跑 Flyway，验证唯一约束、CHECK、索引与级联。
- **E2E 种子**：`signIn` + `resetTrips`；固定种子宠物「豆豆」（CAT、4.5kg、25cm、有牵引绳与疫苗证明）；通过 `createTripViaApi` 创建 2 天珠海行程（`cityAdcode=440400`，固定 `startDate=2026-12-01`），再 `PUT /api/trips/{id}` 写入 `transportMode=high_speed_rail` 与空 plan；在「我的行程」页激活后进入 `/itinerary`。
- **档案变更隔离**：E3 通过 `GET /api/pets/{id}` + `PUT /api/pets/{id}` 修改体重为 12kg；**必须**在 `finally` 恢复原体重，防止同 worker 其他 spec 读到被改动的豆豆。
- **确定性**：模板为静态常量，无外部服务；E2E 断言精确文案（「已打包 X / Y 件」「猫用运输包（M 码）」），不依赖时间、随机数或网络。

## 5. Non-goals 与反向验证

| Non-goal（design / proposal Out） | 反向用例 | 层 |
|---|---|---|
| 不做 AI 生成、不调用外部服务 | 后端无新外部客户端与配置；E2E 仅出现本站 API 请求 | 检查 + API |
| 不做模板管理界面、不建模板表 | V29 仅两张表；无新增管理端路由/接口 | 迁移测试 + 检查 |
| 不做出发前未完成提醒/推送 | 无定时任务、通知代码与 UI 入口 | 检查 |
| 不做一键购买/电商跳转 | 弹窗无购买按钮与外链 | Component |
| 不做清单分享与独立导出 | 弹窗无导出按钮；入口与进度 `print:hidden` | Component + E2E E5 |
| 不改 `trip-planning` 计划结构、`paws-page` 档案字段 | 无相关迁移/字段变更；既有行程与档案 E2E 回归 | 检查 + E2E |
| 不改变行程单既有导出 | `e2e/itinerary.spec.ts` 回归通过 | E2E |

本 skill 不产出 Playwright/POM/Excel 生成器，不新建 CI 产品，不写业务代码与 UT 套件。

## 6. NFR

不纳入。沿用本仓库既有 change 约定：本 change 不新增性能、可观测性、韧性测试；安全沿用全局认证与属主校验（401/404 已在 API 层覆盖），数据一致性由事务与唯一约束覆盖。如需求方后续要求 NFR，可在 apply 前追加专项小节。
