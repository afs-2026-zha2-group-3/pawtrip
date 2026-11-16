# CI Report (E1) — destination-selection

- 日期：2026-11-16（+0800）；来源：`docs/ai4se-plugins/20261116-144147-pipeline-report.md`（gh API 只读取数）
- 目标：PR #44，branch `feat/destination-selection`，commit `e0ee12ee24ec859a5edd090db2b211f713518fd2`

## E1 判定：✅ 全绿

| Job/Stage | Workflow | Status | Duration | URL |
|-----------|----------|--------|----------|-----|
| Browser E2E（test） | E2E CI | success | 2m49s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43817340410/job/133132275533 |
| Web build（build） | Web CI | success | 23s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43817340514/job/133132275788 |
| Server tests（test） | Server CI | success | 50s | https://github.com/afs-2026-zha2-group-3/pawtrip/actions/runs/43817340497/job/133132275525 |

- PR 事件 3/3 全绿；同 SHA push 事件 3 个 workflow 亦全绿
- 日志摘录 [fact]：E2E `26 passed + 4 skipped`（E4/E6/E10/E11 test.fixme 门控）；后端 `Tests run: 92, Failures: 0, Errors: 0, Skipped: 0`

## 安全与合规

Secret scan / SAST / Dependency audit：n/a——仓库 `.github/workflows/`（e2e.yml/server.yml/web.yml）未配置扫描作业；作为治理残余风险记录（open），不阻塞本 change E1。

## 残余风险

1. CI 无安全扫描作业（治理项，建议另立 change）——open
2. 政策数据源 TODO + 外部 breed 缺失（4 条 fixme 门控）——accepted（需求方决策）