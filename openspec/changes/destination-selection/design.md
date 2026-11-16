# Design

## Context

动机见 `proposal.md`（Why/What Changes）；行为契约见 `specs/destination-selection/spec.md` 与 `specs/web-app-shell/spec.md`；验收分层见 `atdd-design.md`。

约束现状：
- 后端 Spring Boot 4.1 / Java 21，SQLite + Flyway（main 至 V7），JPA `ddl-auto=none`；既有用户端只读接口先例少（`/api/greeting`），管理端 `/api/admin/regions` 提供省市树
- 前端 React 19 + TanStack Router/Query，无全局 store；`/cities` 为空占位页，导航 Tab 已含「城市浏览」（PR #30）
- **外部依赖**：宠物档案由 US-01 change 交付（远端 `feature/add-pet-schema` 仅 pet 表 schema，V8/V9 已被其占用；无 breed、无接口、无 `/paws` 页面）
- 候选仅珠海/杭州两城；禁养名单具体值为实现期数据任务（政府文件摘录）

## Goals / Non-Goals

**Goals:**
- 后端与外部档案 change **编译期解耦**：本 change 后端不引用 pet 模块，可先行实现与验证
- 档案消费集中在前端单一 adapter，外部契约变化时改动局部化
- 数据地基（收录标记+禁养名单+种子）可被 #14 复用

**Non-Goals:**
- 不设计档案表/接口/页面（外部 change）
- 不设计服务端选定状态、政策详情、管理端维护界面（见 proposal Non-Goals）
- 不引入新状态管理库、新 CI 语义

## Decisions

### D1: 禁养匹配放前端，候选接口只暴露数据

- **背景**：AC-2/AC-4 需要「档案品种 × 城市禁养名单」判定；档案来自未合并的外部 change
- **选择**：`GET /api/destinations` 返回每城 `policyCovered` + 禁养名单（品种/来源/更新时间）；前端取外部档案读取接口的品种后做精确匹配（纯函数）
- **被否方案**：后端 join pet 表计算命中——编译期依赖未合并模块，整个后端被外部进度阻塞；且 spec 数据需求本就要求候选响应携带名单
- **理由**：与原型 client-side `breedHits` 一致；后端零外部依赖，无档案路径可先落地验证；匹配纯函数 apply 期 UT（atdd-design §8）

### D2: 数据模型——行政区加收录标记，禁养名单独立表

- **背景**：名单条目需携带来源政府文件与更新时间（spec 数据需求），且 #14 将复用
- **选择**：`administrative_region` 增 `policy_covered`（布尔）；新表 `region_banned_breed`（region_adcode FK、breed_name、source、updated）；种子迁移标记珠海/杭州并注入名单；候选范围由 `policy_covered=1` 数据驱动（2026-11-16 需求方决定移除独立 pilot 列，收录即候选）
- **被否方案**：JSON/CSV 列存名单（V9 `allowed_pet_types` 风格）——来源/更新时间逐条目字段难以约束与查询，#14 复用不便；硬编码试点 adcode 于服务层——扩候选需改代码；独立 `pilot` 列——与收录状态在当前候选口径下冗余，需求方决定移除
- **理由**：关系化条目满足逐条来源契约；`policy_covered` 单列让候选范围数据驱动

### D3: 迁移版本号避让外部 V8/V9

- **背景**：外部 `feature/add-pet-schema` 已占 V8/V9，未合并
- **选择**：本 change 迁移预定 V10 起；实现与合并前复核 main 最新版本号，若冲突则顺延重编号
- **被否方案**：抢占 V8——与外部分支直接冲突，合并顺序不可控
- **理由**：Flyway 版本单调；重编号成本低（未发布）

### D4: 选定状态存 localStorage，登出清除

- **背景**：需求方确认前端本地存储、登出即清除（REQ-005 决策）
- **选择**：键 `pawtrip.selectedDestination`，值 `{adcode, cityName, province, selectedAt}`；封装读写/清除工具 + 订阅 hook（`useSyncExternalStore`），供 `/cities` 与顶栏 chip 共享；登出成功回调中与 `queryClient.clear()` 一并清除
- **被否方案**：服务端持久化（需求方已否）；sessionStorage（关标签页即丢，弱于已确认的持久化口径）；引入全局状态库（项目约定无全局 store，两城场景过重）
- **理由**：刷新保留、重选覆盖、跨页面 chip 同步均由同一存储源驱动

### D5: 搜索与筛选为客户端过滤

- **背景**：候选固定两城，数据一次取回
- **选择**：关键字匹配城市名/省份、筛选谓词（covered ∧ ¬命中；无档案退化 covered-only）均在前端对缓存候选列表计算；计数与空态随过滤结果渲染
- **被否方案**：服务端查询参数搜索/筛选——两城规模无收益，徒增接口契约与测试面
- **理由**：原型即客户端过滤；TanStack Query 缓存候选，过滤为派生状态

### D6: 档案消费 adapter 与缺省退化

- **背景**：外部档案接口契约未定（endpoint/字段名未知），且未交付
- **选择**：前端单一 `pet-profile` query adapter 封装外部读取；请求失败/无档案一律按「无档案」退化（筛选 covered-only、不触发禁养判定），与 spec 退化分支一致；外部契约落地后仅改 adapter
- **被否方案**：等外部合并再动工（全面阻塞）；本 change 自实现档案（违反 G1 Revision scope）
- **理由**：无档案路径现在即可实现并 E2E 验证；`@profile-dependency` 用例挂起待外部就绪（atdd-design §1）

### D7: 接口与错误契约沿用既有约定

- **背景**：项目统一 Problem Details + 稳定 `code`，session 认证
- **选择**：`GET /api/destinations` 纳入既有认证过滤链（未认证 401 `UNAUTHENTICATED`）；只读、无请求体；响应 DTO 含 adcode/name/province/policyCovered/bannedBreeds[]
- **被否方案**：新错误风格/公开匿名接口——破坏既有契约且 spec 要求 401
- **理由**：复用 backend-authentication/backend-error-handling Living 契约，零新增约定

## Risks / Trade-offs

- [外部档案 change 进度阻塞 AC-2 完整口径/AC-4 验收] → D1/D6 解耦 + `@profile-dependency` 门控用例；无档案路径先行验证；合并顺序与对方协调（lint L5）
- [breed 词表不一致导致精确匹配漏判] → 禁养种子与外部枚举同一词表（deep-dive ①）；实现期与对方核对，词表外品种先扩枚举再摘录
- [迁移版本号与外部冲突] → D3 实现/合并前复核 main
- [种子数据准确性（合规）] → 政府公开文件摘录 + 逐条 source/updated；实现期数据任务，验收前完成
- [localStorage 换设备不跟随] → 需求方已接受；后续 story 需服务端上下文时另行演进
- [前端匹配逻辑与 #14 复用] → 匹配纯函数独立模块，#14 可直接引用；若将来需服务端判定再迁移（不在本 change）

## Migration Plan

1. Flyway 前向迁移（V10+）：加列 + 新表 + 珠海/杭州种子；`ddl-auto=none` 下实体同步映射
2. 回滚：开发/测试库重建即可（SQLite 文件级）；无生产部署与数据回填需求
3. 与外部 change 的合并顺序无强约束（后端互不引用）；前端 adapter 联调需外部接口就绪

## Open Questions

- 外部档案读取接口的确切 endpoint 与字段名（breed 字段命名/枚举值）：D6 adapter 隔离，契约落地时确认即可，不影响本设计与任务拆解
- 珠海/杭州禁养名单与收录状态具体值：实现期数据任务（deferred，字段与来源契约已定）