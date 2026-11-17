# Spec Delta

## Purpose

为已登录用户提供激活行程内相邻景点间的途内交通估算：服务端代理高德路线规划 2.0，返回打车参考费用区间与预计时长、步行预计时长与零费用，供行程面板按天视图展示；驾车时长亦用于大交通自驾时的「驾车」展示（前端仅取时长、忽略费用，接口契约不变，见 `trip-context`「大交通自驾联动」）；估算接口本身无状态、不写库，估算快照由前端随行程更新接口持久化（见 `trip-context` / `trip-planning` delta）。

## ADDED Requirements

### Requirement: 途内交通估算查询与访问控制

系统 SHALL 提供 `GET /api/trips/{tripId}/route-estimate?fromPoiId&toPoiId&mode` 估算接口，`mode` 合法值 MUST 为 `walk` 或 `drive`。接口 MUST 要求登录，且 `tripId` MUST 属于当前用户，否则分别返回 `401 UNAUTHENTICATED` 与 `404 TRIP_NOT_FOUND`。缺少 `fromPoiId`/`toPoiId`/`mode`、`mode` 非法或任一 `poiId` 不存在时 MUST 返回 `400 VALIDATION_ERROR`。成功响应 MUST 包含 `mode`、`durationMinutes`（整数分钟）、`costLowYuan`、`costHighYuan`（元）。

#### Scenario: 打车估算成功

- **GIVEN** 用户已登录且行程属于本人，两景点坐标齐全
- **WHEN** 请求 `mode=drive` 的估算
- **THEN** 返回 `200`，含 `mode=drive`、`durationMinutes` 与 `costLowYuan`/`costHighYuan` 费用区间

#### Scenario: 步行估算成功

- **GIVEN** 用户已登录且行程属于本人，两景点坐标齐全
- **WHEN** 请求 `mode=walk` 的估算
- **THEN** 返回 `200`，含 `mode=walk`、`durationMinutes`，且 `costLowYuan` 与 `costHighYuan` 均为 `0`

#### Scenario: 未登录拒绝

- **WHEN** 未登录请求估算接口
- **THEN** 返回 `401 UNAUTHENTICATED`

#### Scenario: 非本人行程拒绝

- **GIVEN** 用户已登录但 `tripId` 属于其他用户
- **WHEN** 请求估算接口
- **THEN** 返回 `404 TRIP_NOT_FOUND`

#### Scenario: 参数非法拒绝

- **WHEN** 请求缺少 `fromPoiId`/`toPoiId`/`mode` 之一，或 `mode` 不在 `{walk, drive}`，或任一 `poiId` 不存在
- **THEN** 返回 `400 VALIDATION_ERROR`

### Requirement: 估算结果换算

打车估算 SHALL 以高德驾车算路返回的 `taxi_cost`（元）为基准，按 ±20% 生成 `costLowYuan`/`costHighYuan` 参考区间；步行估算费用 MUST 固定为 `0`。`durationMinutes` SHALL 由高德返回的秒级时长换算为分钟并向上取整。估算接口本身 MUST NOT 写入 `plan_json` 或数据库；估算快照的持久化由前端随行程更新接口完成。

#### Scenario: 打车费用区间

- **GIVEN** 高德驾车算路返回 `taxi_cost` 为 `50`
- **WHEN** 服务端完成换算
- **THEN** `costLowYuan` 为 `40`、`costHighYuan` 为 `60`

#### Scenario: 时长向上取整

- **GIVEN** 高德返回时长为 `61` 秒
- **WHEN** 服务端完成换算
- **THEN** `durationMinutes` 为 `2`

#### Scenario: 估算接口不改变行程数据

- **WHEN** 任意估算请求完成（成功或失败）
- **THEN** 该行程的 `plan_json` 与数据库记录保持不变（快照写入仅发生在后续行程更新接口）

### Requirement: 高德路线规划调用与失败处理

服务端 SHALL 通过高德路线规划 2.0 驾车与步行接口算路，坐标 MUST 格式化为「经度,纬度」且小数不超过 6 位；时长 MUST 通过 `show_fields=cost` 获取。高德 Key MUST 仅存在于服务端配置；Key 缺失时应用 SHALL 可正常启动，估算调用以类型化错误失败。上游调用失败、`taxi_cost` 或时长字段缺失/非数值时 MUST 返回类型化上游错误（沿用 Problem Details 体系），MUST NOT 向客户端暴露 Key 或原始上游报文。

#### Scenario: Key 缺失

- **GIVEN** 服务端未配置高德 Key
- **WHEN** 用户请求估算
- **THEN** 应用正常运行且该请求返回类型化上游错误

#### Scenario: 上游算路失败

- **GIVEN** 高德返回非成功状态
- **WHEN** 服务端处理响应
- **THEN** 返回类型化上游错误，不含 Key 与原始上游报文

#### Scenario: 关键字段缺失或非数值

- **GIVEN** 高德驾车响应缺少 `taxi_cost`/时长或其值非数值
- **WHEN** 服务端解析响应
- **THEN** 返回类型化上游错误

#### Scenario: 坐标精度约束

- **GIVEN** 景点经纬度小数超过 6 位
- **WHEN** 服务端构造算路请求
- **THEN** 起终点坐标均被格式化为小数不超过 6 位的「经度,纬度」