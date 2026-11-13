# ATDD design — add-user-login

- change-id:`add-user-login`
- phase:`p3`(`/sdd:atdd-design`)
- date:2026-11-14(+08:00)
- 上游:[specs/backend-authentication/spec.md](specs/backend-authentication/spec.md)、[specs/frontend-authentication/spec.md](specs/frontend-authentication/spec.md)、[specs/backend-error-handling/spec.md](specs/backend-error-handling/spec.md)、[specs/frontend-api-request/spec.md](specs/frontend-api-request/spec.md)、[specs/greeting/spec.md](specs/greeting/spec.md)、[specs/home-page/spec.md](specs/home-page/spec.md)
- 设计:[design.md](design.md)
- 测试规则:`@rule:java-testing`、`@rule:react-testing`
- NFR:本次不纳入,见第 6 节

## 1. ATDD layers in scope

| # | Scenario | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| B1 | 首次启动创建 `app_user` 表;运行种子脚本注入账号(`backend-authentication`) | API + DB | 无 | 启动后查询临时 SQLite 确认表为空;执行 `scripts/seed-users.mjs` 后验证账号、唯一用户名与 BCrypt 哈希 |
| B2 | 正确凭据登录并建立会话(`backend-authentication`) | API | 会话 cookie 检查 | 需要观察状态码、响应体、session 与后续受保护请求 |
| B3 | 错误凭据登录(`backend-authentication`) | API | 敏感信息检查 | 需要断言 401、错误码、无会话、响应不含密码 |
| B4 | 未认证访问业务接口(`backend-authentication`/`backend-error-handling`) | API | 无 | 断言 401 Problem Details,确保不是 302/HTML |
| B5 | 已认证访问问候语(`greeting`) | API | 无 | 断言原 `200 {"message":"Hello World"}` 契约不变 |
| B6 | 当前用户查询(`backend-authentication`) | API | 无 | 断言已登录/未登录两种状态 |
| B7 | 登出与会话失效(`backend-authentication`) | API | 无 | 需要登录后登出,再用旧会话请求业务接口 |
| B8 | CSRF 校验(`backend-authentication`/`backend-error-handling`) | API | 无 | 需要分别发送带/不带 `X-XSRF-TOKEN` 的 POST |
| B9 | 会话固定保护(`backend-authentication`) | API | 会话 ID 检查 | 登录前后会话 ID 必须不同 |
| B10 | 会话 cookie 属性(`backend-authentication`) | API(embedded server) | 无 | `HttpOnly`/`SameSite` 属于容器响应头,需要真实 HTTP 响应 |
| F1 | 未登录直接访问/刷新页面跳转(`frontend-authentication`/`home-page`) | E2E | 无 | 必须通过浏览器观察地址栏与页面内容 |
| F2 | 登录成功跳首页(`frontend-authentication`) | E2E | Network 检查 | 观察登录请求、`X-XSRF-TOKEN` 与跳转 |
| F3 | 登录失败提示(`frontend-authentication`) | E2E | 无 | 观察页面停留与通用提示 |
| F4 | 顶部导航登出(`frontend-authentication`) | E2E | Network 检查 | 观察登出请求、跳转与按钮消失 |
| F5 | 会话过期后 401 失效(`frontend-api-request`/`frontend-authentication`) | E2E | 无 | 需要先登录再使会话失效,观察自动跳转 |
| F6 | 已登录访问 `/login`(`frontend-authentication`) | E2E | 无 | 观察重定向到 `/` |
| F7 | 已登录刷新首页(`home-page`) | E2E | 无 | 观察会话保持与问候语展示 |

**Deferred to `/sdd:atdd-apply` (unit-level TDD):** 安全错误写入器的字段映射、`ApiError` 安全错误码解析可补单元测试;前端不新增组件测试框架,由 E2E 覆盖。

**Static / reverse checks:** “无 JWT/localStorage”“无明文密码”“无 302/HTML 401”“`greeting` 表未变”属于代码/配置事实,列入第 5 节反向验证。

**Recommended extras:** 本次涉及认证,额外附加“敏感信息不泄露”与“会话 cookie 属性”检查;不附加性能 SLA、多浏览器或无障碍专项。

## 2. What is written before production code

### 2.1 API 层:测试基线与认证辅助

现有 `GreetingApiTest` 先运行一次确认当前为绿(未认证可访问)。改造前先新增认证测试辅助:

