# G2 decision — add-day-route-planning

- Gate: G2（Verify）
- Change id: `2026-11-18-add-day-route-planning`（REQ-016 行程单当天路线规划）
- Inputs:
  - local-verify: `docs/ai4se-plugins/20261118-140700-local-verify-report.md`（Overall **Pass**：tsc 无错 / vitest 313 / 后端 247 / 受影响 E2E 72；tasks 27/27，`openspec validate --strict` 通过）
  - pipeline ci: `docs/ai4se-plugins/20261118-140700-pipeline-report.md`；槽位副本 `openspec/changes/2026-11-18-add-day-route-planning/ci-report.md`（**Overall Pass，E1 全绿**：Browser E2E 15m46s / Web build 1m10s / Docs-only 4s 全成功；Server CI 因未改后端未触发，本地 247 补证）
  - pipeline cd: n/a（仓库无独立 CD 产品，CI 三工作流即门禁）
  - PR: #127（`feat/day-route-planning` → `main`，已合并 `2e8aff6`）
- Dimension results:
  - build: Pass（tsc 无类型错误；PR 内 Web build 成功）
  - scan: Pass（仓库无独立 secret-scan/SAST 作业，记为 n/a；`.env` 未跟踪未提交）
  - review: Pass（自审 + 规范对照；标注 HTML 经 `escapeHtml` 转义；只读不写库、不进导出）
  - evidence: Pass（27/27 任务 [x]，validate --strict 通过；proposal/design/atdd-design/alignment-self-check 全同步）
  - ci: Pass（PR #127 三检查全绿；E1 全绿）
  - cd: n/a
- Defect grades: CRITICAL 0 / WARNING 0 / SUGGESTION 0
- Decision: **Pass**
- Waivers / conditions + owners: 无。以下为已接受残余风险（不构成 Gate 条件）：
  1. CI 无真实高德 Key：E2E 用假 `window.AMap` + 后端空 `AMAP_API_KEY` 注入，保证确定性；真实路线仅本地冒烟覆盖（G1 知悉项，owner=IO）
  2. 快照时长与实时算路时长可能不一致：弹窗优先行程计划快照（G1 知悉项）
  3. 部署环境需通过 `.env` 配置高德三变量，前后端同步发布（G1 知悉项）
- Approvers: VL=**tantine**（用户本会话指定签署人）
- Timestamp: 2026-11-18

## 备注

- PR #127 在本记录签署前已由用户指示合并入 main；本记录为 evidence-first 的补录签署，引用证据均对应 PR head `68a7272`（合并提交 `2e8aff6`）。
- 证据链引用指向 `docs/ai4se-plugins/` 与 change 目录内持久化报告；不在此复制报告正文。

## Traceability appendix (optional)

| Requirement | Spec | Code | Test |
|-------------|------|------|------|
| 当天路线入口与弹窗 | `specs/trip-itinerary/spec.md`（MODIFIED） | `apps/web/src/routes/_authenticated/itinerary.tsx` / `components/trip/day-route-dialog.tsx` | `e2e/day-route-planning.spec.ts` E1–E3 |
| 详情坐标只读下发 | `specs/location-management/spec.md`（MODIFIED） | `LocationQueryService` / `LocationBrowseDetail` | `LocationQueryApiTest` + `e2e/day-route-planning.spec.ts` |
| 路网绘制与距离/时长标注 | `specs/trip-itinerary/spec.md` | `lib/trip/day-route.ts` / `components/trip/day-route-map.tsx` | `lib/trip/day-route.test.ts` + E2E 假 AMap 用例 |
| 序号+地点名标注 | `specs/trip-itinerary/spec.md` | `day-route-map.tsx`（`stopLabelContent` + `escapeHtml`） | E2E 标注断言 + 本地真实 Key 冒烟 |
| 降级与空态 | `specs/trip-itinerary/spec.md` | `DayRouteDialog` / `RouteFallback` | `e2e/day-route-planning.spec.ts` 缺 Key/缺坐标/单段失败用例 |
