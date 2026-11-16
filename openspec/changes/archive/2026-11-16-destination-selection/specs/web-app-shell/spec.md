# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: 顶部居中横向两 Tab 导航`
- TO: `### Requirement: 顶部居中横向导航`
- FROM: `### Requirement: 管理员地点管理导航 Tab`
- TO: `### Requirement: 管理员管理导航 Tab`

## MODIFIED Requirements

### Requirement: 顶部居中横向导航

应用 SHALL 在登录后的页面顶部居中展示横向导航，包含 `Home`、`Paws`、`城市浏览` 与 `交通规则` 四个 Tab，并在 `/`、`/paws`、`/cities` 与 `/transport-rules` 保持一致；已登录时 SHALL 同时显示 `Log out` 入口。

#### Scenario: 打开任意受保护页面

- **GIVEN** 已登录用户打开 `/`、`/paws`、`/cities` 或 `/transport-rules`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home`、`Paws`、`城市浏览` 与 `交通规则` 四个 Tab
- **AND** 顶部显示 `Log out`

### Requirement: Tab 与路由同步

导航 Tab 选中状态 SHALL 与当前路由一致；切换 Tab SHALL 导航到对应路由。

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

### Requirement: 受保护路由与登录跳转

`/`、`/paws`、`/cities` 与 `/transport-rules` SHALL 位于登录守卫之下。未登录用户访问任一路由时 MUST 跳转 `/login`，且 MUST NOT 展示受保护页面内容。登录成功后 SHALL 回到 `/`；登出前 MUST 通过确认弹窗二次确认，确认且请求成功后 SHALL 回到 `/login`，并 SHALL 清除浏览器端持久化的已选目的地。路由守卫只负责界面引导，服务端 API 仍独立执行认证。

#### Scenario: 未登录访问首页

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/`、`/paws`、`/cities` 或 `/transport-rules`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示问候语、Paws、目的地选择或交通规则内容

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

- **GIVEN** 登出确认弹窗已打开，且用户已选定目的地
- **WHEN** 用户确认登出且请求成功
- **THEN** 地址变为 `/login`
- **AND** 受保护查询缓存被清理
- **AND** 浏览器端持久化的已选目的地被清除

### Requirement: 管理员管理导航 Tab

应用 SHALL 为 `ADMIN` 用户在顶部导航提供「地点管理」与「城市管理」Tab，并分别与 `/admin/locations`、`/admin/cities` 同步；非管理员 SHALL NOT 在顶部导航看到这两个 Tab。

#### Scenario: 管理员看到地点管理 Tab

- **GIVEN** 当前用户已登录且角色为 `ADMIN`
- **WHEN** 应用顶部导航渲染
- **THEN** 导航显示「地点管理」与「城市管理」Tab
- **AND** 选择「地点管理」导航到 `/admin/locations`
- **AND** 选择「城市管理」导航到 `/admin/cities`

#### Scenario: 普通用户不看到地点管理 Tab

- **GIVEN** 当前用户已登录且角色为 `USER`
- **WHEN** 应用顶部导航渲染
- **THEN** 导航不显示「地点管理」与「城市管理」Tab

#### Scenario: 管理员页面的导航选中状态

- **GIVEN** 管理员当前位于 `/admin/locations` 或 `/admin/cities`
- **WHEN** 顶部导航渲染
- **THEN** 对应管理 Tab 处于选中状态

### Requirement: 管理员页面路由守卫

管理员路由 `/admin/locations` 与 `/admin/cities` SHALL 仅允许已认证且角色为 `ADMIN` 的用户访问；前端路由守卫 SHALL 与后端管理 API 授权相互独立。

#### Scenario: 普通用户直接访问管理员路由

- **GIVEN** 当前用户已认证且角色为 `USER`
- **WHEN** 用户直接访问 `/admin/locations` 或 `/admin/cities`
- **THEN** 管理页面内容不显示
- **AND** 用户返回普通受保护页面

#### Scenario: 未登录用户访问管理员路由

- **GIVEN** 用户没有有效登录会话
- **WHEN** 用户访问 `/admin/locations` 或 `/admin/cities`
- **THEN** 用户被引导到 `/login`
- **AND** 管理页面内容不显示

## ADDED Requirements

### Requirement: 顶栏目的地上下文展示

登录后的应用外壳 SHALL 在顶栏展示当前已选目的地：已选定时显示城市名，未选定时显示「目的地未选」。该展示 SHALL 与浏览器端持久化的选定状态一致，并在重新选定后同步更新。

#### Scenario: 已选定目的地

- **GIVEN** 用户已选定杭州
- **WHEN** 任一受保护页面渲染
- **THEN** 顶栏显示当前目的地「杭州」

#### Scenario: 未选定目的地

- **GIVEN** 用户尚未选定目的地
- **WHEN** 任一受保护页面渲染
- **THEN** 顶栏显示「目的地未选」

#### Scenario: 重新选定后同步

- **GIVEN** 顶栏当前显示「杭州」
- **WHEN** 用户在 `/cities` 重新选定珠海
- **THEN** 顶栏更新为「珠海」