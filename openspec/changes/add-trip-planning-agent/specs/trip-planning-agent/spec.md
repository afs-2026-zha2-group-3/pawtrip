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

### Requirement: Agent identifies the trip planning target
Agent SHALL 区分新建行程与修改已有行程。修改已有行程时 SHALL 仅允许用户选择本人行程；目标不明确时 MUST 先询问，且 MUST NOT 因选择或编辑目标而隐式激活行程。

#### Scenario: User selects an inactive trip
- **GIVEN** 用户有一个已保存但未激活的行程
- **WHEN** 用户选择该行程作为编辑目标
- **THEN** Agent 以该行程为目标继续规划
- **AND** 该行程保持未激活

#### Scenario: Target is ambiguous
- **GIVEN** 用户同时有多个行程且未指明编辑目标
- **WHEN** 用户要求修改已有行程
- **THEN** Agent 展示本人可选行程并询问用户选择
- **AND** 在用户选择前不应用行程修改

### Requirement: Agent creates a new trip only after confirmation
Agent SHALL 能通过现有草稿流程协助用户完成新行程的城市、天数与单只宠物配置。新行程配置 MUST 遵循单城市、单宠物及前端草稿的 1–7 天限制；用户确认配置前 MUST NOT 创建持久化行程。存在激活行程时，Agent MUST 先经用户明确确认取消当前激活行程，且 MUST 先完成待发送的自动保存，取消成功后才可创建；同一时间 MUST 不超过一个激活行程。创建后的地点编排 SHALL 先展示可审核方案，用户确认后才写入行程并触发自动保存。

#### Scenario: Prepare a new trip draft without an active trip
- **GIVEN** 用户没有激活行程
- **WHEN** 用户描述城市、天数和宠物
- **THEN** Agent 通过现有草稿流程协助完成配置并请求用户确认
- **AND** 用户确认前不创建持久化行程

#### Scenario: Existing draft is replaced
- **GIVEN** 用户已有未确认的行程草稿
- **WHEN** Agent 准备为另一个新行程启动草稿
- **THEN** Agent 先说明将替换现有草稿并请求确认
- **AND** 用户确认前不覆盖草稿

#### Scenario: Confirm a new trip
- **GIVEN** Agent 已协助完成新行程的城市、天数与宠物配置
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
- **GIVEN** 新行程缺少有效城市、宠物或 1–7 天范围内的天数
- **WHEN** Agent 准备生成可确认方案
- **THEN** Agent 询问缺失或无效的信息
- **AND** 不创建持久化行程

### Requirement: Agent edits existing trips through a reviewable proposal
Agent 对已有行程的规划修改 SHALL 先形成可审核的方案；用户确认后，系统 SHALL 更新所选行程，且 MUST 保持其原有激活状态。新行程创建后的地点编排适用相同规则。应用前系统 SHALL 重新读取目标行程，并以该详情中的 `name`、`totalDays`、`transportMode` 与审核后的计划整体替换保存；`plan` 以外的字段 MUST 保持应用前的值。目标行程不存在时 MUST 终止应用；目标在预览后发生变化时 SHOULD 要求重新审核。

#### Scenario: Apply changes to the active trip
- **GIVEN** 用户选择当前激活行程且 Agent 展示了变更
- **WHEN** 用户确认应用变更
- **THEN** 所选行程计划通过 Pawtrip 的行程编辑与保存流程更新
- **AND** 大交通方式、名称与总天数保持不变

#### Scenario: Apply changes to an inactive trip
- **GIVEN** 用户选择已保存但未激活的行程且 Agent 展示了变更
- **WHEN** 用户确认应用变更
- **THEN** 所选行程通过 Pawtrip 的前端保存流程更新
- **AND** 该行程仍保持未激活
- **AND** 大交通方式、名称与总天数保持不变

#### Scenario: Reject a proposed edit
- **GIVEN** Agent 已展示已有行程的变更方案
- **WHEN** 用户拒绝或放弃该方案
- **THEN** 已保存行程保持不变

