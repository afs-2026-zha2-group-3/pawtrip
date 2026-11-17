# Spec Delta

## Purpose

让已登录用户通过自然语言规划或修改 Pawtrip 行程，并在 UI 中审核结果。Agent 可在没有激活行程时使用，且只将 Pawtrip 已收录地点作为行程候选。

## ADDED Requirements

### Requirement: Agent availability is independent of trip activation
登录用户 SHALL 能在无激活行程、存在激活行程或存在已保存未激活行程时使用行程规划 Agent。Agent 工作区 MUST NOT 要求先激活某个行程。

#### Scenario: No active trip
- **GIVEN** 用户没有激活行程
- **WHEN** 用户打开 Agent 并描述新行程需求
- **THEN** Agent 开始规划而不要求用户先激活行程

#### Scenario: Active trip exists
- **GIVEN** 用户有一个激活行程
- **WHEN** 用户打开 Agent
- **THEN** Agent 可用且不会自动修改该行程

### Requirement: Agent interface is a global collapsible panel
已登录用户 SHALL 在所有登录后页面通过右下角圆形入口按钮使用 Agent；点击入口 SHALL 展开 Agent 面板，对话、方案预览与确认等全部 Agent 操作 MUST 在面板内完成。入口与面板 MUST NOT 依赖激活行程存在；面板开关与对话状态 MUST 仅存于内存，刷新后丢失。处理请求时，面板 SHALL 显示面向用户的活动状态；同一时刻 MUST 最多显示一条活动状态，已结束的步骤 MUST 折叠。

#### Scenario: Entry is available on any authenticated page
- **GIVEN** 用户已登录
- **WHEN** 用户停留在任意登录后页面
- **THEN** 右下角显示 Agent 圆形入口按钮
- **AND** 入口不依赖激活行程存在

#### Scenario: All agent actions complete inside the panel
- **GIVEN** 用户已展开 Agent 面板
- **WHEN** 用户在面板内对话并生成方案
- **THEN** 方案预览与差异展示在面板内
- **AND** 确认与拒绝均在面板内完成
- **AND** 不需要离开当前页面

#### Scenario: Progress status is singular and readable
- **GIVEN** Agent 正在处理用户请求
- **WHEN** 模型思考或调用地点/行程工具
- **THEN** 面板显示且仅显示一条与当前动作对应的状态
- **AND** 状态使用用户可理解的动作文案（如正在规划行程、正在搜集景点、正在编辑行程）
- **AND** 已结束的步骤折叠，不逐条展开

#### Scenario: Panel state is not persisted
- **GIVEN** 用户展开了 Agent 面板并有待审核方案
- **WHEN** 用户刷新页面
- **THEN** 面板回到收起状态
- **AND** 对话与待审核方案丢失

### Requirement: Agent plans against the active trip
Agent SHALL 以当前激活行程作为唯一编辑目标，且 MUST NOT 在面板内提供规划目标切换。存在激活行程时，Agent 的城市、宠物、天数与现有计划 MUST 来自该行程。切换激活行程 SHALL 只在 Trips 页面进行；激活行程变化后，旧行程的全部待审核方案 MUST 失效并要求重新生成。无激活行程时，Agent SHALL 先通过创建行程确认流程创建并激活新行程，再在该行程上编排。

#### Scenario: Agent uses the active trip
- **GIVEN** 用户有一个激活行程
- **WHEN** 用户打开 Agent 并描述修改需求
- **THEN** Agent 以该激活行程为唯一目标
- **AND** 编辑前通过读取工具获取最新计划
- **AND** 面板内不提供规划目标切换

#### Scenario: Switching the active trip invalidates proposals
- **GIVEN** Agent 已为当前激活行程生成待审核方案
- **WHEN** 用户在 Trips 页面激活另一个行程
- **THEN** 旧行程的待审核方案失效
- **AND** 系统要求针对新的激活行程重新生成方案
- **AND** 旧方案未被写入任何行程

#### Scenario: No active trip
- **GIVEN** 用户没有激活行程
- **WHEN** 用户描述新行程需求
- **THEN** Agent 通过创建行程确认流程创建并激活新行程
- **AND** 创建后以该行程继续规划

