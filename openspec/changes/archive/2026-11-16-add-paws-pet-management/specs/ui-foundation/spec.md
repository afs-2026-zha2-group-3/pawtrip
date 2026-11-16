## MODIFIED Requirements

### Requirement: 页面与交互组件统一使用 shadcn/ui

前端页面 SHALL 以 `apps/web/src/components/ui/` 下的 shadcn/ui 组件作为交互与展示基础。页面组件 MUST NOT 引入其他 UI 组件库。以源码形式纳入 `apps/web/src/components/ui/`、且不新增运行时依赖的第三方动效展示组件 MAY 用于视觉展示，不计入“其他 UI 组件库”；此类组件 MUST NOT 替代 shadcn 的按钮、输入、选择器、弹窗与导航控件，也 MUST NOT 引入 `apps/web/src/styles.css` 之外的自定义 CSS 类选择器。

#### Scenario: 新增页面 UI

- **GIVEN** 需要新增或改造一个前端页面
- **WHEN** 实现页面中的导航、按钮、卡片等界面元素
- **THEN** 使用 shadcn/ui 组件
- **AND** 不引入 shadcn/ui 之外的 UI 组件库

#### Scenario: 交互组件来源可核查

- **GIVEN** 改造完成
- **WHEN** 检查 `apps/web/src/components` 与路由组件
- **THEN** 界面交互组件来自 `apps/web/src/components/ui/`
- **AND** 页面中不存在自研的按钮、标签页、卡片、输入框或标签实现

#### Scenario: 零依赖动效展示组件来源

- **GIVEN** 页面使用第三方动效展示组件（如 React Bits Tilted Card）
- **WHEN** 检查组件源码、依赖与样式
- **THEN** 组件源码位于 `apps/web/src/components/ui/`
- **AND** `package.json` 不新增该组件的运行时依赖
- **AND** `apps/web/src/styles.css` 不新增自定义类选择器
- **AND** 组件内部仅使用 Tailwind 工具类或动画所需的内联样式

#### Scenario: 动效组件不替代 shadcn 交互控件

- **GIVEN** Paws 页面使用动效卡片展示宠物
- **WHEN** 检查新增、编辑、删除与详情交互
- **THEN** 按钮、输入框、选择器、弹窗与确认框均来自 `apps/web/src/components/ui/` 的 shadcn 组件
- **AND** 动效组件仅承担卡片展示与点击入口