# trip-planning Specification

## Purpose

定义服务端行程（trip）的持久化与访问行为：已登录用户可创建多个 trip，每个 trip 固定一个城市与一只宠物；trip 保存名称、总游玩天数与 plan JSON；plan JSON 承载每日有序地点、地点间城市内交通方式与未排序地点池。本能力只定义后端 API 与数据契约，不定义前端页面、排程算法或交通耗时。

## Requirements

### Requirement: 行程持久化与归属

系统 SHALL 为已登录用户持久化 trip，一个用户 MAY 拥有多个 trip；每个 trip MUST 保存 `id`、`user_id`、`name`、`city_adcode`、`pet_id`、`total_days`、`plan_json`、`created_at`、`updated_at`。所有 `/api/trips` 接口 MUST 要求登录，并 MUST 只允许当前用户访问本人 trip；非本人 trip 一律视为不存在。

#### Scenario: 创建多个行程

- **GIVEN** 已登录用户
- **WHEN** 该用户连续创建两个名称不同的 trip
- **THEN** 两次创建均返回 `201`
- **AND** 列表接口返回两条属于该用户的 trip

#### Scenario: 未登录访问

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求任一 `/api/trips` 接口
- **THEN** 返回 `401` 与 Problem Details `code=UNAUTHENTICATED`

#### Scenario: 访问他人行程

- **GIVEN** 用户 A 创建了一个 trip
- **WHEN** 用户 B 请求该 trip 的详情、更新或删除
- **THEN** 返回 `404` 与 `code=TRIP_NOT_FOUND`
- **AND** trip 数据保持不变

### Requirement: 城市与宠物绑定

创建 trip 时 SHALL 要求提供 `cityAdcode` 与 `petId`；`cityAdcode` MUST 存在于 `administrative_region` 且 `level='city'`；`petId` MUST 存在且属于当前用户。`city_adcode` 与 `pet_id` MUST NOT 在创建后更改。名称 MUST 去除首尾空白后非空；`totalDays` MUST 为大于等于 1 的整数。

#### Scenario: 城市必须为城市级

- **GIVEN** 已登录用户
- **WHEN** 创建 trip 时提交不存在或 `level='province'` 的 `cityAdcode`
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`
- **AND** 不创建 trip

#### Scenario: 宠物必须属于当前用户

- **GIVEN** 用户 A 已登录
- **WHEN** 用户 A 使用用户 B 的 `petId` 创建 trip
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`
- **AND** 不创建 trip

#### Scenario: 更新不可更改城市与宠物

- **GIVEN** 已存在一个 trip
- **WHEN** 更新请求携带不同的 `cityAdcode` 或 `petId`（或两者）
- **THEN** 响应中的城市与宠物仍为创建时的值
- **AND** 数据库中的 `city_adcode` 与 `pet_id` 不变

#### Scenario: 名称为空白

