# Proposal

## Why

US-25（issue #17，Must）要求用户在到访前看到景点和公共设施的携宠规则。`pawtrip_location` 已保存 6 项宠物政策（V7）以及允许宠物类型、单只肩高（V9/V11），管理员可在现有地点弹窗维护其中 6 项；但用户端没有任何公共读取路径，也没有景点列表/详情页面。REQ-006（US-47）已提供已选目的地城市，缺口现在收敛为：在已选城市下展示数据库中的景点及现有携宠政策。

上游需求：`requirement-workspace/requirements/REQ-009-location-pet-rule-display.md`（REQ-009，Revision 2，ready-for-split）；影响简报：`requirement-workspace/analysis/REQ-009/impact-brief.md`；数据/边界/展示契约：`requirement-workspace/analysis/REQ-009/deep-dive.md`。

## What Changes

- **不新增数据库列或迁移**：直接使用 `pawtrip_location` 现有 8 个政策字段；`maxPetsPerPerson` 作为唯一列表门槛。
- 默认景点列表只展示 `maxPetsPerPerson >= 1` 的地点；列表三态为 `>=1` → “宠物友好”、`0` → “禁止携带”、`NULL` → “未配置”。用户可切换“显示全部景点”，返回该城市全部已保存景点。
- 新增登录用户可读的地点查询 API：`GET /api/locations/attractions`（按已选城市分页，默认仅 `maxPetsPerPerson >= 1`）与 `GET /api/locations/{poiId}`（地点详情 + 8 项 `petPolicies`）；只读数据库，不调用高德。
- 新增顶层“景区浏览”Tab（`/attractions`）与列表页内详情弹窗：读取激活行程城市，不提供城市选择或地点类型筛选；详情展示现有 8 个非空政策字段，全空显示“暂无携宠政策”。
- `/cities` 选定城市后创建行程草稿并停留在城市详情；城市浏览页不内嵌景点列表，也不显示“查看{城市}景点”按钮。
- 顶部导航新增“景区浏览”Tab；`/attractions` 归入该 Tab 选中态。
- 补充公开 API、前端查询与 Playwright e2e 测试。

## Non-Goals

- 不做 US-25 的 AC-2（行程中的地点同步展示）；依赖 US-48，另行接入。
- 不新增 `entry_policy` / `entry_note` 或任何数据库迁移；不引入三档枚举。
- 不做管理端三档/说明录入、编辑或校正界面；管理 API 与两个地点弹窗不变。
- 不做城市选择控件；城市来自激活行程。
- 不把景点列表嵌入“城市浏览”页面，也不在城市浏览页提供额外入口按钮。
- 不做酒店、餐厅、宠物医院、宠物用品店等非景点类型的公开列表/展示。
- 本变更不做地点类型筛选、关键词搜索、距离排序、收藏/分享；逐宠物政策匹配与「添加到行程」由 add-frontend-trip-context / refine-attraction-browse 提供，不属本变更验收范围。
- 不做行政区政策（US-04）、照片/business/原始 POI 展示、在线预订或导航。
- 不修改 REQ-006 的候选搜索、宠物友好筛选、选定存储与登出清理逻辑。
- 不修改既有认证、错误契约、高德集成与地点管理管理端行为。

## Capabilities

### New Capabilities

- `attraction-pet-rules`: 激活行程城市下的景点列表、景点详情弹窗与现有携宠政策字段展示；`maxPetsPerPerson` 三态口径与只读查询 API。

### Modified Capabilities

- 无。“景区浏览”Tab 已由 `web-app-shell` 主 spec 覆盖，本变更不再提供该 delta。

## Impact

- 后端（self）：`apps/server` 地点模块新增用户端只读查询控制器/服务/DTO 与仓库查询；不新增迁移、不新增实体字段、不调用高德。
- 前端（self）：`apps/web` 新增 `/attractions` 列表与列表内详情弹窗、景点查询与展示组件；顶部导航复用既有“景区浏览”Tab；`/cities` 选定后创建行程草稿并停留在城市详情；移除城市浏览页的入口按钮。
- 上游（upstream）：依赖 `trip-context` 提供的激活行程城市（`active.cityAdcode`），复用既有认证、Problem Details、JPA、TanStack Query、UI 基线与 e2e 基线。
- 下游（downstream）：US-17 / US-08 / US-12 可复用现有政策字段与展示语义；US-48 可复用详情展示组件接入行程内展示。
- 测试：后端公开 API 测试、前端查询单测、`/attractions` Playwright e2e；既有管理端 e2e 与目的地 e2e（草稿/激活流程）回归。
- 文档：更新 `docs/knowledge/architecture/README.md` 的用户端地点查询、景区 Tab 与展示路径。
- 规模预估：S–M（中等偏小）；无数据库迁移、无管理 UI、无既有契约破坏。
- 风险：① 默认门槛依赖 `maxPetsPerPerson` 已维护，数据补齐前列表可能为空；② `allowed_pet_types` 与肩高不在管理弹窗中，有值才展示；③ 顶部导航 Tab 与激活行程上下文需回归既有路由/守卫（已由全量 E2E 覆盖）。
