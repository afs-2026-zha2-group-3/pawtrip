## Why

景区浏览页当前要求用户先在顶部天 tab 选中某一天，再点每个地点的「加入第 N 天」；而天 tab 并不过滤列表，只用于拼接按钮文案，形成"先选天、后加点"的两步心智负担。景点详情又跳转到独立路由，看完政策返回时列表上下文被打断。把天数选择下沉到每个地点的加入动作、把详情改为同页弹窗，可以减少一次前置决策并保持浏览上下文。

## What Changes

- 删除 `/attractions` 列表页与景点详情中的天数 Tabs、`activeDay` 本地状态及其 clamp 逻辑，以及"当前查看第 X 天景点"提示语。
- 列表卡片与详情的「加入第 N 天」按钮改为「添加到行程」Select：触发器常显固定文案，选项为 `第 1 天 … 第 totalDays 天`，选中某天即写入对应 `day.stops` 末尾；触发器不保留上次选择，支持同日重复加入。
- 「暂不排期」保留为独立按钮，行为不变。
- **BREAKING** 景点详情由独立路由页改为列表页内的居中 Dialog（对齐 paws 页宠物弹窗模式）：删除 `/attractions/$poiId` 路由及其深链；关闭弹窗（关闭按钮 / Esc / 遮罩）后列表的筛选、分页与滚动位置保持不变。
- 详情弹窗内容与现详情页一致：景点名、地址、宠物友好结论、政策字段与逐宠物 tag，并保留「添加到行程」与「暂不排期」；移除「返回景点列表」按钮。
- 同步更新 `trip-attractions` 规格、架构文档与相关 E2E。
- 不修改后端 API、行程 store、`plan` 数据结构与自动保存机制。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`: 景点列表不再展示天数选择控件；加入入口由「加入第 N 天」改为「添加到行程」选择器；新增景点详情以弹窗展示并在关闭后保留列表状态的约束。

## Impact

- 前端路由：`apps/web/src/routes/_authenticated/attractions/index.tsx`、`-attraction-card.tsx`，以及由 `$poiId.tsx` 迁出的详情弹窗组件；删除 `attractions/$poiId.tsx` 并重新生成 route tree。
- 测试：`e2e/attraction-pet-rules.spec.ts` 的详情 URL 与返回按钮断言改为弹窗断言；`e2e/trips-panel.spec.ts` 的加入操作改为操作 Select。
- 文档：`docs/knowledge/architecture/README.md` 与 `openspec/specs/trip-attractions/spec.md`。
- 无后端、数据库、API 契约与依赖变更。