### Requirement: Agent creates a new trip only after confirmation
Agent SHALL 能通过现有创建行程确认弹窗协助用户完成新行程的城市、起止日期与单只宠物配置。天数 MUST 由起止日期含首尾计算且为 1–7 的整数；宠物 MUST 为当前用户的一只宠物；用户在弹窗中确认前 MUST NOT 创建持久化行程。存在激活行程时，Agent MUST 先经用户明确确认取消当前激活行程，且 MUST 先完成待发送的自动保存，取消成功后才可创建；同一时间 MUST 不超过一个激活行程。创建后的地点编排 SHALL 先展示可审核方案，用户确认后才写入行程并触发自动保存。

#### Scenario: Prepare a new trip via the confirmation dialog
- **GIVEN** 用户没有激活行程
- **WHEN** 用户描述城市、日期和宠物
- **THEN** Agent 通过现有创建行程确认弹窗协助完成配置并请求用户确认
- **AND** 用户确认前不创建持久化行程

#### Scenario: User cancels the confirmation dialog
- **GIVEN** Agent 已协助填写创建行程确认弹窗
- **WHEN** 用户取消或关闭该弹窗
- **THEN** 不调用创建接口
- **AND** 当前激活行程保持不变
- **AND** 已填写的配置不持久化

#### Scenario: Confirm a new trip
- **GIVEN** Agent 已协助完成新行程的城市、日期与宠物配置
- **WHEN** 用户明确确认保存
- **THEN** 系统通过现有创建流程创建空计划行程
- **AND** 新行程按现有行为成为激活行程
- **AND** Agent 可在该行程上继续编排地点

#### Scenario: Continue planning after creation
- **GIVEN** Agent 已创建并激活新行程
- **WHEN** Agent 生成地点编排方案
- **THEN** Agent 先展示可审核方案
- **AND** 仅在用户确认后将方案写入行程并触发自动保存

#### Scenario: Unconfirmed plan is not persisted
- **GIVEN** Agent 已展示计划变更但用户尚未确认
- **WHEN** 用户继续对话或刷新页面
- **THEN** 行程数据保持不变
- **AND** 不触发保存请求

#### Scenario: Trip remains after planning is abandoned
- **GIVEN** Agent 已创建并激活新行程，但地点编排尚未完成
- **WHEN** 用户放弃本次规划
- **THEN** 已创建的行程保留
- **AND** 用户可在 Trips 页面删除该行程

#### Scenario: Active trip exists when creating a new trip
- **GIVEN** 用户已有激活行程
- **WHEN** 用户要求从零规划并确认创建新行程
- **THEN** Agent 说明将取消当前激活行程并请求确认
- **AND** 在用户确认且取消激活成功前不创建新行程
- **AND** 新行程创建后成为唯一激活行程

#### Scenario: Pending save before deactivation
- **GIVEN** 激活行程存在尚未发送的自动保存改动
- **WHEN** Agent 需要取消激活以创建新行程
- **THEN** 系统先完成保存
- **AND** 保存失败时不取消激活，也不创建新行程

#### Scenario: No pets available
- **GIVEN** 用户没有任何宠物
- **WHEN** 用户要求创建新行程
- **THEN** Agent 说明需要先创建宠物
- **AND** 不生成可确认的新行程方案

#### Scenario: Required trip information is missing
- **GIVEN** 新行程的城市、宠物无效，或日期区间推导的天数不在 1–7 天范围内
- **WHEN** Agent 准备生成可确认方案
- **THEN** Agent 询问缺失或无效的信息
- **AND** 不创建持久化行程

### Requirement: Agent reads the latest trip plan before editing
Agent MUST 在生成行程修改方案前读取当前激活行程的最新计划，并 SHALL 使用读取结果获得每天地点、顺序与未排期条目。读取 SHALL 来自客户端 `tripStore.active`，并返回版本标识；修改工具 MUST 携带该版本标识，版本与当前 store 不一致时 MUST 拒绝修改并要求重新读取。Agent MUST NOT 依赖历史消息中的计划快照，也 MUST NOT 用完整计划替换现有计划。

