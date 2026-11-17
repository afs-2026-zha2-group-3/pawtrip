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
