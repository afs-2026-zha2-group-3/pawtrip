# REQ-008 Impact Brief — 宠物友好景点携宠规则展示

- 生成日期：2026-11-16（Revision 3）
- 上游需求：[REQ-008 宠物友好景点携宠规则展示](../../requirements/REQ-008-location-pet-rule-display.md)
- Deep-dive：[deep-dive.md](deep-dive.md)
- 修订说明：Revision 2 移除 `entry_policy` / `entry_note` 与新增迁移；默认列表按现有 `maxPetsPerPerson >= 1`；公开页只读数据库。Revision 3 新增顶层“景区浏览”Tab，选择城市后自动进入，城市浏览页不内嵌景点列表或入口按钮。

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-008 | 宠物友好景点携宠规则展示 | ready-for-split（Revision 2） | `requirements/REQ-008-location-pet-rule-display.md` |

阻塞开放问题：0；DoR BLOCKER：0；非阻塞未决项：2（分页形态、省级叶节点实现细节，均已 deferred）。

## 2. As-is 资产清单（证据路径）

**Knowledge base**

- `docs/knowledge/architecture/README.md`：地点管理模块、`/api/admin/**` 与 `ADMIN` 权限、SQLite/Flyway、前端 TanStack Query 与路由约定
- `docs/knowledge/rules/architecture/java-patterns.md`、`rules/quality/java-coding-style.md`、`rules/security/java-security.md`、`rules/testing/java-testing.md`
- `docs/knowledge/rules/architecture/react-patterns.md`、`rules/quality/react-coding-style.md`、`rules/testing/react-testing.md`
- `docs/knowledge/interfaces/README.md`：接口知识占位，无公开地点查询契约条目

**Living Spec**

- `openspec/specs/location-management/spec.md`：地点管理、政策持久化、字段语义与管理 API；管理员编辑 6 项政策
- `openspec/specs/web-app-shell/spec.md`：顶部 Tab、路由同步与受保护路由
- `openspec/specs/backend-authentication/spec.md`、`backend-error-handling/spec.md`、`backend-data-access/spec.md`：登录、Problem Details、JPA/Flyway 基线
- `openspec/specs/frontend-api-request/spec.md`、`frontend-data-fetching/spec.md`、`ui-foundation/spec.md`、`browser-e2e-testing/spec.md`：请求、查询、UI 与 e2e 基线

**In-change assets**

- `openspec/changes/destination-selection/`（REQ-006）：`/cities` 目的地选择、sessionStorage 选定状态、顶栏目的地 chip、`web-app-shell` delta；尚未归档到 Living Spec
- `requirement-workspace/requirements/REQ-006-destination-selection.md`、`analysis/REQ-006/`：已选目的地契约与决策

**Post-archive SDD assets**

- `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/`：两个管理弹窗、`petPolicies` API 契约、三态布尔与费用换算基线
- `openspec/changes/archive/2026-11-16-add-pet-entry-policies/`：V7 六列、实体字段、`updatePetPolicies` 基线
- `openspec/changes/archive/2026-11-16-admin-location-management/`：地点管理页、保存/编辑、分页与详情基线

**当前实现**

