## MODIFIED Requirements

### Requirement: 行程上下文下的景点列表

`/attractions` SHALL 以当前激活行程的城市为唯一查询上下文，禁止页面内城市选择控件与独立的天数选择控件。存在激活行程时，列表 MUST 按 `active.cityAdcode` 请求该城市已保存景点；不存在激活行程或仅有未确认草稿时，页面 MUST 展示"先创建或激活行程"空态，MUST NOT 请求景点列表。列表页 MUST NOT 展示天数 Tabs；加入天数的选择 MUST 由每个地点的「添加到行程」选择器承担。

#### Scenario: 激活行程后展示该城市景点

- **GIVEN** 用户存在城市为杭州的激活行程
- **WHEN** 用户打开 `/attractions`
- **THEN** 列表只请求并展示杭州的景点
- **AND** 不展示城市选择控件

#### Scenario: 无激活行程

- **GIVEN** 用户没有激活行程
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示"先创建或激活行程"空态
- **AND** 不发起景点列表请求

#### Scenario: 未确认草稿不可浏览

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示"先创建或激活行程"空态
- **AND** 不发起景点列表请求

#### Scenario: 列表不展示天数控件

- **GIVEN** 激活行程 `totalDays=3`
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面不展示第 1 天、第 2 天或第 3 天的 Tabs
- **AND** 每张景点卡片展示「添加到行程」选择器

### Requirement: 加入行程与未排期

景点列表卡片与详情弹窗 SHALL 提供「添加到行程」选择器与「暂不排期」两个加入入口。「添加到行程」触发器 SHALL 恒显固定文案，MUST NOT 预选任何天；选项 MUST 覆盖 `1..active.totalDays`，文案为「第 N 天」。用户选中某天后，系统 MUST 立即把该地点追加到对应 `day.stops` 末尾，MUST NOT 要求二次确认；选择器 MUST 在选择后立即复位为未选中态，以支持连续加入。选择暂不排期时地点 MUST 追加到 `unscheduled`。系统 MUST 允许同一 `poiId` 在同一天重复加入，MUST NOT 做去重；同一 `poiId` 同时存在于 `days` 与 `unscheduled` 时 MUST 以已排期为准。加入操作 MUST 受"行程已确认"前置条件约束，未确认草稿 MUST 不展示加入入口。

#### Scenario: 选择天数加入

- **GIVEN** 激活行程 `totalDays=3`
- **WHEN** 用户点击某景点的「添加到行程」并选择第 2 天
- **THEN** 该景点追加到 `plan.days` 第 2 天的 `stops` 末尾
- **AND** 行程面板立即显示该地点
- **AND** 选择器复位为未选中态

#### Scenario: 选项来自总天数

- **GIVEN** 激活行程 `totalDays=2`
- **WHEN** 用户打开某景点的「添加到行程」选择器
- **THEN** 只展示「第 1 天」与「第 2 天」两个选项
- **AND** 不展示第 3 天及以后的选项

#### Scenario: 暂不排期

- **GIVEN** 用户存在激活行程
- **WHEN** 用户点击某景点的「暂不排期」
- **THEN** 该景点追加到 `plan.unscheduled`
- **AND** 行程面板的"未排期"分组显示该地点

#### Scenario: 同一天重复加入

- **GIVEN** 第 1 天已包含某景点
- **WHEN** 用户再次通过选择器把该景点加入第 1 天
- **THEN** 第 1 天保留两条相同 `poiId` 的记录
- **AND** 不出现去重或报错

#### Scenario: 已排期优先

- **GIVEN** 某景点同时出现在 `days` 与 `unscheduled`
- **WHEN** 计划被保存或规范化
- **THEN** 该景点只保留在 `days`
- **AND** 从 `unscheduled` 移除

#### Scenario: 未确认草稿无加入入口

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户浏览景点页
- **THEN** 页面不展示「添加到行程」或「暂不排期」

## ADDED Requirements

### Requirement: 景点详情以弹窗展示

景点详情 MUST 在 `/attractions` 列表页内以模态弹窗展示。点击卡片「查看详情」MUST 打开弹窗，MUST NOT 跳转独立路由或改变页面 URL。弹窗 MUST 展示景点名、地址、宠物友好结论、政策字段与逐宠物 tag，并 MUST 保留「添加到行程」与「暂不排期」。弹窗 MUST 支持关闭按钮、Esc 键与点击遮罩关闭。关闭弹窗后，列表的筛选状态、分页位置与内容 MUST 保持不变。系统 MUST NOT 再提供 `/attractions/$poiId` 独立详情路由。

#### Scenario: 打开详情弹窗

- **GIVEN** 用户在 `/attractions` 列表页
- **WHEN** 用户点击某景点的「查看详情」
- **THEN** 弹窗展示该景点的政策字段与逐宠物 tag
- **AND** 页面 URL 仍为 `/attractions`

#### Scenario: 关闭后保留列表状态

- **GIVEN** 用户已勾选"显示全部景点"并翻到第 2 页
- **WHEN** 用户打开并关闭某景点详情弹窗
- **THEN** 列表仍处于第 2 页且"显示全部景点"仍保持勾选

#### Scenario: 关闭方式

- **GIVEN** 详情弹窗处于打开状态
- **WHEN** 用户点击关闭按钮、按 Esc 键或点击遮罩
- **THEN** 弹窗关闭并回到列表

#### Scenario: 详情不再占用独立路由

- **GIVEN** 用户从列表打开景点详情弹窗
- **WHEN** 用户观察地址栏
- **THEN** 不产生 `/attractions/$poiId` 形式的独立路由跳转
