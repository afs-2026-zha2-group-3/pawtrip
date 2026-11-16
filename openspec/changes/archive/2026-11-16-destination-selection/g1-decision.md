# G1 decision — destination-selection

- Gate: G1（Align）
- Change id: `destination-selection`（REQ-006 / issue #15，US-47； gate 评审时登记编号为 REQ-005，2026-11-16 合并 main 后改编号 REQ-006）
- Inputs:
  - Delta Specs：`specs/destination-selection/spec.md`（7 需求）、`specs/web-app-shell/spec.md`（6 需求）
  - AC/DoV 评审：`dov-ac-review.md`（AC 4/4 Pass，DoV 5/5 Pass；G1 Revision 后复审）
  - 一致性 lint：`consistency-lint.md`（Partial：BLOCKER 0 / WARNING 2 / SUGGESTION 1）
  - 上游：`proposal.md`、`requirement-workspace/requirements/REQ-006-destination-selection.md`、`analysis/REQ-006/impact-brief.md`、`analysis/REQ-006/deep-dive.md`
  - 校验：`openspec validate destination-selection --strict` → valid
- Findings:
  - Scope：G1 Revision 已落实——宠物档案改外部依赖（US-01 change），paws-page delta 移除；顶栏 chip 保留；proposal/spec/REQ-005/分析文档同步，无静默扩围
  - Ambiguity：6 项决策均 Confirmed；剩余仅种子数据具体值（deferred 数据任务，字段与来源契约已定，非规格歧义）与外部档案接口字段名（design D6 adapter 隔离，可安全延后）
  - Conflict：无未决冲突；lint L1（web-app-shell 主 spec Purpose 滞后）留待 P5 living-merge 处理
  - 已知风险（批准人知悉）：lint L5——外部档案 change（`feature/add-pet-schema`）现仅 schema，无 breed/接口/页面；AC-2 完整口径与 AC-4 的实现/E2E 受其交付进度阻塞；需求方已确认「等对方补齐，本 change 只消费」策略
- Decision: **Pass**
- Conditions + owners: 无（Pass）；沿袭风险跟踪：外部依赖协调（owner: HARLAN HUANG）、种子数据摘录（owner: Dev，P4 任务 1.1）
- Approvers: IO=HARLAN HUANG; SA=HARLAN HUANG
- Timestamp: 2026-11-16 12:24 (UTC+8)
- 备注：批准人于 2026-11-16 指示「执行P3」，本记录为正式署名补记；P3 产物（atdd-design/design/tasks/alignment-self-check）已产出，P3 清单 Pass