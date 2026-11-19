# Spec Delta

## ADDED Requirements

### Requirement: 行程单页框描边

行程单页面 SHALL 在 main 版本布局的基础上，为白色页框使用淡奶黄（`paw-accent-soft`，`#FFEFD6`）描边，且页框 MUST NOT 使用阴影；其余布局、滚动行为与路线规划入口 SHALL 保持 main 分支版本。

#### Scenario: 打开行程单

- **GIVEN** 用户打开 `/itinerary`
- **WHEN** 页面渲染完成
- **THEN** 页框描边为淡奶黄（`#FFEFD6`）
- **AND** 页框无阴影
- **AND** 路线规划入口为「查看当天路线规划」按钮
