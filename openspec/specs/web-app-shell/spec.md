# web-app-shell Specification

## Purpose

定义 PawTrip 登录后的应用外壳：顶部居中 `Home` / `Paws` / `城市浏览` / `交通规则` 路由 Tab 与管理员专属 Tab、独立登录页、受保护路由跳转与登出二次确认（含清除已选目的地）、顶栏目的地上下文展示，确保导航、页面内容与路由状态一致。

## Requirements

### Requirement: 顶部居中横向导航

应用 SHALL 在登录后的页面顶部居中展示横向导航，包含 `Home`、`Paws`、`城市浏览`、`景区浏览`、`交通规则` 与 `Trips` 六个 Tab，并在 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 与 `/trips` 保持一致；已登录时 SHALL 同时显示 `Log out` 入口。管理员专属 Tab SHALL 继续按角色追加。

#### Scenario: 打开任意受保护页面

- **GIVEN** 已登录用户打开 `/`、`/paws`、`/cities`、`/attractions`、`/transport-rules` 或 `/trips`
- **WHEN** 页面渲染
- **THEN** 页面顶部居中显示横向 Tab 导航
- **AND** 导航包含 `Home`、`Paws`、`城市浏览`、`景区浏览`、`交通规则` 与 `Trips` 六个 Tab
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

### Requirement: 交通规则导航 Tab

应用 SHALL 为所有已登录用户在顶部导航提供「交通规则」Tab，位置在「城市浏览」之后、管理员专属 Tab 之前，并与 `/transport-rules` 路由同步；该 Tab MUST 对所有已登录用户可见，MUST NOT 仅限管理员。

#### Scenario: 已登录用户看到交通规则 Tab

- **WHEN** 已登录用户查看顶部导航
- **THEN** 导航显示「交通规则」Tab
- **AND** 该 Tab 位于「城市浏览」之后

#### Scenario: 选择交通规则 Tab

- **WHEN** 用户点击「交通规则」Tab
- **THEN** 浏览器地址变为 `/transport-rules`
- **AND** 「交通规则」Tab 处于选中状态

#### Scenario: 直接访问交通规则路由

- **WHEN** 已登录用户直接访问 `/transport-rules`
- **THEN** 「交通规则」Tab 处于选中状态
- **AND** 其他 Tab 不处于选中状态

#### Scenario: 普通用户同样可见

- **WHEN** 当前用户角色为 `USER`
- **THEN** 顶部导航仍显示「交通规则」Tab

### Requirement: 交通规则页面路由守卫

`/transport-rules` SHALL 仅允许已认证用户访问；前端路由守卫 MUST 在未登录时跳转 `/login`，且 MUST NOT 展示规则页面内容。

#### Scenario: 未登录用户访问交通规则路由

- **WHEN** 浏览器没有有效登录会话且访问 `/transport-rules`
- **THEN** 用户被引导到 `/login`
- **AND** 规则页面内容不显示

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

### Requirement: 固定应用外壳与分区滚动

登录后的应用外壳 SHALL 占满可视视口，文档根元素 MUST NOT 产生纵向滚动；顶部导航 MUST 固定在外壳顶部并位于内容滚动区之外，内容滚动 MUST NOT 改变导航位置。内容区 SHALL 作为默认且唯一的纵向滚动视口，仅当内容超出可视高度时出现滚动；`/` 与 `/paws` 在常规桌面视口下 MUST NOT 出现纵向滚动条，矮视口内容超出时 MAY 回退为内容区滚动且 MUST NOT 裁切内容。切换受保护路由后内容视口 SHALL 回到顶部，目标地址包含 `#` 锚点时 MUST NOT 复位并交由浏览器滚动到锚点。窄屏下导航 Tab 列表 SHALL 可横向滚动以访问全部 Tab，MUST NOT 被溢出裁切而不可达。`@media print` 时外壳 MUST 恢复普通文档流，MUST NOT 限制高度或裁剪内容。

#### Scenario: 顶部导航不随内容滚动

- **GIVEN** 已登录用户位于内容高度超过可视区的受保护页面
- **WHEN** 用户滚动页面内容
- **THEN** 顶部导航保持在视口顶部不动
- **AND** `window.scrollY` 保持为 0
- **AND** 内容区自身的 `scrollTop` 增大

#### Scenario: 普通页面只滚动内容区

- **GIVEN** 已登录用户位于 `/transport-rules` 且内容超过可视高度
- **WHEN** 用户滚动
- **THEN** 只有内容视口发生滚动
- **AND** 文档根不产生纵向滚动

#### Scenario: 常规视口下我的宠物页无滚动条

- **GIVEN** 视口为 1920×1080 且 `/paws` 的内容未超过内容视口高度
- **WHEN** 页面渲染完成
- **THEN** 内容视口不出现纵向滚动
- **AND** 顶部导航保持可见

#### Scenario: 矮视口兜底滚动

- **GIVEN** 视口高度不足以容纳 `/paws` 的完整内容
- **WHEN** 用户滚动内容区
- **THEN** 内容视口可纵向滚动且内容不被裁切
- **AND** 顶部导航保持固定

#### Scenario: 切换路由后内容回到顶部

- **GIVEN** 用户在某个受保护页面已把内容区滚动到非顶部位置
- **WHEN** 用户切换到另一个受保护路由
- **THEN** 新页面的内容视口 `scrollTop` 为 0

#### Scenario: 带锚点进入不复位

- **GIVEN** 用户从城市浏览进入 `/destinations/<adcode>/policy#banned-breeds`
- **WHEN** 页面渲染完成
- **THEN** 禁养犬种区块进入视口
- **AND** 内容视口 `scrollTop` 大于 0
- **AND** 外壳跳过了路由切换的滚动复位

#### Scenario: 打印恢复文档流

- **GIVEN** 用户位于行程单页面并触发打印或导出 PDF
- **WHEN** 应用进入打印媒体
- **THEN** 外壳不再限制高度与溢出
- **AND** 行程内容可跨页完整输出且不被内部滚动裁剪
- **AND** 顶部导航与应用外框不出现

#### Scenario: 窄屏导航避免裁切

- **GIVEN** 视口宽度为 390px 且当前用户为管理员（导航包含多个 Tab）
- **WHEN** 顶部导航渲染
- **THEN** Tab 列表可横向滚动访问全部 Tab
- **AND** 不存在被 `overflow-hidden` 裁切且无法访问的 Tab
