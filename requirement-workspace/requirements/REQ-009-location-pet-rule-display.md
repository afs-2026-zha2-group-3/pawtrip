---
id: REQ-009
title: 宠物友好景点携宠规则展示
status: in-change
discovery: Go (2026-11-16, Revision 2)
impact: ../analysis/REQ-009/impact-brief.md
deep_dive: ../analysis/REQ-009/deep-dive.md
sources:
  - requirement-workspace/requirements/REQ-006-destination-selection.md
  - requirement-workspace/analysis/REQ-006/deep-dive.md
  - apps/web/src/lib/selected-destination.ts
  - apps/web/src/routes/_authenticated/cities.tsx
  - apps/web/src/routes/__root.tsx
  - apps/server/src/main/java/com/pawtrip/server/location/PawtripLocation.java
  - apps/server/src/main/java/com/pawtrip/server/location/PawtripLocationRepository.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationService.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationController.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationResponses.java
  - apps/server/src/main/resources/db/migration/V7__add_pet_entry_policies.sql
  - apps/server/src/main/resources/db/migration/V9__add_allowed_pet_types.sql
  - apps/server/src/main/resources/db/migration/V11__add_dog_breed_and_pet_limits.sql
  - apps/web/src/lib/pet-policy.ts
  - openspec/specs/location-management/spec.md
  - openspec/specs/web-app-shell/spec.md
  - openspec/changes/destination-selection/
  - openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/
  - openspec/changes/archive/2026-11-16-add-pet-entry-policies/
  - docs/knowledge/architecture/README.md
  - https://github.com/afs-2026-zha2-group-3/pawtrip/issues/17
---

# REQ-009: 宠物友好景点携宠规则展示

## Revision 记录

- **Revision 2（2026-11-16，需求方确认）**：
  - 公开景点页 `/attractions` 固定从数据库读取，不再从高德 API 筛选景点。
  - 默认列表按现有字段 `maxPetsPerPerson >= 1` 判定宠物友好；`0` 视为禁止携带，`NULL` 视为未配置。
  - 移除原规划的 `entry_policy` / `entry_note` 三档枚举与补充说明，不新增数据库列或迁移。
  - 详情展示现有 8 个政策字段；`maxPetsPerPerson` 是唯一列表门槛。
- **Revision 3（2026-11-16，需求方确认）**：
  - 新增顶层“景区浏览”Tab（`/attractions`），不再在城市浏览页内嵌景点列表或放置入口按钮。
  - `/cities` 选定城市后自动进入 `/attractions`；当前城市由顶部 chip 与景区页标题展示。
- **Revision 1（2026-11-16，已被 Revision 2 取代）**：三档枚举 + 补充说明 + 现有字段一起展示；默认按 `entry_policy` 非空筛选。该口径不再实施。

## Discovery Decision

Go（2026-11-16）。`pawtrip_location` 已保存 6 项宠物政策（V7）以及允许宠物类型、单只肩高（V9/V11），管理端两个现有弹窗可编辑其中 6 项；但用户端没有公共读取路径，也没有景点列表/详情页面。US-47（REQ-006）已提供已选目的地城市（sessionStorage），可作为景点列表的上下文。Revision 2 收敛为：公开景点页只读数据库，默认列表按 `maxPetsPerPerson >= 1` 显示宠物友好景点，可切换显示该城市全部已保存景点；不新增字段/迁移；AC-2 依赖 US-48，本轮不做。

## 六字段

