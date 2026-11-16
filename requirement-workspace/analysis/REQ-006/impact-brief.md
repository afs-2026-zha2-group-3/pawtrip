# Impact brief — REQ-005 对比高铁/航班/自驾/火车携宠规则

- 生成日期：2026-11-16
- 上游需求：[../requirements/REQ-005-transport-pet-rules-comparison.md](../requirements/REQ-005-transport-pet-rules-comparison.md)
- Deep-dive：[deep-dive.md](deep-dive.md)

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-005 | 对比高铁/航班/自驾/火车携宠规则 | ready-for-split | `requirements/REQ-005-transport-pet-rules-comparison.md` |

阻塞开放问题：0（3 项 blocking 均 resolved）；DoR BLOCKER：0；deep-dive ⑨–⑫ Pass。终版决策（2026-11-16）：**规则全部前端写死（不建规则表/API），本需求为纯前端变更**；对比在后端、档案表随 US-06 建；航司（国航/东航/南航/海航）、入口（**顶部导航新增 Tab「交通规则」**）、预留档案路由均已 resolved；车型细分与复核频率 deferred。

## 2. As-is 资产清单（证据路径）

| 区域 | 路径 | 现状 | 是否受影响 |
|---|---|---|---|
| Living Spec | `openspec/specs/backend-data-access/spec.md` | JPA 数据访问规范 | 否（复用） |
| Living Spec | `openspec/specs/frontend-data-fetching/spec.md`、`frontend-api-request/spec.md` | TanStack Query + request 层规范 | 否（复用） |
| Living Spec | `openspec/specs/backend-authentication/spec.md`、`frontend-authentication/spec.md` | `/api/**` 会话保护、`_authenticated` 守卫 | 否（复用，不改放行名单） |
| Living Spec | `openspec/specs/web-app-shell/spec.md`、`paws-page/spec.md` | Home/Paws 两 Tab 基线；后续变更已加"城市浏览"`/cities`（空占位页）与管理员城市/地点 Tab | 是（新增顶部 Tab「交通规则」，AppTabs 扩一项） |
| Living Spec | `openspec/specs/location-management/spec.md` | 地点含宠物政策字段 | 否（不同概念，不共表） |
| 后端迁移 | `apps/server/src/main/resources/db/migration/V1~V6` | greeting/用户/地点管理/行政区划 | 否（本需求不建规则表） |
| 后端代码 | `apps/server/src/main/java/com/pawtrip/server/` | greeting/用户/地点/amap 模块 | 否（对比逻辑随 US-06） |
| 前端路由 | `apps/web/src/routes/_authenticated/cities.tsx` | `/cities` 为空占位页 | 否（不动）；新增兄弟路由 `_authenticated/transport-rules.tsx` → `/transport-rules` |
| 前端取数 | `apps/web/src/queries/greeting.ts` | query options 模式先例 | 否（规则常量直出，不走查询） |
| 前端外壳 | `apps/web/src/routes/__root.tsx` | AppTabs：Home/Paws/城市浏览 + 管理员 Tab | 是（新增顶部 Tab「交通规则」，插在「城市浏览」之后、管理员 Tab 之前；activeTab 与 navigate 同步扩展） |
| 知识库 | `docs/knowledge/domain/README.md` | 占位 | 是（补交通携宠规则内容与来源约定） |
| 规则 | `docs/knowledge/rules/**` | spec-first、分层、测试规则 | 约束实现，不修改 |
| 归档资产 | `openspec/changes/archive/2026-11-16-admin-location-management/` 等 | 最近 change 先例（迁移+API+前端页） | 否（参考模式） |

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| 数据库 | 无交通规则数据 | 无变化（规则不入库） |
| 后端 | 无规则接口 | 无变化（对比逻辑与档案表随 US-06） |
| 前端数据 | 无规则常量 | 新增规则常量模块（建议 `apps/web/src/data/transport-rules.ts`：四方式×四维度，飞机按航司，含 `allowanceStatus`/`weightLimitKg`/来源/复核日期） |
| 前端页面 | 无规则页 | 新增顶层页面 `/transport-rules`（建议）：四行表格（方式/能否携带/体重上限/容器要求/办理流程概要）+ 飞机行航司下拉 + 底部免责/无站内订票提示 + 无档案跳转按钮 + 预留"不推荐"位置 |
| 前端取数 | 仅 greeting/auth/locations queries | 无新增查询；页面直接引用常量 |
| 导航 | AppTabs：Home/Paws/城市浏览 + 管理员 Tab | **新增顶部 Tab「交通规则」**（路由 `/transport-rules`，已登录可见；普通用户 3→4 项，管理员 5→6 项；不放在 `/cities` 下）（2026-11-16 需求方更改） |
| 知识库 | domain/interfaces 占位 | 补交通携宠规则内容、来源清单与复核约定 |
| Living Spec | 无交通规则能力 | 归档后新增 `transport-rules-catalog`、`transport-rules-comparison-page`，MODIFIED `web-app-shell`（新增 Tab） |

