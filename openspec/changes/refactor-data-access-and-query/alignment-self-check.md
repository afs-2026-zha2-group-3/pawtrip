# Alignment self-check — refactor-data-access-and-query

- change-id:`refactor-data-access-and-query`
- phase:`p3`(`/sdd:task-plan`)
- date:2026-11-13(+08:00)
- 范围:Delta Spec ↔ [design.md](design.md) ↔ [tasks.md](tasks.md) ↔ [atdd-design.md](atdd-design.md)
- 结构校验:`openspec validate refactor-data-access-and-query` → valid

## Verdict

**Pass** — 无静默扩范围、无规格缺口;2 项说明性记录(文档与人工 E2E 属流程义务,不构成能力扩张)。

## 1. Delta Spec → Design

| Requirement / Scenario | Design 决策 | 覆盖 | 说明 |
|---|---|---|---|
| 关系型数据访问使用 Spring Data JPA 仓库 / 问候语查询通过仓库 | D2、D4 | Pass | 实体、仓库、派生查询与控制器 DTO 已决定 |
| 新增简单查询优先使用派生查询 | D2 | Pass | 明确 `findFirstByOrderByIdAsc()`;复杂查询走仓库 `@Query` |
| 裸 SQL 例外需显式记录 / 复杂查询使用 @Query | D2 | Pass | 约定 SQL 不进入控制器/服务层 |
| Schema 由 Flyway 管理 / 应用启动不自动改表 | D3 | Pass | `ddl-auto=none`;Flyway 保持权威 |
| SQLite 使用 Hibernate 社区方言 / 使用方言启动并查询 | D1 | Pass | 依赖、方言类与版本管理已决定 |
| 服务端数据通过 TanStack Query 获取 / 首页通过 Query | D5、D6 | Pass | QueryClient、query options、首页 `useQuery` 已决定 |
| QueryClient 按请求生命周期创建 / SSR 请求隔离 | D5 | Pass | `getRouter` 内创建 + router context + SSR 集成 |
| 查询键与 query options 集中定义 / 首页复用 | D6 | Pass | `apps/web/src/queries/greeting.ts` |
| 保持客户端取数边界 / 不在 SSR loader 请求相对 URL | D6 | Pass | 不使用 loader 预取或 `useSuspenseQuery` |
| 错误统一使用 Problem Details / 稳定错误码 / 全局异常处理 | D8、D9 | Pass | Problem Details、错误码与 advice 已决定 |
| 服务端错误日志 | D9 | Pass | 5xx 记录堆栈,4xx 不记录 |
| 服务端请求统一经过 request 层 / typed ApiError | D10 | Pass | `request` 与 `ApiError` 已决定 |
| 按错误类型重试 / 请求可取消 | D11 | Pass | 4xx 不重试、5xx/网络最多 2 次、AbortSignal |
| 路由级错误呈现 / 全局错误日志 | D11、D12 | Pass | 路由 errorComponent、notFoundComponent、QueryCache/MutationCache |
| 错误文案与可观测性边界 | D12 | Pass | 英文 detail + 稳定 code;traceId/toast 暂缓 |
| Non-Goals(契约、表结构、写接口、失败态、SSR 预取、工具与部署) | Non-Goals、D3、D6、D7、D12 | Pass | 正常路径不变;错误路径新增;toast/traceId/envelope 排除 |

## 2. Design → Tasks

| Design 决策 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| D1 SQLite + JPA 社区方言 | 1.1–1.3 | Pass | 依赖、配置、启动验证逐项落地 |
| D2 实体 + 仓库派生查询 | 2.1–2.2 | Pass | 实体映射与 `findFirstByOrderByIdAsc()` |
| D3 Flyway 权威 + `ddl-auto=none` | 1.2、5.3 | Pass | 配置与规格校验 |
| D4 控制器 DTO + 契约不变 | 2.3–2.4 | Pass | 控制器改造与 API 测试 |
| D5 每请求 QueryClient + SSR 集成 | 3.1–3.3 | Pass | 依赖、router、root route |
| D6 客户端取数 + 集中 query options | 3.4–3.5、4.2–4.3 | Pass | query options、首页改造与 E2E |
| D7 API 集成测试 + 人工 E2E | 2.4、4.1–4.4 | Pass | 复用现有测试,不新增 E2E 框架 |
| D8–D9 Problem Details + 全局异常处理 | 6.1–6.3 | Pass | 错误码、advice、错误路径测试 |
| D10 request + ApiError | 7.1–7.2 | Pass | 统一请求、Problem Details 解析、重试与取消 |
| D11 路由错误页 + Query 全局回调 | 7.2–7.3 | Pass | errorComponent/notFoundComponent 与 onError |
| D12 错误文案与边界 | 7.3、8.1 | Pass | 英文 detail + 稳定 code;traceId/toast 不实现 |

