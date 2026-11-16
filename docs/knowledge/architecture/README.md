---
id: kb.architecture.overview
title: Pawtrip architecture overview
area: architecture
---

# Pawtrip 架构概览

## 仓库结构

```text
pawtrip/
├─ apps/
│  ├─ web/      frontend: npm repo
│  └─ server/   backend: maven repo
└─ package.json npm workspace
```

## 技术栈

### 前端（apps/web）

- Vite 8、React 19、TanStack Router / Start、Tailwind CSS 4
- shadcn/ui，底层 primitive 为 Base UI（`@base-ui/react`，`base-nova` 风格）

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080
- 数据访问：Spring Data JPA + Hibernate 社区 SQLite 方言（`org.hibernate.community.dialect.SQLiteDialect`）
- schema 管理：Flyway 12.4.0；JPA `ddl-auto=none`，不自动建表或改表
- 数据库：SQLite 文件 `apps/server/data/pawtrip.db`，由 Flyway 迁移建表（`V1` 问候语、`V2` 用户表）；测试账号由种子脚本按需注入
- 数据库文件属于本地运行产物，已由 `.gitignore` 排除

### 地图集成分层

后端地图能力按应用端口与基础设施适配器组织：

```text
com.pawtrip.server
├─ application/
│  ├─ model/maps/          内部地点搜索请求、分页元数据及原始 POI JSON
│  └─ port/maps/           应用功能调用的地点搜索端口
└─ infrastructure/amap/
   ├─ config/              高德服务端配置（AMAP_API_KEY 等）
   ├─ transport/           共用同步 HTTP 客户端、凭据注入及安全错误转换
   └─ api/                 高德具体 API 适配器（当前为 POI 搜索）
```

依赖方向为应用功能依赖 `application.port.maps`，`infrastructure.amap.api` 实现该端口并依赖共享传输和配置；应用模型不依赖 Controller、HTTP 响应类型或高德传输。POI 搜索仅是内部能力，本次不增加 Controller、`/api/pois/*` 路由或单独的 `poi` 包。高德凭据只从服务端配置读取，缺失时应用仍可启动，实际调用再以类型化错误失败。

### 地点管理功能模块

`com.pawtrip.server.location` 是地点管理功能模块，包含管理员 API、应用服务、地点/行政区/照片持久化实体及 Spring Data 仓库。`AdminLocationController` 只依赖地点管理应用服务；应用服务依赖仓库和 `application.port.maps.PlaceSearchPort`，不得直接依赖 `infrastructure.amap` 实现。管理 API 位于 `/api/admin/**`，由 Spring Security 在服务端要求 `ADMIN`。高德候选查询调用地图端口；已保存地点查询只访问数据库。地点详情与创建/更新请求通过可选 `petPolicies` 对象维护 6 项宠物政策；管理端“保存地点”和“pawtrip地点”两个现有弹窗提供编辑入口，地点列表响应不包含政策。

### 目的地候选功能模块

`com.pawtrip.server.destination` 是目的地候选功能模块（US-47），只读、无写入端点：

