---
id: REQ-014
title: 城市个性化推荐（按宠物喜好与性格）
status: ready-for-split
discovery: Go (2026-11-17)
sources:
  - ../intents/REQ-014-city-personalized-recommendation.md
  - openspec/specs/paws-page/spec.md
  - openspec/specs/destination-selection/spec.md
---

# REQ-014：城市个性化推荐（按宠物喜好与性格）

## Discovery Decision

Go（2026-11-17，light intake）— 候选能力明确：宠物档案新增「喜好」（多选）与「性格」（单选）两项可空资料，`/cities` 城市候选按第一只宠物的喜好与性格做个性化打分排序（如喜欢游泳→海滨城市排前）。与现有 Living Spec 关系清楚：扩展 `paws-page`（档案字段）与 `destination-selection`（候选排序与推荐理由），城市特征标签为新增种子数据。关键事实（2026-11-17 代码核实）：pet 表与档案表单无喜好/性格字段；城市候选接口无特征数据；前端已有纯函数匹配（policy-match）与单宠口径（pet-profile 取第一只）先例。7 个 blocking OQ 已于 2026-11-17 与用户确认 resolved（全部采纳推荐）。编号 REQ-014 经用户确认。

## 六字段

1. **id**：REQ-014
2. **statement**：已登录用户在宠物档案中维护「喜好」（固定标签多选：游泳/爬山/草地奔跑/城市漫步/玩雪，可空）与「性格」（固定标签单选：活泼好动/温和平静/胆小敏感，可空）；用户一进入 `/cities` 即呈现个性化推荐结果：按第一只宠物的喜好与性格打分排序——喜好命中城市特征（海滨/山地/湖泊/草原/城市公园/雪景）每项 +2 分，性格按映射加成 +1 分，得分降序、同分维持名称序；被推荐（得分 >0）的城市排在前面，卡片右上角标「系统推荐」徽标；城市特征由种子维护 48 个知名旅游城市（含珠海/杭州，清单见附录），未标注城市得分 0 排在后面且无徽标；未填喜好与性格时维持现有名称排序。
3. **actors**：
   - 已登录用户：维护宠物喜好/性格，浏览个性化排序后的城市候选并据「系统推荐」徽标决策
   - 后端 `apps/server`：pet 档案读写契约扩展（含枚举校验）；城市候选契约下发特征标签；特征数据由 Flyway 种子注入
   - 前端 `apps/web`：档案表单/详情新增两字段；`/cities` 纯函数打分排序与「系统推荐」徽标展示
   - 管理员：不受影响（不做城市特征维护界面）
4. **rationale**：现有候选列表仅按名称排序，宠物友好筛选只解决「能不能去」，不解决「适不适合我家宠物」；喜好/性格是用户最易提供的个性化信号，确定性标签匹配可显著提升目的地决策效率，且复用既有前端判定与单宠口径先例，改动面可控。
5. **acceptance hints**：
   - AC-1：宠物创建/编辑表单新增「喜好」多选（5 项固定标签）与「性格」单选（3 项固定标签），均可不填；保存持久化，编辑回显，详情视图同步展示
   - AC-2：旧档案与未填视为未设置；既有必填校验（名字/类型/犬种/体重/肩高）不变；喜好/性格非法枚举值后端返回 400 VALIDATION_ERROR
   - AC-3：第一只宠物填了喜好或性格时，进入 `/cities` 即按推荐分降序排列（喜好命中每项 +2、性格加成 +1），同分维持名称序；如「游泳」使海滨城市（珠海/三亚/青岛等）排在未命中城市之前
   - AC-4：得分 >0 的卡片右上角展示「系统推荐」徽标（仅徽标，不加理由文字，用户 2026-11-17 已决）；得分 0 无任何推荐标记
   - AC-5：未填喜好与性格（或无档案/档案读取失败）时维持现有名称排序、无推荐标记；搜索、宠物友好筛选、逐宠物政策标签、选定流程行为不变
   - AC-6：候选接口下发城市特征标签；48 个知名旅游城市有标签（含珠海=海滨、杭州=湖泊+城市公园，清单见附录），未标注城市标签为空
