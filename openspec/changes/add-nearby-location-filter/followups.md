# Follow-ups — add-nearby-location-filter

- change-id: `add-nearby-location-filter`
- change-summary present: no（continued with gaps；P5 归档尚未开始）
- timestamp: 2026-11-17T13:13:00+0800

## Tech debt

| id | title | why | evidence | owner | priority | links |
|---|---|---|---|---|---|---|
| TD-1 | 补恰好 5000m 的 API 过滤边界夹具 | 当前只测距离函数，未用恰好 5000m 候选验证“含边界” | `dov-ac-review.md` 残余风险；`docs/ai4se-plugins/20261117-130447-local-verify-report.md` W2 | SA/VL | med | REQ-012；`add-nearby-location-filter` |
| TD-2 | 补“景点页选择/清除锚点不改变景点列表”的 E2E | 该场景目前只有代码路径审查 | 本地验证报告 W3；`atdd-design.md` 未自动化表 | SA/VL | med | REQ-012 |
| TD-3 | 补“激活行程切换自动清空锚点”的 E2E | 仅覆盖锚点被移出行程，未覆盖行程切换 | 本地验证报告 W4 | SA/VL | med | REQ-012 |
| TD-4 | 补 `design.md` D6/D7 的备选方案说明 | consistency lint 记录为 WARNING | `consistency-lint.md` L1/L2 | SA | low | `add-nearby-location-filter` |
| TD-5 | 评估距离过滤内存计算的性能边界 | 单城单类型数百条可接受，增长后需下推或包围盒 | `design.md` Risks | SA | low | REQ-012 |

## Business backlog

| id | title | why | evidence | owner | priority | links |
|---|---|---|---|---|---|---|
| BZ-1 | UI 样式与筛选 chips（小型犬/大型犬/低押金/免清洁费/搜索） | REQ-012 明确暂缓 | `requirements/REQ-012-nearby-location-filter.md` Out；`proposal.md` Non-Goals | PO | unset | REQ-012 |
| BZ-2 | 一天多景点的距离聚合口径 | 上游 US-12 开放问题，当前只支持单锚点 | `requirements/REQ-012-nearby-location-filter.md`；`analysis/REQ-012/impact-brief.md` deferred | PO/SA | unset | issue #20 / US-12 |
| BZ-3 | 5km 半径是否可配置 | impact brief 记录为 deferred | `analysis/REQ-012/impact-brief.md` | PO | unset | REQ-012 |
| BZ-4 | 自动推荐餐厅/酒店与推荐理由 | 上游 US-12 范围，本 change 明确 Out | `proposal.md` Non-Goals | PO | unset | issue #20 / US-12 |

## Gaps

- `change-summary.md` 未生成：P5 归档尚未开始，本文件按“继续但标注缺口”处理。
- PR / CI / G2 / G3 尚未发生；本地验证报告 Overall 为 Partial。
- `unify-location-browsing` 已于 2026-11-17 随 origin/main 归档，归档顺序依赖已解除。

## Redirect — /sdd:evolve

- 无。若后续希望把“无 Key 地图占位 + 有 Key 人工验收”固化为 harness 模板，可在 evolve 阶段单独评估。

## Disclaimer

This file is not Living Spec authority. Do not auto-file tracker tickets unless the user explicitly asks and a project integration exists.
