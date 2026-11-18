# 设计：应用外壳固定导航与分区滚动

## Context

当前登录后的滚动全部发生在文档根上：

- `__root.tsx` 把 `<AppHeader />` 渲染在普通文档流中（`min-height: 80px`），页面一滚，导航即离开视口。
- `_authenticated.tsx` 的 Outlet 外层使用 `min-h-svh`，与地点浏览页 main 的 `lg:h-[calc(100svh-80px)]` 叠加后，文档高度恒为 `100svh + 80px`，页面永远多出 80px 可滚动距离，地图和 header 都会跟着动。
- 地点浏览页已经在列内滚动（列表 `overflow-y-auto`、地图 `h-full`），但外层“假滚动”破坏了固定感；行程面板列表高度又用 `calc(100svh - 280px)` 估算 header 与页脚。
- 城市浏览页在 ≥1408px 使用 sticky 政策面板，`top-6` 与 `max-h-[calc(100vh-3rem)]` 隐含“header 已滚走”的假设。
- 行程单导出 PDF 依赖 `window.print()`，打印样式依赖普通文档流；改为壳层后必须显式恢复。
- 政策详情页存在 `#banned-breeds` 锚点深链，e2e 断言 `window.scrollY > 0`。
- 悬浮行程面板与 Agent 面板均为 `fixed`，桌面端 `top-24`（96px）为 80px header 预留了位置。

## Goals / Non-Goals

**Goals:**

- 顶部导航在所有受保护页面固定在滚动区之外，不随内容滚动。
- 页面默认只滚动内容区；地点浏览在桌面端三栏定高，仅地点列表与行程面板内容滚动，地图固定。
- 移除基于 header 高度的魔法数字，布局高度由 flex/grid 分配。
- 打印 / PDF、锚点深链、悬浮面板、Agent 自适应布局不回归。
- 矮视口允许内容区兜底滚动，不做强制裁剪。

**Non-Goals:**

- 不重设计顶部导航信息架构，不为窄屏引入折叠菜单。
- 不做前进/后退的滚动位置恢复（浏览器不原生支持内部滚动容器的恢复）。
- 不改变移动端（`<lg`）地点浏览的单列堆叠结构。
- 不改变悬浮行程面板与 Agent 面板的形态与定位。
- 不涉及后端 API、数据库或依赖变更。

## Decisions

### D1：采用固定高度壳层，而不是 sticky header

`body` 使用 `h-dvh flex flex-col overflow-hidden`；header `shrink-0`；Outlet 外层作为内容滚动视口 `flex-1 min-h-0 overflow-y-auto`。

- 与“只有部分内容滚动”直接对应，不依赖 `top` 偏移与视口减法。
- 用 `dvh` 而非 `svh`：移动端地址栏收起时不留空白。
- 备选方案 sticky header + 文档滚动：仍需 `calc(100svh - header)` 约束地点浏览，任一子元素超高就重新出现双层滚动，移动端地址栏伸缩时也易抖动，不采用。

### D2：默认内容区滚动，地点浏览按断点显式接管

- 默认页面在内容滚动视口内正常流式滚动，视觉上等价于“只有内容在滚”。
- 地点浏览在 `lg+` 让内容视口 `overflow-hidden`，三栏各自定高；`<lg` 回退为内容视口整体滚动。
- 备选方案：所有页面都 `overflow-hidden` 由页面自行安排滚动区。简单页面（首页、paws）需要额外包装，且容易在矮视口裁切内容，不采用。

### D3：高度全部由 flex/grid 分配

- 地点浏览 main 改为 `h-full`，网格沿用 `grid-rows-[auto_minmax(0,1fr)]`，各列 `min-h-0`；地图列 `h-full`，列表列 `min-h-0 overflow-y-auto`。
- 内嵌行程面板 `h-full flex flex-col`；列表区域 `flex-1 min-h-0`，`AnimatedList` 传 `className="h-full"` 与 `maxHeight="100%"`（其根节点获得确定高度后百分比生效），页脚保持 `shrink-0` 贴底。
- 移除 `calc(100svh - 280px)` / `calc(100svh - 170px)` / `calc(100svh - 80px)`。
- 在 `styles.css` 定义 `--app-header-height: 80px` 作为唯一来源，仅供城市页 sticky 面板等跨容器计算使用；壳层自身不依赖该变量布局。

