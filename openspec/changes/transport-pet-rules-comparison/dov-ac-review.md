# Delta Spec AC / DoV Review

- change: `openspec/changes/transport-pet-rules-comparison`
- requirement: REQ-006 / US-05（规则前端写死、对比在后端随 US-06）
- step: generate（已在 `/sdd:proposal-split` 完成，`openspec validate --strict` 通过）+ review（本次）
- reviewer: agent（待 IO/SA 复核）
- date: 2026-11-16

## 结论

无 blocking Fail；2 项 Partial（均为「可延后、不改变规格」的类型），不阻塞 G1，但需在 G1 记录里点名。

## Acceptance criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每条要求至少一个可测 AC | Pass | `specs/transport-rules-catalog/spec.md`（4 要求 / 9 场景）、`specs/transport-rules-comparison-page/spec.md`（6 要求 / 13 场景）、`specs/web-app-shell/spec.md`（2 要求 / 5 场景） | 每条 Requirement 均有 ≥1 个 `#### Scenario` |
| AC-2 AC 可观察 | Pass | 对比页场景：四行、基础五列、状态标识、航司切换后单元格变化、底部四类文案、未登录跳 `/login` | 均为页面可观察结果，非"接口返回 200"类断言 |
| AC-3 负向/边界 | Pass | 目录：未复核不得发布、自驾无统一上限、同航司多形态；页面：未选航司默认值、未登录、无档案 | 主要边界均有场景覆盖 |
| AC-4 非实现细节 / 无模糊词 | Pass | 全文检索无 "appropriately / quickly / correctly / 正常工作" 等 | "至少包含…基础列" 为可判定表述；`transportRuleColumns` 等实现名只出现在 design.md，未进 spec |

## Definition of Verified (Delta Spec)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与提案一致 | Pass | `proposal.md` What Changes 4 条 ↔ 三份 delta spec | 提案列明 2 ADDED + 1 MODIFIED，delta 一一对应；未发现静默扩围 |
| DoV-2 歧义已列出或解决 | Partial | `design.md` Open Questions 2 条：档案路由最终路径（US-06 确认）、飞机行默认航司 | 二者均可延后且不改规格；建议 G1 记录中确认"默认取排序首个航司、档案路由集中一处常量" |
| DoV-3 角色关注点 | Partial | IO：顶部 Tab 变 4/6 项后的窄屏可用性；SA：`transport-rules-catalog` 为数据型能力，归档时可能被建议并入页面能力 | 仅记录残余风险，不阻断；实现阶段由 IO 复核 Tab 布局 |
| DoV-4 未宣称实现完成 | Pass | 本文件与 `tasks.md` 仅含规划，无代码改动 | 工作区未新增前端实现文件 |
| DoV-5 Delta 可追溯到提案/需求 | Pass | `proposal.md` → `specs/*` → `tasks.md` 1–5 组；REQ-006 场景 S1–S7 ↔ delta 场景 | REQ-006 S7（预留对比契约）明确不实现，delta 亦未写入"不推荐"判定，范围一致 |

## 残余风险（交 G1）

1. `verifiedOn` 为空的规则不得合并：已在 `tasks.md` 1.4 作为合并前置，但属人工动作，需 G1/G2 显式确认火车、海航、自驾来源已复核。
2. 海航同时存在托运与客舱两条规则，页面只按航司切换（默认托运）：需产品确认"客舱规则本版不展示"可接受。
3. `transport-rules-catalog` 与 `transport-rules-comparison-page` 的数据依赖为单向（页面消费目录），归档合并时需保持两份 spec 的能力边界不重叠。

## 建议下一步

- `/sdd:g1-decision-record`（需人签署）或继续 `/sdd:p2`（`/sdd:task-plan` 做设计/任务对齐自检）。
