# Alignment self-check — add-user-login

- change-id:`add-user-login`
- phase:`p3`(`/sdd:task-plan`);P4 实现验证见第 7 节
- date:2026-11-14(+08:00)
- 范围:Delta Spec ↔ [design.md](design.md) ↔ [tasks.md](tasks.md) ↔ [atdd-design.md](atdd-design.md)
- 结构校验:`openspec validate add-user-login --strict` → valid

## Verdict

**Pass** — 无静默扩范围、无规格缺口;3 项说明性记录(文档任务、人工 E2E、登录限流例外)不构成能力扩张。

## 1. Delta Spec → Design

| Requirement / Scenario | Design 决策 | 覆盖 | 说明 |
|---|---|---|---|
| 账号持久化与密码存储 / 种子账号 | D3、D4 | Pass | `app_user`、JPA、BCrypt、V2 迁移与哈希约束已决定 |
| 服务端会话登录 / 正确与错误凭据 / 会话固定 | D1、D2、D8 | Pass | HttpSession、formLogin、JSON handler、`changeSessionId` 已决定 |
| 当前用户查询 | D5、D7、D9 | Pass | `/api/auth/me` 放行 + 未认证 `UnauthenticatedException` |
| 业务接口保护 | D5、D7 | Pass | `/api/**` authenticated;安全过滤器 401 JSON |
| 登出 | D7、D8 | Pass | LogoutFilter、204、会话失效与 request cache 关闭 |
| CSRF 保护 | D6、D12 | Pass | `csrf.spa()`、cookie/header、登录/登出 token 处理 |
| 会话安全与会话 cookie | D1、D8 | Pass | 30 分钟、HttpOnly、SameSite、服务端存储 |
| 认证错误日志与敏感信息 | D7 | Pass | 统一失败文案、Problem Details、无敏感字段 |
| 登录页面 | D10、D11 | Pass | `/login`、表单编码、成功/失败行为 |
| 未登录路由守卫 | D10 | Pass | pathless `_authenticated` 布局 + 客户端认证门 |
| 认证状态查询与缓存 | D11、D13 | Pass | auth query、缓存失效、401 不作为错误页 |
| 顶部导航登出 | D11 | Pass | Header 读取 auth query;仅已登录显示;登出清缓存 |
| 全局 401 认证失效 | D13 | Pass | QueryCache 清理受保护缓存并使 auth 失效 |
| 安全层错误统一 Problem Details | D7 | Pass | 共享写入器与 3 个错误码 |
| 认证错误不泄露敏感信息 | D7 | Pass | 通用 `detail`,日志不含密码/哈希/会话 ID |
| 请求携带同源会话凭据 | D12 | Pass | `credentials: same-origin`;无前端令牌 |
| 非安全方法携带 CSRF token | D6、D12 | Pass | 读取 `XSRF-TOKEN`;缺失时先触发 `me` 再重试一次 |
| 401 触发认证失效 | D13 | Pass | QueryCache 全局回调;登录 mutation 本地处理 |
| 已认证查询问候语 | D5、D7 | Pass | 授权前置;成功响应不变 |
| 已登录首页展示 / 未登录跳转 | D10 | Pass | 认证门在渲染 `<Outlet/>` 前决策 |
| Non-Goals(注册、角色、记住我、多实例、限流、生产 TLS、SSR 预取) | Non-Goals、D8、D10、D15 | Pass | 均显式排除;限流为例外 |

## 2. Design → Tasks

| Design 决策 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| D1 服务端会话 | 1.2、3.2、3.3、3.8 | Pass | 会话配置、认证规则与 cookie 验证 |
| D2 formLogin + JSON handlers | 3.1、3.4 | Pass | 登录处理 URL、成功/失败响应 |
| D3 数据库账号 + UserDetailsService | 2.1–2.4 | Pass | 实体、仓库、UserDetails、编码器 |
| D4 `app_user` 表与哈希种子 | 1.3、1.4、4.5 | Pass | 迁移、启动验证、测试用户 |
| D5 授权规则 | 3.2 | Pass | 公开认证端点、业务接口保护、默认拒绝 |
| D6 CSRF SPA | 3.1、5.3 | Pass | 后端 `csrf.spa()`;前端 `X-XSRF-TOKEN` |
| D7 安全层 Problem Details | 3.5–3.7 | Pass | 写入器、entry point、access denied、me |
| D8 会话固定/超时/无 request cache | 1.2、3.3、3.8 | Pass | 配置与验证 |
| D9 `auth` 包结构 | 2.1–3.7 | Pass | 代码落点明确 |
| D10 前端认证门 | 6.1–6.3 | Pass | auth query、登录页、受保护布局 |
| D11 登录/登出 Query 交互 | 6.1–6.4 | Pass | 登录写入缓存、Header 登出、跳转 |
| D12 请求层凭据/CSRF/表单 | 5.1–5.4 | Pass | 请求层改造逐项落地 |
| D13 全局 401 失效 | 6.5 | Pass | QueryCache 回调 |
| D14 测试策略 | 4.1–4.6、7.1–7.7 | Pass | API 测试 + 人工 E2E |
| D15 登录限流例外 | 7.7、8.3 | Pass | 安全复核与交付说明记录 |

