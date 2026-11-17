# Spec Delta

## ADDED Requirements

### Requirement: 用户端地点封面与评分字段

共享已保存地点列表与用户端地点详情 SHALL 为每个地点包含可空的封面照片 URL（`coverPhotoUrl`）与评分（`rating`）：封面取该地点按照片顺序的第一张照片来源 URL，评分取保存地点时商业信息快照中的 `rating` 值。接口 MUST 只读数据库，MUST NOT 调用高德，MUST NOT 下发原始 POI、完整商业信息或照片列表；两个字段为标量，不改变管理端详情边界。

#### Scenario: 列表项携带封面与评分

- **GIVEN** 某已保存地点存有照片且商业信息快照含 `rating` 为 "4.6"
- **WHEN** 已登录用户请求共享已保存地点列表
- **THEN** 该列表项包含 `coverPhotoUrl`（第一张照片来源 URL）与 `rating`（"4.6"）
- **AND** 列表项不包含原始 POI、完整 `business` 或照片列表

#### Scenario: 详情携带封面与评分

- **GIVEN** 某已保存地点存有照片与评分快照
- **WHEN** 已登录用户请求 `GET /api/locations/{poiId}`
- **THEN** 详情响应包含与列表一致语义的 `coverPhotoUrl` 与 `rating`
- **AND** 既有详情字段保持不变

#### Scenario: 封面取第一张照片

- **GIVEN** 某地点保存了多张照片
- **WHEN** 用户请求列表或详情
- **THEN** `coverPhotoUrl` 为按照片顺序的第一张照片的来源 URL

#### Scenario: 媒体数据缺失返回 null

- **GIVEN** 某地点没有照片且商业信息快照无 `rating`
- **WHEN** 用户请求列表或详情
- **THEN** `coverPhotoUrl` 与 `rating` 均为 `null`
- **AND** 其余字段与响应结构不受影响

#### Scenario: 媒体字段只读数据库

- **GIVEN** 用户端请求含媒体字段的列表或详情
- **WHEN** 后端读取封面与评分
- **THEN** 仅从数据库已保存的照片与商业信息快照读取
- **AND** 不调用高德 POI API，不请求照片 URL