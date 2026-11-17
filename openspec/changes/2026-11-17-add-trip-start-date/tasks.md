# Tasks

## 1. 服务端持久化与契约

- [x] 1.1 新增 `V20__add_trip_start_date.sql`（`ALTER TABLE trip ADD COLUMN start_date TEXT;`），`Trip` 实体增加可空 `startDate` 字段与 getter，并接入构造与整量更新；更新 `TripSchemaMigrationTest` 的列断言与 `start_date` 默认 null 断言，运行该测试类通过。
- [x] 1.2 `TripRequests.SaveTrip` 增加 `String startDate`，`TripResponses.TripSummary`/`TripDetail` 返回 `startDate`；`TripService` 在创建与更新时用 `LocalDate.parse` 校验非空日期，非法返回 `400 VALIDATION_ERROR`，并持久化到实体；运行 `TripApiTest` 通过。
- [x] 1.3 扩充 `TripApiTest`：带日期创建后在摘要与详情返回、不带日期创建返回 null、非法日期（`2026-02-30`/`2026/12/01`）返回 400、PUT 更新日期、PUT 省略日期清为 null；运行该测试类全部通过。

## 2. 前端透传与保存

- [x] 2.1 `apps/web/src/lib/trip/types.ts` 的 `Trip` 与 `SaveTripInput` 增加 `startDate: string | null`，`apps/web/src/queries/trips.ts` 的 `TripSummary` 与 `createTrip` 入参同步；运行 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 2.2 `-city-trip-dialog.tsx` 创建行程时提交 `startDate`；`lib/trip/save.ts` 的 PUT 请求体加入 `active.startDate`；运行 `npm test -w apps/web` 现有用例通过。
- [x] 2.3 在 `e2e/trip-helpers.ts` 增加读取当前激活行程详情的断言辅助（或直接 `GET /api/trips/{id}`），在 destination-selection 或 trip-duration-input 中增加用例：创建后详情 `startDate` 等于所选开始日期，刷新后仍一致；运行目标 spec 通过。

## 3. 回归与验证

- [x] 3.1 运行受影响的 E2E spec（destination-selection / trip-duration-input / trips-panel / attraction-pet-rules），确认不传日期的 `createTripViaApi` 调用仍通过。
- [x] 3.2 运行 `npx --no-install openspec validate 2026-11-17-add-trip-start-date --strict` 与 `npx --no-install openspec validate --specs`，确认 change 与主 specs 均通过。

## Workflow follow-up

- 与 `2026-11-17-calendar-range-picker` 放在同一个 PR 交付：dialog 与 E2E 改动 hunk 交织，按路径拆不开。
- 提交 PR，等待 Web CI / E2E CI / Server CI 通过后合并。
- 合并后归档顺序：先归档 `2026-11-17-calendar-range-picker`，再归档本 change；反向会覆盖「MUST NOT 持久化」的翻转。
- 最后同步 `trip-planning` / `trip-context` 主 specs 并复跑 `openspec validate --specs`。
- G1 已记录 Pass，G2 已记录 Conditional（整改项 2、3 已完成，仅剩 PR CI 证据，owner=SCOTT）；G3 待合并归档后实名签署。
