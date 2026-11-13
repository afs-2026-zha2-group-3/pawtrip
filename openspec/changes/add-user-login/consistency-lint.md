# Consistency lint — add-user-login

- Change id:`add-user-login`
- Phase:`p2`(proposal + 6 Delta Specs + design + tasks)
- Focus:full change
- Artifact level:3 + design
- Timestamp:2026-11-14T10:30:00+08:00
- Reviewer:Qoder agent(人工签核待 G1)

## Verdict

| 指标 | 数量 |
|---|---|
| BLOCKER | 0 |
| WARNING | 0 |
| SUGGESTION | 4 |
| N/A | 4 |

**Verdict: Pass**(仅有 SUGGESTION)

## Findings

| id | Severity | Phase | Location | Issue | Suggested fix | Evidence | Authority | Tag |
|---|---|---|---|---|---|---|---|---|
| L1 | SUGGESTION | p2 | `specs/frontend-api-request/spec.md`、`specs/frontend-authentication/spec.md` | `401` 失效在两个能力中均有描述:request 层负责解析,前端认证负责跳转与缓存清理 | 实现时保持职责分离:request 只抛 typed error/触发回调,路由门负责跳转 | 两份 Delta Spec 的 401 条款 | AI-inference | [inference] |
| L2 | SUGGESTION | p2 | `specs/frontend-api-request/spec.md`、`design.md` D12 | `GET /api/auth/me` 同时承担“认证探测”和“CSRF token 获取”职责,存在接口耦合 | 在代码注释/文档中记录该耦合;若未来拆分 token 端点,同步更新规格 | REQ-003 OQ 与 design D6/D12 | AI-inference | [inference] |
| L3 | SUGGESTION | p3 | `atdd-design.md` 2.1/B10 | MockMvc 不保证生成真实 `Set-Cookie`;cookie 属性必须用 embedded server 验证 | 实现时使用 `RANDOM_PORT` 测试 `JSESSIONID` 的 `HttpOnly`/`SameSite` | Spring Security 会话由 Servlet 容器管理 | AI-inference | [inference] |
| L4 | SUGGESTION | p2 | `design.md` D15、`proposal.md` Non-Goals | 登录限流为已知安全例外 | 交付说明中保留例外与后续 change 计划;不得静默视为已缓解 | `@rule:security-baseline` 允许 documented exception | Rule + inference | [rule] |

## Check results

### Proposal rules

| Rule | Result | Evidence |
|---|---|---|
| P1 `## Why` 存在且非空 | Pass | `proposal.md` Why |
| P2 `## What Changes` 存在且非空 | Pass | `proposal.md` What Changes |
| P3 Non-Goals / Out-of-scope 存在且非空 | Pass | `proposal.md` Non-Goals |
| P4 Impact 覆盖 self / upstream / downstream | Pass | `proposal.md` Impact 含代码、依赖、数据、文档、上下游、风险 |
| P5 BREAKING 标注 | Pass | `/api/**` 要求认证已标注 **BREAKING** |

### Spec rules

| Rule | Result | Evidence |
|---|---|---|
| S1 Spec 结构符合 OpenSpec schema | Pass | `openspec validate add-user-login --strict` → valid;6 份 Delta Spec |
| S2 引用前缀在约定集合内 | N/A | Delta Spec 未使用 `@knowledge:` / `@rule:` 等前缀 |
| S2b `@knowledge:` 路径可解析 | N/A | 无该前缀 |
| S2c `@rule:` 可解析 | N/A | 无该前缀 |
| S3 每个 Requirement 可追溯到 proposal What Changes | Pass | `dov-ac-review.md` Traceability |
| S4 场景使用 WHEN/THEN | Pass | 全部 `#### Scenario`;部分补充 GIVEN/AND |
| S5 场景归属编号 Requirement | Pass | 所有场景位于 `### Requirement` 下 |
| S6 MODIFIED 复制完整需求 | Pass | `greeting`、`home-page` 均复制完整 Requirement 与场景后再修改 |
| S7 ADDED 用于新增关注点 | Pass | 新增 capabilities 与既有 capability 的安全扩展均使用 ADDED |

### Tasks rules

