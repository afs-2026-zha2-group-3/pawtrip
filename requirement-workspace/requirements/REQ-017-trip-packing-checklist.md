---
id: REQ-017
title: 行程携带清单与打包进度
status: p1-ready
discovery: Go (2026-11-18)
sources:
  - ../intents/REQ-017-trip-packing-checklist.md
  - openspec/specs/trip-itinerary/spec.md
  - openspec/specs/trip-planning/spec.md
  - openspec/specs/trip-context/spec.md
  - openspec/specs/paws-page/spec.md
---

# REQ-017：行程携带清单与打包进度

## Discovery Decision

Go（2026-11-18，light intake）— 候选能力明确：为每个激活行程生成一份服务端持久化的携宠物品清单，按宠物档案与行程场景（大交通、天数）从静态模板映射生成，展示在 `/itinerary` 弹窗并在页面显示打包进度；支持勾选、增删与数量编辑；读取时按最新行程与档案同步模板项，保留用户自定义与勾选数据。与现有 Living Spec 关系清楚：扩展 `trip-itinerary`（入口、进度、弹窗与引导），新增 `trip-packing-checklist` 能力（数据模型、模板映射、同步规则、进度口径、API）。不改变 `trip-planning` 的计划结构、`paws-page` 的档案字段与 `trip-context` 的激活行程语义。关键事实（2026-11-18 代码核实）：当前无清单表/领域/API；宠物档案已含类型、体重、肩高、`hasLeash`、`hasVaccinationProof`；行程已含 `totalDays`、`transportMode` 与属主校验；最新迁移为 V28；行程单已有同层弹窗入口与导出隔离先例。

## 六字段

1. **id**：REQ-017
2. **statement**：已登录用户可为自己的激活行程生成一份携带清单。清单由代码内静态模板按宠物档案（类型、体重、肩高、牵引绳、疫苗证明）与行程场景（大交通方式、总天数）映射生成，固定分为证件、饮食、出行、健康、清洁五类；一次行程只保留一份清单，重复生成幂等返回已有清单。清单展示在行程单弹窗中，行程单 Day 标签行旁显示「已打包 X / Y 件」进度；用户可勾选/取消勾选物品、修改模板项或自定义项数量、新增自定义物品、删除物品，所有变更服务端按账号持久化，刷新与同账号换设备后保留。读取清单时按最新行程与宠物档案同步模板项：新增适用项自动补入，不再适用的模板项隐藏，模板项名称/分类/未被用户手动覆盖的数量刷新为最新模板值；自定义项、用户手动修改的数量与已勾选状态保留；用户显式删除的模板项不再复活。进度按当前可见物品行中已勾选行数 / 总行数计算，全部勾选时展示完成态。行程关联的宠物档案不存在时，生成返回 `PET_PROFILE_REQUIRED` 并引导前往 `/paws` 创建档案；尚未生成清单时弹窗展示生成引导，行程单进度显示「未生成」。清单弹窗不进入 PDF/图片导出。
3. **actors**：
   - 已登录用户：生成清单、勾选物品、增删物品、修改数量、查看进度
   - 前端 `apps/web`：行程单入口与进度、清单弹窗、查询/变更调用、空态与引导态
   - 后端 `apps/server`：清单领域、静态模板映射、读取时同步、持久化、属主校验、进度计算
   - 模板维护者（开发）：维护代码内静态模板与分类映射，MVP 不依赖 AI 或外部服务
   - 管理员：不受影响（无管理端界面与接口变化）
