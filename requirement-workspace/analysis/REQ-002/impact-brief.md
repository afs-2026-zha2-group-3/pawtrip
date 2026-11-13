# Impact brief — REQ-002 数据访问与前端请求规范化改造

- 生成日期:2026-11-13
- 上游需求:[REQ-002](../../requirements/REQ-002-data-access-orm-and-query.md)
- 细化契约:[deep-dive.md](deep-dive.md)
- 探索记录:无新增 explore;基于既有实现与选型研究

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-002 | 数据访问与前端请求规范化改造 | ready-for-split | `requirements/REQ-002-data-access-orm-and-query.md` |

阻塞开放问题:0;DoR BLOCKER:0。

## 2. As-is 资产清单(证据路径)

| 区域 | 路径 | 现状 | 是否受影响 |
|---|---|---|---|
| 知识库索引 | `docs/knowledge/_INDEX.md` | 占位索引,由脚本维护 | 否 |
| 架构知识 | `docs/knowledge/architecture/README.md` | 描述后端 `spring-boot-starter-flyway`、`JdbcTemplate` 与前端客户端 fetch | 是(需更新为 JPA 与 TanStack Query) |
| 外部依赖知识 | `docs/knowledge/external/README.md` | 记录 TanStack 与 shadcn 使用方式;无 JPA / Query 文档条目 | 是(建议补充官方来源) |
| 规则 | `docs/knowledge/rules/**` | spec-first、Java/React/TS 架构与测试规则 | 否(约束实现) |
| Living Spec | `openspec/specs/greeting/spec.md`、`openspec/specs/home-page/spec.md` | 描述问候语持久化/查询与首页展示契约 | 是(新增约定 capability;既有行为规格不变) |
| 归档 change | `openspec/changes/archive/2026-11-13-hello-world-greeting/` | REQ-001 的完整变更包与验收记录 | 否(仅作基线) |
| OpenSpec 配置 | `openspec/config.yaml` | `schema: spec-driven` | 否 |
| 后端构建 | `apps/server/pom.xml` | Spring Boot 4.1.2 / Java 21;webmvc、flyway、sqlite-jdbc | 是(新增 Spring Data JPA 与 Hibernate 社区方言) |
| 后端配置 | `apps/server/src/main/resources/application.yml` | SQLite 数据源 + Flyway | 是(新增 JPA 方言、`ddl-auto`、`open-in-view`) |
| 后端接口 | `apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java` | 直接使用 `JdbcTemplate` 查询 | 是(改为仓库) |
| 后端迁移 | `apps/server/src/main/resources/db/migration/V1__create_greeting.sql` | 建 `greeting` 表并种入 Hello World | 否 |
| 后端测试 | `apps/server/src/test/java/com/pawtrip/server/greeting/GreetingApiTest.java` | 使用临时 SQLite 文件验证接口 | 是(需确认 JPA 上下文下仍通过;不放宽断言) |
| 前端依赖 | `apps/web/package.json` | React 19 / TanStack Start / Tailwind 4;无 React Query | 是(新增 `@tanstack/react-query`、`@tanstack/react-router-ssr-query`) |
| 前端路由 | `apps/web/src/router.tsx` | 创建 router,无 QueryClient | 是(创建 QueryClient、context、SSR 集成) |
| 前端根路由 | `apps/web/src/routes/__root.tsx` | `createRootRoute` | 是(改为带 context 的 root route) |
| 前端首页 | `apps/web/src/routes/index.tsx` | `useEffect` + `fetch` 获取问候语 | 是(改为集中 query options + `useQuery`) |
| 前端开发代理 | `apps/web/vite.config.ts` | `/api` → `http://localhost:8080` | 否(保持) |
| 运行说明 | `README.md` | 启动顺序与数据库重置说明 | 否(启动方式不变) |
| OpenSpec change | `openspec/changes/refactor-data-access-and-query/` | 尚不存在 | 是(本次新建) |

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/server/pom.xml` | 无 JPA / Hibernate 方言依赖 | 增加 `spring-boot-starter-data-jpa` 与 `org.hibernate.orm:hibernate-community-dialects`;保留 sqlite-jdbc 与 Flyway |
| `application.yml` | 仅数据源与 Flyway | 增加 `spring.jpa.database-platform: org.hibernate.community.dialect.SQLiteDialect`、`ddl-auto: none`、`open-in-view: false` |
| 后端 Java 代码 | `GreetingController` 注入 `JdbcTemplate` 并手写 `SELECT` | 新增 `Greeting` 实体与 `GreetingRepository`;控制器改为依赖仓库,使用派生查询,无裸 SQL |
| `greeting` 表与迁移 | `id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`;V1 种子 | 不变 |
| 后端测试 | `GreetingApiTest` 使用临时 SQLite 文件 | 保持同一测试与断言;验证 JPA 启动与查询不回归 |
| `apps/web/package.json` | 无 React Query | 增加 `@tanstack/react-query`、`@tanstack/react-router-ssr-query` |
| `router.tsx` | 无 QueryClient | 在 `getRouter` 内创建 QueryClient,放入 router context,调用 `setupRouterSsrQueryIntegration` |
| `__root.tsx` | `createRootRoute` | 改为 `createRootRouteWithContext<{ queryClient: QueryClient }>` |
| `index.tsx` | `useEffect` + `fetch` + `useState` | 使用集中 `greetingQueryOptions` + `useQuery`;展示逻辑不变 |
| 新增前端文件 | 不存在 | `apps/web/src/queries/greeting.ts`:响应类型、fetch 函数、query options |
| Living Spec | 行为规格 | ADDED `backend-data-access`、`frontend-data-fetching` 两个约定 capability;既有 `greeting` / `home-page` 行为规格不变 |
| 架构知识 | 描述旧实现 | 更新为 Spring Data JPA / SQLite 方言 / TanStack Query,并记录约定 |
| `README.md` | 启动与重置说明 | 预计不变;若启动命令或环境要求变化再补充 |

## 4. Blast radius

- **apps/server**:数据访问方式、依赖、JPA 启动与实体映射;接口契约不变。
- **apps/web**:首页取数方式、QueryClient 生命周期与 SSR 集成;页面可见行为不变。
- **本地运行时**:SQLite 文件与 Flyway 不变;启动顺序不变;JPA 会增加启动期初始化。
- **不受影响**:认证、用户权限、多语言、外部系统、部署流水线、数据库 schema 与种子数据。

## 5. Artifact impact

- **Specs**:需要新 OpenSpec change;归档时合并 ADDED `backend-data-access`、`frontend-data-fetching`;既有 `greeting` / `home-page` 行为规格不变。
- **Tests**:后端沿用现有接口集成测试;前端暂无组件测试,以构建与浏览器验收覆盖。
- **Docs / KB**:更新 `docs/knowledge/architecture/README.md`;建议补充 `docs/knowledge/external/README.md` 的官方文档来源。
- **CI/CD**:仓库当前无流水线,不涉及。

## 6. Dual-track notes

- **OpenSpec**:一个 change 承载即可,建议 id `refactor-data-access-and-query`;ADDED `backend-data-access`、`frontend-data-fetching`;既有 `greeting`、`home-page` 行为规格不变。
- **Agile**:可拆为 2 个薄故事(后端 JPA 数据访问 → 前端 TanStack Query 取数),按依赖顺序交付;文档与验证随第二个故事完成。
- 需求保持后端无关表述;技术栈选择写入 Constraints。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| blocker | 无 | 无阻塞性未知依赖 |
| 风险 R1 | Hibernate SQLite 方言为社区模块,复杂查询/DDL 支持有限 | 保持派生查询与最小映射;schema 由 Flyway 管理;`ddl-auto=none`;接口集成测试兜底 |
| 风险 R2 | JPA 增加启动开销与实体生命周期复杂度 | 当前仅单表读取,影响可控;后续按需引入服务层 |
| 风险 R3 | `@tanstack/react-router-ssr-query` 与当前 Router 版本的 peer 兼容性 | 安装时验证 peer 依赖与构建;冲突时回退为手动 `QueryClientProvider` |
| 风险 R4 | SSR 期间相对 URL `/api/greeting` 请求失败 | 保持客户端 `useQuery`,不增加 loader 预取;后续如需 SSR 预取改用 server function |
| 风险 R5 | SQLite 写入并发与锁 | 本次只读;写入策略(WAL、连接池)列为非阻塞后续项 |
| 风险 R6 | 架构知识文档滞后 | 在本 change 中同步更新,归档前复核 |

## 8. Suggested split boundaries

- 建议 change id:`refactor-data-access-and-query`
- 工作切片(按依赖顺序):
  1. **T1 后端 JPA 数据访问**:依赖与配置、`Greeting` 实体、`GreetingRepository`、控制器替换、后端测试
  2. **T2 前端 TanStack Query**:依赖、QueryClient/router context/SSR 集成、query options、首页改造、前端构建
  3. **T3 文档与验收**:架构知识、外部依赖知识、Living Spec delta、端到端验收
- 边界原则:T1/T2 可并行但 T2 依赖 T1 的接口可用;T3 在 T1/T2 完成后收口。