6. **links to evidence**：
   - 意图捕获与用户已决口径：[intents/REQ-014](../intents/REQ-014-city-personalized-recommendation.md)
   - pet 表结构与演进：`V8__create_pet.sql`、`V10`、`V12`、`V14__add_pet_dog_breed.sql`；最新迁移 V25
   - 档案 API 与校验：`apps/server/src/main/java/com/pawtrip/server/pet/PetController.java`、`PetService.java`（validate → VALIDATION_ERROR）
   - 档案表单：`apps/web/src/routes/_authenticated/-pet-dialogs.tsx`；查询层 `queries/pets.ts`
   - 城市候选接口：`apps/server/src/main/java/com/pawtrip/server/destination/DestinationController.java`（名称升序、无特征数据）
   - `/cities` 页面与逐宠物匹配：`apps/web/src/routes/_authenticated/cities.tsx`、`lib/trip/policy-match.ts`
   - 单宠口径先例：`apps/web/src/queries/pet-profile.ts`（第一只宠物，失败退化 null）
   - 多值存储先例：`administrative_region.allowed_pet_types`（逗号分隔 TEXT）
   - 影响分析：[analysis/REQ-014/impact-brief.md](../analysis/REQ-014/impact-brief.md)
   - Deep-dive：[analysis/REQ-014/deep-dive.md](../analysis/REQ-014/deep-dive.md)

## Ready 形状

### Intent

让「适不适合我家宠物」成为目的地候选的排序信号：档案补喜好/性格两个可空固定标签字段，城市补特征标签种子数据，前端按确定性规则打分排序并给出推荐理由。

### Actors 与权限边界

- 已登录用户：档案读写沿用现有属主边界（只能改自己的宠物）；候选接口沿用登录保护（401）。
- 后端：pet 新字段服务端枚举校验；城市特征只读下发，种子注入，无管理端写入口。
- 前端：打分排序为纯函数，不新增服务端状态；无全局 store，沿用 TanStack Query。

### In / Out Scope

**In**

- pet 档案新增喜好（多选可空）与性格（单选可空）：数据库迁移、实体/请求/响应契约、服务端枚举校验、表单与详情展示
- 城市特征标签：行政区数据扩展 + Flyway 种子维护 48 个知名旅游城市（含珠海/杭州；adcode 已逐一核对 V5，清单见附录）
- 候选接口下发城市特征标签（只读扩展，既有参数与筛选行为不变）
- `/cities` 前端打分排序：喜好命中每项 +2、性格加成 +1（映射见 Constraints）、得分降序同分名称序、命中卡片右上角「系统推荐」徽标（仅徽标无理由文字）、未填/失败退化原序
- 前端单测（打分纯函数等）、后端 API 测试、E2E 更新

**Out**

- 全部 369 城特征标注、外部特征数据源、管理端城市特征维护界面
- 自由文本喜好/性格与语义匹配；推荐理由文案行（已决仅徽标）
- 后端排序参数/服务端算分（已决方案 A 前端打分）
- 多宠物聚合、宠物选择器、「个性化推荐」开关
- 政策匹配/禁养判定逻辑改动、行程与交通能力改动

### Scenarios + AC Hints

#### S1：档案维护喜好与性格（AC-1）

- **Given** 已登录用户打开添加/编辑宠物弹窗
- **When** 勾选喜好「游泳」「草地奔跑」、选择性格「活泼好动」并保存
- **Then** 保存成功并持久化；重新打开编辑回显所选值；详情视图展示「喜好：游泳、草地奔跑」「性格：活泼好动」

#### S2：可空与旧档案兼容（AC-2/AC-5）

- **Given** 用户不选任何喜好与性格（或档案为迁移前旧数据）
- **When** 保存宠物并打开 `/cities`
- **Then** 保存成功（新字段为未设置）；候选维持名称排序，无推荐理由；既有必填校验不变

#### S3：非法枚举拒绝（AC-2）

- **Given** 请求体携带未知喜好键或未知性格键
- **When** POST/PUT `/api/pets`
- **Then** 返回 400 Problem Details `code=VALIDATION_ERROR`，不落库

#### S4：喜好驱动排序（AC-3）

- **Given** 第一只宠物喜好含「游泳」，候选含珠海（海滨）与未标注城市
- **When** 用户打开 `/cities`
- **Then** 珠海等海滨/湖泊城市得分 +2 排在未命中城市之前；同分城市维持名称序

#### S5：性格加成（AC-3）