#### Scenario: Target trip is deleted before apply
- **GIVEN** Agent 已展示已有行程的变更方案
- **WHEN** 用户确认应用时该行程已不存在
- **THEN** 系统终止应用并告知用户
- **AND** 不创建或修改任何行程

#### Scenario: Target trip changed before apply
- **GIVEN** Agent 已展示已有行程的变更方案
- **WHEN** 应用前发现目标行程已被其他操作修改
- **THEN** 系统要求用户重新审核更新后的方案
- **AND** 不直接覆盖最新数据

#### Scenario: Active trip changed externally
- **GIVEN** 用户正在预览当前激活行程的变更
- **WHEN** 应用前发现该行程已在其他标签页被修改
- **THEN** 系统要求重新审核
- **AND** 不覆盖最新保存的数据

#### Scenario: Save fails validation
- **GIVEN** 用户确认应用已有行程的方案
- **WHEN** 保存返回 `400 VALIDATION_ERROR`
- **THEN** 系统告知用户方案未生效
- **AND** 保留待审核方案供修改
- **AND** 不以服务端数据静默替代方案

### Requirement: Agent uses only saved Pawtrip locations
Agent SHALL 通过登录后可读的共享已保存地点接口，在规划目标行程城市内按全部地点类型查找候选；范围不限于当前激活行程城市或景点类别。Agent MUST NOT 调用地图搜索、管理员地点接口，或将未收录的地点编造成可排程的地点 ID。

#### Scenario: Requested location exists in Pawtrip
- **GIVEN** 用户指定的地点可在 Pawtrip 已收录地点中匹配
- **WHEN** Agent 生成行程方案
- **THEN** 方案引用该地点的真实 Pawtrip 地点标识

#### Scenario: Lookup follows the planning target city
- **GIVEN** 用户选择了非激活行程或指定新行程城市作为规划目标
- **WHEN** Agent 查找地点候选
- **THEN** 只查询该规划目标城市的 Pawtrip 已保存地点
- **AND** 不限于当前激活行程的城市或“景点”类型

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

#### Scenario: Target city has no saved locations
- **GIVEN** 规划目标城市没有任何已保存地点
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
- **GIVEN** 规划目标城市的已保存地点超过抓取上限
- **WHEN** Agent 查找候选
- **THEN** Agent 告知匹配可能不完整
- **AND** 允许用户按地点类型缩小范围

### Requirement: Agent respects existing trip constraints and pet policies
Agent 生成或修改的计划 MUST 符合现有 trip 数据契约及目标行程的城市、宠物和天数约束。已有行程的城市、宠物与 `totalDays` MUST NOT 由 Agent 修改；新行程天数 MUST 为 1–7 的整数。景点宠物政策结论 MUST 由 Pawtrip 确定性规则计算，模型 MUST NOT 自行裁定政策结果。

#### Scenario: Existing trip days remain unchanged
- **GIVEN** 用户选择编辑一个已有行程
- **WHEN** Agent 生成修改方案
- **THEN** 方案只调整计划内的地点安排
- **AND** 不修改该行程的 `totalDays`、城市或绑定宠物

#### Scenario: Requested location is outside the trip city
- **GIVEN** 用户要加入的已收录地点不属于目标行程城市
- **WHEN** Agent 生成或修改该行程方案
- **THEN** Agent 不将该地点排入目标行程
- **AND** 对新行程询问是否调整新行程城市或移除该地点；对已有行程说明城市不可变并引导用户新建行程或移除该地点

#### Scenario: Existing trip city or pet would need to change
- **GIVEN** 用户要求修改已有行程的城市或绑定宠物
- **WHEN** Agent 处理该请求
- **THEN** Agent 说明已有行程的城市与宠物不可更改
- **AND** 可引导用户改为规划新行程

#### Scenario: Pet policy affects a location choice
- **GIVEN** 目标宠物对应的地点政策已配置
- **WHEN** Agent 说明该地点是否适合该宠物
- **THEN** 结论与 Pawtrip 确定性政策匹配结果一致

### Requirement: Agent operations are non-destructive
Agent MUST NOT 删除行程或宠物、创建或修改地点，或修改已有行程的城市、宠物与 `totalDays`。Agent 的写操作限定为更新目标行程的计划。

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
