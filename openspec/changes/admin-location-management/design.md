# Design

## Context

现有后端采用 Spring Boot、Spring Data JPA、SQLite 与 Flyway；JPA 不负责 DDL。认证使用 Spring Security 会话，当前用户响应只有用户名，`/api/**` 目前统一要求登录。地图搜索位于 `application.port.maps` 与 `infrastructure.amap.api` 分层，目前已有高德 POI 搜索适配器、分页限制（每页最多 25 条、每个查询最多 200 条）和共享 HTTP 传输层。

前端采用 TanStack Router、TanStack Query 和 shadcn/ui；query 定义集中在 `src/queries/`，服务端请求经统一 request helper。当前没有 `@tanstack/react-table`。详细动机和行为要求见 `proposal.md` 及各 delta spec。

## Goals / Non-Goals

**Goals:**
- 通过经管理员授权的后端 API 提供行政区、地点类型、所有高德地点、已保存 Pawtrip 地点、地点详情和保存/更新能力；照片由前端直接按来源 URL 展示。
- 在 SQLite 中可靠保存 POI、扩展字段、照片元数据/来源 URL 和行政区数据；通过后续迁移移除既有照片 BLOB 列，并适配现有认证、错误处理及前端查询约定。
- 让两张地点表都采用服务端分页；高德列表严格遵守上游分页边界。

**Non-Goals:**
- 不建立独立 POI 公共 API、不改造普通地点搜索接口、不支持关键词搜索或地点删除。
- 不把高德实时详情作为已保存地点详情的回退来源；已保存地点详情和照片 URL 元数据只由 Pawtrip 数据库提供，图片字节由浏览器直接从照片来源 URL 加载。
- 不在 Flyway 中创建或迁移账号记录；账号仍由 `scripts/seed-users.mjs` 注入。

## Decisions

### 1. 使用独立 schema migration 添加角色和地点管理数据

- 新增后续 Flyway migration（不修改已执行的 V2）：给 `app_user` 增加非空 `role` 字段并设默认 `USER`，确保已有数据库中的用户自动成为普通用户。种子脚本为所有账号显式写入 `USER` 或 `ADMIN`，并按现有 username upsert 约定幂等更新。
- 后续迁移创建行政区、已保存地点、照片表。建议的关系结构：
  - `administrative_region`：高德 adcode 主键、名称、层级（省/市）、父级 adcode；仅写入省和直接市级节点。直辖市等缺少市级子节点时仅有省级行。
  - `pawtrip_location`：POI ID 唯一键、供显示/筛选的基础列（名称、类型码、地址、坐标、行政区等）、原始基础 POI JSON、完整 `business` JSON、类型分组键及可空的最小/最大游玩小时数。
  - `location_photo`：地点外键、顺序、高德照片原始 JSON（保留未知字段）、标题和来源 URL。仅保存照片元数据，不保存图片字节、获取状态或媒体类型。地点和照片记录分离，避免将多张图片塞在地点列表响应中。
- 由静态 Flyway SQL migration 导入根目录 `AMap_adcode_citycode_hierarchical.json` 中的省级和直接市级节点。JSON 是生成迁移数据的来源，不作为运行时文件读取；迁移中不包含县、区或街道。校验时对照源数据的省、市节点数量及层级关系。
- 外部 Amap 数据保存前先完成详情获取和响应校验；数据库事务内写入地点、完整 `business` 和全部照片元数据/来源 URL，不请求照片 URL。已有 migration 若创建了照片 BLOB 列，则新增前向 migration 重建照片表，保留其余照片元数据并删除二进制列。POI ID 唯一约束处理并发保存；重复创建返回冲突而不覆盖已有记录。

**考虑过的替代方案：**修改 V2 会破坏已有数据库的 Flyway 校验，因此采用追加 migration；在运行时解析根目录 JSON 会使部署依赖仓库工作目录和外部文件，因此行政区数据编入版本化 migration。

### 2. 管理功能使用独立的管理员 API，并由服务端授权

所有地点管理接口置于 `/api/admin/**`，由 Spring Security 在服务端要求 `ADMIN`，前端路由与导航检查仅作为 UX，不是安全边界。`/api/auth/me` 和登录成功响应扩展为返回 `{ username, role }`。角色来自已认证的持久化用户身份，不接受请求体或 query 参数中的角色声明。错误继续遵循现有 Problem Details：未认证 `401 UNAUTHENTICATED`，非管理员 `403 ACCESS_DENIED`。

首版 API 合约建议如下；成功响应使用 JSON，不增加全局 envelope。`page` 从 1 开始，`pageSize` 为正整数。

