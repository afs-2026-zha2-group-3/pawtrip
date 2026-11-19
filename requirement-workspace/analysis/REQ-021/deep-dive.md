# REQ-021 Deep Dive — 行程单右侧常驻当天路线规划

- 上游：[REQ-021 行程单右侧常驻当天路线规划](../../requirements/REQ-021-inline-day-route-panel.md)
- 已确认口径：整页滚动 + 右栏吸顶；窄屏 <1024px 堆叠；删除按钮与弹窗。
- 本文固化 P1 可验收语义与测试分层；具体宽度、断点数值与组件命名由 P2 design 定稿（下文给出的建议值需在 P2 确认）。

## 1. 布局契约

- 断点：`lg` = 1024px。
- `≥1024px`：
  - 页面保持整页滚动，不设左列独立滚动容器，不锁定页面高度。
  - 主内容加宽以容纳两列；建议 `PageFrame` 新增宽度开关（默认值保持现有 `max-w-3xl`），行程单启用宽容器（建议 `max-w-6xl`），P2 定稿。
  - 两列建议比例 `minmax(0, 1fr) + 360–400px`；右栏 `position: sticky; top: 24px; align-self: start`，P2 定稿。
  - 头部标题/导出、交通规则卡、Day 标签行跨两列全宽；标题与标签行不随滚动吸顶（不新增吸顶条）。
  - 左列包含当天 `DayDetail` 与未排期分组；右列仅路线面板。
- `<1024px`：
  - 单列，顺序为：当天 `DayDetail` → 路线面板 → 未排期分组。
  - 面板与窄屏其他内容同宽，随页面滚动，不吸顶。
- DOM 与网格：面板在源码顺序中位于 `DayDetail` 之后、未排期之前；宽屏通过 grid 的列/行定位把面板放到右列、未排期放回左列第二行。禁止用 `order` 造成阅读顺序与视觉顺序相反。
- 打印：`printing` 态仍展开全部 `DayDetail`；面板整体 `print:hidden`。`PageFrame` 的 `print:max-w-none` 已保证打印宽度。
- 滚动锚点：切换 Day 不强制滚动页面；面板内容就地更新。

## 2. 状态契约

- 保留 `selectedDay`（默认 1）作为唯一选中天状态；删除 `routeDialogOpen`。
- 面板与 `DayDetail` 使用页面同一 `day` 变量（`itinerary.days.find(...) ?? itinerary.days[0]`），避免两处各自计算。
- 切换 Day：面板标题、描述、地图、标记、折线与标注全部刷新；页码/URL 不变化；不触发保存。
- 面板不发起新的数据查询；继续使用 `buildDayRoute(day, locations)` 与现有 `locations` 缓存。地点详情未加载时与现弹窗一致显示缺坐标降级。
- 组件卸载或 Day 切换时，未完成的高德算路回调必须被忽略（沿用 `DayRouteMap` 现有 `cancelled` 机制）。
- 行程单未完成（`!active.planCompleted`）时不渲染面板（守卫分支先返回）；已结束行程仍渲染只读面板。

## 3. 面板内容契约

- 容器：`data-testid="day-route-panel"`；建议用 `<section aria-labelledby>` 包裹。
- 标题：`<h2>`「第 ${day.day} 天路线规划」。
- 描述：`[day.dateLabel, day.city].filter(Boolean).join(" · ")`，存在时展示。
- 分支（与现弹窗一致）：
  1. 无地点：`day-route-empty` →「当天暂无地点」
  2. 有地点但全无坐标：`day-route-all-missing` →「地点缺少坐标，无法绘制路线」
  3. 仅一个地点：渲染地图 + `day-route-single` →「当天只有一个地点，无需路线」
  4. 其余：渲染地图
- 地图：复用 `DayRouteMap`；地图容器 `day-route-map`、「当天路线地图」、`h-[420px]`（P2 可微调）；降级标识 `day-route-placeholder`、`day-route-failure`、`day-route-missing` 保持不变。
- 空态或单点不发起算路；缺 Key 时展示「地图未配置，无法绘制路线」且行程其他内容可用。
- 文案逐字复用 `lib/trip/day-route.ts` 常量，不新增同义文案。
- 视觉：面板使用行程单卡片风格（圆角、内边距、淡奶黄页框内），具体样式 P2 定稿；不得移除 `/itinerary` 页框描边。

## 4. 入口移除契约

- 删除「查看当天路线规划」按钮及其 `MapPin` 引入（如无其他使用）。
- 删除 `DayRouteDialog` 组件文件（无其他引用）；如 P2 选择保留文件名，则必须去掉 Dialog 壳与 `open/onOpenChange` 契约，但更倾向新建 `DayRoutePanel` 并删除旧文件。
- 页面不得保留隐藏按钮、快捷键或空壳弹窗。
- 保留「携带清单」按钮与 `packing-progress`、导出按钮、天切换等可访问名。

## 5. 导出契约

- PDF：面板 `print:hidden`；打印态展开全部天仅影响 `DayDetail` 列表。
- 图片：导出使用独立隐藏 `image-export-surface`，面板不在其中；不得把面板移入导出容器。
- 导出过程中页面选中天与面板内容不变。

