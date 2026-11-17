# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-add-trip-itinerary`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | `specs/trip-itinerary`、`specs/web-app-shell`、`design.md` | D1 数据源与恢复态、D2 日期、D3 Day 状态、D4 交通、D5 共享政策、D6 导航、D7 隐藏板块均有对应描述 |
| Spec → ATDD | Pass | `atdd-design.md` | 每个 Scenario 均映射到单测或 E2E 用例（见下表） |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 数据模型、页面、导航、测试、规格同步、评审修复与验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.4、6.1–6.3 | 单测、E2E 与共享政策口径均有对应用例 |
| AC-1 traceability | Pass | Spec `行程单入口与导航`；Tasks 2.4、3.1、3.2、6.2 | 面板、Trips 卡片、分段导航、登录守卫 |
| AC-2/AC-3 traceability | Pass | Spec `按天汇总与日期`；Tasks 1.1、2.2、3.2 | Day 切换与日期派生 |
| AC-4 traceability | Pass | Spec `时间线与途内交通`；Tasks 1.2、2.3、6.2 | 快照、失败、同地点、自驾 |
| AC-5 traceability | Pass | Spec `地点携宠政策展开`；Tasks 2.2、6.1、6.2 | 共享字段、`false` 与全空 |
| AC-6 traceability | Pass | Spec `当天提醒`；Tasks 2.2、6.2 | 提醒与无提醒隐藏 |
| AC-7 traceability | Pass | Spec `按天汇总与日期` 未排期场景；Tasks 1.1、3.2 | 未排期独立 |
| AC-8 traceability | Pass | Spec `未接入板块隐藏`；Tasks 2.1、6.2 | 负向断言无占位 |
| AC-9 traceability | Pass | Spec `行程单入口与导航` 空态场景；Tasks 2.1、3.2 | 空态引导与未登录跳转 |
| Non-goal coverage | Pass | `proposal.md`、`design.md` Non-Goals、`atdd-design.md` | 食宿/应急/天气/时间/导出/多城均排除 |
| Task verifiability | Pass | `tasks.md` 5.1–5.5、6.1–6.3 | 每项含命令或可观察结果 |

## Scenario 级映射

| Requirement | Scenario | 证据 |
|---|---|---|
| 行程单入口与导航 | 从行程面板打开行程单 | E2E `summarizes the active trip by day from the panel entry` |
| 行程单入口与导航 | 从 Trips 页切换视图 | 同主用例（分段导航往返） |
| 行程单入口与导航 | 无激活行程 | E2E `shows an empty state without an active trip` |
| 行程单入口与导航 | Trips 激活卡片入口（Requirement 文本） | E2E `opens the itinerary from the active trip card` |
| web-app-shell / 受保护路由 | 未登录访问 `/itinerary` | E2E `redirects unauthenticated visitors to login` |
| web-app-shell / Tab 与路由 | 直接访问行程单 | 主用例 Trips Tab 选中 |
| 按天汇总与日期 | 日期由开始日期派生 | 单测 `addDays`/`formatTripDate` + 主用例日期头 |
| 按天汇总与日期 | 切换某一天 | 主用例 Day 2 切换 |
| 按天汇总与日期 | 缺少开始日期 | 单测 `没有开始日期时不生成日期标签` |
| 按天汇总与日期 | 未排期地点独立展示 | 主用例未排期区域 |
| 时间线与途内交通 | 打车段展示估算与提示 | 主用例「约 20 分钟」「¥27–40」与专车提示 |
| 时间线与途内交通 | 估算不可用 | E2E `falls back when the route estimate request fails` |
| 时间线与途内交通 | 相邻地点相同 | E2E `explains adjacent identical stops without an estimate` |
| 时间线与途内交通 | 自驾段只展示时长 | E2E `shows only the duration for self-drive segments` |
| 地点携宠政策展开 | 展开显示已配置项 | 主用例共享字段标签与值 |
| 地点携宠政策展开 | 布尔字段配置为否 | 主用例「疫苗证明要求」→「不需要」 |
| 地点携宠政策展开 | 无配置时提示 | E2E `shows a no-config notice and hides the reminder when nothing applies` |
| 当天提醒 | 展示当天提醒 | 主用例 + 单测 `汇总当天提醒与未排期地点` |
| 当天提醒 | 无提醒时隐藏 | E2E 全空政策用例断言无提醒板块 |
| 未接入板块隐藏 | 无食宿与应急数据 | 主用例负向断言 |
| 未接入板块隐藏 | 无天气与时间数据 | 主用例负向断言 |

## Gaps / residual risks

- 全量 E2E 与 CI 未运行，PR 阶段补齐。
- 食宿/应急/天气/具体时间点缺失，属于已记录的依赖缺口。
- 路线估算依赖外部服务，失败时仅展示兜底文案。
- 工作区仍有未提交改动；提交时需包含新增页面、导航、模型、测试与两份 delta。

## Outcome

**Pass（计划层）**：Spec、Design、ATDD 与 Tasks 在 Scenario 级一致。该结果不代表 Gate 决策，也不代表 CI 已通过。
