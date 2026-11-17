# REQ-014 Deep Dive — 城市个性化推荐（按宠物喜好与性格）

- 上游需求：[REQ-014 城市个性化推荐](../../requirements/REQ-014-city-personalized-recommendation.md)
- Impact Brief：[impact-brief.md](impact-brief.md)
- 日期：2026-11-17
- 范围：档案喜好/性格字段、城市特征种子与下发、`/cities` 前端打分排序与「系统推荐」徽标；不含管理端特征维护、自由文本/语义匹配、多宠聚合、后端排序参数、推荐理由文字

## 1. 数据契约

### 1.1 词表（跨层单点契约，用户已决）

| 层 | 键 | 中文标签 |
|---|---|---|
| 喜好 preferences（多选） | `SWIMMING` | 游泳 |
| | `HIKING` | 爬山 |
| | `GRASS_RUNNING` | 草地奔跑 |
| | `CITY_WALKING` | 城市漫步 |
| | `SNOW_PLAY` | 玩雪 |
| 性格 personality（单选） | `ENERGETIC` | 活泼好动 |
| | `CALM` | 温和平静 |
| | `TIMID` | 胆小敏感 |
| 城市特征 featureTags | `COASTAL` | 海滨 |
| | `MOUNTAIN` | 山地 |
| | `LAKE` | 湖泊 |
| | `GRASSLAND` | 草原 |
| | `CITY_PARK` | 城市公园 |
| | `SNOW` | 雪景 |

键名为建议常量形态（大写蛇形，与 `allowed_pet_types` 的 `CAT,DOG` 风格一致），最终命名在 design 定稿；中文标签为界面展示词，存储与传输一律用键。

### 1.2 打分规则（用户已决）

- 喜好→特征映射：`SWIMMING→{COASTAL,LAKE}`、`HIKING→{MOUNTAIN}`、`GRASS_RUNNING→{GRASSLAND}`、`CITY_WALKING→{CITY_PARK}`、`SNOW_PLAY→{SNOW}`；每命中一项特征 +2（同一特征被多个喜好命中只计一次）。
- 性格加成 +1（整城最多一次）：`ENERGETIC→{COASTAL,MOUNTAIN,GRASSLAND,SNOW}` 任一命中；`CALM→{LAKE,CITY_PARK}` 任一命中；`TIMID→{CITY_PARK}` 命中。
- 得分 = 喜好命中数×2 + 性格加成（0 或 1）。得分 >0 即「被推荐」。
- 排序：得分降序；同分保持服务端名称升序（稳定排序）。未填喜好与性格 → 不重排（保持名称序）。

### 1.3 字段

| 业务概念 | API / 存储字段 | 类型 | 空值语义 |
|---|---|---|---|
| 宠物喜好 | pet.preferences / 请求响应 `preferences` | TEXT 逗号分隔键 / `string[]` | NULL/空数组 = 未设置 |
| 宠物性格 | pet.personality / 请求响应 `personality` | TEXT 单键 / `string \| null` | NULL = 未设置 |
| 城市特征 | administrative_region.feature_tags / 响应 `featureTags` | TEXT 逗号分隔键 / `string[]` | NULL → 响应空数组 = 未标注（得分 0） |
| 推荐得分 | 前端纯函数计算，不落库不下发 | number | 0 = 未推荐 |

### 1.4 API 契约

**POST/PUT `/api/pets`**：请求体新增可选 `preferences: string[]`（可省略/空数组）与 `personality: string | null`。服务端校验：每个喜好键 ∈ 词表、性格键 ∈ 词表或 null；非法 → 400 Problem Details `code=VALIDATION_ERROR`，不落库（沿用犬种校验先例）。响应回显两字段。旧客户端不传新字段仍合法。

**GET `/api/destinations`**：响应每项新增 `featureTags: string[]`（未标注为空数组）。既有字段、keyword/petFriendly/petType/breedId/shoulderHeightCm 参数、服务端名称升序、401 行为全部不变。不加排序参数、不依赖 pet 模块（方案 A）。

### 1.5 迁移

- V26：pet 表 `ALTER TABLE ADD COLUMN preferences TEXT`、`personality TEXT`（均可空，旧行 NULL）。
- V27：administrative_region `ADD COLUMN feature_tags TEXT`；按附录 A UPDATE 48 城（adcode 已核对 V5 city 级）。不改动历史迁移。

## 2. 边界分支

