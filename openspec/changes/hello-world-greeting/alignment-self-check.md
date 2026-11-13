# Alignment self-check — hello-world-greeting

- change-id:`hello-world-greeting`
- phase:`p3`(`/sdd:task-plan`)
- date:2026-11-13(+08:00)
- 范围:Delta Spec ↔ [design.md](design.md) ↔ [tasks.md](tasks.md) ↔ [atdd-design.md](atdd-design.md)
- 结构校验:`openspec validate hello-world-greeting --strict` → valid

## Verdict

**Pass** — 无静默扩范围、无规格缺口;1 项说明性记录(文档任务属流程义务,不构成能力扩张)。

## 1. Delta Spec → Design

| Requirement / Scenario | Design 决策 | 覆盖 | 说明 |
|---|---|---|---|
| R1 Greeting 持久化与初始化 / S1 首次启动自动建库与种子 | 决策 1(SQLite 文件 + Flyway)、决策 6(迁移幂等) | Pass | 路径、表结构、种子来源均已决定 |
| R2 问候语查询接口 / S2 查询问候语 | 决策 2(Spring JDBC)、决策 3(JSON `message`) | Pass | 状态码、媒体类型、字段名均有依据 |
| R3 首页展示问候语 / S3 访客打开首页 | 决策 4(客户端取数)、决策 5(开发代理) | Pass | SSR 与同源代理的取舍已说明 |
| R3 首页展示问候语 / S4 展示内容跟随接口返回 | 决策 4(客户端取数) | Pass | 数据变化后刷新即重新请求,未引入缓存 |
| R3 的 MUST NOT 硬编码 | 决策 4(接口取数) | Pass | 前端不保留问候文案常量 |
| Non-Goals(多语言、管理 UI、账号权限、失败态、部署/CI/跨域) | Non-Goals 与 Risks | Pass | 均显式排除,无隐含实现 |

## 2. Design → Tasks

| Design 决策 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| 1 SQLite + Flyway、路径与 `.gitignore` | 1.1–1.3 | Pass | 依赖、配置、迁移与种子逐项落地 |
| 2 Spring JDBC 最小数据访问 | 2.2 | Pass | 未引入 JPA/Spring Data |
| 3 `GET /api/greeting` JSON 契约 | 2.1–2.3 | Pass | 测试与手工请求均断言状态码、头、体 |
| 4 客户端 `useEffect` 取数 | 3.2 | Pass | 首页替换为最小页 |
| 5 Vite `/api` 开发代理 | 3.1 | Pass | 后端不配置 CORS |
| 6 迁移幂等与干净数据库验收 | 1.3、3.3、5.3 | Pass | 冷启动与数据变更步骤均要求清理数据库 |
| 7 后端接口集成测试、无前端组件测试、无 NFR | 2.1、4.x、5.3 | Pass | 测试先红后绿;E2E 人工执行;NFR 不纳入 |

## 3. Delta Spec → ATDD Design

| Scenario | ATDD 层 | 检查 | 覆盖 |
|---|---|---|---|
| S1 首次启动自动建库与种子 | E2E | E2E-1 | Pass |
| S2 查询问候语 | API | `GreetingApiTest` 三项断言 | Pass |
| S3 访客打开首页 | E2E | E2E-2 | Pass |
| S4 展示内容跟随接口返回 | E2E | E2E-3 | Pass |
| S5 文案不硬编码(AND 条件) | API + E2E | 接口返回值为唯一来源 + 页面随数据变化 | Pass |
| Non-Goals | 反向验证 | atdd-design 第 5 节 6 行 | Pass |

## 4. ATDD → Tasks

| ATDD 约束 | Tasks | 覆盖 | 说明 |
|---|---|---|---|
| 生产代码前先写 API 验收测试(红) | 2.1 → 2.2 | Pass | 测试项排在实现之前 |
| 实现后转绿并手工核对接口 | 2.3 | Pass | 与 2.1 断言一致 |
| E2E-1 冷启动建库 | 1.3、5.3 | Pass | 迁移任务 + 最终端到端验收 |
| E2E-2 / E2E-3 首页与数据联动 | 3.3、5.3 | Pass | 浏览器验收与恢复步骤明确 |
| 非目标反向验证 | 4.1–4.3 | Pass | 语言/管理 UI、无鉴权、失败态与 CORS |
| fixtures:临时库隔离、开发库清理 | 2.1、3.3、5.3 | Pass | 未新增第二套种子 |
| 不引入 Playwright/POM/Excel、无 UT 套件、CI 为 N/A | 3.3、5.3、atdd-design 第 3/5 节 | Pass | 任务未新增测试框架或流水线 |

## 5. Scope creep check

| 潜在扩张点 | 结论 | 依据 |
|---|---|---|
| 新增问候语写入/管理接口 | 无 | E2E-3 仅直接改库,未新增 API |
| 新增多语言、账号、权限 | 无 | 反向任务 4.1–4.2 仅验证不存在 |
| 新增失败态 UI/重试 | 无 | 反向任务 4.3 明确不实现 |
| 新增 CORS 配置 | 无 | 仍走同源代理 |
| 新增前端组件测试 / E2E 框架 | 无 | OQ-4 与 ATDD 第 5 节显式排除 |
| 新增 NFR 测试 | 无 | 已与需求方确认不纳入 |
| `tasks.md` 5.1–5.2 的 README 与知识库更新 | 非能力扩张 | 属仓库流程义务,不改变系统行为 |

## 6. Findings

| severity | status | location | issue | disposition |
|---|---|---|---|---|
| INFO | accepted | `tasks.md` 5.1–5.2 | 文档任务不在 Delta Spec 行为范围内 | 保留,属流程义务,不影响验收 |
| INFO | accepted | `atdd-design.md` 2.2 | E2E 为人工脚本而非自动化运行器 | 与 OQ-4 一致,后续需要时再引入运行器 |

- BLOCKER:0
- WARNING:0
- 结论:P3 设计/任务与 Delta Spec、ATDD 设计一致,可进入 P3 质量清单与后续 Apply。
