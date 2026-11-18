# Spec Delta

## MODIFIED Requirements

### Requirement: 景点详情政策匹配

地点详情 SHALL 对所有地点类型展示其已配置的政策字段，并按统一政策匹配主体给出逐宠物结论 tag。存在激活行程且已绑定宠物时 MUST 只针对该宠物判定；否则 MUST 针对全部宠物判定。判定 SHALL 覆盖类型、每人限养数、单只最大体重、牵引与疫苗要求；单只最大肩高仅对 DOG 生效，猫 MUST NOT 参与肩高判定。`null` 字段表示未配置，MUST 跳过对应维度。额外费用与预约要求 SHALL 继续以字段形式展示，不参与友好/不友好结论。宠物医院与宠物用品店沿用类型豁免：未配置政策时 MUST 视为友好，已配置政策时 SHALL 继续按上述维度判定。

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

#### Scenario: 猫不参与肩高判定

- **GIVEN** 某地点 `maxSinglePetShoulderHeightCm=20`，其余限制未配置
- **WHEN** 判定一只肩高 30cm 的猫
- **THEN** 该宠物 tag 显示友好

#### Scenario: 猫命中体重限制

- **GIVEN** 某地点 `maxSinglePetWeightKg=3`
- **WHEN** 判定一只体重 5kg 的猫
- **THEN** 该宠物 tag 显示不友好
- **AND** 展示体重超限的具体原因

#### Scenario: 宠物医院未配置政策视为友好

- **GIVEN** 地点类型为宠物医院且未配置任何宠物政策
- **WHEN** 判定任意宠物
- **THEN** 该宠物 tag 显示友好

#### Scenario: 已配置政策的宠物用品店仍判定

- **GIVEN** 宠物用品店配置了 `maxPetsPerPerson=0`
- **WHEN** 判定任意宠物
- **THEN** 该宠物 tag 显示不友好

#### Scenario: 无激活行程逐只判定

- **GIVEN** 用户没有激活行程绑定宠物且拥有多只宠物
- **WHEN** 用户查看已保存地点详情
- **THEN** 页面为每只宠物展示一个结论 tag
