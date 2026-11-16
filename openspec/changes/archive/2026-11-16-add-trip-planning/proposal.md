# Proposal

## Why

PawTrip 已有目的地选择、宠物档案与城市内景点数据，但“行程”只存在于浏览器会话：已选目的地存于 `sessionStorage`（`pawtrip.selectedDestination`），已选交通方式存于 `pawtrip:selected-transport-mode`，刷新或关闭标签页后无法保留，也无法承载“多天、多个地点、地点间交通”的结构化规划。US-48（查看行程单）需要服务端持久化的行程记录作为载体，因此先交付后端 trip 模型与 CRUD 契约。

## What Changes

- 新增 Flyway `V17__create_trip.sql`：`trip` 表保存 `user_id`、`name`、`city_adcode`、`pet_id`、`total_days`、`plan_json`、创建/更新时间，并建立 `(user_id, id)` 索引。
- `city_adcode` 必须引用城市级 `administrative_region`；`pet_id` 必须引用当前用户宠物；两者创建后不可修改。
- `plan_json` 采用 v1 契约：`{version, days:[{day, stops:[{poiId, toNext?}]}], unscheduled:[{poiId}]}`。`toNext` 仅接受 `walk` / `drive` / `transit`，所有交通方式均可留空；`days`、`stops`、`unscheduled` 均可为空，空计划合法并作为新建 trip 的默认值。
- 新增 `/api/trips` 与 `/api/trips/{id}` CRUD：列表、详情、创建、更新、删除；仅当前用户可访问本人 trip。
- 创建/更新校验：城市存在且 `level='city'`；宠物存在且属于当前用户；`poiId` 存在于 `pawtrip_location`；`day` 唯一且位于 `1..total_days`；`unscheduled` 按 `poiId` 去重且不与已排期地点重叠；`total_days` 调小到低于计划中的最大 `day` 时返回 `400 VALIDATION_ERROR`。
- 宠物删除增加行程引用保护：`pet_id` 外键使用 `ON DELETE RESTRICT`，删除被 trip 引用的宠物返回 `409 PET_IN_USE`。
- 名称、`total_days`、`plan_json` 可更新；`city_adcode`、`pet_id` 不进入更新请求。
- 本次只交付后端迁移、实体/仓库/服务/控制器与测试，不新增前端页面。

## Non-Goals

- 不做前端行程规划页、拖拽排序、地图展示或行程单导出。
- 不做地点间交通耗时、到达/离开时刻、日期与时区；`toNext` 只保存交通方式。
- 不做跨城市行程；每个 trip 固定一个城市。
- 不校验 `poiId` 是否属于 trip 城市，只校验其存在于 `pawtrip_location`。
- 不做行程分享、协作、模板、推荐或自动排程。
- 不把浏览器 `sessionStorage` 中的已选目的地/交通方式迁移或自动写入 trip；前端接入另行处理。
- 不修改 `pawtrip_location`、`administrative_region`、`pet` 的既有字段与读取契约（宠物删除新增冲突保护除外）。

## Capabilities

### New Capabilities

- `trip-planning`: 服务端 trip 的持久化、plan JSON v1 契约、本人 trip CRUD、城市/宠物不可变约束与校验。

### Modified Capabilities

- 无。`backend-data-access` 的 JPA/Flyway 约定不变；宠物删除的冲突保护作为 `trip-planning` 的新要求记录。

## Impact

- 后端：新增 `com.pawtrip.server.trip` 模块（实体、仓库、服务、控制器、请求/响应 DTO、plan JSON 校验）；新增 V17 迁移；`PetService.delete` 需捕获外键冲突并返回 `409 PET_IN_USE`。
- 数据库：新增 `trip` 表与外键；`pet` 删除语义由无条件硬删除变为受行程引用保护。
- API：新增 `/api/trips` 与 `/api/trips/{id}`；均需登录并按当前用户隔离。
- 测试：迁移 schema 测试、plan JSON 校验单测、Trip API 测试（权限、不可变字段、`total_days` 收缩、`poiId` 校验、宠物删除冲突）。
- 前端：本次不改动；后续行程页可复用该 API。
- 文档：更新 `docs/knowledge/architecture/README.md` 的 trip 模块与 plan JSON 契约。
- 规模预估：S–M；单表 + JSON 校验，无前端、无外部服务。
- 风险：① 宠物删除从无条件成功变为可能返回 `409`，需回归 `/paws` 删除路径；② JSON 校验边界较多，需用测试固定契约；③ 归档前需确认 V17 未被其他在途迁移占用。
