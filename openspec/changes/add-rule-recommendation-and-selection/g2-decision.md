# G2 decision — add-rule-recommendation-and-selection

- **Gate**: G2（Verify）
- **Change**: `add-rule-recommendation-and-selection`（REQ-007 / US-06）
- **Timestamp**: 2026-11-16T13:35:13+08:00

## Inputs

| 类型 | 路径 / 值 |
|---|---|
| 本地验证 | [20261116-133200-local-verify-report.md](../../../docs/ai4se-plugins/20261116-133200-local-verify-report.md)（Overall **Partial**） |
| 流水线 CI | [20261116-143430-pipeline-report.md](../../../docs/ai4se-plugins/20261116-143430-pipeline-report.md)（Overall **Pass**；`push` 触发的 Web CI + E2E CI 全绿，证据等级=人工确认，无 run id） |
| 流水线 CD | n/a |
| PR | **待创建** — 分支已推送 `origin/feat/rule-recommendation-and-selection`；base 先取 `feat/transport-rules-comparison` |
| 分支 | `feat/rule-recommendation-and-selection`（rebase 至 `feat/transport-rules-comparison`，后者再 rebase 至 `origin/main` @ `d92ecb9`；分支 tip 随后续文档提交前移，以 `git log` 为准；rebase 前为 `d1b6807` / `11d82e6`） |
| 上游依赖 | REQ-006 的 G2 记录：[../transport-pet-rules-comparison/g2-decision.md](../transport-pet-rules-comparison/g2-decision.md) |

## Dimension results

| 维度 | 结果 | 依据 |
|---|---|---|
| Build | Pass | `npm run build` exit 0（2026-11-16 13:26） |
| Static scan | Pass | 后端零改动；无新增依赖、无凭据、无迁移 |
| Code review | Pass | CRITICAL 0；W2/W3 已记录为跟踪项 |
| Evidence（OpenSpec） | Pass | `tasks.md` 15/15 完成；2 Requirements / 9 Scenarios（8 覆盖，1 见 V3） |
| CI | Pass | `push` 触发 Web CI + E2E CI 全绿（人工确认，无 run id）；Server CI 未触发（无 `apps/server/**` 变更） |
| CD | n/a | 无部署动作 |

## Defect grades

- CRITICAL：0
- WARNING：3
  - W1 `run-e2e.mjs` 清理临时 SQLite 触发 `EBUSY`（继承自 REQ-006）
  - W2 「档案加载失败」分支无自动化覆盖
  - W3 `weightKg` / `shoulderHeightCm` 若为 `null`，`null > 上限` 为 `false`，判定会静默判为「推荐」（当前 DB NOT NULL，不可达）
- SUGGESTION：3（S1 `staleTime` 60s 无失效入口、S2 E2E 锚定种子宠物名、S3 判定口径不含品种/笼具）

## Decision

**Conditional Pass**（本地 G2 通过，附带 2 项条件）

理由：核心能力（推荐列逐只判定、单选互斥与 `sessionStorage` 契约）实现与规格逐条对齐，V1/V2/V4–V8 Pass，UT 6 例 + E2E 4 例锁定行为。V3 的 Partial 来自 1 个 scenario 缺自动化（失败态），非实现缺失；W3 是类型层面的防御缺口，当前由 DB 约束兜住。

## Conditions + owners

| 条件 | Owner | 时点 |
|---|---|---|
| REQ-006 先合并，再提本分支 PR 并回填 `pipeline-report`（E1），CI 全绿方可进 G3 | kitty | 分支已推送 + E1 已回填（2026-11-16，人工确认）；REQ-006 合并与 PR 仍待办 |
| 补「档案加载失败」E2E（`page.route` 拦截 `/api/pets` 返回 5xx）或将 V3 显式接受为 Partial | kitty | 档案页落地时 / 下一 change |
| `weightKg`/`shoulderHeightCm` 的空值保护（或后端字段放宽时同步前端） | kitty | 后端字段变更时 |

## Waivers / accepted risks

| 风险 | 处置 |
|---|---|
| W1：`npm run test:e2e` 退出码 1 | **accepted** — 需求方 2026-11-16 明确不修，证据以 `32 passed` 为准 |
| 「无档案时隐藏推荐列」取舍 | **accepted** — 需求方 2026-11-16 选定；主路径为引导录入档案 |
| 判定口径仅 3 项硬条件（体重/肩高/检疫证明） | **accepted** — 需求方选定；原因逐条展示 + 页面免责声明 |
| 推荐结论建立在 2026-11-16 复核的规则上 | **accepted** — 见 REQ-006 G2 的同类风险条目 |

## Approvers

- **VL**: kitty（沿用 G1「全签 kitty」的指定；本轮用户明确选择「直接进 G2」）
- 本记录由 Agent 起草，签核人非 Agent 自身。

## Next

1. 提交本记录与 REQ-006 的 G2 记录（已随 `docs(REQ-007)` 提交）
2. 建 PR：base 先取 `feat/transport-rules-comparison`，REQ-006 合并后改为 `main`
3. `gh auth login` 后补 run 链接，将 E1 升级为机器证据
4. G3 + `/sdd:living-merge` → `/sdd:archive-change`（**必须先归档 REQ-006**，否则 delta 叠加会丢内容）

## Traceability appendix

| Requirement | Spec | Code | Test |
|---|---|---|---|
| 推荐列按宠物档案逐只判定 | `transport-rules-comparison-page`（delta） | `data/transport-rule-match.ts`、`routes/_authenticated/transport-rules.tsx` | `data/transport-rule-match.test.ts`（6 例）、`e2e/rule-recommendation-and-selection.spec.ts` |
| 交通方式单选与临时缓存 | `transport-rules-comparison-page`（delta） | `transport-rules.tsx`（`readSelectedMode` / `persistSelectedMode`） | `e2e/rule-recommendation-and-selection.spec.ts`（互斥 + 刷新回显） |
| 档案来源 | `backend-data-access`（复用） | `queries/pets.ts` → `GET /api/pets` | `e2e/transport-rules.spec.ts`「no-backend-coupling」 |
| 无档案提示 | `transport-rules-comparison-page`（delta） | `transport-rules.tsx`（`navigate({ to: "/paws" })`） | `e2e/transport-rules.spec.ts`「no-pet-profile」 |
