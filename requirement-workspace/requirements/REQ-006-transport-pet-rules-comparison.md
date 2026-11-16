---
id: REQ-005
title: 对比高铁/航班/自驾/火车携宠规则
status: ready-for-split
discovery: Go (2026-11-16)
impact: ../analysis/REQ-005/impact-brief.md
deep_dive: ../analysis/REQ-005/deep-dive.md
sources:
  - openspec/specs/web-app-shell/spec.md
  - openspec/specs/backend-data-access/spec.md
  - openspec/specs/frontend-data-fetching/spec.md
  - openspec/specs/location-management/spec.md
  - docs/knowledge/architecture/README.md
---

# REQ-005: 对比高铁/航班/自驾/火车携宠规则

## Discovery Decision

Go — 候选能力清晰：新增"交通携宠规则对比"能力，以表格列表把飞机（航司下拉切换：国航/东航/南航/海航）、高铁、火车、自驾四种方式的携宠规则（能否携带、体重上限、容器要求、办理流程概要）并列展示；规则数据全部写死在前端（`apps/web` 常量模块，含来源与复核标记）；规则 vs 宠物档案的对比逻辑放后端，档案表随 US-06 建立，不在本需求建（2026-11-16）。

## 六字段

1. **id**：REQ-005
2. **statement**：为计划携宠出行的已登录用户提供四种交通方式（飞机、高铁、火车、自驾）的携宠规则对比页面：以**表格列表**呈现四行（四种方式）× 五列（方式、能否携带、体重上限、容器要求、办理流程概要）；飞机行的"能否携带/体重上限"等单元格按航司不同而变化，通过**下拉选择器**切换航司查看（国航/东航/南航/海航）；其余三种方式展示通用规则；所有规则注明"以承运方最新规则为准"。规则数据全部写死在前端（`apps/web` 常量模块，标注来源与复核日期，发布前人工复核），页面为纯前端静态展示（无后端规则接口、无站内订票、无实时查询）。规则 vs 宠物档案的对比逻辑放后端，宠物档案表随 US-06 建立（不在本需求建）；本次仅预留对比契约与无档案时跳转宠物档案录入页的按钮（指向未来路由），本次可验收范围为规则展示。
3. **actors**：
   - 已登录用户（有/无宠物档案）：进入规则对比页，浏览四行表格；在飞机行下拉切换航司；无档案时看到录入档案入口
   - 前端应用 `apps/web`：硬编码规则常量，静态渲染规则对比页
   - 后端应用 `apps/server`：本需求无改动；后续 US-06 阶段承接档案表与规则对比判定
   - 内容维护者（开发/运营）：人工摘录官方规则、发布前复核、以代码变更更新规则
   - 未来宠物档案需求（US-06 承接方）：消费本次预留的对比契约与录入页路由
4. **rationale**：飞机、高铁、火车、自驾对携宠的要求差异很大（体重、容器、办理流程各不相同），用户目前需要在多个订票平台和官方渠道之间来回切换逐条确认，行前准备成本高。PawTrip 把主要交通方式的携宠规则放在一起对比，让用户在一处看清差异、选出适合自己和宠物的方式；规则数据同时供后续证明清单（US-07）和行程大交通安排复用。
5. **acceptance hints**：
   - AC-1 四方式对比：进入规则对比页，以表格列表并列展示飞机、高铁、火车、自驾四行，列固定为"方式、能否携带、体重上限、容器要求、办理流程概要"，"能否携带"以状态标识（可携带/有条件/不可）
   - AC-2 无档案仍可查看：未填写宠物档案的用户仍正常看到四行规则；页面提供跳转宠物档案录入页的按钮（本次指向预留路由）
   - AC-3 飞机按航司细分：飞机行提供航司下拉选择器（国航/东航/南航/海航），切换后该行单元格更新为所选航司规则，并注明"以航司最新规则为准"
   - 表格底部提示：规则为人工摘录、发布前复核、以承运方最新规则为准；无站内订票，请通过官方或第三方渠道预订
   - 高铁/火车/自驾展示通用规则，均注明"以承运方最新规则为准"
   - 规则数据来自前端常量模块，不调用后端接口；常量含来源链接与复核日期，发布前人工复核
   - 对比契约：档案表与后端对比逻辑随 US-06 建立，本需求不建表、不写判定逻辑；规则常量保留结构化体重上限字段供后续复用
   - 页面位于登录守卫之下，未登录访问跳转 `/login`
   - 不提供站内订票入口；预订仍由用户通过官方或第三方渠道完成
