# Pipeline Report: admin-edit-location-pet-policies

**Date:** 2026-11-16 (timezone: +0800)
**Root:** D:\train\day\pawtrip-pr-submit
**Phase:** ci
**Data source:** API (gh)
**Change id:** admin-edit-location-pet-policies
**Target:** PR #37 / `feature/admin-edit-location-pet-policies` / `c249e7a6`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/37
**Commit:** c249e7a6dea47acf6665ea74b7f345184d270d3c

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 所有 in-scope checks success | https://github.com/afs-2026-zha2-group-3/pawtrip/pull/37 | push 与 pull_request 各触发一次，6 个 check 均 success |
| cd | n/a | 未进入部署阶段 | — | 本报告仅覆盖 CI |
| **Overall** | **Pass** | — | — | — |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |
| Any failed job | 无 |
| Skipped / manual not run | 无（安全扫描未配置，见安全表） |
| No remote data | 无；已通过 GitHub API 获取 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Browser E2E (E2E CI) | success | 1m48s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808800279/job/133105591300 | — |
| ci | Browser E2E (E2E CI) | success | 1m36s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808820857/job/133105655880 | — |
| ci | Server tests (Server CI) | success | 38s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808800356/job/133105591988 | — |
| ci | Server tests (Server CI) | success | 53s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808820927/job/133105656231 | — |
| ci | Web build (Web CI) | success | 32s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808800287/job/133105591460 | — |
| ci | Web build (Web CI) | success | 23s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43808820861/job/133105656056 | — |

## 失败详情

无。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库现有 workflow 未配置独立 secret scan |
| SAST | n/a | 仓库现有 workflow 未配置 SAST |
| Dependency audit | n/a | 仓库现有 workflow 未配置依赖审计；本变更未新增依赖 |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | CI 未配置 secret scan / SAST / dependency audit | 仓库 CI 基线 | accepted（非本变更引入） |
| 2 | 部署后验证（CD）尚未触发 | 本报告 phase=ci | tracking（合并后按流程执行） |

## Artifacts

- PR #37：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/37
- 本地验证报告：`docs/ai4se-plugins/20261116-131218-local-verify-report.md`
- Actions runs：43808800279、43808800356、43808800287、43808820857、43808820927、43808820861

## Human confirmation

N/A — remote CI data was available and fetched via GitHub API.

## Next

- ✅ E1 全绿 → `/sdd:local-verify-report`（E1 ready）和/或 `/sdd:g2-decision-record`
- G2 仍需具名 VL 人工评审；本报告不是 Gate 决策。