- 数据库：`V7__add_pet_entry_policies.sql`（6 列）、`V9__add_allowed_pet_types.sql`、`V11__add_dog_breed_and_pet_limits.sql`（肩高）；当前 main 最新迁移为 `V14__add_pet_dog_breed.sql`
- 实体：`PawtripLocation.java`（8 个政策字段 + `updatePetPolicies`）、`PawtripLocationRepository.java`（`findByPoiId`、`findAdminPage`）
- 管理 API：`AdminLocationController.java`（`/api/admin/**`）、`AdminLocationService.java`、`AdminLocationResponses.java`（`PetPolicies` 只含 6 项）
- 前端：`apps/web/src/routes/_authenticated/cities.tsx`（目的地选择）、`apps/web/src/lib/selected-destination.ts`（sessionStorage）、`apps/web/src/routes/__root.tsx`（Home/Paws/Cities + 管理 Tab、目的地 chip、登出清理）
- 展示工具：`apps/web/src/lib/pet-policy.ts`（元/分、三态布尔、校验）
- 测试：`apps/server/src/test/java/com/pawtrip/server/location/AdminLocationApiTest.java`、`LocationSchemaMigrationTest.java`、`e2e/destination-selection.spec.ts`、`e2e/admin-location-management.spec.ts`

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `pawtrip_location` schema | V7 六列 + V9 允许类型 + V11 肩高 | **不变**；不新增列、不新增迁移 |
| `PawtripLocation` | 已有 8 个政策字段 | **不变**；复用 `maxPetsPerPerson` 作为友好门槛 |
| `PawtripLocationRepository` | 已有 `findByPoiId`、`findAdminPage` | 增加用户端景点分页查询：城市范围 + `type_group='attraction'` + 默认 `max_pets_per_person >= 1` |
| 用户端地点查询 | 不存在 | 新增只读控制器/服务（如 `LocationQueryController` / `LocationQueryService`）：`GET /api/locations/attractions`、`GET /api/locations/{poiId}`；登录即可，不要求 `ADMIN` |
| 列表摘要 | 不存在 | 返回 `poiId`/`name`/`typeCode`/`typeGroup`/`address`/`regionCode`/`maxPetsPerPerson`，供前端派生“宠物友好/禁止携带/未配置”三态 |
| 详情响应 | 管理详情含 6 项 + 照片/business | 公开详情含 8 项 `petPolicies`；不返回照片/business/`poi_json` |
| 管理 API | `PetPolicies` 只含 6 项 | **不变**；不新增三档/说明字段 |
| `/cities` 页面 | 目的地选择、选定提示、顶栏 chip | 选定目的地后自动进入 `/attractions`；移除“查看{城市}景点”入口；不内嵌景点列表 |
| 前端路由 | 无 `/attractions` | 新增 `/attractions` 列表与 `/attractions/$poiId` 详情；顶部导航新增“景区浏览”Tab |
| 前端导航 | Home/Paws/城市浏览 + 管理 Tab | 新增“景区浏览”Tab；`/attractions` 与详情归入该 Tab；`/cities` 选定后自动切换 |
| 前端查询 | 无公开景点查询 | 新增 `queries/attractions.ts`（列表 + 详情），复用 `lib/http/request.ts` 与 TanStack Query |
| 展示组件 | 管理端有政策表单/标签工具 | 新增公开只读的规则展示组件；复用三态/费用格式化工具，不引入管理表单 |
| `web-app-shell` spec | Living spec 记录 Home/Paws 与管理员 Tab；`Cities` Tab 由 `destination-selection` delta 补齐 | ADDED：新增“景区浏览”Tab；`/attractions` 与详情归入该 Tab；`/cities` 选定后自动进入 |
| `destination-selection` spec | `/cities` 搜索/筛选/选定/持久化 | checked, no requirement change；选定后自动跳转是本能力的入口集成；其 E2E 已按新流程更新 |
| `location-management` spec | 管理端 6 项政策编辑与 API 契约 | checked, no requirement change；公开页只读现有字段 |
| 测试 | 管理端 API/迁移/e2e、目的地 e2e | 增加公开 API 测试（默认 >=1/全部/城市范围/详情/401/404/400/无高德）、前端查询单测、`/attractions` e2e；目的地 e2e 更新为“选定后自动进入景区 Tab” |
| `docs/knowledge/architecture/README.md` | 地点管理模块说明 | 可选补充“用户端地点公开查询”与 `/attractions` 展示路径；不阻塞实现 |
| 高德集成 | 管理端候选搜索 | 不变；公开列表只读数据库，不调用高德 |

## 4. Blast radius

