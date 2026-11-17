# attraction-pet-rules Specification

## Purpose
定义已选目的地城市下景点列表、景点详情与现有携宠政策字段的公开只读契约，包括 `maxPetsPerPerson` 三态、字段展示语义与数据库查询边界，使用户在到访前判断能否带宠物进入。

## Requirements

### Requirement: 已选城市下的景点列表

系统 SHALL 为已登录用户提供 `/attractions` 页面，读取用户已选定的目的地城市并展示该城市已保存的景点。页面 MUST NOT 提供城市选择控件。未选定目的地时，页面 MUST 提示先选择目的地并提供前往 `/cities` 的入口，且 MUST NOT 请求景点列表。列表 MUST 只包含 `type_group='attraction'` 的已保存地点，MUST 只读取数据库，MUST NOT 调用高德 API。

#### Scenario: 已选城市展示景点

- **GIVEN** 用户已在 `/cities` 选定珠海
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面显示珠海范围内的已保存景点
- **AND** 不显示其他城市的景点

#### Scenario: 未选择目的地

- **GIVEN** 用户未选定目的地
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面提示先选择目的地
- **AND** 提供前往 `/cities` 的入口
- **AND** 不发起景点列表请求

#### Scenario: 非景点类型不进入列表

- **GIVEN** 已选城市存在酒店、餐厅、宠物医院或宠物用品店
- **WHEN** 用户打开 `/attractions`
- **THEN** 这些非景点地点不出现

#### Scenario: 城市无已保存景点

- **GIVEN** 已选城市没有已保存景点
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面显示“该城市暂无已保存景点”

#### Scenario: 只读数据库

- **GIVEN** 用户浏览景点列表
- **WHEN** 后端处理请求
- **THEN** 只读取数据库中的已保存地点
- **AND** 不调用高德 POI API

### Requirement: 宠物友好口径与切换

景点列表默认 SHALL 只展示 `maxPetsPerPerson >= 1` 的景点；用户 SHALL 可切换显示该城市全部已保存景点。列表项 SHALL 按 `maxPetsPerPerson` 展示三态：`>= 1` → “宠物友好”，`0` → “禁止携带”，`NULL` → “未配置”。

#### Scenario: 默认只显示宠物友好景点

- **GIVEN** 已选城市有景点 A（`maxPetsPerPerson=1`）与景点 B（`maxPetsPerPerson=0`）
- **WHEN** 用户打开 `/attractions`
- **THEN** 列表显示 A 与“宠物友好”
- **AND** 不显示 B

#### Scenario: 切换显示全部景点

- **GIVEN** 列表默认只显示宠物友好景点
- **WHEN** 用户打开“显示全部景点”
- **THEN** 该城市全部已保存景点出现在列表中

#### Scenario: 三态 badge

- **GIVEN** 列表项分别为 `maxPetsPerPerson >= 1`、`0`、`NULL`
- **WHEN** 列表渲染
- **THEN** 分别显示“宠物友好”“禁止携带”“未配置”

#### Scenario: 无友好景点空态

- **GIVEN** 已选城市有已保存景点，但没有 `maxPetsPerPerson >= 1` 的景点
- **WHEN** 用户以默认口径打开 `/attractions`
- **THEN** 页面显示“该城市暂无宠物友好的已保存景点”
- **AND** 提示可切换显示全部景点

### Requirement: 景点详情与携宠政策展示

系统 SHALL 在 `/attractions/{poiId}` 展示已保存景点的名称、类型、地址、`maxPetsPerPerson` 三态与所有非空政策字段。全部政策字段为空时 MUST 展示“暂无携宠政策”。页面 MUST NOT 提供编辑、保存或删除入口。

#### Scenario: 展示三态与字段

- **GIVEN** 景点已配置 `maxPetsPerPerson` 与部分政策字段
- **WHEN** 用户打开景点详情
- **THEN** 页面显示对应的“宠物友好/禁止携带/未配置”状态
- **AND** 显示所有非空政策字段

#### Scenario: 只展示非空字段

- **GIVEN** 景点的体重、费用与布尔字段均为 `NULL`
- **WHEN** 用户打开景点详情
- **THEN** 对应字段不展示
- **AND** 不显示空标签或“null”

#### Scenario: 无政策景点详情

- **GIVEN** 景点的全部政策字段均为空
- **WHEN** 用户打开景点详情
- **THEN** 页面显示“暂无携宠政策”

#### Scenario: 不提供编辑入口

- **GIVEN** 用户打开景点详情
- **WHEN** 页面渲染
- **THEN** 不显示编辑、保存或删除操作

### Requirement: 政策字段的展示语义

