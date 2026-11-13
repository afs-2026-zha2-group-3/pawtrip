# G1 decision — add-user-login

- Gate:G1(Align)
- Change id:`add-user-login`
- Input artifacts:
  - [proposal.md](proposal.md)
  - Delta Specs:[backend-authentication](specs/backend-authentication/spec.md)、[frontend-authentication](specs/frontend-authentication/spec.md)、[backend-error-handling](specs/backend-error-handling/spec.md)、[frontend-api-request](specs/frontend-api-request/spec.md)、[greeting](specs/greeting/spec.md)、[home-page](specs/home-page/spec.md)
  - [design.md](design.md)(D1–D15)、[tasks.md](tasks.md)、[atdd-design.md](atdd-design.md)
  - [dov-ac-review.md](dov-ac-review.md)、[consistency-lint.md](consistency-lint.md)、[alignment-self-check.md](alignment-self-check.md)
  - Upstream:[REQ-003](../../../requirement-workspace/requirements/REQ-003-user-login.md)
- Findings:
  - **Scope**:与 proposal 一致;2 个新增能力 + 4 个修改能力完整覆盖 What Changes;无静默扩张或遗漏。
  - **Ambiguity**:blocking OQ 全部 resolved;账号来源(数据库用户表 + 种子账号)、欢迎页(现有 `/`)、登录协议(formLogin)、CSRF(`csrf.spa()`)、种子凭据(仅存哈希)均已确认。
  - **Conflict**:无。`openspec validate add-user-login --strict` 通过;consistency lint 为 Pass(0 BLOCKER / 0 WARNING / 4 SUGGESTION)。
  - **Accepted partial**:登录限流/失败锁定、多实例会话、生产 HTTPS/Secure cookie、SSR 认证预取为显式非目标;登录限流作为安全例外记录。
- Decision:**Pass**
- Conditions + owners:无(Pass,无整改条件)
- Residual risks(已知并接受,非阻塞条件):
  - 登录前 CSRF token 依赖公开的 `GET /api/auth/me`;若该端点未来变更需同步调整 token 获取方式,负责人 Dev。
  - SSR 认证门只在客户端执行,需 E2E 确认无受保护内容闪现,负责人 Dev/QA。
  - `HttpOnly`/`SameSite` 需使用 embedded server 验证真实 `Set-Cookie`,负责人 Dev。
  - 登录限流缺失为已知安全例外,负责人 Dev/Security。
  - 单实例内存会话,重启后会话丢失,负责人 Dev/Ops。
  - 演示账号明文密码不入库、不入文档,交付时单独提供,负责人 Dev。
  - 前端无自动化组件测试,认证 UI 由构建 + 人工 E2E 覆盖,负责人 Dev/QA。
- Approvers:IO=Echo Luo;SA=Echo Luo
- Timestamp:2026-11-14T11:00:00+08:00
- Recorded by:Qoder agent(依据用户显式 G1 确认;签核人 IO/SA=Echo Luo)

## Post-G1 change request(2026-11-14)

- 需求方要求:**不在 Flyway 迁移中注入账号**;改为独立脚本 `scripts/seed-users.mjs`,脚本内自定义账号与密码。
- 影响:D4、`backend-authentication` 首个 Requirement、tasks 1.3–1.5/7.2/8.3、proposal、ATDD 数据策略同步修订;生产代码与迁移仍不含明文密码。
- 处理:G1 结论不变(范围未扩张);修订内容并入 G2 验收。

## Next

- Pass → 进入 P4:按 [tasks.md](tasks.md) 实施后端认证、前端登录闭环与验证,停在 G2 前。
