# Design

## Context

行程规划 Agent 已由未归档变更 `add-trip-planning-agent` 实现：客户端通过 `forwardedProps.agentContext` 传递行程元数据与宠物基础属性；`find_locations` 基于 `GET /api/locations` 的本地目录匹配，`get_location_detail` 基于 `GET /api/locations/{poiId}` 输出自然语言字段与确定性政策结论。

main 的 REQ-014 合并后新增了以下只读数据，当前 Agent 尚未消费：

- 宠物：`preferences`（多选，`SWIMMING/HIKING/GRASS_RUNNING/CITY_WALKING/SNOW_PLAY`，旧档案为空数组）与 `personality`（`ENERGETIC/CALM/TIMID`，可空）。
- 城市：`featureTags`（`COASTAL/MOUNTAIN/LAKE/GRASSLAND/CITY_PARK/SNOW`，只读，无标签为空数组）。
- 地点列表：`keytag`（自由文本标签）与 `rating`。
- 地点详情：`openTime`（今日营业时间）与 `tel`；`openingHours` 继续表示每周营业时间。

这些字段均已由现有接口下发，本变更只需扩展前端 Agent 的上下文、工具输出、匹配逻辑与提示词，不改后端。

## Goals / Non-Goals

**Goals:**

- 让 Agent 只读消费宠物喜好/性格与城市特征标签，并用于推荐排序与选点倾向。
- 让地点查找支持标签匹配，并让候选携带标签与评分。
- 让地点详情返回今日营业时间与电话，并与每周营业时间区分。
- 保持确定性宠物政策结论与现有工具 allowlist、确认/应用流程不变。

**Non-Goals:**

- 不新增城市推荐工具，也不改变 `prepare_new_trip` 的城市决策方式。
- 不修改宠物档案、城市特征标签或地点数据；不新增后端接口或迁移。
- 不改变多城市/多宠物限制、计划应用与保存契约。

## Decisions

### 上下文契约扩展而非新增读取工具

扩展 `AgentPetContext`（增加 `preferences`、`personality`）与 `AgentTripCity`（增加 `featureTags`），由 `toPetContext` 与 `AgentPanel` 的城市解析透传；城市解析不到时兜底空数组。服务端 `sanitizeAgentContext` 的顶层白名单不变，嵌套宠物对象按现有透传行为处理。

备选方案是新增 `get_pet_profile` 工具按需读取。放弃原因：Agent 本身已持有绑定宠物信息，新增工具会增加一次模型往返，且无额外权限边界收益。

### 喜好与性格只作为软信号

提示词明确：喜好/性格只能影响推荐倾向与排序；宠物政策结论必须来自 `matchLocationPolicy` 的确定性结果；城市特征标签为只读，缺失按未设置处理。地点层面只有自由文本 `keytag`，不复用城市级的“喜好→特征”确定性映射，避免把自由文本标签当成受控词表。

备选方案是在客户端为 `keytag` 定义受控映射并排序。放弃原因：标签来自地图数据，取值不稳定，维护映射会产生错误承诺。

### 地点查找在本地扩展标签匹配

在现有客户端目录匹配中增加 `keytag` 字段：保留“名称完全相等优先 → 名称/地址包含匹配”的既有顺序，并将 `keytag` 纳入包含匹配；候选输出增加 `keytag` 与 `rating`。目录仍按城市缓存、按 `typeGroup` 缩小范围。电话 `tel` 不进入候选，只在详情工具返回，避免列表噪声。

备选方案是依赖服务端检索。当前列表接口无名称检索，扩展服务端属于新接口范围，与既有设计边界不符。

### 详情工具补充今日营业时间与电话

`GetLocationDetailOutput` 增加 `openTime`、`tel`；`openingHours`（每周）与 `openTime`（今日）在工具描述和提示词中分别命名。空值沿用现有省略策略，不补造。输出继续隐藏 `typeCode`、`typeGroup`、`regionCode`、原始 `petPolicies` 与 POI JSON。

### 提示词与工具描述同步

在 `buildSystemPrompt` 中增加：偏好仅影响推荐、不得覆盖政策、缺失数据不编造、标签为自由文本；并修正现有提示词中两个 `10.` 编号重复的问题。工具描述同步 `find_locations`（标签/评分）与 `get_location_detail`（今日营业时间/电话）。

### 验证策略

- 单元/组件测试：上下文映射（含空数据）、候选字段白名单、标签匹配与歧义、详情字段白名单与今日/每周语义、提示词约束存在性。
- 回归：`cd apps/web && npm test`、根目录 `npm run build`；现有 fake provider E2E 用例保持通过。
- 不新增 E2E 场景：本次没有新的用户可见入口或导航变化。

## Risks / Trade-offs

- **`keytag` 是自由文本且可能缺失** → 只做文本包含匹配，不定义受控映射；缺失时不展示。
- **偏好与性格是用户可编辑的软信号** → 提示词禁止据此推断政策；政策结论仍由确定性函数给出。
- **电话属于联系信息** → 仅在用户读取地点详情时返回，不进入候选列表。
- **目录缓存可能短暂滞后** → 目录仍复用现有 5 分钟缓存；标签/评分变化不频繁，可接受。
- **提示词变长可能稀释约束** → 只在现有编号列表中追加集中条目，不重复描述字段。
- **依赖未归档变更** → 本变更的 spec delta 只向 `trip-planning-agent` 追加新要求，不重写其既有需求；应用前应确保 `add-trip-planning-agent` 已归档，使主 spec 存在。

## Migration Plan

无数据库或后端契约变更，仅前端 Agent 行为更新。按常规 Web 发布即可；回滚时隐藏 Agent 入口或回退本次前端改动，不影响现有行程创建、浏览与保存。

## Open Questions

- 后续是否需要基于 `featureTags` 与 `scoreCity` 提供城市推荐能力。本次明确不做，留待单独变更评估。