1. **id**：REQ-009
2. **statement**：登录用户可通过顶部“景区浏览”Tab 查看景点，也可在 `/cities` 选定目的地后自动进入 `/attractions` 查看该城市已保存的景点；列表默认只显示 `maxPetsPerPerson >= 1` 的宠物友好景点，可切换显示该城市全部已保存景点。列表按 `maxPetsPerPerson` 显示三种状态：`>= 1` → “宠物友好”，`0` → “禁止携带”，`NULL` → “未配置”。点击景点进入详情，展示景点基础信息与现有 8 个非空政策字段（允许宠物类型、每位游客最多携带数、单只最大体重、单只最大肩高、牵引绳、疫苗证明、额外费用、预约要求）。本需求不提供编辑、城市选择、地点类型筛选、行程内展示或非景点类型；不新增数据库字段或迁移。
3. **actors**：
   - 登录用户（任意角色）：浏览已选目的地城市的景点及携宠政策
   - `apps/web` `/cities` 页面：选定目的地后自动进入 `/attractions`，不内嵌景点列表或入口按钮
   - `apps/web` 顶部导航：提供“景区浏览”Tab，与 `/attractions`、`/attractions/$poiId` 同步
   - `apps/web` `/attractions` 与 `/attractions/$poiId`：景点列表与详情展示
   - `apps/server` 地点模块：提供登录用户可读的景点列表与地点详情接口，只读数据库
   - 管理员：通过现有“保存地点”/“pawtrip地点”弹窗维护 6 项政策（沿用 REQ-005，不新增 UI）
   - 行程模块（US-48，未来）：本需求不接入
4. **rationale**：政策字段已落库且管理员可维护，但用户端看不到；`maxPetsPerPerson` 已是“每人最多携带数”，`0` 与 `>=1` 天然区分禁止/友好，可直接作为列表门槛，避免再引入一套三档枚举和人工补录。公共页只读数据库也能避免实时高德调用与筛选口径分叉。
5. **acceptance hints**：
   - 用户在 `/cities` 选定珠海后自动进入 `/attractions`，顶部“景区浏览”Tab 选中
   - 城市浏览页不内嵌景点列表，也不显示“查看{城市}景点”按钮
   - 顶部导航显示“景区浏览”Tab；打开 `/attractions` 或详情时该 Tab 选中
   - 已选珠海且景点 A 的 `maxPetsPerPerson=1`：打开 `/attractions` 默认显示 A 与“宠物友好”
   - 景点 B 的 `maxPetsPerPerson=0`：默认列表不显示 B；切换“显示全部景点”后显示 B 与“禁止携带”
   - 景点 C 的 `maxPetsPerPerson=NULL`：默认列表不显示 C；切换全部后显示 C 与“未配置”
   - 详情显示所有非空政策字段；`NULL` 字段不显示
   - `extraFeeCents=1050` 显示为 `10.5 元 / 只 / 次`；`0` 显示为 `0 元 / 只 / 次`
   - 布尔 `true` 显示“需要”，`false` 显示“不需要”，`NULL` 不显示
   - 未选定目的地时提示先选择目的地，并提供前往 `/cities` 的入口
   - 城市没有已保存景点、或没有宠物友好景点时，分别显示可读空态；后者提供切换全部景点的提示
   - 非景点（酒店/餐厅/宠物医院/用品店）不出现在列表
   - 未登录访问接口返回 `401`；不存在的 `poiId` 返回 `404 LOCATION_NOT_FOUND`
   - 后端列表/详情不调用高德 API
   - AC-2 的行程内展示不在本需求验收范围
6. **links to evidence**：
   - 已选目的地：`apps/web/src/lib/selected-destination.ts`、`apps/web/src/routes/_authenticated/cities.tsx`、`requirement-workspace/requirements/REQ-006-destination-selection.md`
   - 现有数据：`V7__add_pet_entry_policies.sql`、`V9__add_allowed_pet_types.sql`、`V11__add_dog_breed_and_pet_limits.sql`、`PawtripLocation.java`
   - 现有管理 API：`AdminLocationController.java`、`AdminLocationService.java`、`AdminLocationResponses.java`
   - 现有展示工具：`apps/web/src/lib/pet-policy.ts`
   - 现行规格：`openspec/specs/location-management/spec.md`、`openspec/specs/web-app-shell/spec.md`
   - 现行 change：`openspec/changes/destination-selection/`
   - 归档基线：`openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/`、`openspec/changes/archive/2026-11-16-add-pet-entry-policies/`
   - 架构说明：`docs/knowledge/architecture/README.md`
   - 2026-11-16 Revision 2 需求方决策：DB-only；`maxPetsPerPerson >= 1` 为友好门槛；移除三档；不新增迁移；保留 8 字段展示

## Ready 形状

### Intent

