# trip-context Specification

## Purpose

TBD - created by syncing the add-frontend-trip-context change. This capability owns the frontend trip context: the active trip store, the draft-to-confirmed lifecycle, `activeTripId` persistence and hydration, the `/trips` activation page, the bottom-left trip panel, debounced plan auto-save, and the unified pet policy matching subject.

## Requirements

### Requirement: 激活行程上下文与持久化

系统 SHALL 使用 TanStack Store 保存当前激活行程，`active` 对象 MUST 与后端 trip 的 DB 字段同构（`id`、`name`、`cityAdcode`、`petId`、`totalDays`、`plan`、`transportMode`、`createdAt`、`updatedAt`），MAY 额外保存城市、宠物与地点详情缓存。浏览器端 MUST 只持久化 `activeTripId`；行程内容与缓存 MUST NOT 写入持久化存储。登录成功后系统 SHALL 按 `activeTripId` 拉取详情并写入 store；详情返回 `404` 或 `401` 时 MUST 清除 `activeTripId` 与本地行程状态；登出 MUST 清除 `activeTripId` 与行程相关缓存。

#### Scenario: 刷新后恢复激活行程

- **GIVEN** 用户有一个激活行程且 localStorage 保存了 `activeTripId`
- **WHEN** 用户刷新页面并完成登录态恢复
- **THEN** 系统请求 `GET /api/trips/{id}`
- **AND** 成功后 store 的 `active` 包含该行程的完整字段、`plan` 与 `transportMode`

#### Scenario: 激活行程已不存在

- **GIVEN** localStorage 中的 `activeTripId` 指向的行程已被删除
- **WHEN** 系统在登录后拉取详情
- **THEN** 接口返回 `404`
- **AND** 系统清除 `activeTripId` 与本地行程状态
- **AND** 页面回到“无激活行程”状态

#### Scenario: 登出清理

- **GIVEN** 用户有激活行程
- **WHEN** 用户确认登出且请求成功
- **THEN** `activeTripId` 被清除
- **AND** store 中的行程与地点缓存被清空

#### Scenario: 未登录不写入用户数据

- **GIVEN** 请求处于服务端渲染阶段或用户未登录
- **WHEN** store 被初始化
- **THEN** `active` 为空
- **AND** 服务端不读取或写入任何用户的行程数据

### Requirement: 左下角行程面板

系统 SHALL 在登录后的页面左下角展示基于 React Bits AnimatedList 的行程面板。折叠态 SHALL 悬浮于页面左下角，顶部以 tag 展示城市、天数与宠物名，并按天分组展示地点，包含"未排期"分组。面板 SHALL 提供展开按钮；展开后 SHALL 扩展至页面内容高度、增加宽度，并使后方页面内容向右挤压（移动端 MAY 使用全屏面板）。面板列表 MUST 按 `plan.days` 的 `day` 升序与 `stops` 数组顺序渲染，`unscheduled` MUST 单独成组。地点行 SHALL 支持拖拽：同日排序、跨天移动、拖入或拖出"未排期"；同一 `poiId` MAY 在同一天出现多次。

#### Scenario: 折叠态展示 tag 与分组

- **GIVEN** 用户存在激活行程
- **WHEN** 任一受保护页面渲染
- **THEN** 左下角显示折叠面板
- **AND** 顶部 tag 显示城市、天数与宠物名
- **AND** 列表按天分组并包含"未排期"分组

#### Scenario: 展开面板挤压内容

- **GIVEN** 面板处于折叠态
- **WHEN** 用户点击展开
- **THEN** 面板高度扩展至页面内容高度且宽度增大
- **AND** 页面主内容区域在剩余宽度内重新布局

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

- **GIVEN** "未排期"分组存在一个地点
- **WHEN** 用户将其拖到第 2 天，或将某天地点拖入未排期
- **THEN** `plan.days` 与 `plan.unscheduled` 按目标位置更新
- **AND** 同一 `poiId` 不会同时出现在 `days` 与 `unscheduled`（已排期优先）

### Requirement: 计划编辑与自动保存