6. **links to evidence**：
   - 用户故事 US-05（2026-11-16 需求方提供）：Title/Story/AC-1~AC-3 与已决事项（2026-11-15）
   - 2026-11-16 需求方决策：数据承载 = 规则全部写死在前端常量（不建规则表、不写规则 API）；对比逻辑在后端，档案表等随 US-06 建立，本需求不建
   - 2026-11-16 需求方决策：宠物档案另立需求（US-06），本次仅预留对比/跳转契约，可验收范围为规则展示
   - 2026-11-16 需求方决策：沿用登录保护（页面在 `_authenticated` 下，API 在 `/api/**` 保护内）
   - 2026-11-16 需求方决策：航司覆盖国航/东航/南航/海航；首版定在 `/cities` 下新增子页，后改为**顶部导航新增 Tab「交通规则」**（独立路由，不再挂在 `/cities` 下）；先预留档案路由
   - 2026-11-16 需求方指示：网页静态展示；规则数据由开发从网上官方渠道检索摘录；P1 阶段先不加 UI
   - 现有应用外壳与守卫：`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/_authenticated.tsx`
   - 现有数据访问模式：`openspec/specs/backend-data-access/spec.md`、`openspec/specs/location-management/spec.md`
   - 现有取数模式：`openspec/specs/frontend-data-fetching/spec.md`、`apps/web/src/queries/greeting.ts`
   - 规则数据来源（检索记录见 deep-dive）：12306 官网、各航司官网小动物运输须知

## Ready 形状

### Intent

在一处集中对比飞机（按航司）、高铁、火车、自驾的携宠规则，消除用户跨平台逐条确认的行前准备成本；以官方摘录 + 入库 + 只读 API 的方式沉淀规则数据，供本次展示与后续证明清单（US-07）、行程大交通安排复用。

### Actors 与权限边界

- 已登录用户（服务端会话）：唯一内容消费者
- 未登录访客：访问规则页被引导至 `/login`
- 内容维护者：通过迁移版本维护数据，无站内编辑界面（MVP）
- 权限边界：沿用 REQ-003 认证契约，规则 API 位于受保护的 `/api/**`；前端守卫只做界面引导

### In / Out Scope

**In**

- 前端规则常量模块：四种交通方式 × 四维度；飞机按航司多行；含来源链接、来源标题与复核日期
- 前端规则对比页（登录守卫下的独立顶层页，建议 `/transport-rules`，入口为顶部导航 Tab「交通规则」）：表格列表（4 行 × 5 列）+ 飞机行航司下拉选择器（国航/东航/南航/海航）+ "以承运方最新规则为准"提示
- 无档案态：展示通用规则 + 跳转宠物档案录入页按钮（预留路由）
- 预留对比契约：规则常量保留结构化体重上限字段、"不推荐"显示位置约定（判定逻辑不实现，对比在后端且随 US-06 实现）
- 规则数据网上检索摘录与来源记录（12306/航司官网等），发布前复核
- 领域知识库补充（交通携宠规则内容与来源约定）

**Out**

- 规则数据库表、Flyway 种子与规则只读 API（已改为前端写死，不建）
- 宠物档案录入页、档案表与存储（随独立需求 US-06 建立）
- 规则 vs 档案的对比判定逻辑与"不推荐"渲染（在后端实现，随 US-06 接入；本需求不建档案表）
- 证明清单（US-07）、行程大交通安排
- 站内订票、实时余票/价格查询、与承运方系统对接
- 规则站内编辑管理界面（MVP 以代码变更更新）
- 公开访问（不调整 Spring Security 放行名单）
- 本阶段（P1）不写任何 UI/生产代码

