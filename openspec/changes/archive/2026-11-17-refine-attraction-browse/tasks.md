## 1. 列表页移除天数控件

- [x] 1.1 在 `apps/web/src/routes/_authenticated/attractions/index.tsx` 删除 `Tabs` 导入与渲染、`activeDay` 状态、`useEffect` clamp、`dayOptions` 及"当前查看第 X 天景点"提示语。
- [x] 1.2 在 `index.tsx` 向卡片传 `totalDays={active.totalDays}` 与 `onAddStop={(day) => tripActions.addStop(day, attraction.poiId)}`，保留 `onAddUnscheduled` 与 `onOpen`（改为打开本地弹窗）。验证：页面不再出现天数 Tabs。

## 2. 卡片改为「添加到行程」选择器

- [x] 2.1 在 `apps/web/src/routes/_authenticated/attractions/-attraction-card.tsx` 用 `Select` 替换「加入第 N 天」按钮：触发器常显「添加到行程」，`value={null}` 受控，选项为 `1..totalDays`、文案「第 N 天」，`onValueChange` 调用 `onAddStop(Number(value))`。
- [x] 2.2 移除卡片 `day` 与 `onAddDay` props，保留「查看详情」与「暂不排期」。验证：选天后面板立即出现地点、选择器无残留选中态、同日可重复加入。

## 3. 详情改为居中弹窗

- [x] 3.1 新增 `apps/web/src/routes/_authenticated/attractions/-attraction-detail-dialog.tsx`，把 `$poiId.tsx` 的查询、`cacheLocation` 副作用与内容迁入；外层 `<Dialog open onOpenChange>` + `<DialogContent className="max-w-2xl">`，标题为景点名、描述为地址，内容保留政策字段、逐宠物 tag、`PolicySubjectNotice`、「添加到行程」选择器与「暂不排期」；移除「返回景点列表」。
- [x] 3.2 `AttractionCard` 的「查看详情」回调改为 `onOpen` 设置列表页 `selectedPoiId`；`index.tsx` 条件渲染详情弹窗，`onClose` 清空 `selectedPoiId`。验证：URL 保持 `/attractions`，关闭后筛选与分页不变。
- [x] 3.3 删除 `apps/web/src/routes/_authenticated/attractions/$poiId.tsx`，重新生成 route tree，确认不再存在 `/attractions/$poiId` 路由。

## 4. 测试与文档同步

- [x] 4.1 更新 `e2e/trips-panel.spec.ts`：`addDayAttraction` 与保存失败重试用例改为「卡片内 combobox → 选项第 N 天」。
- [x] 4.2 更新 `e2e/attraction-pet-rules.spec.ts`：E3/E4/E7/E10 用 `[data-slot="dialog-content"]` 断言弹窗，删除详情 URL 与「返回景点列表」断言，E10 增加「添加到行程」combobox 断言。
- [x] 4.3 更新 `docs/knowledge/architecture/README.md` 景点页描述：去掉 `/attractions/$poiId` 独立页与天 tab，改为弹窗与选择器。
- [x] 4.4 运行 `npm test -w apps/web` 与 `npm run build -w apps/web`，确认类型与构建通过。
- [x] 4.5 运行 `npm run test:e2e -- e2e/attraction-pet-rules.spec.ts e2e/trips-panel.spec.ts --workers=1`（脚本自动拉起前后端；串行避免两个 spec 共用同一账号互相重置行程），确认全部通过。
