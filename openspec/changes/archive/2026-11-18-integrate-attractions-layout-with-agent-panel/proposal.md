## Why

地点浏览页在桌面宽屏下仍保留一列灰色“AI 对话框预留区域”，而实际 Agent 面板是独立悬浮的 Sheet，二者没有联动：面板收起时页面右侧多出一条无意义空白，面板展开时又直接压在地图上。需要在**不改变 Agent 面板悬浮形态**的前提下，让地点浏览页随面板开合调整内容布局。

## What Changes

- 地点浏览页订阅 Agent 面板的开合状态（仅内存状态），在宽屏断点下切换布局与卡片列数。
- 以 1920×1080 为验收基准、`2xl`（≥1536px）为生效断点：
  - 面板收起：主网格恢复“行程栏 / 列表 / 地图”三栏，卡片列表每行 3 张，地图右缘贴内容右缘，删除灰色 AI 占位。
  - 面板展开：卡片列表保持每行 2 张，右侧保留约 376px 透明留白承载悬浮面板，地图略微收窄且不被面板遮挡。
- 小于 `2xl` 的桌面与移动端保持现有行为（两列卡片；面板展开时悬浮覆盖内容），不新增自适应分支。
- 地图容器宽度变化后调用高德地图 `resize()`，避免瓦片与视野错位。
- 更新浏览器回归测试：移除“四栏布局 + AI 占位”用例，新增 1920×1080 下收起/展开两种布局的断言。

**BREAKING**: 无。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`: 新增“地点浏览与 Agent 面板的自适应布局”要求，替换原先隐含的四栏 AI 预留位布局。

## Impact

- `apps/web/src/routes/_authenticated/attractions/index.tsx`：网格模板、卡片列数、移除 `ai-chatbox-slot`。
- `apps/web/src/routes/_authenticated/attractions/-location-map.tsx` 与 `apps/web/src/lib/amap/loader.ts`：容器尺寸变化时调用 `resize()`。
- `e2e/attraction-pet-rules.spec.ts`：替换布局用例，新增 1920×1080 视口断言。
- `docs/knowledge/architecture/README.md`：同步地点浏览页布局说明。
- 不修改 Agent 面板组件、不修改后端 API、数据库或依赖。