4. **rationale**：携宠出行物品更多且随宠物档案与交通方式变化，通用清单无法覆盖航空箱尺寸、牵引绳规格、疫苗证明、主粮份数等个性化需求（US-18）；清单生成后若不能逐项确认与看到整体进度，用户仍需在出发前反复核对（US-19）。模板映射与读取时同步能在不引入 AI 的前提下保持清单与档案/行程一致，服务端持久化满足跨设备要求。
5. **acceptance hints**：
   - AC-1：行程单 Day 标签行右侧存在「携带清单」按钮；未生成时页面进度显示「未生成」；弹窗展示「尚未生成携带清单」与「生成携带清单」；生成后展示物品与「已打包 0 / Y 件」；同一行程重复生成不产生第二份清单
   - AC-2：弹窗按「证件 → 饮食 → 出行 → 健康 → 清洁」固定顺序分组，空分类不展示；物品行展示名称与数量；2 天、豆豆（猫、4.5kg、25cm、有牵引绳、有疫苗证明、高铁）生成 9 项：疫苗证明 1、主粮（份）4、折叠食盆 1、便携水碗 1、猫用运输包（S 码）1、牵引绳（S 码）1、宠物急救包 1、尿垫 2、清洁湿巾 1
   - AC-3：用户可新增自定义物品（名称、分类、数量 1–99）、修改任意物品数量、删除任意物品；变更后刷新页面或重新登录，清单内容与数量保持一致
   - AC-4：行程天数、大交通方式或宠物档案变化后重新读取，模板项按新场景更新（如 2 天改 3 天主粮变 6 份、体重 4.5kg 改 12kg 运输包由 S 变 M、高铁改飞机出现航空箱与检疫/免疫证明）；自定义项、用户手动修改的数量与已勾选状态保留；场景恢复时被隐藏的模板项重新出现；用户已删除的模板项不复活
   - AC-5：勾选/取消勾选即时持久化；进度为已勾选可见物品行数 / 总可见物品行数，行程单与弹窗口径一致；全部勾选时弹窗展示「全部打包完成，可以出发啦！」；修改数量不改变进度分母口径
   - AC-6：同一账号在不同设备/会话读取同一行程清单，物品、数量与勾选状态一致；服务端为唯一数据源
   - AC-7：行程关联宠物档案不存在时，生成返回 `PET_PROFILE_REQUIRED`，弹窗展示说明与「去创建宠物档案」链接到 `/paws`；未生成清单的 404 作为正常态处理，不展示加载失败
   - AC-8：非属主用户访问他人行程清单返回 404；清单项不属于该清单返回 404；删除行程级联删除清单与物品；删除清单项后进度与列表立即更新
   - AC-9：清单弹窗不进入 PDF 与图片导出；行程单既有地点、交通、政策、导出行为不变
6. **links to evidence**：
   - 意图与已决口径：[intents/REQ-017-trip-packing-checklist.md](../intents/REQ-017-trip-packing-checklist.md)
   - 行程单页面入口层：[itinerary.tsx](../../apps/web/src/routes/_authenticated/itinerary.tsx)（Day 标签行与「查看当天路线规划」按钮）
   - 激活行程与行程字段：`apps/web/src/lib/trip/selectors.ts`、`apps/web/src/lib/trip/types.ts`
   - 宠物档案字段：`apps/server/src/main/java/com/pawtrip/server/pet/Pet.java`、`PetService.java`；前端 `apps/web/src/queries/pets.ts`
   - 行程属主与级联：`apps/server/src/main/java/com/pawtrip/server/trip/TripService.java`、`TripRepository.java`
   - 错误码契约：`apps/server/src/main/java/com/pawtrip/server/error/ApiErrorCode.java`、`ApiException.java`
   - 迁移基线：`apps/server/src/main/resources/db/migration/V28__add_pet_preferences_personality.sql`；本需求新增 V29
   - 弹窗与组件语言：`apps/web/src/components/ui/dialog.tsx`、`checkbox.tsx`、`select.tsx`、`input.tsx`
   - 测试先例：`apps/server/src/test/java/com/pawtrip/server/trip/`、`apps/web/src/components/trip/*.test.tsx`、`e2e/itinerary.spec.ts`、`e2e/trip-helpers.ts`
   - 影响分析：[analysis/REQ-017/impact-brief.md](../analysis/REQ-017/impact-brief.md)
   - Deep-dive：[analysis/REQ-017/deep-dive.md](../analysis/REQ-017/deep-dive.md)
   - OpenSpec change：`openspec/changes/2026-11-18-add-trip-packing-checklist/`

## Ready 形状

### Intent

让用户在行程单内一键获得与宠物档案、行程场景匹配的携带清单，并通过逐项勾选与整体进度在出发前确认打包完成；清单与勾选跨设备一致，档案或行程变化时模板自动跟随而不丢用户数据。

### Actors 与权限边界