- `GET /api/destinations`：需登录（沿用 `/api/**` 认证链，未登录 `401 UNAUTHENTICATED`）；返回全部城市级行政区候选数组（`level='city'`，按名称排序，`@EntityGraph` 一次性抓取允许品种），每项含 `adcode`、`name`、`province`（父级省名）、`policyCovered`、`bannedBreeds[]`、`allowedPetTypes`（string|null）、`allowedDogBreedIds`（number[]）、`maxSinglePetShoulderHeightCm`（number|null）。可选查询参数：`keyword`（服务端按城市名/省份 trim 后 contains 过滤）、`petFriendly=true`（服务端叠加筛选：每人限养数 `max_pets_per_person` 为 null 或 >=1，且传 `petType`（CAT/DOG，非法 400）时 `allowed_pet_types` **须非 null 且含该类型（null=不允许）**，且 `petType=DOG` 传 `breedId` 时城市允许品种列表为空（未配置）或含该 id，且传 `shoulderHeightCm` 时城市肩高上限为 null（不限制）或 >= 该值；未传档案参数退化为仅限养数规则）。后端不引用宠物档案模块，匹配输入由前端传参。
- 政策数据暂缓（2026-11-16 需求方移除原 V14 政策种子迁移）：`policyCovered` 占位恒为 `false`、`bannedBreeds` 占位恒为空数组；收录状态与禁养名单的数据源确定后恢复（判断点在 `DestinationController` 留 TODO）。原摘录稿存档于 `openspec/changes/destination-selection/seed-data.md`。**例外**：V16 按需求方指定为**全部城市级行政区**注入 `allowed_pet_types='CAT,DOG'` 与 7 个非烈性允许品种（柯基犬/贵宾犬/金毛寻回犬/拉布拉多寻回犬/比熊犬/博美犬/哈士奇，`city_allowed_dog_breed`，词表同 `dog_breed`）；肩高上限未配置（null=不限制）。
- 禁养匹配纯函数 `breedHitsBanList`（档案品种 × 名单，精确匹配）保留于前端 `lib/destination-matching.ts`；Badge/提醒展示暂缓（TODO）。后端不引用宠物档案模块（档案由外部 US-01 change 交付）；选定目的地不做服务端持久化。
- 迁移版本号约定：宠物档案系列占用 V8–V14（PR #33–#36、#41）；V15 空缺（原在途 PR #43 由 PR #47 取代，#47 复用既有列无迁移）；本模块全城市种子为 **V16**（2026-11-16 需求方确认）；PR #47 新增城市政策管理 API（/api/admin/cities）可维护类型/品种/肩高 ；后续政策数据迁移交付时需复核 main 最新版本号。

前端选定状态约定（`apps/web/src/lib/selected-destination.ts`）：

- 已选目的地仅存浏览器 sessionStorage（会话级，关标签页即失效），键 `pawtrip.selectedDestination`，值为 JSON `{adcode, cityName, province, selectedAt}`；读取时校验四字段均为字符串，损坏/缺失一律视为未选。
- 状态经 `createSelectedDestinationStore` + `useSyncExternalStore` 订阅（`useSelectedDestination()`），无全局状态库；重选直接覆盖，同标签页内刷新/重进页面保留。
- 确认登出（`__root.tsx` logout mutation `onSuccess`）在 `queryClient.clear()` 之外调用 `selectedDestinationStore.clear()` 清除该键。
- 顶栏目的地 chip 与 `/cities` 确认提示同源于该 store：已选显示城市名，未选显示「目的地未选」；chip 仅在登录成功后渲染。
- 档案经 `queries/pet-profile.ts` 只读 adapter 消费外部 US-01 接口 `GET /api/pets`（PR #41 后含 `dogBreed`），取第一只宠物（需求方确认单宠口径）暴露 `petType`/`breedId`/`breedName`/`shoulderHeightCm`，任何失败/无档案退化为 null。`/cities` 卡片右上角按 `matchesCityPetPolicy`（lib/destination-matching.ts，与服务端筛选同语义：类型 null=不允许，品种空列表/肩高 null=未配置放行）显示绿色「匹配」/红色「不匹配」Badge，无档案不显示，标签独立于筛选开关；已选定卡片按钮再次点击取消选定（store.clear）。

## 运行拓扑

```text
Browser (http://localhost:3000)
   │  GET /api/greeting
   ▼
Vite dev server ── /api proxy ──▶ Spring Boot (http://localhost:8080)
                                      │
                                      ▼
                              SQLite apps/server/data/pawtrip.db
```

## 数据与接口

- `greeting` 表：`id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`；当前单条记录由迁移写入。
- `GET /api/greeting`：需登录；通过 `GreetingRepository.findFirstByOrderByIdAsc()` 读取单条问候语，返回 `200` + `application/json` + `{"message":"Hello World"}`；未登录返回 `401 UNAUTHENTICATED`。
- 首页通过 TanStack Query 在客户端请求同源 `/api/greeting`，仅展示响应中的 `message`，不在前端硬编码文案。
- 错误响应统一为 RFC 9457 Problem Details（`application/problem+json`），并扩展稳定字段 `code`；成功响应不套统一 envelope。

### 宠物接口与品种

