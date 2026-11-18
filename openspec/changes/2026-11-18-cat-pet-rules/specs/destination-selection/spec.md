# Spec Delta

## MODIFIED Requirements

### Requirement: 宠物友好叠加匹配（类型与品种）

候选接口 SHALL 支持可选参数 `petType`（`CAT`/`DOG`）、`breedId`（`dog_breed` 表 id）与 `shoulderHeightCm`（档案肩高）。`petFriendly=true` 时 SHALL 在每人限养数规则之上叠加类型、品种与肩高匹配（类型 null=不允许；品种空列表/肩高上限 null=未配置放行），不满足则排除。肩高为犬类口径，SHALL 仅对 `petType=DOG` 生效，猫 MUST NOT 因肩高被排除。未传参数 SHALL 退化为仅限养数规则。`petType` 非法 SHALL 返回 400。响应每项 SHALL 含 `allowedPetTypes`、`allowedDogBreedIds` 与 `maxSinglePetShoulderHeightCm`。后端 MUST NOT 依赖宠物档案模块，匹配输入由前端传参承载。

#### Scenario: 类型不允许被排除

- **GIVEN** 城市 `allowed_pet_types='CAT'`，限养数未设置
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应不包含该城市

#### Scenario: 类型未配置视为不允许

- **GIVEN** 城市 `allowed_pet_types` 为 null
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应不包含该城市

#### Scenario: 类型包含则保留

- **GIVEN** 城市 `allowed_pet_types` 为 `'DOG'` 或 `'CAT,DOG'`
- **WHEN** 请求 `petFriendly=true&petType=DOG`
- **THEN** 响应包含这些城市（限养数规则同时满足时）

#### Scenario: 肩高超过城市上限被排除

- **GIVEN** 城市肩高上限 40cm，类型与品种均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&shoulderHeightCm=45`
- **THEN** 响应不包含该城市；上限为 null 或 >=45 的城市保留

#### Scenario: 猫不参与肩高筛选

- **GIVEN** 城市肩高上限 40cm，`allowed_pet_types='CAT,DOG'`
- **WHEN** 请求 `petFriendly=true&petType=CAT&shoulderHeightCm=45`
- **THEN** 响应包含该城市（限养数规则同时满足时）

#### Scenario: 品种不在允许列表被排除

- **GIVEN** 城市允许品种列表非空且不含品种 id=7，限养数与类型均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&breedId=7`
- **THEN** 响应不包含该城市

#### Scenario: 允许品种列表为空视为未配置

- **GIVEN** 城市允许品种列表为空，限养数与类型均允许
- **WHEN** 请求 `petFriendly=true&petType=DOG&breedId=7`
- **THEN** 响应包含该城市

#### Scenario: 无档案退化为限养数规则

- **GIVEN** 请求不携带 `petType`/`breedId`
- **WHEN** 请求 `petFriendly=true`
- **THEN** 过滤仅按每人限养数规则执行

#### Scenario: 候选响应携带匹配字段

- **WHEN** 请求候选接口（任意参数）
- **THEN** 每项包含 `allowedPetTypes`、`allowedDogBreedIds` 与 `maxSinglePetShoulderHeightCm`，取值与行政区配置一致

### Requirement: 候选卡片匹配标签

`/cities` 候选卡片 SHALL 按当前用户的全部宠物逐只展示匹配标签，以「宠物名 + 结论」形式呈现。结论 SHALL 为友好或不友好：城市 `allowedPetTypes` 非 null 且含该宠物类型；该宠物为 DOG 且有品种时，城市允许品种列表为空或含该品种 id；该宠物为 DOG 时，城市肩高上限为 null 或 >= 该宠物肩高。猫不参与犬种与肩高匹配，城市允许猫即 SHALL 显示友好，不允许即 SHALL 显示不友好，MUST NOT 显示"无法判定"。仅 DOG 缺少犬种信息导致的无法判定 SHALL 以"无法判定"标签展示。用户没有宠物时 SHALL 不展示匹配标签；宠物接口失败时 SHALL 展示"暂时无法读取宠物"提示，MUST NOT 展示"无宠物"。标签 SHALL 独立于宠物友好筛选开关展示。候选列表在存在激活行程时仍展示，匹配标签 SHALL 使用统一政策匹配主体：存在激活行程且已绑定宠物时只展示该宠物的标签，否则展示全部宠物的标签。

#### Scenario: 多只宠物逐只展示

- **GIVEN** 用户有两只宠物，城市类型与品种均允许第一只、不允许第二只
- **WHEN** 用户打开 `/cities`
- **THEN** 该城市卡片显示第一只宠物的友好 tag
- **AND** 显示第二只宠物的不友好 tag

#### Scenario: 城市类型不允许

- **GIVEN** 某宠物为 DOG，城市 `allowed_pet_types='CAT'`
- **WHEN** 用户打开 `/cities`
- **THEN** 该宠物对应的 tag 显示不友好

#### Scenario: 城市允许品种为空视为未配置

- **GIVEN** 宠物为 DOG，城市允许品种列表为空
- **WHEN** 判定该宠物的匹配
- **THEN** 品种维度视为未配置并放行
- **AND** 其他维度满足时显示友好

#### Scenario: 猫按城市允许类型显示友好

- **GIVEN** 当前用户有一只猫，城市 `allowed_pet_types='CAT,DOG'`
- **WHEN** 用户打开 `/cities`
- **THEN** 该猫的 tag 显示友好
- **AND** 不因缺少犬种信息显示"无法判定"

#### Scenario: 城市不允许携带猫

- **GIVEN** 当前用户有一只猫，城市 `allowed_pet_types='DOG'`
- **WHEN** 用户打开 `/cities`
- **THEN** 该猫的 tag 显示不友好
- **AND** 原因说明该城市不允许携带猫

#### Scenario: 无宠物不展示标签

- **GIVEN** 当前用户没有宠物
- **WHEN** 用户打开 `/cities`
- **THEN** 候选卡片不展示匹配标签
- **AND** 展示添加宠物的引导

#### Scenario: 宠物接口失败

- **GIVEN** 宠物接口请求失败
- **WHEN** 用户打开 `/cities`
- **THEN** 页面提示暂时无法读取宠物
- **AND** 不展示"无宠物"提示
