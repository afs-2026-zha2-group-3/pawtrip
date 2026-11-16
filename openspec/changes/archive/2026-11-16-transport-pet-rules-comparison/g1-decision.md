# G1 decision — transport-pet-rules-comparison

- **Change id**: `transport-pet-rules-comparison`（REQ-007 / US-05）
- **Gate**: G1（Align）
- **Timestamp**: 2026-11-16 11:50 (+0800)

## Input artifacts

| 类型 | 路径 |
|---|---|
| Delta Spec | `specs/transport-rules-catalog/spec.md`（4 要求 / 9 场景） |
| Delta Spec | `specs/transport-rules-comparison-page/spec.md`（6 要求 / 13 场景） |
| Delta Spec | `specs/web-app-shell/spec.md`（2 要求 / 5 场景） |
| 提案 | `proposal.md`（2 ADDED + 1 MODIFIED，纯前端） |
| AC/DoV 复核 | `dov-ac-review.md`（AC-1..4 Pass；DoV-1/4/5 Pass；DoV-2/3 Partial） |
| 设计 | `design.md`（D1–D5）、`atdd-design.md`（E2E 唯一验收层） |
| 前置检查 | `docs/ai4se-plugins/20261116-114345-quality-checklist-report.md`（P3 Overall Pass） |

## Findings

- **范围**：与提案一致，无静默扩范围。规则全部前端常量；不建表、不加规则 API、不改鉴权白名单；不实现档案录入页与"不推荐"判定（US-06 承接）。入口为顶部新 Tab「交通规则」，`/cities` 保持现状。
- **歧义（原 DoV-2 Partial，G1 当场裁定）**：
  1. 飞机行默认航司 → 取 `sortOrder` 最小者（目录首个，预期国航）；如需改为其他航司只调整数据 `sortOrder`，不改渲染逻辑。
  2. 档案录入路由 → 集中一处常量（暂定 `/paws/profile`），US-06 定名时只改常量，不改页面代码；本变更只放按钮，不提供该页面。
- **残余风险（已接受，不阻断 G1）**：
  1. 火车、海航、自驾条目人工复核未完成 → 合并前置：`verifiedOn` 为空不得合并（G2 证据要求）。
  2. 海航同时有托运与客舱两条规则 → 本版下拉只按航司选择、默认展示托运；客舱记录保留在目录供 US-07 使用，页面不提供形态切换。
  3. 前端常量与 US-06 后端对比阈值可能两套 → 以 `id` + `weightLimitKg` 为迁移锚点，US-06 阶段一次性对齐。
  4. IO 关注：顶部 Tab 增至普通 4 项 / 管理员 6 项，窄屏拥挤 → 沿用现有 Tab 压缩策略，不新增长标签。
  5. SA 关注：`transport-rules-catalog` 为数据型能力，归档时若建议并入页面能力，以 Living Spec 评审结论为准。

## Decision

**Pass**

（两项 DoV-2 Partial 已在 G1 当场裁定，故不记 Conditional；其余风险作为 G2 前置条件跟踪。）

## Conditions + owners

| 条件 | Owner | 时点 |
|---|---|---|
| 补齐火车、海航、自驾条目的 `verifiedOn` 与来源核对 | kitty（SA 兼 IO） | 合并前（`/sdd:local-verify-report` 之前） |
| 确认档案路由常量最终路径 | kitty（SA 兼 IO） | US-06 启动时 |
| 窄屏 Tab 布局检查 | kitty（SA 兼 IO） | P4 本地验证 |

## Approvers

- **IO**: kitty
- **SA**: kitty

（同一人兼顾 IO 与 SA，已由用户在会话中明确指定"全签 kitty"。）

## Next

- `/sdd:atdd-apply`（red-first：先写 `e2e/transport-rules.spec.ts` 使其失败，再写常量与页面）。
