# Spec Delta

## ADDED Requirements

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
