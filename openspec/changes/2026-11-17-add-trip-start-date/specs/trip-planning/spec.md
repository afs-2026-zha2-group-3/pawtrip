# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
