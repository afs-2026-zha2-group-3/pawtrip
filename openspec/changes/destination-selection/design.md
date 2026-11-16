# Design

## Context

动机见 `proposal.md`（Why/What Changes）；行为契约见 `specs/destination-selection/spec.md` 与 `specs/web-app-shell/spec.md`；验收分层见 `atdd-design.md`。

约束现状：
- 后端 Spring Boot 4.1 / Java 21，SQLite + Flyway（main 至 V13），JPA `ddl-auto=none`；既有用户端只读接口先例少（`/api/greeting`），管理端 `/api/admin/regions` 提供省市树
- 前端 React 19 + TanStack Router/Query，无全局 store；`/cities` 为空占位页，导航 Tab 已含「城市浏览」（PR #30）
- **外部依赖**：宠物档案由 US-01 change 交付——PR #33–#36（`/api/pets` CRUD、`/api/dog-breeds`）、PR #40（`/paws` 页面）、PR #41（`PetDetail.dogBreed`，V14 迁移）均已合并 main；breed 契约就绪，禁养展示仍待政策数据源
- 候选范围为全部城市级行政区（2026-11-16 需求方修订：移除 V14 政策种子迁移，政策收录/禁养数据源未定，判断点 TODO）

## Goals / Non-Goals

**Goals:**
- 后端与外部档案 change **编译期解耦**：本 change 后端不引用 pet 模块，可先行实现与验证
- 档案消费集中在前端单一 adapter，外部契约变化时改动局部化
- 数据地基（收录标记+禁养名单+种子）暂缓：政策数据源确定后另行交付（2026-11-16 需求方移除 V14）

**Non-Goals:**
- 不设计档案表/接口/页面（外部 change）
- 不设计服务端选定状态、政策详情、管理端维护界面（见 proposal Non-Goals）
- 不引入新状态管理库、新 CI 语义

## Decisions

### D1: 禁养 Badge/选定提醒匹配放前端，候选接口暴露数据与筛选

- **背景**：AC-2/AC-4 需要「档案品种 × 城市禁养名单」判定；档案来自外部 change（breed 字段尚未交付）
- **选择**：`GET /api/destinations` 返回每城 `policyCovered` + 禁养名单（品种/来源/更新时间）；前端取档案品种后做精确匹配（纯函数 `breedHitsBanList`），仅用于卡片「档案品种禁养」Badge 与选定禁养提醒
- **修订（2026-11-16，需求方）**：搜索与宠物友好筛选改由后端接口承载（见 D5）；前端匹配仅保留 Badge/提醒用途
- **修订（2026-11-16，需求方）**：移除 V14 政策数据后，Badge/提醒展示暂缓（代码留 TODO）；`breedHitsBanList` 纯函数与单测保留，数据源就绪后恢复渲染
- **理由**：Badge/提醒是纯展示判定，随候选响应携带名单即可；后端不引用 pet 模块，breed 交付前无编译期阻塞

### D2: 数据模型——政策数据暂缓，候选=全部城市级行政区（2026-11-16 需求方修订）

- **背景**：原方案为 `administrative_region` 增 `policy_covered` + 新表 `region_banned_breed` + 珠海/杭州种子（V14）；需求方决定移除 V14，政策收录与禁养判断点改 TODO
- **选择**：本 change 不新增迁移；候选范围 = `level='city'` 全部行政区（复用既有 `findAllByLevelOrderByNameAsc`）；响应 DTO 保留 `policyCovered`/`bannedBreeds` 字段，占位返回 `false`/空数组，数据源确定后恢复
- **被否方案**：JSON/CSV 列存名单；硬编码试点 adcode 于服务层；独立 `pilot` 列（需求方先移除 pilot，后整体移除 V14）
- **理由**：政策数据归属未定（可能由城市管理/政策能力承接），先交付候选浏览与选定闭环，避免预置数据返工

### D3: 迁移版本号避让（本 change 新增 V16 全城市种子）

