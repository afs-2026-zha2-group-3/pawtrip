# Spec Delta

## REMOVED Requirements

### Requirement: 草稿创建与确认

**Reason**: 选城路径改为「创建行程确认弹窗」，确认即创建并激活行程，不再经过可编辑的未确认草稿；草稿相关的用户流程与 E2E 一并移除。

**Migration**: 用户在候选卡片点击「选定」后在弹窗内确认城市、日期与宠物，系统直接调用 `POST /api/trips` 并跳转 `/attractions`。行程城市、天数与宠物在左下角面板只读展示。

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Trips 页与激活生命周期

**Reason**: 草稿用户路径已移除，原需求中的草稿阻止激活与「激活期间只展示城市详情」描述不再成立；由「Trips 页与单城市激活」替代，保留单激活行程语义。

**Migration**: 用户仍通过 Trips 页激活、取消激活与删除行程；存在激活行程时 `/cities` 仍展示候选但「选定」不可用，需先取消激活。

## ADDED Requirements

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

## MODIFIED Requirements

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