| Method / path | 用途与关键参数 | 返回内容 |
|---|---|---|
| `GET /api/admin/regions` | 行政区树；无分页 | 省份数组，每个省含市级 `children`；无子级的直辖市为可选叶节点 |
| `GET /api/admin/location-types` | 获取服务端配置的类型分组；无分页 | `{ key, label, typeCodes }[]`，首版 `attraction` / `景点` / `[110000]` |
| `GET /api/admin/locations/amap` | 高德结果：`regionCode?`, `typeGroup`, `page`, `pageSize` | 当前页 POI 基础 DTO、`saved` 标记和分页元数据；以 POI ID 批量匹配 Pawtrip DB |
| `GET /api/admin/locations` | 已保存地点：`regionCode?`, `typeGroup?`, `page`, `pageSize` | Pawtrip DB 的地点摘要及分页元数据；不得调用高德 |
| `GET /api/admin/locations/{poiId}` | 已保存地点详情 | DB 中完整基础 POI、`business`、照片元数据/来源 URL 和额外信息；不调用高德，不返回图片二进制 |
| `POST /api/admin/locations` | 首次保存：`{ poiId, typeGroup, minVisitHours?, maxVisitHours? }` | 创建后的完整数据库地点详情；服务端按 POI ID 获取 Amap 详情并保存照片元数据/来源 URL，不下载图片 |
| `PATCH /api/admin/locations/{poiId}` | 更新已保存地点的额外字段（首版游玩时间） | 更新后的 DB 地点详情；不调用高德 |


高德列表请求的 `typeGroup` 必须对应服务端已公布的类型分组；后端从分组解析高德 `types` 参数，不允许客户端提交任意类型码。`regionCode` 必须存在于行政区表；省、市编码作为 `region` 并开启严格区域限制。搜索返回当前页后，后端按该页 POI ID 批量查询已保存地点，只增加 `saved` 状态，不过滤已保存 POI。`POST` 只接受 POI ID 和首版额外字段，基础信息、`business`、照片均以高德详情响应为准，不信任客户端提交的 POI 数据；照片只保存元数据和来源 URL，不请求 URL 获取图片内容。游玩时间只对景点接受，值为非负整数小时、可空；两者均有值时校验最小值不大于最大值。对已存在 POI 的重复创建返回 `409`；不存在的详情或上游详情失败时不产生部分 Pawtrip 地点记录。

两种列表 API 都返回相同分页元数据，例如 `{ items, page, pageSize, totalElements, totalPages, hasNext, hasPrevious }`。高德结果将 `totalElements` 限制为 `min(高德 count, 200)`；页大小不超过 25，且要求 `(page - 1) * pageSize < 200`，超出 200 条可达范围的页不请求高德。UI 不得提供或请求不可达页。数据库列表采用服务端分页并设合理页大小上限，固定按数据库记录 `id ASC`（创建顺序）排序；编辑不得更新或改变该排序键。分页适用于地点行列表查询；行政区树、固定类型选项、单地点详情和单张图片不是行列表，不做分页。

**考虑过的替代方案：**公开通用 POI API 会绕过“地点管理是管理员能力”的边界并扩大 API 面，因此使用 `/api/admin/**`；由客户端拼接 POI 基础字段保存会允许篡改，因此首次保存只接收 POI ID 与业务字段，由后端向高德取得权威详情。

### 3. 区分 Amap 候选数据与 Pawtrip 持久化数据

高德查询沿用 `application.port.maps` / `infrastructure.amap.api` 地图集成边界：扩展应用端口及 Amap adapter 以支持类型码、行政区、文本搜索 `page_num/page_size`，并新增按 POI ID 读取详情的端口能力，请求 `show_fields=business,photos`。保留 Amap 原始 JSON 字段，避免丢弃未识别的 `business` 或照片字段。管理 Controller 调用应用服务，不直接依赖 Amap transport。

`/locations/amap` 只返回当前高德页的基础 POI 数据与 DB 匹配标记；“所有地点”表中匹配项保留并禁用编辑。未保存地点的编辑弹窗只展示基础信息和景点游玩时间，不预取或展示详情扩展数据。首次保存才取 Amap 详情与照片元数据。已保存列表与详情完全从 Pawtrip DB 读取；其编辑弹窗展示完整数据库内容，只有额外字段可编辑。详情响应返回照片元数据和来源 URL；前端直接将 URL 用于图片展示，不请求 Pawtrip 图片二进制接口。

类型分组在后端集中定义，首版为 `attraction` -> `景点` -> `110000`；已保存地点保存分组键，以便数据库筛选不依赖临时高德搜索。

**考虑过的替代方案：**在详情读取时回源高德会导致已保存内容随上游变化，与“已保存详情从数据库读取”冲突；因此将上游抓取限制在首次保存，详情中的照片 URL 也只使用数据库已保存的元数据。

### 4. 仅保存照片元数据，由浏览器直接加载来源 URL

后端保存高德返回的完整照片元数据和来源 URL，不请求照片 URL，不保存图片二进制，也不维护下载状态或媒体类型。已保存地点详情返回照片元数据/URL，前端直接以来源 URL 展示图片；图片加载失败时展示占位状态，不提供后端获取或重试入口。移除图片重试 API 和图片二进制读取 API。对前端使用的 URL 限制为 HTTP(S) 图片来源，避免将其他 URL scheme 作为图片地址。

