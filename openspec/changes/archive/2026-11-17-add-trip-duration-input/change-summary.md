# Change summary — add-trip-duration-input

- Change id: `add-trip-duration-input`（REQ-010「输入旅游总天数」）
- Archived: `openspec/changes/archive/2026-11-17-add-trip-duration-input/`
- 归档性质: **Superseded 补录归档**。实现于 2026-11-16 经 PR #54 合并（CI 全绿），随后被 active-trip 架构取代；change 包曾被 `f3aab3e`（Echo Luo）删除，2026-11-17 自 `25060a4` 恢复并补齐 P4/P5 记录后归档。

## Intent

用户在选定目的地后输入旅游总天数（1–7，默认 1），为行程生成提供明确的天数边界；景点区域按总天数提供「第 1 天」至「第 N 天」的按天浏览。原方案为纯前端 `sessionStorage` 会话状态。

## What shipped

- **原实现（PR #54，merge commit `1871995`，2026-11-16）**
  - `apps/web/src/lib/trip-duration.ts`：1–7 整数校验、`sessionStorage(pawtrip.tripDuration)` 读写/覆盖、非法值不覆盖合法值、读取返回 `number | null`
  - `/cities` 候选列表前的天数步进器（默认 1、选定按钮守卫、边界/非法提示、刷新恢复）
  - `/attractions` 横向「第 1 天」至「第 N 天」Tabs
  - 单测 98 行 + `e2e/trip-duration-input.spec.ts` 5 场景
- **取代演进（PR #55–#58，2026-11-16）**
  - PR #55：服务端 trip-planning，`totalDays` 落库（`POST/PUT /api/trips`，≥1 整数、不得小于计划最大 day）
  - PR #56：前端 trip-context（TanStack Store，浏览器端只持久化 `activeTripId`）
  - PR #57：景点浏览按天选择器（「添加到行程」覆盖 `1..active.totalDays`）
  - PR #58：交通方式写入激活行程
  - 原 `trip-duration.ts` 与 `/cities` 步进器移除；天数输入现为行程面板「行程天数」（草稿 1–7）；`e2e/trip-duration-input.spec.ts` 改写为草稿/行程面板口径
- **Living Spec 合并：无（superseded，deltas 不合并）**
  - `trip-duration-input` capability 不建立：会话存储方案已被服务端 `totalDays` 取代
  - `destination-selection` delta 不合并：所述步进器契约已被现行主 spec 的草稿流程取代（sync-blocked，MODIFIED 块与现行 5 场景不一致）
  - 取代后行为已由现行 `trip-planning` / `trip-context` / `trip-attractions` / `destination-selection` Living Spec 覆盖，归档后 `openspec validate --specs` **23 passed / 0 failed**
- **KB update**: Skipped（not configured）— `scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured for this project.`（exit 0），按 `scripts/README.md` 基线策略记为非阻塞 SKIP；**不声称** KB lint / `_INDEX.md` 编译已通过

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 本地验证（Overall，2026-11-16） | **Pass**（V1–V8；E1/E2 Pass） | `docs/ai4se-plugins/20261116-185448-local-verify-report.md` |
| 前端单测/类型/构建 | Vitest 11 文件 67 用例、tsc、Vite client/SSR 均 exit 0 | 同上 |
| 目标 E2E | 5/5（默认 1 天、守卫、边界、非法保护、刷新恢复） | 同上 |
| 回归 E2E | 目的地 15 passed/4 skipped；CI 模式全量 80 passed | 同上 |
| CI（E1，PR #54） | 4/4 job success（Web build ×2、Browser E2E ×2；纯前端无 Server job） | runs `43853283240`/`43853795335`/`43853283329`/`43853795240` |
| OpenSpec validate | 恢复时 strict 校验报 destination-selection delta 与现行 spec 不一致（superseded 预期）；归档后 `--specs` 23 passed / 0 failed | 本次归档执行记录 |
| G1 | Pass（IO=Kitty Su，SA=HARLAN，2026-11-16） | `g1-decision.md` |
| G2 | Pass（补录，VL=HARLAN HUANG，2026-11-17） | `g2-decision.md` |
| G3 | Pass（补录，SA=HARLAN HUANG，2026-11-17） | `g3-decision.md` |

## Residual risks / follow-ups

1. 原 US-09 下游读取契约与必填守卫 follow-up 已由 active-trip 架构承接关闭；行程生成入口的必填引导现由草稿确认流程承担。
2. 本 change 的 delta specs 仅作历史证据保留在归档目录，**不得**再合并入 Living Spec。
3. 流程教训：change 被取代时应走 superseded 归档留痕，而非直接删除 change 包（本次补录即为此缺口）。

## Links

- 归档工件：本目录 `proposal.md` / `design.md` / `tasks.md` / `atdd-design.md` / `dov-ac-review.md` / `g1-decision.md` / `g2-decision.md` / `specs/`
- PR #54：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/54（merge commit `1871995`）
- 删除提交：`f3aab3e`（docs(openspec): align remaining changes and archive）
- 恢复来源：`25060a4`（feat: add trip duration and day tabs）
- 本地验证报告：`docs/ai4se-plugins/20261116-185448-local-verify-report.md`
- 需求登记：`requirement-workspace/registry.md`（REQ-010）