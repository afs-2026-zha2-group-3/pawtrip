# ATDD Design

变更：`2026-11-17-restore-policy-entry-and-trip-dialog`

## ATDD layers in scope

### API 层

本变更不新增或修改后端接口，`POST /api/trips`、`/api/destinations` 与政策查询均复用既有契约。已有 `AdminCityApiTest`、`CityPetPolicyApiTest` 等继续覆盖服务端行为，本变更不新增 API 测试。

### E2E 层

复用 Playwright 与 `e2e/trip-helpers.ts`，通过真实 `/cities`、创建行程对话框与 `/attractions` 验证用户可见行为：

| 场景 | 层级 | 附加建议 | 归类理由 |
|---|---|---|---|
| 候选页始终展示（含激活行程时） | E2E | — | 页面状态与视图切换属浏览器行为 |
| 候选卡片「查看政策」跳转政策页 | E2E | — | 链接与路由行为 |
| 候选页不内嵌政策内容 | E2E | — | 页面内容断言 |
| 选定城市打开对话框、取消无写入 | E2E | — | 弹窗交互与网络请求断言 |
| 确认后创建行程并跳转 `/attractions` | E2E | — | 跨页面流程与 `activeTripId` |
| 日期推导 1 天 / 3 天 | E2E + UT | — | 页面上限校验 + `daysBetween` 纯函数 |
| 拒绝结束早于开始、超过 7 天 | E2E | — | 表单校验与错误提示 |
| 无宠物时禁用确认 | E2E | — | 空档案分支 |
| 存在激活行程时选定不可用 | E2E | — | 候选仍展示，提示先在 Trips 取消激活（单城市口径） |
| 无行程不能浏览景点 | E2E | — | `/attractions` 守卫 |

### Deferred to `/sdd:atdd-apply`（unit-level TDD）

- `daysBetween(start, end)`：同日起止为 1、跨月含首尾、结束早于开始返回 `null`、非法/缺失格式返回 `null`。
- 已实现并落地在 `apps/web/src/lib/trip/duration.test.ts`。

## What is written before production code

本变更为需求方复查后的返工，实现前以 E2E 验收骨架覆盖：

1. `e2e/destination-selection.spec.ts`：E5 弹窗打开/取消、E6 确认后进入景点页、E7 非法日期、E8 政策入口、E9 激活行程下仍展示候选、E15 候选页无政策正文。
2. `e2e/trip-duration-input.spec.ts`：同日 1 天、日期推导 3 天、拒绝超过 7 天、拒绝结束早于开始。
3. `e2e/trips-panel.spec.ts`：无行程时景点页空态、确认后可添加地点、活动行程宠物按弹窗选择。
4. `e2e/city-pet-policy.spec.ts`：政策入口改为直接点击卡片「查看政策」。

## Non-goals

- 不新增日期持久化字段或后端迁移。
- 不在本变更清理草稿 store / 行程面板中的草稿 UI（已无入口）。
- 不调整景点页与 Trips 页的既有功能。
