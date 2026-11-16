---
id: REQ-006
title: 选择目的地（搜索、宠物友好筛选与选定生效）
status: ready-for-split
discovery: Go (2026-11-16)
impact: ../analysis/REQ-006/impact-brief.md
deep_dive: ../analysis/REQ-006/deep-dive.md
sources:
  - ../intents/REQ-006-issue-15-destination-selection.md
  - apps/web/src/routes/_authenticated/cities.tsx
  - apps/web/src/routes/__root.tsx
  - apps/server/src/main/resources/db/migration/V4__create_location_management_tables.sql
  - apps/server/src/main/resources/db/migration/V5__seed_administrative_regions.sql
  - apps/server/src/main/resources/db/migration/V7__add_pet_entry_policies.sql
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationService.java
  - openspec/specs/location-management/spec.md
  - openspec/specs/web-app-shell/spec.md
  - docs/knowledge/architecture/README.md
---

# REQ-006: 选择目的地（搜索、宠物友好筛选与选定生效）

## Discovery Decision

Go — 候选能力清晰：issue #15（US-47，Must）要求用户搜索并选定目的地城市、按养犬政策做宠物友好筛选、选定后作为后续规划上下文，并在档案品种命中禁养名单时高亮提醒。原型 dest-1/dest-3 屏幕已给出交互口径。入口路由 `/cities` 与导航 Tab 已由 PR #30 建好（空占位页）。依赖缺口已决策（2026-11-16）：本 change 携带最小数据地基（禁养名单+收录标记+珠海/杭州种子）；筛选按原型口径；选定状态前端 localStorage；政策详情留给 #14。**G1 Revision（2026-11-16）：宠物档案由外部 change（US-01，远端 `feature/add-pet-schema`）交付，本 change 只读消费，不实现档案表/breed/接口/`/paws` 页面；顶栏目的地 chip 保留。**

## 六字段

1. **id**：REQ-006
2. **statement**：已登录用户在 `/cities` 目的地选择页按城市名/省份关键字搜索候选城市并选定其一作为行程规划目的地；提供「宠物友好筛选」开关，启用后仅展示符合养犬政策筛选条件的城市（MVP 仅政策维度）；选定后该城市作为后续政策查看与行程生成的规划上下文；当用户宠物档案中的品种命中所选城市禁养犬种名单时，在列表与选定确认处给出高亮提醒（复用 US-04 判定逻辑）。
3. **actors**：
   - 已登录用户（计划携宠出行）：搜索、筛选、查看政策状态、选定目的地
   - 前端应用 `apps/web`：渲染 `/cities` 候选列表、筛选开关、选定确认与提醒
   - 后端应用 `apps/server`：提供城市候选、政策收录状态与禁养匹配所需数据接口
   - （管理员维护界面不在本 REQ 范围，数据由种子迁移注入）
4. **rationale**：目的地是行前规划链（政策查看 → 交通规则 → 景点选择 → 途内交通）的第一个决策点；没有稳定的「已选目的地」上下文，后续 story（#14/#16/#17/#18）无法落地。宠物友好筛选与禁养提醒直接降低携宠出行的合规风险。
5. **acceptance hints**（来自 issue AC 与原型口径）：
   - AC-1：搜索「杭州」等关键字后候选列表过滤；点击「选定」后该城市成为行程规划目的地
   - AC-2：启用宠物友好筛选后仅展示符合条件的城市；候选计数同步；无结果时展示空态提示
   - AC-3：选定后进入政策查看或行程生成，相关功能使用已选城市；顶栏/上下文可见当前目的地
   - AC-4：档案品种命中所选城市禁养名单时，列表卡片出现「档案品种禁养」Badge，选定确认处出现高亮提醒；命中不阻断选定，但提醒持续生效
   - 禁养判定：品种名精确匹配；无档案、政策未收录、品种为空或「其他」不触发判定
   - 未收录政策城市展示「政策未收录」状态，不展示政策详情