- 宠物接口：`GET/POST /api/pets`、`GET/PUT/DELETE /api/pets/{id}`，均需登录且只能访问本人宠物；请求体包含 `name`、`petType`、`weightKg`、`shoulderHeightCm`、`hasLeash`、`hasVaccinationProof`、可选 `photo`（base64）与 `dogBreedId`。
- 品种：`dog_breed` 表保存 20 条常见犬种；`GET /api/dog-breeds` 按名称升序返回 `id`、`name`、`officialAggressive`。`pet.dog_breed_id` 为可空外键（`ON DELETE SET NULL`）。
- 校验：类型为 `DOG` 时 `dogBreedId` 必填且必须存在；类型为 `CAT` 时不得携带品种；历史无品种的狗可读取，详情显示“未设置”，编辑保存前必须补选。
- 响应：宠物详情与列表返回嵌套 `dogBreed` 对象；无品种时为 `null`。

## 认证与授权

- 登录方式：Spring Security 表单登录（`formLogin`），登录处理地址 `POST /api/auth/login`，使用服务端会话 `JSESSIONID`；不使用 JWT，也不在前端存储认证令牌。
- 账号来源：数据库 `app_user` 表（`username` 唯一、`password_hash` 为 BCrypt 哈希、`enabled` 控制启用）。Flyway `V2__create_app_user.sql` 仅建表，不注入账号；本地/测试账号由 `npm run seed:users`（`scripts/seed-users.mjs`）以 bcrypt cost 10 哈希后幂等写入。
- 会话：`server.servlet.session.timeout=30m`；会话 cookie 为 `HttpOnly`、`SameSite=Lax`；登录成功后通过 `changeSessionId()` 更换会话 ID 防止会话固定。
- 授权规则：`/api/auth/login|me|logout`、`/error` 与 ERROR dispatch 放行；`/api/**` 需认证；其余请求 `denyAll`。
- 认证接口：`GET /api/auth/me` 返回当前用户名；`POST /api/auth/logout` 成功后返回 `204`。
- CSRF：启用 `csrf.spa()` 与 `CookieCsrfTokenRepository`，服务端通过 `CsrfCookieFilter` 下发可读的 `XSRF-TOKEN` cookie；前端对非安全方法回传 `X-XSRF-TOKEN` 头。
- 错误语义：安全过滤链中的未认证/拒绝访问与 MVC 层输出相同 Problem Details（`application/problem+json` + 稳定 `code`），不会返回 HTML 登录页或 `302`；未认证为 `401 UNAUTHENTICATED`，CSRF/权限不足为 `403 ACCESS_DENIED`，登录失败为 `401 INVALID_CREDENTIALS`，响应不区分用户名是否存在。
- 日志：登录失败与异常日志不记录密码、哈希或会话 ID。

### 前端认证

- 认证状态由 `apps/web/src/queries/auth.ts` 的 `authQueryOptions`（query key `["auth","me"]`）统一管理，仅在客户端启用（SSR 阶段不取数）。
- `apps/web/src/routes/_authenticated.tsx` 是 pathless 受保护布局，`/` 与 `/about` 位于其下；未登录或 `401` 时跳转 `/login`，已登录渲染 `<Outlet />`。
- 登录页 `/login` 使用表单编码提交；成功后将当前用户写入 auth query 缓存并跳转 `/`；已登录访问 `/login` 时跳回 `/`。
- 顶部导航仅在已登录时显示“退出登录”；登出成功后清空 Query 缓存并跳转 `/login`。
- `QueryCache.onError` 对非 auth query 的 `401` 清理受保护缓存并使 auth query 失效，从而触发守卫跳转；登录失败自身的 `401` 不触发全局跳转。
- 请求层显式使用 `credentials: "same-origin"`，从 `XSRF-TOKEN` cookie 读取令牌并写入 `X-XSRF-TOKEN` 请求头；SSR 阶段跳过浏览器 cookie 读取。

## 实现约定

### 后端数据访问

- 关系型数据访问统一使用 Spring Data JPA 仓库；简单查询优先使用派生查询或 JPQL。
- 控制器与服务层不直接使用 `JdbcTemplate` 手写 SQL；原生 SQL 仅在派生查询/JPQL 无法表达时使用，并在代码或变更记录中说明原因。
- schema 由 Flyway 管理，JPA 不执行自动 DDL。

### 后端错误处理

