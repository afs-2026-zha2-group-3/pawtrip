# Change summary — add-intra-city-transport-estimate

- Change id: `add-intra-city-transport-estimate`（REQ-011 途内交通推荐：打车/步行/驾车）
- 状态：G2 Pass（VL=tantine）→ P5 归档在途（本摘要写入后执行 `openspec archive`）

## Intent

行程按天串联多个景点后，「景点之间怎么走、要多久、大概多少钱」完全依赖用户自行查地图。本 change 在行程面板按天为相邻景点行之间插入途内交通段行：非自驾提供打车/步行选择并展示服务端代理高德路线规划 2.0 得到的估算（打车费用区间 + 时长，步行 ¥0）；用户选择后把「方式 + 估算快照」随既有防抖 PUT 持久化到 `plan_json`（`stop.toNext` + `stop.toNextEstimate`），刷新后快照优先展示、切换方式重算、失败仅存方式待回填。大交通选自驾时联动为「默认驾车仅时长（派生不写库）」并保留下拉切打车/步行，显式选择迁移到新枚举 `self_drive`。附带两类小字提醒：每个打车段行内携宠提示、每天首个景点行前「宠物档案 × 景点政策」对比提醒。

## What shipped

- **Delta Specs（3 份，12 需求 58 场景）**
  - `trip-context`：ADDED 8 需求 36 场景（段行展示/选择快照/提示/自驾联动）
  - `trip-route-estimate`：ADDED 3 需求 12 场景（估算 API 契约）
  - `trip-planning`：MODIFIED「Plan JSON v1 结构」全量块（10 场景，含 `self_drive` 枚举往返）
- **后端**（`apps/server`）
  - 端口/适配器：`application.port.maps.RouteEstimatePort`、`infrastructure.amap.api.AmapRouteEstimateAdapter`、`RouteEstimateException` → 502 映射
  - 端点：`GET /api/trips/{tripId}/route-estimate`（401/404/400/502 语义，±20% 区间、分钟向上取整、步行 0/0）
  - `TripPlan.TripStop` record + `TripPlanValidator.parseStops` 快照解析/校验/序列化；`toNext` 枚举扩展 `self_drive`
- **前端**（`apps/web`）
  - `lib/trip/transport-segments.ts`（段行派生）、`lib/trip/day-policy.ts`（每日政策提醒纯函数）、`store.ts`（`setStopTransport`/`backfillStopEstimate` + 快照透传）、`queries/trips.ts`（`routeEstimateQueryOptions`，`throwOnError:false`）
  - `components/trip/trip-panel.tsx`：段行渲染/方式选择器/公交提示/携宠提示/政策提醒/自驾联动
- **PR**：#67 → 合并入 `main`（merge commit；合并 main 时按 Branch Sync Strategy 解 3 处冲突并适配 main 的 startDate/确认弹窗重构）
- **KB update**：Skipped（not configured）— `scripts/kb-lint.sh` 输出 `SKIP: KB lint is not configured for this project.`（exit 0），按本仓既有政策记录；**不声称** KB 校验通过

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| local-verify（Overall） | **Pass** — V1–V8 通过，1 条 SUGGESTION | `docs/ai4se-plugins/20261117-133236-local-verify-report.md` |
| 后端测试 | `mvnw test` **222** tests BUILD SUCCESS（含 main 合并后新增用例） | local-verify run log + 合并后复验 |
| 前端单测 + 类型 | vitest **185** passed（23 files）+ `tsc --noEmit` 零错误 | 同上 |
| E2E 全量 | **128** passed（2.8m，含 main 新增 8 用例）；合并前本地 120/120 | `docs/ai4se-plugins/20261117-135600-merge-reverify-e2e.log` |
| 构建 | `npm run build` exit 0 | local-verify commands |
| CI（E1） | **E1 全绿** — Server tests 1m35s / Web build 40s / Browser E2E 9m34s | `docs/ai4se-plugins/20261117-140958-pipeline-report.md`、change 内 `ci-report.md` |
| OpenSpec validate | `validate --strict` 通过（五轮修订后复验） | tasks 7.2 执行记录 |
| G2 | **Pass**（VL=tantine） | `g2-decision.md` |

## Residual risks

1. **CI 无 AMAP Key**：E2E 依赖「PUT 预置快照 + 种子坐标 NULL 失败路径」确定性策略；真实 Key 路径仅 tasks 1.2 本地冒烟覆盖（accepted）。
2. **合并 main 后 E1 语义适配**：main（PR #64/#66）移除草稿入口，E1 改验行程确认弹窗前置态；「草稿不生成段行」由 `trip-panel` 分支代码保持（accepted，tasks 6.1 记录）。
3. **E10 时间常量等待**：拖拽前 1200ms/800ms 等待依赖 AnimatedList 动画时长常量，动画参数调整需同步（跟踪项）。
4. **SUGGESTION 未落实**：AnimatedList reduced-motion 未完全禁用以进入场动画（非阻塞）。
5. **走查口径**：`durationMinutes` 契约按 ≥0 非负整数（与 validator 一致），文档已修正。

## Links

- 工件：本目录 `proposal.md` / `design.md`（D1–D9）/ `atdd-design.md`（A1–A7、E1–E13）/ `tasks.md`（19/19 `[x]`）/ `dov-ac-review.md`（Revision 2）/ `g1-decision.md`（Revision 2）/ `g2-decision.md` / `ci-report.md` / `specs/`
- Living Spec（归档后）：`openspec/specs/{trip-context,trip-planning,trip-route-estimate}/`
- PR #67：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/67
- 验证证据：`docs/ai4se-plugins/20261117-133236-local-verify-report.md`、`20261117-140958-pipeline-report.md`、`20261117-135600-merge-reverify-e2e.log`
- 需求登记：`requirement-workspace/registry.md`（REQ-011）、`requirements/REQ-011-intra-city-transport.md`
