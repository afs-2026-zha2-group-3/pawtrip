# Local Verify Report: destination-selection

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

Static scan Skipped 原因：白名单（docs/feedback/verification-commands.md）未含 SAST/SCA 命令，本地未配置扫描工具；远端 CI 扫描作业按仓库配置在 PR 上执行（无 GHAS 时条件跳过）。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | Vite 8 构建成功，client/SSR 产物正常输出 |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | surefire 汇总 tests=87 errors=0 skipped=0 failures=0（含 destination 6 用例与既有回归） |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | 0 | Playwright Chromium：26 passed + 4 skipped（E4/E6/E10/E11 test.fixme 门控），约 1.1m |

Runner log：`docs/ai4se-plugins/20261116-142525-local-verify-run.log`（commands_attempted=3，commands_failed=0）。
补充验证（白名单外、同一工作树）：`npx tsc --noEmit -p apps/web/tsconfig.json` exit 0；`npx vitest run`（apps/web）39 passed / 7 files；`npx openspec validate destination-selection --strict` → valid。

## Code-review highlights

- `DestinationController` 只读、无写入端点；候选=`findAllByLevelOrderByNameAsc("city")`，petFriendly 判定 null 或 >=1（仅 0 排除），keyword trim 后按城市名/省份 contains；政策字段占位 false/空数组并留 TODO（与需求方 2026-11-16 修订一致）。
- `DestinationApiTest` 6 用例覆盖 401/候选契约/占位/keyword/petFriendly（含 0/1/2/null 边界与 keyword 组合，JDBC helper 仅测试用、finally 恢复 NULL）/无选定写入端点。
- 前端选定状态 `selected-destination.ts`：sessionStorage 键 `pawtrip.selectedDestination`，四字段字符串校验，`useSyncExternalStore` 订阅；登出在 `__root.tsx` onSuccess 清除。
- E2E signIn helper 以 toPass 重填直至值稳定，修复 E13 二次登录水合竞态（不削弱断言）。
- `admin/cities.tsx` 组件级 ADMIN 守卫兜底 SSR 水合不重跑 beforeLoad 的缺口，模式与 admin/locations 一致（E14 覆盖）。
- 本次验证中发现并清理：`components/ui/badge.tsx` 在 V14 移除后无任何引用 → 已删除（tsc 复查通过）；E1/E16 用例标题残留试点/政策口径 → 已改为现口径；tasks 6.3 requirement 计数 7 → 两份 delta spec 共 12 条。
- Non-goal 反向验证：diff 未新增档案端点、未改 `/paws` 页面与 pet 模块（main PR #40 产物原样消费）。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | tasks.md 22/22 全 `[x]`（1.1/1.3 划线作废项按需求方修订记录保留） |
| V2 | Requirement coverage | Pass | [fact] | 两份 delta spec 共 12 条 requirement（destination-selection 6 + web-app-shell 6），均有实现证据（见 V4） |
| V3 | Scenario coverage | Pass | [fact] | 35 个 scenario（17+18）对照 A1–A6（API）与 E1–E16（E2E）；E4/E6/E10/E11 显式 test.fixme 门控（政策数据源 TODO + 外部 breed 缺失），A3 划线暂缓 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 候选列表/搜索/筛选→DestinationController+DestinationApiTest A1/A2/A5/A6；禁养匹配（展示暂缓）→destination-matching.ts+单测；选定→selected-destination.ts+cities.tsx E7/E8/E9；占位契约→A2；外壳 6 条→__root.tsx/admin/cities.tsx E12/E13/E14 |
| V5 | Spec drift | Pass | [fact] | 验证中发现 3 处文档/标题滞后（badge 残留、E1/E16 标题、6.3 计数），均已修复并复查；实现与 spec 现口径一致 |
| V6 | Design follow-through | Pass | [fact] | D1 纯函数保留、D2 全量城市级+占位、D3 无新增迁移（main V1–V13）、D4 sessionStorage、D5 服务端 keyword/petFriendly（null‖>=1）、D6 adapter 退化 null、D7 登出清除——均与实现一致 |
| V7 | Code pattern fit | Pass | [fact] | 后端 JPA 派生查询+Problem Details+既有认证链；前端 TanStack Query queries/ 集中定义、shadcn Base UI 组件、Tailwind 布局；命名/分层与邻近模块一致 |
| V8 | Upstream basis | Pass | [fact] | diff 39→38 文件逐一有 proposal/spec/tasks 依据；唯一无依据残留 badge.tsx 已删除；requirement-workspace 改动为 REQ-005→REQ-006 改编号与修订记录（合并 main 冲突解决） |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单命令表（3/3 exit 0）+ runner log；远端 CI 待 PR 触发（本 change 无 ci-report.md） |
| E2 AI | Pass | 本报告 V1–V8 + code-review highlights |
| E3 Human | Pending | G3 人工评审（SA）；本报告不自签 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅（门控项显式标注，需求方已接受暂缓口径） |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅（badge.tsx 清理后无扩围） |
| Q5 Risk controllable? | residual + red lines | ✅（残余风险均 tracking/accepted，见下） |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | badge.tsx 无引用残留（V14 移除后） | [fact] | apps/web/src/components/ui/badge.tsx | 已删除并 tsc 复查（本次验证内闭环） |
| 2 | E1/E16 标题与 tasks 6.3 计数滞后于现口径 | [fact] | e2e/destination-selection.spec.ts、tasks.md | 已修正（本次验证内闭环） |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | breed 词表不一致（对方「柯基犬/贵宾犬」vs 原型「柯基/泰迪」） | [fact] | 外部 US-01 契约 | 政策数据源就绪后与对方协调同一词表，再解除 E4/E6/E10/E11 门控 |
| 2 | 政策收录/禁养数据源归属未定 | [fact] | DestinationController TODO、design Open Questions | 需求方确定归属后另行交付数据迁移（版本号届时复核 main） |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 政策数据源未定，policyCovered/bannedBreeds 恒占位 | 需求方 2026-11-16 移除 V14，归属未定 | tracking：TODO 判断点+占位契约已入 spec，数据源确定后恢复 |
| 2 | 外部档案 breed 字段缺失，AC-2/AC-4 完整验收受阻 | US-01 已交付接口/页面但 PetDetail 无 breed | tracking：E4/E6/E10/E11 test.fixme 门控，只消费不重实现（需求方确认） |
| 3 | sessionStorage 会话级丢失（关标签页/换设备） | 需求方明确会话级口径 | accepted：后续 story 需服务端上下文时另行演进 |
| 4 | 远端 CI 尚未对本分支执行 | PR 未创建 | tracking：PR 创建后由 GitHub Actions 执行 build/test/扫描 |

## Waiver

N/A — no waiver（Overall=Pass）。

**Next:** `/sdd:pr-submit`（用户已授权推送与提 PR）。