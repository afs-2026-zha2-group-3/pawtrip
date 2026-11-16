# G2 decision — transport-pet-rules-comparison

- **Gate**: G2（Verify）
- **Change**: `transport-pet-rules-comparison`（REQ-006 / US-05）
- **Timestamp**: 2026-11-16T13:35:13+08:00

## Inputs

| 类型 | 路径 / 值 |
|---|---|
| 本地验证 | [20261116-124503-local-verify-report.md](../../../docs/ai4se-plugins/20261116-124503-local-verify-report.md)（Overall **Partial**；W4 已于 2026-11-16 闭合） |
| 流水线 CI | [20261116-143430-pipeline-report.md](../../../docs/ai4se-plugins/20261116-143430-pipeline-report.md)（Overall **Pass**；`push` 触发的 Web CI + E2E CI 全绿，证据等级=人工确认，无 run id） |
| 流水线 CD | n/a（纯前端静态展示，不在范围） |
| PR | **待创建** — 分支已推送 `origin/feat/transport-rules-comparison`；base=`main` |
| 分支 | `feat/transport-rules-comparison`（rebase 至 `origin/main` @ `d92ecb9`；分支 tip 随后续文档提交前移，以 `git log` 为准；rebase 前为 `11d82e6`） |

## Dimension results

| 维度 | 结果 | 依据 |
|---|---|---|
| Build | Pass | `npm run build` exit 0（2026-11-16 13:26） |
| Static scan | Pass | 无新增接口、无凭据、无表结构变更；规则为前端常量，人工摘录 |
| Code review | Pass | CRITICAL 0；W2 已修复；W1 需求方决定不修 |
| Evidence（OpenSpec） | Pass | `tasks.md` 22/22 完成；12 Requirements / 27 Scenarios；V3 的「不可状态」无对应数据，记为数据缺省 |
| CI | Pass | `push` 触发 Web CI + E2E CI 全绿（人工确认，无 run id）；Server CI 未触发（无 `apps/server/**` 变更） |
| CD | n/a | 无部署动作 |

## Defect grades

- CRITICAL：0
- WARNING：1（W1 `run-e2e.mjs` 清理临时 SQLite 触发 `EBUSY`，测试全绿但命令退出 1）
- SUGGESTION：3（S1 来源去重 O(n²)、S2 `SelectItem` 兜底死代码、S3 目录无飞机数据时无空态提示）

## Decision

**Conditional Pass**（本地 G2 通过，附带 1 项流水线条件）

理由：V1–V8 中 V1/V2/V4–V8 Pass，V3 的 Partial 属「无数据」而非缺实现；W4 合并门禁已闭合（8 条规则 `verifiedOn` 均为 2026-11-16）；无 CRITICAL。E1 已有 `push` 触发的 CI 全绿证据（人工确认），但缺 run id 与 PR 版（`pull_request` 事件）运行，因此仍不能记无条件 Pass。

## Conditions + owners

| 条件 | Owner | 时点 |
|---|---|---|
| 推送分支并创建 PR 后，回填 `pipeline-report`（E1），CI 全绿方可进 G3 | kitty | 分支已推送 + E1 已回填（2026-11-16，人工确认）；**PR 与 run id 待补** |
| 窄屏 Tab 布局人工目视一次（G1 遗留的 IO 跟踪项） | kitty | 本 G2 之后、合并前 |

## Waivers / accepted risks

| 风险 | 处置 |
|---|---|
| W1：`npm run test:e2e` 退出码 1（EBUSY） | **accepted** — 需求方 2026-11-16 明确不修；证据以 `32 passed` 为准 |
| 规则复核方式为官方页面摘要比对（官网 405 / TLS 超时） | **accepted** — 见报告「规则复核闭合」；发布前建议人工目视一次 |
| 规则时效性（高铁试点扩围、航司政策调整） | **accepted** — `verifiedOn` + 页面免责声明 + 一次常量变更即可更新 |
| 海航仅展示托运形态，客舱记录保留在目录 | **accepted** — G1 已裁定，客舱记录供 US-07 使用 |

## Approvers

- **VL**: kitty（沿用 2026-11-16 G1 会话中「全签 kitty」的指定；本轮用户明确选择「直接进 G2」）
- 本记录由 Agent 起草，签核人非 Agent 自身。

## Next

1. 提交本记录与 REQ-007 的 G2 记录
2. `/sdd:pr-submit`：分支已推送，建 PR（base=`main`）并回填 PR 号；`gh auth login` 后补 run 链接升级 E1
3. E1 已回填（2026-11-16，人工确认）
4. G3 + `/sdd:living-merge` → `/sdd:archive-change`

## Traceability appendix

| Requirement（Living/delta） | Spec | Code | Test |
|---|---|---|---|
| 四方式携宠规则对比 | `transport-rules-comparison-page` | `routes/_authenticated/transport-rules.tsx` | `e2e/transport-rules.spec.ts` |
| 飞机行按航司切换 | `transport-rules-comparison-page` | 同上（行内 `Select`） | `e2e/transport-rules.spec.ts`「switches only the flight row」 |
| 规则目录与来源披露 | `transport-rules-catalog` | `data/transport-rules.ts` | `e2e/transport-rules.spec.ts`「renders sources…」 |
| 复核状态展示 | `transport-rules-catalog` | `transport-rules.tsx`（`reviewedCount`） | `e2e/transport-rules.spec.ts`「shows a review state for every row」 |
| 顶部「交通规则」入口 | `web-app-shell` | `routes/__root.tsx`（AppTabs） | `e2e/transport-rules.spec.ts`（导航与守卫） |
| 登录守卫 | `web-app-shell` | `routes/_authenticated.tsx` | `e2e/authentication.spec.ts`、`e2e/transport-rules.spec.ts` |
