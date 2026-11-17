# trip-attractions Specification

## Purpose

本能力定义激活行程上下文下的地点浏览与地图：以激活行程城市为唯一范围，按类型与宠物友好条件浏览已保存地点；支持以已排期景点为锚点的 5km 附近筛选、距离排序与展示；提供地图点位、marker/列表联动与地图详情卡片；并将地点加入按天行程或未排期分组。

## Requirements

### Requirement: 行程上下文下的景点列表

`/attractions` SHALL 以当前激活行程城市为唯一查询上下文，不提供城市筛选。存在激活行程时，页面 MUST 使用共享的已保存地点列表能力查询 `active.cityAdcode` 下当前选中类型的地点，默认类型 MUST 为“景点”；不存在激活行程或仅有未确认草稿时，页面 MUST 展示“先创建或激活行程”空态，MUST NOT 请求地点列表。页面 MUST NOT 展示天数 Tabs；加入天数由每张地点卡片的“添加到行程”选择器承担。

#### Scenario: 激活行程后展示该城市景点

- **GIVEN** 用户存在城市为杭州的激活行程
- **WHEN** 用户打开 `/attractions`，且地点类型默认选中“景点”
- **THEN** 列表只请求并展示杭州已保存的景点
- **AND** 不展示城市选择控件或天数 Tabs

#### Scenario: 无激活行程

- **GIVEN** 用户没有激活行程
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示“先创建或激活行程”空态
- **AND** 不发起地点列表请求

#### Scenario: 未确认草稿不可浏览

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户打开 `/attractions`
- **THEN** 页面展示“先创建或激活行程”空态
- **AND** 不发起地点列表请求

#### Scenario: 天 tab 来自总天数

- **GIVEN** 激活行程 `totalDays=3`
- **WHEN** 用户浏览地点列表
- **THEN** 每张地点卡片的“添加到行程”选择器包含第 1 天、第 2 天和第 3 天
- **AND** 页面不展示天数 Tabs

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

### Requirement: 加入行程与未排期

所有地点类型的列表卡片与详情 SHALL 提供“添加到行程”选择器与“暂不排期”入口。选择器 MUST 覆盖 `1..active.totalDays`，用户选中某天后 MUST 立即将地点追加到对应 `day.stops` 末尾；选择暂不排期时 MUST 追加到 `unscheduled`。系统 MUST 允许同一 `poiId` 在同一天重复加入；同一 `poiId` 同时存在于 `days` 与 `unscheduled` 时 MUST 以已排期为准。未确认草稿 MUST 不展示加入入口。

#### Scenario: 加入当前天

- **GIVEN** 激活行程为 3 天，用户正在浏览住宿类型地点
- **WHEN** 用户在某住宿卡片的“添加到行程”选择器中选择第 2 天
- **THEN** 该地点追加到 `plan.days` 第 2 天的 `stops` 末尾
- **AND** 行程面板立即显示该地点
- **AND** 选择器复位为未选中态

#### Scenario: 选择器选项来自总天数

- **GIVEN** 激活行程 `totalDays=2`
- **WHEN** 用户打开任意类型地点的“添加到行程”选择器
- **THEN** 只展示“第 1 天”与“第 2 天”两个选项

#### Scenario: 暂不排期

- **GIVEN** 用户存在激活行程且正在浏览任意类型地点
- **WHEN** 用户点击“暂不排期”
- **THEN** 该地点追加到 `plan.unscheduled`
- **AND** 行程面板的“未排期”分组显示该地点

#### Scenario: 同一天重复加入

- **GIVEN** 第 1 天已包含某地点
- **WHEN** 用户再次把该地点加入第 1 天
- **THEN** 第 1 天保留两条相同 `poiId` 的记录
- **AND** 不出现去重或报错

#### Scenario: 已排期优先

- **GIVEN** 某地点同时出现在 `days` 与 `unscheduled`
- **WHEN** 计划被保存或规范化
- **THEN** 该地点只保留在 `days`
- **AND** 从 `unscheduled` 移除

#### Scenario: 未确认草稿无加入入口

- **GIVEN** 用户只有未确认草稿
- **WHEN** 用户浏览地点页
- **THEN** 页面不展示“添加到行程”或“暂不排期”

### Requirement: 景点详情政策匹配