#### Scenario: Read before edit
- **GIVEN** 当前激活行程已有地点安排
- **WHEN** 用户要求修改行程
- **THEN** Agent 先读取最新计划与版本标识
- **THEN** 仅在读取后提交增量修改方案

#### Scenario: Plan changed after read
- **GIVEN** Agent 已读取行程计划但尚未提交修改
- **WHEN** 行程计划在 store 中发生变化
- **THEN** 修改被拒绝并要求重新读取最新计划
- **AND** 不写入基于过期计划的方案

### Requirement: Agent edits the active trip through reviewable incremental changes
Agent 对当前激活行程的规划修改 SHALL 先形成可审核的方案；用户确认后，系统 SHALL 更新该行程。Agent MUST 以增量操作（添加/移除地点、调整未排期）表达变更，MUST NOT 用一份完整计划替换现有计划，也 MUST NOT 移除用户未要求移除的已有地点。调整顺序或跨天移动 SHALL 通过移除原条目并按目标位置重新插入表达。应用前系统 SHALL 重新读取目标行程并比较版本，系统 MUST 先完成待发送的本地自动保存，保存失败 MUST 中止应用；`plan` 以外的字段 MUST 保持应用前的值。目标行程不存在或不再是当前激活行程时 MUST 终止应用；目标在预览后发生变化时 SHOULD 要求重新审核。应用成功后 MUST 从面板移除该待审核方案。

#### Scenario: Apply changes to the active trip
- **GIVEN** 用户正在规划当前激活行程且 Agent 展示了变更
- **WHEN** 用户确认应用变更
- **THEN** 该行程计划通过 Pawtrip 的行程编辑与保存流程更新
- **AND** 大交通方式、名称与总天数保持不变
- **AND** 面板不再显示该待审核方案

#### Scenario: Existing stops survive an incremental edit
- **GIVEN** 当前激活行程已手动添加了若干地点
- **WHEN** 用户要求 Agent 再插入一个景点并确认应用
- **THEN** Agent 基于最新计划生成只包含新增/调整操作的方案
- **AND** 应用后原有地点仍保留在行程中

#### Scenario: Reorder stops within a day
- **GIVEN** 当前激活行程第 1 天依次有地点 A、B
- **WHEN** 用户要求把 B 移到 A 前面并确认应用
- **THEN** 方案通过移除 B 并按新位置重新插入 B 表达
- **AND** 应用后该天顺序为 B、A，且 A 未被删除

#### Scenario: Move a stop to another day
- **GIVEN** 当前激活行程中地点 A 位于第 1 天
- **WHEN** 用户要求把 A 移到第 2 天并确认应用
- **THEN** 方案通过从第 1 天移除 A 并插入第 2 天表达
- **AND** 应用后 A 只出现在第 2 天

#### Scenario: Reject a proposed edit
- **GIVEN** Agent 已展示当前激活行程的变更方案
- **WHEN** 用户拒绝或放弃该方案
- **THEN** 已保存行程保持不变
- **AND** 面板关闭该待审核方案

#### Scenario: Target trip is deleted before apply
- **GIVEN** Agent 已展示当前激活行程的变更方案
- **WHEN** 用户确认应用时该行程已不存在
- **THEN** 系统终止应用并告知用户
- **AND** 不创建或修改任何行程

#### Scenario: Target trip is no longer active before apply
- **GIVEN** Agent 已展示某个行程的变更方案
- **WHEN** 用户确认应用前该行程已不再是激活行程
- **THEN** 系统终止应用并说明需要重新生成方案
- **AND** 不修改任何行程

#### Scenario: Target trip changed before apply
- **GIVEN** Agent 已展示当前激活行程的变更方案
- **WHEN** 应用前发现目标行程已被其他操作修改
- **THEN** 系统要求用户重新审核更新后的方案
- **AND** 不直接覆盖最新数据

#### Scenario: Active trip changed externally
- **GIVEN** 用户正在预览当前激活行程的变更
- **WHEN** 应用前发现该行程已在其他标签页被修改
- **THEN** 系统要求重新审核
- **AND** 不覆盖最新保存的数据

