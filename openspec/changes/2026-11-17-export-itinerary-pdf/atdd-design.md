# ATDD Design

变更：`2026-11-17-export-itinerary-pdf`

性质：本记录为 P3 计划工件；若实际落盘晚于实现，则属于回溯记录，只用于对齐 Scenario 与最终 E2E，不作为 TDD 证据。

## ATDD layers in scope

### API 层

不新增或修改后端接口。导出为纯前端行为，不产生任何保存请求。

### Unit 层

`apps/web/src/lib/trip/export-image.test.ts` 覆盖图片文件名清洗与空名称回退。既有 `apps/web/src/lib/trip/itinerary.test.ts` 的 6 项继续覆盖日期派生与时间线模型。打印态、政策展开与 DOM 截图属于浏览器行为，不在单测中模拟。

### E2E 层

`e2e/itinerary.spec.ts` 使用真实行程数据，固定 `startDate` 为 2026-12-01、共 2 天；主用例大交通为高铁，另覆盖飞机、自驾与无大交通方式分支；`window.print` 由测试替换为计数器：

| Scenario | 用例与断言 |
|---|---|
| 导出 PDF 包含全部天数 | `exports all days through the print dialog`：点击后 `window.print` 调用一次；两天标题可见；当前 Day 不变 |
| 导出内容包含行程单全部信息 | 同一导出用例打印媒体下断言地点、交通段、政策取值、当天提醒、未排期，以及无天气/应急/食宿/具体时间点 |
| 打印输出展开携宠政策 | 未点击折叠标题即可见 `8.5 kg`、`不需要`、`10.5 元 / 只 / 次` |
| 导出输出附带大交通携宠规则（高铁） | 打印媒体下断言方式、允许摘要、体重 `≤15 kg`、肩高 `≤40 cm`、容器、流程、检疫证明、来源、复核日期与「以承运方最新规则为准」 |
| 飞机规则按代表航司展示 | `shows representative airline rules for flights`：标题含「飞机（中国国际航空）」，展示体重 `≤32 kg`，注明按代表航司与承运方最新规则，无肩高字段 |
| 无限制字段分支 | `omits numeric limits when the transport rule has none`：自驾展示「体重限制」且不展示体重/肩高上限 |
| 无大交通方式不展示规则卡 | `exports without a transport rule when no transport mode is set`：规则 region 数量为 0，其余内容仍导出 |
| 取消打印恢复页面 | `restores the single-day view after printing ends`：派发 `afterprint` 后回到 Day 1、政策默认折叠、按钮可见、选中 Day 不变 |
| 页面不新增常驻规则板块 | 主用例在未导出时断言规则 region 数量为 0；政策点击前保持折叠 |
| 打印输出隐藏应用外框 | 同一导出用例打印媒体下断言主导航、分段导航、`按天切换` tablist、导出按钮与 `trip-panel` 隐藏 |
| 打印输出不含浏览器默认页眉页脚 | 无法在 headless 断言；待真实 Chrome 打印预览人工记录，当前 Pending |
| 导出图片生成整张行程单长图 | `exports the full itinerary as one PNG`：捕获一次下载，校验文件名 `{行程名}-行程单.png`、PNG 签名、宽度 1080px、高度大于 1080px；导出后按钮恢复、Day 不变 |
| 图片导出失败 | `shows an error when image generation fails`：覆写 `canvas.toBlob` 返回 `null`，断言提示「图片导出失败，请重试」、按钮可用、Day 不变 |

## What is written before production code

本记录为 P3 计划工件，不是 TDD 证据。若落盘晚于实现（补录），只用于对齐 Spec/Design/Tasks 与最终 E2E 覆盖，不得表述为「先写测试再实现」。

1. `exports all days through the print dialog`：stub 打印、全量天数、政策展开、内容完整性、打印专用规则卡、打印媒体隐藏应用外框。
2. `restores the single-day view after printing ends`：`afterprint` 事件复位。
3. `shows representative airline rules for flights`、`omits numeric limits when the transport rule has none`、`exports without a transport rule when no transport mode is set`：规则字段与空值分支。
4. `exports the full itinerary as one PNG`、`shows an error when image generation fails`：图片导出与失败恢复。
5. 主用例负向断言：页面不出现大交通规则板块，政策默认折叠。
6. 既有 `e2e/itinerary.spec.ts` 其余 8 条用例回归页面内容。

## Non-goals

- 不生成或断言真实 PDF 文件字节；文件由系统打印对话框输出。
- 不自动断言浏览器默认页眉页脚的视觉输出；该项为人工待验证据，完成前不计 Pass。
- 不按天拆分图片文件；图片导出复用 PDF 的同一整份导出视图。
- 不覆盖天气、应急、食宿与具体时间点（无数据源）。
