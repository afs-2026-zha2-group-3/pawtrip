# G3 Decision — destination-selection

- Change id: `destination-selection`（REQ-006 / issue #15，US-47）
- Gate: G3（Merge & Archive）
- 决策时间：2026-11-16（+0800）
- SA（签核人）：**HARLAN HUANG**（显式确认 Pass）

## Inputs

- PR #44（基础，`b75c532`）与 PR #49（增强，`5d70f2a`）均已合并 main；CI 全绿（Web build / Server tests / Browser E2E，见 ci-report.md）
- 本地验证：后端 105/0/0/0、vitest 54、tsc 干净、openspec strict valid、E2E 54 passed + 4 fixme；local-verify-report Overall Pass（20261116-143011 / 20261116-161833）
- Living merge：`openspec archive` 成功——`destination-selection` 主 spec 新建（9 requirements），`web-app-shell` 更新（+1/~5/→2，已与 REQ-007 交通规则 Tab 对齐），Purpose 同步
- KB update：`scripts/kb-lint.sh` → `SKIP: KB lint is not configured for this project.`（exit 0），按本仓既有做法记录为文档化非阻塞 SKIP；不声称 KB lint/索引/一致性已通过
- change-summary.md 已就绪；G1/G2 Pass 记录在案（IO/SA=HARLAN HUANG）

## Conclusions

- 合并：无冲突；与并行 change（REQ-007/008 归档、PR #47 城市政策管理）的 delta 重叠已在归档前对齐（web-app-shell 导航/守卫需求补交通规则 Tab）
- 归档完整性：change 全量工件（proposal/design/tasks/specs/atdd/lint/dov/g1/g2/ci-report/change-summary/seed-data 存档）随归档迁移
- Harness/Rules 演进：无需即时演进；治理建议（CI 安全扫描作业、PR #43 处置）记入残余风险，另立 change 承接

## Decision

**Pass**（SA=HARLAN HUANG，2026-11-16）

## 残余风险（不阻塞归档，tracking）

1. 禁养数据源未定：占位契约 + E4/E6/E10/E11 fixme 门控，数据源确定后恢复
2. PR #43 仍 OPEN 带 V15（低于已应用 V16）：建议关闭（已被 PR #47 取代）或重编号——责任人：PR #43 作者
3. 多宠匹配口径待需求方决策（当前单宠取第一只）
4. CI 无安全扫描作业（治理项）