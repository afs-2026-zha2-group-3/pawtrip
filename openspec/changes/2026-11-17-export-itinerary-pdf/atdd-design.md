# ATDD Design

变更：`2026-11-17-export-itinerary-pdf`

## ATDD layers in scope

### API 层

不新增或修改后端接口。导出为纯前端行为，不产生任何保存请求。

### Unit 层

无新增纯函数；既有 `apps/web/src/lib/trip/itinerary.test.ts` 的 6 项继续覆盖日期派生与时间线模型。打印态与政策展开属于浏览器/DOM 行为，不在单测中模拟。

### E2E 层

`e2e/itinerary.spec.ts` 使用真实行程数据，固定 `startDate` 为 2026-12-01、共 2 天、大交通为高铁，`window.print` 由测试替换为计数器：

| Scenario | 用例与断言 |
|---|---|
| 导出 PDF 包含全部天数与展开的政策 | `exports all days through the print dialog`：点击「导出 PDF」后断言 `window.print` 调用一次；两天标题可见；未点击折叠标题即可见首个地点的政策值 `8.5 kg` |
| 导出输出附带大交通携宠规则 | 导出后 `emulateMedia({ media: "print" })`，断言 `大交通携宠规则` region 包含「大交通携宠规则 · 高铁」「≤15 kg」「《动物检疫合格证明》」 |
| 页面不新增常驻规则板块 | 主用例在未导出时断言 `大交通携宠规则` region 数量为 0；政策在点击前保持折叠 |
| 打印输出隐藏应用外框与默认页眉页脚 | 同一导出用例打印媒体下断言主导航、`按天切换` tablist、导出按钮与 `trip-panel` 隐藏；默认页眉页脚无法在 headless 断言，需真实打印预览人工确认 |
| 取消打印恢复页面 | 依赖系统对话框，本次不自动化；由 `afterprint` 复位实现，人工验证 |
| 导出内容包含行程单全部信息 | 导出复用同一页面与 `buildItinerary`；主用例覆盖地点、交通段、政策与提醒，导出用例断言两天内容均渲染 |

## What is written before production code

本次为功能完成后补齐的 ATDD 记录。实现与测试同步落地，最终以 E2E 骨架验证用户可见行为：

1. `exports all days through the print dialog`：stub 打印、全量天数、政策展开、打印专用规则卡、打印媒体隐藏应用外框。
2. 主用例负向断言：页面不出现大交通规则板块，政策默认折叠。
3. 既有 `e2e/itinerary.spec.ts` 其余 8 条用例回归页面内容。

## Non-goals

- 不生成或断言真实 PDF 文件字节；文件由系统打印对话框输出。
- 不自动断言浏览器默认页眉页脚的视觉输出。
- 不覆盖图片长图导出（AC-2，未实现）。
- 不覆盖天气、应急、食宿与具体时间点（无数据源）。
