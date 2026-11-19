# Tasks

- Spec ID：`2026-11-19-intra-city-transport-drag-reset`

## 1. 段行布局（方式选择器前移）

- [x] 1.1 红：`transport-segment.test.tsx` 新增用例——「打车」只出现一次且位于方式选择器内，选择器为段行首个元素；现有 `segment-mode` 文案断言保持通过。
- [x] 1.2 绿：`transport-segment.tsx` 删除选择器之前的 `segment-mode` 文字节点，把 `Select` 移到行首并移除 `ml-auto`；`data-testid="segment-mode"` 保留在触发器上。

## 2. 拖拽重置途内交通

- [x] 2.1 红：`store-transport.test.ts` 将「同日/跨天移动保留快照」两条用例反转为清空 `toNext` 与 `toNextEstimate`；新增「只清空被移动地点、其他地点快照保留」用例。
- [x] 2.2 绿：`store.ts` 的 `moveStop` 在插入时丢弃被移动 stop 的 `toNext`/`toNextEstimate`，`saveRevision` 仍递增以触发防抖保存；只读行程沿用既有 `isLocked` 早退。

## 3. 验证

- [x] 3.1 `npx tsc -p apps/web/tsconfig.json --noEmit`、`npm run test -w apps/web`、`npm run build -w apps/web`。
- [x] 3.2 E2E：`node scripts/run-e2e.mjs intra-city-transport.spec.ts attractions-timeline-hints.spec.ts trip-planning-agent.spec.ts trips-panel.spec.ts itinerary.spec.ts`；再跑全量。
- [x] 3.3 浏览器目视：段行行首为方式下拉、拖动后段行回到默认方式。

## 执行记录

- TDD：`transport-segment.test.tsx` 先红（「打车」出现 2 次）后转绿（18/18）；`store-transport.test.ts` 先红（拖拽后快照仍保留）后转绿（18/18）。
- 静态与单测：`tsc --noEmit` 通过；`npm run test -w apps/web` 49 个文件、374 个用例全部通过；`npm run build -w apps/web` 通过。
- E2E：目标 5 个文件 34 个用例通过；全量 109 个用例通过（首轮 `packing-checklist` 1 例并发抖动失败，单跑 5/5 通过后复跑全量全绿）。
- E2E 适配：`segment-mode` 触发器文本含图标字符（如 `打车▼`），断言改为 `toContainText`；`E10` 改为断言被拖拽地点 `toNext`/`toNextEstimate` 为空、其余地点保留，并兼容接口回填的 `null` 字段。
- 目视：Day 1 两个景点之间的段行行首即为方式下拉（打车 ▾），后接「估算暂不可用」与携宠提示，无独立方式文字。
- 未提交、未推送。

## 4. 双向拖拽排序修复（2026-11-19）

- [x] 4.1 红：`store.test.ts` 在「同日重排与跨天移动」用例中补充向下拖拽断言（1→0 后再 0→1 复原）。
- [x] 4.2 绿：`store.ts` 的 `moveStop` 去掉向下移动时的 `targetIndex -= 1`，目标索引直接取落点项索引；向上移动行为不变。
- [x] 4.3 E2E：`attractions-timeline-hints.spec.ts` 新增双向拖拽用例，断言向下/向上拖动后顺序互换且提交的 PUT 计划顺序正确。
- [x] 4.4 `tsc --noEmit`、单测、目标 E2E、`openspec change validate --strict`。
- 实现：`moveStop` 先移除再插入，`targetIndex = to.index`；向下拖到目标项时恰好落在目标项之后。
- 未提交、未推送。
