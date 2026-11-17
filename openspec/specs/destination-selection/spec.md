# destination-selection Specification

## Purpose
定义用户选择目的地的完整行为：在城市级行政区候选中搜索、按每人限养数做宠物友好筛选、选定目的地作为规划上下文。政策收录状态与禁养犬种名单的数据源未定（2026-11-16 需求方决定移除 V14 政策种子迁移），相关 Badge/提醒展示暂缓（TODO），接口保留占位字段。宠物档案（含品种）由外部档案能力（US-01 change）提供，本能力只读消费，不定义档案的创建与维护行为。2026-11-16 需求方增强：宠物友好筛选叠加城市允许宠物类型与允许狗品种匹配（档案 breed 已随 PR #41 交付）、候选卡片右上角匹配标签（绿/红）、已选定再次点击取消选定。

## Requirements

### Requirement: 城市搜索

候选列表 SHALL 支持按关键字过滤，关键字 SHALL 匹配城市名或所属省份；搜索 SHALL 由候选接口 `keyword` 参数承载（服务端过滤）。关键字为空时 SHALL 展示全部候选。无匹配结果时 SHALL 展示空态提示（建议关闭筛选或更换关键词），MUST NOT 展示空白列表。

#### Scenario: 候选接口按关键字过滤

- **GIVEN** 已登录用户
- **WHEN** 请求候选接口携带 `keyword=杭州`
- **THEN** 响应仅包含杭州候选

#### Scenario: 按城市名搜索

- **GIVEN** 用户位于 `/cities`
- **WHEN** 输入关键字「杭州」
- **THEN** 候选列表仅展示杭州卡片
- **AND** 候选计数同步更新

#### Scenario: 按省份搜索

- **GIVEN** 用户位于 `/cities`
- **WHEN** 输入关键字「广东」
- **THEN** 候选列表展示广东省城市（含珠海）
- **AND** 候选计数同步更新

#### Scenario: 搜索无结果

- **GIVEN** 用户位于 `/cities`
- **WHEN** 输入不匹配任何候选城市的关键字
- **THEN** 展示空态提示与建议操作

### Requirement: 宠物友好筛选

候选列表 SHALL 提供「宠物友好筛选」开关，状态 SHALL 由候选接口 `petFriendly` 参数承载（服务端过滤）。宠物友好判定 SHALL 基于行政区每人限养数 `max_pets_per_person`：未设置（null）或大于等于 1 SHALL 视为宠物友好；限养 0 只 SHALL 视为不友好并在启用筛选时排除。关闭时 SHALL 展示全部候选。筛选结果计数 SHALL 同步更新。设施与评价维度 MUST NOT 参与 MVP 筛选。

#### Scenario: 排除限养 0 只的城市

- **GIVEN** 某城市每人限养数为 0
- **WHEN** 请求候选接口携带 `petFriendly=true`
- **THEN** 响应不包含该城市

#### Scenario: 保留未设限养或限养至少 1 只的城市

- **GIVEN** 城市每人限养数为 null、1 或 2
- **WHEN** 请求候选接口携带 `petFriendly=true`
- **THEN** 响应包含这些城市

#### Scenario: 启用筛选默认数据全保留

- **GIVEN** 用户位于 `/cities`，候选城市均未设置每人限养数
- **WHEN** 用户启用宠物友好筛选
- **THEN** 候选列表与计数保持不变

#### Scenario: 关闭筛选

- **GIVEN** 用户已启用宠物友好筛选
- **WHEN** 用户关闭开关
- **THEN** 候选列表展示全部候选

### Requirement: 禁养犬种匹配（展示暂缓）

系统 SHALL 提供按品种名精确匹配的判定能力（纯函数 `breedHitsBanList`）；MUST NOT 支持别名、混血或模糊匹配。无档案、品种为空或品种为「其他」时 SHALL 不命中。「档案品种禁养」Badge 与选定禁养提醒的展示暂缓（TODO：政策数据源与外部档案 breed 字段就绪后恢复）。档案品种枚举与禁养名单 SHALL 使用同一品种词表（对外部档案能力的契约要求）。

