## 1. 后端品种字段

- [x] 1.1 新增 `apps/server/src/main/resources/db/migration/V14__add_pet_dog_breed.sql`：为 `pet` 增加可空 `dog_breed_id` 外键（`ON DELETE SET NULL`）与索引。
- [x] 1.2 修改 `Pet`、`PetRequests.SavePet`、`PetResponses.PetDetail`：实体保存 `dogBreedId`，请求接收 `dogBreedId`，响应返回嵌套 `dogBreed`。
- [x] 1.3 修改 `PetService`：狗必须选择存在品种、猫不得携带品种；列表批量查询品种避免 N+1，单条查询按 id 取品种。
- [x] 1.4 更新 `PetApiTest`：覆盖创建/更新带品种、狗缺品种、未知品种、猫带品种、列表与详情返回 `dogBreed`，并修正现有创建狗的夹具。
- [x] 1.5 更新 `PetSchemaMigrationTest`：校验 `dog_breed_id` 列、历史狗可读、外键删除品种后置空。
- [x] 1.6 运行 `cd apps/server && ./mvnw test`，确认后端测试通过。

## 2. 前端品种编辑

- [x] 2.1 修改 `apps/web/src/queries/pets.ts`：新增 `DogBreed`、`dogBreedsQueryOptions()`，并在 `Pet` 与 `SavePetInput` 中加入品种字段。
- [x] 2.2 修改 `-pet-dialogs.tsx`：类型为狗时展示必填品种下拉（选项来自名录、按名称升序）；切换为猫时清空品种；提交时狗发送 `dogBreedId`，猫发送 `null`。
- [x] 2.3 详情弹窗在狗类型下展示品种，无品种显示“未设置”；猫不展示品种行。
- [x] 2.4 更新 `e2e/paws-pet-management.spec.ts`：创建狗时选择品种，覆盖详情展示、编辑品种、狗缺品种校验、切换为猫后品种隐藏与提交 `null`。

## 3. 验证与收尾

- [x] 3.1 运行 `npx tsc --noEmit -p apps/web/tsconfig.json`、`npm test -w apps/web`、`npm run build`、`npm run test:e2e`，全部通过。
- [x] 3.2 启动前后端在浏览器手动验证：狗必选品种、编辑品种、切换猫清除品种、历史无品种狗详情显示未设置。
- [x] 3.3 更新 `docs/knowledge/architecture/README.md`：补充宠物品种字段、必填规则与品种名录接口用法。
- [ ] 3.4 提交并推送到 `feature/add-paws-pet-management`，在 PR #40 描述中补充两个变更的 Spec ID。
- [ ] 3.5 待确认后归档本变更并同步 `paws-page` 主规格。