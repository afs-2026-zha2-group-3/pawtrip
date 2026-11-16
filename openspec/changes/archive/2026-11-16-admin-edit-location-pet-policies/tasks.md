# Tasks

## 1. 后端契约与持久化

- [x] 1.1 在 `AdminLocationRequests` 增加嵌套 `PetPolicies` 记录，创建/更新请求接受可选 `petPolicies`；在 `AdminLocationResponses.LocationDetail` 增加 `petPolicies` 对象。验证：`cd apps/server && ./mvnw -q -DskipTests compile` 通过。
- [x] 1.2 扩展 `LocationWriteService`，在一次事务内更新游玩时间与政策；仅当请求包含 `petPolicies` 时替换政策。验证：`cd apps/server && ./mvnw -Dtest=LocationRepositoryTest test` 通过，并覆盖政策往返。
- [x] 1.3 在 `AdminLocationService` 增加政策校验与映射：数量非负整数、体重/费用非负、体重最多两位小数；创建写入、更新按 `petPolicies` 语义处理、详情返回。验证：同时运行 `./mvnw -Dtest=AdminLocationApiTest test`。
- [x] 1.4 扩展 `AdminLocationApiTest`，覆盖创建政策、详情往返、PATCH 缺省不改、整体替换、`null` 清空、负数与超两位小数返回 400。验证：`cd apps/server && ./mvnw test` 全部通过。

## 2. 前端表单与端到端测试

- [x] 2.1 扩展 `apps/web/src/queries/admin-locations.ts`：增加 `PetPolicies` 类型，并把 `petPolicies` 接入地点详情、创建入参与更新入参。验证：`npm run build` 通过。
- [x] 2.2 新增共享 `PetPolicyFields` 组件与政策转换/校验辅助函数，支持三态布尔、空值、元/分换算和两位小数校验。验证：新增 vitest 用例覆盖换算与非法值，`npm test -w apps/web` 通过。
- [x] 2.3 在 `AmapCandidateEditor` 增加“携宠政策”区块，所有类型显示；创建时提交 `petPolicies`，切换候选时重置。验证：由 2.5 的创建场景覆盖。
- [x] 2.4 在 `SavedLocationEditor` 改为单表单始终渲染：政策按详情回填，游玩时间仅景点显示，保存时提交 `petPolicies`，清空字段可写回 `null`。验证：由 2.5 的编辑与清空场景覆盖。
- [x] 2.5 更新 `e2e/admin-location-management.spec.ts` 的 mock 与断言，覆盖创建填写政策、编辑回填与保存、清空、非法值四类场景。验证：`npm run test:e2e` 通过。
- [x] 2.6 更新 `docs/knowledge/architecture/README.md` 的地点管理说明，补充政策编辑的 API 与两个弹窗入口。验证：文档中的路径与当前实现一致。

## 3. 集成验证与收尾

- [x] 3.1 运行完整后端测试、前端构建与 e2e：`cd apps/server && ./mvnw test`、`npm run build`、`npm run test:e2e`，记录全部结果。
- [x] 3.2 运行 `openspec validate "admin-edit-location-pet-policies" --strict`，确认 delta 与 change 结构通过校验。
- [x] 3.3 审查 `git diff --stat`，确认只修改管理与测试相关文件，未新增数据库迁移，也未触碰行政区、公共展示或列表契约。
