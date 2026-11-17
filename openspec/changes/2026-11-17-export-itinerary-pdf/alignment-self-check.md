# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-export-itinerary-pdf`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | `specs/trip-itinerary/spec.md`、`design.md` | D1 打印方案、D2 全量天数与展开、D3 打印专用规则、D4 打印样式与页边距盒、D5 数据只读均有对应描述 |
| Spec → ATDD | Pass | `atdd-design.md` | 每个 Scenario 均映射到 E2E 用例或明确不自动化原因 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 交互、打印样式、规则卡、测试、规格与验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 3.1–3.3、5.1–5.4 | 导出用例、负向断言与回归验证 |
| AC-1 traceability | Pass | Spec `导出行程单为 PDF`；Tasks 1.1–1.4、2.1–2.3、3.1 | 入口、打印调用、全量天数、政策展开 |
| AC-3 traceability | Pass | Spec 导出内容 Scenario；Tasks 2.1、3.1 | 同一页面与模型；导出为页面超集 |
| 大交通规则 traceability | Pass | Spec 导出规则 Scenario；Tasks 1.4、2.3、3.1 | 打印专用规则卡与 E2E 断言 |
| 页面不变 traceability | Pass | Spec 页面不新增板块 Scenario；Tasks 2.3、3.2 | `hidden print:flex` 与负向断言 |
| AC-2 exclusion | Pass | `proposal.md` What Changes、`design.md` Non-Goals、`dov-ac-review.md` | 图片长图导出明确不在本次范围 |
| Task verifiability | Pass | `tasks.md` 5.1–5.4 | 每项含命令或可观察结果 |

## Scenario 级映射

| Requirement | Scenario | 证据 |
|---|---|---|
| 导出行程单为 PDF | 导出 PDF 包含全部天数 | E2E `exports all days through the print dialog`（print 计数 + 两天标题） |
| 导出行程单为 PDF | 取消打印恢复页面 | `afterprint` 复位；未自动化，人工验证 |
| 导出行程单为 PDF | 页面不新增常驻规则板块 | 主用例断言规则 region 数量为 0，政策默认折叠 |
| 导出输出包含详细政策与大交通规则 | 打印输出展开携宠政策 | 导出态未点击即可见 `8.5 kg` |
| 导出输出包含详细政策与大交通规则 | 导出输出附带大交通携宠规则 | 打印媒体下规则 region 含方式、`≤15 kg`、检疫证明 |
| 导出输出包含详细政策与大交通规则 | 导出内容包含行程单全部信息 | 同一页面渲染；主用例 + 导出用例两天内容 |
| 打印输出隐藏应用外框 | 打印输出隐藏应用外框 | 打印媒体负向断言主导航/按天切换/导出按钮/行程面板 |
| 打印输出隐藏应用外框 | 打印输出不含浏览器默认页眉页脚 | 页边距盒实现；headless 未断言，人工确认 |

## Gaps / residual risks

- AC-2 图片长图导出未实现，US-49 不能标记为完全完成。
- 浏览器默认页眉页脚抑制依赖 CSS 页面边距盒；headless 未断言，需真实打印预览确认。
- PDF 输出由浏览器打印对话框生成，未做跨浏览器一致性验证。
- 天气/应急/食宿未接入，属于已记录依赖缺口。
- 归档顺序：先归档 `2026-11-17-add-trip-itinerary`（创建 `trip-itinerary` 能力），再归档本变更；两者均修改同一能力。

## Outcome

**Pass（计划层）**：Spec、Design、ATDD 与 Tasks 在 Scenario 级一致。该结果不代表 Gate 决策，也不代表 CI 已通过。
