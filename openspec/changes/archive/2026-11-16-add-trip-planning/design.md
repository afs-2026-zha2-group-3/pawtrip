# Design

## Context

PawTrip 当前没有行程持久化：已选目的地存于浏览器 `sessionStorage` 的 `pawtrip.selectedDestination`，已选交通方式存于 `pawtrip:selected-transport-mode`；这些状态只在单个标签页内有效，也没有“多天、地点顺序、地点间交通”的数据结构。US-48（查看行程单）需要服务端 trip 作为载体。

现有可复用约定：

- 后端：Spring Boot 4.1 / Java 21、Spring Data JPA、Flyway（`ddl-auto=none`）、SQLite（`foreign_keys=on`）。
- 用户归属：`PetService` 通过 `AppUserRepository.findByUsername` 解析 `userId`，并用 `findByIdAndUserId` 做所有权校验；非本人资源返回 404。
- 地点：`pawtrip_location` 以 `poi_id` 唯一标识，`PawtripLocationRepository` 已提供 `existsByPoiId` 与 `findAllByPoiIdIn`；城市级行政区由 `administrative_region.level='city'` 标识。
- 错误：业务异常继承 `ApiException` 并携带 `ApiErrorCode`，`GlobalExceptionHandler` 统一输出 Problem Details。
- JSON 列：现有 `poi_json`、`business_json`、`policies_json` 均以 `TEXT` 保存，实体映射为 `String`。
- 迁移版本：当前最新为 `V16`，本变更使用 `V17`。

## Goals / Non-Goals

**Goals**

- 新增 `trip` 表与服务端 CRUD，一个用户可有多个 trip，数据按用户隔离。
- 固定每个 trip 的城市与宠物，创建后不可变。
- 用 `plan_json` v1 承载每日有序地点、地点间城市内交通方式与未排序地点池。
- 在 API 边界完成 plan JSON 解析、校验与规范化，保证存储内容可预测。
- 宠物被 trip 引用后，删除返回明确冲突，而不是 500 或静默破坏引用。

**Non-Goals**

- 不做前端行程页、拖拽、地图、导出或自动排程。
- 不保存交通耗时、到达/离开时刻、日期或时区。
- 不做跨城市行程，也不校验 `poiId` 是否属于 trip 城市。
- 不迁移或自动读取浏览器 `sessionStorage` 中的已选目的地/交通方式。
- 不做并发编辑控制（乐观锁/PATCH 合并）；更新为整量替换、后写覆盖。

## Decisions

### D1 数据模型：单表 `trip` + JSON 列

`V17__create_trip.sql` 创建：

```sql
CREATE TABLE trip (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    city_adcode TEXT    NOT NULL,
    pet_id      INTEGER NOT NULL,
    total_days  INTEGER NOT NULL CHECK (total_days >= 1),
    plan_json   TEXT    NOT NULL DEFAULT '{"version":1,"days":[],"unscheduled":[]}',
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (city_adcode) REFERENCES administrative_region(adcode),
    FOREIGN KEY (pet_id) REFERENCES pet(id) ON DELETE RESTRICT
);

CREATE INDEX idx_trip_user_id ON trip(user_id, id);
```

- `city_adcode`、`pet_id` 只存标量 id，不建 JPA 关联；与 `Pet.userId` 的做法一致，避免懒加载并保持所有权校验显式。
- `pet_id` 使用 `ON DELETE RESTRICT`；`user_id` 沿用宠物表的 `CASCADE`；行政区没有删除路径，使用默认行为。
- 备选：把 day/stop/leg 拆成关系表 → 否决。需求明确要求一个 plan JSON，且按整份计划读写，拆表会增加排序、级联与查询复杂度。
- 备选：`total_days` 由 `days` 派生 → 否决。未排期天也为合法行程，总天数是独立产品字段。

### D2 Plan JSON：API 对象、DB TEXT、服务端规范化

- HTTP 请求/响应中的字段名为 `plan`，类型是 JSON 对象，不暴露数据库字符串。
- 数据库列 `plan_json` 保存规范化后的 JSON 字符串；服务端用 Jackson 解析、校验、去重后重新序列化。
- v1 记录结构：

```java
record TripPlan(int version, List<TripDay> days, List<TripStopRef> unscheduled) {}
record TripDay(int day, List<TripStop> stops) {}
record TripStop(String poiId, String toNext) {}
record TripStopRef(String poiId) {}
```