### D4：打印恢复普通文档流

`@media print` 中重置：`html, body { height: auto; overflow: visible }`、`body { display: block }`、内容滚动视口 `{ display: block; height: auto; overflow: visible }`。保留现有 `print:hidden` 规则。图片导出使用的离屏容器不受影响。验证方式：Chromium 打印预览完整输出全部 Day，不截断。

### D5：路由切换时内容区回到顶部

文档滚动时浏览器会自动复位；改为内部滚动后需要在 `pathname` 变化时把内容视口 `scrollTop` 置 0。同时关闭 TanStack Router 的 `scrollRestoration`：它按选择器缓存滚动容器并在跨路由时把上一页元素的 `scrollTop` 带入下一页，会覆盖上述复位。锚点深链仍由 Router 的 `scrollIntoView` 处理，目标地址带 `#` 时跳过复位。备选方案：保留 Router 缓存并用 `scrollToTopSelectors` 覆盖——缓存恢复优先于选择器复位，不可靠，不采用。

### D6：锚点深链由内容滚动容器承担

`#banned-breeds` 等锚点目标位于内容滚动视口内，浏览器会滚动最近的可滚动祖先。header 在滚动区外，`scroll-mt-6` 语义不变。e2e 断言从 `window.scrollY > 0` 改为内容视口 `scrollTop > 0` 且目标元素在视口内。

### D7：窄屏导航横向滚动

Tabs 容器在壳层内改为可横向滚动、隐藏滚动条的容器，为右侧 `Log out` 预留内边距；tab 保持单行 pill，不换行。备选方案：换行导致 header 高度变化，与固定壳层的简洁性冲突，不采用。

### D8：城市页保持 sticky 面板

sticky 相对新的滚动视口生效，`top-6` 含义变为“距滚动视口顶部 24px”，无需改值；`max-h-[calc(100vh-3rem)]` 改为 `calc(100dvh - var(--app-header-height) - 3rem)`，避免面板底部被 header 高度挤出可视区。备选方案：城市页也改为页面内多栏独立滚动，改动面更大，本期不做。

### D9：悬浮面板与 Agent 面板保持不变

两者继续 `fixed`；`lg:top-24` 仍能避开固定 header。地点浏览页三栏高度来自内容视口，Agent 展开时的留白列继续使用 grid 列宽，不依赖视口高度。

## Risks / Trade-offs

- **打印被内部滚动截断** → D4 的 `@media print` 重置 + 打印预览验收；若仍截断，回退为打印时临时把内容移到 body 的直接子节点（不预期发生）。
- **嵌套滚动体感差**（列表、行程面板各自滚动）→ 地点列表沿用隐藏滚动条，行程面板用细滚动条；地图保持固定以强化空间感。
- **Ctrl+F / 键盘翻页的滚动目标变化** → 浏览器可在内部滚动容器中查找与滚动；验收包含键盘可达性。
- **路由切换复位与锚点冲突** → 有 hash 时跳过复位；深链进入由浏览器处理。
- **矮视口下 paws 出现滚动条** → 已知且接受，优先保证内容不被裁切。
- **固定 header 后视口高度减少 80px** → 地点浏览地图高度相应变小；e2e 的列对齐断言不受影响，但需要新增“地图不随列表滚动”的断言。
- **Playwright 默认 1280×720** → 地点浏览在 `lg` 断点即进入三栏，桌面断言仍成立；`<lg` 场景需显式设置 390 宽视口。

## Migration Plan

纯前端布局改造，无数据迁移。按页面分批合入不影响对外行为；回滚直接回退对应提交。合入前跑 `npm run e2e`（或项目既有 e2e 命令）并手工验证打印预览。

## Open Questions

- 无。已确认：矮视口允许内容区兜底滚动；移动端地点浏览保持内容区整体滚动。
