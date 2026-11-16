# G2 decision — transport-pet-rules-comparison

- **Gate**: G2（Verify）
- **Change**: `transport-pet-rules-comparison`（REQ-007 / US-05；原登记 REQ-006，因 main 已将 REQ-006 用于「选择目的地」而于 2026-11-16 合并 main 时改编号）
- **Timestamp**: 2026-11-16T13:35:13+08:00

## Inputs

| 类型 | 路径 / 值 |
|---|---|
| 本地验证 | [20261116-124503-local-verify-report.md](../../../docs/ai4se-plugins/20261116-124503-local-verify-report.md)（Overall **Partial**；W4 已于 2026-11-16 闭合） |
| 流水线 CI | [20261116-143430-pipeline-report.md](../../../docs/ai4se-plugins/20261116-143430-pipeline-report.md)（Overall **Pass**；E1 全绿 = 三轮共 10 个 job `success`，机器证据；本 change 合并 main 后的提交 `18e5138`：Web CI 28s / E2E CI 2m59s / Server CI 39s） |
| 流水线 CD | n/a（纯前端静态展示，不在范围） |
| PR | [#45](https://github.com/afs-2026-zha2-group-3/pawtrip/pull/45)（base `main`；**已合并**，merge commit `e1169b4`；PR checks 已绿 = push run） |
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

理由：V1–V8 中 V1/V2/V4–V8 Pass，V3 的 Partial 属「无数据」而非缺实现；W4 合并门禁已闭合（8 条规则 `verifiedOn` 均为 2026-11-16）；无 CRITICAL。E1 已升级为机器证据（三轮 push run 共 10 个 job 全 success）。

**2026-11-16 条件收口**：条件 1 已闭合（PR #45 合并，`e1169b4`）；条件 2（窄屏 Tab 目视）经需求方决定转为 accepted waiver（见下表第 1 行）。本 change 的 G2 条件全部收口，可进 G3。

## Conditions + owners

| 条件 | Owner | 时点 |
|---|---|---|
| 推送分支并创建 PR 后，回填 `pipeline-report`（E1），CI 全绿方可进 G3 | kitty | **已闭合**（2026-11-16）：PR #45 + E1 机器证据全绿 |
| 窄屏 Tab 布局人工目视一次（G1 遗留的 IO 跟踪项） | kitty | **转为 waiver**（2026-11-16）：需求方决定不动浏览器，见下表第 1 行 |

## Waivers / accepted risks

| 风险 | 处置 |
|---|---|
| **WAIVER：窄屏 Tab（5 项）布局未人工目视**（G1 遗留的 IO 跟踪项） | **accepted waiver** — 需求方 2026-11-16 明确「不动浏览器，记为 accepted waiver + residual risk」；依据：Tab 容器沿用 `web-app-shell` 既有 `AppTabs`（`routes/__root.tsx`），本 change 仅新增 1 项且位置在「城市」之后、管理员 Tab 之前，未改容器布局；兜底：E2E 已覆盖导航与守卫。**残留风险**：窄屏（≤375px）下 5 项可能换行过密或横向溢出，未被自动化或人工验证；若后续 IO 反馈问题，只需调整 Tab 排序/缩写文案，不需改数据层 |
| W1：`npm run test:e2e` 退出码 1（EBUSY） | **accepted** — 需求方 2026-11-16 明确不修；证据以 `32 passed` 为准 |
| 规则复核方式为官方页面摘要比对（官网 405 / TLS 超时） | **accepted** — 见报告「规则复核闭合」；发布前建议人工目视一次 |
| 规则时效性（高铁试点扩围、航司政策调整） | **accepted** — `verifiedOn` + 页面免责声明 + 一次常量变更即可更新 |
| 海航仅展示托运形态，客舱记录保留在目录 | **accepted** — G1 已裁定，客舱记录供 US-07 使用 |

## Approvers

- **VL**: kitty（沿用 2026-11-16 G1 会话中「全签 kitty」的指定；本轮用户明确选择「直接进 G2」）
- **Waiver 授权**: kitty（2026-11-16 指示「窄屏目视不动浏览器，记为 accepted waiver + residual risk，进入下一步」）
- 本记录由 Agent 起草，签核人非 Agent 自身。

## Next

1. 本记录与下游 REQ-008 的 G2 记录均已提交
2. PR #45 已合并入 `main`（merge commit `e1169b4`）；E1 已升级为机器证据（Web/E2E/Server 三个 job 全 success）
3. 窄屏 Tab 目视已转 waiver（2026-11-16），无残留阻塞项
4. G3 签核 + `/sdd:living-merge` → `/sdd:archive-change`

## Traceability appendix

| Requirement（Living/delta） | Spec | Code | Test |
|---|---|---|---|
| 四方式携宠规则对比 | `transport-rules-comparison-page` | `routes/_authenticated/transport-rules.tsx` | `e2e/transport-rules.spec.ts` |
| 飞机行按航司切换 | `transport-rules-comparison-page` | 同上（行内 `Select`） | `e2e/transport-rules.spec.ts`「switches only the flight row」 |
| 规则目录与来源披露 | `transport-rules-catalog` | `data/transport-rules.ts` | `e2e/transport-rules.spec.ts`「renders sources…」 |
| 复核状态展示 | `transport-rules-catalog` | `transport-rules.tsx`（`reviewedCount`） | `e2e/transport-rules.spec.ts`「shows a review state for every row」 |
| 顶部「交通规则」入口 | `web-app-shell` | `routes/__root.tsx`（AppTabs） | `e2e/transport-rules.spec.ts`（导航与守卫） |
| 登录守卫 | `web-app-shell` | `routes/_authenticated.tsx` | `e2e/authentication.spec.ts`、`e2e/transport-rules.spec.ts` |