- 使用 `@SpringBootTest` + `MockMvc` + 临时 SQLite 文件 `target/auth-api-test.db`,启动前删除
- 通过 `AppUserRepository` + `PasswordEncoder` 插入测试用户;密码在测试运行时随机生成,不硬编码
- 使用 `spring-security-test` 的 `csrf()` post-processor 为需要 CSRF 的 POST 添加 token
- 通过真实 `POST /api/auth/login` 获取会话,再用于受保护请求;不使用 `@WithMockUser` 代替登录/登出链路
- 需要真实 `Set-Cookie`/会话 ID 的断言使用 `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` 或 `WebTestClient`

### 2.2 先写的 API 断言

| 检查 | 断言 |
|---|---|
| 未认证业务接口 | `GET /api/greeting` → `401`、`application/problem+json`、`code=UNAUTHENTICATED`、`instance=/api/greeting`;无问候语 |
| 正确登录 | `POST /api/auth/login`(表单 + CSRF)→ `200`、用户名、会话;随后 `GET /api/greeting` → `200 {"message":"Hello World"}` |
| 错误登录 | 错误密码/不存在用户 → `401`、`code=INVALID_CREDENTIALS`、无会话;两者响应 `detail` 一致 |
| 当前用户 | 已登录 `GET /api/auth/me` → `200` 用户名;未登录 → `401 UNAUTHENTICATED` |
| 登出 | 登录后 `POST /api/auth/logout` + CSRF → `204`;旧会话 `GET /api/greeting` → `401` |
| CSRF 缺失 | `POST /api/auth/logout` 无 `X-XSRF-TOKEN` → `403`、`code=ACCESS_DENIED`;登出未执行 |
| CSRF 有效 | 携带 token → 通过 CSRF 校验 |
| 会话固定 | 登录前后 `JSESSIONID` 不同;旧 ID 访问业务接口 → `401` |
| cookie 属性 | 登录响应 `Set-Cookie: JSESSIONID=...; HttpOnly; SameSite=Lax` |
| 种子账号 | 迁移后 `app_user` 为空;运行脚本后存在启用账号;`password_hash` 以 BCrypt 前缀开头且不等于明文;重复运行不产生重复记录 |

- 认证测试与 `GreetingApiTest` 使用独立的临时数据库,避免测试间污染。
- 不删除、不放宽既有成功路径断言;只增加认证前置。

### 2.3 E2E 层(可重复人工验收脚本)

仓库没有 E2E 运行器,本次不引入 Playwright/Cypress。E2E 以固定步骤执行:

| id | 步骤 | 期望可观察结果 |
|---|---|---|
| E2E-1 未登录拦截 | 清除 cookie 后访问 `http://localhost:3000/`、`/about`,并刷新 | 地址变为 `/login`,不显示问候语/About 内容 |
| E2E-2 登录成功 | 先运行 `npm run seed:users`,再在 `/login` 输入脚本定义的账号,提交 | 跳转 `/`,显示 "Hello World";Network 中登录请求含 `X-XSRF-TOKEN`,响应含 `JSESSIONID` |
| E2E-3 已登录刷新 | 在 `/` 刷新 | 保持登录并显示问候语,不跳 `/login` |
| E2E-4 登出 | 点击顶部“退出登录” | 跳转 `/login`;按钮消失;后退访问 `/` 再次被拦截 |
| E2E-5 错误登录 | 在 `/login` 输入错误密码 | 停留 `/login`,显示通用失败提示;Network 返回 `401 INVALID_CREDENTIALS` |
| E2E-6 会话过期 | 登录后删除服务端会话(重启后端或等待/使会话失效),刷新首页 | 业务请求 `401`,前端清理缓存并跳 `/login`,不显示旧问候语 |
| E2E-7 直接 API | 使用 curl/浏览器无 cookie 请求 `/api/greeting`;已登录 cookie 再请求 | 无 cookie → `401 application/problem+json`;有 cookie → `200 {"message":"Hello World"}` |
| E2E-8 已登录访问登录页 | 已登录时访问 `/login` | 跳转 `/` |

- E2E 不接受仅查看源码判断行为,必须观察页面、Network、cookie 与响应体。
- 种子账号由 `scripts/seed-users.mjs` 定义,脚本仅用于本地/测试环境;迁移、生产代码与文档不写明文密码。

### 2.4 安全路径测试

| 检查 | 断言 |
|---|---|
| 敏感信息 | 登录失败响应/日志不含密码、哈希、堆栈;不存在用户与错误密码的 `detail` 一致 |
| 未认证 `401` 形态 | 不返回 HTML、不返回 `302`、不设置 `Location` |
| CSRF 失败 | `403 application/problem+json` + `ACCESS_DENIED`;无状态变更 |
| 会话 cookie | `HttpOnly`;`SameSite=Lax`;前端 JS 不可读 |
| 无令牌存储 | 生产代码检索不到 JWT、`localStorage`/`sessionStorage` 认证存储或 `Authorization` 手工设置 |

