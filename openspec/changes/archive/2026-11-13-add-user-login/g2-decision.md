# G2 decision — add-user-login

- Gate:G2(Verify)
- Inputs:
  - local-verify:[20261114-005447-local-verify-report.md](../../../docs/ai4se-plugins/20261114-005447-local-verify-report.md)(Overall Pass)
  - pipeline ci:[20261114-005926-pipeline-report.md](../../../docs/ai4se-plugins/20261114-005926-pipeline-report.md) · [ci-report.md](ci-report.md)(E1 ✅ 全绿)
  - pipeline cd:n/a(未部署,不在本次范围)
  - PR:[#7](https://github.com/afs-2026-zha2-group-3/pawtrip/pull/7) · commit `f94f997` / `5a0c0b1`
- Dimension results:
  - Build:Pass(`npm run build`)
  - Static scan:Pass(无 JWT/localStorage 认证、迁移无明文密码、反向检查通过)
  - Code review:Pass(CRITICAL 0)
  - Evidence(OpenSpec):Pass(tasks 46/46;20 Requirements / 46 Scenarios)
  - CI:Pass(Server tests 28s、Web build 20s,E1 全绿)
  - CD:n/a
- Defect grades:
  - CRITICAL:0
  - WARNING:1(登录限流/失败锁定未实现,已记录为安全例外)
  - SUGGESTION:3(种子脚本明文测试凭据仅限本地;前端无自动化测试运行器;登录后固定回 `/`)
- Decision:**Pass**
- Waivers / conditions + owners:无。已知残余风险(accepted):
  - 登录限流缺失 → 后续独立 change,Owner Dev/Security
  - 单实例内存会话 → 当前部署形态,Owner Dev/Ops
  - 本地未启用 `Secure` cookie → 生产部署需 HTTPS,Owner Dev/Ops
  - CI 未配置 secret scan / SAST / dependency audit → 后续流水线增强,Owner Dev
- Approvers:VL=Echo Luo(2026-11-14 显式确认 G2 Pass)
- Timestamp:2026-11-14T01:01:37+08:00
- Recorded by:Qoder agent(依据用户显式 G2 决策;签核人 VL=Echo Luo)

## Traceability appendix(optional)

| Requirement | Spec | Code | Test |
|---|---|---|---|
| 账号持久化与密码存储 | `backend-authentication` | `AppUser`、`AppUserRepository`、`V2` 迁移、`scripts/seed-users.mjs` | `SecuritySessionTest`、DB 查询 |
| 服务端会话登录 | `backend-authentication` | `SecurityConfig`、JSON handlers | `AuthApiTest`、`SecuritySessionTest` |
| 业务接口保护 / Problem Details | `backend-authentication`、`backend-error-handling` | `SecurityProblemWriter`、`ApiErrorCode` | `GreetingApiTest`、`AuthApiTest` |
| CSRF | `backend-authentication`、`frontend-api-request` | `SecurityConfig`、`CsrfCookieFilter`、`request.ts` | `AuthApiTest`、`SecuritySessionTest` |
| 登录页 / 路由守卫 / 登出 | `frontend-authentication`、`home-page` | `login.tsx`、`_authenticated.tsx`、`Header.tsx` | 人工 E2E F1–F7 |
| 401 全局失效 | `frontend-api-request`、`frontend-authentication` | `query-client.ts` | 人工 E2E F5 |
| 已登录问候语不变 | `greeting` | `GreetingController` | `GreetingApiTest` |
