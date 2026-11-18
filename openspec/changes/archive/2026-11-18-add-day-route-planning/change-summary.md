# Change summary — add-day-route-planning

- Change: `2026-11-18-add-day-route-planning`（REQ-016 行程单当天路线规划）
- Status: P5 归档；G1 Pass、G2 Pass（VL=tantine）、G3 Pass（SA=SUKI）
- PR: #127 已合并入 main（`2e8aff6`）
- 分支: `feat/day-route-planning`

## Intent

在 `/itinerary` 每天标题行右侧提供「查看当天路线规划」，弹窗内用高德 JS 路线把当天停靠点连成折线，并标注序号、地点名、距离与时间；天气明确排除。功能完全只读，不写入行程计划，也不进入 PDF/图片导出。

## What shipped

- 后端：`GET /api/locations/{poiId}` 详情新增可空 `longitude`/`latitude` 只读字段（无迁移）。
- 前端纯函数：`lib/trip/day-route.ts` 组装当天停靠点与交通段（`walk`→Walking、`drive`/`self_drive`→Driving，同 `poiId` 不计段）。
- 弹窗：`day-route-dialog.tsx` + `day-route-map.tsx`，高德 JS API 2.0 绘制折线与标注；marker label 为「序号徽标 + 地点名」，名称经 `escapeHtml` 转义。
- 降级：缺 Key「地图未配置」、全部缺坐标提示、单段算路失败保留其余路线并提示「路线获取失败」、单点/空天文案。
- E2E 隔离：`scripts/run-e2e.mjs` 为后端注入空 `AMAP_API_KEY` 覆盖根目录 `.env`，配合假 `window.AMap` 夹具，保证 CI 确定性。
- 顺带变更：我的行程卡片改为两列紧凑布局；地图标注增加地点名称。

## Verify highlights

- 本地：tsc 无类型错误、vitest 313 passed、后端 247 passed、受影响 E2E 72 passed。
- CI（PR #127）：Browser E2E 15m46s、Web build 1m10s、Docs-only 4s 全成功，E1 全绿。
- OpenSpec：tasks 27/27，`openspec validate --strict` 通过。
- 报告：`docs/ai4se-plugins/20261118-140700-local-verify-report.md`、`docs/ai4se-plugins/20261118-140700-pipeline-report.md`。

## Residual risks

1. CI 不调用真实高德路线（假 AMap + 空 Key），真实 Key 仅本地冒烟覆盖。
2. 快照时长与实际算路时长可能不一致，弹窗优先快照。
3. 部署环境需配置高德三变量（`AMAP_API_KEY`、`VITE_AMAP_JS_KEY`、`VITE_AMAP_SECURITY_CODE`），前后端同步发布。

## Links

- 变更工件：`openspec/changes/archive/2026-11-18-add-day-route-planning/`（归档后路径）
- G1：`g1-decision.md`；G2：`g2-decision.md`
- KB update：Skipped（not configured）