- **GIVEN** 已登录用户
- **WHEN** 创建或更新 trip 时 `name` 为空白
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`

### Requirement: Plan JSON v1 结构

API SHALL 以 JSON 对象承载计划，结构为 `{version, days, unscheduled}`：

- `version` MUST 为 `1`；
- `days` MUST 为数组，元素为 `{day, stops}`；`day` MUST 为整数，`stops` MUST 为数组；
- `stops` 元素为 `{poiId, toNext?, toNextEstimate?}`，数组顺序即当日游玩顺序，MUST NOT 依赖额外顺序字段；
- `toNext` MAY 省略或为 `null`；有值 MUST 为 `walk`、`drive`、`transit` 或 `self_drive`（`self_drive`=驾车，本次新增枚举值，与 `drive`=打车区分）；
- `toNextEstimate` MAY 省略或为 `null`；有值 MUST 为对象 `{durationMinutes, costLowYuan, costHighYuan}`，三字段 MUST 齐全且为数值：`durationMinutes` MUST 为 ≥0 的整数，`costLowYuan`/`costHighYuan` MUST ≥0 且 `costLowYuan` MUST ≤ `costHighYuan`；非法值 MUST 返回 `400 VALIDATION_ERROR`；
- `unscheduled` MUST 为数组，元素为 `{poiId}`。

`toNextEstimate` 为本次增量扩展的可选估算快照字段（交通方式对应的预计时长与参考费用区间；步行与驾车快照费用为 0/0，驾车费用仅存不展示），`self_drive` 为本次增量新增的 `toNext` 枚举值，`version` 保持 `1`；不含该字段/枚举值的存量计划 MUST 继续合法，服务端 SHALL 原样保留合法快照（解析与序列化 MUST NOT 丢弃该字段）。`days`、`stops`、`unscheduled` MAY 为空；整个计划为空 MUST 合法，并作为新建 trip 未提供计划时的默认值。同一 `poiId` MAY 在 `days` 中重复出现。`unscheduled` MUST 按 `poiId` 去重；服务端 SHALL 将同时出现在 `days` 与 `unscheduled` 的 `poiId` 从 `unscheduled` 中移除。

#### Scenario: 空计划合法

- **GIVEN** 已登录用户
- **WHEN** 创建 trip 且不提供 `plan`
- **THEN** 创建成功
- **AND** 详情返回 `{"version":1,"days":[],"unscheduled":[]}`

#### Scenario: 重复地点允许

- **GIVEN** 已登录用户
- **WHEN** 提交的 `days` 中同一 `poiId` 出现在两个不同天
- **THEN** 请求成功
- **AND** 响应保留两处出现

#### Scenario: toNext 可省略

- **GIVEN** 已登录用户
- **WHEN** 提交的每个 stop 都不含 `toNext`
- **THEN** 请求成功
- **AND** 服务端不要求任何地点之间的交通方式

#### Scenario: 非法交通方式

- **GIVEN** 已登录用户
- **WHEN** 提交 `toNext` 为 `walk`、`drive`、`transit`、`self_drive` 之外的值
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`

#### Scenario: toNextEstimate 可省略

- **GIVEN** 已登录用户
- **WHEN** 提交的 stop 含 `toNext` 但不含 `toNextEstimate`（含存量数据）
- **THEN** 请求成功
- **AND** 服务端不要求估算快照，响应中该 stop 不含伪造快照

#### Scenario: 非法估算快照拒绝

- **GIVEN** 已登录用户
- **WHEN** 提交 `toNextEstimate` 缺少任一字段、含非数值、负值、`durationMinutes` 非整数或 `costLowYuan` > `costHighYuan`
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`

#### Scenario: 估算快照往返保留

- **GIVEN** 已登录用户
- **WHEN** 更新 trip 时某 stop 携带合法 `toNext=drive` 与 `toNextEstimate {durationMinutes: 25, costLowYuan: 40, costHighYuan: 60}`
- **THEN** 请求成功
- **AND** 详情接口返回的该 stop 原样保留 `toNext` 与 `toNextEstimate` 全部字段值

#### Scenario: self_drive 枚举合法且往返保留

- **GIVEN** 已登录用户
- **WHEN** 更新 trip 时某 stop 携带 `toNext=self_drive` 与 `toNextEstimate {durationMinutes: 25, costLowYuan: 0, costHighYuan: 0}`
- **THEN** 请求成功
- **AND** 详情接口返回的该 stop 原样保留 `toNext=self_drive` 与快照全部字段值

#### Scenario: unscheduled 去重

- **GIVEN** 已登录用户
- **WHEN** `unscheduled` 中同一 `poiId` 出现多次
- **THEN** 请求成功
- **AND** 响应中该 `poiId` 只出现一次

#### Scenario: 已排期地点从池中移除

- **GIVEN** 已登录用户
- **WHEN** 同一 `poiId` 同时出现在 `days` 与 `unscheduled`
- **THEN** 请求成功
- **AND** 响应中该 `poiId` 只保留在 `days`，不再出现在 `unscheduled`

### Requirement: Plan JSON 引用与天数校验

`plan` 中的每个 `poiId` MUST 存在于 `pawtrip_location`；不存在的 `poiId` MUST 使请求返回 `400 VALIDATION_ERROR`。`day` MUST 在 `1..totalDays` 范围内且在同一计划内唯一；`version` 缺失或不为 `1` MUST 返回 `400 VALIDATION_ERROR`。`totalDays` MUST 大于等于 `1`，且 MUST 大于等于计划中出现过的最大 `day`；更新时将其调小到低于该最大值 MUST 返回 `400 VALIDATION_ERROR`。

#### Scenario: poiId 不存在

- **GIVEN** 已登录用户
- **WHEN** 提交的 `days` 或 `unscheduled` 包含 `pawtrip_location` 中不存在的 `poiId`
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`
- **AND** 不创建或更新 trip

