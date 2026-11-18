# Spec Delta

## ADDED Requirements

### Requirement: 行程景点附近宠物服务

行程单中每个已排期景点卡片 SHALL 在“详细携宠政策”折叠区之后提供“附近宠物服务”可折叠栏目，默认收起。展开时页面 SHALL 请求 `GET /api/locations/{poiId}/nearby-services`，收起时 MUST NOT 请求。该接口 MUST 以景点 POI 的 `region_code` 前 4 位（城市级）为范围，返回直线距离最近的宠物医院与宠物用品店各至多 1 家，MUST NOT 应用 5km 距离筛选或宠物友好筛选。每项 MUST 包含 `poiId`、`name`、`address`、`distanceMeters`、`openingHours`，不存在时为 `null`。距离 MUST 使用 Haversine 直线距离并按米取整；距离并列时 MUST 按地点 ID 升序。`openingHours` MUST 优先读取高德快照 `business_json.opentime_week`，缺失时回退 `opentime_today`，都缺失为 `null`。景点经纬度缺失时 MUST 返回 `hospital` 与 `supplies` 均为 `null`，MUST NOT 猜测或回退到其他范围。未知 POI MUST 返回 404。前端 MUST 在加载、失败与无数据时显示明确文案，且 MUST NOT 阻塞卡片其他内容；距离 MUST 以一位小数公里展示为“距{景点名}约 X.Xkm”，地址缺失 SHALL 显示“地址未收录”，营业时间缺失 SHALL 显示“暂无”。

#### Scenario: 展开加载最近服务

- **GIVEN** 激活行程第 1 天包含有经纬度的景点“香炉湾沙滩”，且同城存在多家宠物医院与宠物用品店
- **WHEN** 用户展开该景点卡片的“附近宠物服务”
- **THEN** 页面请求 `/api/locations/{poiId}/nearby-services`
- **AND** 展示距离最近的 1 家宠物医院与 1 家宠物用品店
- **AND** 每项展示名称、一位小数公里距离、地址与营业时间

#### Scenario: 收起不请求

- **GIVEN** 用户尚未展开“附近宠物服务”
- **WHEN** 行程单渲染景点卡片
- **THEN** 不发起附近服务请求

#### Scenario: 营业时间回退

- **GIVEN** 宠物医院快照只有 `opentime_week`，宠物用品店快照只有 `opentime_today`
- **WHEN** 用户展开栏目
- **THEN** 医院展示 `opentime_week`，用品店展示 `opentime_today`
- **AND** 两者都缺失时展示“暂无”

#### Scenario: 景点无坐标

- **GIVEN** 景点经纬度为 `null`
- **WHEN** 请求附近服务
- **THEN** `hospital` 与 `supplies` 均为 `null`
- **AND** 前端展示“暂无附近宠物服务”

#### Scenario: 无同城服务

- **GIVEN** 景点所在城市没有已保存的宠物医院或宠物用品店
- **WHEN** 用户展开栏目
- **THEN** 对应类别为空
- **AND** 栏目展示“暂无附近宠物服务”

#### Scenario: 请求失败降级

- **GIVEN** 附近服务接口返回错误
- **WHEN** 用户展开栏目
- **THEN** 展示“暂时无法获取附近宠物服务”
- **AND** 景点卡片的政策与其他内容正常展示

#### Scenario: 未知 POI

- **GIVEN** 路径中的 POI 不存在
- **WHEN** 请求附近服务
- **THEN** 接口返回 404

## MODIFIED Requirements

### Requirement: 景点列表政策字段与逐宠物 tag

共享地点列表中的每个地点 MUST 包含完整 `petPolicies`，字段 SHALL 与地点详情一致。列表 SHALL 对景点、住宿与餐厅使用相同的宠物友好筛选语义：默认仅包含 `maxPetsPerPerson >= 1` 的地点，启用“显示全部地点”后包含当前类型的全部已保存地点。宠物医院与宠物用品店 MUST NOT 应用宠物友好筛选，始终返回当前城市该类型的全部已保存地点且不展示“显示全部地点”开关。地点卡片 MUST 按统一政策匹配主体逐宠物展示 tag。

#### Scenario: 列表项携带政策

- **GIVEN** 当前城市和选中类型下存在已保存地点
- **WHEN** 用户请求地点列表
- **THEN** 每个地点包含完整 `petPolicies`，包括允许宠物类型、限养数、体重、肩高、牵引、疫苗、费用与预约字段
- **AND** 响应保留地点 ID、名称、类型、地址和区域等浏览字段

#### Scenario: 默认筛选宠物友好地点

- **GIVEN** 当前选中类型的地点中存在 `maxPetsPerPerson` 为 `1`、`0` 或 `null` 的记录
- **WHEN** 用户关闭“显示全部地点”
- **THEN** 仅返回 `maxPetsPerPerson >= 1` 的地点

#### Scenario: 显示当前类型的全部地点

- **GIVEN** 当前选中类型存在限养数为 `0` 或未配置限养数的地点
- **WHEN** 用户启用“显示全部地点”
- **THEN** 列表包含当前类型的全部已保存地点
- **AND** 不包含其他地点类型

#### Scenario: 医院与用品店不受宠物友好筛选

- **GIVEN** 当前选中“宠物医院”或“宠物用品店”，且该类型存在 `maxPetsPerPerson` 为 `null` 的地点
- **WHEN** 用户浏览该类型列表
- **THEN** 列表包含该类型的全部已保存地点
- **AND** 不展示“显示全部地点”开关
- **AND** 未配置宠物规则的地点卡片展示“不限宠物”且逐宠物 tag 为“友好”

#### Scenario: 激活行程逐宠物 tag

- **GIVEN** 用户存在带宠物“旺财”的激活行程
- **WHEN** 地点列表渲染卡片
- **THEN** 每张卡片显示“旺财”的政策结论 tag
- **AND** 不显示其他宠物的 tag

#### Scenario: 无激活行程全部宠物 tag

- **GIVEN** 用户无激活行程且直接查看已保存地点详情，且有两只宠物
- **WHEN** 详情展示政策结论
- **THEN** 为每只宠物分别展示结论 tag

#### Scenario: 政策未配置

- **GIVEN** 某地点政策字段均为 null 或未配置
- **WHEN** 卡片或详情渲染该地点
- **THEN** 对应宠物 tag 显示“未配置”
- **AND** 不显示“友好”或“不友好”

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
- **THEN** 页面按现有城市与类型请求并展示列表
- **AND** 不应用宠物规则筛选与距离筛选

#### Scenario: 餐厅和酒店共用锚点

- **GIVEN** 用户已在酒店类型下通过“离景点最近”选择锚点
- **WHEN** 用户切换到“餐厅”
- **THEN** 餐厅列表使用同一锚点执行距离筛选
- **AND** 不显示餐厅门禁
- **AND** 页码重置为第 1 页
