# Proposal

## Why

US-55 要求地点宠物校验正确覆盖猫：现状把肩高（犬类口径）也套用到猫，可能把符合政策的地点误判为不友好；城市级判定则对猫一律返回「无法判定」，即使城市并未禁止猫。需求方明确城市禁养犬种名单仅针对犬种、不适用于猫，因此猫不受犬种名单限制；猫是否允许仍按城市允许宠物类型判定（`allowedPetTypes=null` 沿用既有「不允许」口径，2026-11-18 已确认）。

## What Changes

- 地点校验：单只最大肩高仅对 DOG 生效；猫继续按允许宠物类型、每人限养数、单只最大体重、牵引与疫苗要求判定，`null` 维度跳过。宠物医院与宠物用品店沿用既有类型豁免（未配置政策视为友好，已配置仍按字段判定）。
- 城市级校验：猫按城市允许宠物类型判定——允许猫即友好，不允许即不友好；禁养犬种名单与可携带犬种名单不参与猫的判定，不再返回「无法判定」。
- 城市宠物友好筛选：`petFriendly=true` 叠加的类型与品种规则保持不变，肩高匹配仅对 DOG 生效，猫不因肩高被排除。
- `GET /api/cities/{adcode}/pet-policy` 响应新增 `allowedPetTypes`，使独立政策页与侧栏能按同一口径判定猫；未收录城市同样返回该字段。
- 犬只判定口径不变：类型、犬种 id、肩高上限与禁养/可携带犬种名单的既有规则与文案保持原样。

## Capabilities

### New Capabilities

- 无。改动落在既有 `destination-selection`、`trip-attractions` 与 `city-pet-policy` 能力上。

### Modified Capabilities

- `destination-selection`: 候选接口的宠物友好筛选把肩高限定为 DOG 口径；候选卡片匹配标签把猫由「无法判定」改为按城市允许类型给出友好/不友好结论。
- `trip-attractions`: 景点/地点详情与卡片的政策匹配把肩高限定为 DOG 口径，补充猫按其余维度判定与医院/用品店豁免的既有语义。
- `city-pet-policy`: 政策查询返回城市允许宠物类型；禁养犬种匹配要求补充猫的口径（允许即友好，禁养名单不适用于猫），不再对猫返回无法判定。

## Impact

- 前端：`apps/web/src/lib/trip/policy-match.ts`（地点、候选与政策匹配）、`apps/web/src/queries/city-pet-policy.ts`（响应类型）。
- 后端：`destination/DestinationController.java`（筛选肩高仅 DOG）、`policy/CityPetPolicyResponses.java` 与 `policy/CityPetPolicyService.java`（返回 `allowedPetTypes`）。
- 测试：`apps/web/src/lib/trip/policy-match.test.ts`、`DestinationApiTest`、`CityPetPolicyApiTest`、`e2e/destination-selection.spec.ts`、`e2e/city-pet-policy.spec.ts`。
- 无表结构、迁移或依赖变更；城市允许宠物类型复用既有 `administrative_region.allowed_pet_types`。