6. **links to evidence**：
   - 需求全文与原型口径：[intent 捕获](../intents/REQ-006-issue-15-destination-selection.md)
   - 入口占位页：`apps/web/src/routes/_authenticated/cities.tsx`（PR #30，内容为空）
   - 行政区数据：`V4__create_location_management_tables.sql`（`administrative_region` 表）、`V5__seed_administrative_regions.sql`（全国省市种子）
   - 既有携宠政策字段：`V7__add_pet_entry_policies.sql`（限带数量/单只限重/牵引/疫苗/费用/预约；**无禁养犬种名单、无政策条文、无收录标记**）
   - 行政区读取方式：`AdminLocationService.regions()`（省市树，仅 `/api/admin/regions` 管理端接口）
   - 宠物档案现状：main 上 `/paws` 空页、无 pet 表/实体/API；远端 `feature/add-pet-schema`（未合并）已有 pet 表 schema（pet_type/weight_kg/has_leash/has_vaccination_proof，V8）与 `allowed_pet_types`（V9），**无 breed 字段、无接口、无 `/paws` 页面**——外部依赖契约缺口
   - 前端状态约定：TanStack Query 统一服务端状态，无全局 store（`docs/knowledge/architecture/README.md`）

## Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | US-01 宠物档案与 US-04 禁养犬种数据均未实现，本 REQ 的依赖路径怎么走？（本 change 携带最小数据地基 / 前置 change 先行 / 裁剪 AC-2、AC-4） | Product / SA | Confirmed（2026-11-16）：携带最小数据地基——沿用 PR #32 方向在行政区表补禁养名单+政策收录标记+试点城市种子。**G1 Revision（2026-11-16）：宠物档案改为外部依赖——由 US-01 change（`feature/add-pet-schema` 方向）补齐 breed/接口/`/paws` 页面，本 change 只消费；契约要求 breed 枚举与禁养词表一致。依赖风险：对方尚未交付，AC-2 完整口径与 AC-4 的实现/E2E 受其进度阻塞** |
| blocking | resolved | AC-2 筛选口径：issue 写「MVP 按有无禁养政策判断」，原型写「政策已收录且档案品种不在禁养名单」；以哪个为准？ | Product | Confirmed（2026-11-16）：原型口径——政策已收录且档案品种不在禁养名单；无档案时退化为仅按收录状态筛选 |
| blocking | resolved | 「已选目的地」状态存哪里？（服务端持久化到用户 / 前端会话级状态） | SA / Dev | Confirmed（2026-11-16）：前端本地存储（localStorage），纯前端实现不动后端；后端不感知规划上下文，后续 story 如需服务端上下文另行演进 |
| non-blocking | resolved | 城市候选范围：全国 369 条行政区 vs 原型 5 个试点城市？ | Product | Confirmed（2026-11-16）：需求方指定试点城市为**珠海、杭州**两城（替代原型 5 城）；禁养名单与收录状态以政府公开文件为准，珠海数据实现时摘录 |
| non-blocking | resolved | 政策详情查看（dest-2）是否在本 REQ 内做只读展示，还是完全留给 #14？ | Product | Confirmed（2026-11-16）：留给 #14；本 REQ 只做收录状态 Badge 与禁养提醒，禁养判定逻辑在本 change 落地供 #14 复用 |
| non-blocking | deferred | 珠海/杭州的政策收录状态与禁养名单具体内容（政府文件摘录）；是否需要一个未收录城市用于演示空态 | Product / Dev | 后续解决（实现期数据任务）；不影响能力边界与接口契约 |
| non-blocking | resolved | 登出时 localStorage 已选目的地是否清除？ | Product / Dev | Confirmed（2026-11-16）：登出即清除，与登出清 Query 缓存一致（deep-dive ②） |

## In / Out Scope

**In**

- `/cities` 目的地选择页：城市名/省份关键字搜索、候选卡片（政策收录状态 Badge、命中禁养 Badge）、宠物友好筛选开关与候选计数、无结果空态
- 候选范围：试点城市**珠海、杭州**（需求方 2026-11-16 指定）
- 宠物友好筛选（原型口径）：政策已收录且档案品种不在禁养名单；无档案时退化为仅按收录状态筛选
- 选定目的地与「规划上下文」展示；选定状态存前端 localStorage，跨页面读取
- 禁养匹配逻辑：品种名精确匹配；无档案、政策未收录、品种为空或「其他」不触发；命中时列表 Badge + 选定确认高亮提醒，不阻断选定
- 最小数据地基：行政区维度的禁养犬种名单 + 政策收录标记，试点城市种子数据（Flyway 迁移注入，政府公开文件摘录）
- 宠物档案只读消费：读取外部 change（US-01）交付的当前用户档案品种，用于筛选与禁养判定
- 用户端城市候选/政策状态读取接口（非 admin）

