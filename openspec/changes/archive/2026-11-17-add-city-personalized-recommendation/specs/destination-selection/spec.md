# Spec Delta — destination-selection

## ADDED Requirements

### Requirement: 候选城市特征标签契约

候选接口 `GET /api/destinations` 响应每项 SHALL 携带只读 `featureTags`（字符串数组），取值为固定特征词表（COASTAL 海滨、MOUNTAIN 山地、LAKE 湖泊、GRASSLAND 草原、CITY_PARK 城市公园、SNOW 雪景）的子集。特征数据 SHALL 由系统种子维护 48 个知名旅游城市（含珠海=COASTAL、杭州=LAKE,CITY_PARK），未标注城市 SHALL 返回空数组。既有字段、keyword/petFriendly/petType/breedId/shoulderHeightCm 参数行为与服务端名称升序 MUST 保持不变；接口 MUST NOT 新增排序参数或依赖宠物档案模块。

#### Scenario: 已标注城市携带特征

- **GIVEN** 已登录用户
- **WHEN** 请求候选接口
- **THEN** 珠海候选的 `featureTags` 含 COASTAL
- **AND** 杭州候选的 `featureTags` 含 LAKE 与 CITY_PARK

#### Scenario: 未标注城市特征为空

- **GIVEN** 某城市不在特征种子清单内
- **WHEN** 请求候选接口
- **THEN** 该城市候选的 `featureTags` 为空数组

#### Scenario: 既有契约行为不变

- **GIVEN** 已登录用户
- **WHEN** 请求候选接口携带既有 keyword 或 petFriendly 等参数
- **THEN** 过滤行为与名称升序与现状一致
- **AND** 未认证请求仍返回 401

### Requirement: 候选个性化推荐排序

用户进入 `/cities` SHALL 即呈现个性化推荐结果：当第一只宠物填写了喜好或性格时，候选 SHALL 按推荐得分降序排列——喜好命中城市特征每项 +2 分（游泳→海滨/湖泊、爬山→山地、草地奔跑→草原、城市漫步→城市公园、玩雪→雪景；同一特征被多个喜好命中只计一次），性格按映射加成 +1 分（活泼好动→海滨/山地/草原/雪景任一、温和平静→湖泊/城市公园任一、胆小敏感→城市公园）；同分 SHALL 维持服务端名称升序。排序 SHALL 在前端完成，作用于服务端过滤后的候选集合。第一只宠物未填喜好与性格、无档案或档案读取失败时 SHALL 维持现有名称排序。多只宠物时 SHALL 仅以第一只宠物参与排序。

#### Scenario: 喜好驱动排序

- **GIVEN** 第一只宠物喜好含「游泳」
- **WHEN** 用户打开 `/cities`
- **THEN** 海滨与湖泊城市（如珠海、三亚、杭州）得分 +2 起，排在未命中城市之前
- **AND** 同分城市维持名称升序

#### Scenario: 性格加成

- **GIVEN** 第一只宠物性格「活泼好动」，城市 A 含户外型特征（海滨/山地/草原/雪景任一）、城市 B 仅含湖泊或城市公园
- **WHEN** 候选排序
- **THEN** A 获性格加成 +1，B 不获
- **AND** 「温和平静」命中湖泊/城市公园 +1、「胆小敏感」仅命中城市公园 +1

#### Scenario: 仅填性格也参与排序

- **GIVEN** 第一只宠物未填喜好、性格为「温和平静」
- **WHEN** 用户打开 `/cities`
- **THEN** 含湖泊或城市公园特征的城市获 +1 排在未命中城市之前

#### Scenario: 多喜好命中同一特征只计一次

- **GIVEN** 第一只宠物喜好含「游泳」，某城市同时含海滨与湖泊特征
- **WHEN** 计算该城市得分
- **THEN** 海滨与湖泊各计 +2（合计 +4）
- **AND** 若两个喜好映射到同一特征，该特征只计一次 +2

#### Scenario: 未填维持名称序

- **GIVEN** 第一只宠物喜好与性格均未设置，或用户无档案，或档案读取失败
- **WHEN** 用户打开 `/cities`
- **THEN** 候选维持现有名称排序
- **AND** 不展示任何推荐标记

#### Scenario: 多宠物取第一只

- **GIVEN** 用户有两只宠物且喜好不同
- **WHEN** 用户打开 `/cities`
- **THEN** 排序仅按第一只宠物的喜好与性格计算

#### Scenario: 筛选与搜索叠加

- **GIVEN** 个性化排序生效中
- **WHEN** 用户启用宠物友好筛选或输入搜索关键字
- **THEN** 排序作用于服务端过滤后的集合，计数同步更新
- **AND** 逐宠物政策标签与选定流程行为不变

### Requirement: 系统推荐徽标

推荐得分大于 0 的候选卡片 SHALL 在右上角展示「系统推荐」徽标；徽标 SHALL 仅为标记，MUST NOT 附带推荐理由文字。得分为 0 的卡片 MUST NOT 展示徽标。徽标 MUST NOT 遮挡城市名、省份与逐宠物政策标签。未启用个性化排序（未填/无档案/读取失败）时所有卡片 MUST NOT 展示徽标。

#### Scenario: 被推荐城市展示徽标

- **GIVEN** 某城市因喜好或性格命中得分大于 0
- **WHEN** 用户进入 `/cities` 浏览候选卡片
- **THEN** 该卡片右上角展示「系统推荐」徽标
- **AND** 不展示推荐理由文字

#### Scenario: 未命中城市无徽标

- **GIVEN** 某城市得分为 0
- **WHEN** 用户浏览候选卡片
- **THEN** 该卡片无「系统推荐」徽标

#### Scenario: 徽标与政策标签并存

- **GIVEN** 某被推荐城市卡片同时展示逐宠物政策标签
- **WHEN** 卡片渲染
- **THEN** 右上角徽标与内容区政策标签同时可见、互不遮挡

#### Scenario: 未启用排序无徽标

- **GIVEN** 第一只宠物未填喜好与性格
- **WHEN** 用户打开 `/cities`
- **THEN** 所有候选卡片均无「系统推荐」徽标