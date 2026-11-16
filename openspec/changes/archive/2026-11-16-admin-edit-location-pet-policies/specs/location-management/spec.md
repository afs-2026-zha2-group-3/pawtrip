# Spec Delta

## ADDED Requirements

### Requirement: 管理员编辑地点宠物政策
系统 SHALL 在管理员地点管理的“保存地点”和“pawtrip地点”两个现有弹窗中提供 6 项宠物政策的编辑能力，并 SHALL 适用于所有地点类型。表单 MUST 包含每位游客最多携带宠物数、单只宠物最大体重、牵引绳要求、疫苗证明要求、额外费用与预约要求。空输入 MUST 保存为 `NULL`；数值 `0` MUST 表示明确的零值；布尔字段 MUST 区分 `NULL`、`true`、`false`。额外费用 MUST 按人民币元输入且最多两位小数，保存为分；单只体重 MUST 最多两位小数；所有数值 MUST 非负。编辑弹窗 MUST 回填已保存值，并 MUST 允许把已配置字段清回未配置。修改地点政策 MUST NOT 修改行政区政策，也 MUST NOT 从行政区政策推导地点值。

#### Scenario: 新建地点填写政策
- **WHEN** 管理员在“保存地点”弹窗为未保存 POI 填写政策并保存
- **THEN** 地点保存成功
- **AND** 再次读取该地点时返回相同的 6 项政策值

#### Scenario: 编辑已保存地点并回填
- **WHEN** 管理员打开已有政策值的地点编辑弹窗
- **THEN** 6 项字段显示已保存值
- **WHEN** 管理员修改并保存
- **THEN** 再次打开弹窗显示修改后的值

#### Scenario: 清回未配置
- **WHEN** 管理员清空某项已配置政策并保存
- **THEN** 该字段保存为 `NULL`
- **AND** 重新打开弹窗时该字段为空

#### Scenario: 三态布尔
- **WHEN** 管理员为牵引绳、疫苗证明或预约要求选择“未配置 / 需要 / 不需要”
- **THEN** 分别保存为 `NULL` / `true` / `false`
- **AND** 重新打开弹窗时选中对应选项

#### Scenario: 非法数值被拒绝
- **WHEN** 管理员填写负数、非整数数量、或超过两位小数的体重/费用
- **THEN** 界面显示可读错误且不发起保存请求
- **AND** 直接向管理 API 提交非法值时返回 400，且不产生部分写入

#### Scenario: 所有地点类型可编辑
- **WHEN** 管理员编辑非景点类型的地点
- **THEN** 政策编辑区与保存操作仍然显示
- **AND** 游玩时间字段不显示

#### Scenario: 费用单位换算
- **WHEN** 管理员在额外费用输入框填写 `10.5` 元
- **THEN** 请求与持久化值为 `1050` 分
- **AND** 重新打开弹窗时显示 `10.5`

#### Scenario: 行政区政策不受影响
- **WHEN** 管理员保存某地点的政策
- **THEN** 该地点所属行政区的政策字段保持不变
- **AND** 地点未配置字段不从行政区政策推导

### Requirement: 管理 API 暴露地点宠物政策
管理 API SHALL 通过可选的 `petPolicies` 对象接收 6 个可空政策字段，并 SHALL 在地点详情响应的 `petPolicies` 对象中返回这些字段。创建地点时缺省 `petPolicies` MUST 将 6 项保存为 `NULL`。更新地点时缺省 `petPolicies` MUST 保持政策不变；携带 `petPolicies` 时 MUST 以对象内容整体替换 6 项，字段 `null` MUST 清空对应政策。地点列表响应 MUST 保持不变。非法数值 MUST 返回现有 400 错误，且 MUST NOT 产生部分写入。

#### Scenario: 创建时保存政策
- **WHEN** 创建请求包含 `petPolicies` 及 6 个字段
- **THEN** 地点保存后详情返回相同政策值

#### Scenario: 更新缺省不改
- **WHEN** 地点已有政策值且更新请求不包含 `petPolicies`
- **THEN** 6 项政策保持原值

#### Scenario: 更新整体替换与清空
- **WHEN** 更新请求包含 `petPolicies`
- **THEN** 6 项政策以请求内容整体替换
- **AND** 请求中为 `null` 的字段保存为未配置

#### Scenario: 详情返回政策
- **WHEN** 管理员读取已保存地点详情
- **THEN** 响应包含 `petPolicies` 对象
- **AND** 对象内的 6 个政策字段可为 `null`

#### Scenario: 非法政策值被拒绝
- **WHEN** 创建或更新请求包含负数、非整数数量或超范围小数值
- **THEN** 返回现有 400 错误
- **AND** 地点数据不发生部分写入

#### Scenario: 列表响应不变
- **WHEN** 管理员查询“pawtrip地点”列表
- **THEN** 列表响应结构与字段保持不变
- **AND** 不新增政策列或筛选条件
