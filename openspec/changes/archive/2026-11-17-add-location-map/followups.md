# Follow-ups — add-location-map

- change-id: `add-location-map`
- change-summary present: no（continued with gaps；P5 归档尚未开始）
- timestamp: 2026-11-17T13:13:00+0800

## Tech debt

| id | title | why | evidence | owner | priority | links |
|---|---|---|---|---|---|---|
| TD-1 | 抽离 `escapeHtml` 并补纯函数单测 | InfoWindow HTML 转义当前只在组件内，未被单测覆盖 | 本地验证报告 S4；`-location-map.tsx` | SA/VL | low | REQ-012；`add-location-map` |
| TD-2 | 补 mock `window.AMap` 的组件测试 | marker 联动、卡片定位、筛选刷新与错误分支目前无自动化 | 本地验证报告 W1；`atdd-design.md` Manual/审查项 | SA/VL | med | REQ-012 |
| TD-3 | 引入地图专用轻量点位接口或聚合 | 当前按 `pageSize=100` 循环取完所有分页，请求数随数据增长 | `design.md` Risks；本地验证报告 S2 | SA | low | `add-location-map` |
| TD-4 | 补 `design.md` D1、D3–D5 的备选方案说明 | consistency lint 记录为 WARNING | `consistency-lint.md` L1 | SA | low | `add-location-map` |
| TD-5 | 生产环境改用 `serviceHost` 代理安全密钥 | 当前安全密钥直连前端 bundle | `design.md` Open Questions；本地验证报告 S1 | SA | high | REQ-012 |
| TD-6 | 减少 V25 对“同名真实 POI”的依赖 | 找不到同名记录时卡片缺少照片/评分 | `proposal.md`；本地验证报告 S3 | SA | low | `add-location-map` |

## Business backlog

| id | title | why | evidence | owner | priority | links |
|---|---|---|---|---|---|---|
| BZ-1 | 押金/清洁费与宠物设施字段及展示 | 当前数据模型无字段，本期明确不展示、不伪造 | `design.md` Non-Goals/Open Questions；`proposal.md` Non-Goals | PO | unset | REQ-012 |
| BZ-2 | 地图样式精修、聚合、路线、定位与导航 | 本期只保证功能主链 | `design.md` Non-Goals | PO | unset | `add-location-map` |
| BZ-3 | 地图详情卡片的照片/评分正式数据维护 | 当前依赖 V25 关联与现有 JSON 摘要 | `design.md` D6 | PO/SA | unset | REQ-012 |

## Gaps

- `change-summary.md` 未生成：P5 归档尚未开始。
- `tasks.md` 6.5 未闭环（重启后端确认照片/评分）。
- PR / CI / G2 / G3 尚未发生；本地验证报告 Overall 为 Partial。

## Redirect — /sdd:evolve

- 无。若后续要把“真实地图人工验收清单”纳入 harness 模板，可在 evolve 阶段单独评估。

## Disclaimer

This file is not Living Spec authority. Do not auto-file tracker tickets unless the user explicitly asks and a project integration exists.
