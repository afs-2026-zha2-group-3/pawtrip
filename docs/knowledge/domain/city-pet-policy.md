---
id: kb.domain.city-pet-policy
title: 城市养犬政策（收录、匹配与维护）
area: domain
---

# 城市养犬政策

面向计划携宠出行的用户，按目的地行政区提供当地养犬政策查询，并在宠物品种命中当地禁养名单时给出提醒。能力规格见 `openspec/specs/city-pet-policy/spec.md`，管理端另见 `openspec/specs/city-management/spec.md`。

- 后端模块：`com.pawtrip.server.policy`（`CityPetPolicyController` / `CityPetPolicyService`）
- 前端查询：`apps/web/src/queries/city-pet-policy.ts`
- 前端匹配：`apps/web/src/lib/trip/policy-match.ts` 的 `matchCityPolicy`

## 数据模型与收录语义

| 表 | 作用 |
|----|------|
| `city_pet_policy` | 以 `adcode` 为主键保存 `area_scope`、`policies_json`（保序字符串数组）、`source_title`、`source_note`、`updated_month`（`YYYY-MM`） |
| `city_banned_dog_breed` | `(adcode, dog_breed_id)` 关联禁养犬种，`dog_breed_id` 引用 `dog_breed` 目录 |
| `city_allowed_dog_breed` | 城市允许犬种（白名单方向），V16 为全部城市级行政区预置，之后由 `/admin/cities` 维护 |

- **已收录 = `city_pet_policy` 存在该 adcode 行**；未收录返回 `200 + covered:false`，不是错误。
- 行政区不存在返回 `404 CITY_NOT_FOUND`，不与“未收录”混淆。
- V15 建表并写入珠海（`440400`）：`areaScope="严格管理区"`、更新月份 `2025-07`，禁养关联映射 8 个可从宠物档案选择的品种（比特犬、藏獒、德国牧羊犬、罗威纳犬、杜宾犬、秋田犬、高加索犬、卡斯罗犬）。珠海通告其余 30 个品种不在 `dog_breed` 词表内，不参与判定。
- V16 为全部 `level='city'` 行政区写入 `allowed_pet_types='CAT,DOG'` 与 7 个非烈性允许品种（柯基犬、贵宾犬、金毛寻回犬、拉布拉多寻回犬、比熊犬、博美犬、哈士奇）；V15 本身不写可携带名单。

## 查询接口

`GET /api/cities/{adcode}/pet-policy[?breedId=]`（需登录）：

```text
已收录：{ adcode, name, covered: true, areaScope, policies[], bannedBreeds[],
          allowedBreeds[], source:{title,note}, updatedMonth, match|null }
未收录：{ adcode, name, covered: false }
```

- `bannedBreeds` 来自禁养关联，`allowedBreeds` 来自 `city_allowed_dog_breed`，都只含 `dog_breed` 目录内的品种。
- 可选 `breedId` 由调用方提供；后端仅在 id 存在于 `dog_breed` 且至少出现在禁养或可携带关联中时返回 `match`：
  - `matched=true`：命中禁养；`allowed` 同时表示是否在可携带名单；
  - `matched=false, allowed=true`：未命中禁养且在可携带名单；
  - 两者都未命中或 id 缺失/非法：`match=null`，不做判定。

## 前端匹配规则

用户端政策页 `/destinations/$adcode/policy` 以 `breedId=null` 查询，然后由前端逐宠物判定：

- 匹配主体统一：存在激活行程且已绑定宠物时只判定该宠物，否则判定全部宠物。
- 犬种名称同时与 `bannedBreeds`、`allowedBreeds` 比较（后端已按 id 关联生成名称列表，数据源同一目录）。
- 结论：
  - 命中禁养 → `unfriendly`，高亮提示并说明该城市政策不支持携带该宠物；
  - 在可携带名单 → `friendly`，同时提示仍需遵守数量、牵引、疫苗等规定；
  - 可携带名单为空 → `unconfigured`（“暂未收录可携带犬种”），不得推断为允许；
  - 其他（猫、无犬种、既不在禁养也不在可携带）→ `unjudgeable`，不做结论。
- 页面始终展示禁养与可携带犬种的少量示例（最多 6 个）及来源、更新月份和“以当地政府最新文件为准”说明，不展示完整名单。

## 入口与维护

- `/cities` 城市详情卡展示政策要点、可携带犬种示例与“查看完整城市政策”链接；政策页返回城市列表。
- 可携带犬种由管理员在 `/admin/cities` 编辑弹窗中从固定犬种目录选择，通过 `PATCH /api/admin/cities/{adcode}` 的 `allowedDogBreedIds` 整体替换；空数组清空，未知犬种返回 400。
- 禁养关联与政策文本目前来自人工摘录迁移，没有后台录入入口；发布前须逐条复核来源与更新月份。
- 与 `GET /api/destinations` 区分：候选接口的 `policyCovered`/`bannedBreeds` 仍是占位值，真实政策只从本模块读取。