#### Scenario: Local edits are pending before apply
- **GIVEN** 用户正在预览当前激活行程的变更，且该行程存在尚未发送的本地自动保存改动
- **WHEN** 用户确认应用变更
- **THEN** 系统先完成待发送保存
- **AND** 保存失败时中止应用并保留待审核方案
- **AND** 不以 Agent 方案静默覆盖本地改动

#### Scenario: Save fails validation
- **GIVEN** 用户确认应用当前激活行程的方案
- **WHEN** 保存返回 `400 VALIDATION_ERROR`
- **THEN** 系统告知用户方案未生效
- **AND** 保留待审核方案供修改
- **AND** 不以服务端数据静默替代方案

### Requirement: Agent uses only saved Pawtrip locations
Agent SHALL 通过登录后可读的共享已保存地点接口，在当前激活行程城市内按全部地点类型查找候选；范围不限于“景点”类别。Agent MUST NOT 调用地图搜索、管理员地点接口，或将未收录的地点编造成可排程的地点 ID。

#### Scenario: Requested location exists in Pawtrip
- **GIVEN** 用户指定的地点可在 Pawtrip 已收录地点中匹配
- **WHEN** Agent 生成行程方案
- **THEN** 方案引用该地点的真实 Pawtrip 地点标识

#### Scenario: Lookup follows the active trip city
- **GIVEN** 当前激活行程位于某个城市
- **WHEN** Agent 查找地点候选
- **THEN** 只查询该行程城市的 Pawtrip 已保存地点
- **AND** 不限于“景点”类型

#### Scenario: Requested location is not in Pawtrip
- **GIVEN** 用户指定的地点无法在 Pawtrip 已收录地点中匹配
- **WHEN** Agent 生成行程方案
- **THEN** Agent 告知用户该地点未收录或询问其选择其他已收录地点
- **AND** 不调用地图搜索

#### Scenario: Multiple locations match the request
- **GIVEN** 用户指定的地点名称对应多个 Pawtrip 地点
- **WHEN** Agent 准备将该地点加入方案
- **THEN** Agent 展示候选并请求用户消歧
- **AND** 不自行选择并应用地点

#### Scenario: Active trip city has no saved locations
- **GIVEN** 当前激活行程城市没有任何已保存地点
- **WHEN** Agent 查找候选
- **THEN** Agent 告知该城市暂无可用于规划的已保存地点
- **AND** 不调用地图搜索
- **AND** 对新行程可询问是否更换城市

#### Scenario: Location disappears before apply
- **GIVEN** 预览方案引用了某 Pawtrip 地点，应用前该地点已不存在
- **WHEN** 系统应用方案
- **THEN** 终止应用并说明无效地点
- **AND** 不写入不存在的 `poiId`

#### Scenario: Catalog exceeds fetch limit
- **GIVEN** 当前激活行程城市的已保存地点超过抓取上限
- **WHEN** Agent 查找候选
- **THEN** Agent 告知匹配可能不完整
- **AND** 允许用户按地点类型缩小范围

### Requirement: Agent reads natural-language POI details for recommendations
Agent SHALL 能通过 `get_location_detail` 读取已收录地点的评分、自然语言地点类型、行政区、标签/商圈与营业时间，用于向用户推荐。工具输出 MUST NOT 包含 `typeCode`、`typeGroup`、`regionCode` 等无自然语义的代码，MUST NOT 包含原始 `petPolicies` 或原始 POI JSON；宠物政策结论 MUST 继续使用确定性 `policy` 结果。工具未返回的信息 MUST NOT 被编造。

#### Scenario: Recommend a location with detail fields
- **GIVEN** 地点详情返回评分、类型、区域、标签与营业时间
- **WHEN** Agent 向用户推荐该地点
- **THEN** Agent 可引用工具返回的上述字段
- **AND** 不补造未返回的信息

#### Scenario: Detail output hides raw codes
- **GIVEN** Agent 读取某个已收录地点的详情
- **WHEN** 工具返回结果
- **THEN** 结果不包含 `typeCode`、`typeGroup`、`regionCode`
- **AND** 结果不包含原始 `petPolicies` 与原始 POI JSON

