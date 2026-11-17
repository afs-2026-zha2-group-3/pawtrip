# Spec Delta

## ADDED Requirements

### Requirement: 行程景点锚点选择

地点浏览页 SHALL 提供选择锚点的控件：酒店类型下 MUST 提供“离景点最近”下拉，景点类型下 SHALL 保留“行程景点锚点”选择器；两者 MUST 共用同一候选集合与锚点状态。候选 MUST 来自当前激活行程中已按天排期到某一天的景点，即 `plan.days[].stops` 中 `poiId` 对应 `typeGroup=attraction` 的地点；候选 MUST 按 `poiId` 去重，MUST NOT 包含仅存在于 `unscheduled` 的地点或其他类型地点。用户 MUST 能清除已选锚点。选择或清除锚点 MUST NOT 改变当前景点列表结果。锚点景点从行程移除或激活行程变化后，页面 MUST 自动清空锚点；酒店类型 MUST 回到默认全量列表，餐厅类型 MUST 恢复门禁。

#### Scenario: 酒店页选择已排期景点作为锚点

- **GIVEN** 激活行程第 1 天的 stops 包含景点“长隆海洋王国”，且用户位于“酒店”类型
- **WHEN** 用户在“离景点最近”下拉中选择“长隆海洋王国”
- **THEN** 锚点显示为“长隆海洋王国”
- **AND** 酒店列表只显示该锚点 5km 内的酒店

#### Scenario: 景点页选择已排期景点作为锚点

- **GIVEN** 激活行程第 1 天的 stops 包含景点“长隆海洋王国”
- **WHEN** 用户在“景点”类型下打开“行程景点锚点”选择器并选择“长隆海洋王国”
- **THEN** 锚点显示为“长隆海洋王国”
- **AND** 当前景点列表内容不变

#### Scenario: 未排期景点不出现在候选

- **GIVEN** 激活行程的 `unscheduled` 包含景点“情侣路”，且按天 stops 中没有该景点
- **WHEN** 用户打开任一锚点选择控件
- **THEN** “情侣路”不出现在候选中

#### Scenario: 重复景点去重

- **GIVEN** 同一景点 `poiId` 出现在第 1 天和第 2 天的 stops 中
- **WHEN** 用户打开任一锚点选择控件
- **THEN** 该景点只出现一次

#### Scenario: 清除酒店锚点

- **GIVEN** 用户已在酒店类型下选择锚点
- **WHEN** 用户清除锚点
- **THEN** “离景点最近”下拉恢复未选态
- **AND** 酒店列表恢复为默认全量列表

#### Scenario: 锚点景点被移出行程

- **GIVEN** 用户已选择锚点“长隆海洋王国”
- **WHEN** 该景点从激活行程的所有天 stops 中被移除
- **THEN** 页面自动清空锚点
- **AND** 酒店类型恢复默认全量列表
- **AND** 餐厅类型恢复门禁空态

### Requirement: 餐厅的选择门禁

当地点类型为“餐厅”且未选择锚点时，页面 MUST NOT 请求餐厅列表，MUST 展示“请先在景点页选择行程景点”的空态，并 MUST 提供返回“景点”类型的入口。酒店类型 MUST 默认请求并展示已保存酒店，MUST NOT 因未选锚点而门禁。未选锚点 MUST NOT 阻止用户切换或浏览“景点”“宠物医院”“宠物用品店”。选择锚点后，餐厅和酒店 MUST 共用同一锚点；在两类之间切换 MUST 保留锚点并将页码重置为第 1 页。

#### Scenario: 未选锚点切换到餐厅

- **GIVEN** 用户尚未选择锚点
- **WHEN** 用户把地点类型切换为“餐厅”
- **THEN** 页面显示“请先在景点页选择行程景点”的空态
- **AND** 不发起餐厅列表请求
- **AND** 页面提供返回“景点”类型的入口

#### Scenario: 未选锚点切换到酒店

- **GIVEN** 用户尚未选择锚点
- **WHEN** 用户把地点类型切换为“酒店”
- **THEN** 页面默认请求并展示该城市的已保存酒店
- **AND** 不显示门禁空态
- **AND** 若行程中没有已排期景点，“离景点最近”下拉禁用并提示

#### Scenario: 宠物医院与宠物用品店不受门禁影响

- **GIVEN** 用户尚未选择锚点
- **WHEN** 用户切换到“宠物医院”或“宠物用品店”
- **THEN** 页面按现有城市、类型和宠物友好条件请求并展示列表
- **AND** 不应用距离筛选

#### Scenario: 餐厅和酒店共用锚点

- **GIVEN** 用户已在酒店类型下通过“离景点最近”选择锚点
- **WHEN** 用户切换到“餐厅”
- **THEN** 餐厅列表使用同一锚点执行距离筛选
- **AND** 不显示餐厅门禁
- **AND** 页码重置为第 1 页

### Requirement: 5km 附近筛选与距离展示

当锚点已选且类型为“餐厅”或“酒店”时，列表 MUST 只包含与锚点经纬度直线距离不超过 5km 的已保存地点。距离 SHALL 使用 Haversine 大圆距离计算，`5000m` 含边界。筛选 MUST 与激活行程城市、宠物友好/显示全部地点及分页条件同时生效。结果 MUST 按距离升序排列，距离相同 MUST 按既有稳定顺序。每个结果 MUST 展示“距{锚点名}约 X.Xkm”，公里数保留一位小数。与锚点距离不超过 5km 且已加入行程的地点 MUST 照常显示。经纬度缺失的候选地点 MUST NOT 出现在距离筛选结果中；锚点经纬度缺失时 MUST NOT 应用距离筛选，并 MUST 提示无法计算距离。

