# Local Verify Report: PR #158 行程单右侧常驻路线面板

**Date:** 2026-11-19 (timezone: Asia/Shanghai, UTC+08:00)
**Root:** C:\Users\TANTA6\.qoder\worktrees\app\c7147c\pawtrip
**Scope:** local+evidence
**Change ids:**
- `2026-11-19-inline-day-route-panel`（REQ-021）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped（仓库未配置 scan 作业；已核对本次提交无 `.env`/密钥文件） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** PR #158 已合并入 main（`25e7777`，merged 2026-11-19T08:45:05Z），本报告为 G2 合并后复验。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `cd apps/server && ./mvnw test` | `.github/workflows/ci.yml` Backend tests | 0 | 272 tests, 0 failures, 0 errors, BUILD SUCCESS（50.2s） |
| `npm test -w apps/web` | `ci.yml` Frontend tests | 0 | 49 files / 375 tests passed（9.5s） |
| `npx --no-install tsc --noEmit -p apps/web/tsconfig.json` | tasks 4.5 | 0 | 无类型错误 |
| `npm run build -w apps/web` | `ci.yml` Build | 0 | Vite client/SSR 构建成功（851ms） |
| `node scripts/run-e2e.mjs --workers=4` | `ci.yml` Browser E2E | 0 | 111 passed（2.7m）；`apps/server/data/pawtrip.db` 未被修改 |
| `npx --no-install openspec change validate 2026-11-19-inline-day-route-panel --strict` | tasks 4.6 | 0 | valid |

- 工作树 HEAD `ca4186f` 与 `origin/main` `25e7777`（PR #158 合并提交）树差异 0 行，复验等价于合并后 main 快照。
- 本地 E2E 覆盖 `day-route-planning.spec.ts`（7 例，含绘制、快照时长、部分失败、空天、单点、窄屏堆叠、导出隔离）与 `itinerary.spec.ts`（9 例回归）。

## Code-review highlights

- [fact] 行程单完成态改为两栏网格：左列当天明细 `minmax(0,1fr)`，右栏 `26rem` 常驻 `DayRoutePanel`；宽屏 `lg:sticky lg:top-6 lg:self-start` 吸顶，整页滚动，无列内滚动或高度锁定。
- [fact] 窄屏按源码顺序堆叠：当天明细 → 路线面板 → 未排期；`DayRoutePanel` 在 `lg:col-start-2 lg:row-start-1` 回到右栏。
- [fact] 删除「查看当天路线规划」按钮、`routeDialogOpen` 状态与 `DayRouteDialog` 组件，无隐藏触发入口。
- [fact] 面板标题「第 N 天路线规划」、日期城市描述、空天/缺坐标/单点/地图与失败提示逐字复用 `day-route.ts`；测试标识 `day-route-panel`、`day-route-empty`、`day-route-all-missing`、`day-route-single`、`route-marker`、`day-route-failure` 保留。
- [fact] 面板根节点 `print:hidden`，且不在 `image-export-surface` 容器内；导出与打印均不含面板与地图。
- [fact] `PageFrame` 新增 `width?: "default" \| "wide"`，仅完成态行程单使用 `wide`（`lg:max-w-6xl`），其他页面宽度不变。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 需求/Proposal/Spec/Tasks 可追踪 | Pass | [fact] | `proposal.md` → Delta（2 ADDED / 4 MODIFIED / 2 REMOVED，24 场景）→ `design.md` D1–D7 → `tasks.md` 18 项全勾选 |
| V2 | P4 实现覆盖任务 | Pass | [fact] | 面板组件、两栏布局、入口删除、PageFrame 加宽、E2E 重写与回归均已落地 |
| V3 | 测试覆盖 AC | Pass | [fact] | AC-1…AC-8 全部由 E2E 场景承接；全量 E2E 111 通过 |
| V4 | 构建/类型/单测 | Pass | [fact] | 后端 272、前端 375、tsc、build 全部 exit 0 |
| V5 | 浏览器行为 | Pass | [fact] | 宽屏右栏常驻与 Day 联动、窄屏堆叠、导出隔离均有 E2E 断言 |
| V6 | OpenSpec 一致性 | Pass | [fact] | `validate --strict` valid |
| V7 | 非目标边界 | Pass | [fact] | 未新增依赖；后端零改动；其他页面宽度、导航、行程数据与导出内容未变 |
| V8 | 必要性/残余风险 | Pass | [inference] | 残余风险见下表，均有规格声明或既有机制兜底 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | `20261119-165442-pipeline-report.md` + 变更内 `ci-report.md`（合并后 main run 44490264902 全绿 + PR run 44487412956 重跑后全绿） |
| E2 AI | Pass | 本报告 + `tasks.md` 验证记录 |
| E3 Human | Pass | VL 在会话中指示「跑G2」「跑完就进入P5」，`g2-decision.md` 记录签署 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ✅ |

## Findings

### CRITICAL

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 真实高德 Key 下地图交互未目视 | 本地/CI 均无 Key | accepted（假 AMap 覆盖绘制、标记、折线与失败路径；缺 Key 降级已由 E2E 断言） |
| 2 | 1024px 断点两侧未单独出例 | E2E 只覆盖宽/窄两侧 | accepted（Tailwind `lg` 断点行为由框架保证，宽窄两侧均有用例） |
| 3 | `tsc --noEmit` 不在 CI 门禁 | workflows 未配置 | accepted（本地 tsc 通过） |
| 4 | `packing-checklist` E2E 存在既有偶发竞态 | PR 首次 CI run | accepted（非本 change 引入；本地全量 111 通过，重跑后 CI 全绿） |
| 5 | 无独立 CD/部署工作流 | 仓库现状 | accepted（pipeline cd 记 n/a） |

## Waiver

N/A — no waiver（Overall=Pass，无需豁免）。
