# ATDD Design — transport-pet-rules-comparison

- change: `openspec/changes/transport-pet-rules-comparison`（REQ-007 / US-05）
- delta specs: `specs/transport-rules-catalog/spec.md`、`specs/transport-rules-comparison-page/spec.md`、`specs/web-app-shell/spec.md`
- 前置复核：`dov-ac-review.md`（0 blocking Fail / 2 Partial）
- date: 2026-11-16

## 1. ATDD 层范围

| 层 | 是否适用 | 说明 |
|---|---|---|
| API | 不适用 | 本变更无后端改动：无规则接口、无建表、无迁移、无鉴权白名单变更（`design.md` D1） |
| E2E | 适用（唯一验收层） | 27 个场景全部是"用户可见页面状态"或"页面不发某请求"，按 `layer-inference.md` 优先级 2/3 归 E2E |
| UT | 不写（用户 2026-11-16 决定） | 规则常量与 `transportRuleColumns` 的纯函数逻辑不单独建 UT；若 apply 阶段出现复杂取值逻辑，按 apply-time TDD 处理，不在本文件规划 |
| NFR（性能/可观测） | 不适用 | 用户 2026-11-16 确认：静态页面无 SLA 需求，"不需要，静态网页应该很快的"。不做性能断言、不加 axe 依赖 |

## 2. 场景 → 层映射

| # | 场景（spec 出处） | 层 | 推荐附加 | 判据 |
|---|---|---|---|---|
| 1 | 四种方式均有规则（catalog） | E2E | — | THEN 断言表格四行可见 |
| 2 | 自驾无统一体重上限（catalog） | E2E | — | 断言自驾行体重列文本含"无统一限制"，非空非 `0` |
| 3 | 新增扩展列（catalog） | E2E | — | 见 #11：列配置新增后表头与行值同现 |
| 4 | 飞机覆盖四家航司（catalog） | E2E | — | 断言行内下拉选项数 = 4 |
| 5 | 同一航司的多运输形态（catalog） | E2E | — | 断言海航切换后展示托运形态文本（客舱本版不展示，见风险 2） |
| 6 | 已复核规则可展示来源（catalog） | E2E | — | 断言底部来源链接/标题可见 |
| 7 | 未复核规则不得发布（catalog） | 合并门禁（非测试） | — | 属 `tasks.md` 1.4 合并前置人工确认，E2E 无法表达"未合并"；记录为 G1/G2 证据要求 |
| 8 | 无规则接口请求（catalog） | E2E | — | Playwright `page.on('request')` 断言无 `/api/transport-rules` 类请求 |
| 9 | 后端不可用（catalog） | E2E（间接） | — | 真停后端会连带登录失败，不可行；以 #8 + 页面纯常量渲染替代，作为 Partial 证据 |
| 10 | 打开规则对比页（page） | E2E | — | 断言四行 + 基础五列表头顺序 |
| 11 | 通用规则行直接展示（page） | E2E | — | 断言高铁/火车/自驾行四列均有值 |
| 12 | 新增扩展列（page） | E2E | — | 断言新增表头存在且每行有值/占位；基础列顺序不变 |
| 13 | 有条件状态（page） | E2E | — | 断言"有条件"标识 + 补充说明 |
| 14 | 不可状态（page） | 数据缺省（非用例） | — | 当前目录 8 条规则均为可携带/有条件（四种方式均允许某种形式携宠），无 `not_allowed` 记录；三态映射由 `allowanceStatusClasses`/`allowanceStatusLabels` 集中实现，待后续出现不可记录时自动生效 |
| 15 | 数据状态改变时展示随之改变（page） | E2E（弱化） | — | 不改数据运行 E2E 不可行；改为断言标识由数据域渲染（#13 有条件 + #17 未选航司两类实际数据），三态映射集中实现由 code review 保证 |
| 16 | 切换航司（page） | E2E | — | 切换后断言飞机行文本变化、其余三行文本不变 |
| 17 | 未选择航司（page） | E2E | — | 首次加载断言飞机行无空单元格 |
| 18 | 航司专属免责（page） | E2E | — | 断言"以航司最新规则为准" |
| 19 | 底部说明完整（page） | E2E | — | 断言来源、复核、免责、无站内订票四类文案 |
| 20 | 无档案仍可查看规则（page） | E2E | — | 断言四行可见 + "录入宠物档案"按钮存在 |
| 21 | 点击档案录入按钮（page） | E2E | — | 断言导航到预留路由（`/pets/new` 类路径，取决于 US-06 定名） |
| 22 | 未登录访问（page） | E2E | — | 无会话访问 `/transport-rules` → `/login` |
| 23 | 已登录用户看到交通规则 Tab（shell） | E2E | — | 断言 Tab 存在且位于「城市浏览」之后 |
| 24 | 选择交通规则 Tab（shell） | E2E | — | 点击后 URL `/transport-rules` 且该 Tab `aria-selected` |
| 25 | 直接访问交通规则路由（shell） | E2E | — | 直达后仅该 Tab 选中 |
| 26 | 普通用户同样可见（shell） | E2E | — | 用 `USER` 角色登录断言可见（与管理员区分） |
| 27 | 未登录用户访问交通规则路由（shell） | E2E | — | 与 #22 同源，合并在同一用例 |

