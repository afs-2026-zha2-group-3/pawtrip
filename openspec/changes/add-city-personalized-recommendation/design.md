# Design

## Context

动机见 proposal.md。现状约束（2026-11-17 代码核实）：

- pet 表（V8 建，V10/V12/V14 演进）与档案弹窗无喜好/性格；`PetService` 已有 validate → 400 `VALIDATION_ERROR` 先例（犬种）。
- `administrative_region` 多值存储先例 `allowed_pet_types`（逗号分隔 TEXT）；`DestinationController` 名称升序直出，无特征数据。
- `/cities` 已消费 `petProfileQueryOptions`（第一只宠物、失败退化 null）与 `destinationsQueryOptions`；`Card` 已 relative、右上角空闲；前端纯函数判定先例 `policy-match.ts`。
- 技术栈（知识库 `docs/knowledge/external/README.md` 已核实）：Flyway 12.4.0 原生支持 SQLite、schema 由 Flyway 管理（JPA `ddl-auto=none`）、迁移目录 `apps/server/src/main/resources/db/migration`（当前最新 V25）；TanStack Query 查询集中在 `queries/`；shadcn 组件语言（Checkbox/Select/Badge 均已在项目使用）。

## Goals / Non-Goals

**Goals:**

- 词表（喜好键/性格键/特征键）跨后端校验、种子、前端表单与打分单点一致。
- 候选接口只增只读字段，既有参数/筛选/排序行为零变化；旧客户端与旧档案完全兼容。
- 打分排序为可单测的纯函数；进入 `/cities` 即个性化结果 + 右上角徽标。

**Non-Goals:**

- 不做管理端特征维护、不做 369 城全量标注、不引入外部特征数据源。
- 不做后端排序参数/服务端算分、不做多宠聚合与推荐开关、不做推荐理由文字。
- 不改政策匹配（policy-match）与宠物友好筛选语义。

## Decisions

### D1 词表与键形态

固定大写蛇形键（与 `CAT,DOG` 风格一致）：喜好 `SWIMMING/HIKING/GRASS_RUNNING/CITY_WALKING/SNOW_PLAY`；性格 `ENERGETIC/CALM/TIMID`；特征 `COASTAL/MOUNTAIN/LAKE/GRASSLAND/CITY_PARK/SNOW`。后端以 Java 枚举承载喜好/性格（校验兜底），特征键以常量集合承载（只读下发，不做写入校验）；前端以 TS 常量镜像同一词表（表单标签映射 + 打分映射）。**备选**：共享代码生成/接口下发词表——拒绝，无现成基建且词表本期冻结，双份常量 + 后端枚举校验 + 单测足以防漂移。

### D2 存储形态

沿用 `allowed_pet_types` 逗号分隔 TEXT 先例：`pet.preferences`（多键）、`pet.personality`（单键）、`administrative_region.feature_tags`（多键），均可空，NULL/空串=未设置。**备选**：关联表——拒绝，词表固定且小（≤5 键），无查询 join 需求，徒增迁移与映射复杂度。解析统一 trim、忽略空段、去重。

### D3 迁移拆分

- `V26__add_pet_preferences_personality.sql`：pet 表两个可空 TEXT 列（SQLite `ALTER TABLE ADD COLUMN`）。
- `V27__add_region_feature_tags.sql`：administrative_region 增 `feature_tags TEXT`；按需求附录 A 以 `UPDATE ... WHERE adcode=...` 注入 48 城标签（adcode 已逐一核对 V5 city 级）。
- 不改动历史迁移；既有开发库经 UPDATE 补标签，E2E 全新库随迁移注入。**备选**：单迁移合并——拒绝，pet 与行政区属不同能力域，拆分便于回滚定位。

### D4 pet 契约与校验

