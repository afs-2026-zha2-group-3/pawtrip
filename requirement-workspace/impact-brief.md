# Impact brief — REQ-001 Hello World 首页全链路

- 生成日期:2026-11-13
- 上游需求:[requirements/REQ-001-hello-world-home-page.md](requirements/REQ-001-hello-world-home-page.md)
- 探索记录:[exploration/20261113-203130-service-blueprint.md](exploration/20261113-203130-service-blueprint.md)

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-001 | Hello World 首页全链路 | ready-for-split | `requirements/REQ-001-hello-world-home-page.md` |

阻塞开放问题:0;DoR BLOCKER:0(非阻塞 OQ 与 WARNING 已标 `deferred`)。

## 2. As-is 资产清单(证据路径)

| 区域 | 路径 | 现状 | 是否受影响 |
|---|---|---|---|
| 知识库索引 | `docs/knowledge/_INDEX.md` | 占位索引,由脚本维护 | 间接(新增后端 DB/接口知识) |
| 架构知识 | `docs/knowledge/architecture/README.md` | 仅到技术栈与 8080 端口,内容不完整 | 是(需补充数据库、接口、运行拓扑) |
| 领域/接口/运维知识 | `docs/knowledge/domain/README.md`、`interfaces/README.md`、`operations/README.md` | 占位说明,无具体契约 | 是(接口契约需落在这里) |
| 外部依赖知识 | `docs/knowledge/external/README.md` | 记录 TanStack 与 shadcn 使用方式;无后端数据库条目 | 是(需补 SQLite/Flyway 用法来源) |
| 规则 | `docs/knowledge/rules/**` | 含 spec-first、Java/React/TS 架构与测试规则 | 约束实现,不修改 |
| Living Spec | `openspec/specs/` | 仅 `.gitkeep`,无既有能力 | 是(本次为首个 change) |
| 归档 change | `openspec/changes/archive/` | 仅 `.gitkeep` | 否 |
| OpenSpec 配置 | `openspec/config.yaml` | `schema: spec-driven`,无自定义规则 | 否 |
| 后端构建 | `apps/server/pom.xml` | Spring Boot 4.1.2 / Java 21,仅 webmvc + test | 是(需数据库与迁移依赖) |
| 后端配置 | `apps/server/src/main/resources/application.yml` | 应用名 + 8080 端口 | 是(数据源与 Flyway) |
| 后端代码 | `apps/server/src/main/java/com/pawtrip/server/ServerApplication.java` | 仅启动类 | 是(新增接口与数据访问) |
| 后端测试 | `apps/server/src/test/java/com/pawtrip/server/ServerApplicationTests.java` | 仅上下文加载 | 是(可选新增接口测试) |
| 前端路由 | `apps/web/src/routes/index.tsx` | TanStack 模板营销页 | 是(替换为最小问候页) |
| 前端根布局 | `apps/web/src/routes/__root.tsx`、`components/Header|Footer.tsx` | 通用布局与主题脚本 | 否(保持) |
| 前端构建 | `apps/web/vite.config.ts` | 无 proxy / server 配置 | 是(新增 `/api` 代理) |
| 前端依赖 | `apps/web/package.json` | React 19 / TanStack Start / Tailwind 4 | 否(无需新增依赖) |
| 运行说明 | `README.md` | 含 `npm run dev` 与 `mvnw spring-boot:run` | 是(可补充数据库文件与启动顺序说明) |

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/server/pom.xml` | 仅 webmvc 与测试依赖 | 增加 SQLite JDBC 驱动、JDBC 访问支持与 Flyway;版本以官方文档核实后确定 |
| `application.yml` | 应用名、端口 8080 | 增加 SQLite 数据源(文件路径)、驱动配置与 Flyway 迁移位置 |
| 后端 Java 代码 | 仅 `ServerApplication` | 新增 `GET /api/greeting` 控制器与 greeting 读取逻辑;按 `@rule:layer-boundaries` 放置包结构 |
| 数据库迁移资源 | 不存在 | 新增 `db/migration/V1__create_greeting.sql`:建 `greeting` 表并插入 "Hello World" |
| `apps/web/vite.config.ts` | 无 server 配置 | 增加开发代理:`/api` → `http://localhost:8080` |
| `apps/web/src/routes/index.tsx` | 模板营销内容 | 替换为最小页,加载后展示接口返回的 `message` |
| `openspec/specs/` | 空 | 本次 change 归档后新增 greeting 相关 capability spec(基线缺口,非本次直接写入) |
| `docs/knowledge/architecture/README.md` | 缺少数据库/接口说明 | 实现后补充 SQLite、Flyway、接口与运行拓扑 |
| `README.md` | 启动命令 | 可补充数据库文件位置、启动顺序与验收命令 |
| 后端测试 | 仅上下文加载 | OQ-4 暂缓;若采纳,新增接口集成测试(临时 SQLite) |

