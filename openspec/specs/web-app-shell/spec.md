# web-app-shell Specification

## Purpose

定义 PawTrip 登录后的应用外壳：顶部居中 `Home` / `Paws` 路由 Tab、独立登录页、受保护路由跳转与登出二次确认，确保导航、页面内容与路由状态一致。
## Requirements
### Requirement: 顶部居中横向两 Tab 导航

应用 SHALL 在登录后的页面顶部居中展示横向导航，包含 `Home` 与 `Paws` 两个 Tab，并在 `/` 与 `/paws` 保持一致；已登录时 SHALL 同时显示 `Log out` 入口。

#### Scenario: 打开任意受保护页面

- **GIVEN** 已登录用户打开 `/` 或 `/paws`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home` 与 `Paws` 两个 Tab
- **AND** 顶部显示 `Log out`

### Requirement: 登录页独立于应用外壳

`/login` SHALL 独立渲染，MUST NOT 显示 `Home` / `Paws` Tab 导航与 `Log out` 入口；应用外壳仅用于登录后的受保护页面。

#### Scenario: 打开登录页

- **GIVEN** 用户位于 `/login`
- **WHEN** 页面渲染
- **THEN** 页面仅展示登录内容
- **AND** 不显示 `Home` / `Paws` Tab 导航
- **AND** 不显示 `Log out`

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

### Requirement: 受保护路由与登录跳转

`/` 与 `/paws` SHALL 位于登录守卫之下。未登录用户访问任一路由时 MUST 跳转 `/login`，且 MUST NOT 展示受保护页面内容。登录成功后 SHALL 回到 `/`；登出前 MUST 通过确认弹窗二次确认，确认且请求成功后 SHALL 回到 `/login`。路由守卫只负责界面引导，服务端 API 仍独立执行认证。

#### Scenario: 未登录访问首页

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/` 或 `/paws`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示问候语或 Paws 内容

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

- **GIVEN** 登出确认弹窗已打开
- **WHEN** 用户确认登出且请求成功
- **THEN** 地址变为 `/login`
- **AND** 受保护查询缓存被清理

### Requirement: Home Tab 展示问候语

`Home` Tab SHALL 展示现有首页内容：来自 `/api/greeting` 的问候语 `message`。该文本 MUST NOT 在前端硬编码。

#### Scenario: 首页展示问候语

- **GIVEN** 用户已登录且 `/api/greeting` 可用
- **WHEN** 用户打开 `/` 且 `Home` Tab 处于选中状态
- **THEN** 内容区域展示接口返回的 `message`
- **AND** 不展示模板页脚、社交链接或主题切换按钮

#### Scenario: 问候语加载失败

- **GIVEN** auth query 已确认用户登录，但 `/api/greeting` 请求失败
- **WHEN** 用户打开 `/`
- **THEN** 进入根路由错误页并展示可读错误信息与重试入口
- **AND** auth query 失败时优先跳转 `/login`，不展示受保护内容

