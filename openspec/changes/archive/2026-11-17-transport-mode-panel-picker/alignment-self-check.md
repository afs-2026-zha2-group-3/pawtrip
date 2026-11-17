# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-transport-mode-panel-picker`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | 两份 delta、`design.md` | D1 判定复用、D2 浮层封装、D3 入口形态、D4 保存链路、D5 详情入口均有对应描述 |
| Spec → ATDD | Pass | `atdd-design.md` | 入口、推荐、保存、跳转均有单测或 E2E 映射 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 组件、数据函数、面板接入、测试、规格同步、验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.3 | 一个单测文件与一个 E2E spec 均有对应用例 |
| AC-1 traceability | Pass | `trip-context` requirement、Tasks 2.1、3.2 | 未选时展示「选择大交通」入口 |
| AC-2 traceability | Pass | `trip-context` requirement、Tasks 2.1、3.2 | 已选 tag 可再次点开，E2E 断言 `aria-pressed` |
| AC-3/AC-4 traceability | Pass | `design.md` D1、Tasks 1.2、3.1、3.2 | 四种方式与宠物结论；E2E 断言 `[data-mode]` 数量 |
| AC-5 traceability | Pass | E2E 面板选择用例、Tasks 2.2、3.2、5.3 | 防抖保存与刷新回显 |
| AC-6 traceability | Pass | Tasks 1.3、3.3、5.3 | 规则详情链接 |
| AC-7 traceability | Pass | `transport-rules-comparison-page` delta、Tasks 3.4、5.4 | 面板选择后规则页 radio 回显（E2E） |
| AC-8 traceability | Pass | `design.md` Risks、Tasks 1.3、3.5 | 宠物加载/失败态文案，入口仍可选（E2E） |
| Non-goal coverage | Pass | `proposal.md`、`design.md` Non-Goals、`atdd-design.md` | 航司编辑、规则页改造、后端改动均排除 |
| Task verifiability | Pass | `tasks.md` 5.1–5.4 | 每项含命令或可观察结果 |

## Gaps / residual risks

- 全量 E2E 与 CI 已由 PR #73 覆盖并通过（Web build 37s、Browser E2E 9m4s）。
- 飞机结论固定按默认航司，已记录并标注。
- 需求改名已用 `RENAMED Requirements` + `MODIFIED` 表达，并在干净 `main` 临时 worktree 验证归档会应用 1 个 rename + 1 个 modified。
- 已提交（`2d9fead`）、合并（`8770c88`）、归档；G2 Pass（VL=SCOTT）、G3 Pass（SA=LEO）。

## Outcome

**Pass（计划层）**：Spec、Design、ATDD 与 Tasks 一致；PR CI 已通过，Gate 决策见 G2/G3 记录。