- 已登录用户：仅可操作自己名下行程的清单；沿用行程属主边界，非属主一律 404。
- 后端：清单与物品按账号与行程归属持久化；读取时同步模板；不提供跨用户或管理端入口。
- 前端：清单数据由 TanStack Query 从服务端获取；不在前端生成或缓存清单事实；宠物保存后使清单查询失效以触发同步。
- 模板维护者：仅修改代码内静态模板；不提供模板管理界面。

### In / Out Scope

**In**

- `/itinerary` Day 标签行右侧「携带清单」按钮、页面进度文案与清单弹窗
- 每行程一份清单的生成（POST，幂等）、读取（GET，含读取时同步）、清单项新增/修改/删除 API
- 静态模板映射：类型、体重/肩高分档、牵引绳、疫苗证明、大交通方式、天数 → 物品与数量
- 五分类固定顺序展示；模板项与自定义项区分
- 勾选态、数量编辑、自定义物品与删除操作的服务端持久化
- 读取时档案/行程同步；自定义项、手动数量、勾选状态保留；删除墓碑不复活
- 进度按可见物品行统计；100% 完成态
- 无档案引导 `/paws`、未生成引导、加载失败重试
- 后端 API 测试、模板单测、迁移测试、前端组件测试、E2E

**Out**

- AI 生成清单、外部服务或大模型调用
- 模板管理界面、模板表、按用户自定义模板
- 出发前未完成提醒、推送通知（Release 2）
- 一键购买缺失物品、电商跳转（Release 4）
- 清单分享、导出独立清单文件、打印清单
- 修改 `trip-planning` 计划结构或 `paws-page` 档案字段
- 行程单既有 PDF/图片导出内容变化

### Scenarios + AC Hints

#### S1：生成与幂等（AC-1）

- **Given** 已登录用户有一个 2 天珠海行程与宠物档案「豆豆」
- **When** 打开行程单并点击「携带清单」→「生成携带清单」
- **Then** 弹窗展示 9 项物品与「已打包 0 / 9 件」
- **And** 再次生成不新增第二份清单，内容与勾选状态不变

#### S2：分类与模板映射（AC-2）

- **Given** 豆豆为猫、4.5kg、25cm、有牵引绳与疫苗证明，行程 2 天、高铁
- **When** 查看清单
- **Then** 五类按固定顺序展示，空分类不展示
- **And** 物品与数量符合模板：疫苗证明 1、主粮（份）4、折叠食盆 1、便携水碗 1、猫用运输包（S 码）1、牵引绳（S 码）1、宠物急救包 1、尿垫 2、清洁湿巾 1

#### S3：编辑持久化（AC-3）

- **Given** 已生成清单
- **When** 新增自定义物品「备用雨衣」数量 2、把主粮改为 8、删除尿垫
- **Then** 列表与进度立即更新
- **And** 刷新或重新登录后自定义物品、主粮数量与删除结果保持一致

#### S4：档案与场景同步（AC-4）

- **Given** 已生成清单，已勾选「疫苗证明」，自定义物品「狗牌」，主粮手动改为 8
- **When** 宠物体重改为 12kg 后重新读取清单
- **Then** 猫用运输包由「S 码」变为「M 码」
- **And** 自定义物品、主粮数量 8 与疫苗证明勾选状态保留

#### S5：隐藏与删除语义（AC-4 / AC-8）

- **Given** 高铁清单含「疫苗证明」，「毛毛」无疫苗证明
- **When** 行程大交通改为飞机后读取
- **Then** 出现航空箱与「检疫/免疫证明」，模板同步不报错
- **And** 用户显式删除的模板项在后续同步中不复活；因场景不适用被隐藏的模板项在场景恢复时重新出现且默认未勾选

#### S6：勾选与进度（AC-5）

- **Given** 清单共 9 行
- **When** 勾选 1 行后又勾选其余 8 行
- **Then** 进度依次为「已打包 1 / 9 件」与「已打包 9 / 9 件」
- **And** 全部勾选时展示「全部打包完成，可以出发啦！」；取消勾选后进度回退

#### S7：跨设备一致（AC-6）

- **Given** 用户在一个会话生成清单并勾选部分物品
- **When** 同一账号在另一会话读取同一行程清单
- **Then** 物品、数量与勾选状态一致