让已选定目的地的用户直接看到该城市的景点及其携宠政策，用现有政策字段判断是否适合带宠物进入，并在详情中核对数量、体重、肩高、牵引、疫苗、费用与预约要求。

### Actors 与权限边界

- 登录用户（任意角色）：唯一读者；不要求 `ADMIN`。
- `/cities`：负责目的地选择与进入景点页的入口，不承载景点政策展示。
- `/attractions` 与 `/attractions/$poiId`：只读展示，不提供编辑或写入。
- 地点模块 API：服务端认证后返回已保存地点与现有政策字段。
- 管理员：沿用现有地点弹窗维护 6 项政策；不新增三档/补充说明录入。
- 普通用户与管理员均可查看；管理员不因其角色获得额外展示能力。

### In / Out Scope

**In**

- 新增顶层“景区浏览”Tab；`/cities` 选定目的地后自动进入 `/attractions`；城市浏览页不内嵌景点列表或入口按钮
- 新增 `/attractions`：读取已选目的地；按城市展示已保存景点；默认仅 `maxPetsPerPerson >= 1`；可切换显示全部已保存景点；无地点类型筛选
- 新增 `/attractions/$poiId`：展示景点基础信息、宠物友好状态与现有 8 个非空政策字段
- 新增登录用户可读的地点查询 API：城市景点分页列表与地点详情，只读数据库
- 列表三态：`maxPetsPerPerson >= 1` → 宠物友好；`0` → 禁止携带；`NULL` → 未配置
- 列表与顶栏 Tab 状态：新增“景区浏览”Tab；`/attractions` 与 `/attractions/$poiId` 归入该 Tab
- 后端 API、前端查询与 Playwright e2e 测试

**Out**

- AC-2 行程内同步展示与任何行程模块改动（依赖 US-48）
- 新增 `entry_policy` / `entry_note` 或任何数据库迁移
- 管理端新增三档/补充说明录入或编辑界面；现有管理 API 与弹窗不变
- 城市选择控件（城市来自 REQ-006 的已选目的地）
- 非景点类型（酒店、餐厅、宠物医院、宠物用品店）的公开列表/展示
- 地点类型筛选、关键词搜索、距离排序、宠物档案匹配、推荐评分
- 行政区（`administrative_region`）政策与城市政策（US-04）
- 照片、business、原始 POI JSON 的公开展示
- 在线预订、导航、分享、收藏或加入行程
- 修改 REQ-006 的目的地候选、筛选或选定逻辑

### Scenarios + AC Hints

**S1 选择目的地后自动进入景点列表**

- Given 用户位于 `/cities`
- When 用户选定珠海
- Then 自动进入 `/attractions`
- And 顶部“景区浏览”Tab 处于选中状态
- And 列表只请求并展示珠海范围内已保存的景点

**S1a 顶部景区浏览 Tab**

- Given 用户已登录
- When 顶部导航渲染
- Then 显示“景区浏览”Tab
- And 打开 `/attractions` 或景点详情时该 Tab 选中
- And 城市浏览页不内嵌景点列表或“查看景点”按钮

**S2 默认只显示宠物友好景点**

- Given 珠海有景点 A（`maxPetsPerPerson=1`）与景点 B（`maxPetsPerPerson=0`）
- When 用户打开 `/attractions`
- Then 列表显示 A 与“宠物友好”
- And 不显示 B

**S3 切换显示全部景点**

- Given 列表默认只显示宠物友好景点
- When 用户打开“显示全部景点”
- Then B 出现在列表中并显示“禁止携带”
- And `maxPetsPerPerson=NULL` 的景点显示“未配置”

**S4 三态 badge**

- Given 列表项分别为 `maxPetsPerPerson >= 1`、`0`、`NULL`
- When 列表渲染
- Then 分别显示“宠物友好”“禁止携带”“未配置”

**S5 详情展示政策字段**

- Given 景点 A 已配置部分政策字段
- When 用户打开 A 的详情
- Then 显示所有非空政策字段及其中文标签与单位
- And `NULL` 字段不显示

**S6 无政策景点详情**

- Given 景点 C 的全部政策字段为 `NULL`
- When 用户从“显示全部景点”打开 C
- Then 详情显示“暂无携宠政策”
- And 不显示空字段表格

