# REQ-014 Impact Brief — 城市个性化推荐（按宠物喜好与性格）

- 生成日期：2026-11-17
- 上游需求：[REQ-014 城市个性化推荐](../../requirements/REQ-014-city-personalized-recommendation.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：喜好 5 项多选 / 性格 3 项单选（固定词表，可空）；48 城特征种子（附录 A，adcode 已核对 V5）；第一只宠物口径；默认开启无开关；方案 A 前端纯函数打分（喜好命中每项 +2、性格加成 +1）；进入 `/cities` 即个性化排序，得分 >0 排前且卡片右上角「系统推荐」徽标（仅徽标无理由文字）；未填/失败退化名称序。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-014 | 城市个性化推荐（按宠物喜好与性格） | ready-for-split | `requirements/REQ-014-city-personalized-recommendation.md` |

阻塞开放问题：0（7 blocking + 4 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/paws-page/spec.md`：宠物画廊、详情/编辑/创建弹窗、照片、表单校验、犬种契约；无喜好/性格要求。
- `openspec/specs/destination-selection/spec.md`：城市搜索、宠物友好筛选（限养数+类型+品种+肩高）、逐宠物匹配标签、候选卡片与选定流程；候选按名称序，无特征数据与推荐排序。
- `openspec/specs/city-management/spec.md`：管理端城市政策维护；本需求只动行政区数据层（特征列+种子），不动管理端界面。
- `openspec/specs/backend-data-access/spec.md`、`backend-error-handling/spec.md`、`frontend-data-fetching/spec.md`、`frontend-api-request/spec.md`：约束实现方式（JDBC/JPA、RFC 9457、TanStack Query），不修改。

**当前后端实现**

- `apps/server/src/main/resources/db/migration/V8__create_pet.sql`（+V10 名字/肩高、V12 照片、V14 犬种）：pet 表无喜好/性格列；最新迁移 V25。
- `apps/server/src/main/java/com/pawtrip/server/pet/PetService.java`、`PetRequests.java`、`PetResponses.java`、`PetController.java`：validate → 400 `VALIDATION_ERROR` 先例（犬种校验同型）。
- `apps/server/src/main/java/com/pawtrip/server/location/AdministrativeRegion.java`：JPA 实体；多值存储先例 `allowed_pet_types`（逗号分隔 TEXT）。
- `apps/server/src/main/resources/db/migration/V5__seed_administrative_regions.sql`：全部行政区种子；48 城 adcode 已逐一核对为 city 级；直辖市为 province 级不在候选。
- `apps/server/src/main/java/com/pawtrip/server/destination/DestinationController.java`：`GET /api/destinations`，`findByLevelOrderByNameAsc("city")` 名称升序；`DestinationResponse` 无特征字段；keyword/petFriendly/petType/breedId/shoulderHeightCm 参数行为既定。

**当前前端实现**

- `apps/web/src/routes/_authenticated/paws.tsx` + `-pet-dialogs.tsx`：创建/编辑/详情弹窗；表单字段无喜好/性格。
- `apps/web/src/queries/pets.ts`：`Pet` 类型与 CRUD 请求；`queries/pet-profile.ts`：第一只宠物口径、失败退化 null（design D6 先例）。
- `apps/web/src/routes/_authenticated/cities.tsx`：已消费 `petProfileQueryOptions` 与 `destinationsQueryOptions`；`Card` 已 `relative` 定位、右上角空闲（政策标签在 CardContent 内）；搜索/筛选/计数/选定逻辑既定。
- `apps/web/src/lib/trip/policy-match.ts`、`lib/destination-matching.ts`：前端纯函数匹配先例；打分排序可同模式新增。
- shadcn 组件：Checkbox、Select 已在项目中使用（`components/ui/`）。

**测试与夹具**

- `apps/server/src/test/java/com/pawtrip/server/pet/`：宠物 API 测试（校验先例）。
- `apps/server/src/test/java/com/pawtrip/server/destination/`（如存在）/候选接口相关测试：名称序与筛选断言。
- `e2e/paws-pet-management.spec.ts`、`e2e/destination-selection.spec.ts`：档案 CRUD 与候选页 E2E；`scripts/run-e2e.mjs` 启动测试服务并执行迁移（新迁移自动生效）。

**知识库**

- `docs/knowledge/interfaces/http-api.md`：HTTP 契约登记处（pet 与 destinations 契约需补新字段）。
- `docs/knowledge/domain/city-pet-policy.md`：城市政策匹配领域知识（特征标签与推荐打分为新增领域概念）。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| pet 表 | 无喜好/性格列 | 新迁移 V26：`preferences`（逗号分隔 TEXT 可空）+ `personality`（TEXT 可空）；旧行 NULL=未设置 |
| `Pet` 实体/请求/响应 | 无两字段 | 新增可空字段；POST/PUT 服务端枚举校验（非法 → 400 VALIDATION_ERROR）；响应回显 |
| 档案表单/详情 | 无两字段 | 喜好 Checkbox 组（5 项）、性格 Select（3 项+「未设置」）；详情未填显示「未设置」；既有必填校验不变 |
| `queries/pets.ts` / `pet-profile.ts` | `Pet`/`PetProfile` 无两字段 | 类型扩展；`PetProfile` 增加 preferences/personality（null 退化语义不变） |
| `administrative_region` 表 | 无特征列 | 新迁移 V27：`feature_tags` TEXT 可空（逗号分隔键）+ UPDATE 48 城种子（附录 A） |
| `AdministrativeRegion` 实体 | 无特征字段 | 新增 `featureTags` 只读映射；管理端写入口不涉及 |
| `GET /api/destinations` | 名称升序、无特征 | 响应每项新增 `featureTags`（未标注为空数组）；参数、筛选、排序（服务端仍名称序）不变 |
| `/cities` 页面 | 服务端名称序直出 | 前端纯函数打分排序（得分降序、同分保持名称序）；得分 >0 卡片右上角「系统推荐」徽标；搜索/筛选/标签/选定不变 |
| 打分纯函数 | 不存在 | 新增 `lib/` 推荐打分模块（喜好→特征映射 +2、性格映射 +1），含单测 |
| 测试 | 无相关覆盖 | 后端：pet 新字段校验/持久化、候选特征下发；前端：打分函数单测；E2E：档案填喜好→候选排序+徽标 |
| Living Spec | paws-page / destination-selection 无推荐行为 | MODIFIED 两能力 delta；city-management 仅数据层（归属待 proposal-split 确认） |
| 知识库 | http-api / city-pet-policy 无新字段 | 归档后补 pet 契约新字段、destinations `featureTags`、推荐打分规则 |

## 4. Blast radius

- **直接受影响**：`/paws` 档案弹窗（表单+详情）、pet CRUD API 与表、`/cities` 候选排序与卡片、`GET /api/destinations` 响应、行政区数据层（新列+种子）。
- **不受影响**：管理端城市政策界面与写 API、逐宠物政策匹配判定语义（policy-match）、宠物友好筛选语义、选定/创建行程流程、行程/交通/地点能力、认证与权限边界、运行拓扑（无新依赖、无外部服务）。
- **兼容性**：旧客户端不传新字段仍合法（可空）；候选接口只增只读字段，既有消费方（cities 之外若有）不受破坏；未填档案行为与现状完全一致。

## 5. Artifact impact

- **Specs**：MODIFIED `paws-page`（档案字段与校验）、MODIFIED `destination-selection`（特征下发、个性化排序、徽标）；`city-management` 数据层是否单列 delta 待 proposal-split 定（建议并入同一 change，避免中间态）。
- **Tests**：后端 API 测试新增/更新；前端打分纯函数单测新增；`e2e/paws-pet-management.spec.ts` 与 `e2e/destination-selection.spec.ts` 更新（E2E 宠物经 API 创建，新字段随迁移自动可用，无需改种子脚本结构）。
- **Docs / KB**：`interfaces/http-api.md` 补两契约新字段；`domain/city-pet-policy.md`（或新条目）登记特征词表与打分规则。
- **OpenSpec**：新建 change 包（建议 `add-city-personalized-recommendation`），proposal/design/delta/tasks。
- **Gate**：P1/P2 工件产出后需人工 G1 评审；本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载全链路（档案字段 → 特征数据与下发 → 前端排序徽标）。拆分风险：只交付档案字段无消费方、或只交付排序无数据源，均为不可验收中间态。
- **Agile**：可拆 3 个薄故事（档案喜好/性格维护 → 城市特征数据与契约下发 → 个性化排序与徽标），按依赖顺序交付，共享同一词表契约。
- **依赖顺序**：V26/V27 迁移与后端契约先行（保持旧行为），前端打分与徽标随后；词表（喜好键/性格键/特征键）为跨层共享契约，须在 design 中单点定义。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 词表漂移 | 喜好键/性格键/特征键三层（前端表单、后端校验、种子、打分函数）必须同一词表；design 单点定义常量，后端枚举校验兜底 |
| 风险 R2 | 多值存储解析 | 沿用 `allowed_pet_types` 逗号分隔先例；空串/NULL 统一视为未设置；解析须 trim 并忽略空段 |
| 风险 R3 | 排序稳定性 | JS `Array.prototype.sort` 现代引擎稳定，但须显式以「得分降序、同分保持服务端名称序」实现并单测覆盖，避免依赖隐式行为 |
| 风险 R4 | 档案读取时序 | `/cities` 已消费 pet-profile；档案未返回前候选先按名称序渲染、返回后重排属可接受过渡（与现有 petType 传参时序一致）；失败退化 null 不排序 |
| 风险 R5 | 徽标与政策标签布局 | Card 已 relative、右上角空闲；徽标绝对定位不得遮挡 CardTitle/政策标签；E2E 断言徽标存在性与位置 |
| 风险 R6 | 种子幂等与既有库 | Flyway V27 只执行一次；开发库已有数据经 UPDATE 补标签；E2E 全新库随迁移注入；不改动 V5 历史迁移 |
| 风险 R7 | 未标注城市占多数 | 369 城中仅 48 城有标签，得分 0 城市排后且无徽标——用户已决接受；搜索/筛选仍可触达全部城市 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`add-city-personalized-recommendation`。
- 理由：档案字段、特征种子、契约下发与前端排序共享同一词表与验收链路（填喜好→进 /cities→海滨排前+徽标）；拆成多 change 会产出不可独立验收的中间态。
- 规模预估：M；2 个新迁移（V26 pet 列、V27 特征列+48 城种子）、无新依赖、无管理端 UI。
- 工作切片（change 内任务顺序）：T1 词表契约与迁移 → T2 pet API/表单 → T3 特征下发 → T4 前端打分排序+徽标 → T5 测试与 KB。