## 3. Delta Spec → ATDD Design

| Scenario | ATDD 层 | 检查 | 覆盖 |
|---|---|---|---|
| 使用 SQLite 方言启动并查询 | API | `GreetingApiTest` 状态码/头/体 | Pass |
| 首页通过 Query 获取问候语 | E2E | E2E-1/E2E-2 | Pass |
| 不在 SSR loader 请求相对 URL | E2E | E2E-3 | Pass |
| 新增服务端数据读取复用 Query | E2E + 代码检查 | E2E-2、`queryOptions` 引用检查 | Pass |
| 无 JdbcTemplate / 无手写 SQL | 反向验证 | 第 5 节代码检索 | Pass |
| 无 `useEffect` + `fetch` | 反向验证 | 第 5 节代码检索 | Pass |
| 问候语不存在返回 404 Problem Details | API | 2.3 错误路径 API 测试 | Pass |
| 未捕获异常返回 500 且不暴露堆栈 | API | 2.3 错误路径 API 测试 | Pass |
| 首次加载失败进入路由错误页 | E2E | E2E-5 | Pass |
| 后台刷新失败保留缓存数据 | E2E | E2E-6 | Pass |
| 未知路由展示 notFoundComponent | E2E | E2E-7 | Pass |
| Non-Goals | 反向验证 | atdd-design 第 5 节 11 行 | Pass |

## 4. ATDD → Tasks

| ATDD 约束 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| 现有 API 测试先建立绿基线 | 2.4 | Pass | 不删除、不放宽断言 |
| 后端 JPA 替换后测试保持绿 | 1.3、2.4 | Pass | 启动与测试双重验证 |
| E2E-1/2 首页与请求来源 | 4.1 | Pass | 浏览器 Network 观察 |
| E2E-3 客户端取数边界 | 4.2 | Pass | SSR 首屏与 hydration 后请求时序 |
| E2E-4 数据跟随 | 4.3 | Pass | 改库后刷新,验证后恢复 |
| 反向验证 | 4.4 | Pass | 代码检索与配置检查 |
| fixtures:临时库隔离、开发库清理 | 2.4、4.3 | Pass | 不新增第二套种子 |
| 不引入 Playwright/前端单测/CI | 3.6、4.1、atdd-design 第 3/5 节 | Pass | 任务未新增测试框架或流水线 |
| 错误路径 API 测试 | 6.3 | Pass | 404/500/成功响应断言 |
| 错误路径 E2E | 7.4 | Pass | E2E-5 ~ E2E-7 |
| 文档与重新签核 | 8.1–8.3 | Pass | 知识库、自检、G1 revision |

## 5. Scope creep check

| 潜在扩张点 | 结论 | 依据 |
|---|---|---|
| 新增问候语写入/管理接口 | 无 | 非目标;tasks 未包含 |
| 新增多语言、账号、权限 | 无 | 非目标 |
| 新增失败态 UI/重试 | 无 | 非目标 |
| 新增 CORS 配置 | 无 | 仍走 Vite 同源代理 |
| 新增前端组件测试 / E2E 框架 | 无 | ATDD 第 3/5 节显式排除 |
| 新增 NFR 测试 | 无 | ATDD 第 6 节记录不纳入 |
| 修改 Flyway 迁移或表结构 | 无 | Tasks 1–2 未包含 |
| 错误处理扩围 | 已批准扩围,非 creep | REQ-002 scope revision 2、proposal Capabilities |
| 引入 toast / traceId / 成功 envelope | 无 | 显式 Non-Goals |
| 新增写接口或业务校验 | 无 | 非目标;本次不引入 validation starter |
| `tasks.md` 5.1–5.2 / 8.1 的知识库更新 | 非能力扩张 | 属仓库流程义务,不改变系统行为 |

## 6. Findings

| severity | status | location | issue | disposition |
|---|---|---|---|---|
| INFO | accepted | `tasks.md` 5.1–5.2、8.1 | 文档任务不在 Delta Spec 行为范围内 | 保留,属流程义务,不影响验收 |
| INFO | accepted | `atdd-design.md` 2.2、2.4 | E2E 为人工脚本而非自动化运行器 | 与仓库现状一致,后续需要时再引入运行器 |
| INFO | accepted | `tasks.md` 6.1–8.3 | 错误处理为 2026-11-13 批准的扩围 | 需重新进行 G1 revision 签核 |

- BLOCKER:0
- WARNING:0
- 结论:P3 设计/任务与扩围后的 Delta Spec、ATDD 设计一致;需重新进行 G1 签核后才能进入 Apply。
