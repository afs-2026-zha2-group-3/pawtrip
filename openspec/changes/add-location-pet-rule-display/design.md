# Design

## Context

见 `proposal.md` 的 Why。当前约束：

- `pawtrip_location` 已有 V7 六项政策、V9 `allowed_pet_types`、V11 `max_single_pet_shoulder_height_cm`；管理 API 只暴露 6 项，用户端没有地点查询接口。
- REQ-006（`destination-selection`）已实现 `/cities` 目的地选择，选定城市存于 `sessionStorage` 的 `pawtrip.selectedDestination`（`adcode` / `cityName` / `province`），顶栏有目的地 chip，登出清除。
- 所有 `/api/**` 默认需登录；`/api/admin/**` 需 `ADMIN`。前端统一用 TanStack Query + `lib/http/request.ts`；后端用 JPA + Flyway + Problem Details。
- 现有测试模式：后端 `@SpringBootTest` + MockMvc + 独立 SQLite（`AdminLocationApiTest`、`DestinationApiTest`）；E2E 用真实后端 + 临时 SQLite + `scripts/run-e2e.mjs`。
- Revision 2 决定：不新增 `entry_policy` / `entry_note`，不新增迁移；默认列表按 `max_pets_per_person >= 1`。

## Goals / Non-Goals

**Goals**

- 用最小改动把现有地点政策开放给登录用户：一个只读查询模块、两个前端页面。
- 列表与详情共用同一政策字段展示语义；E2E 可独立验证“已选城市 → 列表 → 详情”。
- 保持数据库 schema、管理 API/弹窗、认证、错误、高德集成都无行为变化。

**Non-Goals（设计层补充）**

- 不新增规则表、规则枚举列、JSON 规则聚合或管理端录入界面。
- 不引入新的全局状态库、UI 组件库或外部服务。
- 不做行程内展示、非景点类型、搜索/排序/推荐、照片展示。
- 不改变 REQ-006 的候选/筛选/选定/持久化实现。

## Decisions

### D1 数据模型：直接使用现有 8 列

复用 `pawtrip_location` 的 `allowed_pet_types`、`max_pets_per_person`、`max_single_pet_weight_kg`、`max_single_pet_shoulder_height_cm`、`leash_required`、`vaccination_proof_required`、`extra_fee_cents`、`reservation_required`。`max_pets_per_person` 是唯一友好门槛：`>=1` 友好、`0` 禁止、`NULL` 未配置。

- 备选：新增 `entry_policy` / `entry_note` 三档 → Revision 2 需求方否决；会引入人工补录与迁移。
- 备选：独立规则表 → 否决，当前是一对一且无需多版本规则。

### D2 数据库：不新增列、不新增迁移

本 change 不产生 Flyway 迁移，也不修改 `PawtripLocation` 实体字段。数据维护继续走现有管理弹窗（6 项）与既有数据。

- 备选：为 `max_pets_per_person` 加索引 → 现有 `idx_pawtrip_location_region_type_id` 覆盖主要过滤；暂不新增，等规模证明需要时再评估。

### D3 查询 API：新增用户端只读模块

在 `com.pawtrip.server.location` 内新增 `LocationQueryController`（`/api/locations`）、`LocationQueryService` 与 `LocationQueryResponses`，不要求 `ADMIN`；认证沿用 `/api/**` 现有规则，SecurityConfig 不变。

- 备选：复用 `AdminLocationController/Service` → 否决，会暴露管理权限与 admin DTO 形状。
- 备选：`/api/attractions` 顶层路径 → 否决，详情是地点级资源，`/api/locations` 更完整。

### D4 列表查询：native page query + maxPets 摘要

`PawtripLocationRepository` 增加 `findAttractionPage(regionCode, regionLevel, includeWithoutRules, pageable)` native query：

- `type_group = 'attraction'`；
- 城市级按 `substr(region_code,1,4)=substr(:regionCode,1,4)`，省级按前 2 位（复用 `ValidatedRegion` 口径）；
- `includeWithoutRules=false` 时追加 `max_pets_per_person >= 1`；
- 按 `id ASC` 排序，带 countQuery。

服务层把实体映射为摘要，返回 `poiId`、`name`、`typeCode`、`typeGroup`、`address`、`regionCode`、`maxPetsPerPerson`；前端据此派生“宠物友好/禁止携带/未配置”三态。不返回其他政策字段。

- 备选：前端逐条请求详情判断三态 → 否决，N+1 且列表变慢。
- 备选：JPA Specification → 否决，项目既有复杂查询使用 native query，保持一致性。

### D5 区域校验：在查询服务内复用现有口径

`LocationQueryService` 校验 `regionCode` 为 6 位且存在、级别为 `province` 或 `city`；不满足返回 `400 VALIDATION_ERROR`。为保持管理模块不动，先在新服务内重复这段 10 行校验；若后续第三个调用方出现再抽取共享 helper。

- 备选：把 `AdminLocationService.ValidatedRegion` 提为公共类 → 本 change 不需要，避免无谓重构。

### D6 详情与错误

`GET /api/locations/{poiId}` 返回已保存地点的基础信息与 `petPolicies`（8 个可空字段）；不返回照片、business、`poi_json`。不存在返回 `404 LOCATION_NOT_FOUND`；未认证返回 `401 UNAUTHENTICATED`。前端 404 交给现有根错误组件呈现，不新增错误页。

### D7 前端路由与状态

