# Change summary — 2026-11-19-inline-day-route-panel

## Intent

把「查看当天路线规划」按钮打开的弹窗内容改为行程单页面右侧常驻面板：打开行程单即可对照当天地点与路线，切换 Day 即切换路线，滚动查看明细时地图仍在视野内；同时删除重复入口与弹窗。确认口径为宽屏（≥1024px）整页滚动 + 右栏吸顶，窄屏（<1024px）按「当天明细 → 面板 → 未排期」堆叠。

## What shipped

- 新增 `DayRoutePanel`（`apps/web/src/components/trip/day-route-panel.tsx`）：沿用 `buildDayRoute` 与 `day-route-map`，保留 `day-route-panel`/`day-route-empty`/`day-route-all-missing`/`day-route-single`/`route-marker`/`day-route-failure` 测试标识，面板 `print:hidden` 且不在图片导出容器内。
- 行程单完成态改为两栏网格：[itinerary.tsx](file:///C:/Users/TANTA6/.qoder/worktrees/app/c7147c/pawtrip/apps/web/src/routes/_authenticated/itinerary.tsx) 左列 `minmax(0,1fr)`、右栏 `26rem`，右栏 `lg:sticky lg:top-6 lg:self-start`；窄屏回到源码顺序堆叠。
- 删除「查看当天路线规划」按钮、`routeDialogOpen` 与 `DayRouteDialog` 组件；无隐藏入口。
- `PageFrame` 新增 `width="default" \| "wide"`，仅完成态行程单使用 `wide`（`lg:max-w-6xl`），其他页面宽度不变。
- Living Spec `trip-itinerary` 已合并：+2 ADDED、~4 MODIFIED、-2 REMOVED。
- PR #158 合并入 main（`25e7777`）；P4 证据与 G2 记录随归档保留在变更包。

## Verify highlights

- 本地：后端 272 / 前端 375 / tsc / build / 全量 E2E 111 全部通过；`openspec change validate --strict` valid。
- CI：合并后 main run 44490264902 全绿；PR run 44487412956 首次因 `packing-checklist` 既有竞态失败，重跑后全绿。
- G2：VL=TANTA6 签署 Pass（CRITICAL/WARNING/SUGGESTION 均为 0）。
- KB update: Skipped (not configured)——`scripts/kb-lint.sh` 为基线文档化的非阻塞 SKIP，未重新生成 `docs/knowledge/_INDEX.md`。

## Residual risks

- 真实高德 Key 下地图交互未目视；假 AMap 覆盖绘制/标记/折线/失败路径，缺 Key 降级有 E2E 断言。
- 1024px 断点两侧未单独出例，宽窄两侧均有用例。
- `packing-checklist.spec.ts` 存在既有偶发勾选竞态（非本变更引入）。
- `tsc --noEmit` 不在 CI 门禁；无独立 CD/部署工作流。

## Links

- 变更包（已归档）：`openspec/changes/archive/2026-11-19-inline-day-route-panel/`
- Proposal / Design / Tasks：同目录 `proposal.md`、`design.md`、`tasks.md`
- Delta Spec：`specs/trip-itinerary/spec.md`
- PR：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/158
- G2：`g2-decision.md`；CI：`ci-report.md`
- 本地验证：`docs/ai4se-plugins/20261119-165442-local-verify-report.md`
- 流水线：`docs/ai4se-plugins/20261119-165442-pipeline-report.md`
- Living Spec：`openspec/specs/trip-itinerary/spec.md`（「当天路线规划面板」）
