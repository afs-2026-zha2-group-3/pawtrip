# Change summary — 2026-11-17-add-trip-start-date

- Change id: `2026-11-17-add-trip-start-date`
- 状态：实现与本地验证完成；未提交、未建 PR、未归档
- 分支：`feat/add-trip-start-date`（与 `2026-11-17-calendar-range-picker` 同一分支、同一 PR 交付）

## Intent

创建行程弹窗已经选择起止日期，但日期只用于推导 `totalDays`。本变更把开始日期持久化到 trip，结束日期由 `startDate + totalDays - 1` 派生，为行程单、导出和后续日期能力提供数据基础。

## What shipped

- Flyway `V20__add_trip_start_date.sql`：`trip` 增加可空 `start_date TEXT`，存量行程保持 `null`。
- 服务端：`Trip` 实体、`TripRequests.SaveTrip`、`TripSummary`/`TripDetail`、`TripService` 接入 `startDate`；非空值按 `yyyy-MM-dd` 与真实日期校验，非法返回 `400 VALIDATION_ERROR`。
- 前端：`Trip`/`SaveTripInput`/`TripSummary`/`createTrip` 增加 `startDate`；创建弹窗提交开始日期；防抖保存的 `PUT` 请求体携带 `active.startDate`。
- E2E：`activeTripDetail` 辅助；创建后详情 `startDate` 等于所选开始日期，刷新后仍一致。
- 未改 `end_date`、未做日期编辑 UI、未做天气、行程单或导出。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| Flyway | Pass | 测试库迁移到 v20（`add trip start date`） |
| `TripSchemaMigrationTest` | Pass | 2 tests，列断言含 `start_date` 且默认 null |
| `TripApiTest` | Pass | 16 tests：带/不带日期、显式 null、非法日期、更新与清空 |
| 自动保存单测 | Pass | `save.test.ts` 断言 PUT 请求体携带 `startDate`（3 tests） |
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` |
| 前端单测 | Pass | `npm test -w apps/web`：99 tests |
| 受影响 E2E | Pass | 4 个 spec、44 passed（destination-selection / trip-duration-input / trips-panel / attraction-pet-rules） |
| OpenSpec | Pass | 本 change `--strict` 通过；`validate --specs` 23/23 |
| PR / CI | 未执行 | 与日历 change 同一 PR，待合并阶段补 |
| G1 / G2 / G3 | G1 Pass（IO=Kitty Su、SA=HARLAN HUANG）；G2 Conditional（VL=SCOTT，整改 owner=SCOTT）；G3 待签 | `g1-decision.md`、`g2-decision.md` |

## Residual risks / follow-ups

1. 归档顺序：必须先归档 `2026-11-17-calendar-range-picker`，再归档本 change；反向归档会用日历 delta 的「MUST NOT 持久化」覆盖本变更的持久化要求。
2. 本 change 的 E2E 断言依赖日历 UI，必须与日历 change 同 PR 交付。
3. `PUT` 为整量更新，省略 `startDate` 会清为 `null`；当前唯一写入方是前端自动保存，始终携带该字段。
4. G2 整改项已全部完成（`save.test.ts` 断言 `startDate`、API 显式 `"startDate": null` 用例）。
5. 全量 CI 与 G3 尚未完成/签署；G1 已 Pass、G2 为 Conditional，仅剩 PR CI 证据待回填，回填后转 Pass。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/trip-planning/spec.md`、`specs/trip-context/spec.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
- 关联 change：`openspec/changes/2026-11-17-calendar-range-picker/`
