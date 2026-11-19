# Spec Delta

## REMOVED Requirements

### Requirement: 左下角行程面板

**Reason**: 全局浮动行程面板与 `/trips` 卡片、`/itinerary` 行程单重复，展开时遮挡页面主内容；2026-11-18 评审决定废弃。

**Migration**: 行程内容与拖拽编辑迁移到地点浏览页内嵌的「每日景点行程」面板，见本 change 新增的「地点浏览页每日行程面板」；查看完整行程单通过 `/itinerary`。

### Requirement: Trips 页与单城市激活

**Reason**: 「存在激活行程时 MUST NOT 创建新行程」的规则已推翻：新建行程本身就是把激活态转到新行程。行程状态文案与页面容器同步调整。

**Migration**: 用户可在 `/trips` 直接创建新行程，创建成功后新行程成为激活行程、原行程保留为普通卡片；行为见本 change 新增的「Trips 页与激活行程管理」。

## ADDED Requirements

### Requirement: 地点浏览页每日行程面板

地点浏览页（`/attractions`）SHALL 在左栏内嵌展示「每日景点行程」面板；其他受保护页面 MUST NOT 展示全局浮动行程面板。面板列表 MUST 按 `plan.days` 的 `day` 升序与 `stops` 数组顺序渲染，`unscheduled` MUST 单独成组。地点行 SHALL 支持拖拽：同日排序、跨天移动、拖入或拖出「未排期」；同一 `poiId` MAY 在同一天出现多次。存在激活行程时，面板头部 SHALL 展示保存状态（保存中、已保存或保存失败），行程单已创建时 SHALL 提供「行程单」入口；保存失败 SHALL 提供重试。途内交通段行 SHALL 按大交通模式展示默认方式与估算（无快照时请求估算接口，失败时展示兜底文案）。

#### Scenario: 地点浏览页内嵌面板

- **GIVEN** 用户存在激活行程并打开 `/attractions`
- **WHEN** 页面渲染
- **THEN** 左栏内嵌展示「每日景点行程」面板
- **AND** 列表按天分组并包含「未排期」分组

#### Scenario: 其他页面不渲染浮动面板

- **GIVEN** 用户存在激活行程
- **WHEN** 用户浏览 `/trips`、`/itinerary`、`/cities`、`/transport-rules` 等页面
- **THEN** 页面不显示左下角浮动行程面板
- **AND** 页面主内容宽度不因面板变化

#### Scenario: 面板头部展示保存状态与行程单入口

- **GIVEN** 激活行程已创建行程单
- **WHEN** 用户打开 `/attractions`
- **THEN** 面板头部展示保存状态与「行程单」入口
- **AND** 点击「行程单」进入 `/itinerary`

#### Scenario: 同日拖拽排序

- **GIVEN** 第 1 天有两个地点
- **WHEN** 用户将第二个地点拖到第一个之前
- **THEN** 第 1 天 `stops` 顺序更新
- **AND** 触发防抖保存

#### Scenario: 跨天拖拽

- **GIVEN** 第 1 天与第 2 天各有地点
- **WHEN** 用户将第 1 天的一个地点拖到第 2 天
- **THEN** 该地点从第 1 天移除并插入第 2 天目标位置
- **AND** 触发防抖保存

#### Scenario: 同一天允许重复地点

- **GIVEN** 第 1 天已包含某景点
- **WHEN** 用户再次把同一景点加入第 1 天
- **THEN** 第 1 天保留两条相同 `poiId` 的记录
- **AND** 两条记录可分别拖拽与删除

#### Scenario: 拖入与拖出未排期

- **GIVEN** 「未排期」分组存在一个地点
- **WHEN** 用户将其拖到第 2 天，或将某天地点拖入未排期
- **THEN** `plan.days` 与 `plan.unscheduled` 按目标位置更新
- **AND** 同一 `poiId` 不会同时出现在 `days` 与 `unscheduled`（已排期优先）

### Requirement: Trips 页与激活行程管理

系统 SHALL 提供受登录保护的 `/trips` 页面，列出当前用户的全部已持久化行程，按 `id` 升序展示城市、天数、宠物与行程状态，并提供编辑（激活）、结束编辑与删除操作。同一时间 MUST 最多存在一个激活行程；存在激活行程时 SHALL 允许创建新行程，新行程创建成功后 SHALL 替换激活行程，原行程 MUST 保留为普通行程。页面 SHALL 提供「创建新行程」入口并跳转 `/cities`；存在未确认草稿时该入口 MUST 禁用并提示先放弃草稿。页面内容 SHALL 使用白卡容器承载，白卡容器 SHALL 使用淡奶黄（`paw-accent-soft`，`#FFEFD6`）描边且 MUST NOT 使用阴影。删除激活中的行程 MUST 先结束编辑再调用 `DELETE /api/trips/{id}`。

#### Scenario: 列出本人行程

- **GIVEN** 用户有两个已持久化行程
- **WHEN** 用户打开 `/trips`
- **THEN** 页面按 `id` 升序展示两个行程
- **AND** 每个行程显示城市、天数、宠物与行程状态

#### Scenario: 激活已有行程

- **GIVEN** 用户打开 `/trips`
- **WHEN** 用户点击某行程的编辑
- **THEN** 系统请求该行程详情并写入 store
- **AND** `activeTripId` 被写入 localStorage
- **AND** 该卡片展示「编辑中」

#### Scenario: 激活期间创建新行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 点击「创建新行程」并完成创建
- **THEN** 新行程成为激活行程并展示「编辑中」
- **AND** 原行程保留在列表且不再展示「编辑中」

#### Scenario: 存在未确认草稿时禁用新建

- **GIVEN** 用户存在未确认草稿
- **WHEN** 用户打开 `/trips`
- **THEN** 「创建新行程」不可用
- **AND** 提示先放弃草稿

#### Scenario: 白卡容器承载内容

- **GIVEN** 用户打开 `/trips`
- **WHEN** 页面渲染
- **THEN** 标题、筛选与行程卡片位于与行程单页一致的白卡容器内
- **AND** 白卡容器描边为淡奶黄（`#FFEFD6`）且无阴影

#### Scenario: 删除激活中的行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 确认删除该行程
- **THEN** 系统先结束编辑
- **AND** 调用 `DELETE /api/trips/{id}`
- **AND** 成功后该行程从列表移除