- **Given** 第一只宠物性格「活泼好动」，候选城市 A 含户外型特征（海滨/山地/草原/雪景任一）、城市 B 仅湖泊/城市公园
- **When** 打分排序
- **Then** A 获性格加成 +1，B 不获；「温和平静」命中湖泊/城市公园 +1；「胆小敏感」仅命中城市公园 +1

#### S6：系统推荐徽标（AC-4）

- **Given** 某城市因喜好/性格命中得分 >0
- **When** 用户进入 `/cities` 浏览候选卡片
- **Then** 该卡片右上角展示「系统推荐」徽标（绝对定位，不与逐宠物政策标签冲突；仅徽标，无理由文字）；得分 0 的卡片无徽标

#### S7：既有能力回归（AC-5）

- **Given** 个性化排序生效中
- **When** 用户使用搜索、宠物友好筛选、查看逐宠物政策标签、选定城市
- **Then** 各行为与现状一致（筛选在排序后的集合上生效，计数同步）；无档案/档案读取失败退化名称排序

#### S8：候选契约扩展（AC-6）

- **Given** 已登录用户
- **When** 请求 `GET /api/destinations`
- **Then** 每个候选携带特征标签集合（未标注城市为空）；既有字段、keyword/petFriendly 等参数行为不变；未认证 401 不变

### Constraints

- 词表（用户已决）：喜好＝游泳/爬山/草地奔跑/城市漫步/玩雪（多选）；性格＝活泼好动/温和平静/胆小敏感（单选）；城市特征＝海滨/山地/湖泊/草原/城市公园/雪景。
- 打分规则（用户已决）：喜好→特征映射为 游泳→{海滨,湖泊}、爬山→{山地}、草地奔跑→{草原}、城市漫步→{城市公园}、玩雪→{雪景}，每命中一项 +2；性格加成 +1：活泼好动→{海滨,山地,草原,雪景}任一、温和平静→{湖泊,城市公园}任一、胆小敏感→{城市公园}。
- 单宠口径：第一只宠物（与 pet-profile 先例一致）；档案读取失败退化 null→名称排序。
- 展示契约（用户 2026-11-17 追加已决）：进入 `/cities` 即呈现个性化结果；得分 >0 城市排前且卡片右上角「系统推荐」徽标（仅徽标，不加理由文字）；得分 0 无徽标。现有卡片 `Card` 已为 relative 定位、右上角空闲，徽标可绝对定位叠加。
- 表单交互（NB-3 已决）：喜好用 5 个 Checkbox 多选；性格用 Select 单选含「未设置」项；详情视图未填显示「未设置」；沿用 shadcn 组件语言。
- 城市特征数据由 Flyway 种子注入（当前最新 V25，新迁移自 V26 起）；48 城清单已定稿（附录）；未标注城市得分 0。直辖市（北京/上海/天津/重庆）在 V5 为 province 级，本就不在 city 级候选内，不打标签。
- 排序为前端纯函数（方案 A，用户已决）；候选接口仅扩展只读字段，不加排序参数。
- 前端遵循 TanStack Query/request 层约定与 shadcn 组件语言；后端错误遵循 RFC 9457 Problem Details。
- 实现前形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。

### Context

- `/cities` 现有能力由 REQ-006 交付（搜索/宠物友好筛选/逐宠物红绿标签/选定），本需求只叠加排序与推荐理由，不改判定语义。
- 宠物档案由 US-01 方向交付（pet 表 + `/paws` + CRUD），本需求在其契约上做可空扩展，旧客户端不传新字段仍合法。
- 城市候选为全部城市级行政区（约 369 城）；试点数据城市珠海/杭州必须有特征标签以支撑验收。

### Affected Capabilities

