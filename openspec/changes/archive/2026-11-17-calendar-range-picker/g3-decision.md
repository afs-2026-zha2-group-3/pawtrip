# G3 decision：单日历区间选择

- Gate：G3（Merge & Archive）
- Change ID：`2026-11-17-calendar-range-picker`
- Inputs：
  - Merge：PR #66（`feat/add-trip-start-date` → `main`），merge commit `7e09d96`，2026-11-17T05:26:36Z。
  - PR CI（`12a9292`）：Server tests 1m26s、Web build 30s、Browser E2E 8m13s，三工作流全绿。
  - Main CI（`7e09d96`）：Server `44024154535` 与 Web `44024154505` 通过；Browser E2E `44024154514` 首次因无关用例 `admin-city-management` 偶发失败，重跑（attempt 2）通过。
  - Archive：先归档本变更、再归档 `2026-11-17-add-trip-start-date`；归档提交 `833fa59`；Living specs 已同步 `destination-selection` / `trip-context`，`openspec validate --specs` 23 passed / 0 failed。
  - Archive completeness：`proposal` / `design` / `tasks` / `specs` / `atdd-design` / `dov-ac-review` / `alignment-self-check` / `g1-decision` / `g2-decision` / `change-summary` 齐全。
- Findings：
  - Merge：与日期持久化 change 同一 PR 交付，代码与文档均入 `main`。
  - Conflicts：无；归档顺序符合「先日历、后日期」，持久化 requirement 最终生效。
  - CI 异常：`admin-city-management.spec.ts` 城市列表页标题 5s 超时，与本次改动无关；同代码 PR CI 通过、main 重跑通过，按偶发失败记录。
- Decision：**Pass**
- Conditions + owners：无阻塞条件；偶发 E2E 失败作为后续稳定性观察项（owner=SCOTT，非阻塞）。
- Approvers：SA=LEO
- Timestamp：2026-11-17T13:44:43+08:00

> 本记录依据具名 SA 的决定转写；Decision 由 LEO 于 2026-11-17 确认，代理不代为决策。
