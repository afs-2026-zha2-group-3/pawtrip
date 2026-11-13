# Pipeline Report: hello-world-greeting

**Date:** 2026-11-13 (timezone: +08:00)
**Root:** C:\Users\luoec3\workspace\ita\pawtrip
**Phase:** ci
**Data source:** GitHub API (`gh`)
**Change id:** hello-world-greeting
**Target:** PR #2 / branch `feat/hello-world-greeting`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/2/checks
**Commit:** 4f184b321a356414da723e5a630622b81aab2403

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | All jobs success | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43436740601 | Server CI + Web CI |
| cd | n/a | 未配置部署流水线 | — | 按 `pipeline-iac` 规则,CD 不在当前范围 |
| **Overall** | **Pass** | CI 全绿 | — | — |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Server tests (`./mvnw -B test`) | success | 42s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43436740601/job/131923694267 | — |
| ci | Web build (`npm ci` + `npm run build`) | success | 19s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43436740732/job/131923695338 | — |

## 失败详情

无失败 job。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | ⏭️ | 当前工作流未配置独立 secret scan;工作流仅使用 `permissions: contents: read` 且无明文密钥 |
| SAST | ⏭️ | 当前工作流未配置 SAST |
| Dependency audit | ⏭️ | 当前工作流未配置独立依赖审计;依赖由 Maven/npm 构建解析 |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | 无独立 secret scan / SAST / dependency audit job | CI 工作流范围 | accepted(当前仓库 CI 契约仅覆盖 build/test) |
| 2 | 无 CD 证据 | 仓库未配置部署流水线 | accepted(`pipeline-iac` 明确 CD 不在范围) |
| 3 | 后续 docs-only 提交不会触发 CI | `paths` 过滤 | accepted(不影响本次代码 SHA 的 E1) |

## Artifacts (if any)

- Server CI run:`43436740601`
- Web CI run:`43436740732`
- PR:https://github.com/afs-2026-zha2-group-3/pawtrip/pull/2

## Human confirmation

N/A — remote fetch succeeded via GitHub API; no human confirmation needed.

## Next

- ✅ E1 全绿 → 本地验证的 E1 槽位已就绪;PR 合并后进入 `/sdd:g2-decision-record`(人工 Gate)。
- `cd` 为 n/a:仓库无部署流水线,`/sdd:deploy-artifacts` 与 `phase=cd` 不适用。
