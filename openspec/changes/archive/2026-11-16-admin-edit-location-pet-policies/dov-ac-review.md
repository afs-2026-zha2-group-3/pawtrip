# AC / DoV Review — admin-edit-location-pet-policies

- 日期：2026-11-16
- Change：`openspec/changes/admin-edit-location-pet-policies/`
- 评审对象：`proposal.md`、`specs/location-management/spec.md`、`design.md`、`tasks.md`
- 上游：`requirement-workspace/requirements/REQ-005-location-pet-policy-editing.md`

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个需求至少一个可测试 AC | Pass | `specs/location-management/spec.md`：2 个 Requirement，共 14 个 Scenario | 每条政策要求均有可执行场景 |
| AC-2 AC 可观察 | Pass | 场景描述新建/编辑/回填/清空、请求与响应、400 错误、列表不变 | 结果可由 UI、API 响应与数据库值验证 |
| AC-3 负向/边界覆盖 | Pass | “非法数值被拒绝”“清回未配置”“更新缺省不改”“所有地点类型可编辑”“行政区政策不受影响” | 覆盖负数、非整数、两位小数、`NULL` 与缺省对象 |
| AC-4 非实现细节、无模糊措辞 | Pass | 未出现“适当”“快速”“正确”等词；仅使用对外字段名 `petPolicies` | 未绑定类/方法/框架 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 的 What Changes 与 delta 的 2 个 Requirement 一一对应 | 未静默扩展行政区、公共展示或列表 |
| DoV-2 歧义已列出或解决 | Pass | `design.md` Open Questions 为“无”；Pre-SDD 的 4 个非阻塞问题均已 resolved | PATCH 语义、体重精度、非景点表单、列表范围已定 |
| DoV-3 已记录 IO/SA 残余关注 | Pass | 见下方“残余关注” | 需人工 API 契约评审与 G1 决策 |
| DoV-4 未宣称业务实现完成 | Pass | tasks 全部未勾选；change 内无业务代码 | 仅规划产物 |
| DoV-5 需求可追溯到 proposal/已批准需求 | Pass | delta ← proposal ← `REQ-005` 与 `analysis/REQ-005/` | 无孤立需求 |

## 残余关注（IO / SA）

- **SA**：确认“详情响应使用 `petPolicies` 对象”与“PATCH 缺省不改”的契约在 API 评审中通过；实现时需覆盖 `petPolicies: null` 与省略对象的区别。
- **SA**：`SavedLocationEditor` 从仅景点表单改为单表单始终渲染，需在实现评审中确认未回归游玩时间行为。
- **IO**：本评审不是 G1 决策；G1 仍需人工评审并记录。

## 结论

无阻塞性 AC/DoV 缺口。Delta Spec 可进入人工 G1 评审；本文件不代表 G1 通过。