- **背景**：外部宠物档案系列占用 V8–V14（PR #33–#36、#41）；V15 空缺（原在途 PR #43 由 PR #47 取代，无迁移）
- **选择**：原政策种子 V14 按需求方决定移除；2026-11-16 需求方指定**全部城市级行政区**种子数据，编号 **V16**（需求方确认；V15 空缺）：`allowed_pet_types='CAT,DOG'` + 7 个非烈性允许品种（柯基犬/贵宾犬/金毛寻回犬/拉布拉多寻回犬/比熊犬/博美犬/哈士奇，`INSERT OR IGNORE` 幂等）
- **被否方案**：抢占 V8/V15——与外部/在途分支直接冲突，合并顺序不可控
- **理由**：Flyway 版本单调；禁养（banned）数据源仍未定，占位契约不变

### D4: 选定状态存 sessionStorage，登出清除（2026-11-16 需求方修订）

- **背景**：需求方确认前端本地存储、登出即清除（REQ-006 决策）；后修订为 sessionStorage
- **选择**：键 `pawtrip.selectedDestination`，值 `{adcode, cityName, province, selectedAt}`；封装读写/清除工具 + 订阅 hook（`useSyncExternalStore`），供 `/cities` 与顶栏 chip 共享；登出成功回调中与 `queryClient.clear()` 一并清除
- **被否方案**：服务端持久化（需求方已否）；localStorage（原方案，需求方修订为 sessionStorage，选定仅限当前标签页会话）；引入全局状态库（项目约定无全局 store，两城场景过重）
- **理由**：同标签页刷新保留、重选覆盖、跨页面 chip 同步均由同一存储源驱动；关闭标签页即失效，符合会话级选定口径

### D5: 搜索与筛选为服务端查询参数（2026-11-16 需求方修订）

- **背景**：原设计为客户端过滤（两城规模）；需求方决定搜索与宠物友好筛选由后端接口实现
- **选择**：`GET /api/destinations?keyword=&petFriendly=true`——`keyword` 服务端匹配城市名/省份（trim 后 contains，空=全部）；`petFriendly` 按每人限养数判定：`max_pets_per_person` 为 null 或 >=1 即宠物友好，限养 0 排除（2026-11-16 需求方指定规则，复用地点管理既有列，不再 TODO）；政策收录/禁养口径仍暂缓（D2）
- **被否方案**：客户端过滤（原 D5，需求方已否）；SQL LIKE 查询——服务层过滤更直观且省份需父级查得；以政策收录+禁养名单为筛选口径——数据源未定，需求方改用限养数规则
- **理由**：筛选口径集中在服务端单一实现；前端仅传参渲染，关键字输入防抖 300ms + TanStack Query 按参数缓存（`keepPreviousData` 避免闪烁）

### D6: 档案消费 adapter 与缺省退化（2026-11-16 增强更新）

- **背景**：外部档案接口已交付且 breed 就绪（PR #41：`PetDetail.dogBreed={id,name,officialAggressive}`，V14 迁移）；需求方确认单宠口径
- **选择**：前端单一 `pet-profile` query adapter 封装 `GET /api/pets`，取**第一只**宠物，暴露 `{petType, breedId, breedName}`；请求失败/无宠物一律按「无档案」退化（不显示匹配标签、筛选退化为限养数规则）；禁养 Badge/提醒仍暂缓（政策数据源 TODO）
- **被否方案**：多宠任一/全部匹配（需求方确认只有一只）；本 change 自实现档案（违反 G1 Revision scope）
- **理由**：adapter 隔离外部契约，后续多宠口径演进仅改 adapter 与匹配函数

### D7: 接口与错误契约沿用既有约定

- **背景**：项目统一 Problem Details + 稳定 `code`，session 认证
- **选择**：`GET /api/destinations` 纳入既有认证过滤链（未认证 401 `UNAUTHENTICATED`）；只读、无请求体；可选查询参数 `keyword`/`petFriendly`（D5）；响应 DTO 含 adcode/name/province/policyCovered/bannedBreeds[]（政策字段占位 false/空数组，D2 修订）
- **被否方案**：新错误风格/公开匿名接口——破坏既有契约且 spec 要求 401
- **理由**：复用 backend-authentication/backend-error-handling Living 契约，零新增约定

### D8: 叠加匹配由前端传参承载，服务端不引用档案模块（2026-11-16 增强）

