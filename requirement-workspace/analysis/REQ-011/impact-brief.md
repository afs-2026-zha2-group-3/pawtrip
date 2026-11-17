# REQ-011 Impact Brief：途内交通推荐（打车/步行）

## 1. Requirement set

- `requirement-workspace/requirements/REQ-011-intra-city-transport.md`
- `requirement-workspace/intents/REQ-011-intra-city-transport.md`
- `requirement-workspace/analysis/REQ-011/deep-dive.md`

## 2. As-is asset inventory（证据路径）

**Knowledge base**

- `docs/knowledge/architecture/README.md`：高德基础设施分层（`application.port.maps` 端口 ← `infrastructure.amap.api` 适配器 ← 共享 `transport`/`config`）；Key 仅服务端、缺失可启动、调用以类型化错误失败；地点模块查询契约。
- `docs/knowledge/external/README.md`：高德 POI 2.0 已落地；**路线规划 2.0 明确为"仅供未来扩展参考，不属于当前实现"**，并提示驾车参数过长需 POST、共享传输层不应固化为 POI 专用——本次落地需遵循该告诫（现有 `AmapTransport.getJson(path, params)` 为通用 GET，可直接复用）。
- `docs/knowledge/rules/process/spec-first.md`：生产代码前需稳定变更规格。
- 高德路线规划 2.0 官方文档（2026-11-17 核对，知识库暂无详细条目，需补入）：驾车 `GET /v5/direction/driving` 返回 `route.taxi_cost`（元，字符串，基础字段）；驾车/步行时长需 `show_fields=cost` → `paths[].cost.duration`（秒）；步行 `GET /v5/direction/walking` 返回 `paths[].distance`（米）；坐标「经度,纬度」小数 ≤6 位；可传 `origin_id`/`destination_id`（POI ID）。

**Living Spec**

- `openspec/specs/trip-planning/spec.md`：Plan JSON v1 已定义 `stops` 元素 `{poiId, toNext?}`，`toNext ∈ {walk, drive, transit}` 可省略/为 null；同一 poiId MAY 同日重复；`/api/trips` 登录 + 归属校验、`400 VALIDATION_ERROR` / `404 TRIP_NOT_FOUND` 口径。
- `openspec/specs/trip-context/spec.md`：左下角行程面板按天分组渲染、拖拽排序/跨天移动、乐观更新 + 约 600ms 防抖整量 `PUT`、保存状态与失败重试、大交通 tag。
- `openspec/specs/backend-amap-poi-search/spec.md`：POI 搜索适配器与共享传输层既有行为（本次复用不改）。
- `openspec/specs/backend-error-handling/spec.md`：Problem Details 错误码体系（估算接口的错误响应沿用）。
- `openspec/specs/frontend-api-request/spec.md`、`openspec/specs/frontend-data-fetching/spec.md`：统一 request 层与 TanStack Query 约定（估算查询沿用）。

**Post-archive SDD assets**

- `openspec/changes/archive/2026-11-16-transport-pet-rules-comparison/`、`.../2026-11-16-add-rule-recommendation-and-selection/`：交通规则前端常量与大交通选择模式（本次不改交通规则页；公共交通静态提示可参考其前端常量模式）。
- `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/`（REQ-009，已归档，PR #50）：景点携宠规则展示，不触碰行程面板段行。
- `openspec/changes/unify-location-browsing/`（active，PR #60 已合并、Living Spec 已同步）：统一地点浏览，将 attraction 查询/类型更名为 locations（`locationBrowseDetailQueryOptions`/`LocationBrowseDetail`），对 `trip-panel.tsx`/`store.ts`/`types.ts` 仅更名级改动；与交通段行无能力冲突，合并时注意面板文件潜在文本冲突（低概率）。

**当前实现**

- `apps/web/src/components/trip/trip-panel.tsx`：按天 header + stop 行渲染（`rows` useMemo），无交通段行。
- `apps/web/src/lib/trip/store.ts`、`plan.ts`、`types.ts`：`toNext` 已在移动/插入时透传保留，但无设置 action、无 UI。
- `apps/server/.../trip/TripPlanValidator.java`、`TripService.java`、`Trip.java`：`toNext` 校验与 `plan_json` 持久化已就绪。
- `apps/server/.../infrastructure/amap/`：`AmapTransport`（通用 GET + Key）、`AmapProperties`、`AmapPlaceSearchAdapter`（POI 专用）。
- `apps/server/.../location/`：`pawtrip_location` 含 `longitude`/`latitude`/`poiId`，可按 poiId 批量查坐标。
- `apps/server/src/main/resources/application.yml`：`amap.api-key=${AMAP_API_KEY:}`、`base-url=https://restapi.amap.com`。

