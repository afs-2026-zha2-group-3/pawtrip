# Spec Delta

## MODIFIED Requirements

### Requirement: Plan JSON v1 结构

API SHALL 以 JSON 对象承载计划，结构为 `{version, days, unscheduled}`：

- `version` MUST 为 `1`；
- `days` MUST 为数组，元素为 `{day, stops}`；`day` MUST 为整数，`stops` MUST 为数组；
- `stops` 元素为 `{poiId, toNext?, toNextEstimate?}`，数组顺序即当日游玩顺序，MUST NOT 依赖额外顺序字段；
- `toNext` MAY 省略或为 `null`；有值 MUST 为 `walk`、`drive` 或 `transit`；
- `toNextEstimate` MAY 省略或为 `null`；有值 MUST 为对象 `{durationMinutes, costLowYuan, costHighYuan}`，三字段 MUST 齐全且为数值：`durationMinutes` MUST 为 ≥0 的整数，`costLowYuan`/`costHighYuan` MUST ≥0 且 `costLowYuan` MUST ≤ `costHighYuan`；非法值 MUST 返回 `400 VALIDATION_ERROR`；
- `unscheduled` MUST 为数组，元素为 `{poiId}`。

`toNextEstimate` 为本次增量扩展的可选估算快照字段（交通方式对应的预计时长与参考费用区间），`version` 保持 `1`；不含该字段的存量计划 MUST 继续合法，服务端 SHALL 原样保留合法快照（解析与序列化 MUST NOT 丢弃该字段）。`days`、`stops`、`unscheduled` MAY 为空；整个计划为空 MUST 合法，并作为新建 trip 未提供计划时的默认值。同一 `poiId` MAY 在 `days` 中重复出现。`unscheduled` MUST 按 `poiId` 去重；服务端 SHALL 将同时出现在 `days` 与 `unscheduled` 的 `poiId` 从 `unscheduled` 中移除。

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
- **WHEN** 提交 `toNext` 为 `walk`、`drive`、`transit` 之外的值
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