#### Scenario: day 超出范围或重复

- **GIVEN** 已登录用户提交 `totalDays=2`
- **WHEN** 计划包含 `day=3` 或同一 `day` 出现两次
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`

#### Scenario: 总天数调小被拒绝

- **GIVEN** 某 trip 的计划中最大 `day=3`
- **WHEN** 更新时提交 `totalDays=2`
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`
- **AND** 已保存的 trip 与计划不变

#### Scenario: 总天数等于最大 day 允许

- **GIVEN** 某 trip 的计划中最大 `day=3`
- **WHEN** 更新时提交 `totalDays=3`
- **THEN** 更新成功

#### Scenario: 空计划可调小至 1

- **GIVEN** 某 trip 的 `days` 为空
- **WHEN** 更新时提交 `totalDays=1`
- **THEN** 更新成功

### Requirement: Trip CRUD 接口

系统 SHALL 提供以下接口：

- `POST /api/trips`：创建 trip，成功返回 `201`、`Location: /api/trips/{id}` 与包含 `plan` 的详情；`plan` MAY 省略，省略时使用空计划；`startDate` MAY 省略或为 `null`；
- `GET /api/trips`：按 `id` 升序返回当前用户的 trip 摘要，摘要 MUST 包含 `id`、`name`、`cityAdcode`、`petId`、`totalDays`、`startDate`、`createdAt`、`updatedAt`，MUST NOT 包含 `plan`；
- `GET /api/trips/{id}`：返回本人 trip 详情，详情 MUST 包含摘要字段与 `plan`；
- `PUT /api/trips/{id}`：整量更新 `name`、`totalDays`、`plan`，三者 MUST 提供；`startDate` MAY 提供，省略或为 `null` 时保存为 `null`；返回更新后的详情；
- `DELETE /api/trips/{id}`：删除本人 trip，成功返回 `204`。

不存在的 trip MUST 返回 `404 TRIP_NOT_FOUND`；校验失败 MUST 返回 `400 VALIDATION_ERROR`。

#### Scenario: 创建返回位置

- **GIVEN** 已登录用户
- **WHEN** 创建 trip 成功
- **THEN** 返回 `201`
- **AND** `Location` 头指向 `/api/trips/{id}`

#### Scenario: 列表不返回计划

- **GIVEN** 用户有两个 trip
- **WHEN** 请求 `GET /api/trips`
- **THEN** 返回两条摘要，按 `id` 升序
- **AND** 每条摘要不含 `plan` 字段

#### Scenario: 摘要与详情包含开始日期

- **GIVEN** 用户创建了一个 `startDate=2026-12-01` 的 trip
- **WHEN** 请求 `GET /api/trips` 与 `GET /api/trips/{id}`
- **THEN** 摘要与详情均包含 `startDate=2026-12-01`

#### Scenario: 详情包含计划

- **GIVEN** 用户已创建一个带计划的 trip
- **WHEN** 请求 `GET /api/trips/{id}`
- **THEN** 返回 `200`
- **AND** 响应包含与创建时一致的 `plan`

#### Scenario: 更新可编辑字段

- **GIVEN** 已存在一个 trip
- **WHEN** 使用新的 `name`、`totalDays`、`plan` 与 `startDate` 调用 `PUT /api/trips/{id}`
- **THEN** 返回 `200`
- **AND** 详情反映新的名称、总天数、计划与开始日期

#### Scenario: 删除后不可访问

- **GIVEN** 已存在一个 trip
- **WHEN** 用户删除该 trip，随后请求其详情
- **THEN** 删除返回 `204`
- **AND** 详情返回 `404 TRIP_NOT_FOUND`

### Requirement: 宠物删除冲突保护

删除被任一 trip 引用的宠物 SHALL 失败并返回 `409 PET_IN_USE`，宠物与引用它的 trip MUST 保持存在。删除未被 trip 引用的宠物 SHALL 保持既有成功行为。