## 3. As-is → proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/web/src/components/trip/trip-panel.tsx` | 按天 header + stop 行，无交通信息 | 相邻 stop 间插入交通段行（方式选择 + 估算展示 + 加载/不可用态）；相邻同一 POI 段不调用高德，仅在景点行下方展示小字提醒；每天标题下一条公共交通静态提示（该天有段时）；段行不可拖拽，不改变既有拖拽行为 |
| `apps/web/src/lib/trip/store.ts` | `toNext` 仅透传，无 setter | 新增设置某 stop `toNext` 的 action（乐观更新 + saveRevision 递增，复用防抖保存） |
| `apps/web/src/queries/`（trips 或新模块） | 无估算查询 | 新增 route-estimate 查询（key=景点对+方式），走统一 request 层 |
| `apps/server` trip 模块 | 仅 CRUD | 新增估算端点（建议 `GET /api/trips/{tripId}/route-estimate?fromPoiId&toPoiId&mode`）：登录 + trip 归属校验、mode ∈ {walk, drive}、poiId 存在性校验、坐标读取、调用端口 |
| `application.port.maps` | 仅 `PlaceSearchPort` | 新增路线规划端口（步行/驾车估算） |
| `infrastructure.amap.api` | 仅 POI 适配器 | 新增路线规划适配器：driving（`taxi_cost` + `show_fields=cost`）/ walking（`show_fields=cost`）；坐标格式化 ≤6 位小数；复用 `AmapTransport`/`AmapProperties`，不改 POI 适配器 |
| `TripPlanValidator` / Plan JSON v1 | `toNext ∈ {walk, drive, transit}` | **不改**（契约已覆盖；UI 仅暴露 walk/drive，`drive` 语义=打车） |
| `openspec/specs/trip-context/spec.md` | 面板渲染与保存契约 | MODIFIED：新增交通段行、方式选择写入 `toNext`、公共交通每天一条提示、估算展示与失败态、同 POI 段小字提醒（不算路） |
| 新 capability `trip-route-estimate` | 不存在 | ADDED：估算 API 契约（参数/归属/错误码/响应字段）+ 高德路线规划适配行为 |
| `docs/knowledge/external/README.md` | 路线规划 2.0 为"未来扩展参考" | 更新为已落地，并补入路线规划 2.0 参数/返回字段文档条目 |
| 测试 | 前端 vitest / 后端 JUnit / Playwright 基线 | 新增：适配器与服务端估算单测、store/段行渲染单测、途内交通 E2E（含失败兜底）；不引入新测试框架 |

**Checked, no impact**：`trip-planning` Living Spec（结构不变）、`backend-amap-poi-search`（POI 行为不变）、`web-app-shell`（不新增 Tab/路由）、大交通 `transportMode` 与交通规则页、数据库 schema（无迁移）、Spring Security 放行名单。

## 4. Blast radius

- **直接受影响**：`apps/web` 行程面板 + trip store + 查询层；`apps/server` trip 模块 + 高德基础设施（新端口/适配器）。
- **外部依赖**：高德 Web 服务新增路线规划调用量（每天视图 n−1 段 × 方式切换）；受 Key 配额与权限约束。
- **不受影响**：数据库 schema、认证 API、地点/城市管理 API、交通规则页、导航结构、部署拓扑。
- **运行时**：无新服务/进程；服务端新增出站到 `restapi.amap.com` 的既有域名调用。

## 5. Artifact impact

- **Specs**：ADDED `trip-route-estimate`；MODIFIED `trip-context`；`trip-planning` 仅语义注释（可不产生 delta）。
- **Tests**：后端（适配器解析/服务校验/错误映射）、前端（store action、段行渲染、默认方式、失败态、同 POI 小字提醒）、E2E（选择-保存-恢复、每天提示、兜底、同 POI 提醒）。
- **Docs / KB**：`docs/knowledge/external/` 补路线规划 2.0 文档；`docs/knowledge/architecture/README.md` 补端口/适配器与估算端点说明。
- **No impact**：Flyway 迁移、`plan_json` 结构、既有错误码定义（新增码沿用 Problem Details 体系）。

## 6. Dual-track notes

- **OpenSpec**：建议 1 个 change 覆盖「服务端估算 + 前端段行 + 选择持久化」完整垂直切片；capability 为 `trip-route-estimate`（ADDED）+ `trip-context`（MODIFIED）。
- **Agile**：可拆 3 个实现故事——① 服务端估算 API 与适配器；② 面板段行与估算展示；③ 方式选择持久化与公共交通提示——但用户价值在面板闭环，不建议拆成多个 Change。

## 7. Risks & blockers

| 风险 | 影响 | 缓解 |
|---|---|---|
| 高德 Key 权限/配额不足（驾车算路或 `taxi_cost` 字段不可用） | 打车估算失败 | P3 前用真实 Key 冒烟验证两个端点；失败走 S6「估算暂不可用」兜底，不阻塞主流程 |
| `taxi_cost`/`duration` 为字符串且可能缺失或非数值 | 解析异常、展示错误 | 适配器做类型化解析与校验，异常映射为上游失败错误码 |
| 每天多段并发调用高德 | 延迟与配额压力 | 前端按「景点对+方式」缓存；并发/限流细节 P3 设计（非阻塞 OQ 已 deferred） |
| 坐标精度 >6 位小数 | 高德拒绝请求 | 适配器统一格式化 ≤6 位 |
| 与 `unify-location-browsing` active change 并行 | 合并冲突（低概率，面板仅更名级交集） | 合并 main 后复验面板渲染与 E2E |
| 既有数据 `toNext=transit`（契约允许但 UI 不提供） | 选择器无对应选项 | 显示按默认打车处理，不主动改写存量值；用户显式选择后覆盖（deep-dive ② 已枚举） |

**Critical blockers**：无。

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`add-intra-city-transport-estimate`。
- 用户可见目标：查看每天行程时，相邻景点间可选打车/步行并看到参考费用区间与时长，公共交通明确不可携宠，选择随行程保存。
- 依赖 DAG：`trip-planning` / `trip-context`（已归档基线）→ 本 change；与 REQ-009（已归档）及 `unify-location-browsing` 无能力依赖，可并行。
- 不建议单独拆「高德路线规划基础设施」Change：无独立用户价值，且规模小，随本 change 一并交付。