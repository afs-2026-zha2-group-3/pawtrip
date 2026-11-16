# Tasks

设计依据：[design.md](./design.md)、[atdd-design.md](./atdd-design.md)（验收层=E2E，不写 UT）、[dov-ac-review.md](./dov-ac-review.md)。

## 1. 规则常量（T1）

- [ ] 1.1 新建 `apps/web/src/data/transport-rules.ts`：导出 `TransportRule` 类型（字段按 design.md D2）与 `transportRules` 常量；verification: `npm run build -w apps/web` 通过且 `tsc` 无类型错误
- [ ] 1.2 录入飞机四家航司（国航/东航/南航/海航，海航含托运与客舱两条）规则，覆盖四个维度；verification: 常量中 `mode === "flight"` 的记录覆盖 `CA`/`MU`/`CZ`/`HU` 四个 `carrierCode`
- [ ] 1.3 录入高铁、火车、自驾三条通用规则（自驾 `weightLimitKg` 为空且 `weightLimitNote` 说明无统一限制）；verification: 三条记录均含四个维度文本且 `allowanceStatus` 有值
- [ ] 1.4 补齐每条规则的 `sourceUrl`/`sourceTitle`/`verifiedOn`，并按 deep-dive 的 D1–D8 来源人工复核火车、海航、自驾条目；verification: 遍历 `transportRules` 无空 `verifiedOn`（合并前置，缺一不得合并）
- [ ] 1.5 添加按方式/航司取数的纯函数（如 `getRulesByMode`、`getFlightRules`、`getRuleById`）；verification: 页面与后续 US-06 可仅通过这三个函数取数，常量本身不外泄

## 2. 规则对比页（T2）

- [ ] 2.1 新建 `apps/web/src/routes/_authenticated/transport-rules.tsx`：列由 `transportRuleColumns` 配置驱动（默认至少含方式 + 四个基础维度），渲染四行记录，使用 `components/ui/table`；verification: 登录后访问 `/transport-rules` 看到 4 行且基础 5 列齐全
- [ ] 2.2 实现「能否携带」状态标识：按 `allowanceStatus` 渲染 可携带 / 有条件 / 不可，并展示 `allowanceNote`；verification: 修改任一记录的状态字段后刷新页面，标识随数据变化（无渲染代码改动）
- [ ] 2.3 实现飞机行航司下拉（`components/ui/select`，选项来自 `getFlightRules()`，默认首个航司）；verification: 切换航司后飞机行四个单元格更新，其余三行内容不变
- [ ] 2.4 实现表格底部区：来源说明、复核状态、以承运方/航司最新规则为准的免责声明、无站内订票提示；verification: 页面底部四类文案均可见
- [ ] 2.5 添加无档案入口按钮（跳转预留档案路由，路径集中一处常量）；verification: 点击按钮导航到预留路径且不阻断规则浏览
- [ ] 2.6 验证列可扩展：在 `transportRuleColumns` 临时追加一列并在规则 `extra` 填值（如体型限制），确认表格新增表头且基础四列不变；verification: 追加/移除列配置不需要改表格结构代码
- [ ] 2.7 新增 `e2e/transport-rules.spec.ts`（red-first，先跑应因路由不存在而失败），按 atdd-design.md 第 3 节分 4 组：`anonymous`（未登录 → `/login`）、`tab-and-routing`（Tab 存在/顺序/选中/直达）、`comparison-table`（四行、基础列表头、三态标识、航司切换前后对比、自驾无统一上限、底部四类文案、无档案按钮）、`no-backend-coupling`（无 `/api/transport-rules` 类请求、切换航司不产生请求）；verification: `npm run test:e2e` 全绿

## 3. 顶部导航接入（T3）

- [ ] 3.1 修改 `apps/web/src/routes/__root.tsx` 的 `AppTabs`：`activeTab` 增加 `/transport-rules` 分支，`onValueChange` 增加导航，`TabsTrigger value="transport-rules"` 插在「城市浏览」之后、管理员分支之前；verification: 顶部导航出现「交通规则」Tab，点击后 URL 为 `/transport-rules` 且该 Tab 选中
- [ ] 3.2 校对 Tab 可见性：普通用户（`USER`）可见「交通规则」，管理员 Tab 仍仅管理员可见；verification: 用 `demo` 与管理员账号分别登录截图/断言 Tab 集合
- [ ] 3.3 在 `e2e/transport-rules.spec.ts` 增加守卫与导航断言：未登录访问 `/transport-rules` 跳 `/login`；登录后从顶部 Tab 进入且选中态正确；verification: `npm run test:e2e` 全绿
- [ ] 3.4 补反向验收断言（atdd-design.md 第 6 节）：页面无订票入口、无“不推荐/符合”判定文案、`/cities` 仍正常且无交通规则入口；verification: 三个反向用例均通过且不引入新依赖
- [ ] 3.5 确认 `routeTree.gen.ts` 由插件重新生成且无手改；verification: `git diff apps/web/src/routeTree.gen.ts` 仅含新增 `transport-rules` 路由条目

## 4. 文档与知识库

- [ ] 4.1 在 `docs/knowledge/domain/` 补充交通携宠规则摘要与来源清单（12306/国航/东航/南航/海航），指向常量模块；verification: `bash scripts/kb-lint.sh` 通过
- [ ] 4.2 更新 `docs/knowledge/_INDEX.md` 或对应模块卡片，使新内容可被检索；verification: `bash scripts/verify-links.sh` 通过且索引链接可达
- [ ] 4.3 在常量模块顶部注释写明"规则为人工摘录、发布前复核、以承运方最新规则为准"；verification: 文件头注释存在且与实际免责文案一致

## 5. 集成检查

- [ ] 5.1 本地全量验证：`npm run build -w apps/web`、`npm test -w apps/web`、`npm run test:e2e` 均通过；verification: 命令输出无失败
- [ ] 5.2 回归检查：首页问候语、`/cities`、管理员城市/地点页导航不受影响；verification: E2E 既有用例全绿

## Workflow follow-up

- 按项目评审要求执行 `/sdd:local-verify-report`，通过后再提 PR。
- PR 合并后按流程归档该 change，并核对 `openspec/specs/` 新增/修改的三份能力规格。
