# Proposal

## Why

管理员目前无法维护 PawTrip 的地点资料，系统也没有区分管理员与普通用户的授权能力。新增管理员专属地点管理能力后，管理员可从高德 POI 中选择地点、补充游玩时间，并持久保存完整地点信息和照片来源 URL，由前端直接通过 URL 显示图片。

## What Changes

- 为账号增加 `USER` / `ADMIN` 角色，登录用户信息返回角色；管理 API 与页面均仅允许管理员访问。通过 Flyway 修改表结构，账号仍由 `scripts/seed-users.mjs` 注入，并加入开发/测试管理员账号。
- 增加管理员地点管理页面与顶部导航入口，提供“所有地点”和“pawtrip地点”两个分页表格，使用 shadcn/ui 与 TanStack Table。“pawtrip地点”展示已保存额外信息的地点。所有地点表保留当前高德查询页返回的地点；后端按 POI ID 匹配数据库记录，对已保存地点显示状态并禁用该表的编辑操作。
- 地点筛选支持城市树选择和后端提供的地点类型选项；首版仅提供“景点”，映射到高德类型码 `110000`。省市数据从项目根目录的高德行政区 JSON 导入数据库，行政区树仅使用省级和市级；直辖市等没有市级子节点的省级节点按省级叶节点处理。
- 所有地点列表按城市和地点类型从高德 POI 搜索取得基础数据；后端按 POI ID 匹配数据库，已保存地点不隐藏，而是标记为已添加额外信息并禁用编辑。对未保存地点，管理员可补充信息并保存；后端取得 POI 详情及 `business`、`photos` 可选数据，将 POI、额外信息和照片元数据（包括来源 URL）保存到数据库，不下载或保存图片二进制。已保存地点的管理弹窗从数据库读取完整信息，前端直接通过照片来源 URL 显示图片，不提供手动获取/重试图片入口。
- 首版仅为景点提供最小、最大游玩时间，单位为小时、整数且均可不填。地点保存后，“pawtrip地点”表及其编辑弹窗展示数据库中的完整地点信息。

## Capabilities

### New Capabilities
- `location-management`: 管理员地点搜索、筛选、分页、额外信息维护、POI 与照片元数据持久化及图片 URL 展示。

### Modified Capabilities
- `backend-authentication`: 持久化用户角色、认证用户响应包含角色，并对管理员 API 进行服务端授权。
- `backend-amap-poi-search`: 支持按 POI ID 获取详情及 `business`、`photos` 可选数据，供地点管理能力内部使用。
- `frontend-authentication`: 当前用户状态包含角色，供管理员导航与路由授权使用。
- `web-app-shell`: 增加仅管理员可见的地点管理导航 Tab 和受保护页面路由。

## Impact

- 后端：`app_user` 的 Flyway schema migration、账号种子脚本、Spring Security、认证响应、地点与行政区持久化、管理 API、高德 POI 详情/照片元数据集成；新增迁移移除已有照片 BLOB 列。
- 前端：管理员页面与路由、导航、地点/行政区/类型查询、分页表格、编辑弹窗和基于来源 URL 的图片展示；移除图片获取交互；需增加 `@tanstack/react-table` 依赖。
- 数据：Flyway 创建地点、照片元数据和行政区表，并通过后续迁移删除照片 BLOB 列；省市数据由 `AMap_adcode_citycode_hierarchical.json` 提供并由 Flyway 初始化。高德搜索分页仍受单次查询最多 200 条的限制。
