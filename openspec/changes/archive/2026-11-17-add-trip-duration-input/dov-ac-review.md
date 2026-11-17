# AC / DoV Review

变更：`add-trip-duration-input`

范围：本评审只检查 P2 Delta Spec 与已批准的 REQ-010/Proposal/Design 是否一致，不执行生产代码验证，也不作 G1 Pass/Fail 决策。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 输入与保存当前会话总天数 | Pass | `specs/trip-duration-input/spec.md`：`输入并保存当前会话总天数` | 覆盖选定前显示默认 1 天、合法输入、选定按钮守卫、单条覆盖和同标签页刷新恢复；使用 `sessionStorage` 语义 |
| AC-2 1–7 范围与整数校验 | Pass | `specs/trip-duration-input/spec.md`：`总天数范围与整数校验` | 覆盖 1/7 边界、0、8、负数、小数、空值、非数字；非法值不覆盖已有合法值 |
| AC-3 生成前必填引导 | Pass | `specs/trip-duration-input/spec.md`：`行程生成前必须填写总天数` | 明确缺少合法值时阻止生成、提示用户并回到 `/cities` 天数输入区域；生成路由由 US-09 接入 |
| AC-4 下游按天读取 | Pass | 同上 `行程生成读取合法天数` 场景 | 明确下游获得合法整数并按该值作为总天数；本 Change 不实现生成算法 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、`specs/trip-duration-input/spec.md` | 均限定为前端 `/cities` 输入、会话保存、校验、景点按天浏览与下游读取契约；未扩展后端或 US-09 页面 |
| DoV-2 歧义已列出或解决 | Pass | `requirement-workspace/requirements/REQ-010-trip-duration-input.md`、`design.md` | 存储介质、生命周期、非法覆盖、US-09 下游边界均已明确；US-09 路由作为下游细节保留 |
| DoV-3 IO/SA 残余风险已记录 | Pass | `design.md` 的 Risks / Trade-offs；`requirement-workspace/analysis/REQ-010/impact-brief.md` | 已记录 `sessionStorage` 不可用、SSR 首帧、US-09 尚无路由和目的地重选后的保留语义 |
| DoV-4 未声称业务实现完成 | Pass | 本评审为 P2 记录 | 本表不替代 P4 实现与验证；实现及其测试证据记录在 P4 本地验证报告 |
| DoV-5 需求可追溯 | Pass | REQ-010 → `proposal.md` → `specs/trip-duration-input/spec.md` | AC-1 至 AC-4 均有对应 requirement/scenario；技术决策集中在 `design.md` |

## Residual concerns

- `origin/main` 已包含目的地选择能力，但当前工作分支无法在未暂存用户 `package-lock.json` 改动的情况下快进；实现前需以包含 `/cities` 的基线重新确认文件路径。
- 当前仓库没有 US-09 行程生成路由，因此 AC-3/AC-4 的完整浏览器端到端验证要由 US-09 接入时补齐；本 Change 只提供可读取的状态契约。
- `sessionStorage` 不承诺跨标签页、浏览器重启或会话结束后的恢复，这与最新需求口径一致。

## Review outcome

P2 文档层 AC/DoV 检查为 **Pass（规格层）**；不代表 G1 已批准，也不代表生产代码或测试已通过。
