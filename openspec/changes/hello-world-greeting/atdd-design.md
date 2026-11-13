# ATDD design — hello-world-greeting

- change-id:`hello-world-greeting`
- phase:`p3`(`/sdd:atdd-design`)
- date:2026-11-13(+08:00)
- 上游:[specs/greeting/spec.md](specs/greeting/spec.md)、[specs/home-page/spec.md](specs/home-page/spec.md)、[g1-decision.md](g1-decision.md)、[design.md](design.md)
- 测试规则:`@rule:java-testing`、`@rule:react-testing`
- NFR:本次不纳入(2026-11-13 与需求方确认),见第 6 节

## 1. ATDD layers in scope

本次只设计 **API** 与 **E2E** 两层验收检查;纯逻辑单元测试无适用对象,不展开 UT 套件。

| # | Scenario | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| S1 | 首次启动自动建库与种子(`greeting/spec.md`) | E2E | 无 | 观察点包含数据库文件与持久化数据,需要真实启动链路才能证明 |
| S2 | 查询问候语(`greeting/spec.md`) | API | 无 | WHEN/THEN 为单接口的状态码、响应头与响应体,可在服务边界隔离 |
| S3 | 访客打开首页(`home-page/spec.md`) | E2E | 无 | THEN 断言页面可见文本,必须经过浏览器与开发代理 |
| S4 | 展示内容跟随接口返回(`home-page/spec.md`) | E2E | 无 | 需要改动持久化数据后经接口到页面的完整路径 |
| S5 | 首页文案不硬编码(源自 S3 的 AND) | API + E2E | 无 | API 证明数据来源,E2E 证明页面随数据变化 |

**Deferred to `/sdd:atdd-apply` (unit-level TDD):** 无。当前实现只有一次查询与一次渲染,不存在值得单测的纯逻辑;OQ-4 已确认仅做后端接口集成测试。

**Recommended extras:** 需求未触发 SSE/GraphQL、性能 SLA、鉴权、AI 质量或跨浏览器兼容信号,不附加建议层。

## 2. What is written before production code

### 2.1 API 层(先红后绿)

在生产代码之前编写后端验收测试 `GreetingApiTest`(名称可在 apply 时调整,职责不变):

| 检查 | 断言 |
|---|---|
| 状态码 | `GET /api/greeting` 返回 `200` |
| 响应头 | `Content-Type` 为 `application/json` |
| 响应体 | `$.message == "Hello World"` |

- 使用 `@SpringBootTest` + `MockMvc` 启动真实上下文与真实 SQLite 临时库,不做 mock。
- 测试先以缺失实现的状态运行并失败,再实现迁移、数据读取与控制器使其转绿。
- 该测试是 S1 种子与 S2 接口的共同自动兜底:能返回种子文本即证明 V1 迁移已执行。

### 2.2 E2E 层(可重复人工验收脚本)

仓库当前没有 E2E 运行器,本次不引入 Playwright/Cypress。E2E 以固定步骤与可观察结果执行,步骤记录在任务与验收说明中:

| id | 步骤 | 期望可观察结果 |
|---|---|---|
| E2E-1 冷启动建库 | 删除 `apps/server/data/pawtrip.db`,启动后端 | 数据库文件被创建;`GET /api/greeting` 返回 `{"message":"Hello World"}`(证明表与种子存在) |
| E2E-2 首页展示 | 启动前端,访问 `http://localhost:3000/` | 页面可见文本 "Hello World",且开发者工具网络面板存在同源 `/api/greeting` 请求 |
| E2E-3 内容跟随数据 | 将数据库 `message` 改为 "Hello PawTrip" 后刷新首页 | 页面展示 "Hello PawTrip";恢复时删除数据库文件并重启后端 |

- E2E-3 的改库操作优先使用本机 `sqlite3`;若环境没有该命令,则以“删除数据库文件并调整 V1 种子”作为等价验证,不在应用代码中新增写入接口。
- E2E 不接受仅查看源码判断文案来源;必须观察到页面与接口的联动。

## 3. Local vs CI gate expectations

| 环境 | 门禁 | 说明 |
|---|---|---|
| 本地 | `cd apps/server && ./mvnw test` | 必须包含 2.1 的 API 验收测试并通过 |
| 本地 | `npm run build`(仓库根目录) | 前端类型检查与构建通过 |
| 本地 | E2E-1 ~ E2E-3 | 按 2.2 步骤人工执行并记录结果 |
| CI | N/A | 仓库当前无 CI/CD 流水线(README 已声明);本 change 不新建 CI 语义,避免与后续流水线设计冲突 |

- Java 测试遵循 `@rule:java-testing`(JUnit 5、AssertJ);本次不新增前端组件测试,遵循 `@rule:react-testing` 的“行为优先”原则,由 E2E 覆盖页面行为。
- 本地验证结果由 P4 的 `/sdd:local-verify-report` 记录。

## 4. Data / fixtures strategy

| 层 | 数据来源 | 隔离与清理 | Owner |
|---|---|---|---|
| API | Flyway `V1__create_greeting.sql` 在测试临时 SQLite 文件中建表并种入 "Hello World" | 每个测试类使用独立临时目录/文件,测试结束删除;不复用开发库 | Dev |
| E2E | 开发库 `apps/server/data/pawtrip.db`,由 V1 种子生成 | 每次验收前删除文件以复现冷启动;E2E-3 改动后同样删除并重启恢复 | Dev(执行),QA(核对) |

- 不新增第二套种子数据文件;API 与 E2E 共用同一份迁移,保证验收对象一致。
- E2E 的“修改数据”步骤只用于验证展示随数据变化,验证后必须恢复干净数据库,避免污染后续验收。

## 5. Non-goals and reverse verification

| Non-goal / Out of scope | 反向验证 | Layer |
|---|---|---|
| 多语言支持 | 首页不存在语言切换控件,且只展示接口返回的单一文本 | E2E |
| 问候语管理 UI | 首页不存在编辑、保存或管理问候语的控件 | E2E |
| 用户账户与权限 | 不带任何凭证请求 `GET /api/greeting` 仍返回 `200`,系统无登录门槛 | API |
| 接口失败/超时的重试、降级与友好错误页 | 后端停止时页面不出现重试按钮或降级提示,仅无问候文本;不将其视为缺陷 | E2E |
| 生产部署、CI/CD、跨域方案 | 后端响应不添加 CORS 头;浏览器经 Vite 同源代理访问 `/api` | API + E2E |
| 单元测试套件 | 不新增 UT 套件;验收由 API 集成测试与 E2E 脚本覆盖 | N/A |

**本 skill 自身非目标:** 不写业务实现、不产出完整 `tasks.md`、不设计 UT 套件、不引入 Playwright/POM/Excel 生成器、不新建 CI 产品。

## 6. NFR tests (optional)

- 结论:**不纳入**。
- 依据:2026-11-13 与需求方确认;REQ-001 定位为最小链路验证,无性能、可观测性或韧性验收标准。
- 后续如引入 SLA 或监控要求,以新的 change 增补,不在本次 ATDD 范围内。

## 7. Handoff to `/sdd:task-plan`

- 任务必须同时链接 [design.md](design.md) 与本文件。
- 任务顺序遵循“先写 API 验收测试(红)→ 实现迁移/查询/接口(绿)→ 前端展示 → E2E 与构建收尾”。
- 每个任务应能对应到 S1–S5 或第 5 节反向验证中的至少一项,不得引入 Delta Spec 之外的功能。