## 3. Delta Spec → ATDD Design

| Scenario | ATDD 层 | 检查 | 覆盖 |
|---|---|---|---|
| 种子账号与 BCrypt 哈希 | API + DB | B1 | Pass |
| 正确凭据登录 | API | B2 | Pass |
| 错误凭据登录 | API | B3 | Pass |
| 未认证业务接口 | API | B4 | Pass |
| 已认证问候语 | API | B5 | Pass |
| 当前用户查询 | API | B6 | Pass |
| 登出与会话失效 | API | B7 | Pass |
| CSRF 校验 | API | B8 | Pass |
| 会话固定 | API | B9 | Pass |
| 会话 cookie 属性 | API(embedded server) | B10 | Pass |
| 未登录直接访问/刷新 | E2E | F1 | Pass |
| 登录成功跳首页 | E2E | F2 | Pass |
| 登录失败提示 | E2E | F3 | Pass |
| 顶部导航登出 | E2E | F4 | Pass |
| 会话过期 401 | E2E | F5 | Pass |
| 已登录访问 `/login` | E2E | F6 | Pass |
| 已登录刷新首页 | E2E | F7 | Pass |
| Non-Goals | 反向验证 | atdd-design 第 5 节 | Pass |

## 4. ATDD → Tasks

| ATDD 约束 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| 现有 API 测试先建立绿基线 | 4.1 | Pass | 先运行再改造 |
| 认证测试辅助与运行时密码 | 4.5 | Pass | 不硬编码密码 |
| 未认证/登录/登出/CSRF/会话固定断言 | 4.1–4.4 | Pass | API 层覆盖 |
| 真实 cookie 属性断言 | 4.6、7.3 | Pass | embedded server / 手工 curl |
| E2E-1 ~ E2E-8 | 7.1–7.5 | Pass | 页面、Network、cookie |
| 反向验证 | 7.6–7.7 | Pass | JWT/localStorage/明文/结构/限流例外 |
| fixtures:临时库隔离、开发库冷启动 | 4.5、7.3 | Pass | 不新增第二套种子 |
| 不引入 Playwright/前端单测/CI | 6.7、7.1、atdd 第 3/5 节 | Pass | 任务未新增测试框架或流水线 |
| 文档与 G1 复核 | 8.1–8.5 | Pass | 知识库、自检、验证 |

## 5. Scope creep check

| 潜在扩张点 | 结论 | 依据 |
|---|---|---|
| 注册/找回密码/用户管理 | 无 | 非目标;tasks 未包含 |
| 角色/资源级授权/多租户 | 无 | 非目标;仅 authenticated/anonymous |
| 记住我/OAuth2/SSO/MFA | 无 | 非目标;Security 配置显式关闭 |
| 登录限流/失败锁定 | 无 | 记录为安全例外;后续独立 change |
| 多实例会话/Spring Session | 无 | 非目标;单实例内存会话 |
| 生产 HTTPS/Secure cookie/部署 | 无 | 非目标 |
| SSR 认证预取/登录回跳 | 无 | 非目标;固定回 `/` |
| 修改 `greeting` 表 | 无 | V1 不变;仅新增 V2 |
| 新增前端测试框架 | 无 | ATDD 第 3/5 节显式排除 |
| 修改 `greeting`/`home-page` 规格 | 已批准,非 creep | 认证前置条件必然改变其可观察行为 |
| 扩展 `backend-error-handling`/`frontend-api-request` | 已批准,非 creep | proposal Capabilities 与 REQ-003 acceptance hints |
| `tasks.md` 文档任务 | 非能力扩张 | 属仓库流程义务 |

## 6. Findings

