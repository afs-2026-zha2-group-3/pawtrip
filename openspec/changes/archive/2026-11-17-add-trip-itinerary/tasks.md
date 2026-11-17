# Tasks

## 1. 行程单数据模型

- [x] 1.1 新增 `apps/web/src/lib/trip/itinerary.ts`：按 `totalDays` 展开每天，日期由 `startDate + (day-1)` 以 UTC 自然日派生并附带星期；生成 stop/transport 交替的时间线 entries；汇总当天提醒与未排期名称。
- [x] 1.2 交通段记录起止 `poiId`、展示方式（打车/步行/驾车）与估算快照，供页面按需调用路线估算。
- [x] 1.3 新增 `apps/web/src/lib/trip/itinerary.test.ts`：跨月/跨年、星期、Day 结构、交通段、提醒与未排期、无开始日期降级，共 6 项。

## 2. 行程单页面

- [x] 2.1 新增 `apps/web/src/routes/_authenticated/itinerary.tsx`：无激活行程空态；页面头部展示行程名、城市、宠物、日期范围与大交通；缺失地点详情自行拉取并写入缓存。
- [x] 2.2 按天 Tabs（默认 Day 1）与当天头部（日期 · 城市 · 地点数）；时间线渲染地点卡片、途内交通段、可展开「详细携宠政策」、当天提醒与未排期区域；未接入板块不渲染。
- [x] 2.3 交通段组件：优先使用 `toNextEstimate`，缺失时调用 `routeEstimateQueryOptions`；打车展示宠物专车提示，估算失败展示「估算暂不可用」，相邻同地点展示「与上一景点相同，无需途内交通」。
- [x] 2.4 入口：行程面板头部「行程单」链接；Trips 激活行程卡片「行程单」链接；新增 `TripSectionNav` 分段导航供两页共用。

## 3. 导航与测试

- [x] 3.1 `apps/web/src/routes/__root.tsx` 将 `/itinerary` 映射到 `Trips` Tab；`trips.tsx` 与 `itinerary.tsx` 共用分段导航。
- [x] 3.2 新增 `e2e/itinerary.spec.ts`：空态与登录跳转；面板与 Trips 卡片入口、Trips 高亮、分段导航切换；Day 切换、日期、共享政策字段、快照估算、估算失败、同地点、自驾、当天提醒与无提醒、未排期、未接入板块负向断言、刷新保留。
- [x] 3.3 `e2e/trip-helpers.ts` 的 `createTripViaApi` 支持可选 `startDate`，供行程单用例构造带日期的行程。
- [x] 3.4 `trip-panel-policy.test.tsx` 为面板新增的路由链接补充 `Link` 替身，保持无 Router 上下文的单测可运行。

## 4. 规格同步

- [x] 4.1 新增 `trip-itinerary` 能力 delta：入口与导航、按天汇总与日期、时间线与途内交通、政策展开、当天提醒、未接入板块隐藏。
- [x] 4.2 `web-app-shell` delta：`Tab 与路由同步` 增加 `/itinerary` 归属 Trips；`受保护路由与登录跳转` 纳入 `/itinerary`。
- [x] 4.3 本 change 的 proposal、design、ATDD、DoV、alignment、tasks 与 summary 落盘。

## 5. 验证

- [x] 5.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 5.2 `npm test -w apps/web`：24 文件 191 项通过（含行程单 6 项）。
- [x] 5.3 E2E：`PAWTRIP_E2E_WORKERS=1 npm run test:e2e -- e2e/itinerary.spec.ts` 8 passed / 0 failed。
- [x] 5.4 浏览器结构验证：`/itinerary` 中 Trips Tab 高亮、分段导航、Day tab、日期头与空天状态正常。
- [x] 5.5 `npx --no-install openspec validate 2026-11-17-add-trip-itinerary --strict` 通过；`npx --no-install openspec validate --specs` 23 passed / 0 failed。`--specs --strict` 仍为 17/23，6 项为既存 Purpose/长需求告警，非本变更引入，记录而不在本变更内修复。

## 6. 评审修复（2026-11-17）

- [x] 6.1 政策详情改用共享 `petPolicyFields`：`null` 字段隐藏、布尔 `false` 展示「不需要」；删除行程单内第二套政策行映射。
- [x] 6.2 补齐 E2E：快照时长/费用、估算失败、同地点、全空政策与无提醒、自驾仅时长、Trips 卡片入口、未登录跳转、未接入板块负向断言；政策断言改为共享标签与值。
- [x] 6.3 恢复态：`hydration` 为 `idle`/`loading` 时显示「正在读取行程…」；destinations 查询在城市缓存命中时禁用；激活行程变化时重置地点补拉队列。
- [x] 6.4 同步 Spec（同地点提示例外、自驾仅时长、`false` 口径）、Design D1/D4/D5、ATDD、DoV、Alignment 与 Summary，并补 `.openspec.yaml`。

## Workflow follow-up

- [x] 提交本变更文件（`9f98d0a`）。
- [x] PR #74 已合并（`fc03481`）；Browser E2E 9m38s、Web build 34s 通过。
- [x] 同步两份 delta 到 living specs 并归档（`openspec validate --specs` 25 passed / 0 failed）。
- [x] G2/G3 已实名签署（VL=SCOTT Pass / SA=LEO Pass）；G1 本变更未单独落盘。