**Out**

- 宠物档案实现（表结构、breed 字段、读写接口、`/paws` 页面均由外部 change / US-01 交付；G1 Revision 2026-11-16）
- 政策条文详情页与政策文本维护（#14 / US-04 承接；本 REQ 落地的禁养判定逻辑供其复用）
- 管理端政策/禁养名单维护界面（数据由种子迁移注入）
- 选定目的地的服务端持久化（已确认前端本地存储；后续 story 如需服务端上下文另行演进）
- 行程生成、交通规则对比、景点选择、途内交通（#16/#17/#18 等后续 story）
- 设施与评价维度的宠物友好筛选（Release 2）

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | 依赖路径 | US-01/US-04 未实现，AC-2/AC-4 无数据地基 | 需求方确认携带最小数据地基；档案改外部依赖（G1 Revision 2026-11-16），契约与进度风险已记录 |
| BLOCKER | resolved | AC-2 口径 | issue 与原型筛选口径不一致 | 需求方确认原型口径 |
| BLOCKER | resolved | AC-3 状态归属 | 已选目的地存储位置未定 | 需求方确认前端 localStorage |
| BLOCKER | resolved | In/Out Scope | 初稿缺 scope 边界 | 已补 In/Out Scope 节（2026-11-16） |
| WARNING | deferred | 种子数据内容 | 珠海禁养名单/收录状态尚未摘录；是否含未收录演示城市未定 | 实现期数据任务，以政府公开文件为准；不阻塞契约设计 |
| SUGGESTION | resolved | 管理员 actor | 初稿管理员职责含糊 | 已明确管理端维护界面 Out of Scope |

BLOCKER 数：0（①–⑧ 通过；⑨–⑫ 已于 deep-dive 复检通过，见 [deep-dive.md](../analysis/REQ-006/deep-dive.md)）。

## Evidence / Verification Notes

- `/cities` 与 `/admin/cities` 占位：PR #30（`8f5dc19`）
- 携宠政策字段（非禁养名单）：PR #32（`61803e9`）、`V7__add_pet_entry_policies.sql`
- 宠物档案缺失（main）：`apps/web/src/routes/_authenticated/paws.tsx` 返回 null；`apps/server` 无 pet 模块；外部进展见远端 `feature/add-pet-schema`（V8/V9，仅 schema）
- 功能分支：`feat/destination-selection`（本地，不推送）
## 修订记录（2026-11-16，合并 main 后）

- 编号：原 REQ-005；main 已将 REQ-005 用于「管理员维护地点宠物政策」（已归档），本需求改登记为 **REQ-006**，正文历史决策保留原编号与原口径。
- 存储口径修订：localStorage → **sessionStorage**（键 `pawtrip.selectedDestination`，登出清除），需求方明确「就是用 sessionStorage」。
- 候选范围修订：试点珠海/杭州两城 → **全部城市级行政区**（`level='city'`）；V14 政策种子迁移整体移除，`policyCovered=false`/空 `bannedBreeds` 占位，政策 Badge/禁养提醒留 TODO（数据源归属未定）。
- 筛选口径修订：原型政策维度 → **服务端** `GET /api/destinations?keyword=&petFriendly=`；宠物友好=`max_pets_per_person` 为 null 或 >=1（仅 0 排除），复用 V7 既有列。
- 外部依赖进展：US-01 宠物档案 PR #33–#36（V8–V13，`/api/pets` CRUD、`/api/dog-breeds`）与 PR #40（`/paws` 页面）已合并 main；`PetDetail` 仍无 breed，E4/E6/E10/E11 继续 test.fixme 门控。
- 分支策略修订：需求方已授权推送 `feat/destination-selection` 并提 PR（原「本地不推送」作废）。
