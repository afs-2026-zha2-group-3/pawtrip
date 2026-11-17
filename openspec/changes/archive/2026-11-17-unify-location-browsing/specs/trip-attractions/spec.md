# Spec Delta

## MODIFIED Requirements

### Requirement: 行程上下文下的景点列表

`/attractions` SHALL 以当前激活行程城市为唯一查询上下文，不提供城市筛选。存在激活行程时，页面 MUST 使用共享的已保存地点列表能力查询 `active.cityAdcode` 下当前选中类型的地点，默认类型 MUST 为“景点”；不存在激活行程或仅有未确认草稿时，页面 MUST 展示“先创建或激活行程”空态，MUST NOT 请求地点列表。页面 MUST NOT 展示天数 Tabs；加入天数由每张地点卡片的“添加到行程”选择器承担。

#### Scenario: 激活行程后展示该城市景点

- **GIVEN** 用户存在城市为杭州的激活行程
- **WHEN** 用户打开 `/attractions`，且地点类型默认选中“景点”
- **THEN** 列表只请求并展示杭州已保存的景点
- **AND** 不展示城市选择控件或天数 Tabs

#### Scenario: 无激活行程

- **GIVEN** 用户没有激活行程
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示“先创建或激活行程”空态
- **AND** 不发起地点列表请求

#### Scenario: 未确认草稿不可浏览

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示“先创建或激活行程”空态
- **AND** 不发起地点列表请求

#### Scenario: 天 tab 来自总天数

- **GIVEN** 激活行程 `totalDays=3`
- **WHEN** 用户浏览地点列表
- **THEN** 每张地点卡片的“添加到行程”选择器包含第 1 天、第 2 天和第 3 天
- **AND** 页面不展示天数 Tabs

### Requirement: 景点列表政策字段与逐宠物 tag

共享地点列表中的每个地点 MUST 包含完整 `petPolicies`，字段 SHALL 与地点详情一致。列表 SHALL 对所有地点类型使用相同的宠物友好筛选语义：默认仅包含 `maxPetsPerPerson >= 1` 的地点，启用“显示全部地点”后包含当前类型的全部已保存地点。地点卡片 MUST 按统一政策匹配主体逐宠物展示 tag。

#### Scenario: 列表项携带政策

- **GIVEN** 当前城市和选中类型下存在已保存地点
- **WHEN** 用户请求地点列表
- **THEN** 每个地点包含完整 `petPolicies`，包括允许宠物类型、限养数、体重、肩高、牵引、疫苗、费用与预约字段
- **AND** 响应保留地点 ID、名称、类型、地址和区域等浏览字段

#### Scenario: 默认筛选宠物友好地点

- **GIVEN** 当前选中类型的地点中存在 `maxPetsPerPerson` 为 `1`、`0` 或 `null` 的记录
- **WHEN** 用户关闭“显示全部地点”
- **THEN** 仅返回 `maxPetsPerPerson >= 1` 的地点

#### Scenario: 显示当前类型的全部地点

- **GIVEN** 当前选中类型存在限养数为 `0` 或未配置限养数的地点
- **WHEN** 用户启用“显示全部地点”
- **THEN** 列表包含当前类型的全部已保存地点
- **AND** 不包含其他地点类型

#### Scenario: 激活行程逐宠物 tag

- **GIVEN** 用户存在带宠物“旺财”的激活行程
- **WHEN** 地点列表渲染卡片
- **THEN** 每张卡片显示“旺财”的政策结论 tag
- **AND** 不显示其他宠物的 tag

#### Scenario: 无激活行程全部宠物 tag

- **GIVEN** 用户无激活行程且直接查看已保存地点详情，且有两只宠物
- **WHEN** 详情展示政策结论
- **THEN** 为每只宠物分别展示结论 tag

#### Scenario: 政策未配置

- **GIVEN** 某地点政策字段均为 null 或未配置
- **WHEN** 卡片或详情渲染该地点
- **THEN** 对应宠物 tag 显示“未配置”
- **AND** 不显示“友好”或“不友好”

### Requirement: 加入行程与未排期

所有地点类型的列表卡片与详情 SHALL 提供“添加到行程”选择器与“暂不排期”入口。选择器 MUST 覆盖 `1..active.totalDays`，用户选中某天后 MUST 立即将地点追加到对应 `day.stops` 末尾；选择暂不排期时 MUST 追加到 `unscheduled`。系统 MUST 允许同一 `poiId` 在同一天重复加入；同一 `poiId` 同时存在于 `days` 与 `unscheduled` 时 MUST 以已排期为准。未确认草稿 MUST 不展示加入入口。

