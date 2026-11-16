# REQ-005 Impact Brief — 管理员维护地点宠物政策

- 生成日期：2026-11-16
- 上游需求：[REQ-005 管理员维护地点宠物政策](../../requirements/REQ-005-location-pet-policy-editing.md)
- Deep-dive：[deep-dive.md](deep-dive.md)

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-005 | 管理员维护地点宠物政策 | ready | `requirements/REQ-005-location-pet-policy-editing.md` |

阻塞开放问题：0；DoR BLOCKER：0；非阻塞未决项：0（4 项均已 resolved）。

## 2. As-is 资产清单（证据路径）

**Knowledge base**

- `docs/knowledge/architecture/README.md`：`com.pawtrip.server.location` 模块、管理 API `/api/admin/**` 与 `ADMIN` 权限约定
- `docs/knowledge/rules/architecture/java-patterns.md`、`rules/quality/java-coding-style.md`、`rules/security/java-security.md`、`rules/testing/java-testing.md`
- `docs/knowledge/rules/architecture/react-patterns.md`、`rules/quality/react-coding-style.md`、`rules/testing/react-testing.md`
- `docs/knowledge/interfaces/README.md`：接口知识占位，无地点政策契约条目

**Living Spec**

- `openspec/specs/location-management/spec.md`：地点管理页面、保存/编辑、游玩时间，以及已新增的“行政区与地点分别保存宠物政策”和“政策字段语义”要求
- `openspec/specs/frontend-api-request/spec.md`、`backend-error-handling/spec.md`、`backend-authentication/spec.md`、`ui-foundation/spec.md`：本次复用的请求、错误、权限与 UI 基线
- `openspec/specs/backend-data-access/spec.md`：SQLite/Flyway 数据访问约定

**Post-archive SDD assets**

- `openspec/changes/archive/2026-11-16-admin-location-management/`：管理页、两个弹窗、分页、详情与保存流程基线
- `openspec/changes/archive/2026-11-16-add-pet-entry-policies/`：V7 列、实体字段、`updatePetPolicies` 与迁移测试基线
- `openspec/specs/location-management/spec.md` 中两项政策要求即来自后者

**当前实现**

- 数据库：`apps/server/src/main/resources/db/migration/V7__add_pet_entry_policies.sql`
- 实体：`PawtripLocation.java`（6 字段 + getter + `updatePetPolicies`）、`AdministrativeRegion.java`（同名字段，本次不改）
- API DTO：`AdminLocationRequests.java`（`SaveLocation`、`UpdateVisitHours`）、`AdminLocationResponses.java`（`SavedLocation`、`LocationDetail`）
- 服务：`AdminLocationService.java`（创建/更新/详情/校验）、`LocationWriteService.java`（创建与 `updateVisitHours`）、`AdminLocationController.java`
- 前端：`apps/web/src/routes/_authenticated/admin/-location-editor.tsx`、`apps/web/src/routes/_authenticated/admin/locations.tsx`、`apps/web/src/queries/admin-locations.ts`
- 测试：`e2e/admin-location-management.spec.ts`、`apps/server/src/test/java/com/pawtrip/server/location/AdminLocationApiTest.java`、`LocationRepositoryTest.java`、`LocationSchemaMigrationTest.java`

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `pawtrip_location` schema | V7 已有 6 个可空列 | 不变，无新迁移 |
| `PawtripLocation` | 已映射 6 字段，`updatePetPolicies` 无调用方 | 不改实体；在创建与更新路径调用 |
| `AdministrativeRegion` | 已有同名字段 | 不变；不读取、不写入、不继承 |
| `AdminLocationRequests.SaveLocation` | `poiId`、`typeGroup`、`min/maxVisitHours` | 增加可选 `petPolicies` 对象（6 个可空字段） |
| `AdminLocationRequests.UpdateVisitHours` | 仅游玩时间 | 扩展为地点额外信息更新（名称可按设计调整），增加可选 `petPolicies` 对象；缺省不改，出现则整体替换 |
| `AdminLocationResponses.LocationDetail` | 不含政策 | 增加 `petPolicies` 对象（6 个可空字段），供编辑回填与保存后刷新 |
| `AdminLocationResponses.SavedLocation` | 列表字段不含政策 | 不变 |
| `AdminLocationService` | 创建不写政策；更新只写游玩时间；详情不返回政策 | 创建/更新校验并持久化政策；详情映射 6 字段；非法值返回 400 |
| `LocationWriteService` | 创建写真；更新仅 `updateVisitHours` | 一次事务写入游玩时间与政策；仅在 `petPolicies` 出现时替换政策 |
| `AdminLocationController` | PATCH 绑定 `UpdateVisitHours` | 绑定扩展后的请求类型 |
| `apps/web/src/queries/admin-locations.ts` | 类型与入参不含政策 | 详情、创建入参、更新入参增加 `petPolicies` 与 6 个字段 |
| `AmapCandidateEditor` | 仅游玩时间 | 增加政策编辑区（所有类型），提交创建请求时携带政策 |
| `SavedLocationEditor` | 表单仅景点渲染，只有游玩时间 | 表单始终渲染；政策所有类型可编辑并回填；游玩时间仍限景点；保留关闭/保存操作 |
| `e2e/admin-location-management.spec.ts` | 覆盖游玩时间保存与回填 | 更新 mock 响应；增加政策填写、回填、清除、非法值场景 |
| `AdminLocationApiTest` / `LocationRepositoryTest` | 覆盖地点 CRUD 与政策字段往返 | 增加创建/更新政策、清空为 `NULL`、负数拒绝 |
| `openspec/specs/location-management/spec.md` | 已有政策持久化与语义要求 | 后续 delta 增加“管理员可编辑地点政策”与 API 契约场景 |
| `docs/knowledge/architecture/README.md` | 描述地点管理模块 | 可选补充政策编辑路径；不阻塞实现 |
| `apps/server` 其他模块 / 公共 API | 无地点政策展示接口 | checked, no impact；本需求不新增公共 API |