**考虑过的替代方案：**继续代理或缓存图片会增加后端下载、超时、SSRF 防护和存储维护成本，与直接按来源 URL 展示的目标不符。直接加载意味着图片可用性依赖上游，并可能使浏览器向图片来源发出请求；以占位状态处理不可用图片，不引入服务器端回退或重试。

### 5. 前端采用 TanStack Query + TanStack Table 服务端分页

新增 `@tanstack/react-table`，与现有 shadcn/ui Table 组合。列表使用受控分页状态和 `manualPagination`，由 API 提供总条数/页数；query key 包含 tab、筛选条件、页码和页大小，筛选变化时重置到第一页。所有地点列表与 Pawtrip 地点列表各自维护分页状态。首次创建（`POST`）成功后，使用响应中的 POI ID 直接更新当前高德结果页 query cache 中对应行的 `saved` 状态，使该行立即显示已存在于“pawtrip地点”的提示并禁用编辑，不等待重新请求“所有地点”列表；同时使 Pawtrip 地点列表 query 失效，以便该新地点进入数据库分页结果。编辑已保存地点（`PATCH`）成功后，使用响应直接更新当前 Pawtrip 地点页对应行和详情 query cache，不失效或重取列表 query，不改变总条数、页码、行位置或排序。数据库列表固定按 `id ASC`（创建顺序）返回，编辑不更新该排序键。照片 URL 来自地点详情数据，图片加载无需单独 query、mutation 或列表刷新。

城市筛选组件消费省市树；有子节点的省份默认收起，仅用于展开，不能作为区域筛选值；城市和省级叶节点（直辖市等）可选。未选择城市或省级叶节点时，“所有地点”不发起高德列表查询；选择变化将表格页码重置为第一页。类型选择只发送服务端类型分组 key。管理员导航 Tab 指向 `/admin/locations`；管理员路由放在现有认证路由结构中并额外检查角色，普通用户重定向回普通受保护页面，未登录用户沿用 `/login`。

**考虑过的替代方案：**客户端本地切页会先拉取整批结果，既无法扩展数据库列表，也会违反高德 200 条查询上限下的真实分页反馈，因此两表都使用服务端分页。

## Risks / Trade-offs

- [行政区源 JSON 与迁移 SQL 可能漂移] → 将导入数据冻结在版本化 Flyway migration；增加数量、层级、adcode 唯一性校验，后续行政区更新使用新 migration。
- [高德服务失败或限流导致“所有地点”不可用] → 返回既有 Problem Details / 类型化上游错误；Pawtrip 已保存列表和详情保持 DB-only 可用，图片来源 URL 已随照片元数据持久化。
- [高德查询 count 与实际可访问结果不一致，或超过 200 条] → 分页元数据按 200 条封顶，前后端共同校验页边界，不扫描额外页面以隐藏已保存结果。
- [浏览器直接加载的远程图片不可用、被限流或来源记录客户端请求] → 图片加载失败时显示占位状态；地点和照片元数据仍可正常查看，不由服务器代理或重试图片。
- [既有数据库中的照片 BLOB 在迁移后不可恢复] → 迁移前备份数据库；迁移只删除二进制列并保留照片元数据和来源 URL，回滚应用版本不能恢复被删除的图片字节。
- [照片元数据含非预期 URL scheme] → 前端只将 HTTP(S) URL 用于图片显示；后端不向照片 URL 发起请求，因此不产生服务器端 SSRF 请求入口。
- [管理权限只在前端隐藏会造成越权] → 对整个 `/api/admin/**` 服务端强制 ADMIN；用匿名、USER、ADMIN 三类接口测试验证边界。

## Migration Plan

1. 部署包含角色字段的 Flyway migration；已有用户由默认值成为 `USER`，Flyway 不创建账号。运行更新后的 `scripts/seed-users.mjs` 注入/更新开发普通账号和开发/测试管理员账号。
2. 应用地点与照片表、行政区表及静态省市数据 migration；核对数据数量、层级、外键和唯一约束。
3. 发布后端管理 API、管理员角色认证响应和授权；配置服务端 Amap Key，无需配置图片下载 host。
4. 发布前端依赖、管理员路由、筛选和分页表格。
5. 验证管理员与普通用户权限、两个列表分页、首次保存、照片 URL 元数据持久化、DB-only 详情读取及前端直接图片展示。

回滚优先回退应用版本。Flyway 的角色/地点表及初始化行政区数据采用向前兼容策略；移除照片 BLOB 列的迁移会丢弃已有图片二进制，执行前必须备份，回退应用版本无法恢复该数据。新增 `role` 列对旧代码向前兼容（旧代码忽略该列），新代码部署后要求迁移先完成。账号注入仍独立于 migration，回滚不会自动删除账号。
