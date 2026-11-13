# Local Verify Report: add-user-login

**Date:** 2026-11-14 (timezone: +08:00)
**Root:** C:\Users\luoec3\.qoder-cn\worktrees\app\9a6cfe\pawtrip
**Scope:** local+evidence
**Change id:** add-user-login

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Pass |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | Pass |

**PR gate:** Overall Pass → 可进入 `/sdd:pr-submit`。本报告不构成 G2 决策。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | Vite client + SSR 构建成功 |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | Tests run: 15, Failures: 0, Errors: 0, Skipped: 0;BUILD SUCCESS |

补充证据(非白名单运行器命令,已实际执行):`openspec validate add-user-login --strict` → `Change 'add-user-login' is valid`。

## Code-review highlights

- 后端使用 Spring Security `formLogin` 而非自研认证;会话固定保护、CSRF SPA、登出 204 均由框架过滤器承担。
- 安全过滤器与 MVC 共用 `ApiErrorCode` 与 Problem Details 结构;未认证返回 `401`、CSRF 失败返回 `403`,不返回 HTML/302。
- 前端认证门仅在客户端启用 auth query,避免 SSR 相对 URL 请求;无 JWT 或 localStorage/sessionStorage 认证令牌。
- `V2` 迁移仅建表,不含 `INSERT`;`scripts/seed-users.mjs` 以 bcrypt cost 10 哈希幂等写入本地测试账号。
- `QueryCache` 对非 auth query 的 `401` 清理受保护缓存并使 auth query 失效,登录失败的 `401` 不触发全局跳转。
- 现有 `GreetingApiTest` 成功路径断言未放宽,仅增加认证前置。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | `tasks.md`:46 个已完成,0 个未完成 |
| V2 | Requirement coverage | Pass | [fact] | 6 份 delta spec 共 20 个 Requirement,均可在实现/测试中找到落点 |
| V3 | Scenario coverage | Pass | [fact] | 46 个 Scenario;后端 15 个集成测试 + 人工 E2E F1–F7 已执行 |
| V4 | Requirement↔impl mapping | Pass | [fact] | `SecurityConfig`/`AuthController`/`AppUserDetailsService`、auth query/`_authenticated`/`login`/`Header`、`request.ts`/`query-client.ts` 分别覆盖各能力 |
| V5 | Spec drift | Pass | [fact] | G1 后按需求方要求将账号注入改为脚本方式,spec/design/tasks/ATDD 已同步,无静默漂移 |
| V6 | Design follow-through | Pass | [fact] | D1–D15 均已落地;D4 已按修订更新为“迁移建表 + 脚本注入” |
| V7 | Code pattern fit | Pass | [fact] | 后端沿用 `com.pawtrip.server.<domain>` 包结构与 tab 缩进;前端沿用 queries 集中定义与 TanStack 约定 |
| V8 | Upstream basis | Pass | [fact] | 变更文件均可追溯到 proposal/tasks;新增 `bcryptjs` devDependency 与 `docs/feedback/verification-commands.md` 更新服务于 D4 修订与验证说明 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单命令均 exit=0 |
| E2 AI | Pass | 本报告证据清单 |
| E3 Human | Pending | G2 人工验收尚未签核 |

## Five-question map (when evidence in scope)

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ⚠️ 登录限流为已记录例外,其余风险已缓解 |

## Findings

### CRITICAL

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 登录限流/失败锁定未实现,属已知安全例外 | [fact] | `design.md` D15、`REQ-003` | 由后续独立 change 增加限流/锁定 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 种子脚本包含本地测试用明文密码 | [fact] | `scripts/seed-users.mjs` | 仅限本地/测试;生产部署不得使用该脚本或复用密码 |
| 2 | 前端认证 UI 无自动化测试运行器 | [fact] | `atdd-design.md` 第 3/5 节 | 维持人工 E2E;后续需要时再引入 Playwright/Vitest |
| 3 | 登录后固定回 `/`,未保留原目标页 | [fact] | `REQ-003` deferred | 后续独立 change 评估 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 暴力破解/撞库 | 登录限流为显式例外 | accepted;后续 change 跟踪 |
| 2 | 单实例内存会话,重启丢失 | 当前部署为单实例本地应用 | accepted |
| 3 | 本地 HTTP 未启用 `Secure` cookie | 仅本地开发;生产需 HTTPS | accepted;部署时启用 |
| 4 | 种子脚本明文测试凭据 | 需求方要求脚本内自定义账号密码 | accepted;仅本地/测试使用 |
| 5 | G2 人工验收未完成 | PR 提交早于 G2 签核 | 由 MR review / G2 记录完成 |

## Waiver

N/A — no waiver.
