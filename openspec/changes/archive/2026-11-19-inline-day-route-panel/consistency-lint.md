# Consistency Lint — 2026-11-19-inline-day-route-panel

日期：2026-11-19
范围：`proposal.md`、`specs/trip-itinerary/spec.md`、`design.md`、`tasks.md`、`dov-ac-review.md`、P1 REQ-021 与 `analysis/REQ-021/{impact-brief,deep-dive}.md`。

| 检查项 | 结果 | 证据 / 说明 |
|---|---|---|
| 布局口径一致 | Pass | Proposal、Delta「当天路线规划面板」、Design D1、P1 需求 Constraints 均为整页滚动 + 右栏吸顶 |
| 断点一致 | Pass | Delta、Design D1/D6、P1 需求均为 1024px（`lg`） |
| 窄屏顺序一致 | Pass | Delta 场景「窄屏堆叠到行程单下方」、Design D1/D6、P1 AC-5 均为当天明细 → 面板 → 未排期 |
| 默认天一致 | Pass | Delta 场景、Design D4、P1 OQ-4 均为与 `selectedDay` 一致，默认 `Day 1` |
| 入口移除一致 | Pass | Proposal、Delta 正文、Design D4、Tasks 3.1–3.2 均删除按钮、状态与组件 |
| 面板内容一致 | Pass | Delta「当天路线绘制」「降级」「空态」、Design D3、P1 AC-6 均沿用现弹窗分支与文案 |
| 文案来源一致 | Pass | Design D3、Tasks 2.2、P1 Constraints 均要求逐字复用 `lib/trip/day-route.ts` |
| 测试标识一致 | Pass | Design D3、Tasks 2.2、P1 Constraints：容器 `day-route-panel`；地图与降级标识保留 |
| 导出边界一致 | Pass | Delta「导出不包含路线面板」、Design D5、P1 AC-7 均排除 PDF 与图片 |
| 打印态一致 | Pass | Delta 正文、Design D5、P1 Context 均保留 `printing` 展开全部 `DayDetail` |
| 容器加宽范围一致 | Pass | Proposal、Design D2、P1 OQ-6 均为仅行程单启用，其他页面默认 `max-w-3xl` |
| REQ-020 回退原因规避 | Pass | Design D1、P1 方案取舍均明确禁止「两列一屏 + 左列内滚」，沿用整页滚动 |
| 淡奶黄描边保留 | Pass | Proposal、Design D1、P1 Constraints、Tasks 1.2 均保留 `border-2 border-paw-accent-soft` 与无阴影 |
| 数据与后端边界 | Pass | Proposal Impact、Design D4、P1 AC-8 均为无接口/字段/迁移、无新查询 |
| Living Spec 修改面一致 | Pass | Proposal Capabilities 与 Delta 一致：2 REMOVED + 2 ADDED + 4 MODIFIED |
| MODIFIED 场景保留 | Pass | 「当天路线绘制」「降级」「携带清单」两组均保留 Living Spec 原场景名，仅更新「弹窗」→「面板」表述 |
| 需求命名迁移方式 | Pass | 因原场景名均含「弹窗」且行为已改变，采用 REMOVED（含 Reason/Migration）+ ADDED，而非 RENAMED + MODIFIED；`validate --strict` 通过 |
| 携带清单表述清理 | Pass | 移除「与查看当天路线规划同层」与「复用路线规划交互形态」，行为不变 |
| E2E 更新范围一致 | Pass | Design D7、Tasks 4.1–4.4、`dov-ac-review.md` Residual 覆盖同一 spec 与回归集 |
| E2E 数量约束一致 | Pass | P1 Constraints、Design D7、Tasks 头部均为新增/保留总数 ≤30 |
| Tasks 与 Design 对齐 | Pass | 4 组 17 项覆盖容器、面板、接线与测试；每项含验证点 |

结论：0 BLOCKER / 0 WARNING；1 项提示——P4 需以真实浏览器确认 sticky 内高德地图尺寸与拖拽（已记入 design 风险与 dov-ac-review Residual concerns）。
