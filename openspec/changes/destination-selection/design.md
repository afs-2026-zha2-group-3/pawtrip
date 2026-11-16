# Design

## Context

动机见 `proposal.md`（Why/What Changes）；行为契约见 `specs/destination-selection/spec.md` 与 `specs/web-app-shell/spec.md`；验收分层见 `atdd-design.md`。

约束现状：
- 后端 Spring Boot 4.1 / Java 21，SQLite + Flyway（main 至 V13），JPA `ddl-auto=none`；既有用户端只读接口先例少（`/api/greeting`），管理端 `/api/admin/regions` 提供省市树
- 前端 React 19 + TanStack Router/Query，无全局 store；`/cities` 为空占位页，导航 Tab 已含「城市浏览」（PR #30）
- **外部依赖**：宠物档案由 US-01 change 交付——PR #33–#36（V8–V13，`/api/pets` CRUD、`/api/dog-breeds`）与 PR #40（`/paws` 宠物管理页）已合并 main；`PetDetail` 仍无 breed 字段，禁养判定相关展示继续门控
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

### D3: 迁移版本号避让外部 V8/V9（本 change 最终无新增迁移）

- **背景**：外部宠物档案系列先后占用 V8/V9（立项时未合并，现已随 PR #33–#36 合并并扩展至 V13）
- **选择**：本 change 迁移预定 V10 起；同步 main 后重编号为 V14；2026-11-16 需求方决定移除 V14，本 change 不再新增迁移（main 宠物系列占用 V8–V13）
- **被否方案**：抢占 V8——与外部分支直接冲突，合并顺序不可控
- **理由**：Flyway 版本单调；政策数据迁移待数据源确定后另行编号

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

### D6: 档案消费 adapter 与缺省退化

- **背景**：外部档案接口契约未定（endpoint/字段名未知），且未交付
- **选择**：前端单一 `pet-profile` query adapter 封装外部读取（GET /api/pets 已交付，breed 字段缺失）；请求失败/无档案/无 breed 一律按「无档案」退化（不触发禁养 Badge/提醒），与 spec 退化分支一致；外部 breed 契约落地后仅改 adapter。筛选退化由服务端承载（D5），不依赖本 adapter
- **被否方案**：等外部合并再动工（全面阻塞）；本 change 自实现档案（违反 G1 Revision scope）
- **理由**：无档案路径现在即可实现并 E2E 验证；`@profile-dependency` 用例挂起待外部就绪（atdd-design §1）

### D7: 接口与错误契约沿用既有约定

- **背景**：项目统一 Problem Details + 稳定 `code`，session 认证
- **选择**：`GET /api/destinations` 纳入既有认证过滤链（未认证 401 `UNAUTHENTICATED`）；只读、无请求体；可选查询参数 `keyword`/`petFriendly`（D5）；响应 DTO 含 adcode/name/province/policyCovered/bannedBreeds[]（政策字段占位 false/空数组，D2 修订）
- **被否方案**：新错误风格/公开匿名接口——破坏既有契约且 spec 要求 401
- **理由**：复用 backend-authentication/backend-error-handling Living 契约，零新增约定

## Risks / Trade-offs

- [外部档案 change 进度阻塞 AC-2 完整口径/AC-4 验收] → D1/D6 解耦 + `@profile-dependency` 门控用例；无档案路径先行验证；合并顺序与对方协调（lint L5）
- [政策数据源未定导致收录/禁养口径悬置] → D2 修订：占位字段 + TODO 判断点，数据源确定后恢复；候选浏览与选定闭环不受阻
- [breed 词表不一致导致精确匹配漏判] → 数据源就绪后与外部枚举核对同一词表（deep-dive ①）
- [sessionStorage 关标签页即丢、换设备不跟随] → 需求方已接受会话级口径；后续 story 需服务端上下文时另行演进
- [前端匹配逻辑与 #14 复用] → 匹配纯函数独立模块，#14 可直接引用；若将来需服务端判定再迁移（不在本 change）

## Migration Plan

1. 本 change 无新增 Flyway 迁移（V14 已按需求方决定移除）；候选直接读既有 `administrative_region`（V5 种子）
2. 政策数据迁移待数据源确定后另行交付（版本号届时复核 main）
3. 与外部 change 的合并顺序无强约束（后端互不引用）；前端 adapter 联调需外部接口就绪

## Open Questions

- 政策收录状态与禁养名单的数据源归属（城市管理维护 / 政策能力 / 其他）：确定后恢复 D1/D2/D5 的完整口径
- 外部档案读取接口的 breed 字段命名/枚举值：D6 adapter 隔离，契约落地时确认即可