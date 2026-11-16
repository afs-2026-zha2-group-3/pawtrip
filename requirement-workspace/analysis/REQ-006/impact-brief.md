# Impact brief — REQ-006 选择目的地

- 生成日期：2026-11-16（G1 Revision 同日修订：宠物档案改外部依赖）
- 上游需求：[requirements/REQ-006-destination-selection.md](../../requirements/REQ-006-destination-selection.md)
- 意图来源：[intents/REQ-006-issue-15-destination-selection.md](../../intents/REQ-006-issue-15-destination-selection.md)（issue #15，US-47，Must）

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-006 | 选择目的地（搜索、宠物友好筛选与选定生效） | ready-for-split | `requirements/REQ-006-destination-selection.md` |

阻塞开放问题：0；DoR BLOCKER：0（WARNING「种子数据内容」已标 deferred）。

已确认决策（2026-11-16，需求方）：
1. 依赖路径：本 change 携带最小数据地基（禁养名单+政策收录标记+试点种子）；**宠物档案由外部 change（US-01）交付，本 change 只读消费（G1 Revision）**
2. AC-2 筛选口径：原型口径（政策已收录且档案品种不在禁养名单；无档案退化为仅按收录状态）
3. AC-3 状态归属：前端 localStorage，后端不感知
4. 候选城市：珠海、杭州（需求方指定，替代原型 5 城）
5. 政策详情整页留给 #14；禁养判定逻辑本 change 落地供复用
6. 顶栏目的地 chip 保留（G1 Revision 确认）

## 2. As-is 资产清单（证据路径）

| 区域 | 路径 | 现状 | 是否受影响 |
|---|---|---|---|
| 架构知识 | `docs/knowledge/architecture/README.md` | 技术栈、认证、数据访问、前端约定完整；无目的地/宠物档案模块 | 是（新增模块说明） |
| Living Spec | `openspec/specs/web-app-shell/spec.md` | Home/Paws 两 Tab；**未含 PR #30 新增的 Cities Tab（spec 滞后于代码）** | 是（顺带补齐 Cities Tab 事实） |
| Living Spec | `openspec/specs/paws-page/spec.md` | `/paws` 受保护空页 | 否（档案由外部 change 交付，本 change 不改 paws-page） |
| Living Spec | `openspec/specs/location-management/spec.md` | 管理员地点管理 + V7 携宠政策字段；无禁养名单/收录标记 | 间接（数据模型扩展，管理端行为不变） |
| Living Spec | `openspec/specs/frontend-data-fetching/`、`frontend-api-request/`、`backend-data-access/`、`backend-error-handling/`、`backend-authentication/`、`ui-foundation/`、`browser-e2e-testing/` | 取数/请求/数据访问/错误/认证/UI/E2E 约定 | 复用约定，契约不变 |
| 归档资产 | `openspec/changes/archive/2026-11-16-admin-location-management/`、`2026-11-15-add-amap-poi-search/` | 行政区树读取、POI 分层模式可参照 | 参照 |
| 代码 | `apps/web/src/routes/_authenticated/cities.tsx` | 空占位页（PR #30） | 是（本 REQ 主页面） |
| 代码 | `apps/web/src/routes/_authenticated/paws.tsx` | 空占位页 | 否（外部 change 实现档案表单） |
| 代码 | `apps/server/.../db/migration/V4/V5/V7` | 行政区表+全国种子+携宠政策字段 | 是（新增迁移） |
| 代码 | `apps/server/.../location/AdminLocationService.java` | 省市树仅 `/api/admin/regions` 管理端 | 参照（用户端需新接口） |
| 外部依赖 | 宠物档案 | main 无 pet 表/实体/API/页面；远端 `feature/add-pet-schema`（未合并）仅 pet 表 schema（V8）+ `allowed_pet_types`（V9），**无 breed、无接口、无页面** | 只读消费（等对方补齐 breed/接口/`/paws`） |
| 缺口 | 禁养犬种数据 | 无禁养名单、无政策收录标记 | 是（新建） |

