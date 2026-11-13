# Consistency lint — refactor-data-access-and-query

- Change id:`refactor-data-access-and-query`
- Phase:`p2`(scope revision 2)
- Focus:full change(proposal + 4 Delta Specs + design + tasks)
- Artifact level:3 + design
- Timestamp:2026-11-13T23:05:00+08:00
- Reviewer:Qoder agent(人工签核待 G1 revision)

## Verdict

| 指标 | 数量 |
|---|---|
| BLOCKER | 0 |
| WARNING | 0 |
| SUGGESTION | 3 |
| N/A | 4 |

**Verdict: Pass**(仅有 SUGGESTION)

## Findings

| id | Severity | Phase | Location | Issue | Suggested fix | Evidence | Authority | Tag |
|---|---|---|---|---|---|---|---|---|
| L1 | SUGGESTION | p2 | `specs/backend-data-access/spec.md` | “MUST NOT 使用 JdbcTemplate”依赖人工 review,仓库暂无 CI 静态检查 | 后续引入流水线时增加 grep/ArchUnit 检查 | 当前仓库无 CI 配置 | AI-inference | [inference] |
| L2 | SUGGESTION | p2 | `specs/frontend-data-fetching/spec.md` | “不在 SSR loader 请求相对 URL”是当前开发代理约束;未来引入绝对地址或 server function 时需更新 | 后续变更中补充例外条款 | `vite.config.ts` 仅配置开发代理 | AI-inference | [inference] |
| L3 | SUGGESTION | p2 | `specs/backend-error-handling/spec.md`、`specs/frontend-api-request/spec.md` | 错误码契约目前由后端与前端各自维护,缺少共享枚举/契约测试 | 后续可加契约测试或共享 type 生成 | 当前无 OpenAPI/共享包 | AI-inference | [inference] |

## Check results

### Proposal rules

| Rule | Result | Evidence |
|---|---|---|
| P1 `## Why` 存在且非空 | Pass | `proposal.md` Why |
| P2 `## What Changes` 存在且非空 | Pass | `proposal.md` What Changes |
| P3 Non-Goals / Out-of-scope 存在且非空 | Pass | `proposal.md` Non-Goals |
| P4 Impact 覆盖 self / upstream / downstream | Pass | `proposal.md` Impact 含代码、依赖、数据、文档、上下游、风险 |

### Spec rules

| Rule | Result | Evidence |
|---|---|---|
| S1 Spec 结构符合 OpenSpec schema | Pass | `openspec validate --strict` → valid;4 个 Delta Spec |
| S2 引用前缀在约定集合内 | N/A | Delta Spec 未使用 `@knowledge:` / `@rule:` 等前缀 |
| S2b `@knowledge:` 路径可解析 | N/A | 无该前缀 |
| S2c `@rule:` 可解析 | N/A | 无该前缀 |
| S3 每个 Requirement 可追溯到 proposal What Changes | Pass | `dov-ac-review.md` Traceability |
| S4 场景使用 Given / When / Then | Pass | 全部 `#### Scenario` |
| S5 场景归属编号 Requirement | Pass | 所有场景位于 `### Requirement` 下 |

### Tasks rules

| Rule | Result | Evidence |
|---|---|---|
| T1 任务 ≤ ~2h | Pass | 任务按依赖/配置/实现/测试拆分;单任务范围小 |
| T2 最后任务是验证/回归 | Pass | 8.3 重新运行测试、构建与 `openspec validate` |
| T3 任务在 Spec 范围内 | Pass | 任务可追溯到 4 个 capability;无 toast/traceId/envelope 任务 |

### Design rules

| Rule | Result | Evidence |
|---|---|---|
| D1 决策显式编号 | Pass | D1–D12 |
| D2 每个决策有 Context / Background | Pass | 每个决策均含 Context |
| D3 每个决策记录拒绝的替代方案 | Pass | D1–D12 均含 Rejected alternatives |

### Shared / cross-artifact checks

| Check | Result | Evidence |
|---|---|---|
| 交叉引用 / ID 指向不存在的章节或能力 | Pass | proposal 声明的 4 个 capability 均有 Delta Spec |
| 同一能力/需求在两处表述不兼容 | Pass | `dov-ac-review.md` Traceability;错误契约与 request 层一致 |
| AC 模糊或不可测试 | Pass | 错误路径有状态码、媒体类型、`code`、UI 行为断言 |
| C1 proposal → spec 覆盖 What Changes | Pass | 4 个 capability 与 proposal 一一对应 |
| C2 spec → tasks 覆盖 | Pass | 每个 capability 均有对应任务:1–2、3–4、6、7 |
| C6 `@knowledge:` / `@rule:` 可达性 | N/A | 无该前缀 |

### phase=p2 checks

| Check | Result | Evidence |
|---|---|---|
| Proposal 范围 vs Delta 范围无静默扩张/遗漏 | Pass | 扩围已在 proposal 与 REQ-002 记录;4 个 capability 完整覆盖 |
| Delta 能力内部一致 | Pass | 错误契约、request 层、正常路径互不冲突 |
| Proposal 关键约束在 Delta 有落点 | Pass | Problem Details、重试、取消、路由错误页、traceId/toast 排除均有对应条款 |
| tasks.md 方向一致性 | Pass | 错误处理任务与 Delta 一致,无额外功能 |
| Requirement 无法追溯 | Pass | 无孤儿 Requirement |
| P/S/T/D + C1/C2/C6 表格适用项 | Pass | 见上 |

### Quality judgment

| Check | Result | Evidence |
|---|---|---|
| Non-Goals 足够精确 | Pass | 明确排除 envelope、toast、traceId、i18n、写接口、SSR 预取、部署 |
| Design decision depth | Pass | D1–D12 均有上下文、选择与替代方案 |

## N/A / skipped

- S2/S2b/S2c/C6:Delta Spec 未使用引用前缀。
- 其他检查均适用并通过。

## Fix suggestions by priority

1. **BLOCKER**:无。
2. **WARNING**:无。
3. **SUGGESTION**:
   - L1 后续引入 CI 时增加“生产代码禁用 `JdbcTemplate`”静态检查。
   - L2 若未来改为绝对 URL 或 server function 取数,同步更新 SSR 边界条款。
   - L3 后续可增加后端/前端错误码契约测试或共享类型。

## Residual risks

- Hibernate `SQLiteDialect` 为社区模块,复杂查询/DDL 能力有限。
- `@tanstack/react-router-ssr-query` 与当前 Router 版本的 peer 兼容性需在实现时验证。
- “无 JdbcTemplate / 无 useEffect fetch”目前依赖人工 review,无自动化门禁。
- 错误码由前后端各自维护,缺少自动契约校验。
- traceId、toast 与成功 envelope 为显式非目标。

## Next

- phase=p2 → `/sdd:g1-decision-record`(需 IO + SA 对 scope revision 2 重新签核)。
- 本报告不是 Gate 决策,也不构成 Living Spec 权威。
