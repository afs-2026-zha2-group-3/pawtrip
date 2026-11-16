# G1 decision — add-location-pet-rule-display

> **Revision 3（2026-11-16）**：需求方新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入，城市浏览页不内嵌景点列表或入口按钮。Revision 2 的 Pass 不再覆盖当前 Delta；Revision 3 已由 IO=SUKI / SA=RANLE 重签 Pass。
>
> **Revision 2（2026-11-16）**：需求方确认移除 `entry_policy` / `entry_note`，默认列表改为 `maxPetsPerPerson >= 1`，公开景点页只读数据库且不新增迁移。Revision 1 的 Pass 仅覆盖旧范围；Revision 2 已由 IO=SUKI / SA=RANLE 重签 Pass。

## Revision 3（2026-11-16，Pass）

- Gate: G1 (Align)
- Change id: `add-location-pet-rule-display`
- Input artifacts:
  - Delta Spec: `openspec/changes/add-location-pet-rule-display/specs/attraction-pet-rules/spec.md`、`specs/web-app-shell/spec.md`
  - AC / DoV review: `openspec/changes/add-location-pet-rule-display/dov-ac-review.md`
  - Proposal: `openspec/changes/add-location-pet-rule-display/proposal.md`
  - Upstream: `requirement-workspace/requirements/REQ-008-location-pet-rule-display.md`（Revision 3）、`analysis/REQ-008/`
  - OpenSpec validation: `openspec validate add-location-pet-rule-display --strict`
- Findings:
  - Scope: Revision 3 新增顶层“景区浏览”Tab；`/cities` 选定城市后自动进入 `/attractions`；移除城市浏览页入口/列表；`web-app-shell` delta 从“归入城市浏览 Tab”改为“新增景区浏览 Tab”。无后端/数据变更。
  - Ambiguity: 入口方式已由需求方明确（独立 Tab + 自动跳转）；无未解决歧义。
  - Conflict: 顶部导航增加第四个普通 Tab；`web-app-shell` 仍采用 ADDED 增量，避免与 destination-selection 的 MODIFIED/RENAMED 需求重复。destination-selection 的既有 E2E 已按自动跳转更新。
  - Residual concerns（不构成 G1 条件）: ① 默认门槛依赖 `maxPetsPerPerson` 已维护；② 归档顺序需在 destination-selection 之后；③ AC-2 依赖 US-48。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；沿袭残余关注点：默认门槛数据维护（owner: PO/SA）、归档顺序需在 destination-selection 之后（owner: SA）、AC-2 依赖 US-48（owner: SA）
- Approvers: IO=SUKI; SA=RANLE
- Timestamp: 2026-11-16T16:21:09+0800

> 本记录依据具名人类签署人的明确决定转写；Revision 3 的 Pass 由 IO=SUKI、SA=RANLE 作出，代理不代为决策。残余关注点仅作实现/归档阶段的协调提示，不改变 G1 Pass 结论。

## Revision 2（2026-11-16，Pass）

- Gate: G1 (Align)
- Change id: `add-location-pet-rule-display`
- Input artifacts:
  - Delta Spec: `openspec/changes/add-location-pet-rule-display/specs/attraction-pet-rules/spec.md`、`specs/web-app-shell/spec.md`
  - AC / DoV review: `openspec/changes/add-location-pet-rule-display/dov-ac-review.md`（Revision 2）
  - Proposal: `openspec/changes/add-location-pet-rule-display/proposal.md`（Revision 2）
  - Upstream requirements: `requirement-workspace/requirements/REQ-008-location-pet-rule-display.md`（Revision 2）、`analysis/REQ-008/deep-dive.md`、`analysis/REQ-008/impact-brief.md`
  - OpenSpec validation: `openspec validate add-location-pet-rule-display --strict`