## 3. Local vs CI gate expectations

| 环境 | 门禁 | 说明 |
|---|---|---|
| 本地 | `cd apps/server && ./mvnw test` | 现有测试更新后必须全部通过;新增认证/CSRF/登出/会话测试 |
| 本地 | 根目录 `npm run build` | 前端类型检查与构建通过 |
| 本地 | 人工 E2E-1 ~ E2E-8 | 按 2.3 步骤执行并记录结果 |
| 本地 | `openspec validate add-user-login --strict` | Delta Spec 结构有效 |
| CI | `server.yml` 的 `./mvnw -B test` | 命令不变;测试通过即可 |
| CI | `web.yml` 的 `npm ci && npm run build` | 命令不变;构建通过即可 |

- 不新增 CI 工作流或门禁命令;若实现中发现必须新增,先更新 `docs/feedback/verification-commands.md` 与 `@rule:pipeline-iac`。
- 本地验证结果由 P4 的 `/sdd:local-verify-report` 记录。

## 4. Data / fixtures strategy

| 层 | 数据来源 | 隔离与清理 | Owner |
|---|---|---|---|
| API | Flyway V1 + V2,临时 SQLite 文件 | 测试类使用 `target/auth-api-test.db`,启动前删除;不复用开发库 | Dev |
| API 测试用户 | `AppUserRepository` + `BCryptPasswordEncoder` | 每个测试类/方法插入唯一用户名;密码运行时随机生成 | Dev |
| E2E | 开发库 `apps/server/data/pawtrip.db` + `npm run seed:users` | 验收前删除数据库文件并重启以复现冷启动;迁移后运行种子脚本注入账号 | Dev(执行),QA(核对) |
| CSRF | MockMvc `csrf()` post-processor / 真实浏览器 cookie | 缺失 token 测试显式省略;不 mock 掉安全过滤器 | Dev |

- API 测试自行创建随机密码用户;E2E 使用同一份种子脚本,不引入第二套测试数据文件。
- 迁移、生产代码与文档不含明文密码;种子脚本仅保存本地测试凭据。

## 5. Non-goals and reverse verification

| Non-goal / Out of scope | 反向验证 | Layer |
|---|---|---|
| 注册、找回密码、用户管理 UI | 路由与代码中无注册/用户管理页面或接口 | 代码检查 |
| 角色/资源级授权 | 安全配置仅区分 authenticated/anonymous,无角色规则 | 代码检查 |
| 记住我、OAuth2/SSO、MFA | 依赖与配置中无对应 starter/DSL | 代码检查 |
| JWT 或前端存储认证令牌 | 生产代码无 `localStorage`/`sessionStorage` 认证读写、无 JWT 库、无手工 `Authorization` | 代码检查 |
| 明文密码入库/入迁移/入文档 | 迁移、生产代码与文档无明文密码;数据库仅存 BCrypt 哈希;种子脚本仅用于本地测试 | 代码检查 + DB 查询 |
| API 未认证返回 HTML/302 | 无 cookie 请求返回 `401 application/problem+json`,无 `Location` | API |
| 修改 `greeting` 表或已登录成功响应 | V1 迁移未改;已登录 `GET /api/greeting` 仍为 `{"message":"Hello World"}` | API + 代码检查 |
| 登录限流/失败锁定 | 本次无速率限制代码;已在设计/交付说明记录安全例外 | 代码检查 |
| 前端自动化测试框架/E2E 运行器 | 依赖与配置中无 Playwright/Cypress/Vitest 新增 | 代码检查 |
| 多实例会话/Spring Session | 无 Spring Session 依赖或表 | 代码检查 |

**本 skill 自身非目标:** 不写业务实现、不产出完整 `tasks.md`、不设计 UT 套件、不引入 Playwright/POM/Excel 生成器、不新建 CI 产品。

## 6. NFR tests (optional)

- 结论:**不纳入**。
- 依据:REQ-003 验收集中在认证、会话、CSRF、错误契约与页面引导;无性能、并发登录、可用性或可观测性 SLA。
- 后续如引入登录限流、会话并发上限、审计或性能要求,以新的 change 增补。

## 7. Handoff to `/sdd:task-plan`

- 任务必须同时链接 [design.md](design.md) 与本文件。
- 顺序遵循“后端认证测试基线 → 账号/安全配置 → 认证接口 → 业务接口保护与测试 → 前端请求层 → 登录/守卫/登出 → E2E 与文档”。
- 每个任务应能对应到 B1–B10、F1–F7 或第 5 节反向验证中的至少一项,不得引入 Delta Spec 之外的功能。
