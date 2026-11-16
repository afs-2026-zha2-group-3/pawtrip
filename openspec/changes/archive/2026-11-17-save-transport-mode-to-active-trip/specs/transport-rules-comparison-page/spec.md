# Spec Delta

## MODIFIED Requirements

### Requirement: 交通方式单选与临时缓存

系统 SHALL 在「方式」列之前提供单选项列；存在激活行程时，同一时刻只允许选中一种交通方式。选中值 SHALL 保存到当前激活行程的 `transportMode` 字段，并在进入页面时从该行程回显；MUST NOT 使用 `sessionStorage` 单独保存选择。无宠物档案数据时，单选项仍 SHALL 可用。

#### Scenario: 选中一种方式

- **GIVEN** 用户存在激活行程
- **WHEN** 用户选中一种交通方式
- **THEN** 该方式被选中、其他方式取消选中
- **AND** 该选择保存到当前激活行程

#### Scenario: 激活行程已有选择

- **GIVEN** 激活行程已保存一种交通方式
- **WHEN** 用户打开交通规则页
- **THEN** 对应交通方式处于选中状态

#### Scenario: 刷新后回显

- **GIVEN** 激活行程已保存一种交通方式
- **WHEN** 用户刷新页面且激活行程恢复完成
- **THEN** 交通规则页回显该行程已保存的选择

#### Scenario: 尚未选择

- **GIVEN** 激活行程的 `transportMode` 为空
- **WHEN** 用户打开交通规则页
- **THEN** 所有交通方式均未选中

#### Scenario: 无档案时仍可选择

- **GIVEN** 用户存在激活行程但宠物档案数据不可用
- **WHEN** 用户打开交通规则页
- **THEN** 单选项仍正常渲染并可用

## ADDED Requirements

### Requirement: 交通规则页需要激活行程

交通规则页 SHALL 仅在存在激活行程时展示规则表格与交通方式选择。无激活行程时，页面 SHALL 展示创建或激活行程的引导，并提供前往城市浏览和 Trips 页的入口。

#### Scenario: 无激活行程

- **GIVEN** 激活行程 hydration 已完成且当前没有激活行程
- **WHEN** 用户打开 `/transport-rules`
- **THEN** 页面显示「先创建或激活行程」空态
- **AND** 提供前往 `/cities` 创建行程和前往 `/trips` 查看已有行程的入口
- **AND** 不显示规则表格或交通方式单选项

#### Scenario: 存在激活行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/transport-rules`
- **THEN** 页面展示交通规则表格和交通方式单选项