## 4. Blast radius

- **直接受影响**：`apps/server` 地点管理模块（DTO、服务、写入服务、控制器）；`apps/web` 管理员地点页面与两个弹窗；地点管理相关测试。
- **不受影响**：SQLite schema 与迁移链、行政区数据、认证与角色、公共页面、行程、照片与 POI 基础信息。
- **运行拓扑**：不变；仍为浏览器 → Vite `/api` 代理 → Spring Boot → SQLite。

## 5. Artifact impact

- **Specs**：修改 `location-management` 一个 capability；不新增 capability。
- **Tests**：后端 API 测试与 Playwright 管理端 e2e 需要扩展；迁移测试不变。
- **Docs / KB**：可选更新地点管理架构说明；接口知识库当前为空，不强制新增。
- **OpenSpec**：新建一个 change 包承载 proposal、delta spec、tasks 与 DoV 评审。

## 6. Dual-track notes

- **OpenSpec**：一个 change 覆盖 API 契约、两个弹窗与测试，delta 聚焦 `location-management`。
- **Agile**：可拆为“API 契约与校验”“新建弹窗”“编辑弹窗”三个薄故事，但同属一个垂直切片；建议单 change 交付，避免弹窗与接口契约分离。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| 风险 R1 | 更新接口语义不清 | 已定：PATCH 使用可选 `petPolicies` 对象；缺省不改，出现则整体替换，旧客户端只提交游玩时间不会清空政策 |
| 风险 R2 | 弹窗高度与滚动 | 增加 6 个字段后“保存地点”弹窗变长；现有 `DialogContent` 已有最大高度与滚动，需确认两列布局可读 |
| 风险 R3 | 非景点弹窗结构 | 已定：单表单始终渲染，政策所有类型可编辑，游玩时间仅景点显示；需在实现中保持既有游玩时间规则 |
| 风险 R4 | e2e mock 缺字段 | 现有路由 mock 的详情/创建响应不含政策；需同步更新，避免回填为 `undefined` |
| 风险 R5 | 费用与体重换算/精度 | 元转分需处理两位小数与浮点误差；体重与费用均最多两位小数，超过直接拒绝；按“精确两位再换算”实现 |
| 风险 R6 | 流程台账漂移 | `registry.md` 缺 4 个已归档 change 的登记；属流程缺口，不影响本需求实现 |
| **blocker** | 无 | 无阻塞性未知依赖 |

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`admin-edit-location-pet-policies`。
- 理由：API 契约、两个弹窗与测试强耦合，拆分会产生“接口已改但 UI 不可用”或“UI 依赖未定契约”的中间态。
- 依赖 / 阶段：无跨 change 依赖；`add-pet-entry-policies` 已提供 schema 与实体基线。
- 不推荐拆成“后端 change + 前端 change”：同一验收需要端到端验证政策保存与回填。
