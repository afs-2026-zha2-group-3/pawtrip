# ATDD design — 2026-11-18-add-day-route-planning

- Change：`2026-11-18-add-day-route-planning`（REQ-016 行程单当天路线规划）
- 输入：`specs/trip-itinerary/spec.md`（5 需求 / 14 场景）、`specs/location-management/spec.md`（1 需求 / 3 场景）、`design.md`（D1–D6）、P1 需求与 impact brief
- 范围：只设计 API 与 E2E 验收层；纯逻辑与组件级 TDD 留给 `/sdd:atdd-apply`
- Rules 对齐：`@rule:java-testing`（JUnit5 + AssertJ + MockMvc + 独立 SQLite）、`@rule:typescript-testing`（Vitest + Playwright）；沿用现有测试产品与 CI，不新建 CI 语义

## 1. 分层结论

| # | Scenario（delta 原文主题） | 层 | 附加建议 | 理由（layer-inference 信号） |
|---|---|---|---|---|
| 1 | 打开当前天路线弹窗 | E2E | — | THEN 断言弹窗标题与可见内容（优先级 2） |
| 2 | 关闭后保持当前天 | E2E | — | 页面选中态与「不写计划」需跨 UI 路径观察（优先级 2+3） |
| 3 | 导出不包含路线弹窗 | E2E（回归） | — | 既有 PDF/图片导出用例覆盖；路线弹窗关闭后不在导出 DOM（优先级 2） |
| 4 | 打车段绘制驾车路线 | E2E | Third-party（advisory） | 用户可见折线/标记；高德调用在浏览器边界以假实现观测（优先级 2） |
| 5 | 步行段绘制步行路线 | E2E | Third-party（advisory） | 同上，断言插件选择与折线数量 |
| 6 | 相邻同地点跳过算路 | E2E + Defer UT | — | E2E 观测算路调用次数；段构造逻辑归 apply-time 单测 |
| 7 | 快照优先 | E2E + Defer UT | — | E2E 断言标签分钟数；时长选择纯函数归 UT |
| 8 | 无快照使用算路时长 | E2E + Defer UT | — | 同上；61 秒 → 2 分钟标签可见 |
| 9 | 距离格式 | Defer UT + E2E | — | 850 米 / 1.2 公里格式纯函数归 UT；E2E 断言标签文本 |
| 10 | 地点缺坐标 | E2E | — | 弹窗提示与「不绘制对应路段」为用户可见行为（优先级 2） |
| 11 | 未配置高德 Key | E2E | Compatibility（advisory） | E2E 运行器强制空 Key；断言占位与行程单可用（优先级 2） |
| 12 | 单段算路失败 | E2E | Third-party（advisory） | 假高德对指定段返回失败；断言其他段继续绘制（优先级 2） |
| 13 | 当天无地点 | E2E | — | 空态文案与「不发算路」需页面路径（优先级 2+3） |
| 14 | 当天只有一个地点 | E2E | — | 标记与「无需路线」提示为可见行为（优先级 2） |
| 15 | 详情返回坐标 | API | Security（advisory） | 单端点响应字段契约；`user("demo")` 认证（优先级 1） |
| 16 | 坐标缺失返回 null | API | — | 单端点 `null` 序列化契约（优先级 1） |
| 17 | 坐标只读数据库 | API | — | 现有 `readsOnlyDatabaseWithoutCallingAmap` 已调用详情；扩展坐标断言并保持 `verifyNoInteractions(placeSearchPort)`（优先级 1+3） |

**Deferred to `/sdd:atdd-apply`（unit-level TDD）**：`buildDayRoute` 段构造（顺序、同 `poiId`、缺坐标）、方式映射、距离格式化、时长选择与向上取整；`DayRouteMap` 的加载/失败状态可用 jsdom + loader mock 做组件测试，但不进本 ATDD 设计。核心逻辑必须先写失败单测再实现。

## 2. 生产代码前先写的验收（红测）