- `toNext` 在记录中保存为字符串，校验时只接受 `walk` / `drive` / `transit`；这样 API 与 DB 都保持契约中的小写值，不依赖枚举序列化策略。
- 缺省规则：创建时不传 `plan` → 空计划；`days` / `stops` / `unscheduled` 省略或为 `null` → 按空数组处理；`toNext` 省略或为 `null` → 无交通方式。
- 规范化规则（在持久化前执行）：
  1. `days` 与 `stops` 保持提交顺序；
  2. `unscheduled` 按 `poiId` 去重，保留首次出现顺序；
  3. 同时出现在 `days` 与 `unscheduled` 的 `poiId` 从 `unscheduled` 移除（已排期优先）；
  4. `days` 中重复的 `poiId` 原样保留。
- 备选：直接保存请求原文 → 否决。无法保证去重、默认值与后续读取的稳定性。
- 备选：把 `plan` 声明为强类型 `TripPlan` 直接交给 Spring 反序列化 → 否决。`plan` 内部形状错误会落到通用的消息转换异常，难以稳定映射为 `VALIDATION_ERROR`。请求 DTO 用 `JsonNode plan`，由 `TripPlanValidator` 显式校验。

### D3 校验：边界集中在 `TripService`

创建与更新共用同一套校验：

- `name`：trim 后非空，保存 trim 后的值。
- `totalDays`：必填整数且 `>= 1`；必须 `>=` 计划中出现过的最大 `day`。
- `cityAdcode`：存在于 `administrative_region` 且 `level='city'`。
- `petId`：`PetRepository.findByIdAndUserId` 命中当前用户。
- `version`：必须为 `1`。
- `day`：整数、唯一、位于 `1..totalDays`。
- `poiId`：非空字符串；所有去重后的 `poiId` 用 `PawtripLocationRepository.findAllByPoiIdIn` 一次校验存在，缺失即失败。只校验存在，不校验城市归属。
- `toNext`：存在时必须是三个枚举值之一；不做“下一天是否存在”的引用校验。
- 所有校验失败统一抛 `ApiException(ApiErrorCode.VALIDATION_ERROR, ...)`，避免在控制器里散落分支。

更新语义为整量替换：`PUT` 必须提供 `name`、`totalDays`、`plan`，校验针对提交后的计划执行。`cityAdcode`、`petId` 不进入更新 DTO；即使请求体携带同名字段，也不参与更新。

- 备选：PATCH 局部更新 → 否决。项目现有写接口统一使用 PUT，且整量替换让 `totalDays` 校验更直接。

### D4 API 与 DTO

新增 `com.pawtrip.server.trip` 模块：

- `Trip`：JPA 实体，映射上述列；构造时写入 `createdAt` / `updatedAt`（`Instant.now().toString()`），更新时刷新 `updatedAt`。
- `TripRepository`：`findAllByUserIdOrderByIdAsc(Long)`、`findByIdAndUserId(Long, Long)`。
- `TripRequests`：`SaveTrip(String name, String cityAdcode, Long petId, Integer totalDays, JsonNode plan)`，创建与更新共用；更新时忽略 `cityAdcode` / `petId`。
- `TripResponses`：`TripSummary`（`id`、`name`、`cityAdcode`、`petId`、`totalDays`、`createdAt`、`updatedAt`）与 `TripDetail`（摘要字段 + `plan`）。
- `TripController`：`/api/trips` 的 `GET`、`POST` 与 `/api/trips/{id}` 的 `GET`、`PUT`、`DELETE`；控制器只依赖 `TripService`。
- `TripService`：解析 `userId`、所有权校验、校验并规范化 plan、映射响应。
- `TripPlanValidator`：把 `JsonNode` 解析为 `TripPlan` 并执行 D2/D3 的结构校验；规范化可在同一处完成。

响应字段使用 camelCase；时间使用 ISO-8601 字符串。列表返回摘要，不返回 `plan`，避免列表携带大 JSON；详情与创建/更新响应返回完整计划。

- 备选：列表也返回 `plan` → 否决。MVP 无此需要，且会让列表负载随计划增长。
- 备选：响应附带 `cityName` / `petName` → 暂不加入；前端可按 id 复用现有城市/宠物查询，后续确有需要再扩读模型。

### D5 所有权与错误码

