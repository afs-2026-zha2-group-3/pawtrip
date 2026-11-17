# REQ-012 Deep Dive — 行程景点锚点与 5km 附近筛选

- 上游需求：[REQ-012 行程景点锚点与 5km 附近筛选](../../requirements/REQ-012-nearby-location-filter.md)
- Impact Brief：[impact-brief.md](impact-brief.md)
- 日期：2026-11-17
- 范围：地点浏览页的酒店“离景点最近”下拉、景点页锚点选择、餐厅门禁、5km 距离过滤、距离排序与展示；不含自动推荐、多景点距离聚合、地图/路径规划、在线预订、小型犬/大型犬/押金/清洁费/搜索与卡片视觉
- 术语：“酒店”对应界面类型标签“住宿”（`typeGroup=hotel`）；“餐厅”对应 `typeGroup=restaurant`

## 1. 数据契约

### 1.1 粒度与归属

- **锚点**：一个激活行程中已按天排期的景点。来源为 `plan.days[].stops[].poiId`；按 `poiId` 去重；`unscheduled` 不参与；候选必须对应 `pawtrip_location.type_group='attraction'`。
- **候选地点**：`pawtrip_location` 中属于激活行程城市、当前类型（餐厅或酒店）且满足宠物友好条件的记录。
- **距离**：每次请求按锚点与候选地点的经纬度实时计算，不新增数据库列、不缓存、不持久化。
- **锚点选择状态**：页面组件状态，不写入 `sessionStorage`/`localStorage`/服务端。
- **行程计划**：不改变 `TripPlan` 结构与保存方式；锚点不是行程数据的一部分。

### 1.2 字段

| 业务概念 | API / 状态字段 | 类型 | 空值语义 | 说明 |
|---|---|---|---|---|
| 锚点地点 ID | `nearPoiId` | string | 未提供 = 不应用距离筛选 | 指向 `pawtrip_location.poi_id` |
| 锚点名称 | 前端详情缓存 `name` | string | 详情未加载时不展示候选 | 仅用于选择器与距离文案 |
| 锚点类型 | 前端详情缓存 `typeGroup` | string | — | 必须是 `attraction` |
| 锚点经度 | `pawtrip_location.longitude` | REAL | `NULL` = 无法计算 | GCJ-02 |
| 锚点纬度 | `pawtrip_location.latitude` | REAL | `NULL` = 无法计算 | GCJ-02 |
| 候选地点距离 | `distanceMeters` | integer | 未应用距离筛选时为 `null` | 四舍五入到米；排序使用未舍入值 |
| 固定半径 | `NEARBY_RADIUS_METERS` | constant | — | `5000`，含边界 |
| 页面锚点状态 | `anchorPoiId` | string \| null | `null` = 未选锚点 | 页面内状态 |

### 1.3 状态流转

| 当前状态 | 事件 | 结果 |
|---|---|---|
| `anchorPoiId = null`，类型=景点 | 选择锚点 | 锚点写入；当前景点列表不变 |
| `anchorPoiId != null`，类型=景点 | 清除锚点 | 锚点清空；景点列表不变 |
| `anchorPoiId = null`，类型=餐厅 | 页面渲染 | 显示门禁空态；不请求列表 |
| `anchorPoiId = null`，类型=酒店 | 页面渲染 | 默认请求并展示该城市酒店；不显示距离 |
| `anchorPoiId != null`，类型=餐厅/酒店 | 页面渲染 | 请求带 `nearPoiId` 的列表；距离过滤并升序 |
| 餐厅视角已选锚点 | 切换到酒店 | 保留锚点；页码重置为 1；酒店按同一锚点过滤 |
| 餐厅/酒店已选锚点 | 切换到景点/宠物医院/宠物用品店 | 保留锚点；目标类型不应用距离筛选 |
| 已选锚点 | 锚点景点被移出行程 | 自动清空锚点；酒店恢复默认全量列表，餐厅显示门禁 |
| 已选锚点 | 激活行程切换/清空 | 自动清空锚点；酒店恢复默认全量列表，餐厅恢复门禁 |
| 已选锚点 | 锚点坐标被改为 `NULL` | 提示无法计算距离；不发起距离查询 |

### 1.4 API 契约

#### 请求

`GET /api/locations`

| 参数 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `regionCode` | 非管理员必填（现有） | — | 激活行程城市 |
| `typeGroup` | 否 | — | 用户页当前类型；距离筛选时页面只传 `hotel`/`restaurant` |
| `petFriendlyOnly` | 否 | `false` | 宠物友好筛选（现有） |
| `page` | 否 | `1` | 页码 |
| `pageSize` | 否 | `20` | 每页条数，最大 100 |
| `nearPoiId` | 否 | — | 新增；锚点地点 ID |

#### 锚点校验

仅当请求包含 `nearPoiId` 时执行：

