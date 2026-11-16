# Local Verify Report: transport-pet-rules-comparison

**Date:** 2026-11-16 (timezone: +08:00)
**Root:** c:\code\pawtrip
**Scope:** local+evidence
**Change id:** transport-pet-rules-comparison

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Partial |
| Code review | Pass |
| Evidence (OpenSpec) | Partial |
| **Overall** | **Partial** |

**PR gate:** Overall 非 Pass → `/sdd:pr-submit` 不得直接执行；需先处理 W1/W2 或由 VL 出具显式裁决（本报告不提供 Waiver，Agent 不自签）。

## Local commands

白名单来源：`docs/feedback/verification-commands.md`（probe 生成 `docs/ai4se-plugins/20261116-123625-local-verify-commands.txt`），运行器日志 `docs/ai4se-plugins/20261116-123645-local-verify-run.log`。

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | Vite client+SSR 构建成功，`/transport-rules` 相关 chunk 正常产出 |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | `Tests run: 59, Failures: 0, Errors: 0`，`BUILD SUCCESS` |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | 1 | `28 passed (55.6s)` 全绿；命令退出码 1 由 `scripts/run-e2e.mjs` 清理临时 SQLite 时的 `EBUSY: resource busy or locked, unlink …pawtrip-e2e.db` 未捕获异常导致（见 W1） |

补充（非白名单命令，仅作事实记录，不计入 Pass 依据）：`bash scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured`（脚本为 bootstrap 占位，exit 0）；`bash scripts/verify-links.sh` 为 bootstrap 占位并 `exit 1`。

## Code-review highlights

审查范围：commit `441ed7e` 的 7 个文件（`data/transport-rules.ts`、`routes/_authenticated/transport-rules.tsx`、`__root.tsx`、`routeTree.gen.ts`、`e2e/transport-rules.spec.ts`、`tasks.md`、`atdd-design.md`）。

- [fact] 结构与规范贴合既有代码：页面沿用 `_authenticated/` 平级路由 + `ui/table|select|card|button` 组合，取数全部经导出纯函数，常量数组未外泄。
- [fact] 无安全问题：所有规则文本经 React 转义；8 条外链带 `target="_blank" rel="noreferrer"`；无 `dangerouslySetInnerHTML`、无动态 HTML 拼接。
- [fact] 可访问性：表格 `aria-label="交通携宠规则对比"`、航司下拉 `aria-label="选择航司"`、底部说明 `aria-label="规则说明"`，标题使用 `role="heading" aria-level={1}`。
- [fact] **W2**：档案入口文案「录入后可查看按宠物情况整理的提示」承诺了 US-06 能力，但 `/paws/profile` 当前无页面（实际落到 `notFoundComponent`），文案超前于已交付能力。
- [inference] **S3**：若规则目录暂时没有飞机记录，`rowRules` 会静默少一行且下拉显示占位文案「选择航司」，无空态提示；建议验证方式：临时清空 `flight` 记录后 `npm run build` + 目视页面。
- [fact] S1：`sources` 去重用 `findIndex`（O(n²)），8 条规模无影响，可后续改 `Map` 去重。
- [fact] S2：`SelectItem value={item.carrierCode ?? item.id}` 的兜底为死代码——`getFlightRules()` 已过滤 `carrierCode === null`。

## Evidence checklist

产物齐全（proposal / design / specs×3 / tasks / atdd-design / dov-ac-review / g1-decision），按 V1–V8 全量执行。

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Partial | [fact] | `tasks.md` 22 项中 21 项 `[x]`，仅 1.4 未勾选（4 条规则 `verifiedOn` 为空，见 W4）；4.1–4.3 本次已补齐 |
| V2 | Requirement coverage | Pass | [fact] | 12 条 requirement（page 6 / catalog 4 / shell 2）均在 `transport-rules.tsx`、`data/transport-rules.ts`、`__root.tsx` 找到实现锚点 |
| V3 | Scenario coverage | Partial | [fact] | 27 个 scenario 由 `e2e/transport-rules.spec.ts` 的 18 个用例分组覆盖（多用例断言多 scenario）；「不可状态」scenario 无对应数据（目录 8 条均为 allowed/conditional），记录为数据缺省 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 四行表格/列配置/状态映射/航司下拉/底部四类说明/档案入口/守卫逐条可定位到行级实现 |
| V5 | Spec drift | Partial | [fact] | 页面档案入口文案超出 spec 的「仅预留入口」意图（W2）；其余实现与规格一致 |
| V6 | Design follow-through | Pass | [fact] | D1 常量唯一真源、D2 字段与 `extra`/可空体重/复核门禁、D3 列配置+行内 Select+局部 state、D4 AppTabs 精确匹配、D5 未做接口预留——均与设计一致；D5「行级不推荐位置」未渲染，符合非目标 |
| V7 | Code pattern fit | Pass | [inference] | 命名、目录、导入风格与 `_authenticated/index.tsx`、`cities` 等既有页面一致；`routeTree.gen.ts` 仅由插件生成 |
| V8 | Upstream basis | Pass | [fact] | 变更文件均可在 tasks（1.x/2.x/3.x/4.x）或 design（D1–D4）找到依据；`routeTree.gen.ts` 属 3.5 明确要求；`docs/knowledge/domain/transport-pet-rules.md` 属 4.1 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Partial | 本次本地白名单：2 条 exit 0，1 条测试全绿但 exit 1（W1）；无 `ci-report.md` |
| E2 AI | Partial | 本报告（V1–V8、五问映射、代码审查要点） |
| E3 Human | Pending | 需人工完成 1.4 规则复核并对本报告 findings 作出响应；Agent 不自签 |

