# Tasks

> 上游：REQ-014（requirements/REQ-014、analysis/REQ-014/{impact-brief,deep-dive}）。设计双链接：[design.md](design.md)（D1–D9）与 [atdd-design.md](atdd-design.md)（API+E2E 分层、红测清单、夹具与反向验证）。实现约定（2026-11-17 用户决定）：**后端按 TDD**（每组先写失败测试再实现）；**前端不按 TDD**，直接实现，以 E2E + build/tsc + 既有 vitest 回归验证。词表以 design D1 为单点依据。

## 1. 词表与数据库迁移

- [x] 1.1 先扩展 `PetSchemaMigrationTest` 失败断言（V26 新列存在且默认 NULL、旧行读取兼容），再新增 `V26__add_pet_preferences_personality.sql`（pet 表 `preferences`/`personality` 可空 TEXT 列）；验证：迁移测试转绿，后端测试上下文 Flyway 启动成功
- [x] 1.2 先扩展 `PetSchemaMigrationTest` 失败断言（feature_tags 列存在、珠海 440400=COASTAL、杭州 330100=LAKE,CITY_PARK、未列出城市 NULL），再新增 `V27__add_region_feature_tags.sql`（administrative_region 增 `feature_tags TEXT` + 按需求附录 A UPDATE 48 城）；验证：迁移测试转绿
- [x] 1.3 后端新增喜好/性格枚举与特征键常量（design D1 词表）；验证：编译通过，枚举键与附录 A/前端词表逐项一致（对照检查）

## 2. pet API 契约与校验（含本组测试与文档）

- [x] 2.1 先写失败 API 测试（扩展 `PetApiTest`）：创建/编辑携带合法 preferences/personality 持久化并回显；不传/空数组=未设置；未知喜好键、未知性格键 → 400 VALIDATION_ERROR 且仓库断言不落库；重复键去重；旧档案（JDBC 直插 NULL 行）读取兼容（对应 paws-page delta「宠物喜好与性格维护」9 场景）
- [x] 2.2 扩展 `Pet` 实体、`PetRequests`/`PetResponses`、`PetService` 校验与读写（逗号分隔存储，trim/去空段/去重）；验证：2.1 测试全部转绿，既有 pet API 测试不回归
- [x] 2.3 更新 `docs/knowledge/interfaces/http-api.md` pet 契约段落（preferences/personality 字段、枚举词表、400 语义）；验证：文档与 2.1 测试断言一致

## 3. 档案表单与详情（含本组 E2E）

- [x] 3.1 扩展 `queries/pets.ts` `Pet` 类型与创建/更新 payload（preferences/personality）；验证：tsc/build 通过
- [x] 3.2 `-pet-dialogs.tsx` 创建/编辑表单新增喜好 Checkbox 组（5 项）与性格 Select（含「未设置」sentinel→null），详情视图展示两字段（未填显示「未设置」）；既有必填校验不变；验证：tsc/build 通过
- [x] 3.3 更新 `e2e/paws-pet-management.spec.ts`：勾选喜好+选择性格创建→详情展示→编辑回显→清空保存显示「未设置」；不填时无必填错误；API 造 NULL 字段旧档案→详情「未设置」（atdd-design §2 表单维护闭环/旧档案兼容行）；验证：该 spec 全部通过且既有用例不回归（E2E 运行委托用户手动验证，2026-11-17 用户决定；本地 run-e2e 启动器 /login 404 问题另行记录）

## 4. 城市特征下发（含本组测试与文档）

- [x] 4.1 先写失败 API 测试（扩展 `DestinationApiTest`）：`GET /api/destinations` 每项含 featureTags（珠海=COASTAL、杭州=LAKE,CITY_PARK、未标注空数组）；keyword/petFriendly 等参数与名称升序不变；未认证 401；反向：未知排序类参数不改变名称升序、管理端 PATCH 契约不含 featureTags（对应 destination-selection delta「候选城市特征标签契约」3 场景 + atdd-design §5 反向行）
- [x] 4.2 `AdministrativeRegion` 增只读 featureTags 映射、`DestinationResponse` 增 `featureTags` 并在 toResponse 解析（trim/去空段/去重，NULL→空数组）；验证：4.1 测试转绿，既有 destination 测试不回归，管理端写路径不触碰新列
- [x] 4.3 更新 `docs/knowledge/interfaces/http-api.md` destinations 契约段落与 `docs/knowledge/domain/city-pet-policy.md`（或新条目）登记特征词表与 48 城种子口径；验证：文档与附录 A 一致（实际采用新条目 `domain/city-feature-tags.md` 并登记 _INDEX）

## 5. 前端打分排序与徽标（含本组 E2E）

- [x] 5.1 新增 `lib/destination-recommendation.ts` 纯函数（`scoreCity` 喜好映射/同特征去重/性格三档加成，`sortByRecommendation` 得分降序、同分保持输入序、profile null/两字段空不重排）与前端词表常量（前端不按 TDD，直接实现）；验证：tsc/build 通过，既有 vitest 不回归
- [x] 5.2 `PetProfile` 扩展 preferences/personality（null 退化语义不变）；验证：tsc/build 通过，`pet-profile.test.ts` 既有用例不回归（类型适配如需）
- [x] 5.3 `cities.tsx` 渲染前应用排序；得分 >0 卡片右上角 shadcn Badge「系统推荐」（绝对定位、aria-label、无理由文字）；验证：tsc/build 通过
- [x] 5.4 新增 `e2e/city-personalized-recommendation.spec.ts`（atdd-design §2 E2E 表）：喜好「游泳」→海滨/湖泊排前且右上角徽标、同分名称序；仅性格 CALM 也生效；0 分无徽标、徽标无理由文字、与政策标签并存；未填/无宠物→名称序无徽标；多宠取第一只（第二只 SNOW_PLAY 不抬升雪景城市）；筛选/搜索叠加计数同步；/cities 无推荐开关控件；验证：新 spec 全部通过，既有 `destination-selection.spec.ts` 不改且仍绿（回归）（E2E 运行委托用户手动验证，2026-11-17 用户决定；tsc 独立类型检查与 --list 收集 7 用例通过。账号策略偏离 atdd-design demo 口径：改用 worker 账号 + PAWTRIP_E2E_DB_PATH 直连快照/恢复种子宠物，避免与 paws(demo) 并发冲突，且毛毛无品种无法经 API 等价重建）

## 6. 集成验证

- [ ] 6.1 全量本地验证：后端 `mvnw test`、前端 vitest + build、E2E 全量；验证：全部通过，无既有能力回归
- [ ] 6.2 `openspec validate add-city-personalized-recommendation --strict` 通过；对照 delta 场景逐条核对实现覆盖（AC-1…AC-6）

## Workflow follow-up

- G1 已 Pass（IO=SUKI，SA=RANLE，2026-11-17，g1-decision.md）；P3 对齐自检见 alignment-self-check.md。
- 实现走 `/sdd:atdd-apply`（红绿 TDD）；完成后 `/sdd:local-verify-report` → G2 → PR → G3 → 归档。
- 归档时合并 Living Spec（paws-page、destination-selection）并复核 KB 词表登记。