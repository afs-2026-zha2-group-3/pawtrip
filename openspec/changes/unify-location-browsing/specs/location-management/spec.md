# Spec Delta

## MODIFIED Requirements

### Requirement: 地点类型选项

系统 SHALL 通过登录后可读的共享类型选项接口向用户端与管理端提供地点类型分组及对应高德 typecode。两端 MUST 使用同一组选项；首版选项 SHALL 包含“景点” (`110000`）、“住宿” (`100000`）、“宠物医院” (`090700`）、“宠物用品店” (`061211`）和“餐厅” (`050000`）。

#### Scenario: 获取首版地点类型

- **GIVEN** 当前用户已登录
- **WHEN** 用户端或管理端请求共享地点类型选项
- **THEN** 响应包含各类型的 key、显示名称和对应 typecode
- **AND** 两端可使用相同选项筛选地点

#### Scenario: 未登录请求地点类型

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求共享地点类型选项
- **THEN** 返回 `401 UNAUTHENTICATED`

#### Scenario: 管理端使用地点类型映射

- **GIVEN** 管理员在“所有地点”表选择一个地点类型
- **WHEN** 管理端执行高德候选查询
- **THEN** 查询使用共享选项对应的高德 typecode

### Requirement: pawtrip地点列表

“pawtrip地点”表 SHALL 仅从系统数据库分页读取已保存地点，并支持城市和地点类型筛选。用户浏览页与管理页 SHALL 共用同一登录后可读的已保存地点列表接口；列表 MUST 返回两端浏览所需的地点基础字段、宠物政策和管理列表所需的游玩时间字段，MUST NOT 返回原始 POI、商业信息或照片详情。管理端可省略区域或类型条件查询全部匹配地点；用户浏览页 MUST 传入激活行程城市及当前选中类型。

#### Scenario: 查询已保存地点

- **GIVEN** 管理员在“pawtrip地点”表选择城市与地点类型
- **WHEN** 管理员请求某一页
- **THEN** 共用列表接口只从数据库返回匹配的已保存地点
- **AND** 响应包含分页信息、宠物政策和游玩时间字段

#### Scenario: 管理端无区域条件查询

- **GIVEN** 管理员未选择区域
- **WHEN** 管理员请求“pawtrip地点”列表
- **THEN** 响应包含所有符合类型条件的已保存地点

#### Scenario: 普通用户按激活行程城市查询

- **GIVEN** 用户存在激活行程且当前选中地点类型
- **WHEN** 用户端请求已保存地点列表
- **THEN** 使用与管理端相同的列表接口和响应契约
- **AND** 只请求激活行程城市及当前类型的地点

#### Scenario: 已保存地点列表不调用高德

- **GIVEN** 用户端或管理端请求已保存地点列表
- **WHEN** 后端读取列表
- **THEN** 后端仅从数据库返回结果
- **AND** 不调用高德 POI API

#### Scenario: 普通用户列表不包含管理编辑详情

- **GIVEN** 普通用户请求共享已保存地点列表
- **WHEN** 响应返回地点条目
- **THEN** 条目不包含原始 POI、`business` 或照片详情
- **AND** 条目包含可用于地点浏览与政策匹配的字段

### Requirement: 管理 API 暴露地点宠物政策

管理写入 API SHALL 通过可选的 `petPolicies` 对象接收 8 个可空政策字段，并 SHALL 在地点详情响应中返回这些字段。创建地点时缺省 `petPolicies` MUST 将字段保存为 `NULL`。更新地点时缺省 `petPolicies` MUST 保持政策不变；携带 `petPolicies` 时 MUST 以对象内容整体替换，字段 `null` MUST 清空对应政策。共用已保存地点列表 SHALL 返回每项地点的完整 `petPolicies`，且不得返回原始 POI 或照片详情。非法数值 MUST 返回现有 400 错误，且 MUST NOT 产生部分写入。

#### Scenario: 创建时保存政策

- **WHEN** 创建请求包含 `petPolicies` 及政策字段
- **THEN** 地点保存后详情返回相同政策值

#### Scenario: 更新缺省不改

- **WHEN** 地点已有政策值且更新请求不包含 `petPolicies`
- **THEN** 政策保持原值

#### Scenario: 更新整体替换与清空

- **WHEN** 更新请求包含 `petPolicies`
- **THEN** 政策以请求内容整体替换
- **AND** 请求中为 `null` 的字段保存为未配置

#### Scenario: 详情返回政策

- **WHEN** 管理员读取已保存地点详情
- **THEN** 响应包含 `petPolicies` 对象
- **AND** 对象内字段可为 `null`

#### Scenario: 非法政策值被拒绝

- **WHEN** 创建或更新请求包含非法政策值
- **THEN** 返回现有 400 错误
- **AND** 地点数据不发生部分写入

#### Scenario: 列表响应不变

- **WHEN** 用户端或管理端查询已保存地点列表
- **THEN** 管理列表已有字段保持不变，且共用响应增加完整 `petPolicies`
- **AND** 管理端列表不增加政策列或筛选条件，响应不包含原始 POI、`business` 或照片详情
