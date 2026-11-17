# Consistency lint — add-nearby-location-filter

- change-id: `add-nearby-location-filter`
- phase: p2
- focus: full-stage
- timestamp: 2026-11-17T13:12:00+0800
- artifact level: 3（proposal + specs + tasks）+ design
- tooling: 手动按 lint checklist 执行（仓库未提供独立 lint 二进制）

## Verdict

| BLOCKER | WARNING | SUGGESTION | N/A |
|---|---|---|---|
| 0 | 2 | 0 | 5 |

**Overall: Partial**（无 BLOCKER；存在 2 条 WARNING，需人工确认）

## Findings

| id | Severity | Phase | Location | Issue | Suggested fix | Evidence / Authority | Mark |
|---|---|---|---|---|---|---|---|
| L1 | WARNING | p2 | `design.md` D6 | D6（米制返回、公里展示）未记录被否决的备选方案 | 补一句备选（例如展示精度/单位策略）或显式标注无需备选 | design.md / `design` | [fact] |
| L2 | WARNING | p2 | `design.md` D7 | D7（不新增迁移）未记录被否决的备选方案 | 补一句“为何不新增列/空间索引”的备选说明 | design.md / `design` | [fact] |

### 已通过项

| Rule | Result | Evidence |
|---|---|---|
| P1 Why | Pass | `proposal.md` `## Why` |
| P2 What Changes | Pass | `proposal.md` `## What Changes` |
| P3 Non-Goals | Pass（本轮补齐命名章节） | `proposal.md` `## Non-Goals` |
| P4 Impact 三维 | Pass | `proposal.md` `## Impact`（后端/前端/测试/数据库/前置基线） |
| S1 Spec 结构 | Pass | `## ADDED Requirements` + `### Requirement` + `#### Scenario` |
| S3 Requirement 追溯 | Pass | 4 个 Requirement 均映射到 What Changes |
| S4 Given/When/Then | Pass | 27 个 Scenario 均使用 Given/When/Then |
| S5 Scenario 归属 | Pass | 无孤立 Scenario |
| T2 验证收尾 | Pass | `tasks.md` 5.3 为验证/Gate 收尾 |
| T3 Task 边界 | Pass | 未发现与本 Delta 无关的任务 |
| D1 决策编号 | Pass | D1–D7 |
| D2 决策背景 | Pass | 每个决策含选择理由 |
| C1 Proposal→Spec | Pass | 酒店下拉/景点页锚点、餐厅门禁、5km 过滤与文案、`nearPoiId` 契约均有 Requirement |
| C2 Spec→Tasks | Pass | 4 个 Requirement 均至少一个任务组 |

## N/A / Skipped

| Item | Reason |
|---|---|
| S2 / S2b / S2c | 本 Delta 未使用 `@knowledge:` / `@rule:` 等引用前缀 |
| C6 引用可达性 | 无引用前缀 |
| T1 任务规模 | tasks 未填写时间估算 |
| P5 checks | 本次 phase=p2 |

## Fix suggestions by priority

1. 补 `design.md` D6/D7 的备选方案说明（WARNING，非阻塞）。
2. 无需修改 Delta Spec；范围与 proposal、tasks 一致。

## Residual risks

- `unify-location-browsing` 已于 2026-11-17 随 origin/main 归档，归档顺序依赖已解除。
- 本地验证报告为 Partial；G2 前需闭环实现收尾与 CI 证据。
- 恰好 5000m 边界、景点页锚点不改变列表、行程切换清空锚点缺少自动化（详见 `dov-ac-review.md`）。

## Reviewer metadata

- Agent: Qoder（read-only lint，未改写 spec）
- Human sign-off: pending（SA/VL）
- Date: 2026-11-17

## Next

- G1 已记录 Pass；继续准备 G2（需 PR/CI 与本地验证闭环）。
- 可选：修复 WARNING 后复跑 `phase=p2`。
