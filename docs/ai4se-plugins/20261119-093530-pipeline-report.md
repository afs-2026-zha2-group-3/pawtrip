# Pipeline Report: 2026-11-18-companion-hints

**Date:** 2026-11-19 (timezone: Asia/Shanghai, UTC+08:00)
**Root:** C:\Users\TANTA6\.qoder\worktrees\app\d19223\pawtrip
**Phase:** ci
**Data source:** API（`gh` CLI，只读）
**Change id:** 2026-11-18-companion-hints（REQ-018 / US-52）
**Target:** `main` `764a08b`（PR #151 合并提交）
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44436980655
**Commit:** 764a08bb5dc3ec89f4f78a005367c56c8e7114cf

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 合并后 main CI 全绿；4 个触发 job 成功，Backend tests 按变更检测跳过 | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44436980655 | 纯前端变更，无后端 diff |
| cd | n/a | 仓库无独立部署/CD 工作流（仅 `.github/workflows/ci.yml`） | — | 与既有 change 口径一致 |
| **Overall** | Pass | CI 全绿，CD 不适用 | — | — |

- PR #151 合并前 run 44435747026 同样全绿：Build / Frontend tests / Browser E2E 通过，Backend tests 因变更检测跳过。
- PR #151：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/151（merged 2026-11-19T01:26:58Z）。

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |
| Any failed job | 无 |
| Skipped / manual not run | ⚠️ Backend tests 跳过（`Detect changes` 判定无后端改动）；本地 `./mvnw test` 271 passed 补证 |
| No remote data | 无 |

**E1:** ✅ 全绿（含 1 个按变更检测跳过的 job，已由本地 271 测试补证）

## Jobs / checks

### 合并后 main CI（run 44436980655）

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Detect changes | success | 5s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44436980655 | — |
| ci | Build | success | ≈29s | 同上 | — |
| ci | Frontend tests | success | ≈42s | 同上 | — |
| ci | Backend tests | skipped | 0s | 同上 | 变更检测判定无后端改动 |
| ci | Browser E2E | success | ≈5m08s | 同上 | — |

### PR #151 CI（run 44435747026，head `3a74c45`）

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Detect changes | success | 5s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44435747026 | — |
| ci | Build | success | 36s | 同上 | — |
| ci | Frontend tests | success | 37s | 同上 | — |
| ci | Backend tests | skipped | 0s | 同上 | 变更检测判定无后端改动 |
| ci | Browser E2E | success | 4m32s | 同上 | — |

## 失败详情

无（所有触发 job 成功）。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库 CI 未配置独立 secret-scan 作业；本次提交无 `.env`/密钥文件 |
| SAST | n/a | 仓库未配置 SAST 作业 |
| Dependency audit | n/a | 本次零新依赖；CI 未配置独立审计作业 |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | CI Backend tests 因 paths 检测跳过，合并提交未在 CI 计后端测试 | `.github/workflows/ci.yml` Detect changes | accepted（本地 `./mvnw test` 271 passed 补证） |
| 2 | `tsc --noEmit` 不在 CI 门禁 | workflows | accepted（本地 tsc 通过） |
| 3 | 无独立 CD/部署工作流，无法验证生产发布 | 仓库现状 | accepted（CD 记 n/a） |

## Artifacts (if any)

- PR #151：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/151
- 合并提交：`764a08bb5dc3ec89f4f78a005367c56c8e7114cf`
- 合并后 main CI：https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44436980655

## Human confirmation

N/A（远程 CI 数据可读，无需人工代确认）。

## Next

- ✅ E1 全绿 → `/sdd:g2-decision-record`（local-verify 同时生成）