#### Scenario: Detail field is missing
- **GIVEN** 地点详情缺少评分或营业时间
- **WHEN** Agent 推荐该地点
- **THEN** Agent 省略缺失信息
- **AND** 不猜测或补造字段值

### Requirement: Agent tool surface is explicitly allowlisted
Agent SHALL 只向模型暴露行程规划所需的固定工具集合。服务端 MUST 忽略客户端提交的 allowlist 之外的额外工具声明，且 MUST NOT 提供通用 fetch、地图搜索、管理员地点或绕过用户确认的行程/宠物写工具。

#### Scenario: Client declares an extra tool
- **GIVEN** 浏览器在对话请求中声明了一个不在 allowlist 内的工具
- **WHEN** 服务端构造模型工具集合
- **THEN** 该工具不会出现在模型可调用的工具集合中
- **AND** 模型无法通过该工具读取或修改数据

### Requirement: Agent respects existing trip constraints and pet policies
Agent 生成或修改的计划 MUST 符合现有 trip 数据契约及当前激活行程的城市、宠物和天数约束。已有行程的城市、宠物与 `totalDays` MUST NOT 由 Agent 修改；新行程天数 MUST 为 1–7 的整数。景点宠物政策结论 MUST 由 Pawtrip 确定性规则计算，模型 MUST NOT 自行裁定政策结果。

#### Scenario: Existing trip days remain unchanged
- **GIVEN** 用户编辑当前激活行程
- **WHEN** Agent 生成修改方案
- **THEN** 方案只调整计划内的地点安排
- **AND** 不修改该行程的 `totalDays`、城市或绑定宠物

#### Scenario: Requested location is outside the trip city
- **GIVEN** 用户要加入的已收录地点不属于当前激活行程城市
- **WHEN** Agent 生成或修改该行程方案
- **THEN** Agent 不将该地点排入行程
- **AND** 对新行程询问是否调整新行程城市或移除该地点；对已有行程说明城市不可变并引导用户新建行程或移除该地点

#### Scenario: Existing trip city or pet would need to change
- **GIVEN** 用户要求修改当前激活行程的城市或绑定宠物
- **WHEN** Agent 处理该请求
- **THEN** Agent 说明激活行程的城市与宠物不可更改
- **AND** 可引导用户改为规划新行程

#### Scenario: Pet policy affects a location choice
- **GIVEN** 目标宠物对应的地点政策已配置
- **WHEN** Agent 说明该地点是否适合该宠物
- **THEN** 结论与 Pawtrip 确定性政策匹配结果一致

### Requirement: Agent operations are non-destructive
Agent MUST NOT 删除行程或宠物、创建或修改地点，或修改已有行程的城市、宠物与 `totalDays`。Agent 的写操作限定为用户确认后创建新行程，以及以增量操作更新当前激活行程的计划。

#### Scenario: User requests deleting a trip
- **GIVEN** 用户在 Agent 对话中要求删除某个行程
- **WHEN** Agent 处理该请求
- **THEN** Agent 拒绝执行并说明只能通过 Trips 页面删除
- **AND** 不调用删除接口

#### Scenario: User requests creating a location
- **GIVEN** 用户在 Agent 对话中要求新增一个 Pawtrip 未收录的地点
- **WHEN** Agent 处理该请求
- **THEN** Agent 说明只能使用已收录地点
- **AND** 不调用管理员地点接口

### Requirement: Agent access is authenticated and user-scoped
行程规划 Agent SHALL 仅向已登录用户提供服务，并 SHALL 只读取该用户有权访问的宠物与行程。Agent MUST NOT 将客户端提交的用户标识作为身份或授权依据。

#### Scenario: Unauthenticated user invokes the Agent
- **GIVEN** 请求没有有效登录会话
- **WHEN** 用户尝试调用 Agent
- **THEN** 系统拒绝请求且不读取用户行程或宠物数据

#### Scenario: User requests another user's trip
- **GIVEN** 请求中的行程不属于当前登录用户
- **WHEN** Agent 尝试读取或修改该行程
- **THEN** 系统拒绝访问且该行程保持不变
