# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-calendar-range-picker`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | 两份 delta、`design.md` | D1 自研组件、D2 日期状态、D3 点击语义、D4 校验边界、D5 可测试性均有对应规格描述 |
| Spec → ATDD | Pass | `atdd-design.md` | 单日历、重新选择、超限拒绝、跨月均有 E2E 或浏览器验证映射 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 组件、弹窗接入、测试助手、规格同步、验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.4 | 两个 spec 文件与助手改动均有对应用例 |
| AC-1 traceability | Pass | Spec 两份 requirement；Tasks 1.1、2.1、5.3 | 单日历交互 |
| AC-2 traceability | Pass | `design.md` D5；Tasks 1.2、5.3 | 区间高亮与端点标记 |
| AC-3 traceability | Pass | `duration.test.ts`；Tasks 3.3、5.2 | 含首尾计数与 1–7 |
| AC-4 traceability | Pass | Spec 场景「日期范围无效」；Tasks 2.2、3.2、5.2 | 缺日期与超 7 天拒绝 |
| AC-5 traceability | Pass | Spec 场景「重新选择日历范围」；Tasks 3.3、5.2 | 重新开始语义 |
| AC-6 traceability | Pass | E6；Tasks 2.1、5.2 | 创建/取消/宠物不变 |
| Non-goal coverage | Pass | `proposal.md`、`design.md` Non-Goals、`atdd-design.md` | 持久化、依赖、键盘导航均排除 |
| Task verifiability | Pass | `tasks.md` 5.1–5.3 | 每项含命令或可观察结果 |

## Gaps / residual risks

- 全量 E2E 与 CI 未在本变更上运行，PR 阶段补齐。
- 自研日历无方向键导航，已作为设计取舍记录。
- 与 `2026-11-17-add-trip-start-date` 共享 requirement：同一 PR 合并后先归档本变更，再归档日期持久化变更，避免 MODIFIED 文本互相覆盖。
- dialog 与 E2E 改动和日期持久化 hunk 交织，按路径拆不开；计划一个 PR 交付两个 change。

## Outcome

**Pass（计划层）**：Spec、Design、ATDD 与 Tasks 一致。该结果不代表 Gate 决策，也不代表 CI 已通过。
