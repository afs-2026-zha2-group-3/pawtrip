# Local Verify Report: 2026-11-18-companion-hints

**Date:** 2026-11-19 (timezone: Asia/Shanghai, UTC+08:00)
**Root:** C:\Users\TANTA6\.qoder\worktrees\app\d19223\pawtrip
**Scope:** local+evidence
**Change id:** 2026-11-18-companion-hints（REQ-018 / US-52）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped（仓库未配置 scan 作业；已核对无 `.env`/密钥文件） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** N/A — 变更已通过 PR #151 合并入 main，本报告为 G2 合并后复验。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `cd apps/server && ./mvnw test` | `.github/workflows/ci.yml` Backend tests | 0 | 271 tests, 0 failures, BUILD SUCCESS（57.8s） |
| `npx vitest run --root apps/web` | `ci.yml` Frontend tests | 0 | 49 files / 364 tests passed |
| `npx --no-install tsc --noEmit -p apps/web/tsconfig.json` | tasks 5.3 | 0 | 无类型错误 |
| `npm run build -w apps/web` | `ci.yml` Build | 0 | Vite client/SSR 构建成功（1.18s） |
| `node scripts/run-e2e.mjs --workers=4` | `ci.yml` Browser E2E | 0 | 22 files / 104 tests passed（2.4m） |
| `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` | tasks 5.5 | 0 | Change valid |

- 工作树 HEAD `3a74c45`；与 `origin/main` `764a08b`（PR #151 合并提交）树差异为 0 行，复验等价于合并后 main 快照。

## Code-review highlights

- [fact] 入口外壳 `pointer-events-none`、气泡与 FAB `pointer-events-auto`：修复方形命中区遮挡 Agent 面板「发送」按钮的问题。
- [fact] 伙伴宠物名使用独立预览缓存键 `["pets","preview"]`，首页行程同理 `["trips","preview"]`，避免预热列表页共享缓存导致 E2E 读到旧数据。
- [fact] `/admin/*` 不发起宠物预览请求：避免 mock 登录下 401 触发 `query-client.ts` 全局缓存清理；管理端本就无气泡。
- [fact] 点击 Chatbot 打开 Agent 面板时气泡立即隐藏并 `dismiss`，关闭面板后不重现（`panelOpen`）。
- [fact] 逐页提示以 `Route.fullPath` 登记并规范化尾斜杠，卸载时按路径清理；5000ms 自动关闭按 `bubble.id` 校验。
- [fact] 全部气泡文案统一为宠物第一人称（「我/我们」），多宠物保留其他宠物名字；依赖文案的 5 个 E2E 断言已同步。
- [fact] 入口点击语义为 `setOpen(true)`，关闭仅由面板按钮完成；`/login` 无入口，`/admin/*` 无气泡但保留入口。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 需求/Proposal/Spec/Tasks 可追踪 | Pass | [fact] | REQ-018 → `companion-hints` 5 需求 21 场景 → tasks 5 组 35+1 项全勾选 |
| V2 | P4 实现覆盖任务 | Pass | [fact] | 全局 store/组件、七页提示、业务事件、边界与文案口径均已落地 |
| V3 | 测试覆盖 AC | Pass | [fact] | vitest 364；companion E2E 5；全量 E2E 104；后端 271 |
| V4 | 构建/类型/单测 | Pass | [fact] | 全部 exit 0 |
| V5 | 浏览器行为 | Pass | [fact] | 真实 Chromium 覆盖逐页提示、5 秒关闭、入口打开面板、admin 抑制、刷新不恢复 |
| V6 | OpenSpec 一致性 | Pass | [fact] | `validate --strict` 通过 |
| V7 | 非目标边界 | Pass | [fact] | 零后端/迁移/新依赖；无独立头像与第二入口；无持久化；不改造 Agent 能力 |
| V8 | 必要性/残余风险 | Pass | [inference] | 预览缓存、事件优先级与文案口吻为 design 已记录权衡 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | `2026-11-19-*-pipeline-report.md` + `ci-report.md`（main CI 全绿，E1 全绿） |
| E2 AI | Pass | 本报告 + 合并前 P4 质量清单/本地复验报告 |
| E3 Human | Pending | 等待 VL 签署 G2 decision |

## Five-question map (when evidence in scope)

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ✅（残余风险均有本地补证或仓库现状说明） |

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
| 1 | CI Backend tests 因变更检测跳过 | 纯前端变更，workflow paths 过滤 | accepted（本地 271 通过补证） |
| 2 | 文案为产品口吻，未逐字断言 | E2E 只校验关键短语与非空，允许后续微调 | accepted（用户逐页定稿；改文案时同步 E2E） |
| 3 | 提示仅存内存，刷新丢失 | 设计 D2 明确仅内存 | accepted（规格已声明） |

## Waiver

N/A — no waiver（Overall=Pass，无需豁免）。
