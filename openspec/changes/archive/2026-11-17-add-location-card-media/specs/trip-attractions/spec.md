# Spec Delta

## ADDED Requirements

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