新增 `apps/web/src/routes/_authenticated/attractions/index.tsx`（列表）与 `attractions/$poiId.tsx`（详情），位于现有登录守卫下。列表读取 `useSelectedDestination()`：

- 无已选城市：显示“请先选择目的地”+ 去 `/cities` 的按钮，`enabled=false`，不发请求；
- 有已选城市：查询 key 包含 `adcode`、`includeWithoutRules`、`page`、`pageSize`，切换城市自动重取；
- 详情查询 key 包含 `poiId`。

- 备选：复用 `/cities` 页面内嵌列表 → 否决，会和 destination-selection 的 Non-goal 与页面职责耦合。
- 备选：弹窗详情 → 否决，缺少可分享 URL 与返回路径。

### D8 UI 组合：复用现有组件 + 路由局部组件

列表用 `Card` 组合（名称、地址、友好 badge），空态用 `Empty`，提示用 `Alert`，按钮用 `Button`；在 `attractions/` 路由目录下放 `-attraction-card.tsx`、`-pet-friendly-badge.tsx`、`-pet-policy-fields.tsx` 等局部组件。badge 用 Tailwind token 表达，不新增全局 UI 原语。

badge 三态由 `maxPetsPerPerson` 派生：`>=1` → “宠物友好”，`0` → “禁止携带”，`null` → “未配置”。

- 备选：新增 shadcn `Badge` 组件 → 当前只有一处使用，等出现第二处再抽。
- 备选：表格 + TanStack Table → 列表是卡片式浏览，表格 pagination 过重。

### D9 入口与 Tab

新增顶层“景区浏览”Tab（`/attractions`）；`/cities` 选定城市后自动进入 `/attractions` 并选中该 Tab；`__root.tsx` 的 `activeTab` 将 `/attractions` 与 `/attractions/*` 归入 `attractions`。城市浏览页不内嵌景点列表，也不提供“查看{城市}景点”按钮。

- 备选：在城市浏览页增加入口按钮 → 需求方 Revision 3 否决；入口应为独立 Tab。
- 备选：将 `/attractions` 归入“城市浏览”Tab → 需求方否决；景区浏览需要独立 Tab。
- 备选：顶栏 chip 作为入口 → 可读性弱，且 chip 当前只做上下文展示。

### D10 数据录入：沿用现有管理弹窗，不新增脚本

- 管理员继续通过现有“保存地点”/“pawtrip地点”弹窗维护 6 项政策，其中 `maxPetsPerPerson` 决定列表门槛。
- `allowed_pet_types` 与肩高不在弹窗中；公开详情有值才展示，本 change 不新增录入入口或种子脚本。
- E2E 仍需 `scripts/seed-e2e-attractions.mjs <db-path>` 插入确定性地点，由 `run-e2e.mjs` 在用户种子之后调用；只操作临时库。
- API 测试用仓库 helper 直接造数，不依赖脚本。

- 备选：新增生产种子脚本 → 不需要，现有字段由管理弹窗维护。
- 备选：管理 UI 新增三档/说明 → Revision 2 需求方否决。

### D11 分页与空态

服务端分页，默认 `page=1`、`pageSize=20`，`pageSize` 上限 100；列表底部显示上一页/下一页与总数。默认口径无结果时区分“城市无已保存景点”和“暂无宠物友好的已保存景点”；后者提示切换全部景点。

### D12 不新增规则枚举/派生字段

不引入 `entryPolicy`、`entryNote`、`hasRuleDetails`。列表只返回 `maxPetsPerPerson`；前端用纯函数派生三态。详情直接返回 8 个字段。

## Risks / Trade-offs

- [默认门槛依赖 `maxPetsPerPerson` 已维护] → 未录入/`NULL` 的地点不会进入默认列表；数据补齐前列表可能为空；由现有管理弹窗维护，建议提供数据核对清单。
- [现有管理弹窗只编辑 6 项] → `allowed_pet_types` 与肩高不在弹窗中；公开详情有值才展示，不要求本 change 补录。
- [归档顺序] → `web-app-shell` 的景点 Tab 选中态依赖 destination-selection 引入的“城市浏览”Tab；本 change 必须在 destination-selection 归档后归档。
- [导航 Tab 数量增加] → 顶部普通 Tab 从三个变为四个；destination-selection 的既有 e2e 已按“选定城市后自动进入景区 Tab”更新，并通过全量回归。
- [区域匹配边界] → 用区县级 `region_code` 夹具覆盖城市前缀匹配；省级叶节点作为防御性分支，API 测试覆盖。
- [E2E 种子与迁移耦合] → 种子脚本只插数据、不建表；`run-e2e.mjs` 在迁移完成后调用；脚本失败即阻断 E2E。
- [公开详情范围] → 仅返回基础信息与 `petPolicies`，不返回照片/business；如后续需要展示照片，另开需求。

## Migration Plan

1. 无数据库迁移。后端先发布只读查询 API，旧前端不受影响。
2. 前端随后发布 `/attractions`、`/cities` 入口与 Tab 映射。
3. 数据维护沿用现有管理弹窗；未维护 `maxPetsPerPerson` 的地点不会进入默认列表。
4. 回滚：前端回滚即可隐藏入口；后端只读 API 可保留或回滚，无数据变更。
5. 归档：在 `destination-selection` 归档之后合并 Living Spec；按 G1 Revision 2 记录保留残余关注点。

## Open Questions

无。分页控件形态、省级叶节点实现细节均在 P3 任务中按现有模式落地，不改变本设计的接口或范围。
