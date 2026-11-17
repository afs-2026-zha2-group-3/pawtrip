# Spec Delta

## ADDED Requirements

### Requirement: 候选列表分页

`/cities` 候选列表 SHALL 按每页 9 张候选卡片分页展示。候选总数超过 9 时 SHALL 展示名称为「城市分页」的导航，包含「第 x / y 页」与「上一页」「下一页」按钮；首页 SHALL 禁用上一页，末页 SHALL 禁用下一页。关键词或宠物友好筛选变化时 SHALL 重置到第 1 页。结果只有一页时 MUST NOT 展示分页导航。候选计数 SHALL 始终展示筛选后的候选总数，MUST NOT 随翻页变化。分页 MUST NOT 改变「选定」、匹配标签或政策侧栏的行为。

#### Scenario: 候选超过一页时展示分页

- **GIVEN** 筛选后的候选城市超过 9 个
- **WHEN** 用户打开 `/cities`
- **THEN** 页面只展示 9 张候选卡片
- **AND** 展示「城市分页」导航与「第 1 / {总页数} 页」
- **AND** 「上一页」不可用

#### Scenario: 翻到下一页

- **GIVEN** 候选列表处于第 1 页且存在下一页
- **WHEN** 用户点击「下一页」
- **THEN** 分页导航显示「第 2 / {总页数} 页」
- **AND** 卡片集合切换为第 2 页候选
- **AND** 「上一页」可用

#### Scenario: 搜索后重置分页

- **GIVEN** 用户已翻到第 2 页
- **WHEN** 用户输入关键词「杭州」
- **THEN** 候选列表回到第 1 页的结果
- **AND** 只展示杭州候选

#### Scenario: 结果只有一页时不展示分页

- **GIVEN** 筛选后候选不超过 9 个
- **WHEN** 用户打开 `/cities`
- **THEN** 不展示「城市分页」导航

## RENAMED Requirements

- FROM: `### Requirement: 禁养犬种匹配（展示暂缓）`
- TO: `### Requirement: 禁养犬种精确匹配`

- FROM: `### Requirement: 政策数据占位契约`
- TO: `### Requirement: 候选政策字段占位`

## MODIFIED Requirements

### Requirement: 候选列表与政策入口

系统 SHALL 在受登录保护的 `/cities` 页面始终展示候选列表，候选范围为全部城市级行政区（含珠海与杭州），不受是否存在激活行程或草稿影响。每张候选卡片 SHALL 展示城市名、所属省份与「选定」按钮，MUST NOT 在卡片内提供政策链接。点击卡片非按钮区域，或卡片聚焦后按 Enter/空格，SHALL 在不离开候选列表的情况下于页面右侧打开该城市的政策侧栏；点击「选定」MUST 只打开创建行程对话框，MUST NOT 打开政策侧栏。再次点击其他卡片 SHALL 以新城市替换侧栏内容。侧栏 SHALL 提供关闭入口；关闭后页面 SHALL 恢复为居中的候选列表，MUST NOT 保留空白右栏。宽屏（视口 ≥1408px）下侧栏 SHALL 与候选列表并排展示在右侧，候选列表列宽 SHALL 保持 976px，打开侧栏后卡片宽度 MUST NOT 缩小、列表整体向左移动；窄于该视口时侧栏 SHALL 堆叠在候选列表下方。候选列表本身 MUST NOT 直接内嵌政策要点、禁养犬种名单或可携带犬种名单，政策正文由侧栏与 `/destinations/{adcode}/policy` 承载。政策收录状态 Badge 暂缓展示。候选数据 SHALL 来自服务端接口，未认证请求 SHALL 返回 `401 UNAUTHENTICATED`。

#### Scenario: 打开目的地选择页

- **GIVEN** 已登录用户且无激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示城市级行政区候选卡片（首页含珠海）
- **AND** 每张卡片显示城市名、省份与「选定」
- **AND** 卡片内不展示政策链接
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

#### Scenario: 点击卡片打开政策侧栏

- **GIVEN** 用户位于 `/cities` 且珠海市在候选中
- **WHEN** 用户点击珠海卡片
- **THEN** 页面右侧展示珠海市政策侧栏
- **AND** 侧栏标题为「珠海市宠物管理政策」
- **AND** 侧栏展示「政策要点」

