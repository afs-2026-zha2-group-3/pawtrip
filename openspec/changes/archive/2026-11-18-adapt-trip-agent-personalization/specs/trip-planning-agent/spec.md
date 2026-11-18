# Spec Delta

## Purpose

在既有行程规划 Agent 能力上，补充对 Pawtrip 个性化资料（宠物喜好/性格、城市特征标签）与扩展地点推荐字段（标签、今日营业时间、电话）的只读消费要求。

## ADDED Requirements

### Requirement: Agent personalizes recommendations from pet profile and city features

Agent SHALL 将当前规划所绑定宠物的喜好（`preferences`，0..n）与性格（`personality`，可空），以及规划城市的只读特征标签（`featureTags`），纳入规划上下文。上述数据 SHALL 只影响推荐排序与选点倾向，MUST NOT 改变、替代或推断确定性宠物政策结论，也 MUST NOT 用于补造工具未返回的数据。数据缺失时（旧宠物档案无喜好/性格、城市无特征标签），Agent MUST 按“未设置”处理。Agent MUST NOT 尝试修改宠物喜好、性格或城市特征标签。

#### Scenario: Personalized signals inform recommendations

- **GIVEN** 当前规划宠物设置了喜好与性格，且规划城市带有特征标签
- **WHEN** Agent 向用户推荐地点或城市相关安排
- **THEN** Agent 可使用这些信息解释推荐倾向
- **AND** 宠物友好结论仍引用确定性 `policy` 结果

#### Scenario: Profile signals are unset

- **GIVEN** 宠物档案的喜好为空、性格为空，或城市特征标签为空
- **WHEN** Agent 生成推荐
- **THEN** Agent 按未设置处理
- **AND** 不声称该宠物具有任何喜好或性格
- **AND** 不补造城市特征标签

#### Scenario: Preferences do not override pet policy

- **GIVEN** 地点或城市命中了宠物的喜好特征，但确定性政策结论为不友好
- **WHEN** Agent 说明该地点或城市是否适合该宠物
- **THEN** Agent 的结论与政策匹配结果一致
- **AND** 不以喜好或性格为由改写政策结论

#### Scenario: Personalization data is read-only

- **GIVEN** 用户在对话中要求修改宠物喜好、性格或城市特征标签
- **WHEN** Agent 处理该请求
- **THEN** Agent 拒绝执行并说明这些数据只能在对应页面维护或为只读
- **AND** 不调用任何写入接口

### Requirement: Agent location lookup matches Pawtrip tags

Agent 的地点查找本地匹配 SHALL 覆盖地点名称、地址与自然语言标签（`keytag`），与地点浏览页搜索口径一致；候选结果 SHALL 在可用时包含标签与评分。匹配范围 MUST 仍限定于当前规划城市的 Pawtrip 已收录地点。缺失的标签或评分 MUST NOT 被补造。

#### Scenario: Tag-based lookup finds saved locations

- **GIVEN** 当前城市规划城市的已收录地点带有自然语言标签
- **WHEN** 用户使用标签关键词查找地点（如“海滨浴场”）
- **THEN** Agent 返回标签命中的真实 Pawtrip 地点
- **AND** 候选包含可用的标签与评分

#### Scenario: Multiple tag matches require disambiguation

- **GIVEN** 标签匹配返回多个已收录地点
- **WHEN** Agent 准备引用其中某个地点
- **THEN** Agent 展示候选并请求用户消歧
- **AND** 不自行选择并应用地点

#### Scenario: Tag is unavailable

- **GIVEN** 候选地点没有标签或评分
- **WHEN** Agent 展示候选或推荐该地点
- **THEN** Agent 省略缺失字段
- **AND** 不猜测或补造标签与评分

### Requirement: Agent exposes extended location contact and hours

Agent 的地点详情工具 SHALL 返回可用时的今日营业时间（`openTime`）与电话（`tel`）。今日营业时间 MUST 与每周营业时间（`openingHours`）区分呈现，MUST NOT 将今日时间表述为每周时间。工具输出 MUST 继续隐藏 `typeCode`、`typeGroup`、`regionCode` 等无自然语义的代码，MUST NOT 包含原始 `petPolicies` 或原始 POI JSON；缺失字段 MUST NOT 被补造。

#### Scenario: Today and weekly hours are distinguished

- **GIVEN** 地点详情同时返回每周营业时间与今日营业时间
- **WHEN** Agent 向用户介绍该地点
- **THEN** Agent 分别表述每周营业时间与今日营业时间
- **AND** 不将两者混用或互相替代

#### Scenario: Contact or today hours are missing

- **GIVEN** 地点详情缺少电话或今日营业时间
- **WHEN** Agent 推荐该地点
- **THEN** Agent 省略缺失字段
- **AND** 不猜测或补造电话与营业时间

#### Scenario: Extended output still hides raw codes

- **GIVEN** Agent 读取某个已收录地点的详情
- **WHEN** 工具返回结果
- **THEN** 结果不包含 `typeCode`、`typeGroup`、`regionCode`
- **AND** 结果不包含原始 `petPolicies` 与原始 POI JSON
