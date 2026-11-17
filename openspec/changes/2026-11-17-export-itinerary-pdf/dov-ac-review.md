# AC / DoV Review

变更：`2026-11-17-export-itinerary-pdf`

范围：核对 US-49（issue #23）验收口径、用户补充要求、Delta Spec、Design、Tasks 与已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 导出 PDF | Pass（实现范围） | E2E `exports all days through the print dialog`：点击后 `window.print` 调用一次，两天内容均渲染 | 用户经系统打印对话框「另存为 PDF」获得文件；未断言 PDF 字节 |
| AC-2 导出图片 | Not in scope | 本次按需求只交付 PDF；1080px 长图、按天分段未实现 | 需独立变更与依赖 |
| AC-3 内容一致性 | Pass（现有数据范围内） | 导出复用同一页面与 `buildItinerary`；E2E 两天标题与行程内容；主用例覆盖地点、交通段、政策、提醒 | 导出为页面内容的超集（政策展开 + 大交通规则），页面本身不变 |
| 补充要求：导出详细政策 | Pass | 导出态未点击折叠标题即可见 `8.5 kg`；打印媒体下仍可见 | 通过 `details open` 渲染，不再依赖 CSS 强制显示 |
| 补充要求：导出大交通规则 | Pass | 打印媒体下 `大交通携宠规则` region 含方式、`≤15 kg`、检疫证明 | 规则取自 `getRuleForMode`；仅打印输出展示 |
| 补充要求：去除 URL 页眉页脚 | 实现，待真实打印确认 | `@page` 定义空页边距盒抑制 Chrome 默认页眉页脚（Chrome 131+） | headless 无法断言；不支持的浏览器仍需在打印对话框手动关闭页眉页脚 |
| 补充要求：页面不变 | Pass | 主用例断言未导出时规则 region 数量为 0；政策点击前保持折叠 | 页面唯一新增为「导出 PDF」按钮 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、delta | 只增强导出；图片导出与未接入板块明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` D1–D5 | 打印方案、全量天数与展开、打印专用规则、页边距盒、数据只读均有决策 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 浏览器页眉页脚支持、分页、图片导出、内容不完整、飞机规则代表性 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0（2026-11-17） | — |
| DoV-5 前端单测 | Pass | `npm test -w apps/web`：24 文件 191 项通过（2026-11-17） | 含行程单模型 6 项 |
| DoV-6 受影响 E2E | Pass | `e2e/itinerary.spec.ts`：9 passed / 0 failed（42.0s，2026-11-17） | 含政策展开与打印规则卡断言；开发库未被修改 |
| DoV-7 打印媒体结构验证 | Pass | E2E `emulateMedia({ media: "print" })` | 规则卡可见；主导航/按天切换/导出按钮/行程面板隐藏 |
| DoV-8 规格校验 | Pass（本变更） | `npx --no-install openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid | 主规格未在本变更内变更 |

## Residual concerns

- AC-2 图片长图导出未实现，US-49 未完全关闭。
- 实际 PDF 生成依赖浏览器打印对话框；页眉页脚抑制依赖 CSS 页面边距盒（Chrome 131+），需真实打印预览确认。
- 天气（US-16）、应急（US-13）、食宿（US-12）与具体时间点未接入，导出内容暂不包含。
- 全量 E2E 与 CI 未在本变更上运行，PR 阶段补齐。
- 本次仅生成 SDD 与代码改动，未提交、未建 PR、未归档；G1/G2/G3 未签署。

## Review outcome

文档层 AC/DoV 检查为 **Pass（实现范围）**；AC-2 明确未覆盖，US-49 不可据此关闭。该结果不代表 Gate 已批准，也不代表 CI 已通过。
