# ATDD design — refactor-data-access-and-query

- change-id:`refactor-data-access-and-query`
- phase:`p3`(`/sdd:atdd-design`)
- date:2026-11-13(+08:00)
- 上游:[specs/backend-data-access/spec.md](specs/backend-data-access/spec.md)、[specs/frontend-data-fetching/spec.md](specs/frontend-data-fetching/spec.md)、[g1-decision.md](g1-decision.md)、[design.md](design.md)
- 测试规则:`@rule:java-testing`、`@rule:react-testing`
- NFR:本次不纳入,见第 6 节

## 1. ATDD layers in scope

| # | Scenario | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| S1 | 使用 SQLite 方言启动并查询(`backend-data-access`) | API | 无 | WHEN/THEN 为单接口状态码与响应体,可在服务边界隔离 |
| S2 | 首页通过 Query 获取问候语(`frontend-data-fetching`) | E2E | 无 | THEN 断言页面可见文本与网络请求来源,必须经过浏览器与开发代理 |
| S3 | 首页不在 SSR loader 中请求相对 URL(`frontend-data-fetching`) | E2E | 无 | 需要观察 SSR 首屏与客户端挂载后的请求时序 |
| S4 | 新增服务端数据读取复用 Query(约定) | E2E + 代码检查 | 无 | 以首页为样本验证 `queryOptions` + `useQuery` 的复用方式 |
| S5 | 问候语不存在返回 404 Problem Details(`backend-error-handling`) | API | 无 | 单接口状态码、媒体类型与错误体可隔离验证 |
| S6 | 未捕获异常返回 500 且不暴露堆栈(`backend-error-handling`) | API | 无 | 全局异常处理可在服务边界验证 |
| S7 | 前端首次加载失败进入路由错误页(`frontend-api-request`) | E2E | 无 | 需要浏览器观察错误页与重试入口 |
| S8 | 后台刷新失败保留缓存数据(`frontend-api-request`) | E2E | 无 | 需要先成功加载再制造刷新失败,观察旧数据是否保留 |
| S9 | 未知路由展示 `notFoundComponent`(`frontend-api-request`) | E2E | 无 | 用户可见路由行为 |

**Deferred to `/sdd:atdd-apply` (unit-level TDD):** 后端错误码映射与 `ApiError` 解析可补单元测试;前端不新增组件测试框架,错误 UI 由 E2E 覆盖。

**Static / reverse checks:** “无 JdbcTemplate”“无手写 SQL”“无 `useEffect` + `fetch`”属于代码事实,列入第 5 节反向验证,以检索与代码评审为证据。

**Recommended extras:** 未触发 SSE/GraphQL、性能 SLA、鉴权、AI 质量或多浏览器兼容信号,不附加建议层。

## 2. What is written before production code

### 2.1 API 层(保持红绿基线)

现有 `GreetingApiTest` 已覆盖接口契约。本次改造前先运行一次,确认基线为绿;改造过程中保持同一测试与断言,不删除、不放宽。

| 检查 | 断言 |
|---|---|
| 状态码 | `GET /api/greeting` 返回 `200` |
| 响应头 | `Content-Type` 为 `application/json` |
| 响应体 | `$.message == "Hello World"` |
| 无 CORS 头 | 不出现 `Access-Control-Allow-Origin` |

- 使用 `@SpringBootTest` + `MockMvc` + 临时 SQLite 文件,不 mock 数据访问。
- 该测试同时证明 JPA 方言配置可启动、Flyway 种子可用、仓库查询返回预期文本。

### 2.2 E2E 层(可重复人工验收脚本)

仓库没有 E2E 运行器,本次不引入 Playwright/Cypress。E2E 以固定步骤执行:

| id | 步骤 | 期望可观察结果 |
|---|---|---|
| E2E-1 首页展示 | 启动后端与前端,访问 `http://localhost:3000/` | 页面展示 "Hello World" |
| E2E-2 请求来源 | 打开浏览器 Network 面板并刷新 | 存在 `/api/greeting` 请求,且页面无 `useEffect` fetch 造成的重复请求 |
| E2E-3 客户端取数边界 | 观察首屏与 hydration 后网络 | SSR 首屏不请求相对 URL;客户端挂载后由 TanStack Query 发起请求 |
| E2E-4 数据跟随 | 修改数据库 `message` 后刷新首页 | 页面展示新文本;验证后恢复干净数据库 |

- E2E-4 改库优先使用本机 `sqlite3`;不可用时以删除数据库文件并调整 V1 种子作为等价验证,不新增写接口。
- E2E 不接受仅查看源码判断文案来源,必须观察页面、接口与网络联动。

### 2.3 错误路径 API 测试

在生产代码前先补充错误路径测试:

| 检查 | 断言 |
|---|---|
| 问候语不存在 | `GET /api/greeting` 返回 `404` + `application/problem+json` + `code=GREETING_NOT_FOUND` |
| 未捕获异常 | 返回 `500` + `code=INTERNAL_ERROR`,响应体不含堆栈 |
| 成功响应 | 仍为 `{"message":"Hello World"}`,不套 envelope |

