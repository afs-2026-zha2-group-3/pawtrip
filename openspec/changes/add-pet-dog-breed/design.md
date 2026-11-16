## Context

`dog_breed` 表已存在并由 `V13__seed_dog_breeds.sql` 写入 20 条常见犬种（含 `official_aggressive` 标记），`GET /api/dog-breeds` 已返回按名称升序的 `DogBreedDetail`。`pet` 表目前只有 `name`、`pet_type`、`weight_kg`、`shoulder_height_cm`、`has_leash`、`has_vaccination_proof` 与 `photo`，没有品种字段。Paws 页面已完成宠物增删改查，但表单与详情无法记录品种。

数据库中可能已有无品种的狗，迁移必须保持这些记录可读。

## Goals / Non-Goals

**Goals:**

- 为狗记录与编辑品种，品种来自现有名录。
- 保持历史无品种的狗可读取。
- 服务端强制“狗必须有品种、猫不得有品种”。
- 前端在类型为狗时提供必选品种下拉，并在详情展示品种。

**Non-Goals:**

- 不新增或修改品种名录数据。
- 不实现按城市限养名录过滤品种或烈性犬提示。
- 不把品种展示加入宠物卡片以外的额外字段。
- 不引入搜索型下拉；当前名录仅 20 条。

## Decisions

### 1. `pet.dog_breed_id` 使用可空外键

新增 Flyway `V14__add_pet_dog_breed.sql`：

```sql
ALTER TABLE pet
    ADD COLUMN dog_breed_id INTEGER
    REFERENCES dog_breed(id) ON DELETE SET NULL;

CREATE INDEX idx_pet_dog_breed ON pet(dog_breed_id);
```

列必须可空，以兼容已有无品种的狗；必填约束放在服务端校验，而不是数据库 `NOT NULL`。`ON DELETE SET NULL` 保证品种参考数据被删除时不会阻断宠物数据。

### 2. 实体保存 `dogBreedId`，响应返回嵌套 `dogBreed`

`Pet` 增加 `Long dogBreedId`（沿用现有 `userId` 的简单列映射，不引入 `@ManyToOne` 懒加载）。`PetResponses.PetDetail` 增加 `DogBreedDetail dogBreed`，复用已有类型。

列表查询避免 N+1：先取宠物列表，收集非空品种 id，`dogBreedRepository.findAllById` 批量取品种并建映射，再组装响应。单条查询按 `dogBreedId` 取一次。

请求体 `PetRequests.SavePet` 增加 `Long dogBreedId`。

### 3. 服务端校验规则

- `petType=DOG`：`dogBreedId` 必填，且必须存在于 `dog_breed`；否则 `400 VALIDATION_ERROR`。
- `petType=CAT`：`dogBreedId` 必须为空；携带品种返回 `400 VALIDATION_ERROR`。
- 读取历史数据时允许 `dogBreed=null`；更新保存时按上述规则校验，因此无品种的狗在下次编辑时必须补选。

### 4. 前端品种下拉与类型联动

`queries/pets.ts` 增加 `DogBreed` 类型、`dogBreedsQueryOptions()` 与 `SavePetInput.dogBreedId`。表单草稿用字符串保存 `dogBreedId`（`Select` 值为字符串），提交时：

- 类型为狗：`Number(dogBreedId)`，未选择时客户端校验拦截。
- 类型为猫：固定发送 `null`，并清空草稿中的品种。

类型从狗切换为猫时立即清空品种选择；从猫切换为狗时品种为空，必须重新选择。详情弹窗在类型为狗时展示品种名称，无品种显示“未设置”；猫不展示品种行。

卡片右下角标签优先显示狗的品种名称，无品种时回退显示“狗”，猫显示“猫”；卡片 `aria-label` 使用同一标签，保持可见文本与可访问名称一致。

### 5. 测试与验证

- 后端：`PetApiTest` 覆盖创建/更新带品种、狗缺品种、未知品种、猫带品种、列表与详情返回 `dogBreed`；`PetSchemaMigrationTest` 校验新列、历史数据可读与外键行为。
- 前端：E2E 创建狗时选择品种、详情展示、卡片右下角显示品种、编辑品种、狗缺品种校验、切换为猫后品种隐藏并发送 `null`。
- 回归：`./mvnw test`、`tsc`、`npm test`、`npm run build`、`npm run test:e2e`。

## Risks / Trade-offs

- **历史数据**：已有狗无品种，详情显示“未设置”，编辑保存前必须补选。→ 已在规格中明确，避免静默写入空品种。
- **名录变更**：品种被删除时外键置空，历史狗会变为无品种。→ 当前名录为静态参考数据，风险可接受。
- **表单联动**：猫→狗→猫切换时需确保不残留品种。→ 草稿在切换为猫时清空，提交时按类型强制 `null`。
- **测试夹具**：现有后端与 E2E 中创建狗的地方都需要补品种。→ 在实现任务中逐处更新并运行全套测试。

## Migration Plan

部署时 Flyway 自动执行 `V14`，已有宠物行的 `dog_breed_id` 为 `NULL`。回滚需同时回退迁移与代码；由于 SQLite 删除列成本较高，优先以向前修复处理。

## Open Questions

无。已确认狗品种必填；猫不携带品种；品种只从现有名录选择。