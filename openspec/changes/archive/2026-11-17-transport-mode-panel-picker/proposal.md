# Proposal

## Why

大交通方式此前只能在「交通规则」页通过表格单选确定，行程面板顶部的「大交通」标签是只读展示。用户在地点浏览页规划行程时，为了选一种交通方式必须离开当前页、切到交通规则页再回来，路径长且打断规划。面板本身就是行程上下文，应该能就地完成选择。

## What Changes

- 行程面板顶部的大交通标签改为可点击入口：已选择时显示「大交通 · 方式名」，未选择时显示「选择大交通」。
- 点击打开选择浮层，逐项展示飞机、高铁、火车、自驾；存在激活行程绑定的宠物档案时，复用规则页同一判定函数展示「宠物名 · 推荐/不推荐」与不推荐原因。
- 浮层右上角提供「规则详情」链接，跳转交通规则页查看完整条款与航司差异。
- 选择后立即写入激活行程 `transportMode`，沿用既有 600ms 防抖保存；交通规则页的单选继续读取同一字段，两处保持同步。
- 宠物数据不可用时入口仍可选，只是不展示推荐结论；不引入替代宠物。
- 新增前端 Popover 封装与 `transportModeOptions` 纯函数（代表规则 + 判定），并补单测与 E2E。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-context`: 面板大交通标签升级为选择入口，定义浮层内容、推荐结论、详情链接与保存链路。
- `transport-rules-comparison-page`: 明确面板为等价选择入口，两处读取并更新同一个 `transportMode`。

## Impact

- 前端组件：新增 `apps/web/src/components/ui/popover.tsx`、`apps/web/src/components/trip/transport-mode-picker.tsx`；修改 `apps/web/src/components/trip/trip-panel.tsx`。
- 前端数据：新增 `apps/web/src/data/transport-mode-options.ts` 与单测，复用 `evaluateRuleForPet`。
- 测试：`e2e/rule-recommendation-and-selection.spec.ts` 新增面板选择、规则页回显、规则详情跳转与宠物数据失败降级用例。
- 规格：`openspec/specs/trip-context/spec.md`、`openspec/specs/transport-rules-comparison-page/spec.md`。
- 无后端接口、数据库迁移与依赖变更。
