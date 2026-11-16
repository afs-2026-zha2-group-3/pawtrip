## Why

地点管理弹窗目前只暴露 8 项政策字段中的 6 项，`allowed_pet_types` 与 `max_single_pet_shoulder_height_cm` 虽已建列并有实体映射，管理员却无法录入或修正；同时城市管理页仍是空壳，`administrative_region` 上的政策与允许犬种名单没有任何维护入口。补齐这两处后，地点与城市两级政策才能在管理端完整维护，并为后续目的地政策展示和宠物友好筛选提供可信数据。

## What Changes

- 地点管理的“保存地点”和“pawtrip地点”弹窗将政策字段从 6 项扩展到 8 项，新增“允许宠物类型”（`CAT` / `DOG` / `CAT,DOG`）与“单只宠物最大肩高”。
- 地点管理 API 的 `petPolicies` 请求与响应对象同步增加这两个字段；创建和更新都真正写入，不再透传保留旧值。PATCH 仍保持“出现即整体替换、`null` 即清空”的语义。地点列表响应不变。
- 新增城市管理能力：`/admin/cities` 页面提供省份、级别与关键词筛选、服务端分页表格和编辑弹窗。
- 城市管理页覆盖全部城市级记录以及没有市级子节点的省级记录（北京、上海、天津、重庆、港澳台），仅从数据库读取，不调用高德。
- 城市编辑弹窗可维护 8 项标量政策以及 `city_allowed_dog_breed` 允许饲养犬种名单；未配置表示不限制，保存时整组替换。
- 新增城市管理 API（列表、详情、更新），并复用现有 `GET /api/dog-breeds` 读取犬种选项。
- 不新增数据库迁移；不改动地点基础信息、POI/商业 JSON、照片，也不增加地点列表政策列。

## Capabilities

### New Capabilities

- `city-management`: 管理员城市政策管理，包括城市级与省级叶节点的分页列表、详情、8 项政策与允许犬种名单的编辑，以及不依赖高德的数据口径。

### Modified Capabilities

- `location-management`: 地点政策编辑与地点管理 API 从 6 项政策扩展为 8 项，新增允许宠物类型和单只宠物最大肩高；其余地点额外信息与列表行为保持不变。

## Impact

- **后端**：`AdminLocationRequests`、`AdminLocationResponses`、`AdminLocationService`、`LocationWriteService` 扩展政策字段；`com.pawtrip.server.location` 新增城市管理控制器与服务；复用 `AdministrativeRegion`、`AdministrativeRegionRepository`、`DogBreedRepository`。
- **前端**：`lib/pet-policy.ts`、`admin/-pet-policy-fields.tsx`、`admin/-location-editor.tsx`、`admin/cities.tsx`、`queries/admin-locations.ts`，新增城市查询模块与城市编辑弹窗；`routeTree.gen.ts` 仅按现有路由结构重新生成。
- **API**：`POST/PATCH /api/admin/locations` 与地点详情响应中的 `petPolicies` 增加 `allowedPetTypes`、`maxSinglePetShoulderHeightCm`；新增 `GET /api/admin/cities`、`GET /api/admin/cities/{adcode}`、`PATCH /api/admin/cities/{adcode}`。
- **数据库**：无迁移。复用 V7、V9、V11 已创建的政策列、`city_allowed_dog_breed` 表与 V13 犬种种子数据。
- **兼容性**：现有调用方若只提交 6 项 `petPolicies`，按整体替换语义会把新增两项清为 `NULL`；本仓库前端与后端在同一 change 内升级，不额外做兼容分支。
- **测试与文档**：扩展地点管理后端与端到端测试，新增城市管理 API 与页面测试；更新 `location-management` 规格并新增 `city-management` 规格。
