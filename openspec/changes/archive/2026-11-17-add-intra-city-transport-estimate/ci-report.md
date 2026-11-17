# Pipeline Report: add-intra-city-transport-estimate

**Date:** 2026-11-17 (timezone: Asia/Shanghai, +0800)
**Root:** c:\code\pawtrip
**Phase:** ci
**Data source:** gh
**Change id:** add-intra-city-transport-estimate
**Target:** PR #67 `feat/in-destination-transport-recommendation` → `main`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/67
**Commit:** 2f96be0692ff829f184a45d125e4ff3bbc3bfa39

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 三条工作流全绿（Server/Web/E2E），mergeStateStatus=CLEAN | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44027697806 | 首次触发（ffe125d）因与 main 冲突 DIRTY 无运行；合并 origin/main（2b50717）+ 适配（2f96be0）后追加重跑一次全绿 |
| **Overall** | Pass | ✅ E1 全绿 | — | phase=cd 不在本次范围 |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Server tests（后端 mvnw test） | success | 1m35s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44027697807/job/133851901589 | — |
| ci | Web build（前端 build + vitest） | success | 40s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44027697903/job/133851901396 | — |
| ci | Browser E2E（Playwright 全量） | success | 9m34s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44027697806/job/133851901669 | — |

## 失败详情 (when any failed)

无失败作业。

## 安全与合规

| Check | Status | Notes |
|-------|--------|-------|
| Secret scan | n/a | 仓库未配置独立 secret-scan 作业 |
| SAST | n/a | 仓库未配置 SAST 作业 |
| Dependency audit | n/a | 仓库未配置独立 audit 作业；`npm ci` 依赖锁定于 package-lock |

## Residual risks (for local-verify / G2)

| # | Risk | Source | Status |
|---|------|--------|--------|
| 1 | CI 无 AMAP Key：E2E 走「PUT 预置快照 + 种子坐标 NULL 失败路径」确定性策略，真实 Key 路径仅本地冒烟覆盖（tasks 1.2） | E2E 工作流环境无密钥 | accepted（local-verify 20261117-133236 已记录） |
| 2 | 合并 main（+17 提交）后 E1 语义适配：main 移除草稿入口，E1 改验行程确认弹窗前置态，「草稿不生成段行」由 trip-panel 分支代码保持 | PR #64/#66 重构 | accepted（tasks 6.1 如实记录） |
| 3 | E10 拖拽前采用时间常量等待（1200ms/800ms）依赖 AnimatedList 动画时长常量，若动画参数调整需同步 | 本地 E2E 稳定性修复 d35205c | open（跟踪） |
| 4 | GH E2E 运行时长为本地 2.8m 的 3.4 倍（9m34s），仍远低于超时阈值 | CI runner 性能差异 | accepted |

## Artifacts (if any)

- 本地合并后复验日志：`docs/ai4se-plugins/20261117-135600-merge-reverify-e2e.log`（128/128 绿）
- local-verify 报告：`docs/ai4se-plugins/20261117-133236-local-verify-report.md`（Overall Pass）
- checkpoint：`docs/ai4se-plugins/20261117-133523-pipeline-report-checkpoints.md`

## Human confirmation

N/A

## Next

- ✅ E1 全绿 → `/sdd:g2-decision-record`（VL=tantine；引用本报告 + `20261117-133236-local-verify-report.md`）
- G2 Pass 后按用户指令合并 PR #67（squash，沿用 PR #46/#50 惯例）
- `phase=cd` 在本仓库无独立 CD 产品（pipeline-iac 三工作流即 CI 门禁），合并后可直接进入 P5 归档泳道
