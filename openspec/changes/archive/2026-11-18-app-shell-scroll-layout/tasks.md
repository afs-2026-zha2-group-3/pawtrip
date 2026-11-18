## 1. 应用外壳基础

- [x] 1.1 在 `apps/web/src/styles.css` 定义 `--app-header-height: 80px`，并新增 `@media print` 重置：`html, body` 恢复 `height:auto; overflow:visible`，`body` 恢复 `display:block`，内容滚动视口恢复普通流。
- [x] 1.2 改造 `apps/web/src/routes/__root.tsx`：非登录页 `body` 使用 `h-dvh flex flex-col overflow-hidden`，`AppHeader` 改为 `shrink-0`，移除与壳层冲突的 `min-h-svh`。
- [x] 1.3 在 `__root.tsx` 的 `AppTabs` 外层增加可横向滚动、隐藏滚动条的容器，并为右侧 `Log out` 预留内边距，验证 390px 宽下全部 Tab 可达。
- [x] 1.4 改造 `apps/web/src/routes/_authenticated.tsx`：Outlet 外层改为 `flex-1 min-h-0 overflow-y-auto [view-transition-name:app-content]`，作为默认内容滚动视口。
- [x] 1.5 在内容滚动视口上实现路由切换滚动复位：`pathname` 变化时 `scrollTop = 0`，`location.hash` 存在时跳过。
- [x] 1.6 核对 `/login` 在壳层改造后的高度表现，确保登录卡片仍居中且短视口可滚动。

## 2. 地点浏览页分区滚动

- [x] 2.1 改造 `apps/web/src/routes/_authenticated/attractions/index.tsx` 的 main：`lg+` 使用 `h-full overflow-hidden`，删除 `lg:h-[calc(100svh-80px)]`。
- [x] 2.2 三栏网格各列补齐 `min-h-0`：列表列 `overflow-y-auto`，地图列 `h-full` 固定，顶部筛选行保持 `auto` 行高。
- [x] 2.3 改造 `apps/web/src/components/trip/trip-panel.tsx` 的 timeline 模式：面板 `h-full flex flex-col`，列表区域 `flex-1 min-h-0`，`AnimatedList` 传 `className="h-full"` 与 `maxHeight="100%"`，页脚保持 `shrink-0` 贴底，删除 `calc(100svh - 280px)` / `calc(100svh - 170px)`。
- [x] 2.4 核对地点浏览 `<lg` 表现：三栏按内容视口整体滚动堆叠，不出现列级独立滚动容器。
- [x] 2.5 回归 Agent 面板开合布局：≥1536px 三栏三列/两列切换与地图对齐断言保持通过。

## 3. 城市浏览页 Sticky 面板

- [x] 3.1 将 `apps/web/src/routes/_authenticated/cities.tsx:359` 的 `max-h-[calc(100vh-3rem)]` 改为 `max-h-[calc(100dvh-var(--app-header-height)-3rem)]`。
- [x] 3.2 验证 ≥1408px 选中城市后政策面板吸顶位置与独立滚动正常，且不被固定 header 遮挡。

## 4. 其他页面与打印

- [x] 4.1 逐页核对首页、`/paws`、`/trips`、`/itinerary`、`/transport-rules`、管理页、政策详情：内容在内容视口内正常滚动，无页面级滚动，`PageFrame` 样式无需额外高度处理。
- [x] 4.2 验证 `/paws` 与 `/` 在 1920×1080 下不出现滚动条，矮视口下可兜底滚动且不裁切内容。
- [x] 4.3 验证政策详情 `#banned-breeds` 深链滚动到内容视口内，且 `scroll-mt` 语义保持不变。
- [x] 4.4 打印 / PDF：Chromium 打印预览完整输出全部 Day，内容不被内部滚动截断，导航与外框不出现；必要时补齐 `print:` 重置类。
- [x] 4.5 验证行程单图片导出使用的离屏容器不受壳层影响。

## 5. 测试

- [x] 5.1 更新 `e2e/destination-selection.spec.ts` 锚点断言：由 `window.scrollY > 0` 改为内容滚动视口 `scrollTop > 0` 且目标元素在视口内。
- [x] 5.2 新增壳层 e2e：滚动内容区时 header 包围盒不变、`window.scrollY` 恒为 0、路由切换后内容区回到顶部。
- [x] 5.3 新增地点浏览 e2e：滚动列表后地图包围盒不变、行程面板独立滚动且页脚可见、`window.scrollY` 为 0。
- [x] 5.4 新增窄视口导航 e2e：390px 宽下 Tab 列表可横向滚动访问全部 Tab。
- [x] 5.5 运行单元测试与全部 e2e，确认既有地点/行程/打印相关用例通过。
