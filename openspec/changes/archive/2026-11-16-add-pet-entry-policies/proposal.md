## Why

城市与具体地点都需要记录宠物进入规则，但当前数据库没有这些政策字段，无法持久化每位游客的宠物数量限制、单只体重上限、入场要求及费用。

## What Changes

- 为行政区和 Pawtrip 地点增加六项可空规则字段：每位游客可携带的宠物数量上限、单只宠物最大体重、牵引绳要求、疫苗证明要求、额外费用、预约要求。
- 数量上限按每位游客计算；体重单位为 kg 且允许小数；额外费用为人民币、按每只宠物每次到访计收。
- 两层规则各自独立，不做继承。所有字段以 `NULL` 表示未知或尚未配置；`false` 表示明确不要求，费用 `0` 表示无额外费用。
- 本次仅更新数据库迁移及持久化模型，不扩展 API 或管理界面。

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `location-management`: 增加行政区与 Pawtrip 地点的宠物进入规则持久化要求。

## Impact

- 后端 SQLite/Flyway schema 及 `AdministrativeRegion`、`PawtripLocation` 持久化模型。
- 地点 schema 迁移测试。
- 不改变现有 API、请求/响应格式或前端管理界面。
