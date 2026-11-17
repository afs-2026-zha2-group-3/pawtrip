# Local Verify Report: 2026-11-17-export-itinerary-pdf

**Date:** 2026-11-17 (timezone: +0800)
**Root:** c:\code\pawtrip
**Scope:** local+evidence
**Change id:** 2026-11-17-export-itinerary-pdf

基线：`origin/main @ 966257c`（已 merge 入 feature 分支，merge 提交主题「merge: 合并 origin/main 最新代码（UI 改版）入 feature 分支」）；分支当前 tip 以 `git log` 实时核对，不在本文硬编码。注意：main 其后又前进至 e1a9829（PR #78），尚未合入本分支，见残余风险。

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Pass |
| Code review | Pass |
| Evidence (OpenSpec) | Partial |
| **Overall** | Fail（唯一 CRITICAL 为 6.8 人工证据缺口，已由完整 Waiver 覆盖） |

**PR gate:** Overall=Fail，但下方 Waiver 四要素齐全并经 tantine 明确签署 → 人工可继续 `/sdd:pr-submit`。Agent 未自批豁免。

## Local commands

白名单来源：`docs/feedback/verification-commands.md`（probe FOUND 3 条）。
Runner 日志：`docs/ai4se-plugins/20261117-222109-local-verify-run.log`（commands_attempted:3 / commands_failed:0）。

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | SSR/客户端构建成功，产物正常输出 |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | Tests run: 243, Failures: 0, Errors: 0, Skipped: 0 |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | 0 | **166 passed / 0 failed**（5.2m）；临时 SQLite 库，开发库 `apps/server/data/pawtrip.db` 未被修改 |

补充 agent 检查（非白名单，作为佐证）：

| 检查 | 结果 |
|------|------|
| `npx tsc --noEmit`（apps/web） | exit 0 |
| e2e 改动文件 tsc（--types node --strict） | exit 0 |
| `npm test -w apps/web -- --run` | 29 文件 / 211 项通过 |
| `npx --no-install openspec validate 2026-11-17-export-itinerary-pdf --strict` | valid |

首轮全量（日志 20261117-215356）曾 11 失败，根因与修复见 Code-review highlights；修复后本轮全量复验通过。

## Code-review highlights

本轮工作树改动 4 文件（合并回归修复），逐项评审：

- `apps/web/src/routes/_authenticated/cities.tsx`：首轮合并 resolving 时丢失 REQ-014 推荐集成，本轮在 main 新版卡片 UI 上重新接入 `sortByRecommendation`（渲染前排序，profile 晚到自动重排）与 `scoreCity`（score>0 渲染「系统推荐」Badge，aria-label 同名）。徽标位于卡片右上角封面图区域，不遮挡标题/省份/政策标签；与 Pick 按钮（top-[106px]）无重叠。符合 delta spec「候选个性化推荐排序」「推荐徽标」要求。
- `e2e/city-personalized-recommendation.spec.ts`：该套件提交时标注「待用户手动运行」，从未实际执行，暴露 3 类潜在缺陷并已修正：① 同分排序断言误用 zh-Hans-CN 拼音序，规格要求「同分维持服务端名称升序」（SQLite BINARY 码位序），改为确定性码元比较；② 命中集合漏推导桂林(MOUNTAIN,LAKE)、无锡(LAKE)、西宁/银川(LAKE,GRASSLAND)，按 V27 种子补齐（SWIM 24 城 / CALM 19 城）；③ 「北京市」仅省级种子不在候选，改用广州作未命中对照。另适配新版 UI：卡片标题 h2、Pick 按钮、内联宠物档案视图。
- `e2e/intra-city-transport.spec.ts`：main 新行程面板的景点排序列表（animated-list）合法暴露 `role=option`，全局选项断言误匹配；新增 `modeOptions` 将断言限定在 `[data-slot="select-content"]` 弹层内，并在读取前等待弹层挂载（allTextContents 无重试）。UI 语义无缺陷，属测试定位过宽。
- `e2e/itinerary.spec.ts`：main 合法更新高铁规则唯一真源文案（容器/流程），delta spec 仅要求「规则 MUST 取自 transport-rules 唯一真源」未锁定措辞，导出断言对齐现值。

