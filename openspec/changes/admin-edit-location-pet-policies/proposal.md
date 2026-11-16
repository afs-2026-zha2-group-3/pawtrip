# Proposal

## Why

`pawtrip_location` 已在 V7 中拥有 6 个宠物政策列，实体也已映射并提供更新方法，但管理 API 与两个地点弹窗尚未暴露这些字段，管理员无法录入或修正真实政策。补齐现有管理入口后，地点数据才能支撑后续“宠物友好景点/行程内展示”等用户故事。

## What Changes

- 管理 API 的创建与更新请求增加可选 `petPolicies` 对象，包含 6 个可空政策字段；详情响应返回这 6 个字段。
- “保存地点”（高德未保存 POI）弹窗增加政策编辑区，创建地点时一并保存。
- “pawtrip地点”编辑弹窗增加政策编辑区，读取详情回填并保存修改；表单改为始终渲染，游玩时间仍只对景点显示。
- 政策适用于所有地点类型；布尔字段使用“未配置 / 需要 / 不需要”三态。
- 费用在表单按人民币元输入（最多两位小数），提交与存储使用分；体重最多两位小数；所有数值非负。
- `PATCH` 未携带 `petPolicies` 时政策不变；携带时 6 项整体替换，字段 `null` 表示清空。
- 不新增数据库迁移，不改行政区政策、公共展示、行程展示或地点列表列与筛选。

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `location-management`: 增加管理员维护地点宠物政策的编辑能力与管理 API 契约，包括三态布尔、空值语义、费用单位换算与校验。

## Impact

- 后端：`com.pawtrip.server.location` 的请求/响应 DTO、应用服务、写入服务与控制器；复用 `PawtripLocation` 已有字段与 `updatePetPolicies`。
- 前端：管理员地点页面的两个现有弹窗与 `admin-locations` 查询/类型层。
- 测试：管理端 API 测试、仓库往返测试与 Playwright 地点管理 e2e。
- 不涉及：SQLite schema/Flyway、认证与角色、公共 API、行政区数据、部署拓扑。
