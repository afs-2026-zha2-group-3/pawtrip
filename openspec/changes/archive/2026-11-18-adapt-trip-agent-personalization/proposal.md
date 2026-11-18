# Proposal

## Why

main 合入 REQ-014 后，Pawtrip 新增了宠物喜好/性格、城市特征标签，以及地点的标签、今日营业时间与电话等推荐字段。行程规划 Agent 目前只消费基础宠物属性、地点名称与地址，这些新数据对模型不可见，导致个性化推荐与选点无法利用，且地点详情中的“今日营业时间”和电话无法展示给用户。

## What Changes

- Agent 规划上下文增加当前绑定宠物的喜好（`preferences`，多选）与性格（`personality`，单选可空），以及规划城市的只读特征标签（`featureTags`）；旧宠物档案与无标签城市按“未设置”处理。
- 宠物喜好与性格仅用于推荐排序与选点倾向，MUST NOT 改变或替代确定性宠物政策结论，MUST NOT 用于补造未返回的数据。
- `find_locations` 候选增加自然语言标签（`keytag`）与评分（`rating`）；本地匹配覆盖名称、地址与标签，与地点浏览页搜索口径一致。
- `get_location_detail` 增加今日营业时间（`openTime`）与电话（`tel`），并与每周营业时间（`openingHours`）明确区分。
- 工具输出继续隐藏 `typeCode`、`typeGroup`、`regionCode`、原始 `petPolicies` 与 POI JSON；缺失字段不补造。
- 系统提示词与工具描述同步上述边界：偏好是软信号、标签是自由文本、政策结论只能引用确定性结果。

## Capabilities

### New Capabilities

- `trip-planning-agent`: 在既有行程规划 Agent 能力上新增个性化资料（宠物喜好/性格、城市特征标签）与地点推荐字段（标签、今日营业时间、电话）的只读消费要求。该能力由尚未归档的变更 `add-trip-planning-agent` 引入；本变更应在其归档后应用，已核对 `openspec/specs/` 中暂无同名主 spec。

### Modified Capabilities

- None. 本变更只向 `trip-planning-agent` 追加新要求，不改变其已有需求文本；不涉及其他既有能力。

## Impact

- 前端：`apps/web/src/lib/agent/context.ts`、`types.ts`、`tools.ts`、`client-tools.ts`、`locations.ts`、`components/agent/agent-panel.tsx`。
- 数据来源（均为现有只读接口，不新增后端接口、无数据库迁移）：`GET /api/pets` 的 `preferences`/`personality`、`GET /api/destinations` 的 `featureTags`、`GET /api/locations` 的 `keytag`、`GET /api/locations/{poiId}` 的 `openTime`/`tel`。
- 上游依赖：main 的 REQ-014 契约（`PetPreference`/`PetPersonality` 词表、`CityFeatureTags` 词表）与地点业务字段下发。
- 验证：`apps/web` 单元/组件测试与根目录构建；不新增 E2E 场景，沿用既有 fake provider 用例回归。
- 文档：同步更新 Agent 的规划数据边界说明（如 `docs/knowledge/architecture/` 中相关章节）。