#### Scenario: 酒店默认展示全部

- **GIVEN** 用户位于“酒店”类型且尚未选择锚点
- **WHEN** 酒店列表加载
- **THEN** 页面展示该城市全部已保存酒店（受宠物友好筛选影响）
- **AND** 不显示距离文案

#### Scenario: 酒店选择锚点后过滤

- **GIVEN** 用户位于“酒店”类型，且行程中已有已排期景点
- **WHEN** 用户在“离景点最近”下拉中选择该景点
- **THEN** 酒店列表只显示该锚点 5km 内的酒店
- **AND** 结果按距离升序并显示距离

#### Scenario: 5km 内餐厅展示

- **GIVEN** 锚点为“长隆海洋王国”，某餐厅与锚点距离为 `4200m`
- **WHEN** 用户查看餐厅列表
- **THEN** 该餐厅出现在结果中

#### Scenario: 超出 5km 排除

- **GIVEN** 某餐厅与锚点距离为 `5010m`
- **WHEN** 用户查看餐厅列表
- **THEN** 该餐厅不出现在结果中

#### Scenario: 5km 边界包含

- **GIVEN** 某酒店与锚点的计算距离为 `5000m`
- **WHEN** 用户查看酒店列表
- **THEN** 该酒店出现在结果中

#### Scenario: 距离升序与距离文案

- **GIVEN** 锚点已选，5km 内有距离为 `800m`、`2300m`、`4200m` 的餐厅
- **WHEN** 餐厅列表渲染
- **THEN** 顺序为 `800m`、`2300m`、`4200m`
- **AND** 卡片分别显示“距{锚点名}约 0.8km”“约 2.3km”“约 4.2km”

#### Scenario: 与宠物友好筛选叠加

- **GIVEN** 锚点已选，5km 内同时存在宠物友好和非宠物友好餐厅
- **WHEN** 用户关闭“显示全部地点”
- **THEN** 结果只包含满足 `maxPetsPerPerson >= 1` 的 5km 内餐厅
- **AND** 打开“显示全部地点”后结果包含 5km 内全部餐厅

#### Scenario: 已加入行程的地点照常显示

- **GIVEN** 某餐厅与锚点距离 `2000m`，且已加入行程第 2 天
- **WHEN** 用户查看 5km 内餐厅
- **THEN** 该餐厅仍出现在结果中
- **AND** 卡片保留“第 2 天”标识

#### Scenario: 无坐标候选排除

- **GIVEN** 5km 范围内存在一家经纬度为 `NULL` 的餐厅
- **WHEN** 用户查看餐厅列表
- **THEN** 该餐厅不出现在结果中

#### Scenario: 锚点无坐标提示

- **GIVEN** 用户选择的锚点景点经纬度为 `NULL`
- **WHEN** 用户尝试应用距离筛选
- **THEN** 页面提示该景点缺少坐标、无法计算距离
- **AND** 不发起距离筛选查询

### Requirement: 附近筛选的共享地点查询契约

共享已保存地点列表接口 `GET /api/locations` SHALL 接受可选查询参数 `nearPoiId`。提供该参数时，服务端 MUST 校验锚点存在、`typeGroup=attraction` 且经纬度非空，否则 MUST 返回 `400 VALIDATION_ERROR`；MUST 排除经纬度缺失的候选地点，只返回与锚点距离不超过 5km 的地点，并在每个结果中返回 `distanceMeters`；`totalElements`、`totalPages`、`hasNext`、`hasPrevious` MUST 基于距离过滤后的结果，排序 MUST 为距离升序、距离相同按既有稳定顺序。未提供 `nearPoiId` 时，接口 MUST 保持现有筛选、排序、分页与响应字段行为（`distanceMeters` 可为 `null` 或省略）。接口 MUST NOT 调用高德，MUST NOT 新增数据库列或 schema 变更。接口 MUST NOT 校验锚点是否属于当前用户的激活行程；行程归属由页面保证。

#### Scenario: 带锚点查询返回距离

- **GIVEN** 已登录用户请求餐厅列表并传入有效的 `nearPoiId`
- **WHEN** 后端返回结果
- **THEN** 每个结果包含 `distanceMeters`
- **AND** 结果按 `distanceMeters` 升序排列

#### Scenario: 过滤后分页

- **GIVEN** 某城市餐厅集合中只有部分地点位于锚点 5km 内
- **WHEN** 用户请求第 1 页且 `pageSize` 小于 5km 内总数
- **THEN** `totalElements` 只统计 5km 内地点
- **AND** `hasNext` 与后续页基于过滤后的集合

#### Scenario: 锚点不存在

- **GIVEN** 请求携带不存在的 `nearPoiId`
- **WHEN** 后端处理请求
- **THEN** 返回 `400 VALIDATION_ERROR`

#### Scenario: 锚点非景点

- **GIVEN** `nearPoiId` 指向一家餐厅
- **WHEN** 后端处理请求
- **THEN** 返回 `400 VALIDATION_ERROR`

#### Scenario: 锚点无坐标

- **GIVEN** `nearPoiId` 指向经纬度为 `NULL` 的景点
- **WHEN** 后端处理请求
- **THEN** 返回 `400 VALIDATION_ERROR`

#### Scenario: 未带锚点保持既有行为

- **GIVEN** 请求不包含 `nearPoiId`
- **WHEN** 后端返回地点列表
- **THEN** 筛选、排序、分页与既有字段行为不变
- **AND** 不执行距离计算

#### Scenario: 不调用高德

- **GIVEN** 请求携带或未携带 `nearPoiId`
- **WHEN** 后端读取地点列表
- **THEN** 后端只从数据库读取
- **AND** 不调用高德 POI API
