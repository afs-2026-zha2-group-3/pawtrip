# Spec Delta

## ADDED Requirements

### Requirement: 地点简介字段

`pawtrip_location` SHALL 增加可空 `description` 字段，用于用户端地点卡片、详情弹窗与地图详情卡展示简介。共享已保存地点列表与用户端地点详情 SHALL 返回可空 `description`；字段为空时前端回退展示地址。简介由地点资料维护或种子数据提供，MUST NOT 触发高德实时补拉。

#### Scenario: 列表返回简介

- **GIVEN** 某地点已配置 `description`
- **WHEN** 用户请求该城市的地点列表
- **THEN** 列表项包含 `description`
- **AND** 未配置简介的地点该字段为 `null`

#### Scenario: 详情返回简介

- **GIVEN** 某地点已配置 `description`
- **WHEN** 用户请求该地点详情
- **THEN** 详情响应包含 `description`

#### Scenario: 未配置简介

- **GIVEN** 某地点 `description` 为 `null`
- **WHEN** 前端渲染卡片、详情或地图卡
- **THEN** 简介位置展示地址