### 2.1 API — 扩展 `LocationQueryApiTest`

```text
GET /api/locations/poi-zhu-a（user demo）
200：longitude=113.5、latitude=22.1；name/address/petPolicies/coverPhotoUrl/rating 等既有字段不变
    响应仍不含 photos / business / poi

GET /api/locations/poi-zhu-c（无坐标夹具）
200：longitude 与 latitude 均为 null；其余字段与响应结构不变
```

红测名：`detailReturnsCoordinatesForSavedLocation`、`detailReturnsNullCoordinatesWhenMissing`。先运行 `./mvnw -Dtest=LocationQueryApiTest test`，期望因字段不存在而失败。现有 `readsOnlyDatabaseWithoutCallingAmap` 继续保留并在详情调用后断言坐标，证明只读数据库、不触达 `PlaceSearchPort`。

### 2.2 单元 — 新增 `apps/web/src/lib/trip/day-route.test.ts`

红测清单（apply-time 实现前先失败）：

```text
段构造：3 个坐标齐全 stop + drive/walk → 2 个 route 段，顺序不变
同 POI：a → a → b → 1 个 skip + 1 个 route
缺坐标：a（有）→ b（无）→ unroutable，missingPoiIds 含 b；其余段保留
方式映射：walk→walk；drive/self_drive→drive；transit 经 displayToNext 归一
距离：850→"850 米"；1234→"1.2 公里"；1000→"1.0 公里"
时长：快照 20 分钟优先；无快照 61 秒→2 分钟
空态：0 个/1 个 stop 不产生 route 段
```

### 2.3 E2E — 新增 `e2e/day-route-planning.spec.ts`

先写用例（此时按钮/弹窗不存在，必然红），再实现。用例分组：

| 分组 | 用例 | 关键断言 |
|---|---|---|
| 入口与弹窗 | 选中 Day 2 点按钮 → 关闭 | 标题「第 2 天路线规划」+ 日期；关闭后 Day 2 仍选中；期间无 `PUT /api/trips` |
| 绘制与标注 | 3 个坐标齐全地点，段方式 drive + walk | 3 个编号标记、2 条折线；标签「1.2 公里 · 20 分钟」「850 米 · 2 分钟」；假高德算路记录为 Driving、Walking 各一次 |
| 同地点跳过 | a → a → b | 算路记录仅 1 次；标记保留 3 个 |
| 降级 | 缺坐标 / 单段失败 | 缺坐标提示且对应段无折线；单段失败提示且另一段折线保留 |
| 缺 Key | 不注入假 AMap | 地图占位可见；行程单时间线仍可用 |
| 空态 | 第 2 天无地点 / 仅 1 个地点 | 「当天暂无地点」/「当天只有一个地点，无需路线」；算路记录 0 次 |
| 只读与导出 | 打开再关闭；页面导出 | 无 `PUT /api/trips`；PDF/图片导出仍绿且不含路线标签 |

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地后端 | `cd apps/server; ./mvnw test`（Windows `mvnw.cmd`） | 先红后绿；定向可用 `-Dtest=LocationQueryApiTest` |
| 本地前端 | `npm run test -w apps/web` | 先红后绿（`day-route.test.ts`）；同时回归既有 vitest |
| 类型/构建 | `npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build` | 前端契约与 loader 类型 |
| 本地 E2E | `npm run test:e2e -- e2e/day-route-planning.spec.ts`，再 `npm run test:e2e` | 运行器临时 DB + 全量迁移；无 Key 确定性 |
| CI | 现有 `server.yml` / `web.yml` / `e2e.yml` | 不新增 CI 语义；PR 触发即门禁 |

E2E 确定性策略：`scripts/run-e2e.mjs` 已强制 `VITE_AMAP_JS_KEY=""`；绘制类用例在页面脚本执行前 `page.addInitScript` 注入假 `window.AMap`（loader 优先使用 `window.AMap`，不检查 Key），缺 Key 用例不注入，从而同一 CI 下同时覆盖「有地图绘制」与「无 Key 占位」。

