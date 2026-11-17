# Spec Delta

## REMOVED Requirements

### Requirement: 目的地候选列表

**Reason**: 候选列表不再因激活行程或草稿切换为城市详情，且卡片新增「查看政策」入口；由「候选列表与政策入口」替代。

**Migration**: 政策内容通过卡片「查看政策」进入政策页；候选列表、搜索与筛选在任意行程状态下都可用。

### Requirement: 选定目的地与规划上下文

**Reason**: 选城不再创建可编辑草稿，改为确认弹窗直接创建并激活行程并跳转景点页；由「选定城市与创建行程确认」替代。

**Migration**: 用户在弹窗内确认城市、日期与宠物后直接创建行程；如放弃，关闭弹窗即可留在候选列表。

### Requirement: 激活行程下的城市详情

**Reason**: 需求方要求政策只通过「查看政策」入口查看，选城后直接进入景点选择；中间的城市详情视图不再存在。

**Migration**: 政策内容通过候选卡片的「查看政策」链接进入政策页；行程城市与天数在左下角行程面板与 Trips 页查看。

## ADDED Requirements

### Requirement: 候选列表与政策入口

系统 SHALL 在受登录保护的 `/cities` 页面始终展示候选列表，候选范围为全部城市级行政区（含珠海与杭州），不受是否存在激活行程或草稿影响。每张候选卡片 SHALL 展示城市名与所属省份，并提供「选定」与「查看政策」两个入口；「查看政策」SHALL 链接到 `/destinations/{adcode}/policy`。候选数据 SHALL 来自服务端接口，未认证请求 SHALL 返回 `401 UNAUTHENTICATED`。政策收录状态 Badge 暂缓展示（TODO：政策数据源确定后恢复）。页面 MUST NOT 内嵌政策要点、禁养犬种名单或可携带犬种名单。

#### Scenario: 打开目的地选择页

- **GIVEN** 已登录用户且无激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示城市级行政区候选卡片（含杭州与珠海）
- **AND** 每张卡片显示城市名、省份、「选定」与「查看政策」
- **AND** 页面展示搜索框与宠物友好筛选

#### Scenario: 未认证请求候选接口

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求城市候选接口
- **THEN** 返回 `401` 与 Problem Details `code=UNAUTHENTICATED`

#### Scenario: 存在激活行程时仍展示候选

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面仍展示候选卡片、搜索框与筛选开关
- **AND** 用户可再次选定其他城市创建新行程

#### Scenario: 从候选卡片进入政策页

- **GIVEN** 用户位于 `/cities` 且珠海市在候选中
- **WHEN** 用户点击珠海卡片的「查看政策」
- **THEN** 页面跳转到 `/destinations/440400/policy`
- **AND** 展示珠海市养宠政策

#### Scenario: 候选页不内嵌政策内容

- **GIVEN** 用户位于 `/cities`
- **WHEN** 页面渲染候选卡片
- **THEN** 页面不展示政策要点、禁养犬种名单或可携带犬种名单

### Requirement: 选定城市与创建行程确认

用户 SHALL 可通过候选卡片的「选定」打开创建行程对话框。对话框 SHALL 固定展示所选城市作为目的地，并收集开始日期、结束日期与携带宠物；城市 MUST 不可编辑，宠物 MUST 为当前用户的一只宠物且默认选中第一只，日期 MUST 完整且推导出的行程天数在 1–7 之间。确认时系统 SHALL 调用 `POST /api/trips` 创建行程，成功后将其设为激活行程、写入 `activeTripId`，并跳转 `/attractions`。取消对话框 MUST NOT 产生任何写入或导航。存在激活行程 MUST NOT 阻止用户选定新城市；新行程确认后成为当前激活行程。系统 MUST NOT 在此路径创建草稿。

#### Scenario: 打开对话框后取消

- **GIVEN** 用户位于 `/cities`
- **WHEN** 用户点击杭州卡片的「选定」并点击「取消」
- **THEN** 对话框关闭
- **AND** 页面停留在候选列表
- **AND** 不发送 `POST /api/trips`

#### Scenario: 确认后创建行程并进入景点页

- **GIVEN** 用户已选定杭州、填写有效日期并选择宠物「豆豆」
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

- **GIVEN** 用户在对话框中填写结束日期早于开始日期，或天数超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统展示对应错误提示
- **AND** 对话框保持打开且不发送 `POST /api/trips`

#### Scenario: 没有宠物档案

- **GIVEN** 当前用户没有宠物档案
- **WHEN** 用户打开创建行程对话框
- **THEN** 系统提示先在 Paws 添加宠物
- **AND** 「确定」不可用

#### Scenario: 已有激活行程时选定新城市

- **GIVEN** 用户存在一个激活行程
- **WHEN** 用户选定另一城市并确认对话框
- **THEN** 系统创建并激活新行程
- **AND** 原行程保留在 Trips 列表
