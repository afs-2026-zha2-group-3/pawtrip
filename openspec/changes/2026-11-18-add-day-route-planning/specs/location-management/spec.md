# Spec Delta

## Purpose

为用户端地点详情补充绘制路线所需的经纬度字段。坐标来自已保存地点记录，只读下发，不调用上游服务。

## ADDED Requirements

### Requirement: 用户端地点详情坐标字段

`GET /api/locations/{poiId}` SHALL 在既有详情字段基础上返回可空 `longitude` 与 `latitude`（十进制度）。两者 MUST 直接读取已保存地点记录中的坐标；任一项缺失时 MUST 返回 `null`。接口 MUST 只读数据库，MUST NOT 调用高德或其他上游服务，MUST NOT 下发原始 POI、`business` 或照片列表。

#### Scenario: 详情返回坐标

- **GIVEN** 某已保存地点的经纬度为 `113.5`、`22.1`
- **WHEN** 已登录用户请求 `GET /api/locations/{poiId}`
- **THEN** 详情响应的 `longitude` 为 `113.5`
- **AND** `latitude` 为 `22.1`

#### Scenario: 坐标缺失返回 null

- **GIVEN** 某已保存地点没有经纬度
- **WHEN** 已登录用户请求该地点详情
- **THEN** 详情响应中 `longitude` 与 `latitude` 均为 `null`
- **AND** 其余字段与响应结构不受影响

#### Scenario: 坐标只读数据库

- **GIVEN** 用户请求地点详情
- **WHEN** 后端读取坐标
- **THEN** 只读取已保存地点记录
- **AND** 不调用高德 POI 或路线规划接口
