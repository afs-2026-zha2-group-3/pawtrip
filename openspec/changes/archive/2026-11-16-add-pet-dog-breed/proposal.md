## Why

系统已有 `dog_breed` 品种名录（20 条常见犬种，含官方烈性标记）和 `GET /api/dog-breeds` 接口，但 `pet` 表与宠物接口没有品种字段，用户无法为狗记录或修改品种。Paws 页面需要补齐这一能力。

## What Changes

- 后端 `pet` 表新增可空 `dog_breed_id` 外键，关联 `dog_breed(id)`；新增 Flyway 迁移。
- 宠物创建/更新请求新增 `dogBreedId`；宠物响应新增 `dogBreed`（`id`、`name`、`officialAggressive`，可为 `null`）。
- 服务端校验：类型为 `DOG` 时品种必填且必须存在；类型为 `CAT` 时不得携带品种；历史无品种的狗仍可读取，但编辑保存前必须补选。
- 前端宠物表单在类型为狗时展示必填品种下拉，选项来自 `GET /api/dog-breeds` 并按名称升序；切换为猫时清除品种；详情弹窗展示狗品种。
- 更新后端接口测试、schema 迁移测试与 Paws E2E，补充错误路径（狗缺品种、未知品种、猫带品种）。
- 更新知识库中宠物接口与品种字段的说明。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `paws-page`：详情展示增加狗品种；表单校验增加“狗必选品种、猫不得携带品种”；新增狗的品种选择与接口契约要求。

## Impact

- 后端：新增 `V14__add_pet_dog_breed.sql`；修改 `Pet`、`PetRequests`、`PetResponses`、`PetService`；更新 `PetApiTest`、`PetSchemaMigrationTest`。
- 前端：`apps/web/src/queries/pets.ts` 增加 `DogBreed` 类型与品种查询；`-pet-dialogs.tsx` 增加品种选择与校验。
- 测试：Paws E2E 需为狗选择品种，并覆盖品种必填与切换类型。
- 依赖与数据：无新增运行时依赖；已有宠物数据保持可读，品种列为空。
- PR：沿用 `feature/add-paws-pet-management` 分支与 PR #40，并在 PR 描述补充本变更 Spec ID。