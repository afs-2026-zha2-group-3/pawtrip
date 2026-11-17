# Change summary — 2026-11-17-export-itinerary-pdf

- Change id: `2026-11-17-export-itinerary-pdf`
- 状态：实现、两次 main 同步、本地+CI 验证完成；PR #93 已合入 main（`bfadb49`）；G2 补记 Conditional Pass（6.8 Waiver，tantine，2026-11-24）；本次 P5 归档
- 分支：`feat/export-itinerary-pdf`（重建自 `main` `ca7f96f`）→ 并入 `feat/city-personalized-recommendation`（与 REQ-014 同分支交付，PR #93）

## Intent

交付 US-49（issue #23）的 AC-1「导出 PDF」与 AC-2「导出图片」：让用户把按天行程单带出应用，离线查看或转发给同行人。导出复用 US-48 的同一页面与 `buildItinerary` 保证内容一致，并在导出时补充页面上默认折叠或未常驻的详细信息：展开携宠政策、附加大交通携宠规则、去除应用外框。图片导出复用 PDF 的同一导出视图，生成一张 PNG 长图，不按天拆分。行程单页面本身保持原样，唯一新增为两个导出按钮。

天气/应急/食宿尚无数据源，导出不伪造缺失板块。

## What shipped

- 行程单头部「导出 PDF」与「导出图片」按钮；PDF 进入打印态渲染全部天、展开政策，双 `requestAnimationFrame` 后调用 `window.print()`，`afterprint` 复位。
- 图片导出复用同一离屏导出视图（页头、规则卡、全部天、展开政策、未排期），用 `html-to-image@1.11.13` 生成一张 1080px 宽 PNG，文件名 `{行程名}-行程单.png`；失败提示并恢复页面。
- 大交通规则卡：按 `transportMode` 读取 `getRuleForMode`，展示能否携带、体重/肩高、容器、流程、检疫证明与来源；无方式时不渲染，PDF 用 `hidden print:flex`，图片导出直接渲染。
- 打印样式：A4 14mm、`@page` 空页面边距盒（`content: ""`）抑制 Chrome 默认页眉页脚、隐藏主导航/分段导航/Day Tabs/导出按钮/行程面板、卡片避免跨页、链接去色。
- E2E 覆盖导出全量内容、打印媒体隐藏外框、`afterprint` 恢复、高铁/飞机/自驾/无方式规则分支、图片整图导出与失败、政策与未排期内容、负向板块断言。
- 新增 `imageFileName` 单测；修复 `anchors.test.ts` 既有夹具缺字段导致的 `tsc` 失败；无后端变更。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0（重建后分支；含 `anchors.test.ts` 夹具修复） |
| 前端单测 | Pass | `npm test -w apps/web`：28 文件 202 项 |
| 受影响 E2E | Pass | `e2e/itinerary.spec.ts`：15 passed / 0 failed（约 60s） |
| 图片导出 | Pass | E2E：一次下载、PNG 签名、宽度 1080px、高度大于 1080px；失败分支提示并恢复 |
| 打印媒体结构验证 | Pass（自动化部分） | `emulateMedia({ media: "print" })`：规则卡完整字段、内容完整性与应用外框隐藏 |
| 浏览器页眉页脚抑制 | Pending（人工，Waiver 覆盖） | `@page` 页边距盒（Chrome 131+）；6.8 真实 Chrome 记录由 tantine 于 2026-11-24 前补齐 |
| OpenSpec validate | Pass（本变更） | `openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid |
| 全量回归（第二次 main 同步后） | Pass | build exit 0；后端 243/243；vitest 211/211；E2E 全量 173 passed / 0 failed |
| G1 / G2 / G3 | G1 未单独落盘（用户直接指示实现）；G2 补记 Conditional Pass（VL=tantine）；G3 见归档目录 | g2-decision.md / g3-decision.md |
| PR CI | Pass | PR #93 @ `8dbdd40`：Web/Server/E2E 三 workflow success；E1 ✅全绿（ci-report.md） |

## P1–P5 状态

- P1 proposal：完成。
- P2 specs / design / DoV / alignment：完成；G1 未签。
- P3 ATDD / tasks：完成；ATDD 若为补录，仅作对齐记录，不作为 TDD 证据。
- P4 实现与本地验证：完成；tsc、单测 28/202、E2E 15/15 均通过；页眉页脚真实打印预览仍为 Pending。
- P5：PR #93 合入 main（`bfadb49`，含 REQ-014 同分支）；CI 证据 PR #94 合入（`c03f536`）；G2 补记 Conditional Pass；本次归档（G3 Conditional Pass，SA=SUKI）。6.8 人工记录义务随 Waiver 存续至 2026-11-24。

## Residual risks / follow-ups

1. PDF 生成依赖浏览器打印对话框；页眉页脚抑制依赖 CSS 页面边距盒，真实 Chrome 打印预览仍需人工记录。
2. 图片导出依赖 `html-to-image` 的 SVG/foreignObject 渲染；超大 DOM 可能受 data URI 限制，当前 7 天内行程可控。
3. 飞机规则按代表航司展示，实际以承运航司与航线为准。
4. 天气（US-16）、应急（US-13）、食宿（US-12）与具体时间点未接入，导出内容暂不包含。
5. 归档顺序：`2026-11-17-add-trip-itinerary` 已归档；本变更与 REQ-014 无 capability 依赖，本次 P5 一并归档。
6. 6.8 真实 Chrome 打印预览记录：tantine，2026-11-24 前（Waiver 条件，逾期未补需重新评估导出 PDF 验收）。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/trip-itinerary/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
- G2: `g2-decision.md`（补记）
- CI 证据: `ci-report.md`
- 验证报告：`docs/ai4se-plugins/20261117-223134-local-verify-report.md`、`20261117-230517-pipeline-report.md`
