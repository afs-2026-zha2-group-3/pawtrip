# Spec Delta

## ADDED Requirements

### Requirement: 地点地图展示与列表联动

地点页 SHALL 在配置高德 JS API 2.0 后展示地图列，并显示当前城市、地点类型、宠物友好/显示全部及锚点 5km 筛选下的全部点位。地图点位 SHALL 复用共享地点列表接口，按每页 100 条取完全部分页，MUST NOT 只显示列表当前页。marker 点击 SHALL 高亮对应列表卡片并打开基础信息窗口（名称、类型、地址、锚点距离）；列表卡片 SHALL 提供“在地图查看”操作，触发地图定位到对应 marker。筛选条件变化 SHALL 更新地图点位。未配置 JS Key 或 SDK 加载失败时，页面 MUST 显示地图占位，MUST NOT 阻塞列表、筛选、分页和详情。地图信息窗口 MUST 展示基础信息，并提供“查看详情”入口；点击后 SHALL 在地图列内打开详情卡片。地图详情卡片的字段与缺失值规则见下方“地图详情卡片与摘要字段”要求。本期 MUST NOT 要求押金/清洁费或宠物设施字段作为卡片必需内容。

#### Scenario: 地图展示当前筛选点位

- **GIVEN** 用户存在激活行程并位于地点页
- **WHEN** 地图 SDK 已配置并加载完成
- **THEN** 地图显示当前城市、类型、宠物友好/显示全部和锚点筛选下的全部点位
- **AND** 点位覆盖所有分页，而不只是列表当前页

#### Scenario: marker 点击联动列表

- **GIVEN** 地图已显示多个 marker
- **WHEN** 用户点击某个 marker
- **THEN** 对应列表卡片显示高亮
- **AND** 地图打开该点位的基础信息窗口

#### Scenario: 列表定位地图 marker

- **GIVEN** 地图已显示点位
- **WHEN** 用户点击某张卡片的“在地图查看”
- **THEN** 地图定位到该 card 对应 marker
- **AND** 打开该点位的基础信息窗口

#### Scenario: 筛选变化更新地图

- **GIVEN** 用户已打开地图
- **WHEN** 用户切换地点类型、宠物友好/显示全部或锚点
- **THEN** 地图点位更新为新筛选条件下的结果

#### Scenario: 未配置 JS Key

- **GIVEN** 前端未配置 `VITE_AMAP_JS_KEY`
- **WHEN** 用户打开地点页
- **THEN** 地图列显示“地图未配置”占位
- **AND** 列表、筛选、分页与详情仍正常工作

#### Scenario: 地图 SDK 加载失败

- **GIVEN** 已配置 JS Key 但浏览器无法加载高德 SDK
- **WHEN** 地图初始化失败
- **THEN** 地图列显示“地图加载失败”提示
- **AND** 列表功能不受影响

#### Scenario: 本期信息窗口保持基础信息

- **GIVEN** 用户点击 marker 或卡片定位
- **WHEN** 地图信息窗口打开
- **THEN** 窗口展示名称、类型、地址和锚点距离
- **AND** 窗口提供“查看详情”入口

### Requirement: 地图详情卡片与摘要字段

地图 InfoWindow SHALL 提供“查看详情”操作；点击后 SHALL 关闭 InfoWindow 并在地图列内打开该地点的详情卡片。卡片 SHALL 展示地点名称、类型、地址、锚点距离（有锚点时）、首张照片（有 `photoUrl` 时）、评分（有 `rating` 时）、商圈/标签（有 `businessArea`/`keytag` 时）、宠物友好结论、逐宠物政策、携宠政策与“添加到行程/暂不排期”操作。缺失字段 MUST NOT 伪造；押金/清洁费与宠物设施当前数据模型没有，MUST NOT 作为必需字段；`extraFeeCents` SHALL 以“额外费用”展示。共享地点详情接口 `GET /api/locations/{poiId}` SHALL 在现有字段外返回可选 `photoUrl`、`rating`、`keytag`、`businessArea`；MUST NOT 返回原始 `photos` 数组、`business` 对象或 `poi` JSON；字段缺失时 SHALL 返回 `null`。

#### Scenario: InfoWindow 打开详情卡片

- **GIVEN** 地图 InfoWindow 已打开
- **WHEN** 用户点击“查看详情”
- **THEN** InfoWindow 关闭
- **AND** 地图列内打开该地点详情卡片

#### Scenario: 卡片展示照片与评分

- **GIVEN** 地点 `poi_json` 含首张照片且 `business_json` 含评分/商圈
- **WHEN** 详情卡片打开
- **THEN** 卡片展示照片、评分、商圈/标签、宠物政策和地址
- **AND** 不展示原始 `photos` 数组或 `business` 对象

#### Scenario: 缺失字段不伪造

- **GIVEN** 地点没有照片、评分或商圈数据
- **WHEN** 详情卡片打开
- **THEN** 卡片不显示对应字段
- **AND** 仍展示名称、地址、宠物政策和行程操作
- **AND** 不显示虚构的押金、清洁费或宠物设施

#### Scenario: 卡片加入行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在详情卡片选择某一天或暂不排期
- **THEN** 地点加入对应行程分组
- **AND** 卡片保持可关闭

#### Scenario: 详情摘要字段接口

- **GIVEN** 已登录用户请求地点详情
- **WHEN** 后端返回详情
- **THEN** 响应包含可选的 `photoUrl`、`rating`、`keytag`、`businessArea`
- **AND** 不包含原始 `photos`、`business` 或 `poi` 字段