合计：24 项 E2E 覆盖、1 项数据缺省（#14）、1 项合并门禁（#7）、1 项部分（#9）；无 API 用例。

## 3. 生产代码之前要写的东西

1. `e2e/transport-rules.spec.ts`（red-first）：先按上表写断言，运行后应因 `/transport-rules` 不存在而失败。
2. 用例分组（建议 4 个 `test.describe`）：
   - `anonymous`：未登录跳转（#22/#27）
   - `tab-and-routing`：#23–#26
   - `comparison-table`：#1–#6、#10–#14、#17–#21
   - `no-backend-coupling`：#8（+ #16 的"切换不产生请求"延伸）
3. 断言规范：用 `getByRole('table')`、`getByRole('columnheader')`、`getByRole('combobox')`、`getByRole('link'|'button', { name })`；禁止 `data-testid` 兜底（`rules/testing/react-testing.md` 查询优先级）。
4. 执行方式（2026-11-16 用户决定）：规则页为静态数据，不做 red-first TDD；E2E 与实现一并完成后一次跑通（`e2e/transport-rules.spec.ts` 共 18 用例，4 组全覆盖）。

## 4. 本地 / CI 门禁（沿用现有，不新增）

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地 | `npm run test:e2e`（`scripts/run-e2e.mjs` 起 server + web） | 单文件调试可加 `--grep`/`--project` |
| CI | `.github/workflows/e2e.yml`（push 全分支 / PR to main，路径含 `apps/web/**`、`e2e/**`） | 已在 paths 覆盖，本变更无需改 workflow |
| 构建 | `npm run build -w apps/web` | 类型/路由生成必须通过（`routeTree.gen.ts` 会因新路由变化，属本变更预期产物） |

不新增 CI 产品、不新增 workflow 文件、不改 e2e.yml。

## 5. 数据 / fixture 策略

- 登录：复用 `e2e/authentication.spec.ts` 的 helper 形态，账号 `demo` / `123456`（`scripts/seed-users.mjs` 已播种）。
- 规则数据：页面常量，无需播种；E2E 不依赖 DB 规则表（不存在）。
- 扩展列：#12 使用配置里已保留的扩展列（如体型限制）做断言，不在测试中动态改源码。
- 清理：本页无写操作，无 teardown；航司选择为组件局部状态，用例间天然隔离。
- 隔离：每个用例独立 `browserContext`（Playwright 默认），避免 Tab 选中态串扰。

## 6. Non-goals 与反向验收

| Non-goal（proposal/需求） | 反向断言 | 层 |
|---|---|---|
| 不做规则 vs 档案对比判定 | 页面不出现"不推荐/符合/不适合"判定文案；不出现对比结论区域 | E2E |
| 不做站内订票 | 页面无订票按钮/表单；底部含"请通过官方或第三方渠道预订" | E2E |
| 不新增后端规则接口/表 | 打开页面与切换航司期间无 `/api/transport-rules` 类请求 | E2E |
| 不实现宠物档案录入页 | 按钮 `href` 指向预留常量路径；本变更不提供该路由页面 | E2E + code review |
| 不改 `/cities` 页面 | `/cities` 仍可正常访问，不含"交通规则"入口 | E2E |
| 不做实时规则查询/刷新 | 页面加载后无轮询请求；无刷新按钮 | E2E |

## 7. 对齐自检（Spec ↔ Design ↔ Tasks ↔ ATDD）

| 检查 | 结果 | 证据 |
|---|---|---|
| Delta Spec 每条要求都有任务承接 | Pass | `tasks.md` 1.x→catalog（4 要求）、2.x→page（6 要求）、3.x→shell（2 要求） |
| Design 决策与 Spec 不冲突 | Pass | D1 前端常量 ↔ catalog"不依赖后端"；D2 `extra` ↔ 两处"新增扩展列"；D3 列配置 ↔ page"列可扩展"；D4 路由/Tab ↔ shell 两要求 |
| Tasks 与 ATDD 层一致 | Pass（微调） | 2.7 E2E 用例改为 4 组断言（含请求缺席、Tab 选中、未登录跳转）；2.6 列扩展校验保留 |
| ATDD 场景无遗漏 | Pass | 27 场景 → 25 E2E + 1 合并门禁 + 1 部分（#9 说明理由） |
| Non-goals 有反向验收 | Pass | 本文件第 6 节 6 行 |
| 未宣称实现完成 | Pass | 仅规划文档，无前端代码改动 |

结论：对齐通过（Pass），无阻塞项；#9 与 #15 由 #8 与三态全覆盖间接覆盖，已在 G1 残余风险中登记。

## 8. 下一步

`/sdd:quality-checklist`（P3 检查点）→ `/sdd:atdd-apply`（red-first 实现）。