#### S8：无档案与未生成（AC-7）

- **Given** 行程关联宠物档案不存在，或清单尚未生成
- **When** 用户打开清单弹窗或尝试生成
- **Then** 无档案展示说明与 `/paws` 链接；未生成展示生成引导而非错误
- **And** 行程单进度分别显示「未生成」，不出现 0/0

#### S9：属主与导出回归（AC-8 / AC-9）

- **Given** 非属主用户或已打开过清单弹窗的用户
- **When** 访问他人清单，或导出 PDF/图片
- **Then** 他人清单返回 404；导出内容不含清单弹窗
- **And** 行程单既有地点、交通、政策与导出行为不变

### Constraints

- 模板为代码内静态常量，不建模板表、不调用 AI 或外部服务；模板键在单份清单内唯一。
- 分类固定为 `DOCUMENTS`、`FOOD`、`TRAVEL`、`HEALTH`、`CLEANING`，展示顺序即此顺序（证件/饮食/出行/健康/清洁）。
- 数量为 1–99 的整数；名称去首尾空格、长度 ≤ 50。
- 主粮份数 = 总天数 × 2；尿垫数量 = max(1, 总天数)。
- 运输容器分档：体重 ≤ 5kg → S，≤ 15kg → M，> 15kg → L；牵引绳分档：肩高 < 35cm → S，< 55cm → M，否则 L。
- 场景映射：飞机 → 航空箱 + 检疫/免疫证明；非飞机猫 → 猫用运输包；非飞机狗 → 宠物运输包；有牵引绳 → 牵引绳；有疫苗证明或飞机 → 疫苗/检疫证明；自驾 → 晕车药；狗 → 拾便袋。
- 生成采用 POST；已存在清单时返回 200 与已有清单，新建返回 201。
- 模板项仅允许修改数量与勾选态；名称与分类始终随模板刷新。自定义项允许修改名称、分类、数量、勾选态。
- 用户删除模板项记为墓碑（`DELETED`），同步不复活；场景不适用标记为隐藏（`HIDDEN`），恢复时重新激活并重置勾选为未勾选。
- 读取时同步：新增适用项补入、不适用项隐藏、模板名称/分类/未覆盖数量刷新；自定义项、手动数量、勾选状态保留。
- 进度按可见物品行统计，不按数量求和；后端返回 `checked`/`total`。
- 属主边界：只能访问自己行程的清单；非属主与不存在统一 404。
- 错误码：`PACKING_CHECKLIST_NOT_FOUND`、`PACKING_ITEM_NOT_FOUND`、`PET_PROFILE_REQUIRED`；未生成 404 在前端作为正常态。
- 行程删除级联删除清单与物品；同一行程清单唯一。
- 前端遵循 TanStack Query / `request` / `ApiError` 约定与 shadcn/Base UI 组件语言；弹窗与路线规划同层一致。
- 清单弹窗不进入打印/图片导出 DOM；`print:hidden` 或等价隔离。
- 实现前形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。

### Context

- 行程与激活上下文由既有 `trip-planning`、`trip-context` 交付；本需求只读消费 `petId`、`totalDays`、`transportMode`。
- 宠物档案字段由 `paws-page` 交付；本需求只读消费，不新增档案字段。
- 行程单已有「查看当天路线规划」弹窗与导出隔离；携带清单入口与其同层，交互一致。
- 最新迁移 V28；本需求新增 V29，不改既有表结构。
- 删除档案受行程外键限制；清单生成时若档案缺失返回 `PET_PROFILE_REQUIRED`，不自动创建档案。

### Affected Capabilities

