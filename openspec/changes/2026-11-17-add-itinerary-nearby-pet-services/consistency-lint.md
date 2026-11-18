# Consistency Lint — add-itinerary-nearby-pet-services

- 日期：2026-11-17
- phase：p2（Delta 与 Living Spec 一致性；未进入 G1）
- 范围：`openspec/changes/2026-11-17-add-itinerary-nearby-pet-services/` 与 `openspec/specs/trip-attractions/spec.md`
- 工具：`openspec validate "2026-11-17-add-itinerary-nearby-pet-services" --strict` → valid

## Findings

| id | severity | phase | location | issue | suggested_fix | evidence | authority |
|---|---|---|---|---|---|---|---|
| L1 | WARNING | p2 | `specs/trip-attractions/spec.md`（MODIFIED「景点列表政策字段与逐宠物 tag」） | Living Spec 已包含医院/用品店免筛选文本（PR #75 直接修改），本 change 用 MODIFIED 对齐；归档为同文替换，属重复维护 | 保留 MODIFIED 以便 change 归档可追溯；P5 归档时确认无文本冲突 | `git show f160d71 -- openspec/specs/trip-attractions/spec.md` | [fact] |
| L2 | WARNING | p2 | `specs/trip-attractions/spec.md`（ADDED「行程景点附近宠物服务」） | Living Spec 尚无该 requirement，代码与测试已实现；规格落后于实现 | 归档时由 `living-merge` 合并 ADDED requirement | `grep -n "附近宠物服务" openspec/specs/trip-attractions/spec.md` 无结果 | [fact] |
| L3 | SUGGESTION | p2 | `atdd-design.md` | 无专用 E2E 场景，附近服务仅组件 UT + API 测试 | 后续若扩展电话/导航或多候选，再补 E2E | `atdd-design.md` §5 | [inference] |
| L4 | SUGGESTION | p2 | `tasks.md` | 本 change 为倒推登记，任务顺序不代表实际执行顺序 | 无需修改；在 change-summary 与 registry 说明 | 提交 `f160d71` 时间早于本 change 创建 | [fact] |

## 交叉检查

| Check | Result | Notes |
|---|---|---|
| Proposal ↔ Delta | Pass | ADDED 1 项 + MODIFIED 2 项与 proposal 的 Modified Capabilities 一致 |
| Delta ↔ Design | Pass | 每个 requirement 均有 D1–D7 决策 |
| Delta ↔ Tasks | Pass | 7 + 11 场景均由 1.x–5.x 任务承接 |
| Living ↔ Delta 命名 | Pass | capability 名 `trip-attractions` 一致；requirement 标题与 Living 一致（MODIFIED） |
| 术语一致 | Pass | “宠物医院”“宠物用品店”“不限宠物”“允许所有宠物”前后一致 |
| 迁移/依赖声明 | Pass | proposal、design、atdd 均声明零迁移、零新依赖 |

## Residual risks

- Living Spec 与代码在 PR #75 后已经同步了免筛选语义；本 change 的 MODIFIED 属追溯性记录，需在归档时确认不会产生重复 requirement。
- ADDED「行程景点附近宠物服务」在归档前不属于 Living Spec authority。

## Verdict

**Partial**（2 WARNING，无 BLOCKER）。WARNING 均为“规格落后于实现/追溯性重复维护”，由 P5 归档解决；本报告不是 Gate 决议。
