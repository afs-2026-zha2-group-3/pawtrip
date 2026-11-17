# Tasks

## 1. 导出交互

- [x] 1.1 行程单页头部新增「导出 PDF」与「导出图片」按钮（`apps/web/src/routes/_authenticated/itinerary.tsx`），仅在存在激活行程且行程单渲染时展示。
- [x] 1.2 新增 `printing` 状态：导出时渲染 `itinerary.days` 全部天，连续两次 `requestAnimationFrame` 后调用 `window.print()`。
- [x] 1.3 监听 `afterprint` 复位打印态，打印结束或取消后恢复只展示当前 `Day`；导出不修改行程数据与选中 Day。
- [x] 1.4 打印态把每个「详细携宠政策」以 `details open` 渲染，保证政策字段进入导出；页面常规状态仍默认折叠。

## 2. 打印样式与规则

- [x] 2.1 `apps/web/src/styles.css`：`@page` A4 14mm，定义 `@top-*`/`@bottom-*` 空页面边距盒（`content: ""`）抑制 Chrome 默认页眉页脚；`[data-print-hidden]`、`print:break-inside-avoid` 与链接去色。
- [x] 2.2 根 header（`apps/web/src/routes/__root.tsx`）加 `print:hidden`；分段导航、Day Tabs、导出按钮使用 `print:hidden`；行程面板（`apps/web/src/components/trip/trip-panel.tsx`）加 `data-print-hidden`。分段导航的 `print:hidden` 随 US-48 已在 `main`，本变更在 E2E 中验证。
- [x] 2.3 新增导出「大交通携宠规则」卡：读取 `getRuleForMode(active.transportMode)`，展示能否携带、体重/肩高、容器、流程、检疫证明与来源；PDF 用 `hidden print:flex`，图片导出以 `printOnly={false}` 直接渲染；飞机注明以实际承运方为准。

## 3. 测试

- [x] 3.1 `e2e/itinerary.spec.ts` 导出用例：stub `window.print` 计数；断言调用一次、两天标题、Day 不变、政策字段未点击可见、打印媒体下交通/提醒/未排期与负向板块、高铁规则完整字段、主导航/分段导航/按天切换/导出按钮/行程面板隐藏。
- [x] 3.2 主用例负向断言：页面未导出时不出现「大交通携宠规则」区块，政策默认折叠。
- [x] 3.3 既有主用例补充「导出 PDF」按钮可见断言。
- [x] 3.4 新增 `restores the single-day view after printing ends`：派发 `afterprint` 后恢复单天、默认折叠、按钮可见与选中 Day 不变。
- [x] 3.5 新增规则分支：飞机代表航司与无肩高、自驾无体重/肩高上限、无 `transportMode` 不渲染规则卡。

## 4. 规格同步

- [x] 4.1 新增 `specs/trip-itinerary/spec.md` delta：4 个新增需求（导出行程单为 PDF、导出详细政策与规则、打印输出隐藏外框、导出行程单为图片）及 12 个 Scenario。
- [x] 4.2 proposal、design、ATDD、DoV、alignment、tasks 与 summary 落盘并按用户补充要求更新。

## 5. 验证

- [x] 5.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过（重建后分支；含 `anchors.test.ts` 夹具修复）。
- [x] 5.2 `npm test -w apps/web`：28 文件 202 项通过。
- [x] 5.3 `e2e/itinerary.spec.ts`：15 passed / 0 failed（约 60s）；校验开发库未被修改。
- [x] 5.4 `npx --no-install openspec validate 2026-11-17-export-itinerary-pdf --strict`：valid。

## 6. 评审修复（2026-11-17）

- [x] 6.1 将分支重建到 `main` `ca7f96f`（US-48 已归档），本地提交 `4b73b9e`；剔除旧基线重复提交，并重新运行 tsc/单测/E2E。
- [x] 6.2 新增 `afterprint` E2E，覆盖「取消打印恢复页面」，不再只靠人工。
- [x] 6.3 导出用例补齐内容完整性与负向断言；规则卡补齐高铁完整字段、飞机代表航司、空值分支与无 `transportMode` 分支。
- [x] 6.4 `@page` 页面边距盒改为 `content: ""`。
- [x] 6.5 Design 改为「恢复政策默认折叠」；Proposal Impact 补 `trip-section-nav.tsx`，E2E 断言分段导航隐藏。
- [x] 6.6 Alignment 改为「Pass with pending manual evidence」，页眉页脚单列为 Pending；ATDD 标注回溯记录非 TDD 证据。
- [x] 6.7 修正 `anchors.test.ts` 既有夹具缺字段导致的 main 基线 `tsc` 失败。
- [ ] 6.8 真实 Chrome 打印预览人工记录（版本、页眉页脚开关、预览结果）；完成前页眉页脚保持 Pending。

## 7. 图片导出（AC-2）

- [x] 7.1 新增 `html-to-image@1.11.13` 依赖与 `apps/web/src/lib/trip/export-image.ts`：`toBlob` 固定 1080px 宽、`pixelRatio=1`、白底；文件名清洗与下载助手。
- [x] 7.2 在行程单页新增「导出图片」按钮与离屏导出视图：复用 PDF 的页头、规则卡、全部天数、展开政策与未排期；整张视图一次截图，不按天拆分。
- [x] 7.3 失败处理：捕获生成异常，提示「图片导出失败，请重试」，恢复按钮与页面状态；导出不改变选中 Day 或行程数据。
- [x] 7.4 测试：`export-image.test.ts` 文件名清洗；E2E 一次下载、PNG 签名、宽度 1080px、高度大于 1080px、失败提示与恢复。

## Workflow follow-up

- 分支已重建并本地提交 `4b73b9e`；图片导出、SDD 修复与夹具修正尚未提交，未推送、未建 PR。
- 真实打印预览确认浏览器默认页眉页脚已被抑制（Chrome 131+）。
- PR 阶段补跑全量 E2E 与 CI。
- G1/G2/G3 需实名签署，本记录不代签。
- 归档顺序：`2026-11-17-add-trip-itinerary` 已归档；本变更待 P5 完成后归档。