## 4. Blast radius

- **apps/web**:首页路由行为改变;新增开发代理配置;SSR 与客户端取数的执行位置需处理。
- **apps/server**:新增 Web 接口、数据库访问与启动期迁移;启动失败面增加(数据源/迁移错误)。
- **本地运行时**:新增嵌入式 SQLite 文件与迁移状态表;开发者需注意文件清理与启动顺序。
- **不受影响**:认证、用户权限、多语言、外部系统、部署流水线(均为非目标或当前不存在)。

## 5. Artifact impact

- **Specs**:需要新的 OpenSpec change 包;归档后为 greeting 能力建立首个 Living Spec。
- **Tests**:后端接口测试为可选(OQ-4);前端测试未定义。
- **Docs / KB**:架构知识库需补数据库与接口;README 可补运行说明;`docs/knowledge/external` 需补 SQLite/Flyway 文档来源。
- **CI/CD**:无(仓库当前无流水线)。

## 6. Dual-track notes

- **OpenSpec**:一个 change 即可承载(ADDED `greeting-store`、`greeting-api`;MODIFIED `web-home`、`web-dev-proxy`)。
- **Agile**:可拆为 3 个薄故事(持久化与种子 → 接口 → 首页展示与代理),按垂直切片顺序交付;建议在 `/sdd:story-split` 时再定。
- 需求保持后端无关表述,当前技术栈写入 Constraints,不写进 statement。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| blocker | 无 | 无阻塞性未知依赖 |
| 基线缺口 | Living Spec 为空 | 首个 change;归档后建立 spec,已在需求中记录 |
| 风险 R1 | Spring Boot 4.1.2 与 SQLite / Flyway 兼容性 | 需在实现前按 `AGENTS.md` 要求查阅官方文档,确认驱动、方言与 Flyway 模块;可能需要显式 DataSource 配置 |
| 风险 R2 | TanStack Start SSR 期间相对 URL fetch | 组件在服务端渲染时 `fetch('/api/greeting')` 可能失败;建议客户端 `useEffect` 取数或使用服务端可用的绝对地址,需在设计中明确 |
| 风险 R3 | 开发代理仅存在于开发环境 | 生产部署不在本次范围;验收以本地开发环境为准 |
| 风险 R4 | 启动顺序与失败态 | 后端未启动时首页无法取数;本次按非目标处理(OQ-2 deferred) |
| 风险 R5 | 种子幂等性 | Flyway 迁移只执行一次;若数据库文件已存在旧数据,验收需使用全新数据库或新增迁移版本 |
| 风险 R6 | KB 架构文档不完整 | W1 deferred;实现完成后补充,避免后续 change 依赖过时基线 |

## 8. Suggested split boundaries

- 建议 change id:`hello-world-greeting`
- 工作切片(按依赖顺序):
  1. **T1 持久化与种子**:SQLite 数据源 + Flyway V1 建表与种子
  2. **T2 接口**:`GET /api/greeting` 返回 `{"message":"Hello World"}`
  3. **T3 首页与代理**:开发代理 + 首页最小页取数与展示
  4. **T4(可选)**:后端接口测试、README 与架构知识库补充
- 边界原则:T1/T2 属后端能力,T3 属前端能力;T4 可与 T3 并行,但需在归档前完成文档补充。
