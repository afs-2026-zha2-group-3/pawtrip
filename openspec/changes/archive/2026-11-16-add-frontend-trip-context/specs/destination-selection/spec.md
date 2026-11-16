# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: 取消选定目的地

**Reason**: 目的地不再是浏览器会话中的独立选定状态，而是由激活行程承载；取消语义迁移为 `/trips` 页面的取消激活与行程面板的放弃草稿。

**Migration**: 用户通过 `/trips` 取消激活行程，或在草稿期使用行程面板的"放弃草稿"返回候选列表；`pawtrip.selectedDestination` 键在启动时清理。

## ADDED Requirements

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