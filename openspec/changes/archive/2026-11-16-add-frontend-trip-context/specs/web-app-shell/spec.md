# Spec Delta

## MODIFIED Requirements

### Requirement: 顶部居中横向导航

应用 SHALL 在登录后的页面顶部居中展示横向导航，包含 `Home`、`Paws`、`城市浏览`、`景区浏览`、`交通规则` 与 `Trips` 六个 Tab，并在 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 与 `/trips` 保持一致；已登录时 SHALL 同时显示 `Log out` 入口。管理员专属 Tab SHALL 继续按角色追加。

#### Scenario: 打开任意受保护页面

- **GIVEN** 已登录用户打开 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 或 `/trips`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home`、`Paws`、`城市浏览`、`景区浏览`、`交通规则` 与 `Trips` 六个 Tab
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

#### Scenario: 切换到 Trips

- **GIVEN** 已登录用户位于业务页面
- **WHEN** 用户点击 `Trips` Tab
- **THEN** 浏览器地址变为 `/trips`
- **AND** `Trips` Tab 处于选中状态

#### Scenario: 直接访问 Trips

- **GIVEN** 已登录用户直接访问 `/trips`
- **WHEN** 页面渲染
- **THEN** `Trips` Tab 处于选中状态

### Requirement: 受保护路由与登录跳转

`/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 与 `/trips` SHALL 位于登录守卫之下。未登录用户访问任一路由时 MUST 跳转 `/login`，且 MUST NOT 展示受保护页面内容。登录成功后 SHALL 回到 `/`；登出前 MUST 通过确认弹窗二次确认，确认且请求成功后 SHALL 回到 `/login`，并 SHALL 清除浏览器端持久化的 `activeTripId` 与行程上下文。路由守卫只负责界面引导，服务端 API 仍独立执行认证。

#### Scenario: 未登录访问首页

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 或 `/trips`
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

## REMOVED Requirements

### Requirement: 顶栏目的地上下文展示

**Reason**: 目的地不再是顶栏展示的独立会话状态，而是由左下角行程面板展示城市、天数与宠物；顶栏 chip 与 `sessionStorage` 目的地状态一并移除。

**Migration**: 激活行程或草稿存在时，用户通过左下角行程面板查看城市与行程信息；无行程时面板隐藏或展示创建引导。

## ADDED Requirements

### Requirement: 行程面板与内容布局

登录后的应用外壳 SHALL 渲染全局行程面板。面板折叠态 MUST 悬浮于页面左下角，不占用页面布局；展开态 MUST 在桌面端占用左侧固定宽度并使页面主内容在剩余区域重新居中，移动端 MAY 以全屏面板呈现。面板 MUST NOT 在 `/login` 渲染。面板的展开状态 SHALL 由行程上下文 store 维护，路由切换 SHALL 保留该状态。

#### Scenario: 折叠态浮层

- **GIVEN** 用户已登录且存在激活行程
- **WHEN** 用户浏览任一受保护页面
- **THEN** 左下角显示行程面板浮层
- **AND** 页面主内容宽度不因面板折叠而改变

#### Scenario: 展开后挤压内容

- **GIVEN** 行程面板处于折叠态
- **WHEN** 用户点击展开
- **THEN** 桌面端页面主内容向右挤压并在剩余区域居中
- **AND** 面板高度铺满内容区

#### Scenario: 移动端全屏面板

- **GIVEN** 视口宽度小于桌面断点
- **WHEN** 用户展开行程面板
- **THEN** 面板以全屏形式展示
- **AND** 不产生横向挤压布局

#### Scenario: 登录页不渲染面板

- **GIVEN** 用户位于 `/login`
- **WHEN** 页面渲染
- **THEN** 不显示行程面板

#### Scenario: 路由切换保留展开状态

- **GIVEN** 用户已将面板展开
- **WHEN** 用户切换到另一个受保护路由
- **THEN** 面板保持展开
- **AND** 页面内容按展开布局渲染