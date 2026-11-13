# Pipeline Report: refactor-web-ui-with-shadcn

**Date:** 2026-11-14 (timezone: +08:00)
**Phase:** ci
**Data source:** API (GitHub Actions via `gh`, read-only)
**Change id:** refactor-web-ui-with-shadcn
**Target:** PR #10 / branch `feat/ui-refactor` / commit `b47e797`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43475714639
**Commit:** b47e79776cbe64ae97d090400b2d950853f109c1

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 1/1 jobs success | https://github.com/afs-2026-zha2-group-3/pawtrip/pull/10/checks | Web CI；Server CI 未触发（无后端变更） |
| cd | n/a | — | — | 未合并、未部署 |
| **Overall** | Pass | CI 全绿 | — | E1 全绿 |

## E1 判定 (Machine Evidence)

**E1:** ✅ 全绿 — 所有 in-scope jobs 成功，无 skipped/failed。

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Web build | success | 33s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43475714639/job/132058874772 | — |

`Web CI` 为 `pull_request` 事件，`headSha=b47e797...`，与 PR 当前提交一致。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库未配置 secret-scan job |
| SAST | n/a | 仓库未配置 SAST job |
| Dependency audit | n/a | CI 未配置 |

## Residual risks

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | portability 3 项既有失败 | `scripts/portability.test.mjs` | accepted |
| 2 | 问候语失败页未单独注入故障 | 本地验证 | accepted |
| 3 | 浏览器截图不可用 | 浏览器工具 | accepted |

## Next

- ✅ E1 全绿 → `/sdd:g2-decision-record`
