# ATDD Design — add-location-map

- 日期：2026-11-17
- 上游：`specs/trip-attractions/spec.md`（2 个 ADDED Requirement / 12 个 Scenario）、`dov-ac-review.md`、`design.md`、`tasks.md`
- 补录说明：本文件在 P4 实现完成后补齐 P3 记录；真实地图链路依赖外部 SDK 与 Key，E2E 只覆盖降级与列表回归，其余场景以有 Key 环境人工验证 + 代码审查为证据。

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `LocationQueryApiTest`（新增 `detailReturnsMapCardSummaryFields`） | 公开详情摘要字段、照片优先级、原始 JSON absence |
| E2E | Playwright，`e2e/nearby-location-filter.spec.ts` 的 `shows the map placeholder when the AMap JS key is not configured` | 无 Key 占位与列表可用；E2E 运行器强制空 Key |
| Defer UT | Vitest，`apps/web/src/queries/locations-browsing.test.ts` 的 `fetches all filtered pages for map points` | 地图点位查询按 `pageSize=100` 循环合并 |
| Manual / 审查 | 有 Key 环境；`tasks.md` 5.1、6.4 | 瓦片、marker、InfoWindow、卡片联动与筛选刷新 |

NFR 测试：本期不纳入。地图加载不承诺 SLA；网络不可达时以降级占位处理。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 对应用例 / 证据 | 依据 |
|---|---|---|---|---|
| A1 | 详情返回 `coverPhotoUrl`、`rating`、`keytag`、`businessArea`（前两者复用 REQ-013） | API | `detailReturnsMapCardSummaryFields` | 单端点 body 契约 |
| A2 | 详情不返回原始 `photos` / `business` / `poi`（反向） | API | 同上 `body.has(...) == false` | JSON absence |
| A3 | 首张照片优先 `https://`，否则回退首个可用 URL（摘要字段） | API | 同上：`http` + `https` 两张照片时返回 `https` | 字段语义 |
| A4 | 字段缺失返回 `null`，不报错（缺失字段） | API 审查 | `parseJson` / `text` 对缺失节点返回 `null`；无专门用例 | 代码审查 |
| A5 | 详情 401/404 回归（权限） | API | 既有 `unauthenticatedRequestsReturn401`、404 用例 | 既有契约 |
| E1 | 未配置 JS Key → 地图占位，列表正常（降级） | E2E | `shows the map placeholder when the AMap JS key is not configured` | UI 占位 |
| E2 | 配置 Key 后加载瓦片与 marker（地图展示） | Manual | `tasks.md` 5.1：SDK、瓦片、3 markers 通过 DOM/网络请求验证 | 外部 SDK |
| E3 | marker 点击 → 列表卡片高亮 + 基础 InfoWindow（联动） | Manual / 审查 | `tasks.md` 5.1；`-location-map.tsx` marker click 与 `mapFocusPoiId` | 外部 SDK |
| E4 | 卡片“在地图查看” → 地图定位 marker（联动） | Manual / 审查 | `tasks.md` 5.1、6.4；`onLocate` 设置 `mapFocusPoiId` | 外部 SDK |
| E5 | 类型/宠物友好/锚点变化 → 地图点位更新（筛选刷新） | 审查 | `pointsKey` 变化重建 marker；地图查询参数与列表一致 | 代码审查 |
| E6 | InfoWindow“查看详情” → 关闭气泡并打开地图详情卡片（详情卡片） | Manual | `tasks.md` 6.4：卡片已打开并显示宠物政策、地址、加入行程 | 外部 SDK |
| E7 | 详情卡片展示照片/评分/商圈/政策；缺失不伪造（详情卡片） | Manual / 审查 | `-map-location-card.tsx` 条件渲染；V25 提供照片/评分 | 外部 SDK |
| E8 | SDK 加载失败 → “地图加载失败”占位，列表不受影响（降级） | 审查 | `loadAmap` reject → `status="error"` 分支；无 E2E | 代码审查 |
| E9 | 地图卡片加入行程/暂不排期（详情卡片） | Manual / 审查 | 复用 `DaySelect` 与 `tripActions.addStop` | 既有组件 |

## 3. 先于生产代码编写（red 顺序）

P3 约定如下；P4 落地情况见括号：

1. **A1–A3 先红**：先写详情摘要字段与原始 JSON absence 断言 → 驱动 `LocationDetail.from(...)` 的摘要解析（已落地）。
2. **Defer UT 先红**：先写两页点位合并与 URL 断言 → 驱动 `mapLocationsQueryOptions`（已落地）。
3. **E1 先红**：E2E 强制空 Key，先断言占位和列表可用（已落地）。
4. **E2–E9**：外部 SDK 无法在 CI 中稳定加载，改为有 Key 环境人工验证 + 代码审查；不伪造自动化证据。

## 4. 本地 vs CI 门禁

- 后端：`cd apps/server && ./mvnw test`
- 前端：`npm run test -w apps/web`、`npm run build`
- E2E：`CI=true npm run test:e2e`（运行器强制 `VITE_AMAP_JS_KEY=""`）
- 人工：配置真实 Key 的本地页面验证地图链路（不可作为 CI 门禁）
- 回归：列表、筛选、分页、详情弹窗、加入行程全部保持绿

## 5. 数据 / fixtures 策略

- API：`poi_json` 提供 `http` + `https` 两张照片，`business_json` 提供评分/标签/商圈；验证 https 优先与 absence。
- E2E：`scripts/run-e2e.mjs` 设置空 `VITE_AMAP_JS_KEY` / `VITE_AMAP_SECURITY_CODE`，不加载外网 SDK。
- 本地真图：根目录 `.env` 配置 `VITE_AMAP_JS_KEY` / `VITE_AMAP_SECURITY_CODE`；不入库、不提交真实密钥。
- 开发库：V25 按同名真实 POI 关联 `poi_json`/`business_json`，为地图详情卡片提供照片/评分；找不到同名记录时保留原 JSON。
- 地图点位复用 `GET /api/locations` 与 E2E 地点夹具，不新增专用接口。

## 6. Non-goals 与反向验证

| Non-goal | 反向验证 | 层 |
|---|---|---|
| 押金/清洁费/宠物设施展示 | 代码审查：卡片无对应字段；spec 明示不作为必需内容 | 审查 |
| 原始 `photos`/`business`/`poi` JSON 暴露 | A2 absence 断言 | API |
| 新增后端接口/数据库迁移 | 代码审查：仅扩展现有详情摘要；无 migration | 审查 |
| 地图样式精修/聚合/路线/定位/导航 | 无对应组件或 SDK 能力接入 | 审查 |
| CI 依赖高德外网 SDK | E2E 强制空 Key，仅验证占位 | E2E |
| 生产级密钥代理 | design 记录为后续项；本期直连 | 审查 |

## 7. NFR 测试

不纳入。地图加载失败按降级占位处理，不作为可用性 SLA；无并发或性能验收。

## 8. Defer UT 清单

- `mapLocationsQueryOptions`：`pageSize=100`、按 `totalPages` 循环、筛选参数与列表一致。
- 可后续抽离并测试 InfoWindow HTML 转义纯函数；当前函数在组件文件内，未被单测覆盖。
- 可后续为地图组件补 DOM 级测试（mock `window.AMap`），覆盖 marker 联动与错误分支。