1. 按 `poi_id` 查找地点；不存在 → `400 VALIDATION_ERROR`。
2. `type_group` 必须为 `attraction` → 否则 `400 VALIDATION_ERROR`。
3. `longitude` 与 `latitude` 均非空 → 否则 `400 VALIDATION_ERROR`。
4. 服务端不校验该景点是否属于当前用户的激活行程；接口没有行程上下文，行程归属由页面保证。

#### 距离过滤与排序

1. 先按现有区域、类型、`petFriendlyOnly` 条件读取候选集合（不先分页）。
2. 排除经纬度为 `NULL` 的候选。
3. 使用 Haversine 计算锚点到候选的米制距离。
4. 只保留 `distance <= 5000` 的候选。
5. 按 `distance` 升序、`id` 升序排序。
6. 在过滤后的集合上分页；`totalElements`、`totalPages`、`hasNext`、`hasPrevious` 均基于过滤后结果。
7. 响应每个候选增加 `distanceMeters`（四舍五入到米）。

#### 未提供 `nearPoiId`

保持现有数据库分页、`ORDER BY id ASC`、字段与筛选行为；`distanceMeters` 为 `null`（或省略，二者对现有客户端等价）。

#### 响应示例

```json
{
  "page": 1,
  "pageSize": 20,
  "totalElements": 2,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "items": [
    {
      "poiId": "e2e-restaurant-near",
      "name": "附近餐厅",
      "typeCode": "050000",
      "typeGroup": "restaurant",
      "address": "珠海市香洲区",
      "longitude": 113.5012,
      "latitude": 22.1013,
      "regionCode": "440402",
      "minVisitHours": null,
      "maxVisitHours": null,
      "maxPetsPerPerson": 1,
      "distanceMeters": 212,
      "petPolicies": {
        "allowedPetTypes": "DOG",
        "maxPetsPerPerson": 1,
        "maxSinglePetWeightKg": null,
        "maxSinglePetShoulderHeightCm": null,
        "leashRequired": null,
        "vaccinationProofRequired": null,
        "extraFeeCents": null,
        "reservationRequired": null
      }
    }
  ]
}
```

#### 错误

| 场景 | 响应 |
|---|---|
| 未登录 | `401 UNAUTHENTICATED`（现有） |
| 非管理员缺少合法 `regionCode` | `400 VALIDATION_ERROR`（现有） |
| 锚点不存在 / 非景点 / 无坐标 | `400 VALIDATION_ERROR`（新增校验） |
| 分页参数非法 | `400 VALIDATION_ERROR`（现有） |

接口 MUST NOT 调用高德；MUST NOT 新增数据库列或 schema 变更。

## 2. 边界分支

| 规则 | 分支 | In / Out | rationale |
|---|---|---|---|
| 锚点候选 | 景点在某一天 `stops` 中 | In | 已按天排期 |
| 锚点候选 | 景点只在 `unscheduled` | Out | 需求方确认未排期不算 |
| 锚点候选 | 已排期但 `typeGroup != attraction` | Out | 锚点固定为景点 |
| 锚点候选 | 同一 `poiId` 出现在多天 | 去重，保留一个候选 | 避免重复选项 |
| 锚点坐标 | `longitude`/`latitude` 任一为 `NULL` | Out（400/提示） | 无法计算距离 |
| 候选坐标 | 任一为 `NULL` | Out（排除） | 不把缺失坐标当 0 |
| 距离 | `distance <= 5000m` | In | 含边界 |
| 距离 | `distance > 5000m` | Out | 超出半径 |
| 锚点城市 | 锚点属于其他城市 | 允许；结果可能为空 | 行程允许多城市地点；空态说明 |
| 类型 | 餐厅/酒店 | 应用距离筛选 | 需求方确认 |
| 类型 | 景点/宠物医院/宠物用品店 | 不应用距离筛选 | 需求方确认 |
| 门禁 | 餐厅且无锚点 | Out（不请求列表） | 餐厅保留门禁 |
| 门禁 | 酒店且无锚点 | In（默认请求并展示列表） | 酒店默认列表；下拉可选锚点 |
| 门禁 | 宠物医院/宠物用品店且无锚点 | In（正常请求） | 不受门禁影响 |
| 无激活行程 | 任意类型 | Out（既有空态） | 现有页面行为 |
| 管理端 | 不传 `nearPoiId` | 保持原行为 | 管理端不受影响 |

## 3. 跨 REQ 一致性

