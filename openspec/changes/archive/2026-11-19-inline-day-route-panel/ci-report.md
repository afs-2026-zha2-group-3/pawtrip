# CI report — inline-day-route-panel

- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/158
- Head commit: `ca4186fa6d3ad603385f2db7aa56d3ee980e4435`
- Merge commit: `25e777794fbb09eafc7793ea37e88be9d1f71870`
- E1: ✅ 全绿（PR run 44487412956 重跑后全绿 + 合并后 main run 44490264902 全绿）

| Job | Status | Duration | URL |
|---|---|---|---|
| Detect changes | success | 7s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/44490264902 |
| Backend tests | skipped | 0s | 同上（无后端 diff） |
| Frontend tests | success | 30s | 同上 |
| Build | success | 26s | 同上 |
| Browser E2E | success | 5m22s | 同上 |

> PR 首次 run 的 Browser E2E 因 `e2e/packing-checklist.spec.ts:128` 既有勾选竞态停在 8/9 失败；本地复跑该 spec 5/5 通过后重跑失败 job 转绿，与本变更无关。

完整报告：`docs/ai4se-plugins/20261119-165442-pipeline-report.md`；本地复验：`docs/ai4se-plugins/20261119-165442-local-verify-report.md`。
