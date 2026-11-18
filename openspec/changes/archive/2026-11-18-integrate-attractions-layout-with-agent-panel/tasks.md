## 1. 回归测试先行

- [x] 1.1 在 `e2e/attraction-pet-rules.spec.ts` 删除 `four-column attractions layout reserves the AI chatbox slot` 用例，改为 1920×1080 视口（`test.use({ viewport: { width: 1920, height: 1080 } })`）下的收起态用例：创建珠海行程并进入地点浏览，断言前 3 张卡片同行、地图占位右缘与 `main` 内容右缘误差 ≤1px、`ai-chatbox-slot` 不存在。
- [x] 1.2 新增 1920×1080 展开态用例：点击 `agent-fab` 展开面板，断言卡片仍两列（第 3 张进入下一行）、`agent-panel` 可见、地图占位右缘 ≤ 面板左缘且间距 ≥8px；关闭面板后恢复三列与贴右地图。
- [x] 1.3 在默认 1280×720 视口补充窄屏回归断言：展开面板后卡片仍为两列，第 3 张卡片位于下一行，页面不为面板预留 376px 留白轨。
- [x] 1.4 运行 `node scripts/run-e2e.mjs e2e/attraction-pet-rules.spec.ts`，确认新增用例在实现前因缺少三列布局 / 仍存在 `ai-chatbox-slot` 而失败。

## 2. 地点页自适应布局

- [x] 2.1 在 `apps/web/src/routes/_authenticated/attractions/index.tsx` 引入 `useAgentOpen()`，按开合状态选择 `2xl` 网格模板：收起 `2xl:grid-cols-[220px_minmax(0,1fr)_minmax(320px,0.8fr)]`，展开 `2xl:grid-cols-[220px_minmax(0,1fr)_minmax(240px,0.85fr)_minmax(0,376px)]`；两份模板均写成静态 class 字符串。
- [x] 2.2 卡片网格按状态切换：收起时追加 `2xl:grid-cols-3`，展开或 `<2xl` 时保持 `sm:grid-cols-2`；确认 1920 下收起态 3 列、展开态 2 列。
- [x] 2.3 删除 `data-testid="ai-chatbox-slot"` 的占位元素及相关样式，确保收起态地图列右侧无空白、地图右缘贴内容右缘。
- [x] 2.4 在 `apps/web/src/components/agent/agent-panel.tsx` 的 400px 宽度与地点页 376px 留白两处添加互相指向的注释，说明面板宽度变更需同步地点页网格。
- [x] 2.5 确认布局切换只改 class：筛选、分页、搜索框与已选详情状态在面板开合后保持不变，不触发数据重新请求。

## 3. 地图尺寸适配

- [x] 3.1 在 `apps/web/src/lib/amap/loader.ts` 的 `AMapMap` 接口补充 `resize(): void`。
- [x] 3.2 在 `apps/web/src/routes/_authenticated/attractions/-location-map.tsx` 中当地图状态为 `ready` 时对容器注册 `ResizeObserver`，尺寸变化时调用 `map.resize()`，卸载时断开 observer；不重置当前视野中心与缩放。
- [x] 3.3 补充 `LocationMap` 组件测试：mock `loadAmap` 与 `ResizeObserver`，断言容器尺寸变化时调用 `resize()` 且卸载后不再调用；运行 `npm run test -w apps/web` 通过。
- [x] 3.4 若有真实高德 Key，在 1920×1080 浏览器中手动开合面板，确认地图瓦片与视野随列宽正确重排；无 Key 时记录为未验证项。（本机未配置 `VITE_AMAP_JS_KEY`，真实地图人工验证未执行）

## 4. 文档与整体验证

- [x] 4.1 更新 `docs/knowledge/architecture/README.md`：补充 `2xl` 下地点页随 Agent 面板开合的三列/两列布局、删除 AI 占位、地图 `resize()` 及与 400px 面板宽度的耦合说明。
- [x] 4.2 运行 `openspec validate integrate-attractions-layout-with-agent-panel --strict`，确认规格与产物校验通过。
- [x] 4.3 运行 `npm run test -w apps/web`、`npm run build` 与 `node scripts/run-e2e.mjs e2e/attraction-pet-rules.spec.ts`，确认全部通过并在交付说明中列出验证结果。