#### Scenario: 精确匹配判定

- **GIVEN** 禁养名单含「比特犬」
- **WHEN** 以品种「比特犬」判定
- **THEN** 命中；以「比特」「比特斗牛梗」等别名或部分名判定不命中

#### Scenario: 缺省品种不命中

- **GIVEN** 禁养名单非空
- **WHEN** 以空品种、「其他」或无档案判定
- **THEN** 不命中

#### Scenario: 数据源未定不展示 Badge 与提醒

- **GIVEN** 政策数据源未定（候选接口禁养名单为空）
- **WHEN** 候选列表渲染或用户选定城市
- **THEN** 不展示「档案品种禁养」Badge 与禁养提醒

### Requirement: 政策数据占位契约

候选接口 SHALL 保留 `policyCovered` 与 `bannedBreeds` 字段。政策数据源未定（TODO），当前 SHALL 占位返回 `policyCovered=false` 与空禁养名单，MUST NOT 预置政策种子数据。数据源确定后 SHALL 恢复收录状态与名单（条目含品种名、来源政府文件与更新时间）。政策条文详情展示 MUST NOT 由本能力承载（由当地政策能力承接）。

#### Scenario: 占位字段可读取

- **GIVEN** 系统已完成初始化
- **WHEN** 已登录用户请求城市候选接口
- **THEN** 每个候选含 `policyCovered=false` 与空 `bannedBreeds` 数组## ADDED Requirements

### Requirement: 宠物友好叠加匹配（类型与品种）

候选接口 SHALL 支持可选参数 `petType`（`CAT`/`DOG`）、`breedId`（`dog_breed` 表 id）与 `shoulderHeightCm`（档案肩高）。`petFriendly=true` 时 SHALL 在每人限养数规则之上叠加类型、品种与肩高匹配（类型 null=不允许；品种空列表/肩高上限 null=未配置放行），不满足则排除。未传参数 SHALL 退化为仅限养数规则。`petType` 非法 SHALL 返回 400。响应每项 SHALL 含 `allowedPetTypes`、`allowedDogBreedIds` 与 `maxSinglePetShoulderHeightCm`。后端 MUST NOT 依赖宠物档案模块，匹配输入由前端传参承载。

#### Scenario: 类型不允许被排除

- **GIVEN** 城市 `allowed_pet_types='CAT'`，限养数未设置
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应不包含该城市

#### Scenario: 类型未配置视为不允许

- **GIVEN** 城市 `allowed_pet_types` 为 null
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应不包含该城市

#### Scenario: 类型包含则保留

- **GIVEN** 城市 `allowed_pet_types` 为 `'DOG'` 或 `'CAT,DOG'`
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应包含这些城市（限养数规则同时满足时）

#### Scenario: 肩高超过城市上限被排除

- **GIVEN** 城市肩高上限 40cm，类型与品种均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&shoulderHeightCm=45`
- **THEN** 响应不包含该城市；上限为 null 或 >=45 的城市保留

#### Scenario: 品种不在允许列表被排除

- **GIVEN** 城市允许品种列表非空且不含品种 id=7，限养数与类型均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&breedId=7`
- **THEN** 响应不包含该城市

#### Scenario: 允许品种列表为空视为未配置