| severity | status | location | issue | disposition |
|---|---|---|---|---|
| INFO | accepted | `tasks.md` 8.1–8.5 | 文档与 G1 复核不在 Delta Spec 行为范围内 | 保留,属流程义务 |
| INFO | accepted | `atdd-design.md` 2.3 | E2E 为人工脚本而非自动化运行器 | 与仓库现状一致;后续需要时再引入 |
| INFO | accepted | `design.md` D15 | 登录限流为显式安全例外 | 需在交付说明与 G1 记录中保留 |
| SUGGESTION | accepted | `atdd-design.md` B10 | 真实 cookie 属性依赖 embedded server | 实现时按约定执行 |

- BLOCKER:0
- WARNING:0
- 结论:P3 设计/任务与 Delta Spec、ATDD 设计一致;需 G1 签核后才能进入 Apply。

## 7. P4 本地验证证据(2026-11-14)

G1 已 Pass(见 [g1-decision.md](g1-decision.md)),实现完成后执行以下验证。

### 7.1 自动化命令

| 命令 | 结果 |
|---|---|
| `cd apps/server && ./mvnw test` | BUILD SUCCESS;Tests run: 15, Failures: 0, Errors: 0, Skipped: 0 |
| 根目录 `npm run build` | 通过;client + SSR 产物生成 |
| `cd apps/web && npx tsc --noEmit` | 无类型错误 |
| `openspec validate add-user-login --strict` | `Change 'add-user-login' is valid` |

### 7.2 API 验收(真实 HTTP)

| 检查 | 结果 |
|---|---|
| 无 cookie `GET /api/greeting` | `401` + `application/problem+json` + `code=UNAUTHENTICATED`,无 `Location` 重定向 |
| 无会话 `GET /api/auth/me` | `401`;同时下发 `XSRF-TOKEN` |
| `demo` + 演示密码登录 | `200 {"username":"demo"}`;`Set-Cookie: JSESSIONID=...; Path=/; HttpOnly; SameSite=Lax` |
| 登录后 `GET /api/greeting` | `200 {"message":"Hello World"}`(响应结构未变) |
| 带 CSRF `POST /api/auth/logout` | `204`;旧会话访问 API 返回 `401` |
| 不带 CSRF `POST /api/auth/logout` | `403` + `code=ACCESS_DENIED` |
| 服务端日志检索密码/演示凭据 | 无命中 |

### 7.3 浏览器 E2E

| 场景 | 结果 |
|---|---|
| 未登录访问 `/`、`/about`、刷新 | 跳转 `/login`,不显示问候语 |
| 登录成功 | 跳转 `/`,显示 "Hello World",顶部出现 "Log out" |
| 已登录刷新 `/`、访问 `/about` | 保持登录并可访问 |
| 错误凭据 | 停留 `/login`,显示通用提示,不泄露用户是否存在 |
| 顶部登出 | 跳转 `/login`,按钮消失;后退/直达 `/` 再次被拦截 |
| 会话失效后访问 `/` | 跳转 `/login`,无业务内容 |
| 浏览器存储反向检查 | 无认证令牌;仅有 `XSRF-TOKEN`(JS 可读)与主题/滚动等非认证键;`JSESSIONID` 为 `HttpOnly` |

### 7.4 G1 后修订:种子注入方式(2026-11-14)

| 项 | 修订前 | 修订后 |
|---|---|---|
| 账号注入 | `V2` 迁移内 `INSERT` 种子账号 | `V2` 仅建表;`scripts/seed-users.mjs` 注入,`npm run seed:users` |
| 凭据 | 迁移内 BCrypt 哈希,明文线下提供 | 脚本内定义测试账号/密码,运行时生成 bcrypt(cost 10)哈希 |
| 幂等 | Flyway 只执行一次 | `ON CONFLICT(username)` upsert,可重复运行 |
| 验证 | 迁移后账号存在 | 迁移后表为空;脚本后账号存在;登录与业务接口返回不变 |

实测:重置开发库并启动后 `app_user` 为 0 行;运行脚本写入 `demo`、`tester`;`demo` 登录 `200`,随后 `GET /api/greeting` 返回 `200 {"message":"Hello World"}`;重复运行脚本仍为 2 行。

### 7.5 未覆盖项

- 登录限流/失败锁定仍是已记录的安全例外(D15),不在本 change 范围。
- E2E 为人工执行,未引入 Playwright 或前端单测框架(与 atdd-design 第 3/5 节一致)。
- 结果待 G2(人工验收门)确认后进入归档流程。