| Rule | Result | Evidence |
|---|---|---|
| T1 任务 ≤ ~2h | Pass | 1.1–8.5 按依赖/配置/实现/测试拆分;单任务范围小 |
| T2 最后任务是验证/回归 | Pass | 8.5 运行后端测试、前端构建与 `openspec validate --strict` |
| T3 任务在 Spec 范围内 | Pass | 任务可追溯到 6 个 capability;无注册/角色/限流功能 |
| T4 测试任务不依赖演示密码 | Pass | 4.5 明确运行时随机密码;E2E 凭据单独提供 |

### Design rules

| Rule | Result | Evidence |
|---|---|---|
| D1 决策显式编号 | Pass | D1–D15 |
| D2 每个决策有 Context / Background | Pass | 每个决策均含 Context |
| D3 每个决策记录拒绝的替代方案 | Pass | D1–D15 均含 Rejected alternatives |
| D4 安全决策引用官方能力 | Pass | D6 `csrf.spa()`、D2 `formLogin`、D8 session management 均对照 Spring Security 7.1 文档 |

### Shared / cross-artifact checks

| Check | Result | Evidence |
|---|---|---|
| 交叉引用 / ID 指向不存在的章节或能力 | Pass | proposal 声明的 2 新增 + 4 修改能力均有 Delta Spec |
| 同一能力/需求在两处表述不兼容 | Pass | `dov-ac-review.md` Traceability;401/CSRF 描述职责分离(见 L1) |
| AC 模糊或不可测试 | Pass | 401/403 有状态码、媒体类型、`code`;页面行为有跳转/可见性断言 |
| C1 proposal → spec 覆盖 What Changes | Pass | 6 个 capability 与 proposal 一一对应 |
| C2 spec → tasks 覆盖 | Pass | 每个 capability 均有对应任务:1–4、5–6 |
| C6 `@knowledge:` / `@rule:` 可达性 | N/A | 无该前缀 |

### phase=p2 checks

| Check | Result | Evidence |
|---|---|---|
| Proposal 范围 vs Delta 范围无静默扩张/遗漏 | Pass | 新增与修改能力完整覆盖;非目标显式排除 |
| Delta 能力内部一致 | Pass | 会话、CSRF、错误、页面守卫互不冲突 |
| Proposal 关键约束在 Delta 有落点 | Pass | 服务端会话、CSRF、30 分钟、`HttpOnly`/`SameSite`、未登录跳转、登出均有条款 |
| tasks.md 方向一致性 | Pass | 任务与 Delta/设计一致,无额外功能 |
| Requirement 无法追溯 | Pass | 无孤儿 Requirement |
| P/S/T/D + C1/C2/C6 表格适用项 | Pass | 见上 |
| 既有 Living Spec 修改完整性 | Pass | `greeting`、`home-page` 的 MODIFIED 块包含原场景并新增认证场景 |

### Quality judgment

| Check | Result | Evidence |
|---|---|---|
| Non-Goals 足够精确 | Pass | 明确排除注册、角色、记住我、多实例、限流、生产 TLS、SSR 预取 |
| Design decision depth | Pass | D1–D15 均有上下文、选择与替代方案 |
| 安全基线覆盖 | Pass | CSRF、会话固定、HttpOnly/SameSite、BCrypt、错误不泄露;限流为例外(见 L4) |
| 凭据管理 | Pass | 只存 BCrypt 哈希;明文不入库/文档;测试运行时生成 |

## N/A / skipped

- S2/S2b/S2c/C6:Delta Spec 未使用引用前缀。
- 其他检查均适用并通过。

## Fix suggestions by priority

1. **BLOCKER**:无。
2. **WARNING**:无。
3. **SUGGESTION**:
   - L1 实现时保持 request 层与认证 UI 的职责边界。
   - L2 记录 `/api/auth/me` 同时用于认证探测与 CSRF token 获取的耦合。
   - L3 使用 embedded server 验证真实 `Set-Cookie` 属性。
   - L4 在交付说明中保留登录限流例外。

## Residual risks

- 登录前 CSRF token 依赖公开的 `GET /api/auth/me`。
- SSR 认证门只在客户端执行,需 E2E 确认无受保护内容闪现。
- 单实例内存会话重启丢失。
- 无登录限流/失败锁定。
- 演示账号明文密码需单独交付。

## Next

- phase=p2 → `/sdd:g1-decision-record`(需 IO + SA 签核)。
- 本报告不是 Gate 决策,也不构成 Living Spec 权威。
