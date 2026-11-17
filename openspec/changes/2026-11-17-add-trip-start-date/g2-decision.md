# G2 decision：行程开始日期持久化

- Gate：G2（Verify）
- Change ID：`2026-11-17-add-trip-start-date`
- Inputs：
  - 本地验证：
    - Flyway 测试库迁移到 v20（`add trip start date`）
    - `TripSchemaMigrationTest`：2 tests passed
    - `TripApiTest`：16 tests passed（带/不带日期、显式 null、非法日期、更新与清空）
    - `npx tsc --noEmit -p apps/web/tsconfig.json`：Pass
    - `npm test -w apps/web`：99 tests passed
    - 受影响 E2E：4 个 spec、44 passed（含刷新后 `startDate` 仍一致）
    - `npx --no-install openspec validate 2026-11-17-add-trip-start-date --strict`：Pass
    - `npx --no-install openspec validate --specs`：23/23 通过
  - PR / CI：未执行，待同一 PR 落地
- Dimension results：
  - Build：Pass（本地服务端测试、tsc、Vitest、受影响 E2E；生产构建与三工作流待 PR CI）
  - Static scan：n/a（仓库 CI 基线未配置独立 secret scan/SAST）
  - Code review：Pass（服务端字段/契约/校验 + 前端透传；无新增依赖）
  - Evidence：Pass（核心行为有 API、save 单测与 E2E 覆盖；仅 PR CI 待补）
  - E3 Human：Signed（VL=SCOTT，2026-11-17 确认）
- Defect grades：
  - CRITICAL：无
  - WARNING：`PUT` 整量更新省略 `startDate` 会清空日期，已由 spec 明确
  - SUGGESTION：后续日期编辑能力加入时补 `startDate` 更新 UI 与用例
- Decision：**Conditional**
- Conditions + owners：
  1. PR 的 Server / Web / Browser E2E 三工作流通过，并回填 run 链接——owner=SCOTT（未完成）。
  2. `save.test.ts` 断言自动保存的 `PUT` 请求体包含 `startDate`——已完成（2026-11-17，3 tests passed）。
  3. `TripApiTest` 增加显式 `"startDate": null` 创建与 PUT 用例——已完成（2026-11-17，16 tests passed）。
  4. 仅剩 CI 证据；回填后 Conditional 转 Pass——owner=SCOTT。
- Approvers：VL=SCOTT
- Timestamp：2026-11-17（Asia/Shanghai）

> 本记录依据 VL=SCOTT 的明确决定转写；G3（合并归档）待 PR 合并后另行签署；归档顺序必须先日历、后本变更。
