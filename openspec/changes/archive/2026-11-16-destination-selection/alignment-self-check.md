# Alignment self-check — destination-selection（P3 task-plan）

- 日期：2026-11-16
- 范围：Spec ↔ Design ↔ Tasks ↔ ATDD
- 校验：`openspec validate destination-selection --strict` → valid；proposal/specs/design/tasks 均 done

## 1. Spec → Tasks 覆盖（13 条 requirement）

| Requirement | 承接任务 | 结果 |
|---|---|---|
| 目的地候选列表 | 1.2–1.4（A1/A2）、3.1（E1） | Pass |
| 城市搜索 | 3.1（E2） | Pass |
| 宠物友好筛选 | 2.2、3.2（E3/E5/E16）、5.1（E4 门控） | Pass |
| 禁养犬种匹配 | 2.2、5.1（E6 门控；未收录分支无档案可测） | Pass |
| 选定目的地与规划上下文 | 2.1、3.3（E7/E8） | Pass |
| 选定时禁养高亮提醒 | 5.1（E10/E11 门控） | Pass |
| 城市政策收录状态与禁养名单数据 | 1.1、1.3（A2/A3） | Pass |
| 顶部居中横向导航 | 4.2（E14 回归） | Pass |
| Tab 与路由同步 | 4.2（E14） | Pass |
| 受保护路由与登录跳转 | 4.2（E13） | Pass |
| 管理员管理导航 Tab | 4.2（E14） | Pass |
| 管理员页面路由守卫 | 4.2（E14） | Pass |
| 顶栏目的地上下文展示 | 4.1（E12/E9） | Pass |

## 2. Design → Tasks 覆盖（D1–D7）

D1→1.4/2.2；D2→1.3；D3→1.3；D4→2.1/4.2；D5→3.1/3.2；D6→2.3；D7→1.4。全部落地，无悬空决策。

## 3. ATDD → Tasks 覆盖

A1–A4→1.2/1.4；E1–E16→组 3/4/5（E4/E6/E10/E11 门控挂起，显式标注）；Defer UT→2.1/2.2；门禁→6.1/6.2；fixtures 策略在各组验证方式中体现。red 顺序与 atdd-design §3 一致（先测试后实现）。

## 4. Non-goal 反向验证

服务端持久化→A4（1.2）；政策详情→E15（3.4）；设施/评价筛选→E16（3.2）；管理端禁养维护→1.2 路由面断言；档案实现→6.3 diff 审查；既有契约→6.1/6.2 回归。

## 5. Scope creep 检查

tasks 无超出 proposal/spec 的条目；档案实现未出现在任何任务（仅门控用例与 follow-up 联调）；KB 文档任务对应 proposal Impact 文档项。无静默扩围。

## 6. 任务可执行性（T1–T3）

- T1：各任务单会话可完成（≤~2h 粒度）；1.1 为数据摘录研究任务，产出清单即完成
- T2：末尾组 6 为集成验证（全量测试+规格覆盖核对）
- T3：全部任务可追溯 spec requirement 或 proposal Impact（文档/测试）

## 结论

**Pass** — Spec/Design/Tasks/ATDD 四向对齐，无缺口、无扩围。外部依赖门控项已显式标注，不构成对齐缺口（lint L5 风险沿袭）。