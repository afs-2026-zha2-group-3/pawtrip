# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-restore-policy-entry-and-trip-dialog`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | 两份 delta、`design.md` | D1 对应候选列表与政策入口；D2 对应确认弹窗与跳转；D3 对应日期→天数；D4 对应宠物选择；D5 对应错误状态 |
| Spec → ATDD | Pass | `atdd-design.md` | 每个场景映射到 E2E 或 UT；日期计算同时有 UT 与 E2E |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 候选页、弹窗、日期函数、错误处理、测试与验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.6 | 五个 E2E 文件与一个新增单测均有对应用例 |
| AC-1 traceability | Pass | Spec「候选列表与政策入口」；Tasks 1.1–1.2、3.3 | 链接入口与候选页无政策正文均可追踪 |
| AC-2 traceability | Pass | Spec「选定城市与创建行程确认」；Tasks 2.1、3.2–3.3 | 弹窗字段、取消与打开流程 |
| AC-3 traceability | Pass | Spec 场景「日期范围推导天数」；Tasks 2.2、3.1、3.4 | 含首尾计数与 1–7 校验 |
| AC-4 traceability | Pass | Spec 场景「确认后创建行程并进入景点页」；Tasks 2.3、3.3 | 创建、激活、跳转链路 |
| AC-5 traceability | Pass | Spec 场景「打开对话框后取消」；Tasks 2.3、3.3 | 取消无写入 |
| AC-6 traceability | Pass | `trip-context` 场景「无宠物不可创建」；Tasks 2.4 | 禁用确认与提示 |
| AC-7 traceability | Pass | `trip-context`：`Trips 页与单城市激活`；`destination-selection` 场景「存在激活行程时不可选定新城市」；Tasks 2.6、3.7 | 单激活行程约束与候选页禁用入口 |
| Non-goal coverage | Pass | `proposal.md`、`design.md` Non-Goals、`atdd-design.md` | 日期落库、草稿清理、景点/Trips 改造均排除 |
| Task verifiability | Pass | `tasks.md` 4.1–4.5 | 每项含命令或行为验证；4.5 明确待 PR 后确认 |

## Gaps / residual risks

- 全量 E2E 与 CI 尚未在本分支运行；`tasks.md` 4.5 保持未完成。
- 日期不落库，属于已记录的 product trade-off。
- 草稿相关代码仍存在但无入口，后续清理未纳入本变更。

## Outcome

**Pass（计划层）**：Spec、Design、ATDD 与 Tasks 一致，无需要回退到规格阶段的矛盾。该结果不代表 Gate 决策，也不代表 CI 已通过。