### Scenarios + AC Hints

**S1 四方式表格对比（AC-1）**

- Given 已登录用户进入交通携宠规则对比页
- When 页面渲染
- Then 以表格列表并列展示飞机、高铁、火车、自驾四行
- And 列为：方式、能否携带、体重上限、容器要求、办理流程概要
- And "能否携带"以状态标识展示（可携带 / 有条件 / 不可）

**S2 无档案仍可查看（AC-2）**

- Given 用户未填写宠物档案（档案能力尚未上线）
- When 查看规则对比
- Then 四行通用规则正常展示（飞机行默认取默认航司规则）
- And 页面提供"录入宠物档案"按钮，指向预留的档案录入路由

**S3 飞机按航司下拉切换（AC-3）**

- Given 用户查看飞机行
- When 在航司下拉选择器中选择某航司（国航/东航/南航/海航）
- Then 该行"能否携带、体重上限、容器要求、办理流程概要"更新为所选航司规则
- And 注明"以航司最新规则为准"

**S4 表格静态展示**

- Given 用户位于规则对比页
- When 浏览表格
- Then 高铁/火车/自驾为通用规则单行，飞机行为航司下拉控制的单行
- And 表格底部展示规则来源/复核/免责与无站内订票提示

**S5 免责声明**

- Given 任意行的规则展示
- When 用户查看
- Then 均可见"以承运方最新规则为准"提示（飞机行文案为"以航司最新规则为准"）

**S6 未登录访问**

- Given 浏览器无有效会话
- When 访问规则对比页
- Then 跳转 `/login`，不展示规则内容

**S7 预留对比契约（本次不验收判定逻辑）**

- Given 档案需求就绪后接入
- When 用户已有宠物档案且档案不满足某方式规则（如体重超限）
- Then 前端该方式显示"不推荐"（契约预留，本次仅保证数据结构与显示位置可支撑）

**Boundary**：订票、实时查询、档案录入与判定逻辑、证明清单、规则编辑界面不在本次验收范围。

### Constraints

- 技术栈固定：Spring Boot / Java 21 / SQLite / Flyway（后端）；TanStack Start / React 19 / TanStack Query / shadcn/ui（Base UI）（前端）
- 数据承载：规则全部写死在前端常量（2026-11-16 已决）；不建规则表、不写规则 API
- 数据策略（MVP 统一）：12306/航司官网等官方渠道人工摘录，发布前人工复核；常量含来源与复核日期；更新走代码变更
- 对比逻辑在后端、档案表随 US-06 建立（2026-11-16 已决）；本需求不建表、不写判定
- 对比维度固定四项：能否携带、体重上限、容器要求、办理流程概要（2026-11-15 已决）
- 覆盖四方式：飞机（按航司细分：国航/东航/南航/海航）、高铁、火车、自驾（2026-11-15/16 已决）
- 页面静态展示：无后端规则接口、无订票、无实时查询；所有规则注明"以承运方最新规则为准"
- 沿用登录保护：页面在 `_authenticated` 守卫下（2026-11-16 已决）
- 宠物档案另立需求：本次仅预留对比/跳转契约（2026-11-16 已决）
- 规格先行：实现前形成 OpenSpec change（@rule:spec-first）
- P1 阶段不写 UI/生产代码（2026-11-16 需求方指示）

### Context

REQ-001~004 已建立问候语全链路、JPA 数据访问与 TanStack Query 取数规范、服务端会话登录、shadcn/ui（Base UI）应用外壳；后续变更已加入"城市浏览"`/cities`（空占位页）与管理员城市/地点管理导航。当前系统没有任何交通携宠规则数据。本次新增规则数据与对比展示能力，复用现有数据访问/取数/认证/UI 基线；规则对比页作为独立顶层页，入口为顶部导航新增 Tab「交通规则」（建议路由 `/transport-rules`，2026-11-16 需求方确认），`/cities` 与 `/paws` 保持现状。

### Affected Capabilities

