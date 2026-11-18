# Tasks

## 1. 规划上下文与提示词

- [x] 1.1 扩展 `AgentPetContext`（`preferences: PetPreference[]`、`personality: PetPersonality | null`）与 `AgentTripCity`（`featureTags: string[]`）；在 `context.ts` 的 `toPetContext` 与 `agent-panel.tsx` 的城市解析中透传，城市未命中时兜底空数组，旧宠物档案按空数组/`null` 处理。补充上下文映射测试。
- [x] 1.2 更新 `buildSystemPrompt`：说明偏好/性格只影响推荐排序与选点倾向、不得覆盖确定性政策结论、`featureTags` 只读且缺失按未设置、缺失字段不得补造；同时修正现有提示词中两个 `10.` 编号重复。更新 `tools.ts` 中 `find_locations`（标签/评分）与 `get_location_detail`（今日营业时间/电话）的描述。

## 2. 地点查找与详情工具

- [x] 2.1 扩展 `find_locations`：`toCandidate` 输出可用的 `keytag` 与 `rating`；`matchLocationCatalog` 在名称完全相等、名称/地址包含匹配基础上纳入 `keytag` 包含匹配，保持歧义标记与候选上限不变。补充标签命中、歧义与字段白名单测试。
- [x] 2.2 扩展 `get_location_detail`：`GetLocationDetailOutput` 增加 `openTime` 与 `tel`；从 `LocationBrowseDetail` 透传，空值省略；保持 `openingHours`（每周）与 `openTime`（今日）语义区分。补充详情字段白名单、缺失字段省略与今日/每周区分测试。

## 3. 验证与文档

- [x] 3.1 运行 `cd apps/web && npm test` 与根目录 `npm run build`，确认无回归；运行 `node scripts/run-e2e.mjs e2e/trip-planning-agent.spec.ts`，确认现有 fake provider 用例通过（无新增 E2E 场景）。
- [x] 3.2 更新 Agent 数据边界文档（`docs/knowledge/architecture/` 中相关章节）：记录偏好/性格、城市特征标签与地点标签/今日营业时间/电话的只读消费方式及政策边界。
