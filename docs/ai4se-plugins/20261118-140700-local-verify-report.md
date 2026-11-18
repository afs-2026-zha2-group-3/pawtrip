# Local Verify Report: add-day-route-planning

**Date:** 2026-11-18 (timezone: +0800)
**Root:** C:/Users/TANTA6/.qoder/worktrees/app/68339d/pawtrip
**Scope:** local+evidence
**Change id:** `2026-11-18-add-day-route-planning`（REQ-016，PR #127）
**Verified commit:** `68a7272`（PR #127 head，已并入 main `2e8aff6`）

## Summary

| Dimension | Status |
|-----------|--------|
| Build / typecheck | Pass |
| Unit tests | Pass |
| Backend tests | Pass |
| E2E（受影响范围） | Pass |
| Static scan | Skipped（仓库未配置独立 SAST/secret scan） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass（tasks 27/27，`openspec validate --strict` 通过） |
| **Overall** | **Pass** |

**PR gate:** PR #127 已合并入 main（`2e8aff6`），CI 三检查全绿（见 `20261118-140700-pipeline-report.md`）。G2 由 VL 人工签署，本报告不自签。

## Local commands

| Command | Exit | Summary |
|---------|------|---------|
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 0 | 无类型错误（合并 main 后基线错误已消除） |
| `npm test -w apps/web -- --run` | 0 | **313 tests passed**（43 files） |
| `cd apps/server && ./mvnw -q test` | 0 | **247 tests passed**，0 failures / 0 errors（surefire 汇总） |
| `npm run test:e2e -- e2e/day-route-planning.spec.ts e2e/app-shell-layout.spec.ts e2e/itinerary.spec.ts e2e/trips-panel.spec.ts e2e/trip-planning-agent.spec.ts e2e/intra-city-transport.spec.ts` | 0 | **72 passed**（1.7m，8 workers，临时库 18080/3100） |
| CI Browser E2E（PR #127） | 0 | 全量 Playwright 通过（15m46s），见 pipeline report |

说明：本地命令在合并 main 后的 PR head `68a7272` 上执行，与 PR 合并结果（`2e8aff6`）代码内容一致。

## Code-review highlights

- 路线规划为纯前端只读能力：弹窗内由 `buildDayRoute` 组装停靠点与交通段，`day-route-map.tsx` 加载高德 JS 插件绘制折线与标注，不写库、不进 PDF/图片导出。
- 标注 content 使用 HTML 片段（序号徽标 + 地点名），`escapeHtml` 转义名称，避免注入。
- 降级路径完整：缺 Key → 「地图未配置」；全部缺坐标 → 提示文案；单段算路失败 → 保留其余路线并提示「路线获取失败」。
- E2E 空 Key 隔离：`scripts/run-e2e.mjs` 为后端注入 `AMAP_API_KEY: ""`，覆盖根目录 `.env`，并用假 `window.AMap` 夹具，保证 CI 不依赖外网与真实 Key。
- 两列行程卡片使用现有 `petCard*` 样式常量与站内贴纸资源，未引入新依赖。

## Residual risks

| # | Risk | Status |
|---|------|--------|
| 1 | CI 使用假 AMap 与空 Key，真实高德路线仅本地冒烟覆盖 | 已接受（G1 知悉项，owner=IO） |
| 2 | 快照时长与实时算路时长可能不一致，弹窗优先快照 | 已接受（G1 知悉项） |
| 3 | 真实 Key 通过 `.env` 注入，部署环境需同步配置 | 运维事项，不阻塞 |