- **直接受影响**：`apps/server` 地点模块（新增只读控制器/服务/DTO、仓库查询）；`apps/web` 路由（`/attractions`、`/attractions/$poiId`、`/cities` 入口、`__root.tsx` Tab 映射）、查询与展示组件；地点与目的地相关测试。
- **不受影响**：数据库 schema 与 Flyway 迁移链、实体字段、管理端地点页面与 API、认证与角色、CSRF、Problem Details、高德集成、行政区/城市政策（US-04）、宠物档案、`/paws`、行程模块（不存在）。
- **运行拓扑**：不变；仍为浏览器 → Vite `/api` 代理 → Spring Boot → SQLite；新增只读查询，不新增外部服务。

## 5. Artifact impact

- **Specs**：新增 `attraction-pet-rules` 一个 capability；修改 `web-app-shell` 一个 capability；`location-management` 与 `destination-selection` 无需求变更（仅实现集成）。
- **Tests**：后端公开 API 测试、前端查询单测与 Playwright e2e 需要新增；既有管理端与目的地 e2e 需回归。
- **Docs / KB**：可选更新地点管理架构说明；接口知识库当前为空，不强制新增。
- **OpenSpec**：新建一个 change 包承载 proposal、delta spec、设计、任务与 DoV 评审；P1–P3 已完成，Revision 2 后需重跑 P3 DoV 并重签 G1。

## 6. Dual-track notes

- **OpenSpec**：一个 change 覆盖公开 API、两个前端页面与测试；delta 聚焦 `attraction-pet-rules` 与 `web-app-shell`。
- **Agile**：可拆为“公开查询”“景点列表”“景点详情”三个薄故事，但同属一个垂直切片；建议单 change 交付，避免接口已改而页面不可用。
- **依赖顺序**：REQ-006 已提供已选目的地；本 change 在其之上增加展示，不反向修改其行为。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 默认门槛依赖 `maxPetsPerPerson` 已维护 | 未录入/`NULL` 的地点不会进入默认列表；数据补齐前列表可能为空；由现有管理弹窗维护，建议提供数据核对清单 |
| 风险 R2 | 现有管理弹窗只编辑 6 项 | `allowed_pet_types` 与肩高不在弹窗中；公开详情有值才展示，不要求本 change 补录 |
| 风险 R3 | `web-app-shell` delta 与 destination-selection 冲突 | REQ-006 仍在 change 中并修改同一 spec；本 change 新增“景区浏览”Tab，需在其 delta 之上增量，避免重复 Tab 要求；目的地 E2E 已按自动跳转更新 |
| 风险 R4 | 城市边界匹配 | 已保存地点的 `region_code` 可能是区县级；复用 `ValidatedRegion` 的省市前缀口径，P3 用测试覆盖城市与省级叶节点 |
| 风险 R5 | 列表规模与分页 | 已保存景点可能增长；服务端分页，默认 20；P3 确认前端分页控件 |
| 风险 R6 | 数据准确性 | 政策由人工摘录/管理员维护，可能过期；本 change 不提供校正 UI，需季度复核 |
| 风险 R7 | 导航 Tab 数量增加 | 顶部导航从三个普通 Tab 变为四个；已通过全量 E2E 回归验证既有路由/守卫 |
| **blocker** | 无 | 无阻塞性未知依赖；AC-2 已明确延后 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`add-location-pet-rule-display`。
- 理由：公开查询、列表与详情共享同一数据契约与展示口径；拆分会造成“接口已改但页面不可用”或“页面依赖未定契约”的中间态。
- 依赖 / 阶段：消费 REQ-006 的已选目的地；不依赖 US-48（AC-2 延后）；无需数据库迁移，落地风险较 Revision 1 更低。
- 不推荐拆成“后端 change + 前端 change”：AC-1 需要端到端验证“城市 → 列表 → 详情”的完整路径。
- 规模预估：S–M（中等偏小）；无迁移、无管理 UI。
