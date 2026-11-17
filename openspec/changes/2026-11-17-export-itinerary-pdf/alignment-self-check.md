# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-export-itinerary-pdf`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | `specs/trip-itinerary/spec.md`、`design.md` | D1 打印方案、D2 全量天数与展开、D3 打印专用规则、D4 打印样式与页边距盒、D5 数据只读均有对应描述 |
| Spec → ATDD | Pass with pending manual evidence | `atdd-design.md` | 每个 Scenario 均映射到 E2E；页眉页脚为人工待验项，未与自动化 Pass 混记 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 交互、打印样式、规则卡、测试、规格与验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.3、5.1–5.4 | 导出用例、负向断言与回归验证 |
| AC-1 traceability | Pass | Spec `导出行程单为 PDF`；Tasks 1.1–1.4、2.1–2.3、3.1 | 入口、打印调用、全量天数、政策展开 |
| AC-2 traceability | Pass | Spec `导出行程单为图片`；Tasks 7.1–7.4；E2E `exports the full itinerary as one PNG`、`shows an error when image generation fails` | 复用 PDF 同一导出视图，不按天拆分 |
| AC-3 traceability | Pass | Spec 导出内容 Scenario；Tasks 2.1、3.1 | 同一页面与模型；导出为页面超集 |
| 大交通规则 traceability | Pass | Spec 导出规则 Scenario；Tasks 1.4、2.3、3.1 | 打印专用规则卡与 E2E 断言 |
| 页面不变 traceability | Pass | Spec 页面不新增板块 Scenario；Tasks 2.3、3.2 | `hidden print:flex` 与负向断言 |
| AC-2 scope | Pass | Spec 独立需求「导出行程单为图片」；Tasks 7.1–7.4 | 与 PDF 共用导出视图，不按天拆分 |
| Task verifiability | Pass | `tasks.md` 5.1–5.4、6.1–6.8 | 每项含命令或可观察结果；6.8 为人工待验 |

## Scenario 级映射

| Requirement | Scenario | 证据 |
|---|---|---|
| 导出行程单为 PDF | 导出 PDF 包含全部天数 | E2E `exports all days through the print dialog`（print 计数 + 两天标题 + Day 不变） |
| 导出行程单为 PDF | 取消打印恢复页面 | E2E `restores the single-day view after printing ends`（`afterprint` 复位） |
| 导出行程单为 PDF | 页面不新增常驻规则板块 | 主用例断言规则 region 数量为 0，政策默认折叠 |
| 导出输出包含详细政策与大交通规则 | 打印输出展开携宠政策 | 导出态未点击即可见 `8.5 kg`、`不需要`、`10.5 元 / 只 / 次` |
| 导出输出包含详细政策与大交通规则 | 导出输出附带大交通携宠规则 | 打印媒体下断言高铁规则完整字段（方式、摘要、体重、肩高、容器、流程、检疫、来源、复核日期、免责） |
| 导出输出包含详细政策与大交通规则 | 导出内容包含行程单全部信息 | 打印媒体下断言地点、交通、提醒、未排期与负向板块 |
| 导出输出包含详细政策与大交通规则 | 飞机规则按代表航司展示 | E2E `shows representative airline rules for flights` |
| 导出输出包含详细政策与大交通规则 | 无大交通方式不展示规则卡 | E2E `exports without a transport rule when no transport mode is set` |
| 打印输出隐藏应用外框 | 打印输出隐藏应用外框 | 打印媒体负向断言主导航/分段导航/按天切换/导出按钮/行程面板 |
| 打印输出隐藏应用外框 | 打印输出不含浏览器默认页眉页脚 | 页边距盒实现；**Manual pending**，未记录真实 Chrome 打印预览 |
| 导出行程单为图片 | 导出图片生成整张行程单长图 | E2E `exports the full itinerary as one PNG`（一次下载、PNG、1080px 宽、长图） |
| 导出行程单为图片 | 图片导出失败 | E2E `shows an error when image generation fails` |

## Gaps / residual risks

- 图片导出依赖 `html-to-image` 的 SVG/foreignObject 渲染；超大 DOM 可能受 data URI 限制，当前 7 天内行程可控。
- 浏览器默认页眉页脚抑制依赖 CSS 页面边距盒；headless 未断言，真实打印预览仍为 Pending。
- PDF 输出由浏览器打印对话框生成，未做跨浏览器一致性验证。
- 天气/应急/食宿未接入，属于已记录依赖缺口。
- 分支已基于 `main` `ca7f96f` 重建并本地提交 `4b73b9e`；图片导出与文档修复尚未提交；未推送、未建 PR、未跑 PR CI。
- 归档顺序：`2026-11-17-add-trip-itinerary` 已归档；本变更待 P5 完成后归档。

## Outcome

**Pass（计划层，带人工待验项）**：Spec、Design、ATDD 与 Tasks 在 Scenario 级一致；页眉页脚真实打印预览未完成前不计 Pass。该结果不代表 Gate 决策，也不代表 CI 已通过。
