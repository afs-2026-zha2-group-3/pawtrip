## ADDED Requirements

### Requirement: Paws 页面可访问且内容为空

应用 SHALL 提供受登录保护的 `/paws` 路由。选中 `Paws` Tab 时，页面显示应用外壳，Tab 内容为空。

#### Scenario: 打开 Paws 页面

- **GIVEN** 已登录用户位于 `/`
- **WHEN** 用户选中 `Paws` Tab
- **THEN** 浏览器地址为 `/paws`
- **AND** 页面显示顶部导航与空内容区域
- **AND** 不展示问候语或占位业务内容

#### Scenario: 直接访问 Paws

- **GIVEN** 已登录用户在地址栏输入 `/paws`
- **WHEN** 页面渲染
- **THEN** 页面正常显示应用外壳
- **AND** 不出现 404 页面

#### Scenario: 未登录访问 Paws

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/paws`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示 Paws 内容
