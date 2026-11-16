# Spec Delta

## Purpose

定义用户选择目的地的完整行为：在城市级行政区候选中搜索、按每人限养数做宠物友好筛选、选定目的地作为规划上下文。政策收录状态与禁养犬种名单的数据源未定（2026-11-16 需求方决定移除 V14 政策种子迁移），相关 Badge/提醒展示暂缓（TODO），接口保留占位字段。宠物档案（含品种）由外部档案能力（US-01 change）提供，本能力只读消费，不定义档案的创建与维护行为。

## ADDED Requirements

### Requirement: 目的地候选列表

系统 SHALL 在受登录保护的 `/cities` 页面展示候选列表，候选范围为全部城市级行政区（含珠海与杭州）。每张候选卡片 SHALL 展示城市名与所属省份。候选数据 SHALL 来自服务端接口，未认证请求 SHALL 返回 `401 UNAUTHENTICATED`。政策收录状态 Badge 暂缓展示（TODO：政策数据源确定后恢复）。

#### Scenario: 打开目的地选择页

- **GIVEN** 已登录用户
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示城市级行政区候选卡片（含杭州与珠海）
- **AND** 每张卡片显示城市名与省份

#### Scenario: 未认证请求候选接口

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求城市候选接口
- **THEN** 返回 `401` 与 Problem Details `code=UNAUTHENTICATED`

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

用户 SHALL 可从候选卡片选定一个城市作为行程规划目的地。选定后 SHALL 展示确认提示（含目的地城市名，并说明后续政策查看、交通规则对比与行程规划将使用该目的地），不另设规划上下文卡片。选定状态 SHALL 在浏览器端 sessionStorage 持久化：同标签页刷新后保留，重新选定 SHALL 覆盖先前选择，登出 SHALL 清除。后续政策查看与行程生成功能 SHALL 使用已选定的目的地。

#### Scenario: 选定目的地

- **GIVEN** 用户位于 `/cities` 候选列表
- **WHEN** 用户点击杭州卡片的「选定」
- **THEN** 展示「目的地已选定：杭州」确认提示
- **AND** 确认提示说明后续规划将使用杭州

#### Scenario: 刷新后选定保留

- **GIVEN** 用户已选定杭州
- **WHEN** 用户刷新页面或重新进入 `/cities`
- **THEN** 已选目的地仍为杭州

#### Scenario: 重新选定覆盖

- **GIVEN** 用户已选定杭州
- **WHEN** 用户选定珠海
- **THEN** 已选目的地变为珠海

### Requirement: 政策数据占位契约

候选接口 SHALL 保留 `policyCovered` 与 `bannedBreeds` 字段。政策数据源未定（TODO），当前 SHALL 占位返回 `policyCovered=false` 与空禁养名单，MUST NOT 预置政策种子数据。数据源确定后 SHALL 恢复收录状态与名单（条目含品种名、来源政府文件与更新时间）。政策条文详情展示 MUST NOT 由本能力承载（由当地政策能力承接）。

#### Scenario: 占位字段可读取

- **GIVEN** 系统已完成初始化
- **WHEN** 已登录用户请求城市候选接口
- **THEN** 每个候选含 `policyCovered=false` 与空 `bannedBreeds` 数组