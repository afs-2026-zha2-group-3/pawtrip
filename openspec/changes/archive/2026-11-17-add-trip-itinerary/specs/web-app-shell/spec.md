# Spec Delta

## MODIFIED Requirements

### Requirement: Tab 与路由同步

导航 Tab 选中状态 SHALL 与当前路由一致；切换 Tab SHALL 导航到对应路由。`/itinerary` SHALL 使 `Trips` Tab 处于选中状态。

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

### Requirement: 受保护路由与登录跳转

`/`、`/paws`、`/cities`、`/attractions`、`/transport-rules`、`/trips` 与 `/itinerary` SHALL 位于登录守卫之下。未登录用户访问任一路由时 MUST 跳转 `/login`，且 MUST NOT 展示受保护页面内容。登录成功后 SHALL 回到 `/`；登出前 MUST 通过确认弹窗二次确认，确认且请求成功后 SHALL 回到 `/login`，并 SHALL 清除浏览器端持久化的 `activeTripId` 与行程上下文。路由守卫只负责界面引导，服务端 API 仍独立执行认证。

#### Scenario: 未登录访问首页

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules`、`/trips` 或 `/itinerary`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示问候语、Paws、目的地选择、景点、交通规则或行程内容

#### Scenario: 登录后进入首页

- **GIVEN** 用户位于 `/login`
- **WHEN** 输入正确凭据并提交
- **THEN** 地址变为 `/`
- **AND** `Home` Tab 选中并展示问候语

#### Scenario: 登出前二次确认

- **GIVEN** 已登录用户位于业务页面
- **WHEN** 点击 `Log out`
- **THEN** 展示登出确认弹窗
- **AND** 未确认前保持当前页面与登录状态
- **AND** 取消后关闭弹窗并留在当前页面

#### Scenario: 确认登出

- **GIVEN** 登出确认弹窗已打开，且用户存在激活行程
- **WHEN** 用户确认登出且请求成功
- **THEN** 地址变为 `/login`
- **AND** 受保护查询缓存被清理
- **AND** `activeTripId` 与行程上下文被清除
