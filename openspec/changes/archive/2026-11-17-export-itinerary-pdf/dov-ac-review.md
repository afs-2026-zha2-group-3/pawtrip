# AC / DoV Review

变更：`2026-11-17-export-itinerary-pdf`

范围：核对 US-49（issue #23）验收口径、用户补充要求、Delta Spec、Design、Tasks 与已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 导出 PDF | Pass（实现范围） | E2E `exports all days through the print dialog`：`window.print` 调用一次，两天内容均渲染；`restores the single-day view after printing ends`：`afterprint` 后恢复单天与默认折叠 | 用户经系统打印对话框「另存为 PDF」获得文件；未断言 PDF 字节 |
| AC-2 导出图片 | Pass | `exports the full itinerary as one PNG`：一次下载、PNG 签名、宽度 1080px、高度大于 1080px；失败用例断言提示与恢复 | 复用 PDF 的同一导出视图，不按天拆分 |
| AC-3 内容一致性 | Pass（现有数据范围内） | 导出用例打印媒体下断言地点、交通段、政策取值、当天提醒、未排期，并负向断言无天气/应急/食宿/具体时间点；图片复用同一 `DayDetail` 与规则卡 | 导出为页面内容的超集（政策展开 + 大交通规则），页面本身不变 |
| 补充要求：导出详细政策 | Pass | 导出态未点击折叠标题即可见 `8.5 kg`、`不需要`、`10.5 元 / 只 / 次` | 通过 `details open` 渲染，不再依赖 CSS 强制显示 |
| 补充要求：导出大交通规则 | Pass | 高铁完整字段；飞机代表航司与无肩高；自驾无体重/肩高上限；无 `transportMode` 不渲染规则卡 | 规则取自 `getRuleForMode`；仅打印输出展示 |
| 补充要求：去除 URL 页眉页脚 | Pending（人工） | `@page` 定义空页边距盒（Chrome 131+）；headless 无法断言 | 尚未记录真实 Chrome 版本与页眉页脚开关状态，完成前不计 Pass |
| 补充要求：页面不变 | Pass | 主用例断言未导出时规则 region 数量为 0；政策点击前保持折叠 | 页面唯一新增为「导出 PDF」按钮 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、delta | PDF 与图片导出均在范围内；未接入板块明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` D1–D6 | 打印方案、全量天数与展开、规则卡、页边距盒、数据只读、图片导出均有决策 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 浏览器页眉页脚支持、分页、图片 DOM 体积、图片 CORS、内容不完整、飞机规则代表性 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0（2026-11-17，重建后分支） | 同步修正 `anchors.test.ts` 既有夹具缺字段导致的 main 基线 `tsc` 失败 |
| DoV-5 前端单测 | Pass | `npm test -w apps/web`：28 文件 202 项通过（2026-11-17，重建后分支） | 含行程单模型、规则匹配与图片文件名 |
| DoV-6 受影响 E2E | Pass | `e2e/itinerary.spec.ts`：15 passed / 0 failed（约 60s，2026-11-17） | 新增恢复、内容完整性、规则字段与空值分支、图片导出与失败 |
| DoV-7 打印媒体结构验证 | Partial（自动化部分） | E2E `emulateMedia({ media: "print" })` | 规则卡、内容与隐藏外框已断言；真实页眉页脚待人工 |
| DoV-8 规格校验 | Pass（本变更） | `npx --no-install openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid | 主规格未在本变更内变更 |
| DoV-9 真实打印预览 | Pending | 未执行 | 需记录 Chrome 版本、页眉页脚开关状态与预览截图；完成前不计 Pass |

## Residual concerns

- 实际 PDF 生成依赖浏览器打印对话框；页眉页脚抑制依赖 CSS 页面边距盒（Chrome 131+），真实打印预览仍为 Pending。
- 图片导出依赖 `html-to-image` 的 SVG/foreignObject 渲染；超大 DOM 可能受 data URI 限制，当前单城市 7 天内行程可控。
- 天气（US-16）、应急（US-13）、食宿（US-12）与具体时间点未接入，导出内容暂不包含。
- 分支已基于 `main` `ca7f96f` 重建并本地提交 `4b73b9e`；图片导出与文档修复尚未提交；未推送、未建 PR、未运行 PR CI、未归档。
- G1/G2/G3 未签署。
- `anchors.test.ts` 夹具修正属于 main 既有 `tsc` 失败，已随本变更一起修复。

## Review outcome

文档层 AC/DoV 检查为 **Pass（实现范围，带人工待验项）**；AC-1/AC-2 已有自动化证据，AC-3 在现有数据范围内一致。页眉页脚与真实打印预览完成前不记为 Pass；该结果不代表 Gate 已批准，也不代表 CI 已通过。