**S7 未选择目的地**

- Given 用户未在 `/cities` 选定目的地（sessionStorage 无值）
- When 用户打开 `/attractions`
- Then 页面提示先选择目的地
- And 提供前往 `/cities` 的入口
- And 不发起景点列表请求

**S8 空态**

- Given 已选定城市
- When 该城市没有已保存景点
- Then 显示“该城市暂无已保存景点”
- When 该城市有已保存景点但没有 `maxPetsPerPerson >= 1` 的景点且列表处于默认模式
- Then 显示“该城市暂无宠物友好的已保存景点”并提示可切换全部景点

**S9 权限与错误**

- Given 浏览器没有有效登录会话
- When 请求景点列表或详情 API
- Then 返回 `401 UNAUTHENTICATED`，前端跳转 `/login`
- Given 请求不存在的 `poiId`
- Then 返回 `404 LOCATION_NOT_FOUND`
- Given `regionCode` 缺失或非法
- Then 返回 `400`，且不返回其他城市数据

**S10 非景点不进入列表**

- Given 某已保存地点属于酒店/餐厅/宠物医院/用品店
- When 用户浏览 `/attractions`
- Then 该地点不出现在列表

**S11 只读数据库**

- Given 用户浏览景点列表或详情
- When 后端处理请求
- Then 只读取 `pawtrip_location` 等数据库表
- And 不调用高德 POI API

**S12 行程内展示（Out）**

- Given 行程模块尚未实现
- When 评审 US-25
- Then AC-2 明确不在本需求范围
- And 由 US-48 落地后另行接入

### Constraints

- 不新增数据库列或迁移；使用 `pawtrip_location` 现有 8 个政策字段：`allowed_pet_types`、`max_pets_per_person`、`max_single_pet_weight_kg`、`max_single_pet_shoulder_height_cm`、`leash_required`、`vaccination_proof_required`、`extra_fee_cents`、`reservation_required`。
- 默认列表门槛固定为 `max_pets_per_person >= 1`；`includeWithoutRules=true` 时返回该城市全部已保存景点。
- 列表三态：`>=1` → “宠物友好”，`0` → “禁止携带”，`NULL` → “未配置”。
- 详情展示所有非空政策字段；布尔 `true`→“需要”、`false`→“不需要”、`NULL` 隐藏；费用分转元并标注“元 / 只 / 次”；数量“只 / 人”，体重 kg，肩高 cm，允许宠物类型“猫/狗/猫和狗”。
- 公共查询 API 只要求登录，不要求 `ADMIN`；沿用现有会话认证与 Problem Details 错误契约。
- 城市范围复用 REQ-006 已选目的地的 `adcode`；景点按 `type_group='attraction'` 过滤；不提供城市选择或类型选择。
- 城市匹配复用地点管理的省/市级口径：城市级按 `region_code` 前 4 位，省级叶节点按前 2 位；细节见 deep-dive。
- 列表服务端分页；默认每页 20 条，`pageSize` 上限 100。
- 详情返回已保存地点的基础信息与非空政策字段；不返回照片、business 或原始 POI JSON。
- 管理端现有 6 项政策编辑不变；`allowed_pet_types` 与肩高仍不在管理弹窗中，有值才展示。
- 不新增顶部 Tab 以外的导航结构；新增“景区浏览”Tab，`/attractions` 与 `/attractions/$poiId` 归入该 Tab；`/cities` 选定后自动跳转，城市浏览页不内嵌景点列表或入口按钮。
- 不修改 REQ-006 的候选搜索、宠物友好筛选、选定存储与登出清理逻辑；仅在 `/cities` 增加进入景点页的入口。

### Context

- REQ-006 已实现 `/cities` 目的地选择，选定状态存于 `sessionStorage` 的 `pawtrip.selectedDestination`（`adcode` / `cityName` / `province`），顶栏展示目的地 chip，登出清除。
- `pawtrip_location` 已有 V7 的 6 项政策（数量、体重、牵引、疫苗、费用、预约），以及 V9 的 `allowed_pet_types`、V11 的 `max_single_pet_shoulder_height_cm`；管理 API 只暴露 6 项。
- 现有管理 API 全部位于 `/api/admin/**`，没有用户端地点查询接口；`/api/**` 默认需登录。
- 现有前端没有 `/attractions` 路由；`/cities` 是目的地选择页，`/paws` 是宠物管理页；顶部导航将新增“景区浏览”Tab，选择城市后自动进入该 Tab。
- 行程模块不存在；US-48 仍为 open。

