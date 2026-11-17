# G2 decision：单日历区间选择

- Gate：G2（Verify）
- Change ID：`2026-11-17-calendar-range-picker`
- Inputs：
  - 本地验证：
    - `npx tsc --noEmit -p apps/web/tsconfig.json`：Pass
    - 受影响 E2E（`destination-selection` + `trip-duration-input`）：19 passed / 0 failed（组合运行，包含日期持久化改动）
    - 浏览器结构验证：区间端点/色带、跨月超 7 天提示、缺结束日期提示、月切换
  - `npx --no-install openspec validate 2026-11-17-calendar-range-picker --strict`：Pass
  - PR / CI：未执行，待同一 PR 落地
- Dimension results：
  - Build：Pass（tsc、受影响 E2E、开发服务运行；生产构建待 PR CI）
  - Static scan：n/a（仓库 CI 基线未配置独立 secret scan/SAST）
  - Code review：Pass（纯前端；自研 `CalendarRange`，无新依赖/后端改动）
  - Evidence：Pass with caveat（受影响 E2E 为组合运行，包含日期持久化改动，不能单独证明本 change）
  - E3 Human：Signed（VL=SCOTT，2026-11-17 确认）
- Defect grades：
  - CRITICAL：无
  - WARNING：自研日历不支持方向键导航，已作为设计取舍记录
  - SUGGESTION：后续多处使用日期选择时评估成熟日历库
- Decision：**Conditional**
- Conditions + owners：
  1. PR 的 Server / Web / Browser E2E 三工作流通过，并回填 run 链接——owner=SCOTT。
  2. 在同一 PR CI 中覆盖组合改动；不再用「包含日期持久化改动的本地 E2E」单独作为本变更的通过证据——owner=SCOTT。
  3. 全量 E2E 与 CI 证据回填本记录后，Conditional 转 Pass——owner=SCOTT。
- Approvers：VL=SCOTT
- Timestamp：2026-11-17（Asia/Shanghai）

> 本记录依据 VL=SCOTT 的明确决定转写；G3（合并归档）待 PR 合并后另行签署。