- **ADDED** `transport-rules-catalog`（前端）：交通携宠规则常量模块（四方式 × 四维度，飞机按航司；含来源与复核日期）
- **ADDED** `transport-rules-comparison-page`：登录守卫下的四方式规则对比页（独立路由，建议 `/transport-rules`；四行表格、飞机行航司下拉、免责声明、无档案跳转按钮、预留对比契约）
- **MODIFIED** `web-app-shell`：顶部 AppTabs 新增一项「交通规则」（插在「城市浏览」之后、管理员 Tab 之前，`activeTab`/`navigate` 同步扩展）；`/cities` 页不变；后端与 `backend-data-access`、`frontend-authentication` 行为不变

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 规则数据承载方式？ | Product / SA | Confirmed（2026-11-16 两版）：初版定为入库+API；最终改为规则全部前端写死，不建规则表/API；对比在后端、档案表随 US-06 建 |
| blocking | resolved | 宠物档案是否纳入本次范围？ | Product | Confirmed（2026-11-16）：档案另立需求（US-06），本次预留对比/跳转契约，可验收范围仅规则展示 |
| blocking | resolved | 规则页认证边界（公开 vs 登录保护）？ | Product / SA | Confirmed（2026-11-16）：沿用登录保护，不动 Spring Security 放行名单 |
| non-blocking | resolved | 飞机覆盖哪些航司？ | Product / Dev | Confirmed（2026-11-16）：国航/东航/南航/海航四家（海航含托运+客舱两条） |
| non-blocking | resolved | 规则页导航入口放哪里？ | Product / Dev | Confirmed（2026-11-16 两版）：初版为 `/cities` 下子页；**最终改为顶部导航新增 Tab「交通规则」**（建议路由 `/transport-rules`），不在 `/cities` 下新增 |
| non-blocking | resolved | 预留档案录入路由路径与对比字段集合？ | Product / Dev | Confirmed（2026-11-16）：先预留档案路由（建议 `/paws/profile`，待 US-06 确认）；对比字段至少含体重（`weight_limit_kg`） |
| non-blocking | deferred | 高铁与火车规则是否需按车型/席别细分？ | Product | 后续解决；MVP 按方式通用规则展示（已决） |
| non-blocking | deferred | 规则复核流程与更新频率？ | Ops / Dev | 后续解决；MVP 发布前人工复核 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | 数据承载 | 未定时无法划分前后端影响面 | 已确认（最终版）：规则前端写死；对比在后端，档案表随 US-06 建；本需求为纯前端变更 |
| BLOCKER | resolved | 档案依赖 | 故事原文"按体重判断由 US-06 承接"与补充要求"有档案则对比显示不推荐"存在边界冲突 | 已确认：档案另立需求，本次预留契约，验收范围仅规则展示 |
| BLOCKER | resolved | 认证边界 | 静态科普内容是否公开访问影响安全基线 | 已确认：沿用登录保护 |
| WARNING | resolved | 数据来源时效 | 网上摘录的规则可能过时，航司政策差异大 | 常量含来源链接 + 复核日期 + 免责声明；合并前人工复核；未复核条目不得入库 |
| SUGGESTION | resolved | 导航入口 | 新增 Tab 或页内入口未定 | 已确认（2026-11-16，变更）：顶部导航新增 Tab「交通规则」，独立路由 `/transport-rules`；不在 `/cities` 下新增 |

BLOCKER 数：0。

## Evidence / Verification Notes

- 应用外壳与守卫：`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/_authenticated.tsx`、`apps/web/src/routes/_authenticated/paws.tsx`（空页）
- 数据访问与迁移模式（参考，本需求不改）：`openspec/specs/backend-data-access/spec.md`、`apps/server/src/main/resources/db/migration/`
- 取数模式（参考）：`apps/web/src/queries/greeting.ts`、`openspec/specs/frontend-data-fetching/spec.md`
- 纯前端常量先例：`apps/web/src/components/ui/` 配置类文件、`openspec/specs/ui-foundation/spec.md`
- 地点管理（含宠物政策字段先例）：`openspec/specs/location-management/spec.md`
- 规则数据检索记录：见 `../analysis/REQ-005/deep-dive.md` 数据来源表（P1 检索产出）