详情中的政策字段 SHALL 按以下语义展示：允许宠物类型 `CAT`/`DOG`/`CAT,DOG` 使用“猫/狗/猫和狗”；`maxPetsPerPerson` 使用“X 只 / 人”；布尔 `true`/`false` 使用“需要/不需要”；`NULL` 字段 MUST NOT 展示；费用 MUST 由分换算为元并标注“元 / 只 / 次”；体重使用 kg，肩高使用 cm。

#### Scenario: 数量与允许类型

- **GIVEN** `maxPetsPerPerson=1` 且 `allowedPetTypes='DOG'`
- **WHEN** 详情渲染
- **THEN** 显示“1 只 / 人”与“狗”

#### Scenario: 布尔三态

- **GIVEN** 布尔字段为 `true`、`false` 或 `NULL`
- **WHEN** 详情渲染
- **THEN** 分别显示“需要”“不需要”，或该行不展示

#### Scenario: 费用换算

- **GIVEN** `extraFeeCents` 为 `1050` 或 `1`
- **WHEN** 详情渲染
- **THEN** 分别显示 `10.5 元 / 只 / 次` 与 `0.01 元 / 只 / 次`

#### Scenario: 空值隐藏

- **GIVEN** 任一政策字段为 `NULL`
- **WHEN** 详情渲染
- **THEN** 该字段不展示

### Requirement: 景点与地点只读查询 API

系统 SHALL 提供仅登录用户可访问的只读接口：`GET /api/locations/attractions` 接受必填 `regionCode`、可选 `includeWithoutRules`（默认 `false`）与分页参数，返回该城市景点分页；`GET /api/locations/{poiId}` 返回已保存地点详情与 `petPolicies`（现有 8 个可空字段）。接口 MUST 只读取数据库，MUST NOT 调用高德；MUST NOT 新增数据库列或迁移。未认证 MUST 返回 `401 UNAUTHENTICATED`；不存在的 `poiId` MUST 返回 `404 LOCATION_NOT_FOUND`；缺失或非法 `regionCode` MUST 返回 `400`。接口 MUST NOT 要求 `ADMIN` 角色。

#### Scenario: 默认列表

- **WHEN** 已登录用户请求 `GET /api/locations/attractions?regionCode=440400`
- **THEN** 返回该城市 `maxPetsPerPerson >= 1` 的景点分页
- **AND** 不返回其他城市或非景点数据

#### Scenario: 包含非友好景点

- **WHEN** 请求包含 `includeWithoutRules=true`
- **THEN** 返回该城市全部已保存景点
- **AND** 条目包含可空的 `maxPetsPerPerson`

#### Scenario: 读取详情

- **WHEN** 已登录用户请求已保存景点的 `GET /api/locations/{poiId}`
- **THEN** 返回基础信息与 `petPolicies`
- **AND** `petPolicies` 包含 8 个可空政策字段

#### Scenario: 未认证

- **WHEN** 未登录用户请求任一接口
- **THEN** 返回 `401 UNAUTHENTICATED`

#### Scenario: 地点不存在

- **WHEN** 请求不存在的 `poiId`
- **THEN** 返回 `404 LOCATION_NOT_FOUND`

#### Scenario: 城市参数非法

- **WHEN** 请求缺失或非法的 `regionCode`
- **THEN** 返回 `400`
- **AND** 不返回其他城市数据

#### Scenario: 不调用高德

- **WHEN** 用户读取景点列表或详情
- **THEN** 后端只读取数据库
- **AND** 不请求高德 POI API

#### Scenario: 普通用户可读

- **GIVEN** 当前用户已登录且角色为 `USER`
- **WHEN** 请求景点列表或详情
- **THEN** 正常返回数据
- **AND** 不要求 `ADMIN` 角色

### Requirement: 景点页入口与自动跳转

`/cities` 页面在用户选定目的地后 SHALL 更新已选目的地并自动进入 `/attractions`。城市浏览页 MUST NOT 内嵌景点列表或提供额外的“查看景点”入口按钮；景点浏览入口为顶部“景区浏览”Tab（详见 `web-app-shell` delta）。

#### Scenario: 选定城市后自动进入景区浏览

- **GIVEN** 用户位于 `/cities`
- **WHEN** 用户选定珠海
- **THEN** 浏览器地址变为 `/attractions`
- **AND** 顶部“景区浏览”Tab 处于选中状态
- **AND** 页面展示珠海市景点

#### Scenario: 城市浏览页不内嵌景点入口

- **GIVEN** 用户位于 `/cities`
- **WHEN** 页面渲染
- **THEN** 页面不展示景点列表
- **AND** 不展示“查看{城市}景点”按钮

#### Scenario: 未选定目的地打开景区浏览

- **GIVEN** 用户尚未选定目的地
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面提示先选择目的地
- **AND** 提供前往 `/cities` 的入口
