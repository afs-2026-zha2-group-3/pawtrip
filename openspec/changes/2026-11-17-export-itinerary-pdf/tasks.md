# Tasks

## 1. 导出交互

- [x] 1.1 行程单页头部新增「导出 PDF」按钮（`apps/web/src/routes/_authenticated/itinerary.tsx`），仅在存在激活行程且行程单渲染时展示。
- [x] 1.2 新增 `printing` 状态：导出时渲染 `itinerary.days` 全部天，连续两次 `requestAnimationFrame` 后调用 `window.print()`。
- [x] 1.3 监听 `afterprint` 复位打印态，打印结束或取消后恢复只展示当前 `Day`；导出不修改行程数据与选中 Day。
- [x] 1.4 打印态把每个「详细携宠政策」以 `details open` 渲染，保证政策字段进入导出；页面常规状态仍默认折叠。

## 2. 打印样式与规则

- [x] 2.1 `apps/web/src/styles.css`：`@page` A4 14mm，定义 `@top-*`/`@bottom-*` 空页边距盒抑制 Chrome 默认页眉页脚；`[data-print-hidden]`、`print:break-inside-avoid` 与链接去色。
- [x] 2.2 根 header（`apps/web/src/routes/__root.tsx`）加 `print:hidden`；分段导航、Day Tabs、导出按钮使用 `print:hidden`；行程面板（`apps/web/src/components/trip/trip-panel.tsx`）加 `data-print-hidden`。
- [x] 2.3 新增打印专用「大交通携宠规则」卡：读取 `getRuleForMode(active.transportMode)`，展示能否携带、体重/肩高、容器、流程、检疫证明与来源；`hidden print:flex` 保证页面不新增常驻板块；飞机注明以实际承运方为准。

## 3. 测试

- [x] 3.1 `e2e/itinerary.spec.ts` 导出用例：stub `window.print` 计数；断言调用一次、两天标题、导出态未点击即可见 `8.5 kg`；打印媒体下规则卡含「大交通携宠规则 · 高铁」「≤15 kg」「《动物检疫合格证明》」，主导航/按天切换/导出按钮/行程面板隐藏。
- [x] 3.2 主用例负向断言：页面未导出时不出现「大交通携宠规则」区块，政策默认折叠。
- [x] 3.3 既有主用例补充「导出 PDF」按钮可见断言。

## 4. 规格同步

- [x] 4.1 新增 `specs/trip-itinerary/spec.md` delta：3 个新增需求（导出行程单为 PDF、导出详细政策与规则、打印输出隐藏外框）及 8 个 Scenario。
- [x] 4.2 proposal、design、ATDD、DoV、alignment、tasks 与 summary 落盘并按用户补充要求更新。

## 5. 验证

- [x] 5.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 5.2 `npm test -w apps/web`：24 文件 191 项通过。
- [x] 5.3 `e2e/itinerary.spec.ts`：9 passed / 0 failed（42.0s），含政策展开与打印规则卡；校验开发库未被修改。
- [x] 5.4 `npx --no-install openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid。

## Workflow follow-up

- 本次仅生成 SDD 与代码改动；尚未提交，未建 PR。
- 真实打印预览确认浏览器默认页眉页脚已被抑制（Chrome 131+）。
- PR 阶段补跑全量 E2E 与 CI。
- G1/G2/G3 需实名签署，本记录不代签。
- AC-2 图片长图导出需独立变更。
- 归档顺序：先 `2026-11-17-add-trip-itinerary`，再本变更。
