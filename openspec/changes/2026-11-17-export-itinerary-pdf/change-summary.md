# Change summary — 2026-11-17-export-itinerary-pdf

- Change id: `2026-11-17-export-itinerary-pdf`
- 状态：实现与本地验证完成；未提交、未建 PR、未归档
- 分支：`feat/export-itinerary-pdf`（基于 `feat/trip-itinerary` `9f98d0a`，即 US-48 提交）

## Intent

交付 US-49（issue #23）的 AC-1「导出 PDF」：让用户把按天行程单带出应用，离线查看或转发给同行人。导出复用 US-48 的同一页面与 `buildItinerary` 保证内容一致，并在导出时补充页面上默认折叠或未常驻的详细信息：展开携宠政策、附加大交通携宠规则、去除浏览器默认页眉页脚。行程单页面本身保持原样，唯一新增为「导出 PDF」按钮。

AC-2 图片长图（1080px、按天分段）不在本次范围；天气/应急/食宿尚无数据源，导出不伪造缺失板块。

## What shipped

- 行程单头部「导出 PDF」按钮；点击后进入打印态渲染全部天、展开政策，双 `requestAnimationFrame` 后调用 `window.print()`，`afterprint` 复位。
- 打印专用「大交通携宠规则」卡：按 `transportMode` 读取 `getRuleForMode`，展示能否携带、体重/肩高、容器、流程、检疫证明与来源；`hidden print:flex` 保证页面不新增常驻板块。
- 打印样式：A4 14mm、`@page` 空页边距盒抑制 Chrome 默认页眉页脚（URL/日期/页码）、隐藏主导航/分段导航/Day Tabs/导出按钮/行程面板、卡片避免跨页、链接去色。
- 新增 E2E 断言：print 计数、两天内容、政策值未点击可见、规则卡内容、打印媒体隐藏外框、页面负向断言无规则板块。
- 无后端与依赖变更。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0 |
| 前端单测 | Pass | `npm test -w apps/web`：24 文件 191 项 |
| 受影响 E2E | Pass | `e2e/itinerary.spec.ts`：9 passed / 0 failed（42.0s） |
| 打印媒体结构验证 | Pass | E2E `emulateMedia({ media: "print" })`：规则卡可见、应用外框隐藏 |
| 浏览器页眉页脚抑制 | 实现，待真实打印确认 | `@page` 页边距盒（Chrome 131+）；headless 无法断言 |
| OpenSpec validate | Pass（本变更） | `openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid |
| G1 / G2 / G3 | 未签署 | 需需求方明确指示并实名后补记录 |
| 全量 E2E / CI | 未运行 | 待 PR 阶段补齐 |

## Residual risks / follow-ups

1. AC-2 图片长图导出未实现，US-49 不能据此关闭。
2. PDF 生成依赖浏览器打印对话框；页眉页脚抑制依赖 CSS 页面边距盒，不支持该特性的浏览器需手动关闭。
3. 飞机规则按代表航司展示，实际以承运航司与航线为准。
4. 天气（US-16）、应急（US-13）、食宿（US-12）与具体时间点未接入，导出内容暂不包含。
5. 归档顺序：先归档 `2026-11-17-add-trip-itinerary`，再归档本变更（同为 `trip-itinerary` 能力）。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/trip-itinerary/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
