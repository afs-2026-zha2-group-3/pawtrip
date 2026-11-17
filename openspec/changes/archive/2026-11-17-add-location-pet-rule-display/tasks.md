# Tasks

## 1. 数据查询地基

- [x] 1.1 在 `PawtripLocationRepository` 增加 `findAttractionPage(regionCode, regionLevel, includeWithoutRules, pageable)` native query：`type_group='attraction'`、城市/省级前缀匹配、默认 `max_pets_per_person >= 1`、`id ASC`、countQuery；不新增迁移、不改实体字段。验证：`cd apps/server && ./mvnw -q -Dtest=LocationRepositoryTest test` 覆盖默认 >=1/全部/区县前缀/非景点排除。
- [x] 1.2 更新 `docs/knowledge/architecture/README.md`：记录公开景点查询直接使用现有 8 个政策字段、默认 `maxPetsPerPerson >= 1`、不新增迁移。验证：文档字段名与查询语义和代码一致。

## 2. 只读查询 API（ATDD 先行）

- [x] 2.1 先写 `LocationQueryApiTest`（A1–A12）：默认/全部列表、摘要含 `maxPetsPerPerson`、区县前缀、详情 8 字段、分页、`401`、`404`、`400`、`USER` 可读、无高德调用、无写入端点、管理 API 不含三档字段。验证：测试先红，失败原因与未实现端点/断言一致。
- [x] 2.2 实现 `LocationQueryController`（`/api/locations`）、`LocationQueryService`、`LocationQueryResponses`：列表摘要含 `poiId`/`name`/`typeCode`/`typeGroup`/`address`/`regionCode`/`maxPetsPerPerson`；详情含 `petPolicies`（8 字段）；复用现有认证与 Problem Details。验证：`./mvnw -q -Dtest=LocationQueryApiTest test` 全绿。
- [x] 2.3 更新 `docs/knowledge/architecture/README.md` 与接口知识占位：记录公开只读 API 路径、认证要求、`maxPetsPerPerson` 三态与错误码。验证：文档与实际路由/错误码一致。

## 3. E2E 数据

- [x] 3.1 新增 `scripts/seed-e2e-attractions.mjs <db-path>`：插入 `e2e-` 前缀的珠海/杭州/南京夹具（含酒店），覆盖 `maxPetsPerPerson` 为 1/0/null 与部分政策字段；`poi_json`/`business_json` 为 `{}`；按 `poi_id` 覆盖；在 `scripts/run-e2e.mjs` 的用户种子之后调用，失败即阻断 E2E。验证：脚本在临时库重复执行两次不产生重复行；`run-e2e.mjs` 启动日志显示种子成功。
- [x] 3.2 在 `docs/knowledge/architecture/README.md` 记录 E2E 种子边界（只操作临时库，不触碰开发库）。验证：文档命令可直接执行。

## 4. 前端景点页（ATDD 先行）

- [x] 4.1 先写 `e2e/attraction-pet-rules.spec.ts`（E1–E12）：选定城市自动进入景区 Tab、默认 `maxPetsPerPerson >= 1`、全部模式三态、详情、城市切换、未选城市、空态、景区 Tab 选中、反向 Non-goals、登出清除、城市浏览页无景点入口。验证：测试先红，失败原因与未实现路由/页面一致。
- [x] 4.2 新增 `queries/attractions.ts`（列表/详情 queryOptions，query key 含 `adcode`、`includeWithoutRules`、`page`、`pageSize`、`poiId`）与展示纯函数（`maxPetsPerPerson` 三态、字段格式化）。验证：`npm test -w apps/web -- src/lib/attraction-pet-rules.test.ts` 通过。
- [x] 4.3 新增 `/attractions` 列表路由与局部组件（`-attraction-card.tsx`、`-pet-friendly-badge.tsx`）：读取 `useSelectedDestination()`，无城市不发请求，默认仅 `>=1`，切换全部，分页与空态。验证：E2E E1/E2/E6/E8/E9 转绿；`npm run build` 通过。
- [x] 4.4 新增 `/attractions/$poiId` 详情路由与字段组件：三态状态、8 个非空政策字段、`暂无携宠政策`，无编辑入口；404 交给现有根错误组件。验证：E2E E3/E4/E5/E10 转绿。
- [x] 4.5 新增顶部“景区浏览”Tab；在 `/cities` 选定城市后自动跳转 `/attractions`；移除城市浏览页的“查看景点”按钮；在 `__root.tsx` 将 `/attractions` 与 `/attractions/*` 映射到 `attractions` Tab。验证：E2E E1/E5/E7/E11/E12 转绿。
- [x] 4.6 更新 `docs/knowledge/architecture/README.md`：记录 `/attractions`、`/attractions/$poiId`、入口与 Tab 选中规则。验证：文档路由与实际 `routeTree` 一致。

## 5. 集成与回归

- [x] 5.1 运行后端全量测试：`cd apps/server && ./mvnw test`，确认既有 `AdminLocationApiTest`、`DestinationApiTest`、迁移/仓库测试与新 API 测试全绿。
- [x] 5.2 运行前端单测、类型检查与构建：`npm test -w apps/web`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build`，全部通过。
- [x] 5.3 运行 E2E：`npm run test:e2e`，确认 `attraction-pet-rules`、`destination-selection`、`authentication`、`admin-location-management` 全绿，且未修改 `apps/server/data/pawtrip.db`。
- [x] 5.4 定向验证非目标：公开 API 无写入端点，管理 API 不含 `entryPolicy`/`entryNote`，公开详情不含照片/business，列表不含非景点，页面无城市选择/类型筛选/行程入口，城市浏览页无景点入口。验证：API 用例与 E2E 反向断言全绿。
- [x] 5.5 代码审查确认：无新增 Flyway 迁移、`PawtripLocation` 无新增字段、无三档枚举/说明列。验证：`git diff` 与迁移目录审查。