- **ADDED** `trip-packing-checklist`：清单数据模型、模板映射、同步规则、勾选与进度口径、API 契约
- **MODIFIED** `trip-itinerary`：行程单新增携带清单入口、进度文案、弹窗与无档案/未生成/完成态引导
- 不改 `trip-planning`、`trip-context`、`paws-page`、`backend-data-access`、`backend-error-handling`、`frontend-data-fetching`、`frontend-api-request` 的既有行为

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 清单入口与展示形态？ | Product | 已决（2026-11-18，用户确认）：与「查看当天路线规划」一致，Day 标签行右侧按钮 + 弹窗；行程单页面显示进度 |
| OQ-2 | blocking | resolved | 一份清单对应行程还是用户？ | Product | 已决：每个行程一份，`trip_id` 唯一，重复生成幂等 |
| OQ-3 | blocking | resolved | 生成时机与触发方式？ | Product | 已决：用户点击「生成携带清单」，不自动生成；未生成展示引导 |
| OQ-4 | blocking | resolved | 模板来源与是否使用 AI？ | Product | 已决：代码内静态模板 + 档案/场景映射；MVP 不做 AI，不建模板表 |
| OQ-5 | blocking | resolved | 档案/行程变化如何更新清单？ | SA | 已决：读取时自动同步；新增适用项、隐藏不适用项、刷新模板名称/分类/未覆盖数量 |
| OQ-6 | blocking | resolved | 用户数据如何保留？ | SA | 已决：自定义项、手动修改数量、勾选状态保留；删除模板项为墓碑不复活；隐藏项恢复时重置未勾选 |
| OQ-7 | blocking | resolved | 进度口径？ | Product | 已决：已勾选可见物品行数 / 总行数；不按数量求和 |
| OQ-8 | blocking | resolved | 是否需要跨设备？ | Product | 已决：服务端按账号持久化，同账号跨设备一致 |
| OQ-9 | blocking | resolved | 无宠物档案时如何处理？ | Product | 已决：生成返回 `PET_PROFILE_REQUIRED`，引导 `/paws` 创建档案 |
| OQ-10 | blocking | resolved | 分类集合与顺序？ | Product | 已决：证件、饮食、出行、健康、清洁五类固定顺序 |
| OQ-11 | blocking | resolved | 主粮份数规则？ | Product | 已决：天数 × 每日 2 份；尿垫 max(1, 天数) |
| OQ-12 | blocking | resolved | 模板项是否允许用户改名/改分类？ | SA | 已决：模板项仅数量与勾选可改，名称/分类随模板刷新；自定义项全字段可改 |
| NB-1 | non-blocking | resolved | 空分类是否展示？ | Dev | 已决：空分类不展示 |
| NB-2 | non-blocking | resolved | 未生成 404 如何处理？ | Dev | 已决：前端作为正常态返回 `null` 并展示生成引导 |
| NB-3 | non-blocking | resolved | 删除清单项后如何处理？ | Dev | 已决：模板项软删除墓碑，自定义项物理删除；进度即时刷新 |
| NB-4 | non-blocking | resolved | 弹窗与导出的关系？ | Dev | 已决：弹窗不进入 PDF/图片导出，既有导出一致 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Open Questions | 12 个 blocking OQ（入口/粒度/时机/模板/同步/保留/进度/跨设备/无档案/分类/份数/编辑边界） | 2026-11-18 与用户确认并随 design 批准，全部 resolved |
| WARNING | resolved | NB-1…NB-4 | 4 个非阻塞细节（空分类/未生成 404/删除语义/导出隔离） | 2026-11-18 逐项定稿，design.md 与实现已覆盖 |

基础 8 项自检：①意图清晰 ✓ ②actors 与权限边界 ✓ ③范围有界（In/Out）✓ ④场景具体（S1–S9）✓ ⑤异常/边界（无档案、未生成、跨属主、删除、场景切换、加载失败）✓ ⑥结果可验证（物品/数量/进度/提示可观察）✓ ⑦依赖与触点（行程、档案、错误码、迁移、弹窗组件）✓ ⑧blocking OQ=0 ✓。⑨数据契约 ✓ ⑩边界分支 ✓ ⑪跨 REQ 一致性 ✓ ⑫展示与测试 ✓（2026-11-18 deep-dive 完成，见 `analysis/REQ-017/deep-dive.md` 第 6 节）。BLOCKER 数：0。影响分析 blocker：0；建议单 change `2026-11-18-add-trip-packing-checklist`（规模 M，1 个迁移、1 个后端领域、1 个前端弹窗，无新依赖）。

## 修订记录

### 2026-11-18 初版

- 依据 US-18、US-19 与用户对话确认建立 REQ-017；入口与路线规划一致；读取时跟随行程/档案；静态模板；服务端持久化；删除墓碑与隐藏语义定稿。