- **背景**：筛选需叠加城市允许类型（`allowed_pet_types`，V9：NULL=未配置，'CAT'/'DOG'/'CAT,DOG'）与允许狗品种（`city_allowed_dog_breed`，V11；V16 全城市种子注入，PR #47 起 /api/admin/cities 可维护）；档案归外部 pet 模块
- **选择**：候选接口增可选参数 `petType`/`breedId`/`shoulderHeightCm`（前端从 adapter 读取后传参）与响应字段 `allowedPetTypes`/`allowedDogBreedIds`/`maxSinglePetShoulderHeightCm`；`petFriendly=true` 时限养数 AND 类型 AND 品种 AND 肩高四层过滤；**空值语义（2026-11-16 需求方修订）**：`allowed_pet_types=null` **不允许**；允许品种列表空=未配置放行；肩高上限 null=不限制；DOG 档案无品种时品种层放行、档案无肩高时肩高层放行；`petType` 用 `PetType` 枚举绑定（非法值 Spring 自动 400）；仓库新增 `@EntityGraph(attributePaths="allowedDogBreeds")` 派生查询（`open-in-view=false`，避免懒加载异常与逐城 N+1）
- **被否方案**：destination 服务直接读 pet 仓库（破坏模块边界与 G1 Revision「后端不引用档案模块」）；前端本地过滤（违反 D5 服务端筛选口径）
- **理由**：保持服务端筛选与模块边界；品种按 `dog_breed` id 精确匹配，与档案同词表

### D9: 匹配标签与取消选定（2026-11-16 增强）

- **背景**：需求方要求卡片右上角绿/红匹配标签、已选定再点取消
- **选择**：匹配判定为前端纯函数 `matchesCityPetPolicy(candidate, profile)`（类型允许 AND 品种允许 AND 肩高允许，语义与 D8 服务端一致），有档案渲染 shadcn `Badge`（匹配=green-600 绿——主题无 success 令牌、需求方明确指定绿色；不匹配=destructive 红；卡片 relative + Badge absolute 右上角），无档案不渲染；标签独立于筛选开关。选定按钮选中态不再 disabled，再次点击调用 `selectedDestinationStore.clear()`（chip/Alert/sessionStorage 同源自动同步）
- **被否方案**：服务端预算 match 布尔（需服务端读档案，违反 D8）；整卡点击切换（误触风险，保持按钮交互）
- **理由**：判定逻辑单测可覆盖；store 既有 clear 能力零新增状态

## Risks / Trade-offs

- [外部档案 change 进度阻塞 AC-2 完整口径/AC-4 验收] → 已解除 breed 阻塞（PR #41 交付 dogBreed）；禁养展示仍待政策数据源
- [政策数据源未定导致收录/禁养口径悬置] → D2 修订：占位字段 + TODO 判断点，数据源确定后恢复；候选浏览与选定闭环不受阻
- [breed 词表不一致导致精确匹配漏判] → 已消除：档案与城市允许品种同用 dog_breed 参考表，按 id 匹配（D8）
- [城市政策配置被管理端修改] → V16 种子提供基线，PR #47 管理 API 可调整；空列表=未配置放行（D8）语义不变
- [sessionStorage 关标签页即丢、换设备不跟随] → 需求方已接受会话级口径；后续 story 需服务端上下文时另行演进
- [前端匹配逻辑与 #14 复用] → 匹配纯函数独立模块，#14 可直接引用；若将来需服务端判定再迁移（不在本 change）

## Migration Plan

1. 本 change 新增 **V16**（全部城市级行政区允许类型/品种种子，需求方 2026-11-16 指定）；原政策种子 V14 已移除；候选读既有 `administrative_region`（V5 种子）+ V16 配置
2. 禁养（banned）数据迁移待数据源确定后另行交付（版本号届时复核 main，注意在途 PR #43 的 V15）
3. 与外部 change 的合并顺序无强约束（后端互不引用）；前端 adapter 联调需外部接口就绪

## Open Questions

- 政策收录状态与禁养名单的数据源归属（城市管理维护 / 政策能力 / 其他）：确定后恢复 D1/D2/D5 的完整口径
- 外部档案读取接口的 breed 字段命名/枚举值：D6 adapter 隔离，契约落地时确认即可