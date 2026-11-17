# Consistency lint — add-location-map

- change-id: `add-location-map`
- phase: p2
- focus: full-stage
- timestamp: 2026-11-17T13:12:00+0800
- artifact level: 3（proposal + specs + tasks）+ design
- tooling: 手动按 lint checklist 执行（仓库未提供独立 lint 二进制）

## Verdict

| BLOCKER | WARNING | SUGGESTION | N/A |
|---|---|---|---|
| 0 | 1 | 0 | 5 |

**Overall: Partial**（无 BLOCKER；存在 1 条 WARNING，需人工确认）

## Findings

| id | Severity | Phase | Location | Issue | Suggested fix | Evidence / Authority | Mark |
|---|---|---|---|---|---|---|---|
| L1 | WARNING | p2 | `design.md` D1、D3–D5 | 这几项决策未记录被否决的备选方案（D2/D6 有） | 为加载方式、布局、联动状态与降级策略各补一句备选或标注无需备选 | design.md / `design` | [fact] |

### 已通过项

| Rule | Result | Evidence |
|---|---|---|
| P1 Why | Pass | `proposal.md` `## Why` |
| P2 What Changes | Pass | `proposal.md` `## What Changes` |
| P3 Non-Goals | Pass（本轮补齐命名章节） | `proposal.md` `## Non-Goals` |
| P4 Impact 三维 | Pass | `proposal.md` `## Impact`（前端/后端/数据库/文档/测试） |
| S1 Spec 结构 | Pass | `## ADDED Requirements` + `### Requirement` + `#### Scenario` |
| S3 Requirement 追溯 | Pass | 2 个 Requirement 均映射到 What Changes |
| S4 Given/When/Then | Pass | 12 个 Scenario 均使用 Given/When/Then |
| S5 Scenario 归属 | Pass | 无孤立 Scenario |
| T2 验证收尾 | Pass | `tasks.md` 6.5 为重启后端确认 |
| T3 Task 边界 | Pass | 6.x 详情卡片与摘要字段均在 Delta 内 |
| D1 决策编号 | Pass | D1–D6 |
| D2 决策背景 | Pass | 每个决策含选择理由 |
| C1 Proposal→Spec | Pass | 地图展示/联动、详情卡片与摘要字段均有 Requirement |
| C2 Spec→Tasks | Pass | 两个 Requirement 分别由 tasks 1–5 与 6 承接 |

## N/A / Skipped

| Item | Reason |
|---|---|
| S2 / S2b / S2c | 本 Delta 未使用 `@knowledge:` / `@rule:` 等引用前缀 |
| C6 引用可达性 | 无引用前缀 |
| T1 任务规模 | tasks 未填写时间估算 |
| P5 checks | 本次 phase=p2 |

## Fix suggestions by priority

1. 补 `design.md` D1、D3–D5 的备选方案说明（WARNING，非阻塞）。
2. 无需修改 Delta Spec；范围与 proposal、tasks 一致。

## Residual risks

- `tasks.md` 6.5 未闭环（重启后端确认照片/评分）。
- 真实地图链路无自动化；E2E 强制空 Key，marker/InfoWindow/卡片联动依赖人工验证与代码审查。
- 安全密钥直连前端 bundle，生产需代理方案。
- V22 依赖开发库存在同名真实 POI，否则卡片缺少照片/评分。

## Reviewer metadata

- Agent: Qoder（read-only lint，未改写 spec）
- Human sign-off: pending（SA/VL）
- Date: 2026-11-17

## Next

- G1 已记录 Pass；继续准备 G2（需 PR/CI 与 6.5 闭环）。
- 可选：修复 WARNING 后复跑 `phase=p2`。
