# ATDD design — add-city-personalized-recommendation

- Change：`add-city-personalized-recommendation`（REQ-014）
- 输入：`specs/paws-page/spec.md`（8+9 场景）、`specs/destination-selection/spec.md`（14 场景）、`design.md`（D1–D9）、G1 Pass（IO=SUKI / SA=RANLE，`g1-decision.md`）
- 范围：只设计 API 与 E2E 验收层；单元级 TDD 留给 `/sdd:atdd-apply`
- Rules 对齐：`@rule:java-testing`（JUnit5+AssertJ+MockMvc）、`@rule:typescript-testing`（Playwright）；沿用现有测试产品，不新建 CI 语义

## 1. 分层结论

| # | Scenario（delta 原文主题） | 层 | 附加建议 | 理由（layer-inference 信号） |
|---|---|---|---|---|
| 1 | 详情展示喜好与性格 / 详情未设置 | E2E | — | THEN 断言弹窗可见文本（优先级 2） |
| 2 | 整卡点击/键盘/编辑保存/取消/保存失败/品种展示（MODIFIED 既有 6 场景） | E2E（回归） | — | 既有 `paws-pet-management.spec.ts` 已覆盖，改后必须仍绿 |
| 3 | 创建时勾选喜好并选择性格 | API + E2E | — | POST 契约回显 + 表单跨页路径 |
| 4 | 编辑回显与修改 | API + E2E | — | PUT 契约 + 弹窗勾选态回显 |
| 5 | 不填喜好与性格也可保存 | API + E2E | — | 可空契约 + 无必填错误 UI |
| 6 | 清空已保存的喜好与性格 | API + E2E | — | 空数组/null 契约 + 详情「未设置」 |
| 7 | 未知喜好键 / 未知性格键被拒绝 | API | security（advisory） | 单端点 400 `VALIDATION_ERROR`；真实 SQLite + 仓库断言证明「不落库」（优先级 1+3，API 层即可证 absence） |
| 8 | 重复喜好键去重 | API | — | 单端点响应回显去重集合 |
| 9 | 旧客户端不传新字段仍合法 | API | — | 省略字段兼容契约 |
| 10 | 旧档案读取兼容 | API | — | JDBC 直插 NULL 列旧行后 GET 断言（夹具构造迁移前状态） |
| 11 | 已标注城市携带特征 / 未标注为空 | API | — | `GET /api/destinations` 响应字段契约（珠海 COASTAL、杭州 LAKE+CITY_PARK、未标注 []） |
| 12 | 既有契约行为不变（keyword/petFriendly/名称升序/401） | API + E2E（回归） | security（advisory） | 既有 `DestinationApiTest` 与 `destination-selection.spec.ts` 必须仍绿 |
| 13 | 喜好驱动排序 / 性格加成 / 仅性格 / 同特征只计一次 / 同分名称序 | E2E | — | 前端不按 TDD（用户决定 2026-11-17）；用户可见位次走 E2E（优先级 2） |
| 14 | 未填维持名称序（含无档案/读取失败） | E2E | — | 页面位次与无徽标；null 档案分支由 E2E 退化用例覆盖 |
| 15 | 多宠物取第一只 | E2E | — | 两只宠物造数后位次断言 |
| 16 | 筛选与搜索叠加 | E2E | — | 排序作用于过滤后集合 + 计数同步 + 政策标签/选定不变 |
| 17 | 被推荐徽标 / 未命中无徽标 / 与政策标签并存 / 未启用无徽标 | E2E | Compatibility（advisory，窄屏目视） | 卡片右上角可见标记与遮挡断言（优先级 2） |

前端测试约定（2026-11-17 用户决定，取代原 Defer UT 清单）：**前端不按 TDD**，不新增 UT 红测；`scoreCity`/`sortByRecommendation`/词表常量/`pet-profile` 新字段解析直接实现，正确性由 E2E（§2 表）+ tsc/build + 既有 vitest 回归保障。后端仍严格 TDD（先红后绿）。

## 2. 生产代码前先写的验收（红测）

### API — 扩展 `PetApiTest`（MockMvc + `target/pet-api-test.db`，`user("demo")`）

```text
POST /api/pets / PUT /api/pets/{id}
请求新增：preferences: ["SWIMMING","GRASS_RUNNING"]（可省略/[]），personality: "ENERGETIC"（可省略/null）
200/201：响应回显 preferences（去重后）与 personality
400：preferences 含 "FLYING" 或 personality 含 "WILD" → Problem Details code=VALIDATION_ERROR，仓库断言行未写入/未修改
GET /api/pets：旧行（JDBC 直插 preferences/personality NULL）→ preferences=[]、personality=null，其余字段不变
既有必填校验红测保持：缺名字/类型/犬种/体重/肩高仍 400（回归）
```

红测清单：创建回显 / 编辑回显 / 不填可存 / 清空（[]+null）/ 非法喜好键 / 非法性格键 / 重复键去重 / 省略字段 / 旧档案读取 / 非法请求不落库。

### API — 扩展 `PetSchemaMigrationTest`（V26/V27）

红测清单：V26 后 pet 新列存在且默认 NULL、旧行读取兼容；V27 后 `administrative_region.feature_tags` 存在、48 城种子命中（珠海=COASTAL、杭州=LAKE,CITY_PARK）、未标注城市 NULL、重复执行迁移幂等（Flyway 历史）。

### API — 扩展 `DestinationApiTest`

