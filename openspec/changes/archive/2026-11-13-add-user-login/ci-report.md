# Pipeline Report: add-user-login

**Date:** 2026-11-14 (timezone: +08:00)
**Phase:** ci
**Data source:** API (GitHub Actions via `gh`, read-only)
**Change id:** add-user-login
**Target:** PR #7 / branch `feat/login` / commit `f94f997`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43467961194
**Commit:** f94f997a5784c5d478e20bf0240926c0cb3c0661

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 2/2 jobs success | https://github.com/afs-2026-zha2-group-3/pawtrip/pull/7/checks | Server CI + Web CI |
| cd | n/a | — | — | 未合并,未部署 |
| **Overall** | Pass | CI 全绿 | — | E1 全绿 |

## E1 判定 (Machine Evidence)

**E1:** ✅ 全绿 — 所有 in-scope jobs 成功,无 skipped/failed。

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Server tests | success | 35s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43467961194/job/132032052765 | — |
| ci | Web build | success | 19s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43467961455/job/132032053783 | — |

两个 workflow 均为 `pull_request` 事件,`headSha=f94f997...`,与 PR 当前提交一致。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库未配置 secret-scan job |
| SAST | n/a | 仓库未配置 SAST job |
| Dependency audit | n/a | CI 未配置;本地 `npm audit` 的 2 个 moderate 位于既有 Tailwind/PostCSS 链,非本 change 引入 |

## Residual risks

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | CI 未包含 secret scan / SAST / dependency audit | `.github/workflows/*.yml` | accepted |
| 2 | 登录限流/失败锁定未实现 | design D15 | accepted;后续独立 change |

## Next

- ✅ E1 全绿 → `/sdd:g2-decision-record`
