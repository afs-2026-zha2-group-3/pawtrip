# 任务

## 1. 后端 trip 字段与 API

- [x] 1.1 新增 V18 Flyway migration，为 `trip` 增加可空且限制合法取值的 `transport_mode` 列；扩展迁移测试，验证字段约束及既有记录迁移后为空，并运行 `./mvnw -Dtest=TripSchemaMigrationTest test`。
- [x] 1.2 扩展 trip 实体、创建/更新请求、详情响应与校验，使合法大交通方式可持久化且非法值返回 `400 VALIDATION_ERROR`；补充 API 测试，运行 `./mvnw -Dtest=TripApiTest test`。

## 2. 前端 Store、自动保存与展示

- [x] 2.1 扩展前端 Trip 类型和 Store action，使交通方式更新 active trip 并递增 `saveRevision`；将 `transportMode` 纳入现有自动保存请求，并补充 Store/保存逻辑测试；运行 `npm run test --workspace apps/web`。
- [x] 2.2 修改交通规则页：无 active trip 时展示创建/激活行程空态及 `/cities`、`/trips` 入口；有 active trip 时从 Store 回显单选并在选择后更新 Store，移除该选择的 `sessionStorage` 读写；添加浏览器测试，运行 `npm run test:e2e` 验证空态、选择和刷新恢复。
- [x] 2.3 修改 Trip Panel，在已选择大交通方式时显示对应 tag、未选择时隐藏；在浏览器测试中验证选择后 tag 更新及刷新后仍显示，并运行 `npm run test:e2e`。

## 3. 集成验证

- [x] 3.1 运行 `./mvnw test` 与 `npm run build`，验证 V18 migration、trip API、前端类型构建和完整后端测试均通过。
