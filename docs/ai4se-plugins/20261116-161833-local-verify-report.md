# Local Verify Report: destination-selection（宠物友好叠加匹配增强）

**Date:** 2026-11-16 (timezone: +0800)
**Root:** D:/code/pawtrip
**Scope:** local+evidence
**Change id:** destination-selection

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** Fail blocks `/sdd:pr-submit` unless Waiver below is complete.
Agents must not self-approve Waiver.

Static scan Skipped 原因：白名单未含 SAST/SCA 命令，仓库 CI 也未配置扫描作业（治理残余风险，见 pipeline 报告）；远端 CI 将在 PR 上执行 build/test。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | Vite 8 构建成功（合并 main 后） |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | 全量 clean test：tests=105 errors=0 skipped=0 failures=0（含 destination 12 用例、队友 DogBreedSchemaMigrationTest 种子基线适配） |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | 0 | Playwright Chromium：54 passed + 4 skipped（E4/E6/E10/E11 fixme 门控），含新增 E17/E18 与 main 新增 admin-city/rule-recommendation 用例 |

Runner log：`docs/ai4se-plugins/20261116-161549-local-verify-commands.txt` 对应 run log（build/mvn 已 PASS；E2E 复核与上述全量运行同树）。
补充验证：`npx vitest run`（apps/web）54 passed；`npx tsc --noEmit` exit 0；`npx openspec validate destination-selection --strict` → valid。

## Code-review highlights

- 四层叠加筛选（限养数 AND 类型 AND 品种 AND 肩高）：类型 null=不允许（需求方 2026-11-16 修订）；品种空列表/肩高 null=未配置放行；`petType` 枚举绑定非法自动 400；匹配输入由前端传参，destination 模块不读 pet 仓库（仅共享 PetType/DogBreed 类型，与 location 模块既有引用一致）
- `@EntityGraph` 派生查询一次性抓取允许品种（open-in-view=false），与 main PR #47 新增仓库方法合并共存
- V16 全城市种子：`level='city'` 统一 CAT,DOG + 7 非烈性品种（含哈士奇，V13 标记 0）；`INSERT OR IGNORE` 幂等；V15 空缺（PR #43 遗留，已被无迁移的 PR #47 取代）
- 前端 `matchesCityPetPolicy` 与服务端同语义；Badge 绿 green-600/红 destructive（主题无 success 令牌，需求方指定绿色）；无档案不渲染标签；选定按钮再点 `store.clear()` 取消
- E2E E17 用 admin 账号建宠避免与 demo 的 paws/规则用例并行干扰；node:sqlite 配置政策数据，finally 恢复 V16 种子口径；run-e2e.mjs 暴露 PAWTRIP_E2E_DB_PATH
- 合并适配：队友 DogBreedSchemaMigrationTest 计数断言改为种子基线相对值（最小改动，保留原意图）；dev 库旧 V16 checksum 记录清除后幂等重放（本地运行产物，不入库）
- Non-goal 反向验证：diff 20 文件未改 `/paws`、pet 模块业务代码与认证契约

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | tasks.md 组 1–6 全勾选；组 7（7.1–7.6）增强任务全勾选 |
| V2 | Requirement coverage | Pass | [fact] | 两份 delta 共 15 条 requirement（destination-selection 9 + web-app-shell 6），均有实现证据 |
| V3 | Scenario coverage | Pass | [fact] | 48 个 scenario 对照 A1–A12（API）与 E1–E18（E2E）；E4/E6/E10/E11 显式 fixme（仅剩政策数据源 TODO，breed 已交付） |
| V4 | Requirement↔impl mapping | Pass | [fact] | 叠加匹配→DestinationController+DestinationApiTest（类型/品种/肩高/非法参数/种子）；匹配标签→matchesCityPetPolicy+Badge+E17；取消选定→handleSelect toggle+E18；其余沿用 PR #44 已验证映射 |
| V5 | Spec drift | Pass | [fact] | 需求方两次口径修订（类型 null=不允许、肩高维度、全城市种子）已同步 spec/design/proposal/knowledge/atdd；strict valid |
| V6 | Design follow-through | Pass | [fact] | D3 V16 全城市种子、D6 单宠 adapter（petType/breedId/breedName/shoulderHeightCm）、D8 传参四层过滤、D9 标签/取消——与实现一致 |
| V7 | Code pattern fit | Pass | [fact] | JPA 派生查询+EntityGraph、Problem Details、TanStack Query queries/ 集中、shadcn Base UI Badge、Tailwind 布局；与邻近模块一致 |
| V8 | Upstream basis | Pass | [fact] | diff 20 文件均有 proposal/spec/tasks 依据；badge.tsx 为标签需求重新引入（有引用）；run-e2e.mjs 改动为 E17 数据配置所需；无扩围 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单 3/3 exit 0（build/后端 105/E2E 54+4）；远端 CI 待 PR 触发 |
| E2 AI | Pass | 本报告 V1–V8 + code-review highlights |
| E3 Human | Pending | G3 人工评审（SA）；本报告不自签 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅（门控项显式标注） |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ✅（见下） |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 合并后队友迁移测试与 dev 库 checksum 受 V16 影响 | [fact] | DogBreedSchemaMigrationTest、data/pawtrip.db | 已修复（基线断言+历史清除），全量复跑绿 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | PR #43 仍 OPEN 且带 V15，若将来合并会低于已应用 V16 | [fact] | feature/add-city-pet-policy | 建议作者关闭（已被 PR #47 取代）或重编号 V17+ |
| 2 | 禁养（banned）数据源未定，E4/E6/E10/E11 仍 fixme | [fact] | DestinationController TODO | 数据源确定后恢复展示与门控用例 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 禁养数据源未定，policyCovered/bannedBreeds 占位 | 需求方决策 | tracking：TODO+占位契约入 spec |
| 2 | PR #43 遗留 V15 与 V16 的合并顺序风险 | 他人分支未关闭 | tracking：建议关闭/重编号（SUGGESTION 1） |
| 3 | 城市政策可被管理端修改（PR #47 API） | 正常运营行为 | accepted：空列表=未配置放行语义不变 |
| 4 | sessionStorage 会话级丢失 | 需求方口径 | accepted |
| 5 | 远端 CI 尚未对本分支执行 | PR 未创建 | tracking：PR 创建后 GitHub Actions 执行 |

## Waiver

N/A — no waiver（Overall=Pass）。

**Next:** `/sdd:pr-submit`（用户已授权推送与提 PR）。