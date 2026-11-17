# Local Verify Report: add-location-card-media

**Date:** 2026-11-17 (timezone: Asia/Shanghai)
**Root:** `D:\code\pawtrip`
**Scope:** local+evidence
**Change id:** `add-location-card-media`（REQ-013）
**HEAD:** `3907a64`（分支 `feat/location-browse-card`；实现已随 PR #65 合并入 main `fe472ab`）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | n/a（仓库 CI 基线未配置独立 secret scan/SAST） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** PR #65 已合并（`fe472ab`，2026-11-17T04:53:21Z），CI 三条工作流全 SUCCESS；本报告为合并后本地复验，供 G2 签署。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `cd apps/server && ./mvnw test` | atdd-design §4 | 0 | 177 tests，0 failures/errors/skipped，BUILD SUCCESS |
| `npm run build` | atdd-design §4 | 0 | Vite client/SSR 构建通过 |
| `npm test -w apps/web` | atdd-design §4 | 0 | Vitest 17 文件 117 用例通过（含 `location-image` 7 例、`location-summary` 纯函数） |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 既有验证口径 | 0 | 前端类型检查通过 |
| `npm run test:e2e` | atdd-design §4 | 0 | 全量 108 passed / 0 failed（2.1m，Chromium）；media E1–E9 全绿；管理端 `admin-location-management` / `admin-city-management` 回归绿 |
| `git diff --check` | 既有验证口径 | 0 | 无空白错误 |
| `npx --no-install openspec validate "add-location-card-media" --strict` | tasks 5.2 | 0 | Change valid |

日志：`20261117-132353-server-test.log`、`20261117-132353-web-build.log`、`20261117-132353-web-vitest.log`、`20261117-132353-e2e-run.log`（同目录）。

## CI evidence（PR #65）

| Workflow | Conclusion |
|----------|-----------|
| Browser E2E | SUCCESS |
| Server tests | SUCCESS |
| Web build | SUCCESS |

- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/65
- 合并提交：`fe472ab4514fc8a69c9d6b570cc6a9733c4b2954`（head `791e90f`）

## Code-review highlights

- [fact] PR #65 文件清单无 Flyway 迁移、无 `package.json`/lockfile 变更（零迁移、零新依赖）；管理端仅 `-location-editor.tsx` 的 `safeImageUrl` import 重构，无 UI 行为改动。
- [fact] `LocationPhotoRepository.findAllByLocationIdInOrderByLocationIdAscPhotoOrderAsc` 按页批量取照片，服务层按地点取首张（D1，防 N+1）；详情复用既有单地点排序查询。
- [fact] `LocationQueryService` Jackson 解析 `business_json.rating`，trim 非空才返回、解析失败视同缺失（D2）；`LocationQueryResponses` 两 DTO 纯增量可空字段（D3）。
- [fact] 前端 `lib/location-image.ts`（共享 `safeImageUrl`）、`lib/location-summary.ts`（`restrictionFeeParts`/`policyNoteParts` 纯函数）、`-location-cover.tsx`/`-location-rating.tsx` 组件与 design D4/D5 一致。
- [fact] E2E 图片用 `photos.e2e.test` route 夹具（fulfill 本地 PNG / abort），不依赖外网；种子含多张照片、无图无分、政策组合甲/乙。
- [fact] 组件/卡片/弹窗行为验证由 E2E media E1–E9 承担（仓库无 RTL/jsdom 且零新依赖约束）；纯函数按 vitest TDD——偏差已记录于 `tasks.md` P4 执行记录。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 需求/Proposal/Spec/Tasks 可追踪 | Pass | [fact] | REQ-013 → proposal → 4 需求 17 场景 → tasks 全勾选；`alignment-self-check.md` Pass |
| V2 | P4 实现覆盖任务 | Pass | [fact] | tasks 1.1–5.2 全勾选，P4 执行记录含红→绿证据 |
| V3 | 测试覆盖 AC | Pass | [fact] | API A1–A9（177 后端测试内）、E2E media E1–E9 + E10 管理回归、vitest 纯函数 |
| V4 | 构建/类型/单测 | Pass | [fact] | mvnw/build/vitest/tsc 全部 exit 0 |
| V5 | 浏览器行为 | Pass | [fact] | E2E 真实 Chromium 覆盖封面/评分/降级/摘要行/弹窗/类型切换；P4 期 390×844 窄屏单列、弹窗层叠、无横向溢出、控制台无错误（临时 spec 验证后已删） |
| V6 | OpenSpec 一致性 | Pass | [fact] | `openspec validate --strict` 通过 |
| V7 | 非目标边界 | Pass | [fact] | E9 absence（押金/清洁费/排序/轮播）、A6 DB-only、A7 管理边界、A8/E10 管理端回归 |
| V8 | 必要性/残余风险 | Pass | [inference] | 仅暴露已入库数据与卡片重构；上游 URL 可用性/快照时效为已接受权衡 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地全量（后端 177 / vitest 117 / E2E 108）+ PR #65 CI 三条 SUCCESS |
| E2 AI | Pass | 本报告代码审查与 `alignment-self-check.md` |
| E3 Human | Signed | VL=Scott，见 `g2-decision.md`（2026-11-17） |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual risks | ✅ |

## Findings

### CRITICAL

无。

### WARNING

无。

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 390px 下行程面板默认展开为全屏抽屉需点「收起」；主导航 tabs 与 Log out 间距偏紧（非本 change 引入） | [fact] | `apps/web` 行程面板/主导航 | 后续 UI 变更单独处理 |
| 2 | G3（合并归档）与 Living Spec 同步（`trip-attractions` +3、`location-management` +1）待后续门禁 | [fact] | `openspec/changes/add-location-card-media` | 按归档流程执行 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 高德照片 URL 过期/防盗链 | 上游不可控 | 规格降级为中性占位、不阻塞操作；`no-referrer` 沿用管理端已验证模式 | accepted |
| 2 | 评分快照时效 | DB-only 已决口径，不随高德刷新 | 展示为快照值；如需刷新另起变更 | accepted |
| 3 | `unify-location-browsing` 未归档 | 其 change 包仍在途 | 本 change delta 全 ADDED，归档顺序无文本冲突 | tracking |

## Waiver

N/A — no waiver.