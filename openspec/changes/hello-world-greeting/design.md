## Context

PawTrip 目前只有脚手架:`apps/server` 是 Spring Boot 4.1.2 / Java 21 的空应用,`apps/web` 是 TanStack Start + React 19 的模板页,`openspec/specs/` 为空。本 change 是首个变更,目标是用最小实现打通 SQLite → Spring Boot → React 首页。

上游需求:[REQ-001](../../../requirement-workspace/requirements/REQ-001-hello-world-home-page.md)
影响分析:[impact-brief.md](../../../requirement-workspace/impact-brief.md)
细化契约:[deep-dive.md](../../../requirement-workspace/deep-dive.md)

## Goals / Non-Goals

**Goals:**

- 后端首次启动时自动创建 SQLite 数据库、`greeting` 表并种入一条 "Hello World"
- 提供 `GET /api/greeting`,返回 `200` + `{"message":"Hello World"}`
- 首页从同源 `/api/greeting` 取数并展示 `message`,前端不硬编码文案
- 保持实现最小,不引入额外框架或数据请求库

**Non-Goals:**

- 多语言、问候语管理 UI、用户账户与权限
- 接口失败 / 超时时的重试、降级与友好错误页
- 生产部署、CI/CD 与跨域方案(仅开发代理)

## Decisions

### 1. 使用嵌入式 SQLite 文件 + Flyway 管理 schema

- 数据源为本地文件,默认路径 `apps/server/data/pawtrip.db`,通过配置项可覆盖;数据库目录 `apps/server/data/` 加入 `.gitignore`(OQ-1 已确认)。
- `greeting` 表为最小两列:`id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`(OQ-3 已确认)。
- `V1__create_greeting.sql` 同时建表与插入种子,保证首次启动即可查询。
- 备选:内存数据库 H2(不符合“SQLite”约束)、外部数据库(不符合无独立服务的约束),均不采用。

### 2. 数据访问采用 Spring JDBC 最小方案

- 使用 Spring Boot JDBC 支持读取单条记录,不引入 JPA / Spring Data 的实体映射开销。
- 具体依赖坐标与版本(如 SQLite JDBC 驱动、Flyway 的 SQLite 支持模块)在实现前按官方文档核实并锁定;若 Flyway 需要单独的 SQLite 模块,一并引入。

### 3. 接口返回 JSON 对象

- `GET /api/greeting` 返回 `{"message":"Hello World"}`,字段名固定为 `message`。
- 不定义请求参数与分页;非 GET 方法由框架默认处理。
- 备选:纯文本响应更简单,但后续扩展字段需变更媒体类型,不采用。

### 4. 前端在客户端取数

- TanStack Start 默认进行服务端渲染;组件在服务端执行时,相对 URL `/api/greeting` 无法直接请求。
- 因此首页在客户端挂载后通过 `useEffect` 请求同源 `/api/greeting`,拿到 `message` 后再渲染文本。
- 备选:路由 loader 或 server function;前者仍需处理服务端绝对地址,后者会绕开既有 `/api` 代理契约,均不采用。
- 初始渲染到数据返回之间不承诺特定 UI;失败态不在本次范围(OQ-2 已确认非目标)。

### 5. 开发期使用 Vite 代理

- 在 `apps/web/vite.config.ts` 增加 `server.proxy`,把 `/api` 转发到 `http://localhost:8080`。
- 这样浏览器请求保持同源,后端无需配置 CORS;代理只用于开发环境。

### 6. 迁移与种子幂等

- 依赖 Flyway 的迁移历史表保证 V1 只执行一次。
- 验收应使用全新数据库文件;若本地已有旧文件,需先删除或通过新迁移演进,不在本 change 增加额外逻辑。
- 备选:应用启动时执行 `INSERT OR IGNORE` 或先查后插;会引入业务代码写种子的额外路径,且无法替代 schema 版本管理,不采用。

### 7. 测试采用后端接口集成测试

- 新增一个后端集成测试,使用临时 SQLite 数据库启动上下文,验证 `GET /api/greeting` 的状态码、`Content-Type` 与响应体;直接覆盖 R1 的兼容性风险。
- 前端不新增组件测试,首页行为由浏览器端到端验收覆盖(OQ-4 已确认)。
- 备选:仅依赖构建与手工验收(无法在 CI 中兜底兼容性回归)、前后端都加测试(超出最小范围),均不采用。

## Risks / Trade-offs

- [Spring Boot 4.1.2 与 SQLite/Flyway 兼容性未在本仓库验证] → 实现前查阅官方文档,锁定可用版本,并用后端测试或启动验证兜底。
- [SSR 期间相对 URL fetch 失败] → 采用客户端 `useEffect` 取数,代价是首屏文本稍晚出现。
- [开发代理不适用于生产] → 本次仅验收本地开发环境,生产方案另行设计。
- [种子只执行一次] → 验收使用干净数据库;重复验收需清理本地数据库文件。
- [无失败态 UI] → 后端不可用时页面无文本,属于已声明的非目标。