激活行程的计划或大交通方式变更 SHALL 先乐观更新 store，再以约 600ms 防抖合并为一次 `PUT /api/trips/{id}`，请求体 MUST 包含 `{ name, totalDays, plan, transportMode }`。面板 SHALL 展示 `保存中`、`已保存` 或 `保存失败` 状态。保存失败时 MUST 保留本地改动并提供重试；服务端返回 `400 VALIDATION_ERROR` 时 MUST 重新拉取详情并以服务端数据为准。系统 MUST NOT 引入乐观锁，整量更新为后写覆盖。

#### Scenario: 乐观更新

- **GIVEN** 用户激活了一个行程
- **WHEN** 用户加入一个地点
- **THEN** 面板立即显示该地点
- **AND** 在防抖窗口内不发送请求

#### Scenario: 防抖合并保存

- **GIVEN** 用户在 600ms 内连续进行多次拖拽
- **WHEN** 防抖窗口结束
- **THEN** 系统只发送一次 `PUT`
- **AND** 请求体包含最终 `plan` 与当前 `transportMode`

#### Scenario: 选择大交通方式后自动保存

- **GIVEN** 用户激活了一个行程
- **WHEN** 用户在交通规则页选择一种大交通方式
- **THEN** active trip 在 store 中立即反映该选择
- **AND** 系统防抖保存该行程，`PUT` 请求体包含所选 `transportMode`

#### Scenario: 保存失败可重试

- **GIVEN** `PUT` 返回网络错误或 `5xx`
- **WHEN** 保存失败
- **THEN** 面板展示保存失败状态
- **AND** 本地改动保留
- **AND** 用户可点击重试重新发送

#### Scenario: 校验失败以服务端为准

- **GIVEN** `PUT` 返回 `400 VALIDATION_ERROR`
- **WHEN** 系统收到响应
- **THEN** 重新请求该行程详情
- **AND** store 的 `active` 被替换为服务端数据
- **AND** 面板提示保存失败原因

### Requirement: 统一政策匹配主体

所有政策匹配处 SHALL 使用同一匹配主体：存在激活行程且已绑定宠物时，只匹配该宠物；否则匹配当前用户的全部宠物。匹配结果 SHALL 以宠物名 tag 展示；有激活宠物时 MUST 只展示该宠物一个 tag，无激活行程时 MUST 为每只宠物展示一个 tag。结果状态 SHALL 统一为友好、不友好、无法判定或未配置。宠物数据加载失败时 MUST 展示"暂时无法读取宠物"类提示，MUST NOT 展示"无宠物"。

#### Scenario: 激活行程只匹配携带宠物

- **GIVEN** 用户有激活行程且 `petId` 指向「旺财」
- **WHEN** 用户浏览城市政策、景点列表或景点详情
- **THEN** 政策匹配只针对「旺财」
- **AND** 只展示「旺财」一个 tag

#### Scenario: 无激活行程匹配全部宠物

- **GIVEN** 用户无激活行程且有两只宠物
- **WHEN** 用户浏览需要政策匹配的页面
- **THEN** 系统分别对两只宠物给出结论
- **AND** 以两个宠物名 tag 展示

#### Scenario: 宠物缓存加载中

- **GIVEN** 用户有激活行程且宠物缓存尚未就绪
- **WHEN** 页面渲染政策 tag
- **THEN** 系统展示加载状态
- **AND** 不使用其他宠物替代

#### Scenario: 宠物数据加载失败

- **GIVEN** 宠物接口请求失败
- **WHEN** 页面渲染政策匹配
- **THEN** 系统提示暂时无法读取宠物
- **AND** 不展示"无宠物"提示

#### Scenario: 无法判定

- **GIVEN** 激活宠物为猫或没有犬种信息
- **WHEN** 页面展示城市禁养犬种匹配
- **THEN** 该宠物 tag 显示"无法判定"
- **AND** 不显示"友好"或"不友好"

### Requirement: 大交通方式面板标签

行程面板顶部 SHALL 在 active trip 已选择大交通方式时展示对应的“大交通” tag，并使用该方式的中文名称；未选择时 MUST NOT 展示该 tag。

#### Scenario: 已选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为 `flight`
- **WHEN** 行程面板渲染
- **THEN** 面板顶部展示包含“大交通”和“飞机”的 tag

