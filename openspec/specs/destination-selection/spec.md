# destination-selection Specification

## Purpose
定义用户选择目的地的完整行为：在城市级行政区候选中搜索、按每人限养数做宠物友好筛选、选定目的地作为规划上下文。政策收录状态与禁养犬种名单的数据源未定（2026-11-16 需求方决定移除 V14 政策种子迁移），相关 Badge/提醒展示暂缓（TODO），接口保留占位字段。宠物档案（含品种）由外部档案能力（US-01 change）提供，本能力只读消费，不定义档案的创建与维护行为。2026-11-16 需求方增强：宠物友好筛选叠加城市允许宠物类型与允许狗品种匹配（档案 breed 已随 PR #41 交付）、候选卡片右上角匹配标签（绿/红）、已选定再次点击取消选定。

## Requirements

### Requirement: 目的地候选列表

系统 SHALL 在受登录保护的 `/cities` 页面展示候选列表，候选范围为全部城市级行政区（含珠海与杭州）。每张候选卡片 SHALL 展示城市名与所属省份。候选数据 SHALL 来自服务端接口，未认证请求 SHALL 返回 `401 UNAUTHENTICATED`。政策收录状态 Badge 暂缓展示（TODO：政策数据源确定后恢复）。候选列表 SHALL 仅在用户既无激活行程也无草稿时展示；存在激活行程或草稿时，页面 MUST 展示该城市的详情视图，MUST NOT 展示候选卡片、搜索框、筛选开关或旅游总天数输入。

#### Scenario: 打开目的地选择页

- **GIVEN** 已登录用户且无激活行程、无草稿
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示城市级行政区候选卡片（含杭州与珠海）
- **AND** 每张卡片显示城市名与省份

#### Scenario: 未认证请求候选接口

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求城市候选接口
- **THEN** 返回 `401` 与 Problem Details `code=UNAUTHENTICATED`

#### Scenario: 存在激活行程时不展示候选

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示该行程城市的详情
- **AND** 不展示候选卡片、搜索框、筛选开关与旅游总天数输入

#### Scenario: 存在草稿时不展示候选

- **GIVEN** 用户存在未确认草稿
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示草稿城市的详情
- **AND** 不展示候选卡片与创建入口

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

### Requirement: 选定目的地与规划上下文

用户 SHALL 可从候选卡片选定一个城市，选定动作 SHALL 创建前端行程草稿作为规划上下文，MUST NOT 直接写入 `sessionStorage`。草稿 SHALL 保存城市、天数与宠物，其中城市在选定后只读；天数 MUST 为 1–7 的整数，宠物 MUST 为当前用户的一只宠物。选定城市后页面 SHALL 切换到该城市详情视图，并展开左下角行程面板；确认草稿 SHALL 由行程上下文能力调用 `POST /api/trips` 完成。存在激活行程或草稿时 MUST NOT 重新选定或创建新行程；只有激活行程在 `/trips` 取消激活、或草稿被放弃后，候选列表才恢复。

#### Scenario: 选定城市创建草稿

- **GIVEN** 用户位于 `/cities` 候选列表且无激活行程
- **WHEN** 用户点击杭州卡片的「选定」
- **THEN** 系统创建城市为杭州的草稿
- **AND** 页面切换到杭州详情视图
- **AND** 左下角行程面板展开并显示可编辑的天数与宠物 tag
- **AND** 不写入 `pawtrip.selectedDestination`

#### Scenario: 草稿城市只读

- **GIVEN** 用户已选定杭州并处于草稿期
- **WHEN** 用户查看行程面板的城市 tag
- **THEN** 城市显示为杭州且不可编辑
- **AND** 换城市需要放弃草稿后返回候选列表

#### Scenario: 天数与宠物在草稿期可编辑

- **GIVEN** 用户已选定杭州并处于草稿期
- **WHEN** 用户将天数改为 3 并选择宠物「旺财」
- **THEN** 草稿保存天数 3 与宠物「旺财」
- **AND** 确认前不请求 `POST /api/trips`

#### Scenario: 存在激活行程时不可创建

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面只展示该行程城市详情
- **AND** 不提供选定其他城市的入口

#### Scenario: 刷新丢失草稿

- **GIVEN** 用户处于未确认草稿
- **WHEN** 用户刷新页面
- **THEN** 草稿丢失
- **AND** `/cities` 回到候选列表

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

`/cities` 候选卡片 SHALL 按当前用户的全部宠物逐只展示匹配标签，以「宠物名 + 结论」形式呈现。结论 SHALL 为友好或不友好：城市 `allowedPetTypes` 非 null 且含该宠物类型；该宠物为 DOG 且有品种时，城市允许品种列表为空或含该品种 id；城市肩高上限为 null 或 >= 该宠物肩高。猫或无犬种信息导致的无法判定 SHALL 以"无法判定"标签展示。用户没有宠物时 SHALL 不展示匹配标签；宠物接口失败时 SHALL 展示"暂时无法读取宠物"提示，MUST NOT 展示"无宠物"。标签 SHALL 独立于宠物友好筛选开关展示。候选列表阶段不存在激活行程，因此匹配对象 MUST 为全部宠物。

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

### Requirement: 激活行程下的城市详情

存在激活行程或草稿时，`/cities` SHALL 只展示该城市的详情视图，内容包括城市名、所属省份、政策收录状态与政策要点、允许宠物类型、允许犬种与肩高上限、该城市已保存景点数量，以及前往完整城市政策页的链接。详情数据 SHALL 复用现有城市候选、城市政策与景点接口，MUST NOT 新增城市详情端点。页面 MUST NOT 提供搜索、宠物友好筛选、旅游总天数输入或候选卡片。

#### Scenario: 展示激活城市详情

- **GIVEN** 用户存在城市为杭州的激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示杭州的名称、省份、政策要点、允许宠物条件与景点数量
- **AND** 提供前往杭州完整政策页的链接

#### Scenario: 草稿城市详情

- **GIVEN** 用户存在城市为珠海的未确认草稿
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示珠海的详情视图
- **AND** 不请求候选列表的创建入口

#### Scenario: 不提供候选操作

- **GIVEN** 用户存在激活行程
- **WHEN** 用户浏览 `/cities`
- **THEN** 页面不显示搜索框、宠物友好筛选与旅游总天数输入
- **AND** 不显示其他城市的候选卡片
