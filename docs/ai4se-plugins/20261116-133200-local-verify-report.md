# Local verify report — add-rule-recommendation-and-selection

| 项 | 值 |
|---|---|
| Change | `openspec/changes/add-rule-recommendation-and-selection` |
| 需求 | REQ-006（2026-11-16 由需求方在 REQ-005 之后追加） |
| 分支 | `feat/rule-recommendation-and-selection`（基于 `feat/transport-rules-comparison` @ `11d82e6`） |
| 提交 | `a552b93`（实现）→ `65f3c9e`（规格+知识库）→ `a807bbe`（需求登记）→ `d1b6807`（规则复核闭合 W4） |
| 执行时间 | 2026-11-16 13:32 (+08:00) |
| 阶段 | P4 完成，进入 G2 前 |

## 变更范围

| 文件 | 性质 |
|---|---|
| `apps/web/src/data/transport-rules.ts` | 改：`shoulderLimitCm` 字段 + 8 条取值；删 `PET_PROFILE_PATH`；4 条规则补 `verifiedOn`、2 条换源 |
| `apps/web/src/data/transport-rule-match.ts` | 新：`evaluateRuleForPet` 判定纯函数 |
| `apps/web/src/data/transport-rule-match.test.ts` | 新：6 例 UT |
| `apps/web/src/queries/pets.ts` | 新：`PetProfile` + `petsQueryOptions`（`GET /api/pets`） |
| `apps/web/src/routes/_authenticated/transport-rules.tsx` | 改：「选择」单选列、「是否推荐」列、无档案/失败提示 |
| `e2e/transport-rules.spec.ts` | 改：列序、空单元格循环起点、链接断言改为按钮断言 |
| `e2e/rule-recommendation-and-selection.spec.ts` | 新：4 例（demo 视角 2 + admin 视角 1 + 选择/缓存 1） |
| `scripts/seed-users.mjs` | 改：`demo` 幂等写两只宠物，`admin` 不写 |
| 文档 | `docs/knowledge/domain/transport-pet-rules.md`、`_INDEX.md`、change 四件套、`requirement-workspace/` |

后端零改动：复用主干 `480b95a`（PR #35）已提供的 `GET /api/pets`（`PetResponses.PetDetail`）。

## 验证命令与结果

