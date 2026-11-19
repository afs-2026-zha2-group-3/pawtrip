# Tasks

- Spec ID：`2026-11-19-inline-day-route-panel`
- 设计依据：[design.md](design.md)
- 本变更为纯前端；按仓库约定前端直接实现并同步测试（不红测先行），E2E 新增/保留总数 ≤30。

## 1. 容器与布局（D1 / D2）

- [x] 1.1 `PageFrame` 增加 `width?: "default" | "wide"`（默认 `default` 保持 `max-w-3xl`，`wide` 追加 `lg:max-w-6xl`）；其他页面调用点不变。
- [x] 1.2 `/itinerary` 传入 `width="wide"`，页框仍保留 `border-2 border-paw-accent-soft` 与无阴影。
- [x] 1.3 Day 标签行下方改为两列网格：左列 `DayDetail` 与未排期、右列路线面板；`lg` 下右栏 `sticky top-6 self-start`，窄屏按源顺序堆叠（当天明细 → 面板 → 未排期）。
- [x] 1.4 头部标题/导出、交通规则卡、Day 标签行保持全宽；打印态仍展开全部 `DayDetail`。

## 2. 面板组件（D3）

- [x] 2.1 新建 `components/trip/day-route-panel.tsx`：`<section data-testid="day-route-panel" aria-labelledby>` + `<h2>`「第 N 天路线规划」+ 日期城市描述；迁移空天/全缺坐标/单点/地图分支。
- [x] 2.2 复用 `DayRouteMap` 与 `lib/trip/day-route.ts` 文案；保留 `day-route-map`、`day-route-empty`、`day-route-all-missing`、`day-route-single`、`day-route-failure`、`day-route-missing`、`day-route-placeholder` 标识。
- [x] 2.3 面板外层 `print:hidden`；不进入图片导出容器。

## 3. 页面接线与入口移除（D4 / D5 / D6）

- [x] 3.1 删除「查看当天路线规划」按钮、`routeDialogOpen` 状态、`MapPin` 引入与 `DayRouteDialog` 挂载。
- [x] 3.2 删除 `components/trip/day-route-dialog.tsx`；确认无其他引用。
- [x] 3.3 面板与 `DayDetail` 共用同一 `day` 与 `locations`；切换 Day 时标题、描述与地图同步刷新，不触发保存。
- [x] 3.4 窄屏（<1024px）验证面板在当天明细之后、「未排期」之前，无弹窗、无吸顶。
- [x] 3.5 保留「携带清单」按钮、`packing-progress`、导出按钮与天切换的既有可访问名。

## 4. 测试与验证（D7）

- [x] 4.1 重写 `e2e/day-route-planning.spec.ts`：helper 直接等待 `day-route-panel`；删除按钮、关闭弹窗与 `day-route-dialog` 计数断言。
- [x] 4.2 保留绘制、快照时长优先、距离格式与失败用例，选择器改为面板内；新增空天与单点用例。
- [x] 4.3 新增窄屏（<1024px）面板可见且无弹窗断言；导出用例断言不含 `day-route-panel`。
- [x] 4.4 回归 `e2e/itinerary.spec.ts`（含淡奶黄描边、无阴影）与导出、携带清单、未完成守卫、已结束只读。
- [x] 4.5 `npm test -w apps/web`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build -w apps/web`、`./mvnw test`。
- [x] 4.6 `npx --no-install openspec change validate 2026-11-19-inline-day-route-panel --strict`。

## 验证记录

- 2026-11-19 本地验证通过：
  - `npm test -w apps/web`：49 个文件 / 375 用例 passed
  - `npx tsc --noEmit -p apps/web/tsconfig.json`：无错误
  - `npm run build -w apps/web`：构建成功
  - `./mvnw test`（apps/server）：272 用例，0 failure / 0 error
  - `npm run test:e2e -- e2e/day-route-planning.spec.ts e2e/itinerary.spec.ts`：16 passed
  - `npx --no-install openspec change validate 2026-11-19-inline-day-route-panel --strict`：valid
- 视觉：≥1024px 右栏 26rem 常驻并吸顶；窄屏堆叠顺序由 E2E 断言；打印与图片导出均不含面板。
