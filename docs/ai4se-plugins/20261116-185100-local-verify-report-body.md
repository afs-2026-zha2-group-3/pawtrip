# Local Verify Report: add-trip-duration-input

**Date:** 2026-11-16 (timezone: Asia/Shanghai)
**Root:** `/Users/racio/Documents/bootcamp/pawtrip`
**Scope:** local+evidence
**Change id:** `add-trip-duration-input`

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Pass |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** 本地验证通过，可进入 PR 提交流程；未执行合并、部署或 G2 决策。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm test -w apps/web` | P4 task plan | 0 | Vitest 11 个测试文件、67 个用例通过 |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | P4 task plan | 0 | 前端类型检查通过 |
| `npm run build` | `docs/feedback/verification-commands.md` | 0 | Vite client/SSR 构建通过 |
| `cd apps/server && ./mvnw test` | `docs/feedback/verification-commands.md` | 0 | 后端测试通过，作为回归证据执行 |
| `npm run test:e2e -- e2e/trip-duration-input.spec.ts` | P4 task plan | 0 | 5 个目标场景通过 |
| `npm run test:e2e -- e2e/destination-selection.spec.ts` | P4 task plan | 0 | 15 passed，4 个 profile-dependent 场景 skipped |
| `CI=true npm run test:e2e` | `docs/feedback/verification-commands.md` | 0 | 全量 E2E 80 个通过 |
| `git diff --check` | P4 task plan | 0 | 无空白错误 |
| `openspec validate add-trip-duration-input --strict` | P4 task plan | 0 | OpenSpec change valid |

## Code-review highlights

- [fact] `apps/web/src/lib/trip-duration.ts` 统一校验 1–7 整数，合法值写入 `sessionStorage` 键 `pawtrip.tripDuration`，非法值不覆盖已有合法值。
- [fact] `/cities` 在目的地卡片前显示默认 1 天输入；输入为空或非法时禁用“选定”，合法后保留既有自动进入 `/attractions` 流程。
- [fact] `/attractions` 读取同一会话总天数，横向显示从“第 1 天”到“第 N 天”的 Tabs，N 严格等于总天数。
- [fact] `git diff --name-only -- apps/server` 无输出；功能实现未修改服务端。
- [fact] 生产实现未使用 `localStorage`、新增保存 API 或新增依赖。
- [inference] 当前天数 Tabs 是按天浏览容器；景点加入某一天的持久化分配属于后续 US-09/行程能力，未在本 Change 虚构实现。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 需求/Proposal/Spec/Tasks 可追踪 | Pass | [fact] | P1–P3 artifacts 已补充默认 1 天、选定守卫和景点天数栏 |
| V2 | P4 实现覆盖任务 | Pass | [fact] | tasks.md 1.1–4.3 已勾选并附验证证据 |
| V3 | 测试覆盖 AC | Pass | [fact] | UT、目标 E2E、目的地回归和全量 CI E2E 均有结果 |
| V4 | 构建/类型/单测 | Pass | [fact] | build、tsc、Vitest 全部 exit 0 |
| V5 | 浏览器行为 | Pass | [fact] | 默认 1 天、边界、非法保护、刷新恢复、3 天横向 Tabs |
| V6 | OpenSpec 一致性 | Pass | [fact] | strict validation 通过 |
| V7 | 非目标边界 | Pass | [fact] | 无 apps/server、localStorage、新 API 或新依赖变更 |
| V8 | 必要性/残余风险 | Pass | [inference] | 只新增用户要求的输入状态与按天浏览容器；下游生成和分配明确 deferred |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单构建、后端测试、CI 全量 E2E |
| E2 AI | Pass | 本报告代码审查与 P1–P4 对齐检查 |
| E3 Human | Pending | 待 VL/指定评审人确认；本报告不代签 |

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

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | US-09 生成前守卫和具体景点分配尚未存在 | [fact] | `openspec/changes/add-trip-duration-input/specs/trip-duration-input/spec.md` | 后续 US-09 接入 `tripDurationStore.get()` 并补完整 E2E |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 当前景点页天数 Tabs 切换的是浏览上下文，尚未保存景点归属 | [inference] | `apps/web/src/routes/_authenticated/attractions/index.tsx` | 若产品要求“加入第 N 天”，另开 Change 定义景点分配数据契约 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | US-09 尚无路由 | 当前仓库无法执行真实生成前守卫 | 复用共享读取契约，后续补 US-09 E2E | tracking |
| 2 | sessionStorage 被浏览器禁用 | 浏览器环境差异 | 状态模块捕获读写异常，页面保持可用 | mitigated |

## Waiver

N/A — no waiver.
