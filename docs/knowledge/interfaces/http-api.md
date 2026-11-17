---
id: kb.interfaces.http-api
title: HTTP API 契约目录
area: interfaces
---

# HTTP API 契约目录

来源：`apps/server/src/main/java/com/pawtrip/server/**/*Controller.java` 与 `openspec/specs/`。前端统一经 `apps/web/src/lib/http/request.ts` 调用，不直接使用 `fetch`。

## 通用约定

- `/api/**` 默认要求登录；`/api/admin/**` 额外要求 `ADMIN` 角色；其余请求 `denyAll`。
- 成功响应不套统一 envelope。列表分页统一为 `{page, pageSize, totalElements, totalPages, hasNext, hasPrevious, items[]}`。
- 错误统一为 RFC 9457 Problem Details（`application/problem+json`）并带稳定字段 `code`；`detail` 为英文技术描述。
- 登录使用服务端会话（`JSESSIONID`），非安全方法需回传 `X-XSRF-TOKEN`（来自 `XSRF-TOKEN` cookie）。

## 用户接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 表单登录；成功写入会话，失败 `401 INVALID_CREDENTIALS` |
| GET | `/api/auth/me` | 返回 `{username, role}`；未登录 `401 UNAUTHENTICATED` |
| POST | `/api/auth/logout` | 登出，成功 `204` |
| GET | `/api/greeting` | 返回 `{message}`；记录不存在 `404 GREETING_NOT_FOUND` |
| GET | `/api/pets` | 当前用户宠物列表（按 id 升序），含嵌套 `dogBreed` |
| GET | `/api/pets/{id}` | 本人宠物详情 |
| POST | `/api/pets` | 创建宠物，成功 `201` + `Location` |
| PUT | `/api/pets/{id}` | 替换本人宠物 |
| DELETE | `/api/pets/{id}` | 删除本人宠物；被 trip 引用时 `409 PET_IN_USE` |
| GET | `/api/dog-breeds` | 犬种目录（20 条），含 `officialAggressive` |
| GET | `/api/locations/types` | 共享地点类型目录：景点 `110000`、住宿 `100000`、宠物医院 `090700`、宠物用品店 `061211`、餐厅 `050000` |
| GET | `/api/locations` | 共享已保存地点分页列表；参数见下 |
| GET | `/api/locations/{poiId}` | 用户浏览详情：基础信息 + 8 项 `petPolicies`，不含照片/business/原始 POI |
| GET | `/api/destinations` | 城市候选列表；参数 `keyword`、`petFriendly`、`petType`、`breedId`、`shoulderHeightCm`；每项含只读 `featureTags` |
| GET | `/api/cities/{adcode}/pet-policy` | 城市养犬政策；可选 `breedId`，未收录返回 `covered:false` |
| GET | `/api/trips` | 当前用户行程摘要（按 id 升序，不含 `plan`/`transportMode`） |
| GET | `/api/trips/{id}` | 本人行程详情，含 `plan` 与 `transportMode` |
| POST | `/api/trips` | 创建行程，成功 `201` + `Location` |
| PUT | `/api/trips/{id}` | 整量更新 `name`、`totalDays`、`plan`、`transportMode` |
| DELETE | `/api/trips/{id}` | 删除本人行程，成功 `204` |

### 宠物喜好与性格（REQ-014）

`POST /api/pets` 与 `PUT /api/pets/{id}` 请求体可选携带 `preferences`（键数组，可省略/空数组）与 `personality`（单键或 `null`）；列表与详情响应恒回显 `preferences: string[]`（未设置为 `[]`）与 `personality: string | null`。

- 词表（固定大写蛇形键，后端枚举 `PetPreference`/`PetPersonality` 校验）：喜好 `SWIMMING` 游泳、`HIKING` 爬山、`GRASS_RUNNING` 草地奔跑、`CITY_WALKING` 城市漫步、`SNOW_PLAY` 玩雪；性格 `ENERGETIC` 活泼好动、`CALM` 温和平静、`TIMID` 胆小敏感。
- 非法键（含数组内 `null` 元素）→ `400 VALIDATION_ERROR` 且不落库；重复喜好键去重后存储（保持首次出现顺序）。
- 存储为逗号分隔 TEXT（`pet.preferences`/`pet.personality`，V26）；NULL/空串=未设置；旧档案与不传新字段的旧客户端均视为未设置，既有必填校验（名字/类型/犬种/体重/肩高）不变。

### 城市特征标签（REQ-014）

`GET /api/destinations` 每项恒含 `featureTags: string[]`（未标注城市为 `[]`），按名称升序下发，筛选参数不改变排序；未知排序类参数（如 `sort`）被忽略。

