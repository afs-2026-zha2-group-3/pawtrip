# G2 decision — 2026-11-19-inline-day-route-panel

- Gate: G2（Verify）
- Change id: `2026-11-19-inline-day-route-panel`（REQ-021 行程单右侧常驻当天路线规划）
- Inputs:
  - local-verify: `docs/ai4se-plugins/20261119-165442-local-verify-report.md`（**Overall Pass**：后端 272 / 前端 375 / tsc / build / 全量 E2E 111 / `validate --strict`）
  - pipeline ci: `docs/ai4se-plugins/20261119-165442-pipeline-report.md`；change 内槽位 `openspec/changes/2026-11-19-inline-day-route-panel/ci-report.md`（**Overall Pass，E1 全绿**：PR run 44487412956 重跑后全绿 + 合并后 main run 44490264902 全绿）
  - pipeline cd: n/a（仓库无独立部署/CD 工作流）
  - PR: #158（head `ca4186fa6d3ad603385f2db7aa56d3ee980e4435`，merge commit `25e777794fbb09eafc7793ea37e88be9d1f71870`，merged 2026-11-19T08:45:05Z）
- Dimension results:
  - build: Pass（后端 272 / vitest 375 / tsc / build 全部成功）
  - scan: Skipped / n/a（无独立 scan 作业；无 `.env`/密钥文件）
  - review: Pass（右栏 26rem 常驻面板、宽屏整页滚动 + 吸顶、窄屏堆叠顺序、入口与弹窗删除、导出隔离均按 Delta/Design 落地）
  - evidence: Pass（24 场景全部有 E2E 承接；tasks 18 项全勾选；`validate --strict` 通过）
  - ci: Pass（PR CI 重跑后全绿；合并后 main CI 全绿；Backend tests 因无后端 diff 策略跳过）
  - cd: n/a
- Defect grades: CRITICAL 0 / WARNING 0 / SUGGESTION 0
- Decision: **Pass**
- Waivers / conditions + owners: 无 blocker。已接受项：
  1. **G1 未签署**（历史流程缺口）——本次由 VL 在 G2 一并确认，G1 记录缺口不阻塞 G2（owner=SA）
  2. 真实高德 Key 下的地图交互未目视；假 AMap 已覆盖绘制/标记/折线/失败路径，缺 Key 降级有 E2E 断言（owner=IO）
  3. 1024px 断点两侧未单独出例，宽窄两侧均有用例覆盖（owner=IO）
  4. `packing-checklist.spec.ts` 存在既有偶发勾选竞态，非本变更引入；本地全量 111 通过、CI 重跑转绿（owner=SA）
  5. `tsc --noEmit` 不在 CI 门禁（local 通过）；无 CD 工作流（记 n/a）
- Approvers: VL=**TANTA6**（用户本会话明确指示「跑G2」「跑完就进入P5」；2026-11-19）
- Timestamp: 2026-11-19（Asia/Shanghai）

## Traceability appendix

| Requirement | Spec | Code | Test |
|-------------|------|------|------|
| 当天路线规划面板常驻右栏、打开即见 | `specs/trip-itinerary/spec.md`（ADDED「当天路线规划面板」） | `apps/web/src/routes/_authenticated/itinerary.tsx`、`apps/web/src/components/trip/day-route-panel.tsx` | `e2e/day-route-planning.spec.ts:276` |
| Day 联动、宽屏吸顶、窄屏堆叠、导出隔离 | 同上（5 个场景） | `itinerary.tsx`（`lg:grid-cols-[minmax(0,1fr)_26rem]` + `lg:sticky`）、`day-route-panel.tsx`（`print:hidden`） | `e2e/day-route-planning.spec.ts:393`、`:416` |
| 路线绘制、距离时长、降级与空态保持 | 同上（MODIFIED「当天路线绘制」「路线规划不可用时的降级」+ ADDED「路线面板空态」） | `apps/web/src/components/trip/day-route-map.tsx`、`apps/web/src/lib/trip/day-route.ts` | `e2e/day-route-planning.spec.ts:307`、`:342`、`:368`、`:380` |
| 入口与弹窗移除 | 同上（REMOVED「当天路线规划入口与弹窗」「路线弹窗空态」） | 删除 `apps/web/src/components/trip/day-route-dialog.tsx` 与按钮 | `e2e/day-route-planning.spec.ts:276` |
| 携带清单入口/弹窗与既有行为不变 | 同上（MODIFIED「携带清单入口与进度」「携带清单弹窗与操作」） | `itinerary.tsx` | `e2e/packing-checklist.spec.ts`、`e2e/itinerary.spec.ts` |
| 行程单页框加宽能力 | `design.md` D1 | `apps/web/src/components/layout/page-frame.tsx`（`width="wide"` → `lg:max-w-6xl`） | `e2e/itinerary.spec.ts` |