## 6. 测试计划

### E2E（`e2e/day-route-planning.spec.ts` 重写）

1. 进入行程单后无需点击，`day-route-panel` 可见，标题为「第 1 天路线规划」。
2. 点击 `Day 2` 后标题、描述与地图内容切换为第 2 天；不再断言「关闭弹窗」或弹窗数量。
3. 驾车/步行折线、快照时长优先、距离格式、同 `poiId` 跳过算路：保留现有断言，等待条件改为面板内地图。
4. 空天、全缺坐标、单点、缺 Key、单段失败：保留现有断言与 `day-route-*` 标识。
5. 删除原「关闭后保持当前天」用例；改为「切换天后面板与标签一致」。
6. 新增窄屏用例（视口 <1024px）：面板可见、无弹窗、位置在当天行程明细之后（可用 bounding box 或 DOM 顺序断言）。
7. 新增导出隔离用例：导出图片/打印后断言导出容器不含 `day-route-panel` / 地图（可在现有导出用例中追加）。
8. 新增/调整用例总数计入 ≤30 上限。

### 前端单测

- `day-route.test.ts` 不变（构建与文案）。
- 如新增面板组件且有渲染测试环境，可补：空天/单点/缺坐标分支与 `day-route-panel` 标识；无组件测试环境时不强加。
- `PageFrame` 若改签名，确认默认渲染宽度仍为 `max-w-3xl`（快照或类名断言）。

### 回归

- `e2e/itinerary.spec.ts`：行程单基础行为、导出、携带清单、未完成守卫、已结束只读。
- `e2e/day-route-planning.spec.ts` 全量。
- 其他页面宽度不受影响：抽查首页、城市、地点、行程页在宽屏的容器宽度。
- 前端 `tsc --noEmit`、`npm run build -w apps/web`、`npx vitest run`；后端无改动，仍执行 `./mvnw test` 作为全量门禁。

### 门禁命令

- 前端：`cd apps/web && npx vitest run`；`npm run build -w apps/web`；`npx tsc --noEmit`。
- 后端：`cd apps/server && ./mvnw test`。
- E2E：`node scripts/run-e2e.mjs e2e/day-route-planning.spec.ts e2e/itinerary.spec.ts`。
- 规格：`npx --no-install openspec change validate <change-id> --strict`。

## 7. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| `trip-itinerary` 当天路线规划入口与弹窗（REQ-016） | 本需求直接移除的入口 | 以 REMOVED + ADDED 迁移为「当天路线规划面板」；删除按钮/弹窗语义，新增常驻、吸顶、堆叠 |
| `trip-itinerary` 当天路线绘制（REQ-016） | 绘制行为 | 算法、交通方式映射、顺序不变；MODIFIED 仅把「打开弹窗」改为「查看面板」 |
| `trip-itinerary` 路线距离与时长标注（REQ-016） | 标注逻辑 | 不变，无需修改增量 |
| `trip-itinerary` 路线规划降级（REQ-016） | 降级提示 | 行为不变；MODIFIED 仅更新触发措辞 |
| `trip-itinerary` 路线弹窗空态（REQ-016） | 空态 | 以 REMOVED + ADDED 迁移为「路线面板空态」 |
| `trip-itinerary` 携带清单入口/弹窗（REQ-017） | 同页操作 | 行为不变；MODIFIED 清理「与路线按钮同层」「复用路线弹窗形态」表述 |
| REQ-020 `/itinerary` 淡奶黄描边 | 页框视觉 | 保留，不回退 |
| REQ-020 回退记录（两列一屏 + 左列内滚） | 布局风险 | 本需求不复用；改整页滚动 + 右栏 sticky |
| `web-app-shell` 页面主内容宽度 | 布局 | 不改变其他页面宽度；仅行程单启用加宽 |
| `ui-foundation`（若有容器/卡片规范） | `PageFrame` 签名 | 默认行为不变；新增能力由行程单显式启用 |
| `trip-packing-checklist` | 同页操作 | 按钮与进度不变 |
| `browser-e2e-testing` | E2E 结构 | 仅改 spec，不改底座 |
| 后端 / 数据库 | — | 无变化 |

## 8. DoR ⑨–⑫ 结论

- **⑨ 数据契约**：无新增字段/接口；面板消费现有 `day` 与 `locations`；导出与打印边界明确。
- **⑩ 边界分支**：未完成守卫、已结束只读、`selectedDay` 越界回退、空天、全缺坐标、单点、缺 Key、单段/全部失败、长页面滚动、窄屏堆叠、Day 切换时未完成算路取消、打印与图片导出、页面卸载均有明确行为。
- **⑪ 跨 REQ 一致性**：与路线规划四类要求、携带清单两需求、REQ-020 描边与回退原因、其他页面宽度、E2E 底座逐项核对；P2 已以 REMOVED + ADDED 迁移弹窗需求，并对绘制/降级/携带清单做 MODIFIED 措辞清理。
- **⑫ 展示与测试**：标题、描述、空态/降级文案、测试标识、E2E 重写与回归范围已定义；保留地图既有标识，回归风险可控。
- 结论：⑨–⑫ 全部 Pass；BLOCKER=0；无阻塞未知依赖。