- 问候语不存在场景使用 `@WebMvcTest` + mock 仓库返回空;不修改开发库。
- 未捕获异常可用测试控制器或直接调用异常处理器验证。

### 2.4 错误路径 E2E

| id | 步骤 | 期望可观察结果 |
|---|---|---|
| E2E-5 首次加载失败 | 停止后端,刷新首页 | 显示路由错误页与重试入口,不显示空白成功态 |
| E2E-6 后台刷新失败 | 成功加载后停止后端,触发重新请求 | 页面保留已有问候语,控制台/日志记录错误,不进入阻断式错误页 |
| E2E-7 未知路由 | 访问不存在的路径 | 显示 `notFoundComponent`,不是默认裸 "Not Found" |

## 3. Local vs CI gate expectations

| 环境 | 门禁 | 说明 |
|---|---|---|
| 本地 | `cd apps/server && ./mvnw test` | 现有 `GreetingApiTest` 必须通过 |
| 本地 | 根目录 `npm run build` | 前端类型检查与构建通过 |
| 本地 | E2E-1 ~ E2E-4 | 按 2.2 步骤执行并记录结果 |
| 本地 | 错误路径 API 测试 | 按 2.3 断言 `404` / `500` Problem Details |
| 本地 | E2E-5 ~ E2E-7 | 按 2.4 步骤执行并记录结果 |
| 本地 | `openspec validate refactor-data-access-and-query` | Delta Spec 结构有效 |
| CI | N/A | 仓库当前无 CI/CD 流水线;本 change 不新建 CI 语义 |

- Java 测试遵循 `@rule:java-testing`;前端不新增组件测试,遵循 `@rule:react-testing` 的行为优先原则,由 E2E 覆盖。
- 本地验证结果由 P4 的 `/sdd:local-verify-report` 记录。

## 4. Data / fixtures strategy

| 层 | 数据来源 | 隔离与清理 | Owner |
|---|---|---|---|
| API | Flyway `V1__create_greeting.sql` + 临时 SQLite 文件 | 测试类使用 `target/greeting-api-test.db`,启动前删除,不复用开发库 | Dev |
| E2E | 开发库 `apps/server/data/pawtrip.db`,由 V1 种子生成 | 验收前删除文件复现冷启动;E2E-4 改动后删除并重启恢复;E2E-5/6 通过停止后端制造失败 | Dev(执行),QA(核对) |
| 错误路径 API | mock 仓库返回空或抛出异常 | `@WebMvcTest` 隔离,不写开发库 | Dev |

- 不新增第二套种子或测试数据;API 与 E2E 共用同一份迁移。
- 本次不改 Flyway 版本;现有数据库文件可直接复用。

## 5. Non-goals and reverse verification

| Non-goal / Out of scope | 反向验证 | Layer |
|---|---|---|
| 新增写接口 / 问候语管理 UI | 代码中不存在 `POST/PUT/DELETE /api/greeting` 映射,页面无编辑控件 | API + 代码检查 |
| 改变 `greeting` 表结构 / 迁移 / 种子 | `V1__create_greeting.sql` 未修改,Flyway 历史不变 | 代码检查 |
| 接口失败/超时的重试、降级与错误页 | 后端停止时页面不出现重试按钮或降级提示 | E2E |
| 使用 `JdbcTemplate` 或手写 SQL 查询 greeting | 生产代码检索不到 `JdbcTemplate` 与该表手写 SQL | 代码检查 |
| 使用 `useEffect` + `fetch` 管理请求 | `apps/web/src/routes/index.tsx` 中不存在 `useEffect` + `fetch` | 代码检查 |
| SSR loader 预取相对 URL | 首页无 loader 预取;Network 中相对 URL 请求发生在客户端挂载后 | E2E |
| 引入 Playwright / 前端单测框架 / CI 流水线 | 依赖与配置文件无新增测试运行器或 CI | 代码检查 |
| 成功响应套 envelope | `GET /api/greeting` 成功响应仍为 `{"message":"Hello World"}` | API |
| 引入 toast / traceId | 依赖与响应头中没有 toast 库或 traceId 字段 | 代码检查 |
| 新增写接口或业务校验 | 代码中无 `POST/PUT/DELETE` 映射;本次不引入 validation starter | 代码检查 |

**本 skill 自身非目标:** 不写业务实现、不产出完整 `tasks.md`、不设计 UT 套件、不引入 Playwright/POM/Excel 生成器、不新建 CI 产品。

## 6. NFR tests (optional)

- 结论:**不纳入**。
- 依据:REQ-002 只做实现层替换,无性能、可观测性或韧性验收标准;失败态与并发写入已列为非目标。
- 后续如引入 SLA、监控或写入并发要求,以新的 change 增补。

## 7. Handoff to `/sdd:task-plan`

- 任务必须同时链接 [design.md](design.md) 与本文件。
- 顺序遵循“运行现有 API 测试基线 → 后端 JPA 替换 → 前端 Query 接入 → E2E 与构建收尾”。
- 每个任务应能对应到 S1–S4 或第 5 节反向验证中的至少一项,不得引入 Delta Spec 之外的功能。
