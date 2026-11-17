# AC / DoV Review

变更：`2026-11-17-add-trip-itinerary`

范围：检查 Delta Spec 与 US-48、需求方截图反馈、Design、Tasks 是否一致，并核对已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 行程单入口与 Trips 归属 | Pass | E2E：面板入口、Trips 激活卡片入口、分段导航与 Trips Tab 选中；未登录访问跳转 `/login` | 三处入口均有自动化用例 |
| AC-2 按天汇总与 Day 切换 | Pass | E2E `summarizes the active trip by day from the panel entry`：Day 1/2 切换 | 同一时刻只展示一天 |
| AC-3 日期由开始日期派生 | Pass | 单测跨年与星期；E2E `12月1日 周二` | 无 `startDate` 降级为第 N 天 |
| AC-4 时间线与途内交通 | Pass | E2E：快照「约 20 分钟」「¥27–40」、`估算暂不可用`、相邻同地点、自驾仅时长 | 快照优先；失败不阻塞其余内容 |
| AC-5 地点政策展开 | Pass | E2E：共享字段标签与值；`false` → 「不需要」；全空 → 「暂无详细规则」 | 复用 `petPolicyFields`，未配置字段不展示 |
| AC-6 当天提醒 | Pass | E2E：有提醒时展示「当天需携带牵引绳」；全空政策当天无提醒板块 | 复用 `deriveDayPolicy` |
| AC-7 未排期独立展示 | Pass | E2E「未排期」区域包含珠海无名景点 | 不混入时间线 |
| AC-8 未接入板块隐藏 | Pass | E2E 负向断言：无食宿/应急/天气/`暂无数据`/具体时间点 | 不伪造占位数据 |
| AC-9 无激活行程空态 | Pass | E2E 空态用例与未登录跳转用例 | 提供创建与查看行程入口 |
| AC-10 不新增后端与依赖 | Pass | 变更 diff 仅前端、E2E 与规格 | 复用既有接口 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、两份 delta | 单城市行程单，未接入板块明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` D1–D7 | 日期派生、Day 状态、导航归属、隐藏板块均有决策 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 无时间点、估算依赖高德、打印/导出未做 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0 | 无输出即通过 |
| DoV-5 前端单测 | Pass | `npm test -w apps/web` | 24 文件 191 项通过（含行程单 6 项） |
| DoV-6 受影响 E2E | Pass | 本地 `e2e/itinerary.spec.ts` 8 passed；PR #74 Browser E2E 9m38s SUCCESS | 定向与 CI 全量均通过 |
| DoV-7 浏览器结构验证 | Pass | 内置浏览器 | Day tab、日期头、时间线与空天状态正常 |
| DoV-8 规格校验 | Pass（本变更） | `openspec validate 2026-11-17-add-trip-itinerary --strict`；`openspec validate --specs` | 变更 strict 通过；主规格 23 passed / 0 failed；`--specs --strict` 仍为 17/23，6 项为既存 Purpose/长需求告警，非本变更引入 |

## Residual concerns

- 食宿（US-12）、应急（US-13）、天气（US-16）与具体时间点未接入，行程单不展示对应内容。
- 路线估算依赖高德与路况，失败时仅展示「估算暂不可用」；成功路径以快照固定展示，不断言真实金额。
- PR #74 CI 全绿：Browser E2E 9m38s、Web build 34s；合并提交 `fc03481`。
- 已提交 `9f98d0a` 并合并；未归档；G1/G2/G3 未签署。

## Review outcome

文档层 AC/DoV 检查为 **Pass（规格层）**；不代表 Gate 已批准，也不代表 CI 已通过。首轮评审发现的政策字段口径、快照/失败路径证据与场景级覆盖缺口已按上表补齐。
