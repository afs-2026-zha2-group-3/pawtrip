# Pipeline Report: add-day-route-planning

**Date:** 2026-11-18 (timezone: Asia/Shanghai, +0800)
**Root:** C:/Users/TANTA6/.qoder/worktrees/app/68339d/pawtrip
**Phase:** ci
**Data source:** gh
**Change id:** `2026-11-18-add-day-route-planning`
**Target:** PR #127 `feat/day-route-planning` → `main`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/127
**Commit:** 68a7272（PR head；合并提交 `2e8aff67b0cb80d2a2aa34befca5c5c66bd0e032`）

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 三条检查全绿（Browser E2E / Web build / Docs-only），PR 合并后 Web CI 亦绿 | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44246551608 | Server CI 未触发：PR 未改后端代码；后端本地 247 tests passed |
| **Overall** | Pass | ✅ E1 全绿 | — | phase=cd 不在本次范围 |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Browser E2E（Playwright 全量） | success | 15m46s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44246551608/job/134606819141 | — |
| ci | Web build（build + vitest） | success | 1m10s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44246551739/job/134606776720 | — |
| ci | Docs-only check | success | 4s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44246551608/job/134606776051 | — |
| ci | Server tests | n/a | — | — | PR 未改动 `apps/server`，工作流未触发；本地 `./mvnw test` 247 passed |
| cd | — | n/a | — | — | 仓库无独立 CD 产品，三条 CI 工作流即门禁 |

## 失败详情 (when any failed)

无失败作业。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库未配置独立 secret-scan 作业；`.env` 未跟踪、未提交 |
| SAST | n/a | 仓库未配置 SAST 作业 |
| Dependency audit | n/a | 本次零新依赖 |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | CI 无真实高德 Key，E2E 用假 `window.AMap` + 空 Key 注入 | PR #127 / `scripts/run-e2e.mjs` | 已接受（G1 知悉项） |
| 2 | 合并后 main 的 E2E CI 运行（`2e8aff6`）在报告生成时仍在进行 | GitHub Actions | 观察项，不阻塞 G2 |
| 3 | GH E2E 时长 15m46s，高于本地 1.7m（受影响范围） | GitHub Actions | 已接受 |
