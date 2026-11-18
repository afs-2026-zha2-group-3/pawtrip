> 参考：`design.md`（D1–D9）与 `atdd-design.md`（API / 组件 / E2E 分层与红测清单）。

## 1. 测试先行

- [ ] 1.1 新增 `apps/server/src/test/java/com/pawtrip/server/packing/PackingTemplateTest.java`，覆盖猫 4.5kg 高铁 3 天、狗 18kg 飞机 5 天、`hasLeash` 真假与牵引绳尺寸档、主粮份数映射，确认先失败。
- [ ] 1.2 新增 `PackingChecklistApiTest`：首次生成 201、重复生成 200 不重置、他人行程 404 `TRIP_NOT_FOUND`、未登录 401、未生成 GET 404 `PACKING_CHECKLIST_NOT_FOUND`、无档案 409 `PET_PROFILE_REQUIRED`。
- [ ] 1.3 在 `PackingChecklistApiTest` 补充增删改：新增自定义物品 201、非法入参 400 `VALIDATION_ERROR`、改数量持久化、删除 `204` 且从响应与进度消失。
- [ ] 1.4 在 `PackingChecklistApiTest` 补充读取同步：体重变化更新箱包尺码、天数变化更新主粮、交通切换增减场景项、自定义项/数量覆盖/勾选保留、删除模板项不复活。
- [ ] 1.5 新增 `PackingChecklistSchemaMigrationTest`：V29 两张表、`trip_id` 唯一、分类/数量 CHECK、模板键唯一索引、删除行程级联。
- [ ] 1.6 补充 `PackingTemplateTest` 边界：体重 5/15、肩高 35/55、自驾晕车药、狗拾便袋、尿垫 `max(1, totalDays)`、猫飞机航空箱、狗高铁运输包。
- [ ] 1.7 在 `PackingChecklistApiTest` 补充 ATDD A10–A12：清单项契约字段、自定义项改名/改分类持久化、全部勾选时进度完成。
- [ ] 1.8 运行后端测试确认新增用例失败，再进入实现。

## 2. 后端数据模型与模板

- [ ] 2.1 新增 `V29__create_trip_packing_checklist.sql`：`trip_packing_checklist`（`trip_id` UNIQUE、级联）、`trip_packing_item`（分类/来源/状态 CHECK、数量 1–99、模板键唯一索引、清单索引）。
- [ ] 2.2 新增 `com.pawtrip.server.packing` 包：`PackingChecklist`、`PackingItem` 实体与枚举 `PackingCategory`、`PackingSource`、`PackingItemState`。
- [ ] 2.3 新增 `PackingChecklistRepository`、`PackingItemRepository`（按清单查、按模板键查、按分类与排序取最大排序号）。
- [ ] 2.4 新增 `PackingTemplate` 静态常量与映射：分类顺序、模板项、体重/肩高尺码档、天数×2 主粮、飞机/牵引绳/疫苗证明/晕车药适用条件，纯函数输入 `(Trip, Pet)` 输出模板项列表。
- [ ] 2.5 在 `ApiErrorCode` 增加 `PACKING_CHECKLIST_NOT_FOUND`、`PACKING_ITEM_NOT_FOUND`、`PET_PROFILE_REQUIRED`。

## 3. 后端服务与接口

- [ ] 3.1 新增 `PackingChecklistService`：所有权校验、生成幂等、读取同步算法（插入/刷新/隐藏/复活/墓碑跳过、保留自定义与数量覆盖与勾选）、进度与排序组装。
- [ ] 3.2 新增请求/响应 DTO：`PackingChecklistResponses`、`PackingRequests`；物品字段 `id/category/name/quantity/checked/source/templateKey`，进度 `checked/total`。
- [ ] 3.3 新增 `PackingChecklistController`：POST/GET `/api/trips/{tripId}/packing-checklist`，POST `/items`，PUT/DELETE `/items/{itemId}`；DTO 校验名称非空、分类合法、数量 1–99。
- [ ] 3.4 确认行程删除后清单与物品级联删除，运行 `cd apps/server && ./mvnw test` 全部通过。

## 4. 前端查询与弹窗

- [ ] 4.1 新增 `apps/web/src/queries/packing-checklist.ts`：查询键、`packingChecklistQueryOptions`（`PACKING_CHECKLIST_NOT_FOUND` → `null`）、生成/新增/修改/删除 mutation 与失效。
- [ ] 4.2 新增 `apps/web/src/components/trip/packing-checklist-dialog.tsx`：复用现有 `Dialog`/`Button`/`Checkbox`/`Input`/`Select`，按五类分组、进度、勾选、数量编辑提交、删除、新增自定义物品。
- [ ] 4.3 弹窗状态分支：未生成引导生成、无档案引导 `/paws`、加载中占位、加载失败可重试、空清单空态、100% 完成态、操作失败可读提示。
- [ ] 4.4 在 `apps/web/src/routes/_authenticated/itinerary.tsx` 的 Day 操作区加入「携带清单」入口与进度文案（未生成 / 进度暂不可用 / 已打包 X / Y 件），仅激活行程时展示，`print:hidden`。
- [ ] 4.5 在宠物新增/编辑/删除成功回调中按前缀失效 `["packing-checklist"]`，使档案变更后重新读取同步。
- [ ] 4.6 新增 `packing-checklist-dialog` 组件测试：生成引导、无档案引导、勾选调用、新增校验、100% 完成态、错误提示；运行 `npm run test -w apps/web` 通过。
- [ ] 4.7 补充组件状态测试（ATDD C5–C9）：加载失败重试、空清单空态、删除调用、操作失败提示、非法数量回滚且不发请求。

## 5. E2E 与整体验证

- [ ] 5.1 新增 `e2e/packing-checklist.spec.ts`：创建行程并激活 → 行程单显示「未生成」→ 打开弹窗生成 → 分类与进度 → 勾选后刷新保留 → 新增/改数量/删除。
- [ ] 5.2 E2E 补充档案同步：通过 API 修改宠物体重后重开弹窗，箱包尺码更新，自定义物品与勾选态保留；修改体重必须在 `finally` 恢复原值。
- [ ] 5.3 运行 `node scripts/run-e2e.mjs e2e/packing-checklist.spec.ts` 通过。
- [ ] 5.4 运行 `npm run test -w apps/web`、`npm run build`、`cd apps/server && ./mvnw test` 全部通过。
- [ ] 5.5 运行 `openspec validate 2026-11-18-add-trip-packing-checklist --strict` 通过，并在交付说明中列出验证结果。
- [ ] 5.6 E2E 补充 ATDD E4–E5：关闭弹窗后保持当前 Day 且无 `PUT /api/trips`；打印媒体下入口、进度与弹窗不可见。
- [ ] 5.7 回归 `e2e/itinerary.spec.ts`，确认行程单既有地点、交通、政策与 PDF/图片导出行为不变。
