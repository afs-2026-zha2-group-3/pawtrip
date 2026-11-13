# Impact brief — REQ-003 用户登录与会话保护

- 生成日期:2026-11-14
- 上游需求:[REQ-003](../../requirements/REQ-003-user-login.md)
- 探索记录:无新增 explore;基于现有实现与 Spring Security 7.1.2 / TanStack Router 官方文档

## 1. Requirement set

| id | title | status | path |
|---|---|---|---|
| REQ-003 | 用户登录与会话保护 | ready-for-split | `requirements/REQ-003-user-login.md` |

阻塞开放问题:0;DoR BLOCKER:0。

## 2. As-is 资产清单(证据路径)

| 区域 | 路径 | 现状 | 是否受影响 |
|---|---|---|---|
| 后端构建 | `apps/server/pom.xml` | Spring Boot 4.1.2;webmvc/JPA/Flyway/SQLite;无 Security | 是(新增 `spring-boot-starter-security`,测试新增 `spring-security-test`) |
| 后端配置 | `apps/server/src/main/resources/application.yml` | 数据源、JPA、Problem Details、端口 | 是(会话超时、cookie 属性) |
| 后端迁移 | `apps/server/src/main/resources/db/migration/V1__create_greeting.sql` | 建 `greeting` 表并种入 Hello World | 否(保持) |
| 后端业务接口 | `apps/server/src/main/java/com/pawtrip/server/greeting/GreetingController.java` | `GET /api/greeting` 公开 | 是(变为需认证,响应不变) |
| 后端错误 | `apps/server/src/main/java/com/pawtrip/server/error/ApiErrorCode.java`、`GlobalExceptionHandler.java` | 3 个错误码;MVC advice 输出 Problem Details | 是(新增 401/403 错误码;安全过滤器需同结构输出) |
| 后端测试 | `apps/server/src/test/java/com/pawtrip/server/greeting/GreetingApiTest.java` | 无认证直接访问 | 是(更新为带认证;新增安全测试) |
| 前端请求层 | `apps/web/src/lib/http/request.ts`、`api-error.ts` | JSON 请求、Problem Details 解析、超时/取消 | 是(同源凭据、CSRF 头、表单编码、401 失效) |
| 前端 Query | `apps/web/src/lib/query-client.ts`、`queries/greeting.ts` | 统一重试与错误日志 | 是(新增 auth query;401 处理) |
| 前端路由 | `apps/web/src/router.tsx`、`routes/__root.tsx`、`routeTree.gen.ts` | 首页与关于页公开 | 是(新增 `/login`;受保护布局/守卫) |
| 前端导航 | `apps/web/src/components/Header.tsx` | 无认证状态与登出 | 是(新增登出按钮) |
| 前端首页 | `apps/web/src/routes/index.tsx` | 访客展示问候语 | 是(仅已登录展示) |
| Living Spec | `openspec/specs/greeting/spec.md`、`home-page/spec.md`、`backend-error-handling/spec.md`、`frontend-api-request/spec.md` | 未包含认证前置、401/403、CSRF | 是(4 个 Delta Spec) |
| 架构知识 | `docs/knowledge/architecture/README.md` | 未描述认证与会话 | 是(补充安全架构) |
| 外部依赖知识 | `docs/knowledge/external/README.md` | 无 Spring Security 条目 | 是(补充官方来源) |
| 运行说明 | `README.md` | 启动顺序、数据库重置 | 是(补充演示账号与会话说明,不写明文密码) |
| CI | `.github/workflows/server.yml`、`web.yml` | 后端测试、前端构建 | 否(命令不变;测试通过即可) |