```text
GET /api/destinations
200：珠海项 featureTags 含 COASTAL；杭州项含 LAKE 与 CITY_PARK；未标注项 featureTags=[]
既有断言不变：keyword/petFriendly/petType/breedId/shoulderHeightCm 过滤、服务端名称升序、401 UNAUTHENTICATED
反向：携带任意排序类未知参数不改变名称升序（接口不新增排序能力）
```

### E2E — 新增 `e2e/city-personalized-recommendation.spec.ts` + 扩展 `paws-pet-management.spec.ts`

登录沿用 `signIn`（demo，API 注入会话）；宠物造数走 `POST /api/pets`（携带 preferences/personality），清理走 `DELETE /api/pets/{id}`；城市特征来自 V27 种子（临时 DB 天然可用）。

| 用例 | 驱动方式 | 断言 |
|---|---|---|
| 表单维护闭环 | UI 勾选「游泳」「草地奔跑」+ 性格「活泼好动」创建 → 详情 → 编辑回显 → 清空保存 | 请求键数组正确；详情「喜好：游泳、草地奔跑」「性格：活泼好动」；清空后「未设置」；不填无必填错误 |
| 喜好驱动排序 | 第一只宠物 preferences=["SWIMMING"] | 珠海/三亚/杭州卡片位次先于未命中城市（如北京按名称序应在前但被压后）；同分维持名称升序 |
| 性格加成与仅性格 | personality="CALM"、preferences=[] | 杭州（LAKE/CITY_PARK）排前；无喜好也生效 |
| 徽标契约 | 同上造数 | 得分>0 卡片右上角「系统推荐」徽标；0 分卡片无；徽标卡片无推荐理由文字；与政策标签同时可见 |
| 未填退化 | 宠物两字段未设置 / 删除全部宠物 | 名称序（与现状一致）；所有卡片无徽标 |
| 多宠取第一只 | 第一只 SWIMMING、第二只 SNOW_PLAY | 海滨/湖泊排前，雪景城市不因此排前 |
| 筛选搜索叠加 | 排序生效中开「宠物友好筛选」、搜索「杭州」 | 计数同步；过滤后集合内仍按得分序；政策标签与选定流程不变 |
| 旧档案兼容 | JDBC/API 造 NULL 字段宠物 | 详情「未设置」；/cities 名称序无徽标 |

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地后端 | `cd apps/server; ./mvnw test` | PetApiTest / PetSchemaMigrationTest / DestinationApiTest 扩展红测先红后绿 |
| 本地前端 | `cd apps/web; npm.cmd run test`（vitest run）、`npm.cmd run build`、`npx tsc --noEmit -p apps/web/tsconfig.json` | 前端直接实现（非 TDD）；vitest 仅回归既有；不新增检查项 |
| 本地 E2E | `npm.cmd run test:e2e`（根目录） | `scripts/run-e2e.mjs` 临时 DB（18080/3100）+ 全量迁移 + 种子账号 |
| CI | 现有 `server.yml` / `web.yml` / `e2e.yml` | 不新增 CI 语义；PR 触发即门禁 |

## 4. 数据与夹具策略

- **API 夹具**：各测试类独立临时 SQLite（`target/pet-api-test.db` 等），`@DynamicPropertySource` 重置 + Flyway 全量迁移；旧档案行用 JDBC 直插 NULL 新列构造；非法请求「不落库」用 `PetRepository` 断言行数/字段不变；认证 `user("demo")` 后置处理器 + csrf。
- **E2E 夹具**：runner 每次临时 DB 执行全部迁移，V27 的 48 城特征种子天然可用；宠物经 API 创建/删除（不 mock 档案接口）；demo 账号初始无宠物（`paws-pet-management` 先例），用例自带造数与清理，避免跨用例污染。
- **确定性**：同分断言依赖服务端名称升序（既有契约）；「第一只宠物」= `GET /api/pets` 列表首条（`pet-profile.ts` 既有约定）；排序断言用卡片相对位次而非绝对索引，避免种子城市增减脆断。
- **词表夹具**：API 红测直接使用 D1 键常量字符串；前端词表常量实现时对照 D1（代码审查 + E2E 键驱动断言；漂移风险缓解见 dov-ac-review 残余风险 1）。

## 5. Non-goals 与反向验证

| Non-goal（proposal Out） | 反向用例 | 层 |
|---|---|---|
| 管理端特征维护界面/写接口 | `/admin/cities` 无特征标签编辑控件；`PATCH /api/admin/cities/{adcode}` 请求/响应契约不含 featureTags（`AdminCityRequests.UpdateCity` 记录不变，特征仅由 V27 种子维护） | E2E + API |
| 推荐理由文字 | 被推荐卡片除「系统推荐」外无理由文本（断言卡片文本不含「因为/推荐原因」类字样） | E2E |
| 后端排序/排序参数 | `GET /api/destinations` 对已填喜好用户仍名称升序；未知排序参数不改变顺序 | API |
| 多宠聚合打分 | 第二只宠物 SNOW_PLAY 不使雪景城市排前（多宠用例反向断言） | E2E |
| 推荐开关 | `/cities` 无推荐开关控件；未填即退化，无手动启停入口 | E2E |

本 skill 不产出 Playwright/POM/Excel 生成器，不新建 CI 产品，不写业务代码与 UT 套件。

## 6. NFR

不纳入。2026-11-17 与用户确认：本 change 不做性能、可观测性、韧性等 NFR 测试；安全沿用全局认证（401 已在 API 层回归覆盖）。