| Command | Exit | 结果 |
|---|---|---|
| `npm run test -w apps/web` | 0 | 3 files / **17 passed**（新增 `transport-rule-match.test.ts` 6 例） |
| `npm run build` | 0 | 构建成功（`transport-rules` chunk 生成） |
| `.\apps\server\mvnw.cmd -f apps\server\pom.xml test` | 0 | **Tests run: 75, Failures: 0, Errors: 0**，BUILD SUCCESS（26.0s） |
| `npm run test:e2e` | 1 | **32 passed (36.7s)**；退出码 1 为 REQ-005 遗留 W1（`run-e2e.mjs` 清理临时 SQLite 的 `EBUSY`），非本次引入 |

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | `tasks.md` 15 项全部 `[x]`，无未做项；未新增后端接口，理由是主干已具备 `/api/pets` |
| V2 | Requirement coverage | Pass | [fact] | 2 个 ADDED requirement（推荐列逐只判定 / 交通方式单选与缓存）在 `transport-rule-match.ts`、`pets.ts`、`transport-rules.tsx` 均有行级锚点 |
| V3 | Scenario coverage | Partial | [fact] | 9 个 scenario 覆盖 8 个（E2E 5 + UT 3 类）；**「档案加载失败」无自动化覆盖**——需拦截 `/api/pets` 返回 5xx，当前 E2E harness 未提供请求级打桩 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 列顺序（选择→方式→是否推荐）、逐只结论与原因拼接、`sessionStorage` 键与回显、无档案三态判断均可定位到具体代码段 |
| V5 | Spec drift | Pass | [fact] | delta spec 的「加载中/失败不渲染列」与实现一致；按钮最初为 `disabled` 不跳转，2026-11-16 晚些时候需求方指定跳转 `/paws`，spec 已同步（见文末「报告后变更」） |
| V6 | Design follow-through | Pass | [fact] | D1 前端判定、D2 原因顺序、D3 `shoulderLimitCm`、D4 列布局、D5 无档案 UI、D6 单选+缓存、D7 查询模块、D8 种子表逐条落地 |
| V7 | Code pattern fit | Pass | [inference] | 查询模块对齐 `queries/auth.ts`；UT 结构对齐 `queries/admin-locations.test.ts`；未手改 `routeTree.gen.ts` |
| V8 | Upstream basis | Pass | [fact] | 变更均可回溯到 tasks 1.x–5.x 或 design D1–D8 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Partial | 3 条 exit 0 + 1 条测试全绿但 exit 1（W1）；无 `ci-report.md`（未触发远端流水线） |
| E2 AI | Partial | 本报告（V1–V8、五问映射、findings） |
| E3 Human | Pending | 需 VL 对 G2 作出签署；判定口径与「隐藏列」取舍已由需求方在 2026-11-16 明确 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ⚠️ 功能与任务完整，缺 1 个 scenario 的自动化覆盖 |
| Q2 Correct? | V4–V5 | ✅ 行为与规格一致 |
| Q3 Coherent? | V6–V7 | ✅ 设计与实现一致，贴合既有模块风格 |
| Q4 Necessary only? | V8 | ✅ 无越界改动；后端零改动 |
| Q5 Risk controllable? | 残余风险 | ⚠️ 判定口径与服务端可空字段需跟踪 |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| W1 | `npm run test:e2e` 测试全绿但退出码 1（`EBUSY` 清理异常），继承自 REQ-005 | [fact] | `scripts/run-e2e.mjs` cleanup | 需求方 2026-11-16 决定不修；为 `rm` 增加 `maxRetries/retryDelay` 可消除误判 |
| W2 | 「档案加载失败」分支无自动化覆盖，只能靠代码审查 | [fact] | `transport-rules.tsx` `petsQuery.isError` 段 | 引入请求拦截（`page.route`）或 MSW 后补 1 例 E2E |
| W3 | `PetProfile.weightKg` / `shoulderHeightCm` 在 TS 中为 `number`，但 API 侧是 `Double`；若返回 `null`，`null > 5` 为 `false`，判定会**静默判为满足** | [inference] | `transport-rule-match.ts` 比较表达式 | DB 迁移 V10 已 NOT NULL，当前不可达；建议后续把类型改为 `number \| null` 并在判定入口做空值保护，避免后端字段放宽后静默误判 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| S1 | `petsQueryOptions` 的 `staleTime: 60_000`，档案新增/修改后规则页最多陈旧 60 秒，且无手动刷新入口 | [fact] | `apps/web/src/queries/pets.ts` | 档案写入成功处调用 `invalidateQueries(["pets"])`（档案页落地时一并处理） |
| S2 | E2E 依赖种子固定为「豆豆满足、毛毛不满足」；若日后调整种子数据，断言需同步改 | [fact] | `scripts/seed-users.mjs`、`e2e/rule-recommendation-and-selection.spec.ts` | 断言尽量锚定规则阈值而非宠物名；已在用例注释中说明该耦合 |
| S3 | 判定不覆盖品种、烈性犬、笼具规格、办理时长，用户可能看到「推荐」但实际仍需人工确认 | [inference] | `transport-rule-match.ts` | 属 design 已记录的口径取舍；页面免责声明已覆盖 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 推荐结论建立在 2026-11-16 复核的规则上，规则时效性会漂移 | 静态常量不自动更新 | accepted（`verifiedOn` + 页面免责声明；规则变更 = 一次常量改动） |
| 2 | 规则复核为官方页面检索摘要比对（官网 405 / TLS 超时），未逐页人工打开 | 自动化访问受限 | accepted（记录见 `20261116-124503-local-verify-report.md`「规则复核闭合」） |
| 3 | 判定口径局限（不含品种/笼具等） | 需求方已选定 3 项硬条件 | accepted（免责声明 + 逐条原因展示） |
| 4 | 服务端字段若放宽为可空，前端判定会静默误判 | 当前 NOT NULL，不可达 | tracking（W3） |
| 5 | E2E 命令退出码非 0 | 清理逻辑缺陷，需求方决定不修 | tracking（W1） |
| 6 | 本 change 的 delta 叠加在未归档的 `transport-rules-comparison-page` 上 | REQ-005 未合并 | 必须先合 REQ-005 再合本分支，否则规格归档会覆盖 |

## Waiver

N/A — 无豁免，本报告不构成放行。

## 结论

**Overall = Partial。** V1/V2/V4–V8 通过，V3 因「档案加载失败」缺自动化证据为 Partial；E3 待 VL 签署。代码侧功能、测试、文档已完备，无 CRITICAL。是否在 G2 以「Partial + 已接受残余风险」放行，由 VL 决定，本报告不自签。

## 报告后变更（2026-11-16）

| # | 变更 | 证据 |
|---|---|---|
| 1 | 「新增宠物档案」按钮由 `disabled` 改为点击跳转 `/paws`（需求方指定目标路径），使用 `useNavigate` 导航，不手写 `href` | `apps/web/src/routes/_authenticated/transport-rules.tsx` |
| 2 | E2E `no-pet-profile` 用例由「按钮可见且 disabled」改为「按钮可用 → 点击后 URL 为 `/paws` 且表格消失」 | `e2e/transport-rules.spec.ts` |
| 3 | delta spec「无宠物档案」scenario、design D5、知识库、REQ-006 需求条目、registry 同步为跳转口径 | 对应文件 |

复验：`npm run test:e2e` → **32 passed (38.5s)**，退出码 1 仍为 W1。

注：`/paws` 当前为空壳页（`paws-page` 规格明确「暂不承载业务内容」），按钮只完成导航；档案表单落地前，点击后页面无内容，属已知过渡状态。
