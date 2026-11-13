# frontend-authentication Specification

## Purpose
TBD - created by archiving change add-user-login. Update Purpose after archive.
## Requirements
### Requirement: 登录页面

前端 SHALL 提供公开路由 `/login`，包含用户名与密码输入框及提交入口。提交时 SHALL 通过统一 `request` 层调用 `POST /api/auth/login`（表单编码并携带 CSRF token）；成功时 SHALL 跳转 `/`，失败时 SHALL 停留在 `/login` 并展示通用登录失败提示。登录失败提示 MUST NOT 区分用户名不存在与密码错误。

#### Scenario: 使用正确凭据登录

- **GIVEN** 用户位于 `/login`
- **WHEN** 输入正确用户名与密码并提交
- **THEN** 登录请求成功
- **AND** 前端跳转到 `/`
- **AND** 首页在已登录会话下展示问候语

#### Scenario: 使用错误凭据登录

- **GIVEN** 用户位于 `/login`
- **WHEN** 输入错误用户名或密码并提交
- **THEN** 页面停留在 `/login`
- **AND** 展示通用登录失败提示
- **AND** 不跳转到首页

#### Scenario: 已登录访问登录页

- **GIVEN** 用户已登录
- **WHEN** 访问 `/login`
- **THEN** 前端跳转到 `/`
- **AND** 不展示登录表单

### Requirement: 未登录路由守卫

前端 SHALL 保护除 `/login` 外的全部页面路由。未登录用户访问 `/`、`/about` 或其他受保护路由时 SHALL 跳转到 `/login`，且 MUST NOT 展示受保护页面内容。守卫 SHALL 同时覆盖直接输入 URL、刷新页面与客户端导航。路由守卫只负责界面引导，服务端 API 仍 MUST 独立执行认证与授权。

#### Scenario: 直接访问受保护页面

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 直接访问 `/` 或 `/about`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示问候语或受保护页面内容

#### Scenario: 刷新受保护页面

- **GIVEN** 用户会话已失效
- **WHEN** 刷新 `/`
- **THEN** 前端跳转到 `/login`
- **AND** 不展示缓存的受保护数据

#### Scenario: 已登录访问受保护页面

- **GIVEN** 用户持有有效会话
- **WHEN** 访问 `/` 或 `/about`
- **THEN** 页面正常展示
- **AND** 不发生登录跳转

### Requirement: 认证状态查询与缓存

前端 SHALL 通过集中定义的 auth query 调用 `GET /api/auth/me` 获取当前用户。该查询 MUST NOT 对 `401` 自动重试；未认证 SHALL 被视为合法的“未登录”状态而不是路由错误页。登录成功、登出成功或业务请求返回 `401` 时，前端 SHALL 使 auth query 与受保护查询缓存失效。

#### Scenario: 未登录状态不是错误页

- **GIVEN** 用户没有有效会话
- **WHEN** auth query 收到 `401`
- **THEN** 前端将其视为未登录
- **AND** 跳转到 `/login`
- **AND** 不展示通用错误页

#### Scenario: 登录成功刷新认证状态

- **GIVEN** 用户在 `/login` 登录成功
- **WHEN** 前端处理登录响应
- **THEN** auth query 缓存更新为当前用户
- **AND** 路由守卫允许进入受保护页面

### Requirement: 顶部导航登出

顶部导航 SHALL 仅在已登录时显示“退出登录”按钮。点击后 SHALL 通过统一 `request` 层调用 `POST /api/auth/logout` 并携带 CSRF token；成功后 SHALL 清理 auth 与受保护查询缓存、跳转 `/login`，并隐藏登出按钮。登出请求失败时 SHALL 保留当前会话并展示可观察的错误提示。

#### Scenario: 已登录显示登出按钮

- **GIVEN** auth query 返回已登录用户
- **WHEN** 页面渲染顶部导航
- **THEN** 显示“退出登录”按钮

#### Scenario: 未登录隐藏登出按钮

- **GIVEN** auth query 返回未登录
- **WHEN** 页面渲染顶部导航
- **THEN** 不显示“退出登录”按钮

#### Scenario: 登出成功

- **GIVEN** 用户已登录并位于业务页面
- **WHEN** 点击“退出登录”且请求成功
- **THEN** 前端跳转到 `/login`
- **AND** auth 与受保护查询缓存被清理
- **AND** 返回顶部导航不显示登出按钮
- **AND** 使用旧会话访问业务 API 返回 `401`

### Requirement: 全局 401 认证失效

前端 SHALL 在任意业务请求返回 `401` 时触发统一的认证失效处理：使 auth query 失效、清理受保护查询缓存，并引导用户到 `/login`。该处理 MUST NOT 对 `401` 自动重试，也 MUST NOT 将 `401` 展示为通用 500 或网络错误。

#### Scenario: 会话过期后访问首页

- **GIVEN** 用户停留在首页但服务端会话已过期
- **WHEN** 首页数据请求返回 `401`
- **THEN** 前端清理认证与受保护缓存
- **AND** 跳转到 `/login`
- **AND** 不展示之前的问候语

