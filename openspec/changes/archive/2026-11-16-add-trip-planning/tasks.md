# Tasks

## 1. 数据库迁移与错误码

- [x] 1.1 新增 `apps/server/src/main/resources/db/migration/V17__create_trip.sql`：创建 `trip` 表（`user_id`、`name`、`city_adcode`、`pet_id`、`total_days`、`plan_json`、`created_at`、`updated_at`），设置 `total_days >= 1`、用户 `ON DELETE CASCADE`、宠物 `ON DELETE RESTRICT`、城市外键与 `plan_json` 空计划默认值，并创建 `(user_id, id)` 索引。验证：Flyway 在临时 SQLite 库可执行到 V17。
- [x] 1.2 新增 `TripSchemaMigrationTest`：验证 `trip` 列、默认 `plan_json`、`total_days` 约束、宠物 RESTRICT、用户 CASCADE 与索引存在。验证：`cd apps/server && ./mvnw -q -Dtest=TripSchemaMigrationTest test` 通过。
- [x] 1.3 在 `ApiErrorCode` 增加 `TRIP_NOT_FOUND`（404）与 `PET_IN_USE`（409）；确认 `GlobalExceptionHandler` 无需修改即可输出 Problem Details `code`。验证：编译通过，后续 API 用例断言错误码。

## 2. Trip 实体与仓库

- [x] 2.1 新增 `com.pawtrip.server.trip.Trip` 实体，映射 `trip` 表全部列；构造时写入 `createdAt` / `updatedAt`（ISO-8601 字符串），更新方法刷新名称、总天数、计划与 `updatedAt`；不建立城市/宠物 JPA 关联。验证：应用启动与迁移测试通过。
- [x] 2.2 新增 `TripRepository`：`findAllByUserIdOrderByIdAsc(Long)` 与 `findByIdAndUserId(Long, Long)`。验证：由 API 测试覆盖列表隔离与所有权。

## 3. Plan JSON 解析、校验与规范化

- [x] 3.1 新增 `TripPlan` / `TripDay` / `TripStop` / `TripStopRef` 记录与空计划常量；约定 API `plan` 为对象、DB 为规范化后的 JSON 字符串。验证：单元测试可构造并序列化空计划。
- [x] 3.2 新增 `TripPlanValidator`：接收 `JsonNode` 与 `totalDays`，处理 `plan`/数组/`toNext` 缺省与 `null`，校验 `version=1`、`toNext ∈ {walk,drive,transit}`、`day` 唯一且在 `1..totalDays`、`totalDays >= max(day)`，并执行 `unscheduled` 按 `poiId` 去重、已排期地点优先移除。验证：`TripPlanValidatorTest` 覆盖全部规则。
- [x] 3.3 新增 `TripPlanValidatorTest`，覆盖：空计划与缺省数组、`days` 内重复 `poiId` 保留、`unscheduled` 去重、同 `poiId` 同时出现在 `days`/`unscheduled` 时只保留在 `days`、`toNext` 合法与非法值、`day` 重复/越界、`version` 缺失或非 1、`totalDays` 小于最大 `day`。验证：`cd apps/server && ./mvnw -q -Dtest=TripPlanValidatorTest test` 通过。
- [x] 3.4 在 `TripService` 校验阶段用 `PawtripLocationRepository.findAllByPoiIdIn` 一次性校验去重后的 `poiId` 均存在；空集合不发起查询；缺失返回 `400 VALIDATION_ERROR`。验证：API 测试的“不存在 poiId”用例通过。

## 4. Trip 服务与 API

- [x] 4.1 新增 `TripRequests.SaveTrip`（`name`、`cityAdcode`、`petId`、`totalDays`、`JsonNode plan`）与 `TripResponses.TripSummary` / `TripDetail`；摘要含 `id`、`name`、`cityAdcode`、`petId`、`totalDays`、`createdAt`、`updatedAt`，详情额外含 `plan`。验证：序列化字段与规格一致。
- [x] 4.2 新增 `TripService`：通过 `Authentication.getName()` + `AppUserRepository` 解析 `userId`；实现创建、列表、详情、整量更新、删除；校验城市存在且 `level='city'`、宠物属于当前用户、名称 trim 后非空、`totalDays >= 1` 且不小于计划最大 `day`；非本人 trip 抛 `TRIP_NOT_FOUND`；所有请求级校验抛 `VALIDATION_ERROR`。验证：API 测试转绿。
- [x] 4.3 新增 `TripController`：`POST /api/trips`（201 + `Location`）、`GET /api/trips`、`GET /api/trips/{id}`、`PUT /api/trips/{id}`、`DELETE /api/trips/{id}`（204）；控制器只依赖 `TripService`。验证：路由与状态码符合规格。
- [x] 4.4 新增 `TripApiTest`：覆盖创建多个 trip、`201 + Location`、列表仅本人且按 `id` 升序、列表不含 `plan`、详情含 `plan`、默认空计划、同一 `poiId` 跨天重复、`toNext` 省略、非法城市/宠物/`poiId`/`toNext`、城市/宠物不可变、`totalDays` 收缩 400、删除后 404、未登录 401、他人资源 404。验证：`cd apps/server && ./mvnw -q -Dtest=TripApiTest test` 通过。

## 5. 宠物删除冲突保护

- [x] 5.1 调整 `PetService.delete`：删除宠物后在当前事务内 `flush()`，捕获 `DataAccessException` 并识别外键冲突后抛 `ApiException(PET_IN_USE)`，确保外键约束在方法返回前暴露。验证：被 trip 引用的宠物删除返回 `409`，未被引用的宠物仍返回 `204`。
- [x] 5.2 扩展 `PetApiTest`（或新增用例）：创建引用宠物的 trip 后删除宠物，断言 `409 PET_IN_USE` 且 `GET /api/pets/{id}` 仍可读取；另建未引用宠物，断言删除 `204`。验证：`cd apps/server && ./mvnw -q -Dtest=PetApiTest test` 通过。

## 6. 文档与回归

- [x] 6.1 更新 `docs/knowledge/architecture/README.md`：记录 `trip` 模块、plan JSON v1 契约、`/api/trips`、`TRIP_NOT_FOUND` / `PET_IN_USE` 错误码与宠物删除约束。验证：文档字段、路由与错误码与实现一致。
- [x] 6.2 运行后端全量测试：`cd apps/server && ./mvnw test`，确认既有 `PetApiTest`、地点/城市/目的地测试与新用例全绿。验证：BUILD SUCCESS。
- [x] 6.3 非目标审查：确认无前端改动、无既有表字段修改、`pawtrip_location` 城市归属未被额外校验、交通不保存耗时/时刻、更新不接受 `cityAdcode`/`petId`。验证：`git diff` 与用例反向断言。
- [x] 6.4 检查迁移版本冲突：确认 `V17` 为当前唯一新增迁移，无其他在途变更占用同一版本号。验证：迁移目录列表与分支对比。
