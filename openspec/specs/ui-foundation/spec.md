# ui-foundation Specification

## Purpose

规定前端 UI 必须基于 `apps/web/src/components/ui/` 下的 shadcn/ui（Base UI）组件与 Tailwind 工具类，禁止手写 CSS 类与多余包裹标签，并保持模板残留 UI 已清理。
## Requirements
### Requirement: 页面与交互组件统一使用 shadcn/ui

前端页面 SHALL 以 `apps/web/src/components/ui/` 下的 shadcn/ui 组件作为交互与展示基础。页面组件 MUST NOT 引入其他 UI 组件库。

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

### Requirement: 登录与会话界面使用 shadcn/ui

登录页与会话检查态 SHALL 使用 shadcn/ui 组件组合；登录表单 MUST 包含用户名、密码输入与提交按钮，失败时展示可观察的错误提示。顶部登出入口 SHALL 使用 shadcn `Button`，且仅在已登录时显示；点击后 MUST 使用 shadcn `AlertDialog` 进行二次确认。

#### Scenario: 登录页组件来源

- **GIVEN** 用户访问 `/login`
- **WHEN** 页面渲染
- **THEN** 表单使用 `Card`、`Input`、`Label` 与 `Button`
- **AND** 不出现手写样式的输入框或按钮

#### Scenario: 登录失败提示

- **GIVEN** 用户输入错误凭据并提交
- **WHEN** 登录请求返回 `401`
- **THEN** 页面停留在 `/login`
- **AND** 展示通用失败提示，不区分用户名与密码错误

#### Scenario: 已登录显示登出

- **GIVEN** auth query 返回已登录用户
- **WHEN** 页面渲染顶部导航
- **THEN** 显示 `Log out` 按钮
- **AND** 未登录时不显示

#### Scenario: 登出确认弹窗来源

- **GIVEN** 已登录用户点击 `Log out`
- **WHEN** 需要二次确认
- **THEN** 使用 `apps/web/src/components/ui/alert-dialog` 提供的 shadcn `AlertDialog`
- **AND** 不出现浏览器原生 `confirm` 或手写弹层

### Requirement: 禁止手写样式与多余包裹标签

页面视觉与布局 SHALL 通过 shadcn/ui 组件和 Tailwind 工具类表达。`apps/web/src/styles.css` MUST NOT 包含自定义类选择器；JSX MUST NOT 包含仅用于承载样式的多余包裹元素。

#### Scenario: 样式文件不含自定义类

- **GIVEN** 改造完成
- **WHEN** 检查 `apps/web/src/styles.css`
- **THEN** 文件仅包含 Tailwind 引入、shadcn/ui 主题变量与基础层设置
- **AND** 不存在 `page-wrap`、`island-shell`、`nav-link`、`demo-*` 等自定义类

#### Scenario: 页面标签保持最小

- **GIVEN** 检查首页与 Paws 页的 JSX
- **WHEN** 统计包裹元素
- **THEN** 每个元素都承担布局或语义职责
- **AND** 不存在仅为了添加装饰样式而增加的嵌套元素

### Requirement: 移除模板残留 UI

前端 SHALL 删除 TanStack Start 模板自带的页头、页脚、主题切换与 About 页面，使界面只保留 PawTrip 应用外壳与页面内容。

#### Scenario: 模板组件已删除

- **GIVEN** 改造完成
- **WHEN** 检查 `apps/web/src`
- **THEN** 不存在 `Header`、`Footer`、`ThemeToggle` 组件文件
- **AND** 不存在 `/about` 路由
- **AND** 任意页面不渲染模板导航、页脚、社交链接或主题切换按钮

