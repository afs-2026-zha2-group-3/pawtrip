# Consistency lint — refactor-web-ui-with-shadcn

- Change id: `refactor-web-ui-with-shadcn`
- Phase: `p2`
- Focus: change folder + Living Spec trace (`openspec/specs/`)
- Timestamp: 2026-11-14（Revision 3：rebase REQ-003 登录，需求编号改为 REQ-004，Delta Spec 增加受保护路由与登录 UI 要求；复核仍为 Pass）
- Artifact level: 3 + design（proposal + specs + tasks + design）
- Verdict: **Pass**
- Counts: BLOCKER 0 / WARNING 0 / SUGGESTION 0 / N/A 1

## Findings

| id | Severity | Phase | Location | Issue | Suggested fix | Evidence | Authority | Tag |
|---|---|---|---|---|---|---|---|---|
| — | — | p2 | — | 未发现阻断、漂移或可执行性缺口 | — | 见下方检查表 | proposal/spec/tasks/design | [fact] |

## Checks

### Proposal

| Rule | Result | Evidence |
|---|---|---|
| P1 `## Why` 存在且非空 | Pass | `proposal.md` Why 段 |
| P2 `## What Changes` 存在且非空 | Pass | `proposal.md` What Changes 段 |
| P3 Non-Goals / Out-of-scope 存在且非空 | Pass | `proposal.md` Non-Goals 段（5 项） |
| P4 Impact 覆盖自身 / 上游 / 下游 | Pass | `proposal.md` Impact：代码/依赖/接口数据/上游下游/风险/工作量 |

### Spec

| Rule | Result | Evidence |
|---|---|---|
| S1 Spec 结构符合 OpenSpec schema | Pass | 三个 delta 使用 `## ADDED Requirements` + `### Requirement` + `#### Scenario` |
| S2 引用前缀合法 | Pass | 变更包内无未知前缀 |
| S2b `@knowledge:` 可解析 | N/A | 变更包内无 `@knowledge:` 引用 |
| S2c `@rule:<ID>` 可解析 | Pass | REQ-004 的 `@rule:spec-first` 对应 `docs/knowledge/rules/process/spec-first.md` |
| S3 每个 Requirement 追溯到 proposal What Changes | Pass | 见 `dov-ac-review.md` Traceability 表 |
| S4 Scenario 使用 Given/When/Then | Pass | 所有场景均含 GIVEN / WHEN / THEN |
| S5 Scenario 归属 Requirement | Pass | 无孤儿 Scenario；项目沿用 Requirement 标题而非数字编号 |

### Tasks

| Rule | Result | Evidence |
|---|---|---|
| T1 单个任务 ≤ 约 2h | N/A | 任务未附工时估算 |
| T2 末尾任务为验证 / 回归 | Pass | `tasks.md` 5.1–5.6 为构建、浏览器、检索与回归验证 |
| T3 任务不超出 Spec 范围 | Pass | 任务仅覆盖清理、shadcn 基础设施、外壳与两页面、验证与架构知识更新 |

### Design

| Rule | Result | Evidence |
|---|---|---|
| D1 决策显式编号 | Pass | `design.md` Decisions 1–5 |
| D2 每个决策有背景 / 理由 | Pass | 每个决策含理由与取舍 |
| D3 每个决策记录备选方案 | Pass | 决策 1–5 均列出未采用的备选 |

### Cross-artifact

| Check | Result | Evidence |
|---|---|---|
| C1 proposal → spec 覆盖 | Pass | 3 个新增 capability 与 What Changes 逐项对应；错误页行为沿用既有 Living Spec，无需新增 delta |
| C2 spec → tasks 覆盖 | Pass | 每个 Requirement 至少对应 1 条任务（2.x、3.x、4.x、5.4） |
| C6 `@knowledge:` / `@rule:` 可达 | Pass | `@rule:spec-first` 可达；无 `@knowledge:` |
| p2 范围扩展 / 丢失 | Pass | Delta 与 proposal 范围一致；无 API/后端 delta |
| p2 Delta 内部一致性 | Pass | 三个 capability 的 actors、约束、场景互不冲突 |
| p2 关键场景有归属 | Pass | S1–S11 均映射到 `web-app-shell`、`paws-page`、`ui-foundation` 或既有 Living Spec / REQ-003 认证契约 |
| p2 任务与 Delta 方向一致 | Pass | 无与 Delta 冲突的任务 |

## N/A / Skipped

- P4 / S2b / T1 的 N/A 原因见上表；不影响整体判定。

## Fix suggestions

- 无提交前必须修复项。实现阶段注意：shadcn CLI 初始化参数（`--base base` / base-nova）、`routeTree.gen.ts` 重新生成、Base UI Tabs 在 SSR 下的受控路径映射、auth query 仅客户端启用与登录跳转时序。

## Residual risks

- shadcn CLI 在 TanStack Start + Tailwind 4 下的初始化输出可能与预期不同 → 以 CLI `info` / `--help` 与官方 `base-nova` registry 核对。
- 删除模板样式后可能存在未发现引用 → 以全局检索 + `npm run build` 兜底。
- 无前端自动化测试 → 依赖构建与浏览器 E2E；后续可独立引入。

## Reviewer metadata

- Reviewer: coding agent（只读检查）
- Human sign-off: `G1` 待 IO + SA 签署
- Date: 2026-11-14

## Next (non-Gate)

- `phase=p2` → `/sdd:g1-decision-record`（需 IO + SA 明确决策），或继续 `/sdd:p2`。
