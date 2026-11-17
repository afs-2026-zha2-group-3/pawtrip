# ATDD Design

变更：`2026-11-17-transport-mode-panel-picker`

## ATDD layers in scope

### API 层

不新增或修改后端接口。选择沿用既有 `PUT /api/trips/{id}` 整量保存，请求体中的 `transportMode` 契约不变，`TripApiTest` 无需新增用例。

### Unit 层

`transportModeOptions(pet)` 为纯函数，位于 `apps/web/src/data/transport-mode-options.ts`，使用 Vitest 覆盖：

| 用例 | 断言 |
|---|---|
| 无宠物 | 返回飞机、高铁、火车、自驾四项，全部无结论，飞机标注中国国际航空 |
| 宠物不满足条件 | 高铁列出体重/肩高/检疫证明三条原因；自驾仅缺检疫证明 |
| 宠物全部满足 | 四项均为推荐 |

### E2E 层

| 场景 | 用例 | 归类理由 |
|---|---|---|
| 面板打开浮层并按激活宠物展示结论与原因 | `rule-recommendation-and-selection` › mode selection › selects the mode from the trip panel with the active pet verdict | 浮层交互与推荐文案 |
| 面板选择后保存并在刷新后保留 | 同上（等待 `PUT` 请求体与 `transport-mode-tag`；再次点开标签断言 `aria-pressed`） | 自动保存与回显 |
| 面板选择后规则页回显 | 同上 spec › 面板选择高铁后进入 `/transport-rules`，断言「选择高铁」radio 选中 | 两处入口共享同一 `transportMode` |
| 规则详情链接跳转 | 同上 spec › opens the full rules page from the panel picker | 路由跳转 |
| 宠物数据不可用时入口仍可选 | 同上 spec › keeps the picker usable when pet data is unavailable（拦截 `/api/pets` 500，断言错误文案、方式可点并发出 `PUT`） | 降级不阻断选择 |
| 规则页单选、刷新回显、无档案可选 | 既有 mode selection 用例 | 两处入口共享同一 `transportMode` |

## What is written before production code

本次为功能完成后补齐的 ATDD 记录，不追溯声称测试先行。实现与测试同步落地，最终以以下骨架验证用户可见行为：

1. `apps/web/src/data/transport-mode-options.test.ts`：三项纯函数用例。
2. `e2e/rule-recommendation-and-selection.spec.ts`：新增面板选择、规则详情跳转、宠物失败降级三条用例，并在面板选用例内补充规则页回显断言；保留规则页原有四条。

## Non-goals

- 不覆盖航司切换后面板结论与规则页的差异（浮层固定按默认航司）。
- 不覆盖浮层内键盘方向键导航（Base UI 默认焦点管理即可）。
- 不覆盖面板收起/展开动画与窄屏布局的视觉快照。