#### Scenario: 加入当前天

- **GIVEN** 激活行程为 3 天，用户正在浏览住宿类型地点
- **WHEN** 用户在某住宿卡片的“添加到行程”选择器中选择第 2 天
- **THEN** 该地点追加到 `plan.days` 第 2 天的 `stops` 末尾
- **AND** 行程面板立即显示该地点
- **AND** 选择器复位为未选中态

#### Scenario: 选择器选项来自总天数

- **GIVEN** 激活行程 `totalDays=2`
- **WHEN** 用户打开任意类型地点的“添加到行程”选择器
- **THEN** 只展示“第 1 天”与“第 2 天”两个选项

#### Scenario: 暂不排期

- **GIVEN** 用户存在激活行程且正在浏览任意类型地点
- **WHEN** 用户点击“暂不排期”
- **THEN** 该地点追加到 `plan.unscheduled`
- **AND** 行程面板的“未排期”分组显示该地点

#### Scenario: 同一天重复加入

- **GIVEN** 第 1 天已包含某地点
- **WHEN** 用户再次把该地点加入第 1 天
- **THEN** 第 1 天保留两条相同 `poiId` 的记录
- **AND** 不出现去重或报错

#### Scenario: 已排期优先

- **GIVEN** 某地点同时出现在 `days` 与 `unscheduled`
- **WHEN** 计划被保存或规范化
- **THEN** 该地点只保留在 `days`
- **AND** 从 `unscheduled` 移除

#### Scenario: 未确认草稿无加入入口

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户浏览地点页
- **THEN** 页面不展示“添加到行程”或“暂不排期”

### Requirement: 景点详情政策匹配

地点详情 SHALL 对所有地点类型展示其已配置的政策字段，并按统一政策匹配主体给出逐宠物结论 tag。存在激活行程且已绑定宠物时 MUST 只针对该宠物判定；否则 MUST 针对全部宠物判定。判定 SHALL 覆盖类型、每人限养数、单只最大体重、单只最大肩高、牵引与疫苗要求；`null` 字段表示未配置，MUST 跳过对应维度。额外费用与预约要求 SHALL 继续以字段形式展示，不参与友好/不友好结论。

#### Scenario: 激活宠物命中限制

- **GIVEN** 激活行程宠物体重为 30kg，某住宿的 `maxSinglePetWeightKg=20`
- **WHEN** 用户打开该地点详情
- **THEN** 该宠物 tag 显示不友好
- **AND** 展示体重超限的具体原因

#### Scenario: 全部维度满足

- **GIVEN** 激活宠物的类型、体重、肩高均满足某地点政策，且牵引与疫苗要求已满足
- **WHEN** 用户打开该地点详情
- **THEN** 该宠物 tag 显示友好

#### Scenario: 未配置维度跳过

- **GIVEN** 某地点 `maxSinglePetWeightKg` 为 null
- **WHEN** 系统判定该宠物的匹配
- **THEN** 体重维度被跳过
- **AND** 不因体重缺失将结论判为不友好

#### Scenario: 无激活行程逐只判定

- **GIVEN** 用户没有激活行程绑定宠物且拥有多只宠物
- **WHEN** 用户查看已保存地点详情
- **THEN** 页面为每只宠物展示一个结论 tag

## ADDED Requirements

### Requirement: 地点类型筛选

地点浏览页 SHALL 使用登录后可读的共享地点类型选项，提供单选类型筛选并默认选中“景点”。类型变更 MUST 保留激活行程城市、将页码重置为第一页，并只显示所选类型的已保存地点。

#### Scenario: 默认浏览景点

- **GIVEN** 用户打开地点浏览页且存在激活行程
- **WHEN** 类型选项加载完成
- **THEN** 类型筛选默认选中“景点”
- **AND** 地点列表只显示该行程城市的景点

#### Scenario: 切换到其他地点类型

- **GIVEN** 用户当前正在查看景点列表
- **WHEN** 用户选择“宠物医院”
- **THEN** 列表只显示激活行程城市内已保存的宠物医院
- **AND** 查询仍使用激活行程城市

#### Scenario: 类型变更重置分页

- **GIVEN** 用户位于第 2 页
- **WHEN** 用户切换地点类型
- **THEN** 列表从第 1 页开始展示新类型结果
