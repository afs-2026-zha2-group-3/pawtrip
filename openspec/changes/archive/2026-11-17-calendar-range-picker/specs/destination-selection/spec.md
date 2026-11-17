# Spec Delta

## MODIFIED Requirements

### Requirement: 选定城市与创建行程确认

用户 SHALL 可通过候选卡片的「选定」打开创建行程对话框。对话框 SHALL 固定展示所选城市作为目的地，并在单一日历上依次选择开始日期与结束日期，同时选择携带宠物；城市 MUST 不可编辑，宠物 MUST 为当前用户的一只宠物且默认选中第一只，日期 MUST 完整且推导出的行程天数在 1–7 之间。确认时系统 SHALL 调用 `POST /api/trips` 创建行程，成功后将其设为激活行程、写入 `activeTripId`，并跳转 `/attractions`。取消对话框 MUST NOT 产生任何写入或导航。系统同一时间只支持一个激活行程：存在激活行程时 MUST NOT 打开创建对话框或创建新行程，「选定」MUST 不可用，用户需先在 `/trips` 取消激活。系统 MUST NOT 在此路径创建草稿。

#### Scenario: 打开对话框后取消

- **GIVEN** 用户位于 `/cities`
- **WHEN** 用户点击杭州卡片的「选定」并点击「取消」
- **THEN** 对话框关闭
- **AND** 页面停留在候选列表
- **AND** 不发送 `POST /api/trips`

#### Scenario: 确认后创建行程并进入景点页

- **GIVEN** 用户已选定杭州、在日历上选择有效日期并选择宠物「豆豆」
- **WHEN** 用户点击「确定」
- **THEN** 系统调用 `POST /api/trips` 并创建杭州行程
- **AND** 行程成为激活行程且写入 `activeTripId`
- **AND** 页面跳转到 `/attractions` 并展示杭州市景点
- **AND** 左下角行程面板展示杭州、天数与豆豆

#### Scenario: 日期范围推导天数

- **GIVEN** 用户在对话框中选择同一天作为开始与结束日期
- **WHEN** 用户查看天数提示
- **THEN** 系统提示行程共 1 天
- **AND** 行程创建后 `totalDays` 为 1

#### Scenario: 拒绝非法日期范围

- **GIVEN** 用户只选择了开始日期，或所选天数超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统展示对应错误提示
- **AND** 对话框保持打开且不发送 `POST /api/trips`

#### Scenario: 没有宠物档案

- **GIVEN** 当前用户没有宠物档案
- **WHEN** 用户打开创建行程对话框
- **THEN** 系统提示先在 Paws 添加宠物
- **AND** 「确定」不可用

#### Scenario: 存在激活行程时不可选定新城市

- **GIVEN** 用户存在一个激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 候选卡片的「选定」不可用
- **AND** 页面提示先在 Trips 取消激活
- **AND** 不发送 `POST /api/trips`
