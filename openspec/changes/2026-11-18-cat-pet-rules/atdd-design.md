# ATDD Design

变更：`2026-11-18-cat-pet-rules`

性质：本记录为 P3 计划工件；实现已先行完成（分支 `feat/us-55-cat-pet-rules`），因此属于回溯记录，只用于对齐 Scenario 与自动化证据，不作为 TDD 证据。

## ATDD layers in scope

### API 层

- `GET /api/cities/{adcode}/pet-policy` 新增 `allowedPetTypes`，收录与未收录城市均返回；`CityPetPolicyApiTest` 分别断言已收录珠海（`returnsPolicyAndMatchedFlagForBannedBreedId`）与未收录深圳（`returnsCoveredFalseForUncoveredCity`）返回 `CAT,DOG`。
- `GET /api/destinations` 的 `petFriendly=true` 筛选：肩高仅对 `petType=DOG` 生效；`DestinationApiTest` 在同一用例中对比 45cm 的犬与猫。

### Unit 层

`apps/web/src/lib/trip/policy-match.test.ts` 覆盖纯判定：

- 地点：猫跳过肩高、猫仍受类型/体重/牵引/疫苗限制、犬只肩高判定不变。
- 城市候选：猫类型允许→友好、类型为 `DOG` 或 `null`→不友好、犬只缺犬种→无法判定。
- 城市政策：猫按 `allowedPetTypes` 友好/不友好（含 `null` 不友好）、犬只犬种规则不变。

### E2E 层

`e2e/city-pet-policy.spec.ts` 与 `e2e/destination-selection.spec.ts` 使用真实后端与临时数据库；本变更未新增 E2E 文件，只调整受口径影响的断言。

| Scenario | 用例与断言 |
|---|---|
| 猫不参与肩高筛选 | `DestinationApiTest`：45cm 的猫不被 40cm 上限城市排除，候选总数不变 |
| 类型/品种/限养数筛选不变 | 既有 `petFriendlyFilterMatchesPetTypeWhenProvided`、`petFriendlyFilterMatchesBreedWhenProvided`、限养数用例回归 |
| 猫按城市允许类型显示友好（卡片） | `policy-match` 单测；E2E E4 卡片 `豆豆 · 友好` |
| 城市不允许携带猫（卡片） | `policy-match` 单测：`allowedPetTypes='DOG'` 时猫不友好 |
| 猫按城市允许类型显示友好（政策页） | `policy-match` 单测；`city-pet-policy` 用例「treats a cat without a dog breed as allowed」断言 `咪咪 · 友好` tag；「城市禁养犬种名单不适用于猫」保留在 tag `title`，按 2026-11-18 决定不要求可见文本 |
| 城市不允许携带猫（政策页） | `policy-match` 单测：`allowedPetTypes='DOG'` 与 `null` 时猫不友好 |
| 猫按城市允许类型显示友好（侧栏） | E15 断言「您的宠物豆豆不在珠海市禁养名单中」；按 2026-11-18 决定，该文案即为可接受呈现，不要求额外说明 |
| 猫不参与肩高判定（地点） | `policy-match` 单测：仅配置 25cm 上限时 30cm 的猫判友好 |
| 猫命中体重限制（地点） | `policy-match` 单测：猫体重超限判不友好 |
| 宠物医院未配置政策视为友好 | 既有 `matchLocationPolicyForType` 单测 |
| 已配置政策的宠物用品店仍判定 | 既有 `maxPetsPerPerson=0` 单测 |
| 返回城市允许宠物类型 | `CityPetPolicyApiTest`：已收录珠海与未收录深圳均断言 `allowedPetTypes=CAT,DOG` |
| 犬只缺犬种仍无法判定 | E15 侧栏 `毛毛：宠物未填写犬种，无法判定禁养名单`；单测 |
| 犬只禁养/可携带判定不变 | `city-pet-policy` 既有禁养、可携带与品种不在名单用例 |
| 多宠物逐只标签 | E4（猫 + 无犬种犬）；E21（友好/不友好犬只） |
| 无宠物不展示标签 / 宠物接口失败 | E13、E14 回归 |

## What is written before production code

本记录为回溯对齐，不是 TDD 证据。正常顺序应先写：`policy-match` 单测 → `DestinationApiTest`/`CityPetPolicyApiTest` → E4/E15/政策页 E2E 调整 → 实现判定与接口字段。

## Non-goals

- 不引入猫品种、猫禁养名单或新表。
- 不改变犬只的犬种与肩高口径。
- 城市筛选 UI 不新增专用 E2E：筛选入口只使用第一只宠物档案，猫口径由服务端集成测试覆盖。
- 不做真实政府文件核验；政策数据未在本变更中改动。