合并解决遗留核对：transport-rules 对比页已按 Living Spec「2026-11-17 精简」移除复核统计/页头描述/逐行复核日期/自驾重复小字（首轮合并时处理，本轮全量 E2E 20 项再次验证）。

## Evidence checklist

产物齐全（tasks + specs + design + atdd + alignment + dov + summary + git diff）→ V1–V8 全量执行。

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | 任务完成度 | Partial | [fact] | tasks.md 34 项 [x]，仅 6.8「真实 Chrome 打印预览人工记录」[ ]；DoV-9 明确「未执行」 |
| V2 | 需求覆盖 | Pass | [fact] | 4 个 ADDED 需求均有实现：导出 PDF（itinerary.tsx printing 态 L85–99）、政策展开与规则卡（L208、TransportRuleCard L457）、打印隐藏外框（styles.css L282–312、__root/trip-panel print:hidden/data-print-hidden）、导出图片（lib/trip/export-image.ts、itinerary.tsx L216–226） |
| V3 | 场景覆盖 | Partial | [fact] | 12 Scenario 中 11 个有 E2E 对应（itinerary.spec.ts 15 用例全通过）；「打印输出不含浏览器默认页眉页脚」headless 无法断言，人工 Pending（6.8） |
| V4 | 需求↔实现映射 | Pass | [fact] | alignment-self-check.md Scenario 级映射表逐条核对一致；双 rAF 后 window.print、afterprint 复位、details open、@page 空边距盒、1080px PNG 均与 spec 措辞吻合 |
| V5 | 规格漂移 | Pass | [fact] | 未发现实现偏离；E2E 措辞断言已对齐唯一真源（非漂移）；transport-rules 精简以 Living Spec 为准 |
| V6 | 设计落实 | Pass | [fact] | design D1–D5 逐条落地（打印方案/全量天数/打印专用规则卡/页边距盒/数据只读）；图片导出复用同一视图不按天拆分（AC-2） |
| V7 | 代码模式契合 | Pass | [fact] | 复用既有 Select/Badge/Card 组件与 queryOptions 模式；测试沿用 trip-helpers 与既有断言风格 |
| V8 | 必要性（反蔓延） | Pass | [fact] | 本轮 diff 仅 4 文件，均属合并回归修复；变更整体 diff 对应 tasks 1–7 与合并 main 所需解决，无未标记蔓延 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Partial | 本地白名单 3 命令全 Pass（20261117-222109 日志）；远程 CI 待 PR 创建后由 `/sdd:pipeline-report phase=ci` 回填 |
| E2 AI | Pass | 本报告（V1–V8 + 代码评审）；无 eval 报告需求 |
| E3 Human | Pending（6.8 已豁免签署） | 6.8 真实打印预览记录仍待执行，tantine 已签 Waiver；G2 VL 决定尚未记录，不代签 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 完整实现？ | V1–V3 | ⚠️ 自动化范围完整；6.8 人工证据 Pending（已豁免） |
| Q2 正确实现？ | V4–V5 | ✅ |
| Q3 架构一致？ | V6–V7 | ✅ |
| Q4 仅做所需？ | V8 | ✅ |
| Q5 风险可控？ | 残余 + 红线 | ⚠️ 见残余风险；页眉页脚浏览器依赖已明示并有豁免期限 |

## Findings

