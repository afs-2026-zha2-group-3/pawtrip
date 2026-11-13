## ADDED Requirements

### Requirement: 顶部居中横向两 Tab 导航

应用 SHALL 在页面顶部居中展示横向导航，包含 `Home` 与 `Paws` 两个 Tab，并在所有应用页面保持一致。

#### Scenario: 打开任意页面

- **GIVEN** 访客打开 `/` 或 `/paws`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home` 与 `Paws` 两个 Tab

### Requirement: Tab 与路由同步

导航 Tab 选中状态 SHALL 与当前路由一致；切换 Tab SHALL 导航到对应路由。

#### Scenario: 进入首页

- **GIVEN** 访客位于 `/`
- **WHEN** 导航渲染
- **THEN** `Home` Tab 处于选中状态

#### Scenario: 切换到 Paws

- **GIVEN** 访客位于 `/`
- **WHEN** 访客点击 `Paws` Tab
- **THEN** 浏览器地址变为 `/paws`
- **AND** `Paws` Tab 处于选中状态
- **AND** 页面保留同一顶部导航

#### Scenario: 直接访问 Paws

- **GIVEN** 访客直接访问 `/paws`
- **WHEN** 页面渲染
- **THEN** `Paws` Tab 处于选中状态

### Requirement: Home Tab 展示问候语

`Home` Tab SHALL 展示现有首页内容：来自 `/api/greeting` 的问候语 `message`。该文本 MUST NOT 在前端硬编码。

#### Scenario: 首页展示问候语

- **GIVEN** 后端已启动且 `/api/greeting` 可用
- **WHEN** 访客打开 `/` 且 `Home` Tab 处于选中状态
- **THEN** 内容区域展示接口返回的 `message`
- **AND** 不展示模板页脚、社交链接或主题切换按钮
