# Change summary — add-user-login

## Intent

为 PawTrip 增加最小可用的用户登录能力：使用 Spring Security 服务端会话保护全部业务接口，前端在未登录时跳转 `/login`、登录后回到现有首页，顶部导航提供登出。对应 REQ-003，账号来自数据库 `app_user` 表，测试/本地账号由独立脚本注入。

## What shipped

- 后端引入 `spring-boot-starter-security`：`formLogin` + 服务端 `HttpSession`（`JSESSIONID`），不使用 JWT 或前端存储令牌。
- 新增 `app_user` 表；Flyway `V2__create_app_user.sql` 仅建表，不注入账号。新增 `scripts/seed-users.mjs`（`npm run seed:users`）以 bcrypt cost 10 生成哈希并幂等写入本地/测试账号。
- 新增 `POST /api/auth/login`、`GET /api/auth/me`、`POST /api/auth/logout`；全部 `/api/**` 需认证，未认证返回 `401 application/problem+json` + `UNAUTHENTICATED`。
- 启用 CSRF SPA（`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header）、会话固定保护、30 分钟会话超时、`HttpOnly`/`SameSite=Lax` cookie；登出返回 `204`。
- 新增安全错误码 `UNAUTHENTICATED`、`INVALID_CREDENTIALS`、`ACCESS_DENIED`；安全过滤器与 MVC 共用 Problem Details 结构。
- 前端新增 `/login`、pathless `_authenticated` 守卫、auth query、顶部登出；`401` 清理受保护缓存并使认证状态失效；`request.ts` 支持同源凭据、CSRF 头与表单编码。
- 已登录时 `GET /api/greeting` 路径、状态码与响应体保持不变。
- PR #7 已合并：`b0c01bd`（merge commit）。
- Living Spec：新增 `openspec/specs/backend-authentication/`、`frontend-authentication/`；更新 `backend-error-handling/`、`frontend-api-request/`、`greeting/`、`home-page/`。
- 归档位置：`openspec/changes/archive/2026-11-13-add-user-login/`。
- KB update：`Skipped (not configured)` —— 仓库未配置 KB 自动校验，未宣称 KB 校验通过。

## Verify highlights

- Local verify：`docs/ai4se-plugins/20261114-005447-local-verify-report.md`，Overall Pass；白名单命令 `npm run build` 与 `cd apps/server && ./mvnw test` 均 exit 0。
- CI：`docs/ai4se-plugins/20261114-005926-pipeline-report.md`，E1 全绿；Server tests 与 Web build 在功能提交及后续文档提交上均通过。
- 后端测试：15/15（含登录、错误凭据、`me`、CSRF、登出、会话固定与 cookie 属性）。
- 人工 E2E：未登录拦截、登录、刷新保持、已登录访问 `/login`、错误凭据、登出、会话失效跳转。
- 反向验证：无 JWT/localStorage 认证；迁移无明文密码；未认证 API 不返回 HTML/302；`greeting` 表与已登录响应结构未变。

## Archive adjustments

- `greeting` 与 `home-page` 的 MODIFIED 场景保留原场景名（`查询问候语`、`访客打开首页`），避免归档丢弃既有场景。
- 补充两个 Living Spec 的 Purpose 描述，使 `openspec validate --all --strict` 通过（8/8）。

## Residual risks

- 登录限流/失败锁定未实现，作为安全例外由后续独立 change 处理。
- 单实例内存会话，重启后会话丢失；多实例共享不在本次范围。
- 本地 HTTP 未启用 `Secure` cookie；生产部署需 HTTPS。
- 种子脚本包含本地测试用明文凭据，仅限本地/测试环境。
- CI 未配置 secret scan / SAST / dependency audit；前端认证 UI 无自动化测试运行器。
- 登录后固定回 `/`，未保留原目标页（已标记 deferred）。

## Links

- Proposal / Design / Tasks：同目录 `proposal.md`、`design.md`、`tasks.md`。
- ATDD 与自检：同目录 `atdd-design.md`、`alignment-self-check.md`、`consistency-lint.md`。
- G1 / G2：同目录 `g1-decision.md`、`g2-decision.md`。
- PR：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/7
- Local verify：`docs/ai4se-plugins/20261114-005447-local-verify-report.md`
- Pipeline report：`docs/ai4se-plugins/20261114-005926-pipeline-report.md`
