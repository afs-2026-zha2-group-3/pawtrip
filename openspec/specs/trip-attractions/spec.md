# trip-attractions Specification

## Purpose

TBD - created by syncing the add-frontend-trip-context change. This capability defines attraction browsing under the active trip context: the city and day tabs come from the active trip, list items carry full `petPolicies`, adding a stop writes to the active trip plan, and attraction policy matching uses the unified pet matching subject.

## Requirements

### Requirement: 行程上下文下的景点列表

`/attractions` SHALL 以当前激活行程的城市为唯一查询上下文，禁止页面内城市选择控件。存在激活行程时，列表 MUST 按 `active.cityAdcode` 请求该城市已保存景点；不存在激活行程或仅有未确认草稿时，页面 MUST 展示"先创建或激活行程"空态，MUST NOT 请求景点列表。天 tab MUST 由 `active.totalDays` 生成，并与 `plan.days` 的 `day` 一一对应；切换天 tab 只改变页面当前天，不修改 `plan`。

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

#### Scenario: 天 tab 来自总天数

- **GIVEN** 激活行程 `totalDays=3`
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示第 1 天、第 2 天与第 3 天三个 tab
- **AND** 不展示第 4 天及以后

### Requirement: 景点列表政策字段与逐宠物 tag

`GET /api/locations/attractions` 的每个列表项 SHALL 在既有字段之外包含 `petPolicies`，字段 SHALL 与景点详情一致：`allowedPetTypes`、`maxPetsPerPerson`、`maxSinglePetWeightKg`、`maxSinglePetShoulderHeightCm`、`leashRequired`、`vaccinationProofRequired`、`extraFeeCents`、`reservationRequired`。既有字段与筛选参数 MUST 保持不变。景点列表卡片 SHALL 按统一政策匹配主体逐宠物展示 tag：存在激活宠物时只展示该宠物的结论，否则展示全部宠物的结论。列表仍 SHALL 保留"宠物友好/显示全部景点"的既有筛选能力。

#### Scenario: 列表项携带政策

- **GIVEN** 已登录用户请求景点列表
- **WHEN** 响应返回
- **THEN** 每个列表项包含完整 `petPolicies`
- **AND** 既有 `poiId`、`name`、`address`、`maxPetsPerPerson` 等字段保持不变

#### Scenario: 激活行程逐宠物 tag

- **GIVEN** 用户存在带宠物「旺财」的激活行程
- **WHEN** 景点列表渲染卡片
- **THEN** 每张卡片显示「旺财」的政策结论 tag
- **AND** 不显示其他宠物的 tag

#### Scenario: 无激活行程全部宠物 tag

- **GIVEN** 用户无激活行程且有两只宠物
- **WHEN** 景点列表渲染卡片
- **THEN** 每张卡片分别显示两只宠物的结论 tag

#### Scenario: 政策未配置

- **GIVEN** 某景点政策字段均为 null 或未配置
- **WHEN** 卡片渲染该景点
- **THEN** 对应宠物 tag 显示"未配置"
- **AND** 不显示"友好"或"不友好"

### Requirement: 加入行程与未排期

景点列表卡片与详情 SHALL 提供"加入第 N 天"与"暂不排期"两个加入入口；"加入第 N 天"的 N MUST 取页面当前选中的天 tab。加入操作 MUST 写入激活行程的 `plan`：选择天时追加到对应 `day.stops` 末尾，选择暂不排期时追加到 `unscheduled`。系统 MUST 允许同一 `poiId` 在同一天重复加入，MUST NOT 做去重；同一 `poiId` 同时存在于 `days` 与 `unscheduled` 时 MUST 以已排期为准。加入操作 MUST 受"行程已确认"前置条件约束，未确认草稿 MUST 不展示加入入口。

#### Scenario: 加入当前天

- **GIVEN** 用户在 `/attractions` 选中第 2 天
- **WHEN** 用户点击某景点的"加入第 2 天"
- **THEN** 该景点追加到 `plan.days` 第 2 天的 `stops` 末尾
- **AND** 行程面板立即显示该地点

#### Scenario: 暂不排期

- **GIVEN** 用户存在激活行程
- **WHEN** 用户点击某景点的"暂不排期"
- **THEN** 该景点追加到 `plan.unscheduled`
- **AND** 行程面板的"未排期"分组显示该地点

#### Scenario: 同一天重复加入

- **GIVEN** 第 1 天已包含某景点
- **WHEN** 用户再次把该景点加入第 1 天
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
- **THEN** 页面不展示"加入第 N 天"或"暂不排期"

### Requirement: 景点详情政策匹配

景点详情 SHALL 在展示既有政策字段的同时，按统一政策匹配主体给出逐宠物结论 tag。存在激活宠物时 MUST 只针对该宠物判定；否则 MUST 针对全部宠物判定。判定 SHALL 覆盖类型、每人限养数、单只最大体重、单只最大肩高、牵引与疫苗要求；`null` 字段表示未配置，MUST 跳过对应维度。额外费用与预约要求 SHALL 继续以字段形式展示，不参与 tag 的友好/不友好结论。

#### Scenario: 激活宠物命中限制

- **GIVEN** 激活宠物体重 30kg，景点 `maxSinglePetWeightKg=20`
- **WHEN** 用户打开景点详情
- **THEN** 该宠物 tag 显示不友好
- **AND** 展示体重超限的具体原因

#### Scenario: 全部维度满足

- **GIVEN** 激活宠物的类型、体重、肩高均满足景点政策，且牵引与疫苗要求已满足
- **WHEN** 用户打开景点详情
- **THEN** 该宠物 tag 显示友好

#### Scenario: 未配置维度跳过

- **GIVEN** 景点 `maxSinglePetWeightKg` 为 null
- **WHEN** 系统判定该宠物的匹配
- **THEN** 体重维度被跳过
- **AND** 不因体重缺失将结论判为不友好

#### Scenario: 无激活行程逐只判定

- **GIVEN** 用户无激活行程且有多只宠物
- **WHEN** 用户打开景点详情
- **THEN** 页面为每只宠物展示一个结论 tag