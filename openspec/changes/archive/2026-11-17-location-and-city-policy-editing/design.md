## Context

- 地点管理的两个弹窗与 `POST/PATCH /api/admin/locations` 目前只处理 6 项宠物政策；`pawtrip_location` 与实体已包含 `allowed_pet_types`、`max_single_pet_shoulder_height_cm`，更新服务当前把这两项原值透传保留。
- `administrative_region` 已有 8 项政策列，`city_allowed_dog_breed` 记录允许饲养犬种，`dog_breed` 由 V13 种入参考数据；但 `/admin/cities` 路由组件直接 `return null`，没有管理 API。
- 本 change 不新增数据库迁移，只补齐管理 API、前端页面与共享表单。
- 已确认口径：地点只补政策字段；城市管理覆盖全部城市级记录与无市级子节点的省级记录；城市政策包含 8 项标量与允许犬种；不调用高德。

## Goals / Non-Goals

**Goals:**

- 地点与城市共用同一套 8 项政策字段语义和表单组件，避免两套校验漂移。
- 管理员可以在两个地点弹窗中维护全部 8 项政策。
- 城市管理页提供可筛选、可分页的数据库列表，并可在弹窗中维护城市政策与允许犬种。
- 保持现有地点列表、POI 快照、照片和游玩时间行为不变。

**Non-Goals:**

- 编辑地点名称、类型、地址、坐标、行政区、`poi_json`、`business_json` 或照片。
- 维护有市级子节点的普通省份政策。
- 行政区到地点的政策继承或复制。
- 目的地页面、宠物友好展示或禁养提醒的改动。
- 新增角色、认证方式或数据库迁移。

## Decisions

### D1: 政策字段表示沿用数据库字符串枚举

`allowedPetTypes` 在请求、响应与持久化中均使用 `String`：`CAT`、`DOG`、`CAT,DOG` 或 `null`；`maxSinglePetShoulderHeightCm` 使用 `Double`（cm）。这样可以与 V9 的 CHECK 约束、实体字段和现有 `PetPolicies` 扁平常量结构一一对应，避免引入数组序列化和顺序归一化。

替代方案：API 使用 `["CAT","DOG"]` 数组。表达更自然，但需要在服务端与前端各做一次转换，且现有实体与约束仍是字符串，收益不足。

### D2: 地点写入路径真正落库两个新字段

扩展 `AdminLocationRequests.PetPolicies`、`AdminLocationResponses.PetPolicies` 与 `LocationWriteService.PetPolicyValues`，创建和更新时把 `allowedPetTypes`、`maxSinglePetShoulderHeightCm` 传入 `updatePetPolicies`，删除当前对这两个字段的透传保留逻辑。

校验与现有体重规则对齐：肩高必须有限、非负、最多两位小数；允许宠物类型只接受 `null` 与三个受支持字符串，空字符串按非法值返回 400。PATCH 维持“`petPolicies` 缺省不改、出现即整体替换”的语义。

### D3: 城市列表在内存中筛选与分页

行政区数据约 340 条且基本静态。服务层使用新增的 `findAllByOrderByNameAsc()` 一次读取全部行政区，按 `parent_adcode` 集合识别省级叶节点，过滤出“全部城市级 + 无子节点省级”，再按省份、级别、关键词过滤并切片分页。这样避免为叶节点判定编写复杂 SQL，也保持数据库名称排序。

替代方案：数据库分页加自定义 JPQL。数据量增长后更稳，但当前规模下实现与测试成本更高，且叶节点判定仍需额外查询。

### D4: 城市 API 与 PATCH 语义

新增：

- `GET /api/admin/cities?provinceAdcode=&level=&keyword=&page=&pageSize=`
- `GET /api/admin/cities/{adcode}`
- `PATCH /api/admin/cities/{adcode}`

列表项包含 `adcode`、`name`、`level`、`provinceAdcode`、`provinceName` 与 8 项 `petPolicies`；前端据此显示“已配置 n/8”。详情额外返回 `allowedDogBreedIds`（升序）。列表不返回犬种，避免懒加载与额外查询。

PATCH 请求包含可选 `petPolicies` 与可选 `allowedDogBreedIds`：

- 字段缺省或 `null`：对应部分不变；
- `petPolicies` 出现：8 项整体替换，内部 `null` 清空；
- `allowedDogBreedIds` 出现且为空数组：清空名单；非空数组：整体替换并去重；
- 未知犬种 ID：400，整次更新不写入；
- 未知 `adcode`：404，新增 `REGION_NOT_FOUND`；
- 有子节点的省级记录：400，不允许更新。

之所以用空数组而不是 `null` 清空名单，是因为 Java record 无法区分 JSON 中“缺省”和“显式 null”；数组提供了明确的“出现且为空”表达。

### D5: 共享前端表单与分页组件

- `queries/admin-locations.ts` 的 `PetPolicies` 增加两个字段；`lib/pet-policy.ts` 的草稿增加允许宠物类型与肩高，并补齐解析、格式化和测试。
- `admin/-pet-policy-fields.tsx` 增加允许宠物类型四选一下拉与肩高数字输入；地点两个弹窗无需改结构即可获得新字段。
- 城市页复用地点页的服务端分页表格模式；把 `locations.tsx` 内现有的 `PaginationControls` 提取为 `admin/-pagination-controls.tsx`，两个页面共用。
- 犬种选择使用可搜索的复选框列表（约 20 个犬种），放在城市弹窗内，不引入新的第三方组件；搜索仅在前端过滤。
- 城市关键词输入沿用目的地页的 300ms 防抖模式。

### D6: 后端代码归属与错误码

城市管理仍放在 `com.pawtrip.server.location` 包，新增 `AdminCityController`、`AdminCityService`、`AdminCityRequests`、`AdminCityResponses`，复用 `AdministrativeRegionRepository`、`DogBreedRepository` 和 `AdministrativeRegion.updatePetPolicies/updateAllowedDogBreeds`。在 `ApiErrorCode` 增加 `REGION_NOT_FOUND`（404）。写操作使用 `@Transactional`，先完成全部校验再修改实体，保证失败不产生部分写入。

## Risks / Trade-offs

- [旧客户端只传 6 项政策会把新增两项清空] → 本仓库前后端在同一 change 升级；后端测试覆盖“整体替换”，不增加兼容分支。
- [内存分页在行政区数据增长后退化] → 当前约 340 条、静态数据；若未来显著增长再切换为数据库分页。
- [列表看不到犬种配置] → 列表只显示 8 项标量配置数；犬种需打开弹窗查看。优先保持列表查询简单，后续需要时再增加摘要。
- [普通省份政策仍无维护入口] → 这是已确认的范围取舍；省级叶节点已覆盖，普通省份政策暂由后续需求处理。
- [允许犬种语义歧义] → 按表名与实体命名解释为“允许饲养的犬种”，未配置表示不限制；目的地禁养名单展示不在本 change。

## Migration Plan

1. 先发布后端：新增城市接口与地点政策字段，均为向后兼容的契约扩展。
2. 再发布前端：地点弹窗与城市页面开始使用新字段和新接口。
3. 无数据库迁移；回滚只需回退应用代码，已写入的政策数据仍保留在现有列中。

## Open Questions

无。地点补全范围、城市列表口径、政策字段集合与犬种语义均已在探索阶段确认。
