# G2 decision：单日历区间选择

- Gate：G2（Verify）
- Change ID：`2026-11-17-calendar-range-picker`
- Inputs：
  - 本地验证：
    - `npx tsc --noEmit -p apps/web/tsconfig.json`：Pass
    - 受影响 E2E（`destination-selection` + `trip-duration-input`）：19 passed / 0 failed（组合运行，包含日期持久化改动）
    - 浏览器结构验证：区间端点/色带、跨月超 7 天提示、缺结束日期提示、月切换
  - `npx --no-install openspec validate 2026-11-17-calendar-range-picker --strict`：Pass
  - PR / CI（PR #66，merge `7e09d96`）：
    - Server tests：Pass（1m26s）https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44023124892/job/133836997082
    - Web build：Pass（30s）https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44023124927/job/133836997364
    - Browser E2E：Pass（8m13s）https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44023126556/job/133837002582
- Dimension results：
  - Build：Pass（本地 tsc / 受影响 E2E + PR 三工作流全绿）
  - Static scan：n/a（仓库 CI 基线未配置独立 secret scan/SAST）
  - Code review：Pass（纯前端；自研 `CalendarRange`，无新依赖/后端改动）
  - Evidence：Pass（同一 PR 的 Browser E2E 覆盖组合改动；本地组合运行的局限不再作为唯一证据）
  - E3 Human：Signed（VL=SCOTT，2026-11-17 确认）
- Defect grades：
  - CRITICAL：无
  - WARNING：自研日历不支持方向键导航，已作为设计取舍记录
  - SUGGESTION：后续多处使用日期选择时评估成熟日历库
- Decision：**Pass**
- Conditions + owners：
  1. PR 的 Server / Web / Browser E2E 三工作流通过，并回填 run 链接——已完成（2026-11-17，PR #66）。
  2. 在同一 PR CI 中覆盖组合改动；不再用「包含日期持久化改动的本地 E2E」单独作为本变更的通过证据——已完成（Browser E2E run 44023126556）。
  3. 全量 E2E 与 CI 证据回填本记录后，Conditional 转 Pass——已完成（2026-11-17）。
- Approvers：VL=SCOTT
- Timestamp：2026-11-17（Asia/Shanghai）

> 本记录依据 VL=SCOTT 的明确决定转写；G3（合并归档）待 PR 合并后另行签署。