- 所有接口从 `Authentication.getName()` 取用户名，再经 `AppUserRepository` 解析 `userId`；不读取请求体中的用户字段。
- `findByIdAndUserId` 未命中统一抛 `TRIP_NOT_FOUND`，与宠物模块一致，避免向非本人暴露资源是否存在。
- 新增错误码：
  - `TRIP_NOT_FOUND(HttpStatus.NOT_FOUND, "Trip not found")`
  - `PET_IN_USE(HttpStatus.CONFLICT, "Pet is referenced by a trip")`
- 未登录仍由 Spring Security 返回 `401 UNAUTHENTICATED`，无需改安全配置。

### D6 宠物删除：RESTRICT + 显式冲突

- `V17` 的 `pet_id` 外键使用 `ON DELETE RESTRICT`。
- `PetService.delete` 调整为：删除后在当前事务内 `flush()`，捕获 `DataIntegrityViolationException` 并抛 `ApiException(ApiErrorCode.PET_IN_USE, ...)`；否则约束可能在方法返回后才由事务提交抛出，无法映射为 409。
- 未被任何 trip 引用的宠物保持原有 `204` 行为。
- 备选：`SET NULL` + 可空 `pet_id` → 否决，违背“trip 必有单只不可变宠物”；`CASCADE` → 否决，会连带删除行程。

### D7 测试与验证

- `TripSchemaMigrationTest`：验证 `trip` 列、默认 `plan_json`、`total_days >= 1`、`pet_id` RESTRICT、`user_id` CASCADE 与索引。
- `TripPlanValidatorTest`：空计划、缺省数组、重复 `poiId` 保留、`unscheduled` 去重、已排期优先、`toNext` 枚举、`day` 重复/越界、`version` 非 1、`totalDays` 小于最大 `day`。
- `TripApiTest`：`201 + Location`、列表隔离与排序、详情含 `plan`、更新可编辑字段、城市/宠物不可变、非法城市/宠物/`poiId`、总天数收缩 400、删除 204 后 404、未登录 401、他人资源 404。
- `PetApiTest` 或新增用例：被 trip 引用的宠物删除返回 `409 PET_IN_USE` 且宠物仍存在；未引用宠物仍可删除。
- 测试数据库沿用现有 `@SpringBootTest` + `MockMvc` + 独立 SQLite 模式；通过仓库/测试 helper 造行政区、宠物与 `pawtrip_location` 夹具。
- 本次无前端改动，不新增 Playwright 用例；后端全量 `./mvnw test` 作为回归门槛。

### D8 迁移与文档

- 仅新增 `V17__create_trip.sql`，无数据回填、无既有列修改。
- 同步更新 `docs/knowledge/architecture/README.md`：trip 模块、plan JSON v1、错误码与宠物删除约束。
- 归档前复核 `V17` 未被其他在途变更占用。

## Risks / Trade-offs

- **JSON 契约漂移** → 用 `TripPlanValidatorTest` 固定结构、默认值与规范化行为；`version` 字段为后续演进留出入口。
- **宠物删除行为变化** → `/paws` 现有删除路径可能把 409 当作通用失败展示；本次前端不在范围，需在后续前端接入时补文案，后端先保证语义稳定。
- **列表加载 `plan_json`** → 当前列表映射不返回计划，但 JPA 仍会读取列；数据量增长后可改用投影查询，MVP 不提前优化。
- **并发编辑覆盖** → 整量 PUT 为后写覆盖，不做乐观锁；与现有宠物更新一致，作为已知限制。
- **`poiId` 不校验城市归属** → 服务端允许跨城市地点进入计划；按需求方口径接受，前端与后续校验可再收紧。
- **`toNext` 悬空** → 最后一天或下一天为空时交通方式无展示语义；按需求方口径保留而不报错，渲染方负责忽略。
- **地点被删除后的引用** → 当前没有地点删除接口；若未来增加，需要先决定行程内引用是保留悬空、快照还是阻止删除。

## Migration Plan

1. 新增 `V17__create_trip.sql`；应用启动时 Flyway 按序执行。
2. 部署顺序无特殊要求：新表为增量，现有宠物、地点、认证行为不受影响。
3. 回滚：回退应用代码并删除 `trip` 表；开发/测试库可直接重建，生产化前需补正式回滚脚本。
4. 验证：先跑迁移测试，再跑 `TripApiTest` 与宠物删除冲突用例，最后跑后端全量测试。

## Open Questions

- 无阻塞项。后续可另行决定：是否校验 `poiId` 属于 trip 城市、列表是否返回城市/宠物名称、前端如何消费 409 `PET_IN_USE`、plan JSON 版本升级策略。
