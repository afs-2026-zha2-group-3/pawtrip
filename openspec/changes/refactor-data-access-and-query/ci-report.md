# Pipeline Report: refactor-data-access-and-query

**Date:** 2026-11-13 (timezone: +08:00)
**Root:** C:\Users\luoec3\workspace\ita\pawtrip
**Phase:** ci
**Data source:** GitHub API (`gh`)
**Change id:** refactor-data-access-and-query
**Target:** PR #4 / branch `feat/data-access-and-error-handling`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/4/checks
**Commit:** 代码 `0d66f2911764157b0d1994210bb972078ae6bca9`；证据文档提交后 PR head 同步重跑

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | All jobs success | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43451889820 | Server CI + Web CI；代码提交与 docs-only 同步后共三轮均全绿 |
| cd | n/a | 未配置部署流水线 | — | 按 `pipeline-iac` 规则，CD 不在当前范围 |
| **Overall** | **Pass** | CI 全绿 | — | — |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Server tests (`./mvnw -B test`) | success | 35s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43451889820/job/131975877336 | — |
| ci | Web build (`npm ci` + `npm run build`) | success | 21s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43451889829/job/131975877201 | — |
| ci | Server tests（PR synchronize 重跑） | success | 25s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43452259677/job/131977169699 | — |
| ci | Web build（PR synchronize 重跑） | success | 19s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43452259646/job/131977169970 | — |
| ci | Server tests（最终 head 重跑） | success | 30s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43452450966/job/131977844562 | — |
| ci | Web build（最终 head 重跑） | success | 18s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43452450957/job/131977844470 | — |

## 失败详情

无失败 job。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | ⏭️ | 当前工作流未配置独立 secret scan；工作流仅使用 `permissions: contents: read` 且无明文密钥 |
| SAST | ⏭️ | 当前工作流未配置 SAST |
| Dependency audit | ⏭️ | 当前工作流未配置独立依赖审计；依赖由 Maven/npm 构建解析 |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | 无独立 secret scan / SAST / dependency audit job | CI 工作流范围 | accepted（当前仓库 CI 契约仅覆盖 build/test） |
| 2 | 无 CD 证据 | 仓库未配置部署流水线 | accepted（`pipeline-iac` 明确 CD 不在范围） |
| 3 | PR synchronize 时 GitHub 按 PR 整体 diff 重新触发 CI，docs-only 提交也会重跑 | `paths` 过滤 + PR 事件语义 | accepted（不影响代码 SHA 的 E1） |
| 4 | 浏览器 E2E 不在 CI 中执行 | 当前 CI 契约 | accepted（由本地验证报告与后端测试覆盖） |

## Artifacts (if any)

- Server CI run：`43451889820`、`43452259677`、`43452450966`
- Web CI run：`43451889829`、`43452259646`、`43452450957`
- PR：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/4

## Human confirmation

N/A — remote fetch succeeded via GitHub API; no human confirmation needed.

## Next

- ✅ E1 全绿 → 本地验证的 E1 槽位已就绪；G2 已由 IO/SA 签核。
- `cd` 为 n/a：仓库无部署流水线，`/sdd:deploy-artifacts` 与 `phase=cd` 不适用。
