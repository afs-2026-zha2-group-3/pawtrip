# Design

## Context

- 见 `proposal.md` 的 Why。当前 `trip` 表（SQLite）只有 `total_days`，没有日期字段；创建弹窗里的开始/结束日期只在前端用于推导天数。
- `PUT /api/trips/{id}` 是整量更新，前端 600ms 防抖保存，请求体目前为 `{ name, totalDays, plan, transportMode }`。
- 前端 `active` 与后端 trip 字段同构，浏览器只持久化 `activeTripId`，刷新后靠详情接口恢复。
- 存量行程没有日期；`TripApiTest` 和部分 E2E 通过 API 直接建行程，不传日期。

## Goals / Non-Goals

**Goals:**

- 行程可选保存开始日期，并在摘要、详情、前端 store 中可用。
- 创建弹窗把用户选择的开始日期写入行程，刷新后仍能恢复。
- 保持 `totalDays` 为天数唯一事实源，结束日期不落库。
- 兼容存量行程和不传日期的 API 调用。

**Non-Goals:**

- 不新增 `end_date` 列，不做日期编辑 UI。
- 不在行程面板、Trips 列表、行程单或导出中展示日期。
- 不做天气、日期编辑 UI、时区处理；创建弹窗的日历交互由独立变更 `2026-11-17-calendar-range-picker` 负责，归档应先于本变更。

## Decisions

### D1：存 `startDate` + `totalDays`，结束日期派生

结束日期 = `startDate + totalDays - 1`，只在读取时派生。

替代方案：同时存 `startDate` 与 `endDate`，需要维护三值一致性（天数、起、止）；只存 `endDate` 则失去开始日期语义。`totalDays` 已贯穿 plan 校验、建空计划、防抖保存和测试，保留为唯一事实源改动最小。

### D2：SQLite 新增可空文本列

`V20__add_trip_start_date.sql` 执行 `ALTER TABLE trip ADD COLUMN start_date TEXT;`。SQLite 无原生 DATE 类型，沿用 ISO `yyyy-MM-dd` 文本；存量行自动为 `NULL`，不做回填。

### D3：`startDate` 可选，服务端校验真实日期

- `POST`、`PUT` 的 `startDate` 可省略或为 `null`，兼容 `createTripViaApi` 等既有调用。
- 非空时使用 `LocalDate.parse` 校验，格式非法或日期不存在（如 `2026-02-30`）返回 `400 VALIDATION_ERROR`。
- `PUT` 为整量更新：省略 `startDate` 视为 `null`。当前唯一写入方是前端自动保存，且始终携带 `active.startDate`，不会误清。

替代方案：把 `startDate` 设为必填。会让现有 API 测试和 E2E 助手全部需要补日期，超出本次小改动范围。

### D4：摘要与详情都返回 `startDate`

`TripSummary` 与 `TripDetail` 都增加 `startDate`，前端 `TripSummary`/`Trip` 类型同步。行程单后续可以直接用列表摘要，不必强制先激活。

### D5：前端只透传，不新增展示

创建弹窗把 `startDate` 放入 `createTrip` 请求；`save.ts` 的 `PUT` 请求体加入 `active.startDate`；store 不新增 setter（本次没有修改日期的入口）。刷新恢复依赖既有详情拉取链路。

## Risks / Trade-offs

- **旧客户端 PUT 省略 `startDate` 会清空日期** → 整量更新语义已明确；当前只有本前端调用 PUT，且始终携带该字段。
- **未来编辑日期时可能只改一端** → 结束日期始终派生，不存储；日期编辑加入时只需维护 `startDate` 与 `totalDays`。
- **存量行程日期为 `null`** → 行程单后续做空值降级（只显示「第 N 天」），本次不处理。
- **SQLite 文本列无法强约束日期格式** → 服务端 `LocalDate.parse` 统一校验，非法数据不进库。

## Migration Plan

1. 发布时 Flyway 自动执行 V20，新增可空列，无需停机或回填。
2. 回滚可保留该列（对旧代码无影响）；如需彻底回滚，再执行删列迁移。

## Test Strategy

- 服务端：`TripApiTest` 增加带/不带日期创建、非法日期、更新日期、摘要与详情返回日期；`TripSchemaMigrationTest` 断言 `start_date` 列存在。
- 前端：现有 99 个单测保持通过；类型检查覆盖新增字段。
- E2E：在日历上选择日期 → 确认 → 通过 `GET /api/trips/{id}` 断言 `startDate`；刷新后断言仍存在；既有不传日期的调用保持通过。
