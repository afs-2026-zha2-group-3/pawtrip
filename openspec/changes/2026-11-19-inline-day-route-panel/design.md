# Design

## 背景

- 现页面单列 `max-w-3xl`，Day 标签下方是当天 `DayDetail`，未排期在最后；路线内容在 `DayRouteDialog`（`DialogContent max-w-3xl`）。
- `DayRouteMap` 用 `routeKey` 触发重绘，卸载时销毁地图；`buildDayRoute` 与所有降级文案位于 `lib/trip/day-route.ts`。
- REQ-020 曾实现「两列一屏 + 左列内滚」并被用户要求回退；本设计不复用该形态。

## 决策

### D1 页面布局：整页滚动 + 右栏吸顶

- `≥1024px`（Tailwind `lg`）：Day 标签行下方使用 CSS Grid，两列为 `minmax(0, 1fr)` 与 `26rem`；页面保持整页滚动，不设内部滚动容器、不锁高度。
- 网格源顺序：当天 `DayDetail` → 路线面板 → 未排期。宽屏用 `lg:col-start-1` / `lg:col-start-2` 与 `lg:row-start-*` 定位；窄屏按源顺序自然堆叠，满足「面板在当天明细后、未排期前」。
- 右栏面板 `lg:sticky lg:top-6 lg:self-start`；左列内容高度大于视口时面板保持可见。
- 头部标题/导出、交通规则卡、Day 标签行保持跨列全宽。
- 备选：两列一屏 + 左列内滚（REQ-020 已回退，拒绝）；独立右侧浮层（层级与打印/可访问性成本高，拒绝）。

### D2 `PageFrame` 加宽：新增 `width` 属性

- `PageFrame` 增加可选 `width?: "default" | "wide"`，默认 `"default"`（`max-w-3xl`），`wide` 追加 `lg:max-w-6xl`。
- 仅 `/itinerary` 传 `width="wide"`；其他页面调用点不改。
- 不直接把 `className` 透传到 `<main>`，避免页面随意覆盖共享容器；打印宽度沿用 `print:max-w-none`。
- 备选：复用旧 `mainClassName`（曾被 REQ-020 撤销，且暴露布局细节，拒绝）。

### D3 右栏面板组件

- 新建 `apps/web/src/components/trip/day-route-panel.tsx`，从 `day-route-dialog.tsx` 迁移内容分支，移除 `Dialog` 壳与 `open/onOpenChange`。
- 结构：`<section data-testid="day-route-panel" aria-labelledby={titleId}>`，`<h2>` 标题「第 N 天路线规划」，描述 `dateLabel · city`，下方沿用空天/全缺坐标/单点/地图分支。
- 保留 `pawStickerSm` 装饰？弹窗中的贴纸依赖 `absolute` 定位；面板内不再放置该贴纸（避免与吸顶布局冲突），视觉由 P4 目视确认。
- 保留 `DayRouteMap` 及其全部测试标识；面板容器标识由 `day-route-dialog` 改为 `day-route-panel`。
- 删除 `day-route-dialog.tsx`（无其他引用）。

### D4 状态与联动

- 删除 `routeDialogOpen`、按钮与 `MapPin` 引入；保留 `selectedDay`。
- 面板与 `DayDetail` 共用页面已计算的 `day`（`itinerary.days.find(...) ?? itinerary.days[0]`）和 `locations` 缓存。
- 切换 Day 只更新组件 props，`DayRouteMap` 的 `routeKey` 触发覆盖物重绘；不新建查询、不写回行程。
- 面板随页面常驻，地图实例在页面生命周期内复用；切天时旧算路回调由现有 `cancelled` 机制忽略。

### D5 导出与打印

- 面板外层加 `print:hidden`；打印态仍由 `printing` 展开全部 `DayDetail`。
- 图片导出使用独立隐藏 `image-export-surface`，面板不在其中，无需修改导出流程。

### D6 窄屏

- `<1024px` 单列；面板宽度 100%，不吸顶。
- 顺序固定为当天 `DayDetail` → 面板 → 未排期；不使用 `order` 反转视觉/阅读顺序。

### D7 测试与验收

- `e2e/day-route-planning.spec.ts`：
  - helper 改为进入 `/itinerary` 后等待 `day-route-panel` 可见，不再点击按钮。
  - 删除「关闭弹窗」步骤与 `day-route-dialog` 计数断言；改为断言切换 Day 后面板标题与地图内容一致。
  - 保留绘制、快照时长、距离格式、同 POI 跳过、空天、缺坐标、单点、缺 Key、失败用例，选择器改为面板内。
  - 新增窄屏（<1024px）可见且无弹窗、导出不含面板两条断言；总数控制在 ≤30。
- 单测：`day-route.test.ts` 不变；如 `PageFrame` 需要，补默认宽度类名断言。
- 回归：`e2e/itinerary.spec.ts`（含淡奶黄描边与无阴影断言）、导出、携带清单、未完成守卫、已结束只读。
- 门禁：`npx vitest run`、`npx tsc --noEmit`、`npm run build -w apps/web`、`./mvnw test`、目标 E2E、`openspec change validate 2026-11-19-inline-day-route-panel --strict`。

## 风险与回滚

| 风险 | 缓解 |
|---|---|
| 地图在 sticky 容器内尺寸异常 | 右栏定宽、地图 `w-full`；本地 ≥1024px 真实浏览器验证缩放与拖拽 |
| `PageFrame` 加宽影响其他页面 | 新属性默认关闭；回归其他页面宽度 |
| E2E 依赖按钮导致大面积失败 | 全量替换按钮/弹窗选择器；目标 spec + 全量 E2E 双跑 |
| 打印/导出混入面板 | 面板 `print:hidden`；导出容器与页面 DOM 分离；目视 + 断言 |
| 重复 REQ-020 的回退原因 | 整页滚动 + sticky，明确禁止左列内滚与高度锁定 |

回滚：单 change 内集中在页面布局、面板组件与 `PageFrame` 属性；回滚时恢复 `DayRouteDialog` 与按钮即可，数据与后端无涉。