- 词表（只读，后端常量 `CityFeatureTags.KEYS`，不做写入校验）：`COASTAL` 海滨、`MOUNTAIN` 山地、`LAKE` 湖泊、`GRASSLAND` 草原、`CITY_PARK` 城市公园、`SNOW` 雪景。
- 存储为逗号分隔 TEXT（`administrative_region.feature_tags`，V27）；解析 trim/去空段/去重（保留首次出现顺序），NULL/空白 → 空数组。
- 种子口径：V27 按 REQ-014 附录 A 为 48 城写入特征（如珠海 440400=`COASTAL`、杭州 330100=`LAKE,CITY_PARK`）；未列出城市保持 NULL。
- 管理端契约不含 `featureTags`：`GET/PATCH /api/admin/cities[/{adcode}]` 请求与响应均无该字段，请求体携带会被忽略，写路径不触碰该列。

### `GET /api/locations` 参数

| 参数 | 默认 | 说明 |
|------|------|------|
| `regionCode` | — | 6 位省/市级 adcode；普通用户必填，管理员可省略查询全部 |
| `typeGroup` | — | 类型目录 key；非法值 `400 VALIDATION_ERROR` |
| `petFriendlyOnly` | `false` | `true` 时仅返回 `maxPetsPerPerson >= 1` |
| `page` / `pageSize` | `1` / `20` | `pageSize` 上限 100 |

区域为省或城市级并匹配其下级地区；按地点 id 升序。响应项含 `poiId`、`name`、`typeCode`、`typeGroup`、`address`、经纬度、`regionCode`、`minVisitHours`、`maxVisitHours`、`maxPetsPerPerson` 与完整 `petPolicies`。

### 地点宠物政策 8 字段

`allowedPetTypes`（`CAT`/`DOG`/`CAT,DOG`/`null`）、`maxPetsPerPerson`、`maxSinglePetWeightKg`、`maxSinglePetShoulderHeightCm`、`leashRequired`、`vaccinationProofRequired`、`extraFeeCents`、`reservationRequired`。`null` 表示未配置，`0`/`false` 表示明确的零值/否定。

### 行程 `transportMode`

可空，合法值 `flight`、`high_speed_rail`、`train`、`drive`；非法值 `400 VALIDATION_ERROR`。

## 管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/regions` | 省/市两级行政区树（无区县） |
| GET | `/api/admin/locations/amap` | 高德候选搜索；`regionCode`、`typeGroup`、`page`、`pageSize`（默认 10） |
| GET | `/api/admin/locations/{poiId}` | 管理编辑详情，含原始 `poi`、`business`、照片元数据与 `petPolicies` |
| POST | `/api/admin/locations` | 保存高德 POI；请求 `poiId`、`typeGroup`、`minVisitHours`、`maxVisitHours`、可选 `petPolicies` |
| PATCH | `/api/admin/locations/{poiId}` | 更新游玩时间/政策；请求缺省 `petPolicies` 不改，出现即整体替换 |
| GET | `/api/admin/cities` | 城市列表；`provinceAdcode`、`level`、`keyword`、`page`、`pageSize`（默认 10，上限 100）；服务端内存筛选与切片 |
| GET | `/api/admin/cities/{adcode}` | 城市详情，含 8 项 `petPolicies` 与 `allowedDogBreedIds` |
| PATCH | `/api/admin/cities/{adcode}` | 更新政策与允许犬种；两部分均可选，出现即整体替换 |

- 城市列表范围 = 全部 `level='city'` + 无市级子节点的省级叶节点；在内存中筛选与分页，不调用高德。
- `allowedDogBreedIds` 空数组清空名单，重复 id 去重，未知 id `400 VALIDATION_ERROR`。
- 未知城市/区域 `404 REGION_NOT_FOUND`；非叶省份或非法查询 `400 VALIDATION_ERROR`。
- 城市特征标签（REQ-014 `feature_tags`）仅由迁移种子维护，不在管理端契约内；见上文「城市特征标签」。

## 稳定错误码

| code | HTTP | 场景 |
|------|------|------|
| `GREETING_NOT_FOUND` | 404 | 问候语记录缺失 |
| `PLACE_NOT_FOUND` | 404 | 高德地点不存在 |
| `LOCATION_NOT_FOUND` | 404 | 已保存地点不存在 |
| `LOCATION_CONFLICT` | 409 | 地点写入冲突 |
| `REGION_NOT_FOUND` | 404 | 行政区/城市不存在 |
| `PET_NOT_FOUND` | 404 | 宠物不存在或不属于当前用户 |
| `PET_IN_USE` | 409 | 宠物被行程引用，不可删除 |
| `CITY_NOT_FOUND` | 404 | 城市政策查询的行政区不存在 |
| `TRIP_NOT_FOUND` | 404 | 行程不存在或不属于当前用户 |
| `VALIDATION_ERROR` | 400 | 参数、政策值或计划校验失败 |
| `UPSTREAM_FAILURE` | 502 | 高德等上游调用失败 |
| `UNAUTHENTICATED` | 401 | 未登录 |
| `INVALID_CREDENTIALS` | 401 | 登录失败（不区分用户名是否存在） |
| `ACCESS_DENIED` | 403 | 权限不足或 CSRF 失败 |
| `INTERNAL_ERROR` | 500 | 未捕获异常，不泄露堆栈 |

- 能力规格：`openspec/specs/*/spec.md`；后端错误映射见 `error/ApiErrorCode.java` 与 `error/GlobalExceptionHandler.java`。