#### Scenario: 尚未选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为空
- **WHEN** 行程面板渲染
- **THEN** 面板顶部不展示大交通 tag

### Requirement: 创建行程确认弹窗

选定城市后，系统 SHALL 打开创建行程对话框，固定展示所选城市，并收集开始日期、结束日期与携带宠物。日期 MUST 完整，按含首尾计算的天数 MUST 为 1–7 的整数；宠物 MUST 为当前用户的一只宠物，默认选中第一只。城市 MUST NOT 可编辑。用户确认时系统 SHALL 调用 `POST /api/trips`，成功后把返回详情设为激活行程、写入 `activeTripId`、失效 Trips 列表查询并跳转 `/attractions`；行程名 SHALL 由城市、天数与宠物名自动生成。取消 MUST NOT 调用创建接口或改变激活行程。起止日期当前 MUST NOT 持久化到行程，行程只保存 `totalDays`。

#### Scenario: 确认城市、日期与宠物

- **GIVEN** 用户已选定杭州，填写 2026-12-01 至 2026-12-03，并选择宠物「豆豆」
- **WHEN** 用户点击「确定」
- **THEN** 系统调用 `POST /api/trips`
- **AND** 创建 `totalDays=3` 的杭州行程
- **AND** 该行程成为激活行程并写入 `activeTripId`
- **AND** 页面跳转 `/attractions`

#### Scenario: 取消不写入

- **GIVEN** 用户已打开创建行程对话框并填写日期
- **WHEN** 用户点击「取消」
- **THEN** 对话框关闭
- **AND** 不调用 `POST /api/trips`
- **AND** 当前激活行程保持不变

#### Scenario: 日期范围无效

- **GIVEN** 用户在对话框中选择的日期推导出 0 天、负数天或超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统展示 1–7 天的错误提示
- **AND** 对话框保持打开且不创建行程

#### Scenario: 默认宠物

- **GIVEN** 用户有两只宠物「豆豆」与「毛毛」
- **WHEN** 用户打开创建行程对话框
- **THEN** 携带宠物默认选中「豆豆」
- **AND** 用户可切换为「毛毛」

#### Scenario: 无宠物不可创建

- **GIVEN** 用户没有任何宠物档案
- **WHEN** 用户打开创建行程对话框
- **THEN** 系统提示先添加宠物
- **AND** 「确定」不可用

### Requirement: Trips 页与单城市激活

系统 SHALL 提供受登录保护的 `/trips` 页面，列出当前用户的全部已持久化行程，按 `id` 升序展示城市、天数、宠物与激活状态，并提供激活、取消激活与删除操作。同一时间 MUST 最多存在一个激活行程；存在激活行程时 MUST NOT 创建新行程，`/cities` 的「选定」入口 MUST 不可用，只有取消激活后才能重新创建。激活行程时系统 SHALL 拉取详情并写入 store；删除激活中的行程 MUST 先取消激活再调用 `DELETE /api/trips/{id}`。系统 MUST NOT 再通过城市候选页创建草稿。

#### Scenario: 列出本人行程

- **GIVEN** 用户有两个已持久化行程
- **WHEN** 用户打开 `/trips`
- **THEN** 页面按 `id` 升序展示两个行程
- **AND** 每个行程显示城市、天数与宠物
- **AND** 激活中的行程带有激活标识

#### Scenario: 激活已有行程

- **GIVEN** 用户无激活行程并打开 `/trips`
- **WHEN** 用户点击某行程的激活
- **THEN** 系统请求该行程详情并写入 store
- **AND** `activeTripId` 被写入 localStorage

#### Scenario: 取消激活后可创建

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 取消激活
- **THEN** 系统清除 `active` 与 `activeTripId`
- **AND** 用户可在 `/cities` 重新创建行程

#### Scenario: 激活期间不可创建

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示候选列表与政策入口
- **AND** 「选定」不可用，并提示先在 Trips 取消激活

#### Scenario: 删除激活中的行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 确认删除该行程
- **THEN** 系统先取消激活
- **AND** 调用 `DELETE /api/trips/{id}`
- **AND** 成功后该行程从列表移除
