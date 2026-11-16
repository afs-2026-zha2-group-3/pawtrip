# Change summary — add-rule-recommendation-and-selection

- Change id: `add-rule-recommendation-and-selection`（REQ-008 / US-06 前置；原登记 REQ-007，2026-11-16 规则页需求改为 REQ-007 后顺延为 REQ-008）
- Archived: `openspec/changes/archive/2026-11-16-add-rule-recommendation-and-selection/`

## Intent

规则页已经能列出四类交通方式的携宠规则，但用户仍需自己逐条比对「我的宠物能不能坐」。本 change 把比对自动化：按已录入的宠物档案（体重、肩高、检疫证明）逐只给出「符合 / 不符合 + 原因」，并允许在页面上选定一种交通方式，为后续行程单（US-06）提供输入。

## What shipped

- **Living Spec 合并（1 个 capability，+2 requirements）**
  - `transport-rules-comparison-page`：更新，+2 requirements（按档案逐只推荐判定与原因展示、交通方式单选与 `sessionStorage` 缓存契约）
- **代码（纯前端；后端零改动，复用主干 `480b95a` 的 `GET /api/pets`）**
  - `apps/web/src/data/transport-rule-match.ts`：纯函数判定（体重 + 肩高 + 检疫证明三项硬条件），逐只返回结论与原因
  - `apps/web/src/routes/_authenticated/transport-rules.tsx`：新增推荐列与「选择」列；单选互斥，选中值写入 `sessionStorage(pawtrip:selected-transport-mode)`；无档案时隐藏推荐列并给「新增宠物档案」入口跳 `/paws`
  - `scripts/seed-users.mjs`：新增验收账号 `petowner`（带档案），`demo` / `admin` 保持无档案以覆盖空态
- **PR**：#46 → 合并入 `main`（merge commit `39d0f2a`；base 已由 `feat/transport-rules-comparison` 改为 `main`）
- **KB update**：Skipped（not configured）— `scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured for this project.`（exit 0），按本仓既有做法视为非阻塞 SKIP；**不声称** KB lint / `_INDEX.md` 编译 / 一致性已通过

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 本地验证（Overall） | **Partial** — V1/V2/V4–V8 Pass，V3 Partial（1 个失败态 scenario 缺自动化） | `docs/ai4se-plugins/20261116-133200-local-verify-report.md` |
| 前端单测 | vitest 28 passed → 合并 REQ-007 后 **45 passed**（8 files） | 本次归档前本地执行 |
| 后端测试 | `mvnw test` 75 tests BUILD SUCCESS（未改动后端，回归验证） | 同上 |
| E2E | 35 passed（退出码 1 为 REQ-007 遗留 `EBUSY`，非断言失败） | `e2e/rule-recommendation-and-selection.spec.ts` |
| CI（E1） | **10/10 job success**（三轮 push run：Web / E2E / Server） | `docs/ai4se-plugins/20261116-143430-pipeline-report.md` |
| OpenSpec validate | `--specs` 16 passed / 0 failed | 归档执行后校验 |
| G2 | Conditional Pass（VL=kitty），1 项条件闭合、2 项延后 | `g2-decision.md` |

## Residual risks

1. **失败态无自动化**：「档案加载失败」分支（`page.route` 拦 `/api/pets` 返回 5xx）没有 E2E 覆盖，V3 因此记 Partial；条件已指定在档案页落地时补。
2. **`weightKg` / `shoulderHeightCm` 空值未在前端兜底**：依赖 DB 非空约束；后端字段放宽时需同步补前端保护（已登记为延后条件）。
3. **`staleTime` 60s 无失效入口**：档案变更后推荐列最多延迟 1 分钟更新，当前无手动刷新入口。
4. **E2E 锚定种子宠物名**：种子数据改名会连带改测试。
5. **流程缺口**：本 change 无独立 `g1-decision.md` / `atdd-design.md` / `dov-ac-review.md`（作为 REQ-007 的追加需求提出，随 REQ-007 的 G1 一并处理，未单独留痕）。

## Links

- 归档工件：本目录 `proposal.md` / `design.md` / `tasks.md` / `g2-decision.md` / `specs/`
- Living Spec：`openspec/specs/transport-rules-comparison-page/`
- PR #46：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/46（合并 commit `39d0f2a`）
- 流水线报告：`docs/ai4se-plugins/20261116-143430-pipeline-report.md`
- 需求登记：`requirement-workspace/registry.md`（REQ-008）
