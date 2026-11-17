# Proposal

## Why

创建行程弹窗已经让用户选择开始与结束日期，但日期只用于推导 `totalDays`，没有保存到行程。刷新后行程只剩「N 天」，行程单无法显示「日期×城市」，导出也没有日期可写；天气暂时不做，但日期缺口仍会阻塞行程单与导出。

## What Changes

- `trip` 新增可选字段 `start_date`（`yyyy-MM-dd`），结束日期由 `startDate + totalDays - 1` 派生，不新增 `end_date` 列。
- `POST /api/trips`、`PUT /api/trips/{id}`、`GET /api/trips`、`GET /api/trips/{id}` 的契约增加 `startDate`；不传或传 `null` 仍合法，存量行程保持 `null`。
- 创建行程弹窗确认时把已选开始日期写入行程；store 与防抖保存携带 `startDate`，刷新后由详情接口恢复。
- `trip-planning` 与 `trip-context` 的主规格同步：移除「起止日期 MUST NOT 持久化」，改为只持久化开始日期。

本次不新增日期编辑 UI，不在行程单/导出页面展示日期，也不引入 `end_date` 列。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-planning`: trip 数据契约与 CRUD 增加可选 `startDate`，保留 `totalDays` 为天数唯一事实源。
- `trip-context`: 创建行程确认弹窗把开始日期写入行程，store 与自动保存链路携带 `startDate`。

## Impact

- 服务端：`Trip` 实体、`TripRequests`、`TripResponses`、`TripService` 校验；新增 Flyway `V20__add_trip_start_date.sql`；`TripApiTest`、`TripSchemaMigrationTest`。
- 前端：`apps/web/src/lib/trip/types.ts`、`queries/trips.ts`、`lib/trip/save.ts`、`routes/_authenticated/-city-trip-dialog.tsx`。
- 测试：日期格式与可选性 API 用例、创建后刷新仍保留开始日期的 E2E。
- 依赖与数据库：SQLite 增加可空文本列，无新增依赖。