- Findings:
  - Scope: Revision 2 收缩范围——移除 `entry_policy` / `entry_note` 与新增迁移；默认列表按现有 `maxPetsPerPerson >= 1`；详情展示现有 8 个非空政策字段。Delta 为 `attraction-pet-rules` 6 个 Requirement + `web-app-shell` 1 个 Requirement；与 proposal 一致，无静默扩围。
  - Ambiguity: 6 个 blocking 决策均已 resolved；仅剩分页控件形态、省级叶节点实现细节 2 个 deferred，不构成规格歧义。
  - Conflict: `web-app-shell` 采用 ADDED Requirement，避免与 `destination-selection` 的 MODIFIED/RENAMED 需求重复；无内容冲突。
  - Residual concerns（不构成 G1 条件）: ① 默认门槛依赖 `maxPetsPerPerson` 已维护，数据补齐前列表可能为空；② `allowed_pet_types` 与肩高不在管理弹窗中，有值才展示；③ 本 change 应在 `destination-selection` 归档之后再归档，避免 `web-app-shell` 引用尚未落入 Living Spec 的“城市浏览”Tab；④ AC-2 依赖 US-48。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；沿袭残余关注点：默认门槛数据维护（owner: PO/SA）、归档顺序需在 destination-selection 之后（owner: SA）、AC-2 依赖 US-48（owner: SA）
- Approvers: IO=SUKI; SA=RANLE
- Timestamp: 2026-11-16T15:37:22+0800

> 本记录依据具名人类签署人的明确决定转写；Revision 2 的 Pass 由 IO=SUKI、SA=RANLE 作出，代理不代为决策。残余关注点仅作实现/归档阶段的协调提示，不改变 G1 Pass 结论。

## Revision 1（已被 Revision 2 取代）

- Gate: G1 (Align)
- Change id: `add-location-pet-rule-display`
- Input artifacts:
  - Delta Spec: `openspec/changes/add-location-pet-rule-display/specs/attraction-pet-rules/spec.md`、`openspec/changes/add-location-pet-rule-display/specs/web-app-shell/spec.md`
  - AC / DoV review: `openspec/changes/add-location-pet-rule-display/dov-ac-review.md`
  - Proposal: `openspec/changes/add-location-pet-rule-display/proposal.md`
  - Upstream requirements: `requirement-workspace/requirements/REQ-008-location-pet-rule-display.md`、`requirement-workspace/analysis/REQ-008/deep-dive.md`、`requirement-workspace/analysis/REQ-008/impact-brief.md`
  - P1 DoV: `docs/ai4se-plugins/20261116-150926-quality-checklist-report.md`
  - OpenSpec validation: `openspec validate add-location-pet-rule-display --strict` Pass
- Findings:
  - Scope: Delta 包含 `attraction-pet-rules` 7 个 Requirement / 31 个 Scenario，以及 `web-app-shell` 1 个 Requirement / 3 个 Scenario；与 proposal 的 What Changes 一致，未发现静默扩范围。AC-2（行程内展示）明确 Out of Scope。
  - Ambiguity: REQ-008 的 6 个 blocking 开放问题均已 resolved；3 个非阻塞展示细节（说明超长、分页形态、省级叶节点实现）已记录为 deferred，不构成 spec 歧义。
  - Conflict: `web-app-shell` 采用 ADDED Requirement，避免与 `destination-selection` 的 MODIFIED/RENAMED 需求重复；无内容冲突。
  - Residual concerns（不构成 G1 条件）: ① 本 change 应在 `destination-selection` 归档之后再归档，避免 `web-app-shell` 引用尚未落入 Living Spec 的“城市浏览”Tab；② 迁移暂记 V16，需与 US-04 分支已暂用的 V15 协调；③ 无管理 UI，三档/说明依赖迁移/种子人工录入；④ AC-2 依赖 US-48。
- Decision: Pass
- Conditions + owners: 无
- Approvers: IO=SUKI; SA=RANLE
- Timestamp: 2026-11-16T15:16:37+0800

> 本记录依据具名人类签署人的明确决定转写；决策由上述 IO/SA 作出，代理不代为决策。残余关注点仅作 P3/实现阶段的协调提示，不改变 G1 Pass 结论。