| 规则 | 分支 | 行为 | rationale |
|---|---|---|---|
| 档案 | 无宠物 / 读取失败 | 名称序、无徽标 | pet-profile null 退化先例 |
| 档案 | 喜好与性格均未填 | 名称序、无徽标 | 用户已决 |
| 档案 | 仅填性格（无喜好） | 参与打分（性格 +1 可独立产生推荐） | statement「填了喜好或性格即排序」 |
| 档案 | 多只宠物 | 仅第一只参与 | 用户已决，与筛选口径一致 |
| 请求 | 未知喜好/性格键 | 400 VALIDATION_ERROR | 服务端枚举校验 |
| 请求 | preferences 含重复键 | 去重后存储（或 400，design 定一） | 避免重复计分歧义 |
| 存储 | 空串/NULL/含空段 | 一律视为未设置；解析 trim 忽略空段 | 与 allowed_pet_types 先例一致 |
| 打分 | 同一特征被多喜好命中 | 只计一次 +2 | 特征命中按集合去重 |
| 打分 | 性格与喜好命中同一特征 | 性格 +1 独立叠加 | 规则已决 |
| 城市 | 未标注（321 城） | 得分 0、排后、无徽标 | 用户已决 |
| 城市 | 直辖市 | 不在 city 级候选，不打标签 | V5 为 province 级 |
| 排序 | 同分 | 保持名称升序 | 稳定排序 |
| 筛选 | 宠物友好/搜索生效中 | 在服务端过滤后的集合上打分排序，计数同步 | 不改筛选语义 |
| 时序 | 档案晚于候选返回 | 先名称序渲染，档案到达后重排 | 与现有 petType 传参时序一致 |
| 徽标 | 得分 >0 | 右上角「系统推荐」；不遮挡标题与政策标签 | 展示契约已决 |
| 管理端 | 城市政策编辑 | 不触碰 feature_tags | 无管理端写入口 |

## 3. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| REQ-006 / destination-selection | 搜索、宠物友好筛选、逐宠物标签、选定流程 | 全部保持不变；排序叠加在过滤后集合上 |
| US-01 / paws-page | 档案 CRUD 与校验 | 可空扩展；既有必填校验（名字/类型/犬种/体重/肩高）不变 |
| city-management | 管理端政策维护 | 无界面/写 API 改动；仅数据层新列 |
| city-pet-policy / policy-match | 政策匹配判定 | 语义不动；推荐打分是独立纯函数，不混入政策判定 |
| REQ-012 / trip-attractions | 地点浏览与 5km 筛选 | 无交集 |
| REQ-013 / 地点卡片媒体 | 卡片媒体 | 无交集（城市卡片徽标不涉及媒体） |
| pet-profile 单宠口径（design D6） | 第一只宠物、失败退化 null | 直接复用并扩展字段 |

## 4. 展示契约

| 触发 / 界面 | 内容 | 状态 |
|---|---|---|
| 创建/编辑弹窗 | 「喜好」5 个 Checkbox（可全不选）；「性格」Select 含「未设置」+3 项 | 可空；不影响既有必填校验 |
| 详情弹窗 | 「喜好：游泳、草地奔跑」「性格：活泼好动」 | 未填显示「未设置」 |
| 进入 `/cities`（第一只宠物填了喜好或性格） | 得分降序排列，得分 >0 卡片右上角「系统推荐」徽标 | 仅徽标，无理由文字 |
| 得分 0 卡片 | 无徽标 | 排在被推荐城市之后（同分名称序） |
| 未填/无档案/读取失败 | 名称序、无徽标 | 与现状一致 |
| 搜索/宠物友好筛选 | 过滤后集合上维持个性化排序；计数同步 | 行为不变 |
| 逐宠物政策标签 | CardContent 内照常展示 | 与右上角徽标并存不冲突 |

## 5. 测试计划

### 后端 API

- pet 创建/编辑携带合法 preferences/personality → 持久化并回显；不传 → 未设置。
- 未知喜好键、未知性格键 → 400 VALIDATION_ERROR 不落库；preferences 空数组合法。
- 旧档案（迁移前数据）读取 → 两字段未设置，其余字段不变。
- `GET /api/destinations` 每项含 featureTags；珠海=COASTAL、杭州=LAKE,CITY_PARK、未标注城市空数组；名称升序与既有参数行为不变；未认证 401。

### 前端

- 打分纯函数单测：喜好映射（游泳→海滨+湖泊各 +2）、多喜好去重、性格三档加成、未填 0 分、未标注城市 0 分。
- 排序：得分降序、同分名称序稳定；未填/档案 null 不重排。
- 表单：Checkbox 多选与 Select「未设置」回显；详情「未设置」展示。

### E2E

- 创建宠物勾选「游泳」→ 进入 `/cities` → 珠海/三亚等海滨城市排在未命中城市之前，卡片右上角出现「系统推荐」徽标；未命中城市无徽标。
- 清空喜好与性格 → 恢复名称序、无徽标。
- 既有回归：搜索、宠物友好筛选、逐宠物标签、选定流程（`e2e/destination-selection.spec.ts`、`e2e/paws-pet-management.spec.ts`）。

## 6. Probe log / DoR 复核（⑨–⑫）

| 项 | 结论 | 依据 |
|---|---|---|
| ⑨ 数据契约 | 词表/字段/空值/迁移/API 扩展已定义；键名形态待 design 定稿（非阻塞） | 第 1 节；V8/V5/先例代码 |
| ⑩ 边界分支 | 可空、非法枚举、重复键、多宠、未标注、同分、时序、筛选叠加已枚举 | 第 2 节 |
| ⑪ 跨 REQ | 与 REQ-006/US-01/city-management/policy-match/REQ-012/013 无冲突 | 第 3 节 |
| ⑫ 展示与测试 | 徽标/表单/详情契约明确；三层测试计划覆盖 AC-1…AC-6 | 第 4、5 节 |
| BLOCKER | 0 | 无阻塞性未知依赖 |