## 3. As-is → proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `web-app-shell` spec | 两 Tab（Home/Paws），Cities Tab 已在代码但未入 spec | MODIFIED：补 Cities Tab 事实；如顶栏展示当前目的地上下文则一并定义 |
| `paws-page` spec | `/paws` 内容为空 | **不改**（G1 Revision：档案表/breed/接口/页面由外部 change / US-01 交付） |
| 新能力 `destination-selection` | 不存在 | ADDED：`/cities` 搜索/筛选/选定/提醒；候选=珠海+杭州；筛选原型口径；选定存 localStorage；禁养精确匹配判定 |
| `location-management` spec | 管理端行为 + V7 字段 | 不改管理端需求；数据模型扩展（禁养名单+收录标记）在新能力 spec 中声明，避免污染 admin 契约 |
| 数据库 | V1–V7（外部未合并分支另有 V8/V9） | 新增迁移：禁养犬种名单 + 政策收录标记（挂行政区维度，沿用 PR #32 方向）+ 珠海/杭州种子；**不建档案表**（外部 change 交付，注意迁移版本号协调） |
| 后端 API | `/api/admin/**` 管理端；`/api/auth/**`；`/api/greeting` | 新增用户端只读城市候选接口（含收录状态、禁养名单）；档案读取走外部 change 提供的接口；均走既有认证/错误契约 |
| 前端状态 | TanStack Query 服务端状态；无全局 store | 新增 cities queries 与档案只读 query（消费外部接口）；新增 localStorage「已选目的地」读写（客户端状态，不进 Query 服务端缓存语义） |
| E2E | 登录/登出/Tab/404 等 | 新增 `/cities` 搜索→筛选→选定→提醒链路（Playwright Chromium）；档案相关用例依赖外部 change 交付 |
| 架构 KB | 无目的地/档案模块 | 补充模块、接口、数据与 localStorage 约定说明 |

## 4. Blast radius（应用架构层）

- `apps/server`：新增 destination（用户端城市候选）功能模块 + Flyway 迁移；不改认证、错误契约、既有 admin/location 行为；不建 pet 模块（外部 change）
- `apps/web`：`/cities` 页面实现、queries 新增（含档案只读）、localStorage 选定状态、顶栏目的地 chip（保留，已确认）；不改 `/paws`
- `e2e/`：新增验收链路
- 不影响：高德集成、地点管理管理端、登录契约、greeting

## 5. Artifact impact

- specs：ADDED `destination-selection`；MODIFIED `web-app-shell`（paws-page 不改，G1 Revision）
- tests：后端接口验收测试（城市候选/禁养匹配边界，档案输入按外部契约）+ Playwright E2E
- docs：`docs/knowledge/architecture/README.md` 增补；registry/handoff 更新
- 数据：珠海/杭州禁养名单与收录状态需政府公开文件摘录（deferred 数据任务）

## 6. Dual-track notes

- OpenSpec：单 change 即可承载（见 §8）；delta spec 按能力拆分
- Agile：issue #15 为 Must story；最小数据地基是本 story 的使能子任务；宠物档案为外部 change（US-01）交付的依赖项，需协调契约（breed 词表）与合并顺序；#14 后续 story 直接复用本 change 落地的判定逻辑

## 7. Risks & blockers

| 级别 | 风险 | 处置 |
|---|---|---|
| 非阻塞 | 珠海禁养名单/收录状态未摘录；品种命名需与档案品种枚举精确对齐（精确匹配不支持别名） | 实现期数据任务；品种枚举与名单用同一词表，deep-dive 定字段 |
| 非阻塞 | localStorage 选定状态换设备即丢，后端不感知 | 需求方已确认接受；后续 story 需要服务端上下文时另行演进 |
| 非阻塞（规格）/ 阻塞（P4 实现） | 外部档案 change 未交付 breed/接口/`/paws` 页面（现仅 schema）；AC-2 完整口径与 AC-4 的实现/E2E 依赖其就绪 | 需求方确认等对方补齐、本 change 只消费（2026-11-16）；与对方协调 breed 词表、读取接口契约与合并顺序；迁移版本号避免冲突 |
| 记录 | `web-app-shell` spec 滞后于代码（Cities Tab） | 本 change delta 顺带补齐 |

**Critical blockers：0。**

## 8. Suggested split boundaries

建议**单 change**：`destination-selection`（或 `add-destination-selection`），内含两块使能+主体（G1 Revision 后）：
1. 数据地基：禁养名单+收录标记+珠海/杭州种子（迁移）
2. 目的地选择主体：用户端城市候选 API + `/cities` 页面 + localStorage 选定 + 禁养提醒（档案品种只读消费外部 change）

理由：两块共同构成 issue #15 的可验收闭环；宠物档案由外部 change（US-01）交付，本 change 不重复实现，AC-2/AC-4 的完整验收以外部契约就绪为前提。
## 修订记录（2026-11-16，合并 main 后）

- 编号 REQ-005 → REQ-006（main 已将 REQ-005 用于地点宠物政策）；上文为 P1 时点简报，历史口径保留。
- 拆分结论修订：最小数据地基（V14）移除，候选=全部城市级行政区；选定存 sessionStorage；搜索/宠物友好筛选为服务端实现（`max_pets_per_person` null 或 >=1 友好）。
- 外部依赖进展：宠物档案接口与 `/paws` 页面已合并 main（PR #33–#36、#40），breed 字段仍缺失；禁养提醒相关验收继续门控。
