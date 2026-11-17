# Local Verify Report: add-intra-city-transport-estimate

**Date:** 2026-11-17 (timezone: +08:00)
**Root:** c:\code\pawtrip
**Scope:** local+evidence
**Change id:** add-intra-city-transport-estimate

## Summary

| 维度 | 状态 |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped（无独立静态扫描工具；tsc 类型检查已含于 build 与 vitest 前置，均通过） |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | **Pass** |

**PR gate:** Overall=Pass → 允许 `/sdd:pr-submit`。

## Local commands

| 命令 | 来源 | Exit | 摘要 |
|---------|--------|------|---------|
| `npm run build` | docs/feedback/verification-commands.md | 0 | 前端类型检查 + 生产构建成功（dist 产物正常输出） |
| `cd apps/server && ./mvnw test` | docs/feedback/verification-commands.md | 0 | **Tests run: 213, Failures: 0, Errors: 0, Skipped: 0** |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | 0 | **120 passed (3.6m)**，含新增 intra-city-transport 20 用例与 E10 拖拽复验；主库未被修改 |

运行日志：`docs/ai4se-plugins/20261117-132410-local-verify-run.log`（runner 汇总 commands_attempted:3 / commands_failed:0）。
补充：前端 `npx vitest run` **164/164**、`npx tsc --noEmit` 零错误（本会话 13:14 运行，含 throwOnError 崩溃回归用例）。

## Code-review highlights

- **估算失败兜底修复**（`apps/web/src/queries/trips.ts`）：`routeEstimateQueryOptions` 显式 `throwOnError:false`，修复全局 QueryClient 默认策略把无数据失败查询抛给路由错误边界导致整页崩溃的真实缺陷；配套用生产 `createQueryClient()` 的回归 UT（先红后绿）。
- **快照校验边界**（`TripPlanValidator.parseEstimate`）：`durationMinutes` 非负整数、费用非负且 low≤high、三字段齐全，与 delta 契约逐字一致；合法快照往返原样保留。
- **段行派生为纯函数**（`lib/trip/transport-segments.ts`）+ 组件 live-store 订阅，快照优先、samePoi 零请求、段行不可拖拽，符合既有 store/queries 分层。
- **E10 修复仅测试侧**：拖拽前动画稳定等待（AnimatedList 620ms 弹簧 + 50ms/行 stagger），未改生产代码；复验 120/120 通过。
- **依赖变更最小**：仅新增 3 个 devDependencies（@testing-library/react、@testing-library/user-event、jsdom），服务于 tasks 5.x 组件/渲染单测；无新增运行时依赖。
- 无越界文件改动；diff 57 文件均可追溯至 proposal/specs/tasks（见 V8）。

## Evidence checklist

| ID | 检查 | 结果 | 标记 | 说明 |
|----|-------|--------|------|-------|
| V1 | 任务完成度 | Pass | [fact] | tasks.md 19/19 全部 `[x]`，0 个未完成 |
| V2 | 需求覆盖 | Pass | [fact] | 12 条需求（trip-context 8 / trip-planning 1 MODIFIED / trip-route-estimate 3）均有实现与测试证据（A1–A7 API 验收、164 UT、20 E2E） |
| V3 | 场景覆盖 | Pass | [fact] | 58 个 Scenario 对应 API 验收 + UT + E2E E1–E13 与反向非目标用例；回填路径由 UT + 1.2 真实 Key 冒烟覆盖（CI 无 Key，ATDD §6 约定） |
| V4 | 需求↔实现映射 | Pass | [fact] | trip-route-estimate→`application.port.maps`/`AmapRouteEstimateAdapter`/`TripRouteEstimateService`/`TripController`；trip-planning→`TripPlan`/`TripPlanValidator`；trip-context→`lib/trip/*`/`components/trip/*`/`queries/trips.ts` |
| V5 | Spec 漂移 | Pass | [fact] | 未发现漂移；「估算失败 MUST NOT 弹出全局错误」由 throwOnError:false 修复直接落实（d35205c） |
| V6 | 设计落实 | Pass | [fact] | design.md D1–D9 全部落地（端口独立/换算服务层/快照契约/派生默认不写库/day-policy 纯函数/自驾联动），task-plan 对齐自检 Pass |
| V7 | 代码模式契合 | Pass | [inference] | 命名/分层/文案常量/testid 约定与既有模块一致；验证方法：diff 对照邻近模块 + 本次 code-review highlights |
| V8 | 必要性（反蔓延） | Pass | [fact] | `git diff main...HEAD` 57 文件全部有 proposal/spec/tasks 依据；devDeps 依据 tasks 5.x；requirement-workspace/openspec/docs 为流程工件；无未标记蔓延 |

## Evidence slots (E1 / E2 / E3)

| 槽位 | 状态 | 来源 |
|------|--------|--------|
| E1 Machine | Pass | 本地白名单命令表（3/3 exit=0）；远程 CI 报告待 PR 后由 /sdd:pipeline-report 收集 |
| E2 AI | Pass | 本报告证据清单 V1–V8 + code-review highlights |
| E3 Human | Pending | 具名 VL=tantine，将于 G2 决策记录签署；不自我批准 |

## Five-question map

| Q | 映射 | 状态 |
|---|---------|--------|
| Q1 完整实现？ | V1–V3 | ✅ |
| Q2 正确实现？ | V4–V5 | ✅ |
| Q3 架构一致？ | V6–V7 | ✅ |
| Q4 仅做所需？ | V8 | ✅ |
| Q5 风险可控？ | 残余风险表 | ✅（无红线风险，见下） |

## Findings

### CRITICAL

无。

### WARNING

无。

### SUGGESTION

| # | 发现 | 标记 | 位置 | 建议 |
|---|------|------|------|------|
| 1 | AnimatedList 入场/重排动画使 E2E 拖拽需时间等待稳定 | [fact] | e2e/intra-city-transport.spec.ts E10 | 后续可考虑为组件提供完整的 reduced-motion 禁用路径，消除时间等待 |

## Residual risks

| # | 风险 | 为何开放 | 缓解 |
|---|------|----------|------|
| 1 | CI 无 AMAP Key，真实回填路径不在 E2E 覆盖 | 环境约束（ATDD §6 已约定） | UT + tasks 1.2 真实 Key 冒烟覆盖（accepted） |
| 2 | 高德 Key 配额/权限影响线上估算可用性 | 外部依赖 | 失败行内兜底不阻塞选择与保存；502 类型化错误（mitigated） |
| 3 | E10 稳定等待为时间基，极慢机器可能偶发 | 动画未完全禁用 | 本次 120/120 通过；SUGGESTION #1 跟踪（tracking） |

## Waiver

N/A — no waiver（Overall=Pass）。