### Affected capabilities

- **NEW** `attraction-pet-rules`：已选城市下的景点列表、景点详情与现有政策字段展示；`maxPetsPerPerson` 三态与只读查询 API。
- **MODIFIED** `web-app-shell`：新增“景区浏览”Tab；`/attractions` 与 `/attractions/$poiId` 归入该 Tab 选中态；`/cities` 选定后自动进入该 Tab。
- **不改动** `location-management` 的管理行为与管理 API（沿用现有字段与弹窗）。
- **不改动** `destination-selection` 的候选、筛选、选定与持久化需求（仅增加一个进入景点页的 UI 入口）。
- **复用** `backend-authentication`、`backend-error-handling`、`backend-data-access`、`frontend-api-request`、`frontend-data-fetching`、`ui-foundation`、`browser-e2e-testing`。

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 公开景点页的数据来源？ | 需求方 | 已确认：数据库，不调用高德 |
| blocking | resolved | 宠物友好的判定口径？ | 需求方 | 已确认：`maxPetsPerPerson >= 1` |
| blocking | resolved | 是否保留 `entry_policy` / `entry_note`？ | 需求方 | 已确认：移除，不新增字段/迁移 |
| blocking | resolved | 列表默认与切换口径？ | 需求方 | 已确认：默认仅友好，可切换全部 |
| blocking | resolved | AC-2 是否本轮实现？ | 需求方 | 已确认：Out of Scope，依赖 US-48 |
| blocking | resolved | 景点页从哪里进入？ | 需求方 | 已确认：新增顶层“景区浏览”Tab；`/cities` 选定城市后自动跳转，不在城市浏览页放入口 |
| non-blocking | resolved | 详情展示哪些字段？ | 需求方 / SA | 已确认：现有 8 个非空政策字段 |
| non-blocking | deferred | 列表分页大小与控件形态？ | SA / UX | 默认每页 20，沿用现有分页形状；P3 细化 |
| non-blocking | deferred | 城市级/省级叶节点的匹配细则？ | SA | deep-dive 已给口径，P3 按现有 `ValidatedRegion` 逻辑落地 |

## DoR 自检

| # | 检查项 | 结果 | 证据 / 说明 |
|---|---|---|---|
| 1 | Intent clear | Pass | Intent 与 statement |
| 2 | Actors defined | Pass | Actors 与权限边界 |
| 3 | Scope bounded | Pass | In / Out Scope；AC-2 明确 Out |
| 4 | Scenarios / AC hints concrete | Pass | S1–S12 |
| 5 | Exception / boundary | Pass | S7–S9 与 deep-dive 边界表 |
| 6 | Results verifiable | Pass | 列表门槛、三态 badge、字段值、空态、401/404 |
| 7 | Dependencies / app-arch touchpoints | Pass | REQ-006 已选目的地、现有政策字段、前端路由 |
| 8 | Open-questions gate | Pass | blocking = 0；非阻塞项已 resolved 或 deferred |
| 9 | Data contract decided | Pass | [deep-dive](../analysis/REQ-009/deep-dive.md) 数据契约表 |
| 10 | Boundary enumerated | Pass | deep-dive 边界表覆盖 0/NULL/>=1、切换、无城市、无数据、错误 |
| 11 | Cross-REQ aligned | Pass | deep-dive 跨 REQ 表 |
| 12 | Notification / display contract | Pass | 无通知；列表与详情展示契约已列明 |

DoR 结论：BLOCKER = 0。WARNING：默认门槛依赖 `max_pets_per_person` 已维护；未录入或为 `NULL` 的地点不会进入默认列表，数据补齐前列表可能为空。SUGGESTION：实现后补充地点公开查询与政策展示的知识库条目。

## Impact

见 [REQ-009 Impact Brief](../analysis/REQ-009/impact-brief.md)。
