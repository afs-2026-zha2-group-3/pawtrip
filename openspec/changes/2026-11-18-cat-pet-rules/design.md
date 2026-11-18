# Design

## Context

见 proposal.md。现状有两套判定入口，但都只服务犬类口径：

- 城市候选与卡片：`matchCityCandidate` 使用候选接口返回的 `allowedPetTypes`、`allowedDogBreedIds` 与肩高上限。
- 城市政策页与侧栏：`matchCityPolicy` 只拿到 `GET /api/cities/{adcode}/pet-policy` 的禁养/可携带犬种，没有城市允许类型。
- 地点卡片与详情：`matchLocationPolicy` 对类型、限养数、体重、肩高、牵引、疫苗逐项判定，肩高未区分宠物类型。
- 服务端「宠物友好」筛选 `isPetFriendly` 同样把肩高当作通用维度。

城市数据只有犬种目录（`dog_breed`、`city_allowed_dog_breed`、`city_banned_dog_breed`），猫没有品种概念；城市与猫相关的唯一配置是 `administrative_region.allowed_pet_types`。

## Goals / Non-Goals

**Goals:**

- 猫在地点与城市两级都得到可解释的友好/不友好结论，不再一律无法判定。
- 肩高只在犬只上生效，猫按其余实际配置维度判定。
- 城市政策页、侧栏与候选卡片使用同一套猫口径。
- 宠物医院/用品店豁免保持现状。

**Non-Goals:**

- 不引入猫品种目录或猫禁养名单。
- 不改变犬只的犬种/肩高判定与文案。
- 不改变未收录政策城市的展示逻辑（仍只展示覆盖范围说明）。

## Decisions

### D1 城市猫判定取 `allowedPetTypes`，由 pet-policy 接口返回

`matchCityPolicy` 需要城市允许类型，而政策页只请求 pet-policy。选择在响应中新增 `allowedPetTypes`（来源 `administrative_region.allowed_pet_types`，未收录城市也返回），候选页与政策页共用同一字段。

备选：政策页再请求一次候选接口——多一次往返，且候选接口按关键词过滤，不是按 adcode 查询，成本更高。

`null` 语义沿用既有约定（2026-11-16 修订）：`null=不允许`。因此后台清空允许类型后，城市对猫判不友好。该语义已由 PO 确认维持（2026-11-18），与「禁养犬种名单不适用于猫」分属不同判定层。

### D2 肩高只对 DOG 生效，客户端与服务端同时收口

- `matchLocationPolicy`：肩高条件增加 `petType === "DOG"`。
- `matchCityCandidate`：猫在类型检查后直接友好，不进入犬种/肩高分支。
- 服务端 `isPetFriendly`：肩高条件增加 `petType == PetType.DOG`。

服务端选择 DOG 精确匹配而非 `petType != CAT`：肩高是犬类指标，未传 `petType` 时不应默认套用；现有前端总是在有档案时同时传 `petType` 与肩高，不受影响。

### D3 猫只在缺少类型许可时判不友好

猫不参与犬种名单与肩高：城市允许猫 → 友好；不允许猫 → 不友好。`matchCityCandidate` 与 `matchCityPolicy` 使用同一文案。友好猫的「禁养犬种名单不适用于猫」作为判定原因保留在 `matchCityPolicy` 返回值中，页面不要求额外展示（2026-11-18 决定）。

无法判定只保留给「DOG 未填写犬种」与「犬种不在可携带名单」等犬只情形。

### D4 医院/用品店豁免保持现状

`petRulesApplyTo` 只对宠物医院与宠物用品店在「未配置政策」时放行为友好；已配置政策的此类地点仍按字段判定。现有单测已锁定该行为，本次不收紧也不扩大。

### D5 UI 不改组件结构

结论仍由 `PolicyTags`、`PolicyMatchBanner` 与 `CityPolicyMatch` 渲染；仅判定函数与响应类型变化。侧栏对友好猫沿用「未命中禁养名单」标题与「您的宠物 X 不在 Y 禁养名单中」文案，政策页只渲染 `宠物名 · 友好` tag，`matchCityPolicy` 返回的「城市禁养犬种名单不适用于猫」保留在 tag 的 `title` 中。

2026-11-18 产品决定：Spec 接受上述现有文案，不再要求额外展示「禁养犬种名单不适用于猫」；本变更不改 UI。

## Risks / Trade-offs

- [后台把 `allowed_pet_types` 清空或设为仅 DOG] → 猫显示不友好；与「null=不允许」的既有筛选语义一致，需管理员知晓。
- [前后端不同步发布] → 旧后端不返回 `allowedPetTypes`，前端会把猫判不友好；本次前后端同批发布，且已用 API 测试锁定字段。
- [服务端不再按肩高过滤未带 `petType` 的请求] → 只有直接调用 API 且只传 `shoulderHeightCm` 的场景受影响；应用内不存在该组合。
- [友好猫文案口径] → 已决定 Spec 接受现有「未命中禁养名单」与 tag 呈现，不要求额外说明；若后续产品希望主动解释，需要另开 UI 变更。
- [`allowedPetTypes=null` 的业务语义] → 已确认维持「不允许」；后台清空类型会使城市对猫显示不友好。