## Five-question map (when evidence in scope)

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ⚠️ 实现完整，但 1.4 复核门禁未闭合；「不可」态无数据 |
| Q2 Correct? | V4–V5 | ⚠️ 行为符合规格，仅档案入口文案超前（W2） |
| Q3 Coherent? | V6–V7 | ✅ 设计与实现一致，风格贴合既有代码 |
| Q4 Necessary only? | V8 | ✅ 无越界改动 |
| Q5 Risk controllable? | 残余风险 + 红线 | ⚠️ 规则时效性与本地 E2E 退出码需跟踪；无安全红线问题 |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| W1 | `CI=true npm run test:e2e` 测试全绿但命令退出 1：`scripts/run-e2e.mjs` 在清理临时目录时 `rm` 命中 Windows 文件锁 `EBUSY` 并抛出未捕获异常 | [fact] | `scripts/run-e2e.mjs`（cleanup 段） | 用户 2026-11-16 决定本次不修改，记为 Partial；建议另起改动为 `rm` 增加 `maxRetries/retryDelay` 或容错，避免本地/CI 误判 |
| W2 | 档案入口文案「录入后可查看按宠物情况整理的提示」声明了未交付的 US-06 能力，且 `/paws/profile` 当前无页面 | [fact] | `apps/web/src/routes/_authenticated/transport-rules.tsx` 档案入口 section | 已改为中性文案「宠物档案能力稍后提供：此处为后续按宠物情况比对预留入口。」（**2026-11-16 已修复并复验**，见文末「报告后修复」） |
| W4 | `tasks.md` 1.4 未闭合：火车、海航托运、海航客舱、自驾 4 条规则 `verifiedOn` 为空 | [fact] | `apps/web/src/data/transport-rules.ts`、`tasks.md#1.4` | 合并前由人工按 deep-dive D1–D8 复核并填日期；页面已显示「待复核」，不会静默发布 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| S1 | 来源去重使用 `findIndex` 二次遍历 | [fact] | `transport-rules.tsx` `sources` 计算 | 规模变大时改 `Map`/`Set` 去重 |
| S2 | `SelectItem value` 的 `?? item.id` 兜底不可达 | [fact] | `transport-rules.tsx` 航司下拉 | 可简化为 `item.carrierCode`（配合 `getFlightRules` 的类型收窄） |
| S3 | 目录无飞机数据时表格静默少一行且无空态提示 | [inference] | `transport-rules.tsx` `rowRules` | 增加「该方式规则暂缺」占位行；验证方式：临时清空 flight 记录后跑 build 目视 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 4 条规则未人工复核 | 需人工核对官方来源，Agent 不得代填日期 | tracking（W4，合并门禁） |
| 2 | 规则时效性（高铁试点扩围、航司政策调整） | 静态常量不会自动更新 | accepted（`verifiedOn` + 页面免责声明 + 一次常量变更即可更新） |
| 3 | 本地 E2E 命令退出码非 0 | 清理逻辑缺陷，用户决定本次不修 | tracking（W1） |
| 4 | 前端常量与 US-06 后端阈值可能形成两套数据 | 后端取值方式留待 US-06 决定 | tracking（以 `id` + `weightLimitKg` 为迁移锚点） |
| 5 | 验证期间发现仓库处于外部触发的交互式 rebase 中途（base 已包含宠物档案后端 V8–V10 提交，`routeTree.gen.ts` 冲突） | 非本次任务操作，`stash@{0}` 保存了另一会话的 WIP（`routeTree.gen.ts`/`handoff.md`/`registry.md`） | 已 `git rebase --abort` 回到 `441ed7e` 并保留 stash；同步/合并策略需人工确认后再执行 |

## Waiver

N/A — no waiver（Overall=Partial 且无人签署豁免；本报告不构成放行）。

## 报告后修复（2026-11-16）

| # | 处理 | 证据 |
|---|------|------|
| W2 | 档案入口文案改为中性表述，不再声明未交付的 US-06 能力 | `apps/web/src/routes/_authenticated/transport-rules.tsx`；复验 `npm run build` exit 0、`npm run test:e2e` 28 passed（36.4s，仍伴随 W1 的 EBUSY 清理异常） |

修复后仍未闭合：W1（E2E 退出码，用户决定本次不修）、W4（4 条规则待人工复核，合并门禁）。Overall 维持 Partial。

## 合并主干后复验（`cac27a3`）

`origin/main` 已含宠物档案后端（PR #33/#34：`Pet`/`PetRepository`/`PetType`、迁移 V8–V10、`PetSchemaMigrationTest`）。按用户选择以 merge 方式同步，冲突仅 `routeTree.gen.ts`：先取主干版本保证语法有效，再由 `npm run build` 的插件按合并后路由重新生成（结果 = 主干版本 + `/transport-rules` 两条路由条目），未手改。

| Command | Exit | Summary |
|---------|------|---------|
| `npm run build` | 0 | 构建成功（含 `/transport-rules` chunk） |
| `cd apps/server && ./mvnw test` | 0 | `Tests run: 63, Failures: 0, Errors: 0`，BUILD SUCCESS（新增 4 条 `PetSchemaMigrationTest`） |
| `npm run test:e2e` | 1 | `28 passed (36.1s)`；退出码 1 仍为 W1 的 EBUSY 清理异常 |

结论：合并后无新增缺陷，W1/W4 状态不变，Overall 维持 Partial。