## 4. 数据与夹具策略

- **API 夹具**：沿用 `LocationQueryApiTest` 独立 SQLite（`target/location-query-api-test.db`）与 `@DynamicPropertySource` 重置；`poi-zhu-a` 坐标 113.5/22.1，`poi-zhu-c` 坐标 null；`PlaceSearchPort` 用 `@MockitoBean`，`verifyNoInteractions` 证明无上游调用。
- **E2E 种子**：在 `scripts/seed-e2e-attractions.mjs` 新增两个景点夹具 `e2e-route-b`、`e2e-route-c`（含 `longitude`/`latitude`，`maxPetsPerPerson: 0` 避免进入宠物友好列表）。**不得修改** `e2e-zhu-b`/`e2e-zhu-c` 的 null 坐标——REQ-011 E11 依赖其 null 坐标制造「驾车估算确定性失败」。
- **E2E 假 AMap 契约**（`page.addInitScript`）：
  - `AMap.Map(container)`：记录容器并渲染 `[data-testid="day-route-map"]`；`setFitView`/`destroy` 等 no-op。
  - `AMap.plugin(names, cb)`：记录 names；挂载 `Driving`/`Walking`；调用 `cb()`。
  - `AMap.Driving` / `AMap.Walking.search(origin, destination, cb)`：记录方式与端点；从 `window.__routeResults` 队列取结果；`cb("complete", { routes: [...] })` 或 `cb("error", {})`。
  - `AMap.Polyline`：记录 path 并渲染 `[data-testid="day-route-polyline"]`。
  - `AMap.Text`：按 `text` 渲染 `[data-testid="day-route-label"]`。
  - `AMap.Marker`：按序号/内容渲染 `[data-testid="day-route-marker"]`；`InfoWindow`/`Pixel` 最小 no-op。
- **E2E 数据路径**：`signIn` + `resetTrips`；`createTripViaApi` 建 2 天行程，`PUT /api/trips/{id}` 写入 plan（含 `toNext`/`toNextEstimate`）；`activateTrip` 进入行程单。清理由 `resetTrips` 完成，不跨用例共享行程。
- **只读证据**：测试页监听 `PUT /api/trips` 请求计数；打开/关闭弹窗期间必须为 0。
- **确定性**：固定假算路结果与固定快照；标签断言用精确字符串；不用绝对地图坐标或 canvas 截图。

## 5. Non-goals 与反向验证

| Non-goal（design / proposal Out） | 反向用例 | 层 |
|---|---|---|
| 不做天气 | 弹窗无天气控件/文案；假高德 `plugin` 记录不含 `Weather`；无天气网络请求 | E2E |
| 不做路线优化/重排 | 标记顺序与 plan 一致；打开/关闭期间 `PUT /api/trips` 计数为 0 | E2E |
| 不把路线/坐标写入 plan、不新增后端算路接口 | 弹窗关闭后 `GET /api/trips/{id}` 的 `plan_json` 不变；后端测试无新端点、`PlaceSearchPort` 无交互 | E2E + API |
| 不做公交/骑行路线 | plan 中 `toNext: "transit"` 时假算路仍只记录 Driving/Walking；无 Transfer/Riding | E2E + Defer UT |
| PDF/图片不包含地图或路线 | 既有导出用例回归；`image-export-surface` 不含 `day-route-label` | E2E |
| 不修改管理端 | 本 change 无管理端任务与文件改动；管理端回归用例保持绿 | 检查 + 回归 |

本 skill 不产出 Playwright/POM/Excel 生成器，不新建 CI 产品，不写业务代码与 UT 套件。

## 6. NFR

不纳入。沿用本仓库既有 change 约定：本 change 不新增性能、可观测性、韧性测试；安全沿用全局认证（详情 401 已在 API 层回归），第三方稳定性由「缺 Key / 单段失败」降级用例覆盖。如需求方后续要求 NFR，可在 apply 前追加专项小节。