请求/响应新增 `preferences: string[]`（可省略/空数组）与 `personality: string | null`。`PetService` 校验：每键 ∈ 枚举，非法 → 400 Problem Details `code=VALIDATION_ERROR` 不落库（沿用犬种校验路径）；**重复键去重后存储**（deep-dive 遗留二选一在此定稿：去重，与犬种名单去重先例一致，不 400）。响应回显解析后的数组/单键；未设置为空数组/null。旧客户端不传字段 → 未设置。

### D5 特征下发

`AdministrativeRegion` 增 `featureTags` 只读映射（无 setter 暴露给管理端写路径）；`DestinationResponse` 增 `List<String> featureTags`，`toResponse` 解析逗号分隔（trim/去空段/去重），NULL → 空数组。服务端排序与过滤逻辑零改动；不依赖 pet 模块（方案 A）。

### D6 前端打分与排序

新增 `apps/web/src/lib/destination-recommendation.ts` 纯函数模块：`scoreCity(featureTags, preferences, personality)`（喜好映射命中特征集合去重后每项 +2；性格映射任一命中 +1）与 `sortByRecommendation(candidates, profile)`（得分降序；同分保持输入序=服务端名称序，以显式稳定比较实现，不依赖引擎隐式稳定性）。`PetProfile` 扩展 `preferences: string[]`、`personality: string | null`（null 退化语义不变）。`cities.tsx` 在渲染前对 `destinations.data` 应用排序；profile 为 null 或两字段均空 → 原序直出。档案晚于候选返回时先名称序渲染、到达后重排（与现有 petType 传参时序一致）。**备选**：后端排序——用户已决拒绝（方案 A）。

### D7 徽标展示

得分 >0 的卡片在 `Card`（已 relative）内以 shadcn `Badge` 绝对定位右上角（`absolute right-2 top-2` 量级），文案固定「系统推荐」，附 aria-label；不附理由文字；不遮挡 CardTitle/政策标签（政策标签在 CardContent 内）。得分 0 或未启用排序不渲染。

### D8 表单交互

喜好：5 个 shadcn `Checkbox`（可全不选）；性格：shadcn `Select` 含「未设置」项（sentinel 值映射 null，不传假键）。详情视图两字段未填显示「未设置」。既有必填校验与提交流程不变；新字段不参与前端必填校验。

### D9 E2E 策略

`scripts/seed-users.mjs` 的 worker 宠物档案经 SQL 直写，新列 NULL → 既有 E2E 行为不变（名称序、无徽标）。新增用例经 UI 或 `PUT /api/pets` 设置喜好后断言排序与徽标；清空后断言恢复名称序。不修改种子脚本结构。

## Risks / Trade-offs

- [词表双份常量漂移] → 后端枚举校验兜底 + 前端打分单测覆盖全部键 + design D1 单点词表表；归档时 KB 登记词表。
- [排序稳定性依赖隐式行为] → 显式「得分降序、同分保持输入序」比较器 + 单测同分样本。
- [档案/候选加载时序造成短暂名称序] → 接受为过渡态（与现有 petType 传参一致），不做加载门禁。
- [徽标遮挡标题] → 右上角绝对定位 + E2E 断言徽标与政策标签并存；窄屏目视检查。
- [48/369 城覆盖率低，多数城市 0 分] → 用户已决接受；搜索/筛选仍可触达全部城市。
- [种子 UPDATE 与既有库] → Flyway 版本化一次性执行；不改 V5；E2E 全新库天然一致。

## Migration Plan

1. 合并后后端启动自动执行 V26/V27（Flyway，`ddl-auto=none`）；开发库与 E2E 库均自动升级。
2. 回滚：还原代码即可——新列可空且旧代码不读不写，无数据破坏；无需降级迁移。
3. 前端与后端同 change 交付，无独立部署顺序要求（旧前端读新接口仅忽略新字段）。

## Open Questions

（无——11 个 OQ 已在 P1 全部 resolved；重复键处理已在本设计 D4 定稿为去重。）