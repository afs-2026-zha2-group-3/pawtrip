# REQ-017 Impact Brief — 行程携带清单与打包进度

- 生成日期：2026-11-18
- 上游需求：[REQ-017 行程携带清单与打包进度](../../requirements/REQ-017-trip-packing-checklist.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 已确认口径：入口与路线规划一致（Day 标签行按钮 + 弹窗），页面显示进度；每行程一份；静态模板 + 档案/场景映射；读取时同步并保留自定义项、手动数量与勾选；删除模板项为墓碑；进度按物品行；服务端持久化；无档案引导 `/paws`；弹窗不进导出。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-017 | 行程携带清单与打包进度 | p1-ready | `requirements/REQ-017-trip-packing-checklist.md` |

阻塞开放问题：0（12 blocking + 4 non-blocking 全部 resolved）；DoR BLOCKER：0。

## 2. As-is 资产清单（证据路径）

**Living Spec / 变更包**

- `openspec/specs/trip-itinerary/spec.md`：行程单入口、按天汇总、时间线与途内交通、政策展开、当天提醒、PDF/图片导出与打印隐藏；无清单入口或进度要求。
- `openspec/specs/trip-planning/spec.md`：`TripPlan` v1 与 stop 字段；本需求不修改计划结构。
- `openspec/specs/trip-context/spec.md`：激活行程上下文、行程面板、计划自动保存、Trips 页与单城市激活；本需求只读消费激活行程。
- `openspec/specs/paws-page/spec.md`：宠物画廊、详情/编辑、新增与删除、照片、校验、狗的品种、喜好与性格；含 `weightKg`、`shoulderHeightCm`、`hasLeash`、`hasVaccinationProof`；本需求只读消费，不新增字段。
- `openspec/specs/backend-data-access/spec.md`、`backend-error-handling/spec.md`、`frontend-data-fetching/spec.md`、`frontend-api-request/spec.md`：约束 JPA、Problem Details、TanStack Query 与 `request` 层；本需求沿用。
- `openspec/specs/browser-e2e-testing/spec.md`：E2E 约定与种子账号；新增 E2E 需遵守。
- 无 `trip-packing-checklist` 能力，需新建。

**当前后端实现（main 基线）**

- `apps/server/src/main/java/com/pawtrip/server/trip/Trip.java`：行程实体含 `userId`、`petId`、`totalDays`、`startDate`、`transportMode`、`planJson`；无清单关联。
- `apps/server/src/main/java/com/pawtrip/server/trip/TripService.java`、`TripRepository.java`、`TripController.java`：行程 CRUD、属主校验与 404 语义；本需求沿用属主边界。
- `apps/server/src/main/java/com/pawtrip/server/pet/Pet.java`：宠物类型、体重、肩高、牵引绳、疫苗证明字段；`PetService.java` 提供档案读取与校验。
- `apps/server/src/main/java/com/pawtrip/server/error/ApiErrorCode.java`：业务错误码枚举与 HTTP 状态；需新增清单错误码。
- `apps/server/src/main/resources/db/migration/V28__add_pet_preferences_personality.sql`：当前最新迁移；清单表为新 V29。
- 行程删除：`TripService.delete` 删除行程；本需求需确保清单级联删除。

**当前前端实现（main 基线）**

- `apps/web/src/routes/_authenticated/itinerary.tsx`：行程单页；Day 标签行右侧已有「查看当天路线规划」按钮与 Dialog 状态；导出 PDF/图片路径与打印隐藏；无清单入口或进度。
- `apps/web/src/lib/trip/selectors.ts`、`apps/web/src/lib/trip/types.ts`：`useActiveTrip`、激活行程字段与宠物 id。
- `apps/web/src/queries/pets.ts`：`petsQueryOptions` 与宠物变更 mutation；保存成功后现有档案查询失效。
- `apps/web/src/queries/trips.ts`：行程查询与保存 mutation；清单查询需同层新增。
- `apps/web/src/components/ui/dialog.tsx`、`checkbox.tsx`、`select.tsx`、`input.tsx`、`button.tsx`：可用组件语言。
- `apps/web/src/components/pet/pet-profile-card.tsx`：`petPillOutlineClass` 等样式常量，入口按钮可复用。
- `apps/web/src/assets/paw-sticker-sm.png`：既有装饰贴纸，弹窗头部复用。

**测试与夹具**

- `apps/server/src/test/java/com/pawtrip/server/trip/`：`@SpringBootTest` + `@AutoConfigureMockMvc` 与独立 SQLite 先例。
- `apps/server/src/test/java/com/pawtrip/server/**/*MigrationTest.java`：Flyway 临时库迁移测试先例。
- `apps/web/src/components/trip/*.test.tsx`：jsdom + Testing Library 组件测试先例。
- `e2e/trip-helpers.ts`：`signIn`、`resetTrips`、`pets`、`createTripViaApi`、`csrfHeaders`、`openTrips`、`tripCard`。
- `e2e/itinerary.spec.ts`：珠海 `440400`、`豆豆`、2 天、`startDate: 2026-12-01`、PUT plan/transportMode、激活行程的种子方式。

**知识库**

- `docs/knowledge/interfaces/http-api.md`：HTTP 契约登记处；需补清单 5 个端点与错误码。
- `docs/knowledge/rules/`：`@rule:spec-first` 等实现约束。

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| 数据库 | 最新 V28 | 新增 V29：`trip_packing_checklist`（`trip_id` 唯一）与 `trip_packing_item`（分类、名称、数量、勾选、来源、模板键、状态、数量覆盖、排序）；唯一索引 `(checklist_id, template_key)`；行程删除级联 |
| 后端领域 | 无 `packing` 包 | 新增实体、仓库、模板映射、服务、控制器与 DTO；模板为静态代码 |
| 错误码 | 无清单错误码 | 新增 `PACKING_CHECKLIST_NOT_FOUND`、`PACKING_ITEM_NOT_FOUND`、`PET_PROFILE_REQUIRED` |
| API | 无清单接口 | `POST/GET /api/trips/{tripId}/packing-checklist`；`POST/PUT/DELETE .../items[/{itemId}]`；POST 幂等 201/200；属主 404 |
| 行程删除 | 仅删行程 | 清单表外键级联删除（服务层无需额外代码，需测试验证） |
| 行程单页面 | Day 行仅路线按钮 | Day 行新增「携带清单」按钮与进度文案；新增弹窗状态与组件 |
| 清单弹窗 | 不存在 | 新增弹窗：按分类分组、勾选、数量编辑、新增/删除、进度、完成态、无档案/未生成/失败态 |
| 宠物变更 | 仅使档案查询失效 | 保存/删除成功后同时使清单查询失效，触发读取时同步 |
| 查询层 | 无清单查询 | 新增 `packing-checklist.ts`：类型、query key、query options（404 → `null`）、mutation options、错误文案 |
| 导出路径 | 已隔离打印/图片 | 弹窗 `print:hidden`，不进入导出 DOM；回归既有导出 |
| Living Spec | `trip-itinerary` 无清单要求 | ADDED `trip-packing-checklist`；MODIFIED `trip-itinerary`（入口、进度、弹窗与引导） |
| 知识库 | `http-api` 无清单端点 | 归档后补清单端点、错误码与同步语义 |

## 4. Blast radius

- **直接受影响**：行程单 `/itinerary` Day 标签行与新增弹窗、宠物保存/删除后的查询失效、新增清单 API 与 V29 迁移。
- **不受影响**：行程计划结构、交通方式选择与快照、地点浏览与政策、城市推荐、档案字段与校验、管理端、认证与权限边界。
- **兼容性**：新增表与新端点，不改既有字段；前端仅新增入口与查询；无新依赖、无运行拓扑变化。
- **外部依赖**：无。模板为代码内静态常量，不调用 AI 或外部服务。
- **数据迁移**：V29 仅建新表与新索引，不修改既有表；既有行程无清单，首次访问展示未生成引导。

## 5. Artifact impact

- **Specs**：ADDED `trip-packing-checklist`（数据模型、模板映射、同步规则、编辑与删除语义、进度口径、API、错误码、权限）；MODIFIED `trip-itinerary`（入口、进度、弹窗、引导与导出隔离）。
- **Tests**：
  - 后端：`PackingTemplateTest`（映射与分档）、`PackingChecklistApiTest`（生成/幂等/权限/增删改/同步/墓碑/进度/级联）、`PackingChecklistSchemaMigrationTest`（表结构、唯一索引、CHECK、级联）。
  - 前端：`packing-checklist-dialog.test.tsx`（生成、分类与进度、勾选、自定义新增、无档案引导）。
  - E2E：`e2e/packing-checklist.spec.ts`（生成、分类、勾选持久化、100%、自定义/数量/删除、档案同步与数据保留）。
- **Docs / KB**：`docs/knowledge/interfaces/http-api.md` 补清单端点与错误码；必要时补模板映射说明。
- **OpenSpec**：已建立 change `2026-11-18-add-trip-packing-checklist`（proposal / delta specs / design / tasks），需 `openspec validate --strict` 通过。
- **Gate**：P1/P2 工件产出后需人工 G1 评审；本 Agent 不代签。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 承载「V29 模型 → 模板与同步 → API → 前端查询与弹窗 → 行程单入口与进度 → E2E」。拆开会产生不可验收中间态（有表无 API，或 API 无入口）。
- **Agile**：可拆 3 个薄故事：生成与展示（US-18 AC-1/AC-2）→ 编辑与同步（AC-3/AC-4）→ 勾选进度与跨设备（US-19）；按依赖顺序交付。
- **依赖顺序**：V29 模型与模板单测 → 服务与 API（生成/读取同步/增删改）→ 前端查询与弹窗 → 行程单入口/进度 → 宠物变更失效 → E2E 与 KB。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 读取时写入 | GET 同步会更新隐藏/新增模板项；必须在事务内执行并保证幂等；唯一索引兜底并发插入；同步无变化时不 touch `updated_at` |
| 风险 R2 | 模板项与用户编辑冲突 | 用 `quantity_overridden` 区分手动数量；模板名称/分类始终刷新；模板项 PUT 忽略名称/分类 |
| 风险 R3 | 删除墓碑被复活 | `DELETED` 模板行保留并复用；同步只激活 `HIDDEN`，跳过 `DELETED`；唯一索引要求复用而非重插 |
| 风险 R4 | 场景隐藏与用户删除混淆 | 两种状态分离：`HIDDEN` 可恢复并重置勾选，`DELETED` 永不恢复；E2E 覆盖高铁↔飞机与删除后切换 |
| 风险 R5 | 档案删除受限 | 行程外键限制导致档案不可直接删除；`PET_PROFILE_REQUIRED` 仅在极端数据状态出现，测试用直连 JDBC 构造并覆盖 |
| 风险 R6 | 跨设备并发 | 最后写入生效，无实时冲突提示；需求未要求合并策略，记录为非阻塞 |
| 风险 R7 | E2E 档案种子污染 | E2E 修改豆豆体重后必须在 `finally` 恢复，避免影响同 worker 其他 spec 的档案断言 |
| 风险 R8 | 导出隔离 | 弹窗使用 `print:hidden` 且不在导出渲染树中；回归 PDF/图片断言无清单内容 |
| 风险 R9 | 迁移编号冲突 | 当前最新 V28；若 main 并行产生 V29 需顺延重编号并复验迁移测试 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`2026-11-18-add-trip-packing-checklist`（已建立）。
- 理由：清单模型、模板同步、API、弹窗与进度构成一条验收链（生成 → 展示 → 勾选 → 跨设备 → 档案变化保留）；拆分会产生不可独立验收的中间态。
- 规模预估：M；1 个迁移、1 个后端领域（5 个类 + DTO）、1 个前端弹窗与查询、行程单小改、3 组后端测试 + 1 组组件测试 + 1 个 E2E。
- 工作切片（change 内任务顺序）：T1 红测（模板/API/迁移）→ T2 V29 与领域 → T3 服务与 API → T4 前端查询与弹窗 → T5 行程单入口/进度与档案失效 → T6 E2E 与整体验证 → T7 KB 与 tasks 勾选。
