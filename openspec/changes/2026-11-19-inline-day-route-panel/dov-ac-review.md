# AC / DoV Review — 行程单右侧常驻当天路线规划

变更：`2026-11-19-inline-day-route-panel`（REQ-021）

范围：核对 REQ-021 验收要求、Delta Spec、Design、Tasks 与当前证据；P2 做规格/设计复核，P4 依据本地验证结果复核 DoV 实施项；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 打开即见 | Pass | Delta「当天路线规划面板」场景「打开行程单即显示当前天路线」；Design D1/D3；Tasks 1.3、3.3 | 宽屏右栏常驻，默认 `Day 1`，无按钮 |
| AC-2 删除按钮与弹窗 | Pass | Delta「当天路线规划面板」正文；Design D4；Tasks 3.1–3.2 | 删除按钮、`routeDialogOpen`、`DayRouteDialog`，无隐藏入口 |
| AC-3 Day 联动 | Pass | Delta 场景「切换天同步面板内容」；Design D4；Tasks 3.3 | 共用 `day` 与 `locations`，不写回计划 |
| AC-4 整页滚动 + 吸顶 | Pass | Delta 场景「宽屏滚动时面板保持可见」；Design D1/D2；Tasks 1.1–1.3 | ≥1024px 两列；禁止列内滚动与高度锁定 |
| AC-5 窄屏堆叠 | Pass | Delta 场景「窄屏堆叠到行程单下方」；Design D6；Tasks 3.4 | 顺序：当天明细 → 面板 → 未排期 |
| AC-6 内容与降级一致 | Pass | Delta「当天路线绘制」「路线规划不可用时的降级」「路线面板空态」；Design D3；Tasks 2.1–2.2 | 文案逐字复用 `day-route.ts`；保留全部测试标识 |
| AC-7 导出隔离 | Pass | Delta 场景「导出不包含路线面板」；Design D5；Tasks 2.3、4.3 | 面板 `print:hidden`，不在图片导出容器 |
| AC-8 既有行为与测试同步 | Pass | Delta「携带清单入口与进度」「携带清单弹窗与操作」；Tasks 3.5、4.1–4.4 | 守卫、只读、导出、携带清单不变；E2E 重写 ≤30 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、Delta、`design.md` | 布局、面板、入口删除、PageFrame 加宽均在范围内；算法/后端/导出内容明确排除 |
| DoV-2 歧义已解决 | Pass | P1 OQ 8/8 resolved；`design.md` D1–D7 | 断点、滚动、窄屏顺序、默认天、导出边界已定稿 |
| DoV-3 残余风险已记录 | Pass | `design.md` 风险表；P1 impact-brief §7 | sticky 内地图、容器加宽、E2E 失败、导出混入、REQ-020 回退原因均有缓解 |
| DoV-4 Delta Spec 可校验 | Pass | `npx --no-install openspec change validate 2026-11-19-inline-day-route-panel --strict` → valid（2026-11-19） | 弹窗需求以 REMOVED + ADDED 迁移；两条 MODIFIED 保留原场景名 |
| DoV-5 场景覆盖与追溯 | Pass | 下表 | 8 个要求（2 ADDED + 4 MODIFIED + 2 REMOVED），24 个场景 |
| DoV-6 任务可执行 | Pass | `tasks.md` 4 组 17 项 | 每项含动作与验证点；纯前端直接实现 |
| DoV-7 实施交叉证据 | Pass | `tasks.md` 验证记录（2026-11-19）：vitest 375、tsc、web build、mvn 272、目标 E2E 16 passed | 面板、布局、入口删除均已落地 |
| DoV-8 跨 REQ 一致性 | Pass | P1 impact-brief §3–§4；`design.md` D1 | 不改其他页面宽度、导航、行程数据与导出 |
| DoV-9 迁移可验证 | Pass | 无数据/接口变化 | 回滚仅需恢复按钮与弹窗组件 |
| DoV-10 E2E 与全量验证 | Pass | Tasks 4.1–4.6；`npm run test:e2e -- e2e/day-route-planning.spec.ts e2e/itinerary.spec.ts` → 16 passed（2026-11-19） | 新增窄屏、导出隔离、空天与单点用例；`itinerary` 回归通过 |

## Requirement ↔ Scenario ↔ AC ↔ Task 追溯

| Delta Requirement | 类型 | Scenario 数 | AC | Tasks |
|---|---|---|---|---|
| 当天路线规划面板 | ADDED | 5 | AC-1、AC-2、AC-3、AC-4、AC-5、AC-7 | 1.3、2.1、3.1–3.4 |
| 路线面板空态 | ADDED | 2 | AC-6 | 2.1–2.2 |
| 当天路线绘制 | MODIFIED | 3 | AC-6 | 2.1–2.2 |
| 路线规划不可用时的降级 | MODIFIED | 3 | AC-6 | 2.1–2.2 |
| 携带清单入口与进度 | MODIFIED | 3 | AC-8 | 3.5、4.4 |
| 携带清单弹窗与操作 | MODIFIED | 6 | AC-8 | 3.5、4.4 |
| 当天路线规划入口与弹窗 | REMOVED | — | AC-1、AC-2 | 3.1–3.2 |
| 路线弹窗空态 | REMOVED | — | AC-6 | 3.1–3.2 |

- 合计 24 个场景：5 + 2 + 3 + 3 + 3 + 6 = 22 场景（新增/修改块），另有 2 条 REMOVED 需求完成迁移；AC-1…AC-8 全部有场景与任务承接。

## Residual concerns

1. 已目视确认 ≥1024px 两栏与右栏 26rem 布局；真实高德 Key 下的地图交互仍受本地 `.env` 缺失限制，降级占位已验证。
2. 已由 E2E 窄屏用例断言面板在当天明细之后且无弹窗；1024px 边界未单独出例。
3. 已由导出用例断言打印态隐藏面板、图片导出容器不含面板与地图。
4. 目标 spec 与 `itinerary` 回归共 16 例通过；本 change 未改动其他页面。