### CRITICAL

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 6.8 真实 Chrome 打印预览人工记录未完成，页眉页脚抑制（MUST NOT）缺人工证据，Overall 不得 Pass | [fact] | openspec/changes/2026-11-17-export-itinerary-pdf/tasks.md 6.8；dov-ac-review.md DoV-9 | 已列入 Waiver：PR 合入前（2026-11-24）由 tantine 完成记录（Chrome 版本、页眉页脚开关、预览结果） |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | REQ-014 E2E 套件以「待用户手动运行」提交、长期未执行，积累 3 类断言缺陷 | [fact] | e2e/city-personalized-recommendation.spec.ts（提交 a59c32f 说明） | 本轮已修正并全量跑通；后续新增 E2E 应在提交前至少执行一次 |
| 2 | main 已前进至 e1a9829（PR #78）未合入；其 V26__seed_city_policy_public_data.sql 与本分支 V26__add_pet_preferences_personality.sql 版本号冲突 | [fact] | apps/server/src/main/resources/db/migration/ | PR 合入前需再次 merge main 并将本分支 V26 重编号为 V28（V27 已占用），重跑验证 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 无 | — | — | — |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 页眉页脚抑制依赖浏览器支持 CSS 页面边距盒（Chrome 131+） | 6.8 人工记录未完成 | Waiver 跟踪（tantine，2026-11-24）；不支持的浏览器需用户手动关闭页眉页脚（design Risks 已明示） |
| 2 | 与 main 最新提交的 Flyway V26 版本冲突 | 第二轮 main 同步未执行 | 合入前 merge + V26→V28 重编号 + 复验（WARNING #2） |
| 3 | 图片导出 DOM 体积/CORS 边界 | design 已列风险，E2E 覆盖正常与失败路径 | 失败提示「图片导出失败，请重试」并恢复页面（已验证）；tracking |

## Waiver

| Item | Owner (VL\|designated) | Remedy deadline | Human sign-off |
|------|------------------------|-----------------|----------------|
| 6.8 真实 Chrome 打印预览人工记录（版本、页眉页脚开关、预览结果）；完成前页眉页脚项保持 Pending | tantine（指定负责人） | 2026-11-24（PR 合入前） | tantine 于 2026-11-17 在交互问答中明确选择「签署豁免并提交 PR」并署名 tantine |

**Agent must not self-approve this section.** 本 Waiver 四要素齐全，由人工签署；Agent 仅记录。

## 补记：第二轮 main 同步（2026-11-17 晚）

- 同步 `origin/main @ f351bbd`（PR #78 城市政策侧栏+分页、PR #92 侧栏紧凑化）；唯一冲突 `cities.tsx` 已解决：保留 main 分页布局（PAGE_SIZE=9），重新接入 REQ-014 打分排序与「系统推荐」徽标。
- Flyway 冲突已解决：本分支 `V26__add_pet_preferences_personality.sql` 重编号为 **V28**（main 的 V26 公开政策种子保留；本分支 V27 特征标签不变）；change 文档（design/tasks/proposal/atdd）与 `docs/knowledge/interfaces/http-api.md` 引用同步更新。
- REQ-014 E2E 适配分页：排序/徽标断言改为遍历全部页累计（翻页以页码指示文本变化为等待条件），目标卡片逐页定位。
- 本地开发库经用户同意**备份后重建**（旧库保留为 `apps/server/data/pawtrip.db.bak`）：消除旧 V26 校验和冲突导致的 `contextLoads` 失败（即 main PR #78 文档预告的开发库重建项）。
- 复验证据：白名单日志 `20261117-224339-local-verify-run.log`（build exit 0；全量 E2E **173 passed / 0 failed**，含 main 新增 7 例；开发库未被 E2E 修改）；服务端重建后重跑 `mvnw test` **243/243 BUILD SUCCESS**（首轮因开发库校验和冲突 Fail，重建后转绿）；web/e2e tsc exit 0；定向套件 66/66。
- **WARNING #2（main 未同步 / V26 冲突）已解决**；CRITICAL #1（6.8 人工打印预览）与 Waiver 不变，Overall 维持 Fail（待 6.8 补齐或豁免期限内完成）。