- **MODIFIED** `paws-page`：档案表单/详情新增喜好与性格；读写契约扩展（具体 delta 拆分待 proposal-split）
- **MODIFIED** `destination-selection`：候选个性化排序、推荐理由、特征标签下发
- **MODIFIED** `city-management`（数据层）：行政区数据新增特征标签与种子（无管理端界面改动；归属待 proposal-split 确认）

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 喜好/性格取值形态：固定标签还是自由文本？ | Product | 已决（2026-11-17，用户确认）：固定标签；喜好 5 项多选、性格 3 项单选（词表见 Constraints） |
| OQ-2 | blocking | resolved | 城市特征数据覆盖范围与数据所有权？ | Product / SA | 已决（2026-11-17，用户确认）：种子维护知名旅游城市子集（含珠海/杭州），后端所有；未标注城市得分 0 排后；不做 369 城、无外部数据源 |
| OQ-3 | blocking | resolved | 多宠物时按谁的喜好/性格排序？ | Product | 已决（2026-11-17，用户确认）：第一只宠物，与现有宠物友好筛选口径一致 |
| OQ-4 | blocking | resolved | 个性化排序默认生效还是加开关？ | Product | 已决（2026-11-17，用户确认）：默认开启；填了喜好或性格即排序并显示理由，未填维持名称序；不加开关 |
| OQ-5 | blocking | resolved | 排序计算位置与集成边界：前端打分还是后端排序？ | SA | 已决（2026-11-17，用户确认）：方案 A——特征标签随候选接口下发，前端纯函数打分排序；接口不加排序参数 |
| OQ-6 | blocking | resolved | 性格如何参与排序（映射规则）？ | Product | 已决（2026-11-17，用户确认）：喜好命中每项 +2；性格加成 +1（活泼好动→户外型、温和平静→湖泊/城市公园、胆小敏感→城市公园），映射全集见 Constraints |
| OQ-7 | blocking | resolved | 需求编号？ | Product | 已决（2026-11-17，用户确认）：REQ-014（顺延登记） |
| NB-1 | non-blocking | resolved | 种子城市完整清单与 adcode 核对 | Dev | 已决（2026-11-17，用户采纳）：48 城清单全部采纳，adcode 已逐一核对 V5 city 级；完整清单见附录 A |
| NB-2 | non-blocking | resolved | 推荐理由文案（徽标已定：右上角「系统推荐」） | Dev | 已决（2026-11-17，用户确认）：仅徽标，不加推荐理由文字 |
| NB-3 | non-blocking | resolved | 表单交互形态（喜好多选控件、性格含「未设置」项） | Dev | 已决（2026-11-17，用户采纳建议）：喜好 Checkbox 组、性格 Select 含「未设置」；详情未填显示「未设置」；沿用 shadcn 组件 |
| NB-4 | non-blocking | resolved | 同分与 0 分城市的展示细节 | Dev | 已决（2026-11-17，用户追加口径 + 建议默认）：得分 >0 右上角「系统推荐」徽标；0 分无徽标；同分维持服务端名称序（稳定排序） |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Open Questions | 7 个 blocking OQ（词表/覆盖/多宠/开关/架构/性格映射/编号） | 2026-11-17 与用户确认，全部采纳推荐 resolved |
| WARNING | resolved | NB-1…NB-4 | 4 个非阻塞细节（种子清单/徽标与文案/表单交互/同分展示） | 2026-11-17 逐项澄清全部 resolved（48 城采纳；仅徽标；Checkbox+Select；稳定排序） |

基础 8 项自检：①意图清晰 ✓ ②actors 与权限边界 ✓ ③范围有界（In/Out）✓ ④场景具体（S1–S8）✓ ⑤异常/边界（S2 可空兼容、S3 非法枚举、S7 无档案/失败退化）✓ ⑥结果可验证（分值/排序/徽标可观察）✓ ⑦依赖与触点（pet 契约、候选契约、行政区种子、前端纯函数）✓ ⑧blocking OQ=0 ✓。⑨数据契约 ✓ ⑩边界分支 ✓ ⑪跨 REQ 一致性 ✓ ⑫展示与测试 ✓（2026-11-17 deep-dive 完成，见 analysis/REQ-014/deep-dive.md 第 6 节）。BLOCKER 数：0。影响分析 blocker：0；建议单 change `add-city-personalized-recommendation`（规模 M，V26/V27 两个新迁移）。

## 附录 A：城市特征种子清单（NB-1 定稿，2026-11-17 用户采纳，48 城）

adcode 已逐一核对 `V5__seed_administrative_regions.sql` city 级条目。特征键：COASTAL 海滨、MOUNTAIN 山地、LAKE 湖泊、GRASSLAND 草原、CITY_PARK 城市公园、SNOW 雪景。