#### Scenario: 「选定」不打开政策侧栏

- **GIVEN** 用户位于 `/cities` 且存在候选城市
- **WHEN** 用户点击某张卡片的「选定」
- **THEN** 只打开创建行程对话框
- **AND** 不展示城市政策侧栏

#### Scenario: 关闭政策侧栏

- **GIVEN** 政策侧栏已打开
- **WHEN** 用户点击「关闭城市政策」
- **THEN** 侧栏从页面移除
- **AND** 候选列表恢复居中展示
- **AND** 候选卡片仍可正常点击与选定

#### Scenario: 打开侧栏不缩小候选卡片

- **GIVEN** 视口宽度不小于 1408px 且未打开侧栏
- **WHEN** 用户点击候选卡片打开侧栏
- **THEN** 候选卡片宽度保持不变
- **AND** 候选列表整体向左移动，侧栏出现在右侧

#### Scenario: 从候选卡片进入政策页

- **GIVEN** 用户位于 `/cities` 且珠海市已在侧栏中展示
- **WHEN** 用户点击侧栏的「查看完整政策与来源」
- **THEN** 页面跳转到 `/destinations/440400/policy`
- **AND** 展示珠海市养宠政策

#### Scenario: 候选页不内嵌政策内容

- **GIVEN** 用户位于 `/cities` 且尚未选择城市
- **WHEN** 页面渲染候选卡片
- **THEN** 候选列表不展示政策要点、禁养犬种名单或可携带犬种名单
- **AND** 不展示政策侧栏

### Requirement: 禁养犬种精确匹配

系统 SHALL 提供按品种名精确匹配的判定能力（纯函数 `breedHitsBanList`）；MUST NOT 支持别名、混血或模糊匹配。无档案、品种为空或品种为「其他」时 SHALL 不命中。该判定 SHALL 同时用于候选卡片匹配标签与城市政策侧栏，并沿用「候选卡片匹配标签」与「禁养犬种匹配与高亮提醒」的匹配主体规则。档案品种枚举与禁养名单 SHALL 使用同一品种词表（对外部档案能力的契约要求）。

#### Scenario: 精确匹配判定

- **GIVEN** 禁养名单含「比特犬」
- **WHEN** 以品种「比特犬」判定
- **THEN** 命中；以「比特」「比特斗牛梗」等别名或部分名判定不命中

#### Scenario: 缺省品种不命中

- **GIVEN** 禁养名单非空
- **WHEN** 以空品种、「其他」或无档案判定
- **THEN** 不命中

#### Scenario: 数据源未定不展示 Badge 与提醒

- **GIVEN** 候选接口的 `policyCovered`/`bannedBreeds` 仍为占位值
- **WHEN** 候选列表渲染或用户选定城市
- **THEN** 候选卡片不展示政策收录 Badge 与基于候选字段的禁养提醒
- **AND** 政策结论只由政策接口与政策侧栏提供

#### Scenario: 禁养名单为空不命中

- **GIVEN** 城市政策的禁养犬种关联为空
- **WHEN** 以任一品种执行精确匹配
- **THEN** 不命中
- **AND** 系统不给出禁养结论

### Requirement: 候选政策字段占位

候选接口 SHALL 保留 `policyCovered` 与 `bannedBreeds` 字段。本变更内二者仍 SHALL 占位返回 `policyCovered=false` 与空禁养名单，前端 MUST NOT 据此展示政策正文或禁养结论；城市政策正文 SHALL 由 `GET /api/cities/{adcode}/pet-policy` 提供，由当地政策能力承接。政策数据的公开来源与核验要求由 `city-pet-policy` 能力定义。

#### Scenario: 占位字段可读取

- **GIVEN** 系统已完成初始化
- **WHEN** 已登录用户请求城市候选接口
- **THEN** 每个候选含 `policyCovered=false` 与空 `bannedBreeds` 数组

#### Scenario: 占位字段不承载政策正文

- **GIVEN** 城市已通过政策接口收录政策
- **WHEN** 前端渲染该城市候选卡片
- **THEN** 卡片不因候选字段展示政策正文或禁养结论
