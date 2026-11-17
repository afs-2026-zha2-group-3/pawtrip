# AC / DoV Review

变更：`2026-11-17-restore-policy-entry-and-trip-dialog`

范围：只检查 Delta Spec 与需求方书面要求、Design、Tasks 是否一致，不执行生产代码验证，也不作 Gate 决策。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 政策只通过「查看政策」入口查看 | Pass | `specs/destination-selection/spec.md`：`候选列表与政策入口` | 卡片提供链接，候选页不展示政策要点与名单 |
| AC-2 选定城市弹出确认弹窗 | Pass | `specs/destination-selection/spec.md`：`选定城市与创建行程确认` | 城市只读、日期必填、宠物默认第一只、可切换 |
| AC-3 日期推导 1–7 天并校验 | Pass | 同上；`design.md` D3 | 含首尾计数；非法范围阻止提交 |
| AC-4 确认后创建行程并跳转景点 | Pass | 同上；`specs/trip-context/spec.md`：`创建行程确认弹窗` | 调用 `POST /api/trips`、写入 `activeTripId`、跳转 `/attractions` |
| AC-5 取消无副作用 | Pass | `specs/destination-selection/spec.md` 场景「打开对话框后取消」 | 不创建行程、不改变激活行程 |
| AC-6 无宠物不可创建 | Pass | `specs/trip-context/spec.md` 场景「无宠物不可创建」 | 提示先添加宠物并禁用确认 |
| AC-7 同一时间只支持一个激活行程 | Pass | `specs/trip-context/spec.md`：`Trips 页与单城市激活`；`specs/destination-selection/spec.md` 场景「存在激活行程时不可选定新城市」 | 存在激活行程时「选定」禁用并提示先取消激活；与主规格单激活行程约束一致 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、两份 delta | 仅前端交互调整；无后端/迁移/依赖变更 |
| DoV-2 歧义已列出或解决 | Pass | `design.md` D1–D5、Risks | 日期不落库、宠物默认与切换、已有激活行程行为均已明确 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks / Trade-offs | 日期不持久、草稿代码变为不可达、重复选城新建行程 |
| DoV-4 未声称业务实现完成 | Pass | 本评审为文档层记录 | 实现与验证证据见 `tasks.md` 4.1–4.3 与后续 PR/CI |
| DoV-5 需求可追溯 | Pass | 需求方截图与文字要求 → proposal → delta spec → tasks | AC-1 至 AC-7 均有 requirement/scenario 与任务映射 |

## Residual concerns

- 起止日期不持久化，Trips 页与行程面板只展示天数；若后续要求展示日期，需另起变更增加字段与迁移。
- 草稿 store / 面板草稿 UI 仍存在但不再可达，属于已知死代码，后续单独清理。
- 全量 E2E 与三条 CI 工作流尚未在本变更分支上重跑，待 PR 后确认。

## Review outcome

文档层 AC/DoV 检查为 **Pass（规格层）**；不代表 G1 已批准，也不代表生产代码或 CI 已通过。
