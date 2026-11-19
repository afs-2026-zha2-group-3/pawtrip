# Local Verify Report: companion-hints

**Date:** 2026-11-18 (timezone: Asia/Shanghai)
**Root:** `C:\Users\TANTA6\.qoder\worktrees\app\d19223\pawtrip`
**Scope:** local+evidence
**Change id:** `2026-11-18-companion-hints`（REQ-018，US-52 伙伴提示）
**HEAD:** `dfe8f97`（分支 `feat/companion-hints`；P4 实现与工件尚在工作区）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | n/a（仓库 CI 基线未配置独立 secret scan/SAST） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**P4 执行口径:** 纯前端变更，前端直接实现、不红测先行；本次新增 E2E 5 个（≤30 上限），既有用例仅追加 `data-mood` 断言。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npx vitest run --root apps/web` | tasks 5.2 | 0 | 49 files / 364 tests passed（含 companion store、气泡组件、Agent 入口、打开面板隐藏气泡） |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | tasks 5.3 | 0 | 前端类型检查通过 |
| `npm run build -w apps/web` | tasks 5.3 | 0 | Vite client/SSR 构建通过（1.08s） |
| `node scripts/run-e2e.mjs e2e/companion-hints.spec.ts ...`（7 个受影响 spec） | tasks 5.4 | 0 | 45 passed |
| `node scripts/run-e2e.mjs --workers=4`（全量） | tasks 5.4 / 4.5 | 0 | 22 files / 104 passed |
| `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` | tasks 5.5 | 0 | Change valid |

## Code-review highlights

- [fact] 入口外壳 `pointer-events-none`、气泡与 FAB `pointer-events-auto`：修复方形命中区盖住 Agent 面板「发送」按钮的问题（trace 证据为外壳 div 拦截 pointer events）。
- [fact] 伙伴宠物名使用独立预览缓存键 `["pets","preview"]`，首页行程同理 `["trips","preview"]`，避免预热列表页共享缓存导致 E2E 读到旧数据。
- [fact] `/admin/*` 不发起宠物预览请求：该请求在 mock 登录的 admin E2E 中返回 401，会触发 `query-client.ts` 的全局缓存清理，导致管理端保存后的行状态回退；管理端本就无气泡，跳过请求即可。
- [fact] 逐页提示以 `Route.fullPath` 登记并规范化尾斜杠，`useCompanionHint` 在卸载时按路径清理，避免跨页残留。
- [fact] 5000ms 自动关闭按 `bubble.id` 校验，事件气泡未过期时优先、关闭后补弹本页情境提示。
- [fact] 既有 E2E 仅追加 `data-mood` 断言（paws `ok`、city `danger`、rule `warn/ok`、attraction `warn/ok`），未新增用例。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 需求/Proposal/Spec/Tasks 可追踪 | Pass | [fact] | REQ-018 → `companion-hints` 5 需求 21 场景 → tasks 5 组 35 项全勾选 |
| V2 | P4 实现覆盖任务 | Pass | [fact] | 全局 store/组件、七页提示、业务事件、旧口径清理、边界均已落地 |
| V3 | 测试覆盖 AC | Pass | [fact] | vitest 364；companion E2E 5；全量 E2E 104；追加「打开面板气泡隐藏」后 companion + trip-planning-agent 复验 11/11 |
| V4 | 构建/类型/单测 | Pass | [fact] | vitest / tsc / build 全部 exit 0 |
| V5 | 浏览器行为 | Pass | [fact] | 真实 Chromium 覆盖逐页提示、5 秒关闭、入口打开面板、admin 抑制、刷新不恢复 |
| V6 | OpenSpec 一致性 | Pass | [fact] | `openspec change validate --strict` 通过 |
| V7 | 非目标边界 | Pass | [fact] | 无后端/迁移/新依赖；无独立头像与第二入口；无持久化；不改造 Agent 能力 |
| V8 | 必要性/残余风险 | Pass | [inference] | 预览缓存与事件优先级为 design 已记录权衡 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 事件与页面提示竞争 | 依赖 `createdAt` 与 `bubble.id` 计时 | store 单测覆盖同路径去重、id 不匹配不误关、事件优先 |
| 2 | 首页提示依赖额外预览请求 | 无激活行程时也要展示情境提示 | 独立缓存键 + `staleTime: 0`，不污染列表页缓存 |
| 3 | 窄窗气泡宽度 | 仅类名级验证 | `min(20rem, calc(100vw - 2rem))`；组件测试断言类名 |
| 4 | G2/G3 未签署 | 需人工门禁 | 按流程由 VL/SA 签署，不由 agent 代签 |

## Waiver

N/A — no waiver.
