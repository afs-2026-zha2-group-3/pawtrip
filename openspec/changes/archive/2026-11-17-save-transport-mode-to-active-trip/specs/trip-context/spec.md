# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