| 能力 / 需求 | 本需求的关系 | 结论 |
|---|---|---|
| US-12 宠物友好食宿推荐与选择 | 本需求实现“先选景点、再看附近食宿”的显式锚点切片 | 不实现自动推荐；多景点距离口径仍由 US-12 决定 |
| US-08 宠物友好酒店筛选 | 酒店宠物友好筛选已由现有政策字段承接 | 距离排序是叠加条件，不改变宠物友好语义 |
| US-17 宠物友好餐厅筛选 | 餐厅宠物友好筛选已由现有政策字段承接 | 同上 |
| REQ-009 / `trip-attractions` | 城市、类型、宠物友好、分页、加入行程、详情弹窗 | 保持不变；新增酒店默认列表/下拉、餐厅门禁、距离 |
| REQ-006 目的地选择 | 激活行程城市 | 保持不变；距离筛选仍以激活行程城市为范围 |
| `location-management` | 管理端列表与编辑 | 无需求变更；共享接口仅增加可选参数 |
| REQ-011 | 需求方保留编号，仓库未登记 | 本需求使用 REQ-012，无冲突 |

## 4. 展示契约

| 触发 / 界面 | 内容 | 状态 |
|---|---|---|
| 酒店类型筛选栏 | “离景点最近”下拉，列出已排期景点名称 | 有候选可展开；无候选禁用并提示；默认“离景点最近” |
| 景点类型筛选栏 | “行程景点锚点”选择器，列出已排期景点名称 | 供餐厅筛选使用；无候选禁用并提示 |
| 锚点候选加载中 | 选择器显示加载态 | 不可选择 |
| 餐厅且无锚点 | 空态“请先在景点页选择行程景点”，提供返回景点类型按钮 | 不请求列表 |
| 酒店且无锚点 | 默认展示该城市全部酒店 | 不请求距离筛选 |
| 餐厅/酒店且已选锚点 | 距离筛选结果 | 卡片显示“距{锚点名}约 X.Xkm” |
| 5km 内无结果 | 空态“该锚点 5km 内暂无匹配地点” | 保留筛选条件 |
| 锚点无坐标 | 提示“该景点缺少坐标，无法计算距离” | 不发起距离查询 |
| 已加入行程的地点 | 既有“第 N 天”标识 | 与距离筛选并存 |
| 清除锚点 | 酒店恢复默认全量列表；餐厅恢复门禁 | 不改变其他筛选 |

距离文案使用一位小数公里；`< 0.1km` 可显示“约 0.1km”或“约 0.0km”，由实现统一，但 MUST 保持一位小数格式。

## 5. 测试计划

### 后端 API

- 5km 内、5km 外、恰好 5km 的过滤结果。
- `distanceMeters` 数值、升序排序、距离相同时的稳定顺序。
- 过滤后的分页、总数、`hasNext`/`hasPrevious`。
- 候选坐标为 `NULL` 时排除。
- 锚点不存在、非景点、坐标为空时返回 `400 VALIDATION_ERROR`。
- 未提供 `nearPoiId` 时保持原排序与响应。
- 区域、类型、`petFriendlyOnly` 与距离筛选组合。
- 非管理员缺少 `regionCode`、未登录的既有错误行为。
- 断言不调用高德。

### 前端

- 锚点候选只来自按天 stops、仅景点、按 `poiId` 去重、不含未排期。
- 未选锚点时切到餐厅/酒店不发起列表请求。
- 已选锚点时餐厅/酒店请求包含 `nearPoiId`；其他类型不包含。
- 查询 key 包含 `nearPoiId`；锚点/类型变化重置页码。
- 距离文案格式与“第 N 天”标识共存。
- 锚点被移出行程后自动清空并恢复门禁。

### E2E

- 更新 `scripts/seed-e2e-attractions.mjs`：为地点补经纬度，并增加 5km 内/外的餐厅与酒店夹具。
- 选择已排期景点作为锚点 → 切餐厅 → 只显示 5km 内餐厅、按距离升序、显示距离。
- 切酒店 → 同一锚点生效。
- 酒店列表默认展示全部酒店；“离景点最近”选择锚点后只显示 5km 内酒店。
- 未选锚点 → 餐厅门禁空态且无列表请求；酒店默认列表。
- 移除锚点景点 → 酒店恢复默认全量列表；餐厅恢复门禁。
- 宠物友好/显示全部地点与距离筛选组合。
- 无已排期景点时的禁用提示。
- 回归既有类型筛选、详情弹窗、加入行程与行程面板。

## 6. Probe log / DoR 复核

| 项 | 结论 | 依据 |
|---|---|---|
| 数据契约 | 锚点 `poiId` + 坐标；距离实时计算；无新列 | 需求方确认 + V4 schema |
| 边界 | 已枚举未排期、非景点、重复、无坐标、边界距离、跨城、门禁类型 | 第 2 节 |
| 跨 REQ | 与 US-12/US-08/US-17、REQ-006/009、location-management 对齐 | 第 3 节 |
| 展示 | 酒店默认列表与下拉、餐厅门禁空态、距离文案、无结果/无坐标提示 | 第 4 节 |
| 测试 | 后端、前端、E2E 三层覆盖；E2E 夹具需补坐标与餐厅 | 第 5 节 |
| BLOCKER | 0 | 无阻塞性未知依赖 |
