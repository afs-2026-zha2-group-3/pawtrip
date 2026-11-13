# AC / DoV review — add-user-login

- 生成日期:2026-11-14
- 输入:
  - [proposal.md](proposal.md)
  - [backend-authentication/spec.md](specs/backend-authentication/spec.md)
  - [frontend-authentication/spec.md](specs/frontend-authentication/spec.md)
  - [backend-error-handling/spec.md](specs/backend-error-handling/spec.md)
  - [frontend-api-request/spec.md](specs/frontend-api-request/spec.md)
  - [greeting/spec.md](specs/greeting/spec.md)
  - [home-page/spec.md](specs/home-page/spec.md)
  - 上游需求:[REQ-003](../../../requirement-workspace/requirements/REQ-003-user-login.md)
- 评审范围:P2 Delta Spec;不含业务实现

## Acceptance criteria (AC)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 Requirement 至少有一个可测试 AC | Pass | 6 份 Delta Spec 的每个 `### Requirement` 均含 `#### Scenario` | `openspec validate --strict` 通过 |
| AC-2 AC 可观察,无模糊措辞 | Pass | 场景使用状态码、媒体类型、`code`、页面跳转、cookie 属性、缓存清理等可观察结果 | 未使用“appropriately / quickly / works well”等模糊词 |
| AC-3 高风险负向/边界场景已覆盖 | Pass | 覆盖未认证、错误凭据、CSRF 失败、登出后旧会话、会话固定、会话超时、未登录刷新、会话过期 `401` | 并发登录、账号锁定、多实例会话为显式非目标 |
| AC-4 AC 不是伪装的实现细节 | Pass | 行为均以外部可观察结果表达;BCrypt、Problem Details、服务端会话属于需求方明确约束 | 必要的安全契约不是实现细节 |
| AC-5 安全错误可测试 | Pass | `backend-error-handling` 断言 `401/403` 状态、媒体类型、`code`、`instance` 与无堆栈 | 安全过滤器与 MVC 共用结构 |
| AC-6 前端认证行为可观察 | Pass | `frontend-authentication` 断言跳转、停留、按钮可见性、缓存清理与错误提示 | 浏览器 E2E 可验证 |
| AC-7 会话与 CSRF 可验证 | Pass | 登录前后会话 ID、`JSESSIONID` 属性、`XSRF-TOKEN`/`X-XSRF-TOKEN`、`403 ACCESS_DENIED` 均有场景 | 见 ATDD B8–B10 |
| AC-8 已登录业务响应不变 | Pass | `greeting` Delta 明确已认证时仍返回 `200 {"message":"Hello World"}` | 与既有 Living Spec 一致 |

## Definition of verified (DoV)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 列出 2 个新增 + 4 个修改能力,均有对应 Delta Spec | 无静默扩张或遗漏 |
| DoV-2 歧义已列出或解决 | Pass | REQ-003 blocking OQ 全部 resolved;non-blocking 均 deferred | 账号来源、欢迎页、登录协议、CSRF、种子凭据已确认 |
| DoV-3 IO/SA 关注点已记录 | Pass | 本文“Residual concerns”与 design“Risks”记录会话、CSRF、SSR、限流与凭据风险 | G1 人工签核另行记录 |
| DoV-4 未声称业务实现完成 | Pass | P2 评审时仅针对 Delta Spec/设计/任务;G1 通过后按 tasks 实现,实现证据见 [alignment-self-check.md](alignment-self-check.md) 第 7 节 | — |
| DoV-5 Requirement 可追溯到 proposal / 已批准需求 | Pass | 见下方 Traceability | 每条 Requirement 均能落到 proposal What Changes 或 REQ-003 acceptance hints |
| DoV-6 既有能力修改已显式记录 | Pass | `greeting`、`home-page` 使用 MODIFIED 并复制完整需求;`backend-error-handling`、`frontend-api-request` 以新增要求扩展 | 归档时不会丢失既有细节 |
| DoV-7 安全例外已记录 | Pass | design D15 记录“登录限流/失败锁定”为例外;proposal Non-Goals 与 REQ-003 deferred 同步 | 后续独立 change 处理 |
| DoV-8 验收可执行 | Pass | `atdd-design.md` 给出 API 断言、真实 HTTP cookie 测试、人工 E2E 与反向验证 | 无自动化前端框架依赖 |

