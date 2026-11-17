# G2 decision — add-intra-city-transport-estimate

- Gate: G2（Verify）
- Change id: `add-intra-city-transport-estimate`（REQ-011 途内交通推荐：打车/步行/驾车，含大交通自驾联动）
- Inputs:
  - local-verify: `docs/ai4se-plugins/20261117-133236-local-verify-report.md`（Overall **Pass**；V1–V8 通过，E1 Pass-local / E2 Pass / E3 Pending→本次由 pipeline 报告收口；Waiver N/A）
  - pipeline ci: `docs/ai4se-plugins/20261117-140958-pipeline-report.md`；E1 槽位副本 `openspec/changes/add-intra-city-transport-estimate/ci-report.md`（**Overall Pass，E1 全绿**）
  - pipeline cd: n/a（本仓库无独立 CD 产品，pipeline-iac 三条工作流即 CI 门禁；`phase=cd` 不在 recipe 要求内）
  - PR: #67（`feat/in-destination-transport-recommendation` → `main`，mergeStateStatus=CLEAN 时全绿）
- Dimension results:
  - build: Pass（`npm run build` exit 0）
  - scan: Pass（V1–V8 静态自查通过；仓库无独立 secret-scan/SAST 作业，记为 n/a 并列入残余风险）
  - review: Pass（自审 + 规范对照；1 条 SUGGESTION：AnimatedList reduced-motion 未完全禁用入场动画）
  - evidence: Pass（19/19 任务 [x]，validate --strict 通过；证据链 tasks/atdd-design/design/proposal 全同步）
  - ci: Pass（Server tests / Web build / Browser E2E 三工作流全绿，E1 全绿）
  - cd: n/a
- Defect grades: CRITICAL 0 / WARNING 0 / SUGGESTION 1（reduced-motion 入场动画，非阻塞，无归属阻塞项）
- Decision: **Pass**
- Waivers / conditions + owners: 无。以下为已接受残余风险（不构成 Gate 条件）：
  1. CI 无 AMAP Key：E2E 走 PUT 预置快照 + 种子坐标 NULL 失败路径确定性策略；真实 Key 仅本地冒烟覆盖（tasks 1.2 已记录，owner=IO/kitty）
  2. 合并 main（+17 提交，含 startDate/确认弹窗重构）后 E1 语义适配：E1 改验行程确认弹窗前置态，「草稿不生成段行」由 `trip-panel` 分支代码保持（tasks 6.1 如实记录）
  3. E10 拖拽前时间常量等待（1200ms/800ms）依赖 AnimatedList 动画时长常量，若动画参数调整需同步（跟踪项）
  4. GH E2E 运行时长为本地 2.8m 的 3.4 倍（9m34s），仍远低于超时阈值
- Approvers: VL=**tantine**（用户本会话指定签署人）
- Timestamp: 2026-11-17

## 备注

- 合并时序：用户在本记录签署前已明确指示合并 PR #67 并完成合并（merge commit）；本记录为 evidence-first 的补录签署，引用均为合并前后已归档的同一套证据（代码内容一致，合并方式不影响验证结论）。
- 证据链引用均指向 `docs/ai4se-plugins/` 与 change 目录内的持久化报告；不在此复制报告正文。
- 分支 tip 哈希不写入本记录（见 G2 Record Strategy），当前状态以 `git log origin/main` 为准。

## Traceability appendix (optional)

| Requirement | Spec | Code | Test |
|-------------|------|------|------|
| 途内交通估算 API（walk/drive） | `specs/trip-route-estimate/spec.md` | `RouteEstimatePort` / `AmapRouteEstimateAdapter` / `TripController GET /{tripId}/route-estimate` | `TripRouteEstimateApiTest`（A1–A4）+ 适配器 UT + tasks 1.2 真实 Key 冒烟 |
| 快照落库与 self_drive 枚举 | `specs/trip-planning/spec.md`（MODIFIED） | `TripPlan.TripStop` / `TripPlanValidator.parseStops` | `TripApiTest`（A5–A7） |
| 段行展示/选择/提示/自驾联动 | `specs/trip-context/spec.md`（8 需求 36 场景） | `trip-panel.tsx` / `transport-segments.ts` / `store.ts` / `day-policy.ts` | 前端 vitest（transport-segment/store-transport/day-policy 等，185 全绿）+ `e2e/intra-city-transport.spec.ts`（E1–E13，全量 128 绿） |
