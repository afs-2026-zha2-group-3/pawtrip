# Tasks

> 上游：REQ-014（requirements/REQ-014、analysis/REQ-014/{impact-brief,deep-dive}）。实现遵循 TDD：每组先写失败测试再实现。词表以 design D1 为单点依据。

## 1. 词表与数据库迁移

- [ ] 1.1 新增 `V26__add_pet_preferences_personality.sql`（pet 表 `preferences`/`personality` 可空 TEXT 列）；验证：后端测试上下文启动 Flyway 迁移成功，旧 pet 行读取两列为 NULL
- [ ] 1.2 新增 `V27__add_region_feature_tags.sql`（administrative_region 增 `feature_tags TEXT` + 按需求附录 A UPDATE 48 城）；验证：迁移后查询珠海 440400=COASTAL、杭州 330100=LAKE,CITY_PARK、未列出城市为 NULL（API 测试或迁移断言）
- [ ] 1.3 后端新增喜好/性格枚举与特征键常量（design D1 词表）；验证：编译通过，枚举键与附录 A/前端词表逐项一致（对照检查）

## 2. pet API 契约与校验（含本组测试与文档）

- [ ] 2.1 先写失败 API 测试：创建/编辑携带合法 preferences/personality 持久化并回显；不传/空数组=未设置；未知喜好键、未知性格键 → 400 VALIDATION_ERROR 不落库；重复键去重；旧档案读取兼容（对应 paws-page delta「宠物喜好与性格维护」8 场景）
- [ ] 2.2 扩展 `Pet` 实体、`PetRequests`/`PetResponses`、`PetService` 校验与读写（逗号分隔存储，trim/去空段/去重）；验证：2.1 测试全部转绿，既有 pet API 测试不回归
- [ ] 2.3 更新 `docs/knowledge/interfaces/http-api.md` pet 契约段落（preferences/personality 字段、枚举词表、400 语义）；验证：文档与 2.1 测试断言一致

## 3. 档案表单与详情（含本组 E2E）

- [ ] 3.1 扩展 `queries/pets.ts` `Pet` 类型与创建/更新 payload（preferences/personality）；验证：tsc/build 通过
- [ ] 3.2 `-pet-dialogs.tsx` 创建/编辑表单新增喜好 Checkbox 组（5 项）与性格 Select（含「未设置」sentinel→null），详情视图展示两字段（未填显示「未设置」）；既有必填校验不变；验证：tsc/build 通过
- [ ] 3.3 更新 `e2e/paws-pet-management.spec.ts`：勾选喜好+选择性格创建→详情展示→编辑回显→清空保存显示「未设置」；验证：该 spec 全部通过且既有用例不回归

## 4. 城市特征下发（含本组测试与文档）

- [ ] 4.1 先写失败 API 测试：`GET /api/destinations` 每项含 featureTags（珠海=COASTAL、杭州=LAKE,CITY_PARK、未标注空数组）；keyword/petFriendly 等参数与名称升序不变；未认证 401（对应 destination-selection delta「候选城市特征标签契约」3 场景）
- [ ] 4.2 `AdministrativeRegion` 增只读 featureTags 映射、`DestinationResponse` 增 `featureTags` 并在 toResponse 解析（trim/去空段/去重，NULL→空数组）；验证：4.1 测试转绿，既有 destination 测试不回归，管理端写路径不触碰新列
- [ ] 4.3 更新 `docs/knowledge/interfaces/http-api.md` destinations 契约段落与 `docs/knowledge/domain/city-pet-policy.md`（或新条目）登记特征词表与 48 城种子口径；验证：文档与附录 A 一致

## 5. 前端打分排序与徽标（含本组单测与 E2E）

- [ ] 5.1 先写失败 vitest 单测：`scoreCity` 喜好映射（游泳→海滨+湖泊各 +2）、多喜好同特征去重、性格三档加成、未填/未标注 0 分；`sortByRecommendation` 得分降序、同分保持输入序、profile null/两字段空不重排（对应「候选个性化推荐排序」7 场景）
- [ ] 5.2 新增 `lib/destination-recommendation.ts` 纯函数与前端词表常量；`PetProfile` 扩展 preferences/personality；验证：5.1 单测转绿
- [ ] 5.3 `cities.tsx` 渲染前应用排序；得分 >0 卡片右上角 shadcn Badge「系统推荐」（绝对定位、aria-label、无理由文字）；验证：tsc/build 通过
- [ ] 5.4 更新 `e2e/destination-selection.spec.ts`：设置喜好「游泳」→海滨城市排前且右上角徽标、未命中无徽标、徽标与政策标签并存；清空→恢复名称序无徽标；搜索/筛选/选定回归（对应「系统推荐徽标」4 场景与排序叠加场景）；验证：该 spec 全部通过

## 6. 集成验证

- [ ] 6.1 全量本地验证：后端 `mvnw test`、前端 vitest + build、E2E 全量；验证：全部通过，无既有能力回归
- [ ] 6.2 `openspec validate add-city-personalized-recommendation --strict` 通过；对照 delta 场景逐条核对实现覆盖（AC-1…AC-6）

## Workflow follow-up

- G1/G2/G3 人工评审与签署后归档（`/sdd:delta-craft` 复核、`/sdd:g1-decision-record` 等按流程）。
- 归档时合并 Living Spec（paws-page、destination-selection）并复核 KB 词表登记。