地点详情 SHALL 对所有地点类型展示其已配置的政策字段，并按统一政策匹配主体给出逐宠物结论 tag。存在激活行程且已绑定宠物时 MUST 只针对该宠物判定；否则 MUST 针对全部宠物判定。判定 SHALL 覆盖类型、每人限养数、单只最大体重、单只最大肩高、牵引与疫苗要求；`null` 字段表示未配置，MUST 跳过对应维度。额外费用与预约要求 SHALL 继续以字段形式展示，不参与友好/不友好结论。

#### Scenario: 激活宠物命中限制

- **GIVEN** 激活行程宠物体重为 30kg，某住宿的 `maxSinglePetWeightKg=20`
- **WHEN** 用户打开该地点详情
- **THEN** 该宠物 tag 显示不友好
- **AND** 展示体重超限的具体原因

#### Scenario: 全部维度满足

- **GIVEN** 激活宠物的类型、体重、肩高均满足某地点政策，且牵引与疫苗要求已满足
- **WHEN** 用户打开该地点详情
- **THEN** 该宠物 tag 显示友好

#### Scenario: 未配置维度跳过

- **GIVEN** 某地点 `maxSinglePetWeightKg` 为 null
- **WHEN** 系统判定该宠物的匹配
- **THEN** 体重维度被跳过
- **AND** 不因体重缺失将结论判为不友好

#### Scenario: 无激活行程逐只判定

- **GIVEN** 用户没有激活行程绑定宠物且拥有多只宠物
- **WHEN** 用户查看已保存地点详情
- **THEN** 页面为每只宠物展示一个结论 tag

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

### Requirement: 地点类型筛选

地点浏览页 SHALL 使用登录后可读的共享地点类型选项，提供单选类型筛选并默认选中“景点”。类型变更 MUST 保留激活行程城市、将页码重置为第一页，并只显示所选类型的已保存地点。

#### Scenario: 默认浏览景点

- **GIVEN** 用户打开地点浏览页且存在激活行程
- **WHEN** 类型选项加载完成
- **THEN** 类型筛选默认选中“景点”
- **AND** 地点列表只显示该行程城市的景点

#### Scenario: 切换到其他地点类型

- **GIVEN** 用户当前正在查看景点列表
- **WHEN** 用户选择“宠物医院”
- **THEN** 列表只显示激活行程城市内已保存的宠物医院
- **AND** 查询仍使用激活行程城市

#### Scenario: 类型变更重置分页

- **GIVEN** 用户位于第 2 页
- **WHEN** 用户切换地点类型
- **THEN** 列表从第 1 页开始展示新类型结果

### Requirement: 地点卡片封面与评分

地点卡片 SHALL 在顶部展示封面图（16:9 裁切，浏览器直载来源 URL，不经后端代理），并在地址行展示琥珀色星标与评分。无照片、URL 非 http(s) 或加载失败时，封面区域 MUST 显示中性占位（图标 + 类型标签），且 MUST NOT 提供「获取图片」或重试操作；评分缺失或非数值时 MUST 隐藏评分元素。卡片其余信息与操作 MUST 不受媒体降级影响。

#### Scenario: 封面展示

- **GIVEN** 某地点的 `coverPhotoUrl` 为有效 HTTP(S) 照片 URL
- **WHEN** 用户浏览地点列表
- **THEN** 该卡片顶部以 16:9 裁切展示封面图
- **AND** 图片由浏览器直接加载，不经过 Pawtrip 后端代理

#### Scenario: 无照片占位

- **GIVEN** 某地点 `coverPhotoUrl` 为 `null`
- **WHEN** 卡片渲染
- **THEN** 封面区域显示中性占位（图标 + 类型标签）
- **AND** 名称、政策标签与操作按钮正常展示

#### Scenario: 加载失败降级

- **GIVEN** 封面 URL 非 http(s) 或浏览器加载失败
- **WHEN** 卡片渲染
- **THEN** 封面区域显示与无照片一致的中性占位
- **AND** 不显示「获取图片」或重试操作

#### Scenario: 评分展示

- **GIVEN** 某地点 `rating` 为 "4.6"
- **WHEN** 卡片渲染
- **THEN** 地址行展示琥珀色星标与「4.6」

#### Scenario: 评分缺失或非法隐藏

