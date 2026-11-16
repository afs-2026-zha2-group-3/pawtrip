# Tasks

设计依据：[design.md](./design.md)、[atdd-design.md](./atdd-design.md)（验收层=E2E，不写 UT）、[dov-ac-review.md](./dov-ac-review.md)。

## 1. 规则常量（T1）

- [x] 1.1 新建 `apps/web/src/data/transport-rules.ts`：导出 `TransportRule` 类型（字段按 design.md D2）与 8 条规则常量；verification: `npm run build -w apps/web` 通过（已通过）
- [x] 1.2 录入飞机四家航司（国航/东航/南航/海航，海航含托运与客舱两条）规则，覆盖四个维度；verification: `mode === "flight"` 共 5 条，覆盖 `CA`/`MU`/`CZ`/`HU`
- [x] 1.3 录入高铁、火车、自驾三条通用规则（自驾 `weightLimitKg` 为 null 且说明无统一限制）；verification: 三条记录均含四个维度文本且 `allowanceStatus` 有值
- [ ] 1.4 补齐每条规则的 `sourceUrl`/`sourceTitle`/`verifiedOn`，并按 deep-dive 的 D1–D8 来源人工复核火车、海航、自驾条目；verification: 遍历 `transportRules` 无空 `verifiedOn`（合并前置，缺一不得合并）——当前 4 条待复核（火车/海航托运/海航客舱/自驾），页面已显示「待复核」标记
- [x] 1.5 添加按方式/航司取数的纯函数（`getRulesByMode`、`getFlightRules`、`getRuleForMode`、`getRuleById`）；verification: 页面仅通过函数取数，常量 `transportRules` 不外泄

## 2. 规则对比页（T2）

- [x] 2.1 新建 `apps/web/src/routes/_authenticated/transport-rules.tsx`：列由列配置驱动（基础五列 + 扩展列「检疫证明」），渲染四行记录，使用 `components/ui/table`；verification: 登录后访问 `/transport-rules` 看到 4 行且基础 5 列齐全（E2E `comparison-table` 断言）
- [x] 2.2 实现「能否携带」状态标识：按 `allowanceStatus` 渲染 可携带 / 有条件 / 不可，并展示 `allowanceNote`；verification: 三态映射集中在 `allowanceStatusClasses` / `allowanceStatusLabels`，无按行分支；当前目录无「不可」记录，故 E2E 覆盖可携带与有条件两态
- [x] 2.3 实现飞机行航司下拉（`components/ui/select`，选项来自 `getFlightRules()`，默认 `sortOrder` 最小者=国航）；verification: 切换航司后飞机行更新，其余三行内容不变（E2E 断言行文本前后一致）
- [x] 2.4 实现表格底部区：来源说明（8 条来源链接）、复核状态、以承运方最新规则为准的免责声明、无站内订票提示；verification: 底部四类文案均可见
- [x] 2.5 添加无档案入口按钮（跳转预留给 `PET_PROFILE_PATH = "/paws/profile"` 常量）；verification: 点击按钮导航到预留路径，规则表格仍可浏览
- [x] 2.6 验证列可扩展：扩展列「检疫证明」取自规则 `extra.quarantineRequirement`，基础四列顺序不变；verification: 追加/移除列配置不需要改表格结构代码
- [x] 2.7 新增 `e2e/transport-rules.spec.ts`，按 atdd-design.md 第 3 节分 4 组共 18 个用例；verification: `npm run test:e2e -- e2e/transport-rules.spec.ts` 18 passed

## 3. 顶部导航接入（T3）

- [x] 3.1 修改 `apps/web/src/routes/__root.tsx` 的 `AppTabs`：`activeTab` 增加 `/transport-rules` 分支，`onValueChange` 增加导航，`TabsTrigger value="transport-rules"` 插在「城市浏览」之后、管理员分支之前；verification: Tab 顺序与选中态由 E2E 断言
- [x] 3.2 校对 Tab 可见性：普通用户（`USER`）可见「交通规则」，管理员 Tab 仍仅管理员可见；verification: `demo` 与 `admin` 两个账号的 Tab 集合均由 E2E 断言
- [x] 3.3 守卫与导航断言：未登录访问 `/transport-rules` 跳 `/login`；直达后仅该 Tab 选中；verification: `anonymous` 与 `tab-and-routing` 组通过
- [x] 3.4 反向验收断言（atdd-design.md 第 6 节）：无「不推荐/符合/不适合」判定文案、无订票入口、无刷新按钮、`/cities` 仍正常且无交通规则入口；verification: 三个反向用例通过
- [x] 3.5 确认 `routeTree.gen.ts` 由插件重新生成且无手改；verification: `git diff` 仅含路由条目与排序变化（新增 `/transport-rules`）

## 4. 文档与知识库

- [x] 4.1 在 `docs/knowledge/domain/` 补充交通携宠规则摘要与来源清单（12306/国航/东航/南航/海航），指向常量模块；verification: `bash scripts/kb-lint.sh` 通过（实际输出 `SKIP: KB lint is not configured`，该脚本仍为 bootstrap 占位；改为人工核对：`docs/knowledge/domain/transport-pet-rules.md` 已含 8 条记录摘要、8 条来源清单与常量模块指针）
- [x] 4.2 更新 `docs/knowledge/_INDEX.md` 或对应模块卡片，使新内容可被检索；verification: `bash scripts/verify-links.sh` 通过且索引链接可达（实际：`scripts/verify-links.sh` 仍为 bootstrap 占位并 `exit 1`，记为脚本不可用；已人工核对 `_INDEX.md` 新增 `domain/transport-pet-rules` 行使相对链接 `domain/transport-pet-rules.md` 指向存在的文件）
- [x] 4.3 在常量模块顶部注释写明"规则为人工摘录、发布前复核、以承运方最新规则为准"；verification: 文件头注释存在且与实际免责文案一致（`apps/web/src/data/transport-rules.ts` 第 1–3 行已含该三条约定，与页面底部免责文案一致）

## 5. 集成检查

- [x] 5.1 本地全量验证：`npm run build -w apps/web` 通过、`npm test -w apps/web` 11 passed、`npm run test:e2e` 28 passed
- [x] 5.2 回归检查：首页问候语、`/cities`、管理员城市/地点页导航不受影响；verification: 既存 E2E 用例（authentication、admin-location-management）全绿

## Workflow follow-up

- 按项目评审要求执行 `/sdd:local-verify-report`，通过后再提 PR。
- PR 合并后按流程归档该 change，并核对 `openspec/specs/` 新增/修改的三份能力规格。
