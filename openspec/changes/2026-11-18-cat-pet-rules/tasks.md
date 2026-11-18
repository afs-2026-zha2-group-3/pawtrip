# Tasks

## 1. 地点校验（猫口径）

- [x] 1.1 `matchLocationPolicy` 的单只最大肩高条件增加 `pet.petType === "DOG"`，猫跳过肩高维度；类型、限养数、体重、牵引、疫苗维度保持原样。验证：`policy-match.test.ts` 中「ignores the shoulder height cap for cats」通过。
- [x] 1.2 保留宠物医院/宠物用品店豁免：未配置政策视为友好，已配置政策仍按字段判定。验证：既有 `matchLocationPolicyForType` 豁免用例通过。
- [x] 1.3 补猫的类型、体重、疫苗限制用例，确认猫仍能得到不友好结论与原因。验证：`policy-match.test.ts` 中「still applies type, weight and requirement limits to cats」通过。

## 2. 城市级判定

- [x] 2.1 `matchCityCandidate` 对猫在类型检查后返回友好，不再返回无法判定；类型不允许时由既有类型分支返回不友好。验证：`policy-match.test.ts` 中「treats cats as friendly when the city allows them」通过。
- [x] 2.2 `matchCityPolicy` 对猫按城市 `allowedPetTypes` 判定：允许→友好并说明禁养名单不适用于猫，不允许→不友好；仅犬只保留无法判定分支。验证：同文件城市政策匹配用例通过。
- [x] 2.3 `GET /api/cities/{adcode}/pet-policy` 响应新增 `allowedPetTypes`（收录与未收录城市均返回），前端 `CityPetPolicy` 类型同步。验证：`CityPetPolicyApiTest` 断言 `allowedPetTypes=CAT,DOG`。

## 3. 城市筛选与接口

- [x] 3.1 服务端 `isPetFriendly` 的肩高条件增加 `petType == PetType.DOG`，猫不再因肩高被排除。验证：`DestinationApiTest` 中「45cm 的猫不被 40cm 上限城市排除」断言通过。
- [x] 3.2 类型、品种与限养数规则不变；未传 `petType` 时仍退化为限养数规则。验证：既有 `petFriendlyFilterMatchesPetTypeWhenProvided` 等用例通过。

## 4. 测试适配

- [x] 4.1 更新 `e2e/destination-selection.spec.ts`：E4 卡片猫标签改为「友好」，E15 侧栏猫改为「不在禁养名单中」（该文案与当时的 Spec 说明要求存在差距，后于 2026-11-18 由 Spec 接受，见 7.4）。
- [x] 4.2 更新 `e2e/city-pet-policy.spec.ts`：无犬种信息的猫在政策页显示「友好」，并更名用例。
- [x] 4.3 保留犬只无犬种仍「无法判定」的覆盖（E15 毛毛、城市政策页品种不在名单用例）。
- [x] 4.4 城市筛选的猫口径由服务端集成测试覆盖（种子城市允许类型一致，前端筛选入口只用第一只宠物，单列 UI 用例无增量信息）。

## 5. 规格与文档

- [x] 5.1 新建 change `2026-11-18-cat-pet-rules`，proposal 说明猫口径与影响面。
- [x] 5.2 编写 `destination-selection` delta：筛选肩高仅 DOG、候选卡片猫按允许类型判定。
- [x] 5.3 编写 `trip-attractions` delta：肩高仅 DOG、猫按其余维度判定、医院/用品店豁免语义。
- [x] 5.4 编写 `city-pet-policy` delta：响应返回允许宠物类型、猫不再无法判定。
- [x] 5.5 编写 design（D1–D5）与 ATDD/DoV/alignment/change-summary。
- [x] 5.6 `npx --no-install openspec validate 2026-11-18-cat-pet-rules --strict` 通过。

## 6. 验证

- [x] 6.1 `npx vitest run src/lib/trip/policy-match.test.ts`：23/23 通过（含新增猫 `null` 与牵引断言）。
- [x] 6.2 `npx tsc --noEmit -p apps/web/tsconfig.json`：通过。
- [x] 6.3 `DestinationApiTest` 12/12、`CityPetPolicyApiTest` 11/11 通过（均本轮运行）；未收录深圳用例新增 `allowedPetTypes` 断言。
- [x] 6.4 `e2e/destination-selection.spec.ts` + `e2e/city-pet-policy.spec.ts`：34/34 通过（约 2.4m，2026-11-18 本轮重跑；此前记录的 37/37 为静态计数，两条 spec 实际共 34 条用例）。

## 7. SDD 评审修复（2026-11-18）

- [x] 7.1 补猫边界证据：`allowedPetTypes=null`（候选与政策页）不友好、猫仍受牵引约束；`CityPetPolicyApiTest` 未收录城市断言 `allowedPetTypes`。
- [x] 7.2 记录友好猫文案冲突：侧栏「未命中禁养名单」与政策页仅 tag，未展示「禁养犬种名单不适用于猫」；AC-4 与 Spec→ATDD 先改 Partial，不擅自改 UI 或放宽 Spec；7.4 决议后恢复 Pass。
- [x] 7.3 补全 Alignment 缺失的 Scenario 映射（类型未配置、城市类型不允许、允许品种为空、禁养关联为空、激活行程只判定激活宠物），并修正证据口径。
- [x] 7.4 产品决定（2026-11-18）：采用方案 B，调整 Spec/Design 接受现有「未命中禁养名单」与 tag 呈现，不要求额外可见说明；不改 UI，AC-4 恢复 Pass。
- [x] 7.5 PO 确认（2026-11-18）：`allowedPetTypes=null` 维持「不允许」，不改变实现。
- [ ] 7.6 归档时明确主规格「以宠物名 tag 展示结论」是否约束侧栏：侧栏当前用文本 banner、无 tag，候选卡片与政策页使用 tag，属既有口径不一致。
- [ ] 7.7 归档时更新主规格 `city-pet-policy` Purpose：从「养犬政策查询/品种命中禁养名单提醒」改为覆盖「猫按允许宠物类型判定、禁养犬种名单不适用于猫」，并同步主规格需求文本。

## Workflow follow-up

- 评审通过后归档本 change；归档时执行 7.7 更新主规格 `city-pet-policy` Purpose，否则主规格与 delta 不一致。
- 归档后删除分支或按团队流程合并。