- **GIVEN** 某地点 `rating` 为 `null` 或非数值字符串
- **WHEN** 卡片渲染
- **THEN** 不展示评分元素
- **AND** 地址行其余内容正常展示

### Requirement: 地点卡片限制费用与政策说明行

卡片 SHALL 在政策标签之后展示限制与费用行及政策说明行。限制与费用行仅展示有值项：体重上限（≤X kg）、肩高上限（≤X cm）、附加费（¥X，由分换算为元）；政策说明行由已配置政策字段自动拼接中文短语（如「公共区域需牵引 · 需疫苗证明」）。任一行无可展示项时 MUST 整行隐藏；MUST NOT 编造地点未配置的政策、限制或费用。

#### Scenario: 有值项展示

- **GIVEN** 某地点 `maxSinglePetWeightKg=15`、`extraFeeCents=8000`，其余限制费用字段为 `null`
- **WHEN** 卡片渲染
- **THEN** 限制与费用行展示「≤15 kg」与「附加费 ¥80」
- **AND** 不展示肩高项

#### Scenario: 限制费用全空隐藏

- **GIVEN** 某地点体重、肩高与附加费字段均为 `null`
- **WHEN** 卡片渲染
- **THEN** 不展示限制与费用行

#### Scenario: 政策说明自动生成

- **GIVEN** 某地点 `leashRequired=true`、`vaccinationProofRequired=true`
- **WHEN** 卡片渲染
- **THEN** 政策说明行包含「公共区域需牵引」与「需疫苗证明」

#### Scenario: 无可生成项隐藏

- **GIVEN** 某地点没有任何可生成说明短语的政策配置
- **WHEN** 卡片渲染
- **THEN** 不展示政策说明行

### Requirement: 详情弹窗媒体同步

地点详情弹窗 SHALL 在头部展示封面图与评分，降级规则与卡片一致。既有政策字段、逐宠物 tag 与「添加到行程 / 暂不排期」操作 MUST 保持不变；所有地点类型 SHALL 使用一致的卡片与弹窗结构。

#### Scenario: 弹窗展示媒体

- **GIVEN** 某地点有有效封面 URL 与评分 "4.6"
- **WHEN** 用户点击「查看详情」打开弹窗
- **THEN** 弹窗头部展示封面图与琥珀色星标评分
- **AND** 政策字段、逐宠物 tag 与加入行程操作保持不变

#### Scenario: 弹窗媒体降级

- **GIVEN** 某地点无照片且无评分
- **WHEN** 用户打开详情弹窗
- **THEN** 头部封面区域显示中性占位，评分元素隐藏
- **AND** 弹窗其余功能正常

#### Scenario: 类型结构一致

- **GIVEN** 用户切换到住宿、宠物医院或餐厅等任一地点类型
- **WHEN** 浏览该类型列表并打开详情
- **THEN** 卡片与弹窗结构与景点类型一致
- **AND** 查看详情、添加到行程、暂不排期与已加入徽章行为不变

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
- **THEN** 页面按现有城市与类型请求并展示列表
- **AND** 不应用宠物规则筛选与距离筛选

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

地图 InfoWindow SHALL 提供“查看详情”操作；点击后 SHALL 关闭 InfoWindow 并在地图列内打开该地点的详情卡片。卡片 SHALL 展示地点名称、类型、地址、锚点距离（有锚点时）、首张照片（有 `coverPhotoUrl` 时）、评分（有 `rating` 时）、商圈/标签（有 `businessArea`/`keytag` 时）、宠物友好结论、逐宠物政策、携宠政策与“添加到行程/暂不排期”操作。缺失字段 MUST NOT 伪造；押金/清洁费与宠物设施当前数据模型没有，MUST NOT 作为必需字段；`extraFeeCents` SHALL 以“额外费用”展示。共享地点详情接口 `GET /api/locations/{poiId}` SHALL 在既有 `coverPhotoUrl`/`rating` 基础上返回可选 `keytag`、`businessArea`；MUST NOT 返回原始 `photos` 数组、`business` 对象或 `poi` JSON；字段缺失时 SHALL 返回 `null`。

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
- **THEN** 响应包含可选的 `keytag`、`businessArea`，并保留既有 `coverPhotoUrl`、`rating`
- **AND** 不包含原始 `photos`、`business` 或 `poi` 字段
