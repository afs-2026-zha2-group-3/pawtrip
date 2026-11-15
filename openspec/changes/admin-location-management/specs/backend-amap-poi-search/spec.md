# Spec Delta

## ADDED Requirements

### Requirement: POI 搜索支持类型与行政区域
后端内部 POI 搜索 SHALL 支持只按一个或多个 `types` typecode 搜索，并可按高德支持的行政区编码限定查询范围；分页请求 SHALL 沿用高德 POI 搜索的分页限制。

#### Scenario: 按地点类型与城市筛选
- **GIVEN** 搜索请求包含一个或多个有效 typecode，以及可选的城市或省级行政区编码
- **WHEN** 后端调用高德 POI 关键词搜索接口
- **THEN** 请求通过 `types` 传递 typecode
- **AND** 有行政区筛选时通过 `region` 与严格区域限制参数限定范围
- **AND** 按请求页码与每页条数返回原始 POI 结果

#### Scenario: 不提供关键词但提供类型
- **GIVEN** 搜索请求只提供有效 typecode
- **WHEN** 后端执行高德 POI 搜索
- **THEN** 请求以 `types` 作为搜索条件
- **AND** 不要求额外关键词

### Requirement: 按 POI ID 获取扩展详情
后端内部 POI 集成 SHALL 支持按 POI ID 获取详情，并请求 `business`、`photos` 可选字段；详情结果 SHALL 保留高德返回的原始 POI JSON 结构和值。

#### Scenario: 获取地点商业与照片数据
- **GIVEN** 应用功能提供有效 POI ID
- **WHEN** 后端调用高德 POI ID 详情 API 并请求 `show_fields=business,photos`
- **THEN** 返回 POI 基础字段与高德提供的 `business`、`photos` 完整字段
- **AND** 未知或可选的嵌套字段和值不被丢弃

#### Scenario: POI 详情上游失败
- **GIVEN** 高德详情请求发生传输失败或返回业务失败
- **WHEN** 后端处理该响应
- **THEN** 调用以类型化的高德集成错误失败
- **AND** 错误与日志不暴露 API Key、完整凭据 URL 或敏感请求数据