## 3. As-is → Proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/server/pom.xml` | 无 Security | 增加 `spring-boot-starter-security`;测试增加 `spring-security-test` |
| `application.yml` | 无会话配置 | 增加 `server.servlet.session.timeout=30m`、cookie `http-only=true`、`same-site=lax`、`secure=false`(本地) |
| 数据库 | 仅 `greeting` | 新增 `V2__create_app_user.sql`:`app_user(id, username UNIQUE, password_hash, enabled)`,仅建表;账号由 `scripts/seed-users.mjs` 注入 |
| 后端安全 | 无 | 新增 `SecurityConfig`、`AppUserDetailsService`、`AppUser`/`AppUserRepository`、安全异常/错误写入器 |
| 认证接口 | 无 | 新增 `POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/logout` |
| 业务接口 | `GET /api/greeting` 公开 | `/api/**` 需认证;已登录响应不变 |
| 错误契约 | MVC Problem Details | 新增 `UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED`;安全过滤器输出同结构 |
| 前端请求 | 仅 JSON | 支持表单编码登录;同源凭据;非安全方法带 `X-XSRF-TOKEN`;401 触发认证失效 |
| 前端路由 | 公开 | 新增 `/login`;受保护布局;未登录重定向 `/login` |
| 前端导航 | 无登出 | 已登录显示登出;调用登出接口后清理状态并跳 `/login` |
| 首页 | 访客可见 | 未登录跳 `/login`;登录后展示问候语 |
| Living Spec | 无认证要求 | `backend-authentication`、`frontend-authentication` 新增;4 个既有能力修改 |
| 文档 | 无认证说明 | 架构、外部依赖、运行说明补充;不记录明文密码 |

## 4. Blast radius

- **apps/server**:认证入口、全部 `/api/**` 访问路径、会话与 CSRF、错误输出、测试基线与启动配置。
- **apps/web**:所有页面路由、HTTP 请求、Query 缓存、顶部导航、登录页。
- **本地运行时**:首次启动执行 V2 建表;运行 `npm run seed:users` 注入测试账号;开发代理继续转发 cookie。
- **不受影响**:`greeting` 表、问候语接口成功响应结构、首页展示文案、CI 命令、部署流水线。

## 5. Artifact impact

- **Specs**:新增 `backend-authentication`、`frontend-authentication`;修改 `backend-error-handling`、`frontend-api-request`、`greeting`、`home-page`。
- **Tests**:后端新增认证/授权/CSRF/登出集成测试;更新现有 `GreetingApiTest`;前端沿用构建与人工 E2E。
- **Docs / KB**:更新 `docs/knowledge/architecture/README.md`、`docs/knowledge/external/README.md`、`README.md`。
- **CI/CD**:工作流与命令不变;不引入部署。

## 6. Dual-track notes

- **OpenSpec**:一个 change 承载即可,建议 id `add-user-login`;两个新增能力 + 四个修改能力。
- **Agile**:可拆为后端认证闭环 → 前端登录/守卫/登出 → 文档与回归三个薄故事。
- 需求保持“已认证/未认证”业务表述;Spring Security、cookie、CSRF 等写入 Constraints。

## 7. Risks & blockers

| 级别 | 风险 | 说明 / 缓解 |
|---|---|---|
| Medium | 现有接口测试全部失败 | 统一更新为带认证;先建立认证测试辅助,再改造业务断言 |
| Medium | 安全过滤器错误输出绕过 MVC advice | 使用共享 Problem Details 写入器,输出相同 `code`/`status`/`instance` |
| Medium | SPA CSRF 与登录前 token 获取 | 使用 Spring Security 7 `csrf.spa()`;应用启动通过 `/api/auth/me` 获取 `XSRF-TOKEN`;登录 POST 携带 `X-XSRF-TOKEN` |
| Medium | TanStack Start SSR 期间无法请求相对 URL | 认证守卫在客户端执行;SSR 渲染中性的加载态,不在服务端请求 `/api` |
| Low | 测试账号凭据管理 | 迁移不注入账号;`scripts/seed-users.mjs` 定义本地/测试账号并生成 BCrypt 哈希;生产代码与迁移不含明文密码 |
| Low | 登录接口无限流 | 已知例外;通用失败文案避免用户枚举;后续独立 change 增加限流/锁定 |
| Low | 多实例会话不共享 | 当前单实例;后续可引入 Spring Session/JDBC |
| Low | `routeTree.gen.ts` 需随新路由重新生成 | 使用 TanStack Start dev/build 生成,不手改生成文件 |

阻塞问题:无。
