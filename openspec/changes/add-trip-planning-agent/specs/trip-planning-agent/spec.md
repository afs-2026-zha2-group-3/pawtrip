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
Agent SHALL 能从用户提供的城市、天数、单只宠物和期望地点生成新行程方案。新行程方案 MUST 遵循单城市、单宠物及前端草稿的 1–7 天限制；用户确认前 MUST NOT 创建持久化行程。存在激活行程时，Agent MUST 先经用户明确确认取消当前激活行程，取消成功后才可创建；同一时间 MUST 不超过一个激活行程。

#### Scenario: Plan a new trip without an active trip
- **GIVEN** 用户没有激活行程
- **WHEN** 用户描述城市、天数、宠物和想去的地点
- **THEN** Agent 展示可审核的新行程方案
- **AND** 用户确认前不创建持久化行程

#### Scenario: Confirm a new trip
- **GIVEN** Agent 已展示新行程方案
- **WHEN** 用户明确确认创建
- **THEN** 系统通过现有创建流程持久化该行程
- **AND** 新行程按现有行为成为激活行程

#### Scenario: Active trip exists when creating a new trip
- **GIVEN** 用户已有激活行程
- **WHEN** 用户要求从零规划并确认创建新行程
- **THEN** Agent 说明将取消当前激活行程并请求确认
- **AND** 在用户确认且取消激活成功前不创建新行程
- **AND** 新行程创建后成为唯一激活行程

#### Scenario: Required trip information is missing
- **GIVEN** 新行程缺少有效城市、宠物或 1–7 天范围内的天数
- **WHEN** Agent 准备生成可确认方案
- **THEN** Agent 询问缺失或无效的信息
- **AND** 不创建持久化行程

### Requirement: Agent edits existing trips through a reviewable proposal
Agent 对已有行程的规划修改 SHALL 先形成可审核的方案；用户确认后，系统 SHALL 更新所选行程，且 MUST 保持其原有激活状态。

#### Scenario: Apply changes to the active trip
- **GIVEN** 用户选择当前激活行程且 Agent 展示了变更
- **WHEN** 用户确认应用变更
- **THEN** 所选行程计划通过 Pawtrip 的行程编辑与保存流程更新

#### Scenario: Apply changes to an inactive trip
- **GIVEN** 用户选择已保存但未激活的行程且 Agent 展示了变更
- **WHEN** 用户确认应用变更
- **THEN** 所选行程通过 Pawtrip 的前端保存流程更新
- **AND** 该行程仍保持未激活

#### Scenario: Reject a proposed edit
- **GIVEN** Agent 已展示已有行程的变更方案
- **WHEN** 用户拒绝或放弃该方案
- **THEN** 已保存行程保持不变

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
