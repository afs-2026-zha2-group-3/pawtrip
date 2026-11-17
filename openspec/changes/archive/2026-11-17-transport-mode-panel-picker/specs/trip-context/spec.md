# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: 大交通方式面板标签`
- TO: `### Requirement: 大交通方式面板选择入口`

## MODIFIED Requirements

### Requirement: 大交通方式面板选择入口

行程面板顶部 SHALL 提供大交通方式入口：active trip 已选择时展示包含“大交通”和方式中文名的可点击 tag；未选择时展示「选择大交通」入口，MUST NOT 展示带方式名的大交通 tag。入口 SHALL 打开选择浮层，逐项展示飞机、高铁、火车、自驾；存在可用宠物档案时按激活行程绑定的宠物展示推荐或不推荐结论与不推荐原因，宠物数据不可用时 MUST NOT 使用其他宠物替代，入口仍 SHALL 可选。浮层 SHALL 提供前往交通规则页查看完整规则的链接。选择后 SHALL 立即更新 store 的 `transportMode` 并沿用既有防抖保存链路，与交通规则页保持同一选择。

#### Scenario: 从面板选择方式

- **GIVEN** active trip 的 `transportMode` 为空
- **WHEN** 用户点击「选择大交通」入口并选择「自驾」
- **THEN** 面板入口更新为包含“大交通”和“自驾”的 tag
- **AND** 系统防抖保存该行程，`PUT` 请求体包含 `transportMode=drive`

#### Scenario: 面板展示推荐结论

- **GIVEN** active trip 绑定宠物「毛毛」，其体重、肩高或检疫证明不满足某方式
- **WHEN** 用户打开大交通方式浮层
- **THEN** 对应方式展示不推荐结论
- **AND** 列出不满足的原因
- **AND** 提供前往交通规则页的链接

#### Scenario: 已选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为 `flight`
- **WHEN** 行程面板渲染
- **THEN** 面板顶部展示包含“大交通”和“飞机”的 tag

#### Scenario: 尚未选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为空
- **WHEN** 行程面板渲染
- **THEN** 面板顶部展示「选择大交通」入口
- **AND** 不展示带方式名的大交通 tag
