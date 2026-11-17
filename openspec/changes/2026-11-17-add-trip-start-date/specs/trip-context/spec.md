# Spec Delta

## MODIFIED Requirements

### Requirement: 激活行程上下文与持久化

系统 SHALL 使用 TanStack Store 保存当前激活行程，`active` 对象 MUST 与后端 trip 的 DB 字段同构（`id`、`name`、`cityAdcode`、`petId`、`totalDays`、`startDate`、`plan`、`transportMode`、`createdAt`、`updatedAt`），MAY 额外保存城市、宠物与地点详情缓存。浏览器端 MUST 只持久化 `activeTripId`；行程内容与缓存 MUST NOT 写入持久化存储。登录成功后系统 SHALL 按 `activeTripId` 拉取详情并写入 store；详情返回 `404` 或 `401` 时 MUST 清除 `activeTripId` 与本地行程状态；登出 MUST 清除 `activeTripId` 与行程相关缓存。

#### Scenario: 刷新后恢复激活行程

- **GIVEN** 用户有一个激活行程且 localStorage 保存了 `activeTripId`
- **WHEN** 用户刷新页面并完成登录态恢复
- **THEN** 系统请求 `GET /api/trips/{id}`
- **AND** 成功后 store 的 `active` 包含该行程的完整字段、`plan` 与 `transportMode`
- **AND** `active.startDate` 与服务端返回一致

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

激活行程的计划或大交通方式变更 SHALL 先乐观更新 store，再以约 600ms 防抖合并为一次 `PUT /api/trips/{id}`，请求体 MUST 包含 `{ name, totalDays, startDate, plan, transportMode }`。面板 SHALL 展示 `保存中`、`已保存` 或 `保存失败` 状态。保存失败时 MUST 保留本地改动并提供重试；服务端返回 `400 VALIDATION_ERROR` 时 MUST 重新拉取详情并以服务端数据为准。系统 MUST NOT 引入乐观锁，整量更新为后写覆盖。

#### Scenario: 乐观更新

- **GIVEN** 用户激活了一个行程
- **WHEN** 用户加入一个地点
- **THEN** 面板立即显示该地点
- **AND** 在防抖窗口内不发送请求

#### Scenario: 防抖合并保存

- **GIVEN** 用户在 600ms 内连续进行多次拖拽
- **WHEN** 防抖窗口结束
- **THEN** 系统只发送一次 `PUT`
- **AND** 请求体包含最终 `plan`、当前 `transportMode` 与 `startDate`

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

### Requirement: 创建行程确认弹窗

选定城市后，系统 SHALL 打开创建行程对话框，固定展示所选城市，并在单一日历上依次选择开始日期与结束日期，同时选择携带宠物。日期 MUST 完整，按含首尾计算的天数 MUST 为 1–7 的整数；宠物 MUST 为当前用户的一只宠物，默认选中第一只。城市 MUST NOT 可编辑。用户确认时系统 SHALL 调用 `POST /api/trips`，成功后把返回详情设为激活行程、写入 `activeTripId`、失效 Trips 列表查询并跳转 `/attractions`；行程名 SHALL 由城市、天数与宠物名自动生成。取消 MUST NOT 调用创建接口或改变激活行程。系统 SHALL 把所选开始日期作为 `startDate` 持久化到行程；结束日期 MUST 由 `totalDays` 派生，MUST NOT 单独持久化。

#### Scenario: 确认城市、日期与宠物

- **GIVEN** 用户已选定杭州，在日历上选择 2026-12-01 至 2026-12-03，并选择宠物「豆豆」
- **WHEN** 用户点击「确定」
- **THEN** 系统调用 `POST /api/trips`
- **AND** 创建 `totalDays=3` 且 `startDate=2026-12-01` 的杭州行程
- **AND** 该行程成为激活行程并写入 `activeTripId`
- **AND** 页面跳转 `/attractions`

#### Scenario: 开始日期随行程保留

- **GIVEN** 用户用 2026-12-01 至 2026-12-03 创建并激活了行程
- **WHEN** 用户刷新页面
- **THEN** 系统拉取行程详情
- **AND** 激活行程仍包含 `startDate=2026-12-01` 与 `totalDays=3`

#### Scenario: 取消不写入

- **GIVEN** 用户已打开创建行程对话框并在日历上选择日期
- **WHEN** 用户点击「取消」
- **THEN** 对话框关闭
- **AND** 不调用 `POST /api/trips`
- **AND** 当前激活行程保持不变

#### Scenario: 日期范围无效

- **GIVEN** 用户只选择了开始日期，或所选区间推导出超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统提示需要完整的日期范围且天数为 1–7
- **AND** 对话框保持打开且不创建行程

#### Scenario: 重新选择日历范围

- **GIVEN** 用户已在日历上选择了开始与结束日期
- **WHEN** 用户再点击一个日期
- **THEN** 该日期成为新的开始日期
- **AND** 结束日期清空，等待用户重新选择

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
