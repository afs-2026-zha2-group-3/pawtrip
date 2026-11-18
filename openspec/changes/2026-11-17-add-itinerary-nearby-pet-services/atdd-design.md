# ATDD Design — add-itinerary-nearby-pet-services

- 日期：2026-11-17（P3 补登记，按已实现测试复核）
- 上游：`specs/trip-attractions/spec.md`（ADDED 1 需求 7 场景；MODIFIED 2 需求 11 场景）、`dov-ac-review.md`、`design.md`、`tasks.md`
- 基线：PR #75 `f160d71`；既有 `LocationQueryApiTest`、`nearby-pet-services.test.tsx`、`attraction-pet-rules.test.ts`、`policy-match.test.ts`、`itinerary.test.ts`、`locations-browsing.test.ts` 在其上扩展

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `@SpringBootTest` + `@AutoConfigureMockMvc` + 独立 SQLite，扩展 `apps/server/.../location/LocationQueryApiTest.java` | 附近服务契约、最近选择、营业时间回退、无坐标、404；医院/用品店免筛选 |
| 组件 UT | vitest + Testing Library（jsdom），`apps/web/src/components/trip/nearby-pet-services.test.tsx` | 展开后才请求、加载/空态、文案与距离 |
| 纯函数 UT | vitest，`attraction-pet-rules.test.ts` / `policy-match.test.ts` / `itinerary.test.ts` / `locations-browsing.test.ts` | 免筛选判定、未配置政策、行程条目 `poiId`、查询 key |
| E2E | CI 全量 Playwright（Browser E2E） | 本 change 未新增专用 E2E 场景；由既有套件回归行程单与地点浏览页 |

NFR：无 SLA/并发/可观测性新需求；附近服务为单次同城读取，按需触发。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 依据 |
|---|---|---|---|
| A1 | 展开后返回最近医院与用品店，含名称/地址/距离/营业时间（展开加载最近服务） | API | `nearbyServicesReturnNearestHospitalAndSuppliesWithOpeningHours` |
| A2 | 营业时间 `opentime_week` 优先、`opentime_today` 回退（营业时间回退） | API | 同一测试夹具与断言 |
| A3 | 景点无坐标 → `hospital`/`supplies` 均为 `null`（景点无坐标） | API | `nearbyServicesReturnNullsWithoutAnchorCoordinates` |
| A4 | 未知 POI → 404（未知 POI） | API | `nearbyServicesForUnknownPoiReturn404` |
| A5 | `petFriendlyOnly=true` 时医院/用品店不被过滤（医院/用品店不受宠物友好筛选） | API | `petFriendlyFilterDoesNotHideHospitalsOrSupplyStores` |
| F1 | 收起不请求；展开后请求 `/api/locations/poi-a/nearby-services`（收起不请求/展开加载） | 组件 UT | `nearby-pet-services.test.tsx` 第一例 |
| F2 | 两类均为空显示“暂无附近宠物服务”（无同城服务） | 组件 UT | 第二例 |
| F3 | 免筛选类型判定：医院/用品店 false，景点/住宿/餐厅 true（医院/用品店不受宠物友好筛选） | 纯函数 UT | `attraction-pet-rules.test.ts` |
| F4 | 未配置政策判定（政策未配置/不限宠物） | 纯函数 UT | `attraction-pet-rules.test.ts` |
| F5 | 免筛选类型未配置政策 → `friendly`（不限宠物展示） | 纯函数 UT | `policy-match.test.ts` |
| F6 | 行程 stop 条目携带 `poiId`（展开加载最近服务的前提） | 纯函数 UT | `itinerary.test.ts` |
| F7 | 附近服务查询 key 唯一且带 `poiId`（展开加载） | 纯函数 UT | `locations-browsing.test.ts` |
| E2E-REG | 行程单与地点浏览既有流程回归（不含专用附近服务断言） | E2E | CI Browser E2E 全绿 |

## 3. 先于生产代码编写（red 顺序）

1. **A1–A4 先红**：先扩展 `LocationQueryApiTest` 夹具（医院/用品店坐标与营业时间快照），断言响应 → 驱动 controller/service/DTO。
2. **A5 同批红→绿**：先写 `petFriendlyOnly=true` 断言，期望返回未配置医院/用品店 → 驱动仓库 SQL 豁免。
3. **F1/F2 先红**：先写组件测试，断言展开前无 fetch、展开后请求与文案 → 驱动组件与查询。
4. **F3–F7 纯函数 TDD**：先写免筛选/未配置/`poiId`/query key 断言 → 驱动工具函数与行程派生。
5. **E2E 回归**：PR #75 CI 全量通过，未新增专用 E2E。

## 4. 本地 vs CI 门禁

| 检查 | 本地 | CI |
|---|---|---|
| 后端 API | `mvn -f apps/server/pom.xml clean test`（233 tests） | Server tests |
| 前端 UT / 类型 | `npm run test -w apps/web`（207 tests）+ `npm run build` | Web build |
| 浏览器回归 | 未本地重复全量 E2E | Browser E2E（PR #75 通过） |

## 5. 已知缺口

- 无专用 E2E 断言“附近宠物服务”折叠栏目；组件 UT 覆盖展开/空态，API 测试覆盖数据契约，CI 仅回归既有页面流程。
- 前端组件测试未覆盖加载错误态文案；该分支由实现审查与 `throwOnError: false` 保证，未自动化。
- “距离并列按 ID 升序”未构造并列夹具；由实现与代码审查保证。