- 业务异常继承 `ApiException` 并携带 `ApiErrorCode`（HTTP 状态、稳定 code、英文 title）。
- `GlobalExceptionHandler` 统一映射领域异常、校验异常与未捕获异常，输出 Problem Details：`type`、`title`、`status`、`detail`、`instance` 与扩展字段 `code`。
- `detail` 使用英文、偏技术化描述，供开发者与错误页展示；不承担面向终端用户的本地化文案职责。
- 未捕获异常记录服务端错误日志并返回 `500` + `INTERNAL_ERROR`，不向客户端泄露堆栈或内部细节。
- `spring.mvc.problemdetails.enabled=true`，框架内建异常也走同一 Problem Details 格式。

### 前端 UI 基础

- UI 组件统一来自 `apps/web/src/components/ui/`，使用 shadcn/ui 的 Base UI 版本；不引入 Radix 版本或其他 UI 组件库。
- 宠物卡片使用 React Bits Tilted Card 的 TS + Tailwind 变体，以源码形式纳入 `apps/web/src/components/ui/tilted-card.tsx`，不新增运行时依赖，也不引入自定义 CSS 类。
- 页面结构与交互只通过组件库组合和 Tailwind 布局工具类表达；`apps/web/src/styles.css` 仅保留 Tailwind、`shadcn/tailwind.css` 与主题令牌，不新增自定义类。
- 应用外壳位于 `apps/web/src/routes/__root.tsx`：顶部居中的 `Home` / `Paws` 两个 Tab 与真实路由 `/`、`/paws` 同步；`/` 展示问候语，`/paws` 展示当前用户的宠物画廊并支持查看、编辑、新增与删除；狗类型在表单中必须从 `GET /api/dog-breeds` 选择品种，卡片右下角优先显示狗品种，无品种时回退显示猫/狗类型。

### 前端服务端状态

- 服务端数据统一使用 TanStack Query 获取与缓存；`QueryClient` 在 `getRouter` 内按请求创建，并通过 `setupRouterSsrQueryIntegration` 接入 router context。
- query key 与 query function 集中定义在 `apps/web/src/queries/`；页面组件使用 `useQuery`，不使用 `useEffect` + `fetch` 自行管理请求状态。
- 宠物照片以 base64 存储并由 `GET /api/pets` 返回，没有 content type；前端在 `apps/web/src/lib/pet-photo.ts` 按 JPEG/PNG/GIF/WebP 魔数推断 MIME 后生成 data URL，无照片或无法识别时展示占位。
- 依赖 Vite `/api` 代理的相对 URL 接口保持客户端取数，不在 SSR loader 中直接请求。

### 前端请求与错误呈现

- 所有接口调用经过 `apps/web/src/lib/http/request.ts`：统一 JSON headers、超时与 `AbortSignal`、Problem Details 解析，并把非 2xx 响应转换为 typed `ApiError`。页面与 query 函数不直接调用 `fetch`。
- `ApiError` 暴露 `status`、稳定 `code`、`detail`、`instance` 与 `isRetryable`；网络错误与超时映射为可重试错误。
- QueryClient 默认 `staleTime=30s`；仅对可重试错误（网络错误与 5xx）重试，最多 2 次；4xx 不重试。
- 首次加载失败通过 `throwOnError` 进入根路由 `errorComponent`，展示 `ApiError.detail` 并提供重试；后台刷新失败保留缓存数据，仅由 `QueryCache`/`MutationCache` 的 `onError` 记录日志，不替换页面。
- 未匹配路由由根路由 `notFoundComponent` 呈现；不引入 toast、成功响应 envelope 或 `detail` 到中文文案的 i18n 映射。

## 测试与验证

- 后端：`cd apps/server && ./mvnw test`，包含使用临时 SQLite 文件的接口验收测试与错误路径测试。认证 E2E 前先运行根目录 `npm run seed:users` 注入本地测试账号。
- 前端：根目录 `npm run build`；类型检查 `npx tsc --noEmit -p apps/web/tsconfig.json`。
- 端到端：冷启动后端后确认数据库文件与接口，再启动前端验证登录/登出、受保护路由跳转、`/` 问候语、`/paws`、Tab 切换、前进后退、404 与首页首次加载失败；CORS 不在当前范围。
- 