## Traceability

| Requirement | Proposal What Changes | REQ-003 acceptance hint |
|---|---|---|
| 账号持久化与密码存储 | 新增 `app_user` 表与种子账号(仅 BCrypt 哈希) | 表 + 种子账号;不存明文 |
| 服务端会话登录 | 服务端 HttpSession + `JSESSIONID`;登录接口 | 登录成功建立会话;失败 401 |
| 当前用户查询 | `GET /api/auth/me` | 已登录 200;未登录 401 |
| 业务接口保护 | 保护 `/api/**`;未认证 401 Problem Details | curl 无 cookie 返回 401,不重定向 |
| 登出 | `POST /api/auth/logout` | 204;旧 cookie 401 |
| CSRF 保护 | `csrf.spa()`;`XSRF-TOKEN`/`X-XSRF-TOKEN` | 缺失/无效 403 `ACCESS_DENIED` |
| 会话安全与会话 cookie | 30 分钟、`changeSessionId`、`HttpOnly`、`SameSite=Lax` | 会话固定保护与 cookie 属性 |
| 认证错误日志与敏感信息 | 通用失败文案;不记录敏感信息 | 不区分用户名/密码错误 |
| 登录页面 | 新增 `/login` | 登录成功跳 `/`;失败停留 |
| 未登录路由守卫 | 未登录访问页面跳 `/login` | 任意页面未登录跳转 |
| 认证状态查询与缓存 | auth query + 缓存失效 | 401 不被当作错误页 |
| 顶部导航登出 | 仅已登录显示登出 | 登出后跳 `/login` 且按钮消失 |
| 全局 401 认证失效 | 401 清理缓存并跳转 | 会话过期跳 `/login` |
| 安全层错误统一 Problem Details | 新增 `401/403` 错误码与写入器 | 与既有错误契约一致 |
| 认证错误不泄露敏感信息 | 通用失败文案与日志约束 | 不泄露密码/哈希/堆栈 |
| 请求携带同源会话凭据 | request 层 `credentials: same-origin` | 不使用前端令牌 |
| 非安全方法携带 CSRF token | request 层读取 cookie + header | 登录/登出携带 `X-XSRF-TOKEN` |
| 401 触发认证失效 | request/Query 层处理 | 401 不重试 |
| 已认证查询问候语 | `greeting` MODIFIED | 已登录响应不变 |
| 已登录首页展示问候语 / 未登录跳转 | `home-page` MODIFIED | 未登录跳 `/login` |

## Residual concerns

- **登录前 CSRF token 获取**:依赖 `GET /api/auth/me` 触发 `XSRF-TOKEN`;若该端点未来改为需认证,必须同步调整 token 获取方式。负责人 Dev。
- **SSR 认证门**:TanStack Start SSR 期间不能请求相对 `/api`;认证门只在客户端执行,SSR 渲染中性加载态。需在 E2E 中确认无受保护内容闪现。负责人 Dev/QA。
- **真实 cookie 属性测试**:MockMvc 不保证生成真实 `Set-Cookie`;`HttpOnly`/`SameSite` 断言需使用 embedded server。负责人 Dev。
- **登录限流缺失**:已知安全例外;统一失败文案降低枚举风险,但暴力破解防护未实现。负责人 Dev/Security。
- **单实例内存会话**:重启后会话丢失;多实例共享不在本次范围。负责人 Dev/Ops。
- **演示账号凭据**:明文密码不入库、不入文档;交付时单独提供。负责人 Dev。
- **前端无自动化测试**:认证 UI 以构建 + 人工 E2E 覆盖。负责人 Dev/QA。

## Outcome

- AC/DoV:无阻塞 Fail。
- 结论:Delta Spec、设计与任务可作为 G1 签核输入;本文件不构成 Gate 决策。
