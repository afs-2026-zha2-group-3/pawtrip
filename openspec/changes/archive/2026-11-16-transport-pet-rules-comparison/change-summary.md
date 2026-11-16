# Change summary — transport-pet-rules-comparison

- Change id: `transport-pet-rules-comparison`（REQ-007 / US-05；原登记 REQ-006，2026-11-16 因 main 已占用 REQ-006 而改号）
- Archived: `openspec/changes/archive/2026-11-16-transport-pet-rules-comparison/`

## Intent

让带宠出行的人在选交通方式前就能看到高铁 / 航班 / 自驾 / 火车四类方式的携宠规则差异，避免逐家官网翻查。原需求为「对比四种交通方式的携宠规则」（US-05），核心诉求是**一屏可比**：四行交通方式、四列基础维度、飞机行按航司切换，并标注每条规则的官方来源与人工复核日期。

## What shipped

- **Living Spec 合并（3 个 capability，共 +12 requirements）**
  - `transport-rules-catalog`：新建，+4 requirements（规则目录内容契约、航司分行、来源与复核日期、列可扩展）
  - `transport-rules-comparison-page`：新建，+6 requirements（页面结构、飞机行航司切换、来源披露、复核状态、无数据提示等）
  - `web-app-shell`：更新，+2 requirements（顶部「交通规则」Tab 入口、登录守卫）
- **代码（纯前端，后端零改动）**
  - `apps/web/src/data/transport-rules.ts`：规则目录常量（前端写死，不建规则表与 API）
  - `apps/web/src/routes/_authenticated/transport-rules.tsx`：四行表格 + 飞机行 `Select` 航司切换 + 来源/复核状态
  - `apps/web/src/routes/__root.tsx`：`AppTabs` 新增「交通规则」入口（`/transport-rules`）
- **PR**：#45 → 合并入 `main`（merge commit `e1169b4`）
- **KB update**：Skipped（not configured）— `scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured for this project.`（exit 0），按本仓既有做法视为非阻塞 SKIP；**不声称** KB lint / `_INDEX.md` 编译 / 一致性已通过

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 本地验证 | Pass（前端 17 / 后端 63 / e2e 32） | `docs/ai4se-plugins/20261116-143011-local-verify-report.md` |
| 合并 main 后复验 | build OK；vitest **39 passed**（7 files） | 本次重排合并后的本地执行 |
| CI（E1） | **10/10 job success**（三轮 push run：Web / E2E / Server） | `docs/ai4se-plugins/20261116-143430-pipeline-report.md` |
| OpenSpec validate | `--specs` 16 passed / 0 failed | 归档执行后校验 |
| G1 | Pass（IO/SA=kitty，2026-11-16） | `g1-decision.md` |
| G2 | Conditional Pass（VL=kitty），条件已全部收口 | `g2-decision.md` |

## Residual risks

1. **窄屏 Tab 布局未经目视**：5 项 Tab 在 ≤375px 下是否换行过密/横向溢出未被验证，需求方 2026-11-16 决定记为 accepted waiver；兜底为 E2E 已覆盖导航与守卫，若出问题只需调整排序/文案。
2. **规则时效性**：高铁试点扩围、航司政策调整会使前端常量过期；靠 `verifiedOn` + 页面免责声明 + 一次常量变更响应。
3. **规则复核方式**：以官方页面摘要比对为主（官网 405 / TLS 超时），发布前建议人工目视一次关键行。
4. **`npm run test:e2e` 退出码 1**（临时 SQLite 清理触发 `EBUSY`）：需求方已知并接受，证据以 `32 passed` 为准。
5. **需求编号两次重排**（REQ-005→006→007）：历史 commit message 保留旧编号，未改写历史。

## Links

- 归档工件：本目录 `proposal.md` / `design.md` / `tasks.md` / `atdd-design.md` / `dov-ac-review.md` / `g1-decision.md` / `g2-decision.md` / `specs/`
- Living Spec：`openspec/specs/transport-rules-catalog/`、`openspec/specs/transport-rules-comparison-page/`、`openspec/specs/web-app-shell/`
- PR #45：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/45（合并 commit `e1169b4`）
- 流水线报告：`docs/ai4se-plugins/20261116-143430-pipeline-report.md`
- 需求登记：`requirement-workspace/registry.md`（REQ-007）