## 4. Blast radius

- **apps/server**：无变化（无新表、无新接口）。
- **apps/web**：新增规则常量模块、顶层受保护路由 `/transport-rules`；`__root.tsx` AppTabs 新增「交通规则」Tab；`routeTree.gen.ts` 重新生成；`/cities` 不变。
- **数据内容面**：规则时效性由"常量来源链接+复核日期+免责声明+合并前人工复核"承担；火车/自驾/海航条目当前为"待复核"，合并前必须核实。
- **不受影响**：认证后端契约、地点管理、greeting、高德 POI、部署流水线。

## 5. Artifact impact

- **Specs**：一个 OpenSpec change 承载 2 个 ADDED capability + MODIFIED `web-app-shell`（新增顶部 Tab「交通规则」）；无后端 capability 变更。
- **Tests**：无需后端接口测试；E2E 加规则页场景（登录→四行表格→飞机航司下拉切换→未登录跳转）；前端组件测试沿用现状（未引入）。
- **Docs/KB**：domain 知识库补充；deep-dive 数据来源表作为复核底稿。
- **CI/CD**：沿用现有 server/web/e2e 流水线，无新增产品。

## 6. Dual-track notes

- **OpenSpec**：单 change（建议 id `transport-pet-rules-comparison`），切片：常量模块→页面→入口/测试。
- **Agile**：可拆 2–3 薄故事（规则常量与来源记录 / 对比页 / 入口与 E2E），US-05 对应整体；US-06（后端对比、档案表）、US-07（证明清单）在 deep-dive 中已锚定。
- 需求保持后端无关表述；"规则前端写死、对比后端"已写入 Constraints。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| blocker | 无 | 无阻塞性未知依赖 |
| 合并前置 | 待复核数据（D2 火车/D6-D7 海航/D8 自驾） | 常量合并前人工复核；`verifiedOn` 为空不得合并 |
| 风险 R1 | 官方页面 JS 渲染/反爬导致摘录不全 | 已记录来源与复核状态；复核阶段人工打开页面/致电 95572、95530、95583 核实 |
| 风险 R2 | 规则时效（高铁试点扩围、赴美犬只暂停等动态政策） | 免责声明 + sourceUrl + 常量变更更新机制；文案注明"以承运方最新规则为准" |
| 风险 R3 | 高铁体型限制（肩高/身长）无法仅靠体重判定 | MVP 判定契约仅体重（US-06）；体型限制写入 weightLimitNote 展示，判定扩展由 US-06 决定 |
| 风险 R4 | 顶部 Tab 「交通规则」与现有 Tab（普通 3 项 / 管理员 5 项）在小屏下拥挤 | Tab 顺序固定为 Home/Paws/城市浏览/交通规则/管理员项；窄屏沿用现有 Tab 横向压缩策略；非阻塞 |
| 风险 R5 | 规则前端写死与 US-06 后端对比的数据同步 | 对比需要后端拿到规则阈值，方式待 US-06 定（前端传参或后端留最小副本）；本次以 `id`+`weightLimitKg` 字段与稳定常量结构降低迁移成本 |

## 8. Suggested split boundaries

- 建议 change id：`transport-pet-rules-comparison`
- 工作切片（按依赖顺序）：
  1. **T1 规则常量**：`transport-rules` 常量模块（含来源/复核字段，完成待复核条目人工核实）
  2. **T2 对比页**：`/transport-rules` 路由 + 四行表格/"能否携带"状态标识（由 `allowanceStatus` 驱动）/飞机行航司下拉/底部提示/无档案按钮 + 预留契约位置
  3. **T3 导航与收尾**：`__root.tsx` AppTabs 新增「交通规则」Tab（activeTab/navigate 同步）、知识库补充、E2E 场景（登录→点顶部「交通规则」→四行表格→航司下拉切换→未登录跳转 `/login`）
- 边界原则：纯前端交付，不涉及数据库/后端接口；数据复核（T1）可与页面开发（T2）并行，但合并前必须完成。