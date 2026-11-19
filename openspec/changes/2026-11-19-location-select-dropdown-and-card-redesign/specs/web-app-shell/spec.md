# Spec Delta

## MODIFIED Requirements

### Requirement: 顶部居中横向导航

应用 SHALL 在登录后的页面顶部居中展示横向导航，包含 `Home`、`Paws`、`城市浏览`、`交通规则` 与 `Trips` 五个 Tab，以及「地点选择」下拉入口；下拉选项 MUST 恰为「景点」与「酒店和餐厅」，选择后 MUST 进入 `/attractions` 或 `/attractions?type=hotel`，酒店与餐厅的类型切换由页面内的 tag 完成。导航 SHALL 在 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 与 `/trips` 保持一致；已登录时 SHALL 同时显示 `Log out` 入口。管理员专属 Tab SHALL 继续按角色追加。

#### Scenario: 打开任意受保护页面

- **GIVEN** 已登录用户打开 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 或 `/trips`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home`、`Paws`、`城市浏览`、`交通规则` 与 `Trips` 五个 Tab
- **AND** 导航包含「地点选择」下拉，选项为「景点」「酒店和餐厅」
- **AND** 顶部显示 `Log out`

### Requirement: Tab 与路由同步

导航 Tab 选中状态 SHALL 与当前路由一致；切换 Tab SHALL 导航到对应路由。`/itinerary` SHALL 使 `Trips` Tab 处于选中状态。`/attractions` MUST NOT 选中任何 Tab，改由「地点选择」下拉保持激活态并展示当前地点类型。

#### Scenario: 进入首页

- **GIVEN** 已登录用户位于 `/`
- **WHEN** 导航渲染
- **THEN** `Home` Tab 处于选中状态

#### Scenario: 切换到 Paws

- **GIVEN** 已登录用户位于 `/`
- **WHEN** 用户点击 `Paws` Tab
- **THEN** 浏览器地址变为 `/paws`
- **AND** `Paws` Tab 处于选中状态
- **AND** 页面保留同一顶部导航

#### Scenario: 直接访问 Paws

- **GIVEN** 已登录用户直接访问 `/paws`
- **WHEN** 页面渲染
- **THEN** `Paws` Tab 处于选中状态

#### Scenario: 切换到城市浏览

- **GIVEN** 已登录用户位于 `/`
- **WHEN** 用户点击 `城市浏览` Tab
- **THEN** 浏览器地址变为 `/cities`
- **AND** `城市浏览` Tab 处于选中状态

#### Scenario: 直接访问城市浏览

- **GIVEN** 已登录用户直接访问 `/cities`
- **WHEN** 页面渲染
- **THEN** `城市浏览` Tab 处于选中状态

#### Scenario: 切换到 Trips

- **GIVEN** 已登录用户位于业务页面
- **WHEN** 用户点击 `Trips` Tab
- **THEN** 浏览器地址变为 `/trips`
- **AND** `Trips` Tab 处于选中状态

#### Scenario: 直接访问 Trips

- **GIVEN** 已登录用户直接访问 `/trips`
- **WHEN** 页面渲染
- **THEN** `Trips` Tab 处于选中状态

#### Scenario: 直接访问行程单

- **GIVEN** 已登录用户直接访问 `/itinerary`
- **WHEN** 页面渲染
- **THEN** `Trips` Tab 处于选中状态
- **AND** `Home` Tab 不处于选中状态