- **GIVEN** 城市允许品种列表为空，限养数与类型均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&breedId=7`
- **THEN** 响应包含该城市

#### Scenario: 无档案退化为限养数规则

- **GIVEN** 请求不携带 `petType`/`breedId`
- **WHEN** 请求 `petFriendly=true`
- **THEN** 过滤仅按每人限养数规则执行

#### Scenario: 候选响应携带匹配字段

- **WHEN** 请求候选接口（任意参数）
- **THEN** 每项包含 `allowedPetTypes`、`allowedDogBreedIds` 与 `maxSinglePetShoulderHeightCm`，取值与行政区配置一致

### Requirement: 候选卡片匹配标签

`/cities` 候选卡片 SHALL 按当前用户的全部宠物逐只展示匹配标签，以「宠物名 + 结论」形式呈现。结论 SHALL 为友好或不友好：城市 `allowedPetTypes` 非 null 且含该宠物类型；该宠物为 DOG 且有品种时，城市允许品种列表为空或含该品种 id；城市肩高上限为 null 或 >= 该宠物肩高。猫或无犬种信息导致的无法判定 SHALL 以"无法判定"标签展示。用户没有宠物时 SHALL 不展示匹配标签；宠物接口失败时 SHALL 展示"暂时无法读取宠物"提示，MUST NOT 展示"无宠物"。标签 SHALL 独立于宠物友好筛选开关展示。候选列表在存在激活行程时仍展示，匹配标签 SHALL 使用统一政策匹配主体：存在激活行程且已绑定宠物时只展示该宠物的标签，否则展示全部宠物的标签。

#### Scenario: 多只宠物逐只展示

- **GIVEN** 用户有两只宠物，城市类型与品种均允许第一只、不允许第二只
- **WHEN** 用户打开 `/cities`
- **THEN** 该城市卡片显示第一只宠物的友好 tag
- **AND** 显示第二只宠物的不友好 tag

#### Scenario: 城市类型不允许

- **GIVEN** 某宠物为 DOG，城市 `allowed_pet_types='CAT'`
- **WHEN** 用户打开 `/cities`
- **THEN** 该宠物对应的 tag 显示不友好

#### Scenario: 城市允许品种为空视为未配置

- **GIVEN** 宠物为 DOG，城市允许品种列表为空
- **WHEN** 判定该宠物的匹配
- **THEN** 品种维度视为未配置并放行
- **AND** 其他维度满足时显示友好

#### Scenario: 无宠物不展示标签

- **GIVEN** 当前用户没有宠物
- **WHEN** 用户打开 `/cities`
- **THEN** 候选卡片不展示匹配标签
- **AND** 展示添加宠物的引导

#### Scenario: 宠物接口失败

- **GIVEN** 宠物接口请求失败
- **WHEN** 用户打开 `/cities`
- **THEN** 页面提示暂时无法读取宠物
- **AND** 不展示"无宠物"提示

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
- **AND** 「选定」不可用，并提示先在 Trips 取消激活

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

用户 SHALL 可通过候选卡片的「选定」打开创建行程对话框。对话框 SHALL 固定展示所选城市作为目的地，并在单一日历上依次选择开始日期与结束日期，同时选择携带宠物；城市 MUST 不可编辑，宠物 MUST 为当前用户的一只宠物且默认选中第一只，日期 MUST 完整且推导出的行程天数在 1–7 之间。确认时系统 SHALL 调用 `POST /api/trips` 创建行程，成功后将其设为激活行程、写入 `activeTripId`，并跳转 `/attractions`。取消对话框 MUST NOT 产生任何写入或导航。系统同一时间只支持一个激活行程：存在激活行程时 MUST NOT 打开创建对话框或创建新行程，「选定」MUST 不可用，用户需先在 `/trips` 取消激活。系统 MUST NOT 在此路径创建草稿。

#### Scenario: 打开对话框后取消

- **GIVEN** 用户位于 `/cities`
- **WHEN** 用户点击杭州卡片的「选定」并点击「取消」
- **THEN** 对话框关闭
- **AND** 页面停留在候选列表
- **AND** 不发送 `POST /api/trips`

#### Scenario: 确认后创建行程并进入景点页

- **GIVEN** 用户已选定杭州、在日历上选择有效日期并选择宠物「豆豆」
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

- **GIVEN** 用户只选择了开始日期，或所选天数超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统展示对应错误提示
- **AND** 对话框保持打开且不发送 `POST /api/trips`

#### Scenario: 没有宠物档案

- **GIVEN** 当前用户没有宠物档案
- **WHEN** 用户打开创建行程对话框
- **THEN** 系统提示先在 Paws 添加宠物
- **AND** 「确定」不可用

#### Scenario: 存在激活行程时不可选定新城市

- **GIVEN** 用户存在一个激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 候选卡片的「选定」不可用
- **AND** 页面提示先在 Trips 取消激活
- **AND** 不发送 `POST /api/trips`

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