#### Scenario: 被行程引用的宠物不可删除

- **GIVEN** 一只宠物被至少一个 trip 引用
- **WHEN** 用户请求删除该宠物
- **THEN** 返回 `409` 与 `code=PET_IN_USE`
- **AND** 宠物仍可通过 `GET /api/pets/{id}` 读取

#### Scenario: 未被引用的宠物仍可删除

- **GIVEN** 一只宠物未被任何 trip 引用
- **WHEN** 用户请求删除该宠物
- **THEN** 返回 `204`

### Requirement: Trip 大交通方式持久化

每个 trip SHALL 持有可空的 `transportMode`，合法值为 `flight`、`high_speed_rail`、`train` 或 `drive`。服务端 SHALL 将其持久化在 trip 记录中，并在 trip 详情、创建与更新响应中返回；创建时未提供选择 SHALL 保存为空值。

#### Scenario: 创建时尚未选择大交通方式

- **GIVEN** 已登录用户创建 trip 且未提供 `transportMode`
- **WHEN** 服务端创建 trip
- **THEN** trip 的 `transportMode` 为空
- **AND** 创建响应包含 `transportMode: null`

#### Scenario: 保存大交通方式

- **GIVEN** 已登录用户拥有一个 trip
- **WHEN** 更新请求提交合法的 `transportMode`
- **THEN** 服务端将该值保存到该 trip
- **AND** 更新响应及后续详情响应返回相同的 `transportMode`

#### Scenario: 拒绝非法大交通方式

- **GIVEN** 已登录用户拥有一个 trip
- **WHEN** 更新请求提交不属于 `flight`、`high_speed_rail`、`train`、`drive` 的 `transportMode`
- **THEN** 服务端返回 `400 VALIDATION_ERROR`
- **AND** trip 中已保存的大交通方式保持不变

#### Scenario: 既有 trip 尚无大交通选择

- **GIVEN** 数据库在新增字段前已有 trip 记录
- **WHEN** 数据库 migration 完成且请求该 trip 详情
- **THEN** 该 trip 的 `transportMode` 为空
- **AND** 详情响应包含 `transportMode: null`

### Requirement: 开始日期持久化

trip SHALL 可选保存 `start_date`，取值 MUST 为合法的 `yyyy-MM-dd` 日历日期；创建或更新时省略或传 `null` MUST 合法。结束日期 MUST 由 `startDate` 与 `totalDays` 派生（`startDate + totalDays - 1`），MUST NOT 存储 `end_date` 字段。`startDate` 非空但格式非法或不是真实日期时，请求 MUST 返回 `400 VALIDATION_ERROR`。

#### Scenario: 创建带开始日期的行程

- **GIVEN** 已登录用户
- **WHEN** 创建 trip 时提交 `startDate=2026-12-01` 与 `totalDays=3`
- **THEN** 创建成功
- **AND** 详情返回 `startDate=2026-12-01`
- **AND** 结束日期按派生规则为 `2026-12-03`，服务端不单独存储

#### Scenario: 创建不带开始日期

- **GIVEN** 已登录用户
- **WHEN** 创建 trip 时省略 `startDate` 或传 `null`
- **THEN** 创建成功
- **AND** 详情返回 `startDate=null`

#### Scenario: 非法开始日期

- **GIVEN** 已登录用户
- **WHEN** 创建或更新 trip 时提交 `startDate=2026-02-30` 或 `2026/12/01`
- **THEN** 返回 `400 VALIDATION_ERROR`
- **AND** 不创建或更新 trip

#### Scenario: 更新开始日期

- **GIVEN** 已存在一个 `startDate=2026-12-01` 的 trip
- **WHEN** 使用 `startDate=2026-12-05` 调用 `PUT /api/trips/{id}`
- **THEN** 更新成功
- **AND** 详情返回 `startDate=2026-12-05`

#### Scenario: 整量更新省略开始日期

- **GIVEN** 已存在一个带 `startDate` 的 trip
- **WHEN** 调用 `PUT /api/trips/{id}` 时省略 `startDate`
- **THEN** 更新成功
- **AND** 该 trip 的 `startDate` 变为 `null`
