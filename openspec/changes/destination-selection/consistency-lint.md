# Consistency lint — destination-selection

- change-id：destination-selection
- phase：p2（G1 前的开放 change，recipe P2 上下文预设）
- focus：全量（Shared + p2）
- 时间：2026-11-16（G1 Revision 后重跑：移除 paws-page delta，档案改外部依赖）
- artifact level：2（proposal + specs；design/tasks 未生成 → T1–T3、D1–D3、C2 记 N/A）
- 工具：`openspec validate destination-selection --strict` → valid

## Verdict

**Partial** — BLOCKER 0（未决）/ WARNING 2 / SUGGESTION 1 / N/A 3 组；另有 2 项 BLOCKER 级发现已在首轮修复。

## Findings

| id | severity | phase | location | issue | suggested_fix | evidence | authority | fact/inference |
|---|---|---|---|---|---|---|---|---|
| L1 | WARNING | p2 | `openspec/specs/web-app-shell/spec.md` Purpose | 主 spec Purpose 仍描述「Home/Paws 两 Tab」，delta 合并后将过时；OpenSpec 规则要求 Purpose 变更直接编辑主 spec，delta 不承载（paws-page 已不在本 change 范围，其 Purpose 无需处理） | P5 `/sdd:living-merge` 时同步更新 web-app-shell Purpose（含城市浏览与管理 Tab） | 主 spec Purpose 段 vs 本 change delta | spec | [fact] |
| L2 | SUGGESTION | p2 | `specs/destination-selection/spec.md` 数据需求 | 珠海/杭州收录状态与禁养名单具体值 deferred（REQ-005 OQ），规格仅约定字段与来源约束 | P4 实现前完成政府文件摘录，并核对品种词表覆盖官方名单用词 | REQ-005 OQ 表、deep-dive ① | proposal | [fact] |
| L5 | WARNING | p2 | `proposal.md` Impact/upstream；`specs/destination-selection/spec.md` Purpose 与禁养匹配需求 | 外部档案 change（US-01，远端 `feature/add-pet-schema`）现仅 pet 表 schema：无 breed 字段、无读取接口、无 `/paws` 页面；AC-2 完整口径与 AC-4 的实现/E2E 依赖其交付，且 breed 词表一致性需跨 change 协调 | G1 知悉依赖风险（需求方已确认等待策略）；P3/P4 前与对方对齐 breed 枚举、读取接口契约、合并顺序与 Flyway 版本号 | `git show origin/feature/add-pet-schema`（Pet.java/V8/V9）；proposal 风险③ | proposal | [fact] |
| L3 | BLOCKER（已修复） | p2 | `proposal.md` | 初稿缺独立 Non-Goals 章节（P3 规则）；Out-of-scope 内容混在 What Changes 末条 | 已新增 `## Non-Goals`（内容均为已确认 scope，无扩围） | proposal.md 章节结构 | proposal | [fact] |
| L4 | BLOCKER（已修复） | p2 | `proposal.md` Impact | 初稿未显式区分 self/upstream/downstream 三维（P4 规则） | 已按三维重排 Impact，内容不变 | proposal.md Impact 段 | proposal | [fact] |

## 检查明细

- Proposal P1/P2：Pass（Why/What Changes 非空）；P3/P4：见 L3/L4（已修复后 Pass）
- Spec S1：Pass（strict 校验通过）；S2/S2b/S2c：N/A（未使用引用前缀）；S3：Pass（13 条 requirement 均可追溯 proposal，见 dov-ac-review.md 追溯矩阵）；S4：Pass（scenario 均含 WHEN/THEN，多数含 GIVEN）；S5：Pass
- C1（proposal→spec 覆盖）：Pass（G1 Revision 后 proposal 与 delta 同步移除档案实现项）；C2：N/A（无 tasks）；C6：N/A（无引用）
- p2-1 scope 无静默扩围/丢失：Pass（Revision 为需求方显式决策，已同步 REQ-005/impact-brief/deep-dive）；p2-2 能力内部一致：Pass；p2-3 关键场景均有归属：Pass（档案输入声明为外部依赖）；p2-4：N/A；p2-5 无不可追溯 delta：Pass

## Residual risks

- L1 若 P5 遗忘 Purpose 更新，Living Spec 将残留过时描述（已列入 lint 报告供 living-merge 对照）。
- 种子数据准确性风险见 L2；词表不一致会导致精确匹配漏判（deep-dive ① 已约束同一词表）。
- **L5 外部依赖：档案 change 交付前，AC-2 完整口径与 AC-4 无法实现/E2E 验收；若对方 breed 词表与禁养名单不一致，精确匹配将漏判。需人工跨 change 协调，非本 change 可单方消除。**

## Reviewer

- agent：Qoder（首轮生成与修复 + G1 Revision 重跑）
- human sign-off：G1 Pass（IO/SA=HARLAN HUANG，2026-11-16，见 `g1-decision.md`）
- date：2026-11-16

## Next（non-Gate）

- `/sdd:g1-decision-record`（WARNING 不阻塞 G1，但需人工知悉 L1/L2/L5，尤其 L5 外部依赖风险）