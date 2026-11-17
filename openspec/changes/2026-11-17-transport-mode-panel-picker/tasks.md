# Tasks

## 1. 组件与数据

- [x] 1.1 新增 `apps/web/src/components/ui/popover.tsx`：封装 Base UI `Popover.Root/Trigger/Portal/Positioner/Popup`，层级 `z-[60]`，复用 popover 背景、描边与 `data-open/data-closed` 动画。
- [x] 1.2 新增 `apps/web/src/data/transport-mode-options.ts`：按四种方式取代表规则，复用 `evaluateRuleForPet` 生成宠物结论；飞机附默认航司。配套 `transport-mode-options.test.ts` 三项用例。
- [x] 1.3 新增 `apps/web/src/components/trip/transport-mode-picker.tsx`：未选时「选择大交通」虚线入口，已选时「大交通 · 方式名」chip；浮层展示四种方式、宠物结论/原因与右上角「规则详情」链接；选择后关闭浮层并回调。
- [x] 1.4 浮层无障碍与测试标记：未选择时触发按钮 `aria-label="选择大交通方式"`，已选择时 `aria-label="大交通方式：{中文名}"`；方式按钮 `data-mode` 与 `aria-pressed`，保留 `transport-mode-tag` / 新增 `transport-mode-picker` testid。

## 2. 面板接入

- [x] 2.1 `apps/web/src/components/trip/trip-panel.tsx` 用 `TransportModePicker` 替换只读 tag，传入 `active.transportMode`、`activePet` 与 `tripActions.setTransportMode`。
- [x] 2.2 选择沿用既有 600ms 防抖保存，不新增本地选择状态；规则页单选读取同一字段自动回显。

## 3. 测试

- [x] 3.1 `transport-mode-options.test.ts`：无宠物无结论、毛毛不满足条件列出原因、豆豆全部推荐。
- [x] 3.2 `e2e/rule-recommendation-and-selection.spec.ts` 新增「面板选择并保存」：断言浮层四种方式、激活宠物「毛毛 · 不推荐」与体重原因，选择高铁后等待 `PUT` 且请求体 `transportMode=high_speed_rail`，标签更新并在刷新后保留；再次点开已选标签断言 `aria-pressed=true`。
- [x] 3.3 同 spec 新增「规则详情跳转」：点击「查看交通规则详情」后 URL 为 `/transport-rules` 且表格可见。
- [x] 3.4 同 spec 新增「面板选择后规则页回显」：面板选择高铁后进入 `/transport-rules`，断言「选择高铁」radio 选中。
- [x] 3.5 同 spec 新增「宠物数据不可用时面板入口仍可选」：拦截 `/api/pets` 返回 500，断言浮层展示加载失败文案、方式项可点击并发出含 `transportMode` 的 `PUT`。
- [x] 3.6 保留规则页既有推荐与单选用例，确认两处入口共享保存链路。

## 4. 规格同步

- [x] 4.1 `specs/trip-context/spec.md`：新增 `RENAMED Requirements`（`大交通方式面板标签` → `大交通方式面板选择入口`）并保留同名 `MODIFIED` 块，确保干净 `main` 上归档能按名找到需求；工作区 living spec 同步更新，归档时以 delta 为准。
- [x] 4.2 `specs/transport-rules-comparison-page/spec.md`：`交通方式单选与临时缓存` 补充面板等价入口与「面板选择后规则页回显」场景；工作区 living spec 同步更新。
- [x] 4.3 本 change 的 proposal、design、delta specs、ATDD、DoV、alignment、tasks 与 summary 落盘。

## 5. 验证

- [x] 5.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 5.2 `npm test -w apps/web`：24 文件 188 项通过。
- [x] 5.3 E2E：`rule-recommendation-and-selection` 7 passed。
- [x] 5.4 浏览器结构验证：浮层四种方式与宠物结论、选择自驾后标签为「大交通 · 自驾」且状态「已保存」、规则页自驾单选选中。
- [x] 5.5 `npx --no-install openspec validate 2026-11-17-transport-mode-panel-picker --strict` 通过；`openspec validate --specs` 23 passed。全量 `--specs --strict` 仍有 6 个与本变更无关的 TBD Purpose 失败，本变更不以此作为通过口径。

## Workflow follow-up

- 提交本变更文件：新增 `components/ui/popover.tsx`、`components/trip/transport-mode-picker.tsx`、`data/transport-mode-options.ts` 与其单测、本 change 目录（含 `.openspec.yaml`）；修改 `trip-panel.tsx`、`e2e/rule-recommendation-and-selection.spec.ts`、2 份 delta 与对应 living spec。
- PR 阶段补跑全量 E2E 与 CI。
- G1/G2/G3 需实名签署，本记录不代签。
