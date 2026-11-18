# Pipeline Report: add-trip-packing-checklist

**Date:** 2026-11-18 (timezone: Asia/Shanghai, +0800)
**Root:** C:/Users/TANTA6/.qoder/worktrees/app/1d8afc/pawtrip
**Phase:** ci
**Data source:** gh
**Change id:** `2026-11-18-add-trip-packing-checklist`
**Target:** PR #144 `feat/trip-packing-checklist` → `main`
**Pipeline URL:** https://github.com/afs-2026-zha2-group-3/pawtrip/pull/144
**Commit:** 7eff5bc（PR head；合并提交 `1b9b2dbe08158db4e9d7db7ff3e82f53b343661f`，2026-11-18T08:17:03Z）

## Summary

| Phase | Status | Conclusion | Upstream URL | Notes |
|-------|--------|------------|--------------|-------|
| ci | Pass | 四项检查全绿（Server tests / Web build / Browser E2E / Docs-only） | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44264368186 | PR 已合并 |
| **Overall** | Pass | ✅ E1 全绿 | — | phase=cd 不在本次范围 |

## E1 判定 (Machine Evidence)

| Condition | E1 status |
|-----------|-----------|
| All in-scope jobs success | ✅ E1 全绿 |

**E1:** ✅ 全绿

## Jobs / checks

| Phase | Job/Stage | Status | Duration | URL | Failure reason |
|-------|-----------|--------|----------|-----|----------------|
| ci | Browser E2E（Playwright 全量） | success | 6m21s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44264368186/job/134665197088 | — |
| ci | Server tests（`./mvnw -B test`） | success | 1m37s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44264368100/job/134665121590 | — |
| ci | Web build（vitest + build） | success | 1m18s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44264368101/job/134665122227 | — |
| ci | Docs-only check | success | 6s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44264368186/job/134665122491 | — |
| cd | — | n/a | — | — | 仓库无独立 CD 产品，CI 工作流即门禁 |

## 失败详情 (when any failed)

无失败作业。

## 备注

- PR head 为二次合并 main 后的 `7eff5bc`（含 main #142 宠物删除占用原因、#145 废弃浮动行程面板）。
- 合并前本地验证：后端 269、前端 339、build、全量 E2E 99、`openspec validate --strict` 通过。
- PIN：若后续 main 前进，需重新触发 CI 后更新本报告。
