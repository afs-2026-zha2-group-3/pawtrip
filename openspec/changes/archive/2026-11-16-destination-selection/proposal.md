# Proposal

## Why

issue #15（US-47，Must）：目的地是行前规划链（政策查看 → 交通规则 → 景点选择 → 途内交通）的第一个决策点，当前 `/cities` 仅为空占位页，用户无法搜索、筛选并选定目的地，后续 story（#14/#16/#17/#18）缺少规划上下文。AC-2/AC-4 所需的禁养犬种数据源未定（原 V14 政策种子迁移已按需求方决定移除），相关判定与展示以 TODO 悬置；宠物档案（含品种）由外部 change（US-01）交付，本 change 只读消费。

上游需求：`requirement-workspace/requirements/REQ-006-destination-selection.md`（REQ-006，ready-for-split；原登记编号 REQ-005，2026-11-16 合并 main 时因 REQ-005 已被「管理员维护地点宠物政策」占用而改编号）；影响简报：`requirement-workspace/analysis/REQ-006/impact-brief.md`；数据/边界/展示契约：`requirement-workspace/analysis/REQ-006/deep-dive.md`。

## What Changes

- `/cities` 目的地选择页：城市名/省份关键字搜索、候选卡片（城市名+省份）、「宠物友好筛选」开关与候选计数、无结果空态；政策收录 Badge 与禁养 Badge 暂缓（TODO，政策数据源未定）
- 候选范围为**全部城市级行政区**（2026-11-16 需求方修订：移除 V14 政策种子迁移，原试点两城口径作废）；宠物友好筛选按每人限养数判定：`max_pets_per_person` 为 null 或 >=1 即友好，限养 0 排除（2026-11-16 需求方指定，复用地点管理既有列）
- 选定目的地后展示确认提示（含城市名与后续规划用途说明，不设独立规划上下文卡片）；选定状态存前端 sessionStorage（2026-11-16 需求方修订，会话级），登出即清除；顶栏展示当前目的地 chip
- 禁养匹配：品种名精确匹配纯函数保留；Badge 与选定高亮提醒展示暂缓（TODO：政策数据源与外部 breed 字段就绪后恢复），不阻断选定
- ~~最小数据地基~~（2026-11-16 需求方移除）：V14 政策收录标记/禁养名单/种子迁移已删除；候选接口保留 `policyCovered=false`/空 `bannedBreeds` 占位字段，数据源确定后另行交付
- 宠物档案只读消费：档案的表结构、breed 字段、读写接口与 `/paws` 页面均由外部 change（US-01）交付；宠物友好筛选由服务端按每人限养数承载、不依赖档案，档案品种仅用于（暂缓的）禁养判定
- 新增用户端城市候选只读接口（`policyCovered`/`bannedBreeds` 为占位字段，数据源未定），复用既有认证与 Problem Details 错误契约
- **2026-11-16 需求方增强（PR #44 合并后，并入本 change）**：① 宠物友好筛选叠加匹配——候选接口新增 `petType`/`breedId`/`shoulderHeightCm` 可选参数与 `allowedPetTypes`/`allowedDogBreedIds`/`maxSinglePetShoulderHeightCm` 响应字段，`petFriendly=true` 时限养数规则之上叠加类型允许（**须非 null 且含该类型，null=不允许**）、品种允许（允许列表空=未配置放行，非空须含该 id）与肩高允许（上限 null=不限制，否则档案肩高须 <= 上限）；无档案退化为仅限养数规则；② `/cities` 卡片右上角匹配标签（绿「匹配」/红「不匹配」，无档案不显示，独立于筛选开关）；③ 已选定卡片按钮再次点击取消选定。口径确认：匹配输入=当前用户档案（需求方确认**只有一只宠物**，adapter 取第一只）；筛选**叠加匹配**；档案 breed 已随 PR #41 交付（`PetDetail.dogBreed`，V14 迁移）

## Non-Goals

- 不做政策条文详情页与政策文本维护（#14 / US-04 承接）
- 不做管理端政策/禁养名单维护界面（政策数据源未定，确定后另行交付）
- 不做选定目的地的服务端持久化（已确认前端本地存储）
- 不实现宠物档案（表结构、breed 字段、读写接口与 `/paws` 页面均由外部 change / US-01 交付）
- 不做设施与评价维度的宠物友好筛选（Release 2）
- 不改动既有认证、错误契约、高德集成与地点管理管理端行为

## Capabilities

### New Capabilities

- `destination-selection`: 目的地候选搜索、宠物友好筛选、选定与规划上下文生效、禁养犬种匹配与高亮提醒，及其依赖的城市政策收录状态/禁养名单数据契约

### Modified Capabilities

- `web-app-shell`: 导航 Tab 事实补齐（代码已含 `Cities` Tab 但 spec 未记录）；`/cities` 纳入 Tab 同步与登录守卫；新增顶栏目的地上下文展示与登出清除本地选定状态

## Impact

- 自身（self）：后端 `apps/server` 新增 destination（用户端城市候选）功能模块，新增 **V16 全城市种子迁移**（全部城市级行政区允许类型 CAT,DOG + 7 个非烈性允许品种含哈士奇，需求方 2026-11-16 指定，V15 空缺（PR #43 由 #47 取代）；原政策种子 V14 已移除）；前端 `apps/web` 实现 `/cities` 页面、新增 cities queries 与档案只读 query、sessionStorage 选定状态工具、顶栏目的地 chip 与登出清理；不改动 `/paws` 页面
- 上游（upstream）：依赖 REQ-006 已确认决策与原型口径；**外部依赖：宠物档案 change（US-01）——PR #33–#36（V8–V13，`/api/pets` CRUD、`/api/dog-breeds`）与 PR #40（`/paws` 宠物管理页）已合并 main，但 `PetDetail` 仍无 breed 字段**，契约要求：breed 枚举与禁养名单同一词表、档案读取接口返回 breed；政策收录/禁养数据源未定（原政府文件摘录稿存档于 change 内 `seed-data.md`）；复用既有认证/错误/数据访问契约，不修改其提供方
- 下游（downstream）：#14（政策详情）复用本 change 的禁养判定与收录数据；#16/#17/#18 读取前端选定目的地上下文；`web-app-shell` spec 滞后事实顺带修正
- 测试：后端接口验收测试（候选/搜索/限养数筛选/占位字段/401）+ Playwright E2E 主链路（搜索→筛选→选定→登出清除；禁养提醒相关用例以 test.fixme 门控，待政策数据源与外部 breed 字段就绪）
- 文档：`docs/knowledge/architecture/README.md` 增补模块与约定
- 规模预估：M（中等）；无既有契约破坏（non-breaking）
- 风险：① 政策收录/禁养数据源未定（V14 已移除），相关判定与展示以 TODO 悬置，数据源确定后需恢复完整口径；② ~~品种枚举词表不一致~~（PR #41 后档案与城市允许品种同用 `dog_breed` 参考表，按 id 精确匹配，词表风险消除）；③ ~~外部档案 breed 缺失~~（PR #41 已交付 `dogBreed`；E4/E6/E10/E11 门控仅剩政策数据源 TODO 一项）；④ 城市政策现由 V16 种子注入基线、PR #47 管理 API 可维护；空列表仍按「未配置放行」，管理端清空配置时语义自动收紧