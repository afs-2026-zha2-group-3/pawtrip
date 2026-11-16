# Tasks

## 1. 规则数据与判定纯函数

- [x] 1.1 `apps/web/src/data/transport-rules.ts`：`TransportRule` 增加 `shoulderLimitCm: number | null`，八条记录补值（高铁 `40`，飞机/火车/自驾 `null`）
- [x] 1.2 新增 `apps/web/src/data/transport-rule-match.ts`：`PetSnapshot`、`PetRuleVerdict` 类型与 `evaluateRuleForPet(rule, pet)`，按 design D2 输出 `recommended` 与全部 `reasons`
- [x] 1.3 新增 `apps/web/src/data/transport-rule-match.test.ts`：覆盖全满足、超重、超高、缺检疫证明、多原因顺序、`not_allowed` 唯一原因、阈值为空跳过
- 验证：`npm run test -w apps/web` → **17 passed**（新增 `transport-rule-match.test.ts` 6 例），2026-11-16

## 2. 档案查询模块

- [x] 2.1 新增 `apps/web/src/queries/pets.ts`：`PetProfile` 类型 + `petsQueryOptions`（`queryKey: ["pets"]`、`GET /api/pets`、`staleTime: 60_000`、`retry: 1`）
- 验证：`npm run build` → **exit 0**

## 3. 页面两列与无档案提示

- [x] 3.1 `apps/web/src/routes/_authenticated/transport-rules.tsx`：表格最前加「选择」列表头与单选单元格，选中值读写 `sessionStorage`（`pawtrip:selected-transport-mode`），进页面回显
- [x] 3.2 同文件：`useQuery(petsQueryOptions)`，在「方式」列后加「是否推荐」列，逐只宠物渲染结论与原因；`isPending` / `isError` / 空数组三种情况下不渲染该列
- [x] 3.3 同文件：删除 `PET_PROFILE_PATH` 引用与 `<a href>`，改为无档案时显示提示文案 + `<Button variant="outline" disabled>新增宠物档案</Button>`；加载失败时显示失败提示
- [x] 3.4 `apps/web/src/data/transport-rules.ts`：删除已无引用的 `PET_PROFILE_PATH` 常量
- [x] 3.5 `e2e/transport-rules.spec.ts`：把「档案入口是链接可跳转」断言改为「按钮存在且不可点击」，移除对 `/paws/profile` 的 URL 断言
- 验证：`npm run build` → **exit 0**

## 4. 种子数据与 E2E

- [x] 4.1 `scripts/seed-users.mjs`：为 `demo` 幂等写入两只宠物（豆豆 CAT 4.5kg/25cm/有证；毛毛 DOG 38kg/55cm/无证），`admin` 不写
- [x] 4.2 新增 `e2e/rule-recommendation-and-selection.spec.ts`：demo 视角（推荐列存在、豆豆推荐、毛毛不推荐且各行原因不同、切航司后结论正确）；admin 视角（列隐藏、提示按钮 `disabled`、单选列可用）
- [x] 4.3 同 spec：单选互斥、`sessionStorage` 值正确、刷新后回显
- 验证：`npm run test:e2e` → **32 passed (36.3s)**（原 28 + 新增 4）；退出码仍为 1，属 REQ-005 遗留的 W1（`run-e2e.mjs` 清理临时 SQLite 的 EBUSY），非本次引入。
- 过程记录：首轮 31 passed / 1 failed，失败为 `defaults to the first airline without leaving empty cells` 对「选择」列断言 `not.toBeEmpty()`；该列只含单选控件、本无文本，已改为从「方式」列起检查。

## 5. 全量验证与文档

- [x] 5.1 依次执行 `npm run build`（exit 0）、`cd apps/server && ./mvnw test`（**75 tests, 0 failures, BUILD SUCCESS**）、`npm run test:e2e`（**32 passed**，退出码 1 为 W1 遗留）
- [x] 5.2 `docs/knowledge/domain/transport-pet-rules.md`：补判定口径（体重/肩高/检疫证明、`shoulderLimitCm` 字段）与 `sessionStorage` 缓存契约（键名、取值、读取方）；同步更新 `_INDEX.md` 条目描述
- [x] 5.3 勾选本清单并记录实际执行的验证命令与结果（含未做的项要写明原因）：无未做项；未新增后端接口——主干 `480b95a` 已提供 `GET /api/pets`
