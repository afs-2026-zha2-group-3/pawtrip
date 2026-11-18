# Pipeline Report: 2026-11-17-export-itinerary-pdf

**Date:** 2026-11-17 (timezone: +0800)
**Root:** c:\code\pawtrip
**Phase:** ci
**Data source:** API（gh CLI 只读读取 GitHub Actions；未触发任何流水线/部署）
**Change id:** 2026-11-17-export-itinerary-pdf（同分支并行交付 add-city-personalized-recommendation / REQ-014）
**Target:** PR #93；branch feat/city-personalized-recommendation
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44108263036 （Web）/ 44108263072（Server）/ 44108263041（E2E）
**Commit:** 8dbdd40（merge: 合并 origin/main 最新代码（政策侧栏+分页）入 feature 分支；分支 tip 以 git log 实时核对）

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | success | 见上 3 条 run | 3 工作流 / 3 job 全绿，均由 8dbdd40 push 触发 |
| cd | n/a | — | — | 不在本次范围（合入后再议） |
| **Overall** | Pass | E1 全绿 | — | 远程 E2E 173 passed 与本地全量一致 |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿（Web build / Server tests / Browser E2E 均 success） |
| Any failed job | 无 |
| Skipped / manual not run | 无（CI 范围内） |
| No remote data | 不适用（gh API 成功读取） |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Web CI › Web build（npm ci → vitest 单测 → npm run build） | success | 44s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44108263036 | — |
| ci | Server CI › Server tests（./mvnw -B test） | success | 81s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44108263072 | — |
| ci | E2E CI › Browser E2E（Playwright Chromium，npm run test:e2e） | success | 536s（测试 7.9m） | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44108263041 | — |

[fact] E2E CI 日志末尾：`173 passed (7.9m)`，与本地第二轮同步后全量（20261117-224339 日志，173 passed）完全一致；含 main 新增 7 例与 REQ-014 分页适配后的 7 例。
[fact] Server CI 在远程全新环境执行迁移链（含重编号后的 V28），无 Flyway 版本/校验和错误——佐证 V26→V28 重编号正确。

## 失败详情

无失败 job。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库 3 条工作流均未配置 secret-scan job（流程缺口，记入残余风险） |
| SAST | n/a | 未配置 |
| Dependency audit | n/a | npm ci / mvnw test 未含 audit 步骤；未配置独立 audit job |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | 6.8 真实 Chrome 打印预览人工记录仍 Pending（页眉页脚抑制 headless/CI 均无法断言） | local-verify CRITICAL #1 | open（tantine Waiver，2026-11-24 前补齐） |
| 2 | CI 无 secret-scan / SAST / dependency-audit 覆盖 | 工作流配置 | open（建议后续以独立 change 补齐，不在本 PR 范围） |
| 3 | GitHub 提示 ubuntu-latest 将于 2026-10-19 后迁移 Ubuntu 26（runner 镜像公告） | E2E CI annotation | accepted（信息性，暂无影响） |

## Artifacts

- `playwright-e2e-diagnostics`（E2E CI，`if: always()` 上传；本次全绿，含运行诊断）

## Human confirmation

N/A（gh API 远程读取成功，无需人工替代确认）。

## Next

- ✅ E1 全绿 → 已回填 `openspec/changes/2026-11-17-export-itinerary-pdf/ci-report.md`（E1 slot）；可更新 local-verify E1 并进入 `/sdd:g2-decision-record`（需实名 VL 签署）
- PR #93 合入后（apply lane）→ `/sdd:deploy-artifacts` / `/sdd:pipeline-report phase=cd`