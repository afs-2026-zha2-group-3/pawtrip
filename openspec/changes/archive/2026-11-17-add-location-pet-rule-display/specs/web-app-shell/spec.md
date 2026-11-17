# Spec Delta

## ADDED Requirements

### Requirement: 景区浏览导航 Tab

登录后的应用外壳 SHALL 在顶部导航为所有已登录用户提供“景区浏览”Tab，并与 `/attractions` 和 `/attractions/{poiId}` 路由保持选中状态同步；该 Tab MUST NOT 嵌入“城市浏览”页面。

#### Scenario: 显示景区浏览 Tab

- **GIVEN** 用户已登录
- **WHEN** 顶部导航渲染
- **THEN** 导航显示“景区浏览”Tab

#### Scenario: 打开景点列表

- **GIVEN** 已登录用户位于 `/attractions`
- **WHEN** 顶部导航渲染
- **THEN** “景区浏览”Tab 处于选中状态

#### Scenario: 打开景点详情

- **GIVEN** 已登录用户位于 `/attractions/{poiId}`
- **WHEN** 顶部导航渲染
- **THEN** “景区浏览”Tab 处于选中状态

#### Scenario: 点击景区浏览 Tab

- **GIVEN** 已登录用户位于 `/cities`
- **WHEN** 用户点击“景区浏览”Tab
- **THEN** 浏览器地址变为 `/attractions`
- **AND** “景区浏览”Tab 处于选中状态
