# ATDD Design

变更：`2026-11-17-add-trip-itinerary`

## ATDD layers in scope

### API 层

不新增或修改后端接口。行程单读取既有 `GET /api/trips/{id}`、`GET /api/locations/{poiId}` 与 `GET /api/trips/{id}/route-estimate`，保存链路不发生任何写入，API 测试无需新增。

### Unit 层

`apps/web/src/lib/trip/itinerary.ts` 为纯函数，使用 Vitest 覆盖：

| 用例 | 断言 |
|---|---|
| 跨月/跨年日期 | `addDays("2026-12-31", 1)` 为 `2027-01-01`；非法日期返回 `null` |
| 日期展示 | `formatTripDate("2026-12-01")` 为 `12月1日 周二` |
| Day 结构 | 每天 entries 顺序为 stop → transport → stop；日期与城市正确 |
| 交通段 | `toNextEstimate` 快照、起止 `poiId`、展示方式与标签正确 |
| 提醒与未排期 | 汇总牵引提醒；未排期名称独立返回 |
| 无开始日期 | 所有日期标签为 `null`，降级为「第 N 天」 |

### E2E 层

`e2e/itinerary.spec.ts` 使用真实行程、地点详情与路线估算接口，按用户可见场景拆分：

| 场景 | 用例 |
|---|---|
| 无激活行程空态 | shows an empty state without an active trip |
| 未登录访问 `/itinerary` | redirects unauthenticated visitors to login |
| 面板入口、Trips 归属、分段导航、Day 切换、日期派生、地点顺序、政策字段、快照估算、当天提醒、未排期、刷新保留、未接入板块隐藏 | summarizes the active trip by day from the panel entry |
| Trips 激活行程卡片入口 | opens the itinerary from the active trip card |
| 估算请求失败兜底 | falls back when the route estimate request fails |
| 相邻地点相同 | explains adjacent identical stops without an estimate |
| 全空政策与无提醒隐藏 | shows a no-config notice and hides the reminder when nothing applies |
| 自驾仅展示时长 | shows only the duration for self-drive segments |

主用例使用 `toNextEstimate` 快照固定「约 20 分钟」「¥27–40」，不依赖高德可用性；政策用例覆盖 `true` → 「需要」、`false` → 「不需要」、全 `null` → 「暂无详细规则」。

## What is written before production code

本次为功能完成后补齐的 ATDD 记录。实现与测试同步落地，最终以以下骨架验证用户可见行为：

1. `apps/web/src/lib/trip/itinerary.test.ts`：六项纯函数用例。
2. `e2e/itinerary.spec.ts`：八条用例，覆盖空态、登录守卫、两类入口、按天视图、政策口径、交通估算三种状态与未接入板块隐藏。

## Non-goals

- 不覆盖食宿、应急、天气与具体时间点（无数据源）。
- 不覆盖导出、打印样式与多目的地（导出由后续变更承接）。
- 不断言真实高德返回的金额与时长；成功路径使用 `toNextEstimate` 快照验证展示。