| adcode | 城市 | 特征标签 |
|---|---|---|
| 440400 | 珠海市 | COASTAL |
| 460200 | 三亚市 | COASTAL |
| 370200 | 青岛市 | COASTAL,MOUNTAIN |
| 350200 | 厦门市 | COASTAL,CITY_PARK |
| 210200 | 大连市 | COASTAL |
| 460100 | 海口市 | COASTAL |
| 450500 | 北海市 | COASTAL |
| 440300 | 深圳市 | COASTAL,CITY_PARK |
| 330200 | 宁波市 | COASTAL |
| 330300 | 温州市 | COASTAL,MOUNTAIN |
| 350500 | 泉州市 | COASTAL |
| 370600 | 烟台市 | COASTAL |
| 371000 | 威海市 | COASTAL |
| 130300 | 秦皇岛市 | COASTAL |
| 330900 | 舟山市 | COASTAL |
| 450300 | 桂林市 | MOUNTAIN,LAKE |
| 530700 | 丽江市 | MOUNTAIN,SNOW |
| 430800 | 张家界市 | MOUNTAIN |
| 341000 | 黄山市 | MOUNTAIN |
| 370900 | 泰安市 | MOUNTAIN |
| 511100 | 乐山市 | MOUNTAIN |
| 130800 | 承德市 | MOUNTAIN,GRASSLAND |
| 130700 | 张家口市 | MOUNTAIN,SNOW |
| 510100 | 成都市 | MOUNTAIN,CITY_PARK |
| 320100 | 南京市 | MOUNTAIN,CITY_PARK |
| 350100 | 福州市 | MOUNTAIN,CITY_PARK |
| 430100 | 长沙市 | MOUNTAIN,CITY_PARK |
| 330100 | 杭州市 | LAKE,CITY_PARK |
| 320500 | 苏州市 | LAKE,CITY_PARK |
| 320200 | 无锡市 | LAKE |
| 420100 | 武汉市 | LAKE,CITY_PARK |
| 530100 | 昆明市 | LAKE,CITY_PARK |
| 532900 | 大理白族自治州 | LAKE,MOUNTAIN |
| 630100 | 西宁市 | LAKE,GRASSLAND |
| 640100 | 银川市 | LAKE,GRASSLAND |
| 150700 | 呼伦贝尔市 | GRASSLAND,SNOW |
| 150100 | 呼和浩特市 | GRASSLAND |
| 152500 | 锡林郭勒盟 | GRASSLAND |
| 650100 | 乌鲁木齐市 | GRASSLAND,MOUNTAIN,SNOW |
| 654300 | 阿勒泰地区 | GRASSLAND,SNOW,MOUNTAIN |
| 654000 | 伊犁哈萨克自治州 | GRASSLAND,MOUNTAIN |
| 230100 | 哈尔滨市 | SNOW,CITY_PARK |
| 220100 | 长春市 | SNOW |
| 210100 | 沈阳市 | SNOW,CITY_PARK |
| 540100 | 拉萨市 | SNOW,MOUNTAIN |
| 533400 | 迪庆藏族自治州 | SNOW,MOUNTAIN |
| 440100 | 广州市 | CITY_PARK |
| 610100 | 西安市 | CITY_PARK |

说明：直辖市（北京/上海/天津/重庆）在 V5 中为 province 级，不在 city 级候选内，故不含；其余未列出城市特征标签为空（得分 0）。

## 修订记录

### 2026-11-17 修订：系统推荐徽标政策门禁（需求方指示）

- 原口径：得分 >0 即展示徽标。新口径：**得分 >0 且（城市政策匹配首宠档案 或 无法判定）**才展示徽标；仅明确违反政策时隐藏（需求方 2026-11-17 二次指示）。
- 判定复用 `matchCityCandidate`（与卡片逐宠物政策标签同函数）：类型不允许、已填犬种的狗不在允许名单/肩高超限 → unfriendly 隐藏；猫、未填犬种的狗 → unjudgeable 保留；允许犬种名单为空、肩高 null → 放行；城市允许类型 null → 不允许。徽标取第一只宠物（与打分同口径；不用 subjects，因激活行程会替换为行程宠物）。
- 排序不受政策影响（命中城市位次不变）；无新增接口（复用 /api/pets 缓存）。
- 同步：Living Spec `destination-selection` 系统推荐徽标需求（+4 场景）、`docs/knowledge/domain/city-feature-tags.md`、E2E `city-personalized-recommendation.spec.ts`（+5 政策门禁用例）。按 REQ-014 修订交付，不新建 change（需求方 2026-11-17 决定）。