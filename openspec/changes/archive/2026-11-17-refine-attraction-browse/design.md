## Context

当前 `/attractions` 列表与 `/attractions/$poiId` 详情页各自维护 `activeDay` 状态与天数 Tabs，天 tab 只用于拼接「加入第 N 天」按钮文案，不过滤列表。详情为独立路由页，返回列表时列表组件重新挂载。`lib/trip/store.ts` 的 `addStop(container, poiId)` 已接受任意天或 `unscheduled`，`components/ui/select.tsx`、`components/ui/dialog.tsx` 均已有封装，paws 页的宠物弹窗提供了"页面本地 state + 受控 `Dialog open`"的既有模式。

## Goals / Non-Goals

**Goals:**

- 用每张卡片的「添加到行程」选择器替代前置的天数 Tabs。
- 景点详情改为列表页内居中弹窗，关闭后列表筛选、分页与滚动保持。
- 保持加入行程、暂不排期、同日重复加入与自动保存行为不变。

**Non-Goals:**

- 不修改后端 API、`plan` 数据结构、行程 store 与自动保存策略。
- 不保留 `/attractions/$poiId` 深链，也不引入 URL 同步（query 参数或路由级弹窗）。
- 不为景点详情新增编辑、删除等管理能力。

## Decisions

### D1. 详情承载：页面本地 state 弹窗，删除 `$poiId` 路由

列表页新增 `selectedPoiId` 状态，条件渲染 `<AttractionDetailDialog poiId onClose>`；`Dialog` 内部始终 `open`，`onOpenChange(false)` 调用 `onClose`，与 `-pet-dialogs.tsx` 的 `PetDialog` 一致。删除 `attractions/$poiId.tsx`，route tree 由构建重新生成。

备选：路由级弹窗（保留 URL）需要把列表上提到 `attractions.tsx` layout；query 参数方案需要新增 `validateSearch`。两者都能保留可分享链接，但当前详情依赖激活行程、深链价值低，且 paws 已有同类模式，选择本地 state 以最小化结构改动。

### D2. 「添加到行程」用受控空值的 Select

`Select` 使用 `value={null}` 受控，`onValueChange` 中调用 `tripActions.addStop(Number(value), poiId)`。base-ui `Select.Root` 的 `value` 类型允许 `null`，因此每次打开都没有历史选中项，触发器文案恒定；未渲染 `SelectValue`，直接写「添加到行程」。选项为 `Array.from({ length: totalDays }, (_, i) => i + 1)`，文案「第 N 天」，与行程面板表头一致。

备选：非受控 Select 会保留上次勾选状态，与"可重复加入"语义冲突；触发器显示「第 N 天」会让人误以为地点归属于单一天。

### D3. 详情弹窗组件拆分为路由私有文件

`$poiId.tsx` 的查询、`cacheLocation` 副作用与内容迁入 `attractions/-attraction-detail-dialog.tsx`（`-` 前缀文件不参与路由生成），内层使用 `<DialogContent className="max-w-2xl">` 与 `DialogHeader`，保留 `attractionDetailQueryOptions` 与 `tripActions.cacheLocation`。加载态在弹窗内展示"正在加载景点详情…"。

### D4. 卡片接口调整

`AttractionCard` 去掉 `day` 与 `onAddDay`，改为 `totalDays: number` 与 `onAddStop(day: number)`；`onOpen` 由路由跳转改为打开本地弹窗。`onAddUnscheduled` 不变。

### D5. E2E 交互对齐 base-ui 语义

选择器触发器为 `combobox`、选项为 `option`，断言按「卡片内 combobox → 选项第 N 天」定位；详情相关断言改用 `[data-slot="dialog-content"]`，删除 URL 与「返回景点列表」断言。

## Risks / Trade-offs

- [移除 `/attractions/$poiId` 深链] → 该页面依赖激活行程且仅从列表进入，深链使用价值低；如后续需要可改为 query 参数方案。
- [浏览器后退直接离开列表页] → 用户已选择对齐 paws 模式；弹窗内关闭按钮、Esc 与遮罩均可关闭，主路径不受影响。
- [弹窗内加入后不自动关闭] → 保持与现详情页一致，用户可连续加入多个地点后统一关闭；后续如需要可加 toast 或自动关闭。
- [列表页常驻后详情数据缓存] → `cacheLocation` 继续写入 store，行程面板中的地点名称解析不受影响。
