# Tasks

> 初版任务清单（P2）。P3 `/sdd:atdd-design` 与 `/sdd:task-plan` 将细化 ATDD 验收层与本清单；实现遵循 TDD（先测试后实现）。

## 1. 前置：知识库与高德冒烟

- [ ] 1.1 将已核对的高德路线规划 2.0 文档（驾车/步行端点、`show_fields=cost`、`taxi_cost`、坐标 ≤6 位小数、`origin_id`/`destination_id`）补入 `docs/knowledge/external/`，并更新 `docs/knowledge/architecture/README.md` 的端口/适配器说明；验证：文档含参数与返回字段表，`scripts/kb-lint.sh`（Git Bash）通过
- [ ] 1.2 用真实 `AMAP_API_KEY` 冒烟 `GET /v5/direction/driving` 与 `/v5/direction/walking`（含 `show_fields=cost`），确认 Key 权限与 `taxi_cost` 可用；验证：记录两请求的响应样例（脱敏）于 change 目录，失败则升级用户决策

## 2. 服务端：路线规划端口与适配器

- [ ] 2.1 先写适配器单测（fake `AmapTransport`）：驾车/步行参数构造（坐标 ≤6 位、`show_fields=cost`、POI ID）、`taxi_cost`/`duration` 解析、缺失/非数值/上游失败/Key 缺失的类型化异常；验证：测试先红
- [ ] 2.2 新增 `application.model.maps` 估算请求/结果 record、`application.port.maps.RouteEstimatePort`、`infrastructure.amap.api.AmapRouteEstimateAdapter` 与 `RouteEstimateException`；验证：2.1 测试转绿（`apps/server` 下 `mvnw test`）
- [ ] 2.3 先写 `GlobalExceptionHandler` 映射单测（`RouteEstimateException` → `UPSTREAM_FAILURE` 502，不泄露 Key/原始报文），再实现映射；验证：映射测试通过

## 3. 服务端：估算端点与换算

- [ ] 3.1 先写 `TripRouteEstimateService` 单测：未登录 401、非本人 404、参数非法/poiId 不存在/坐标缺失 400、±20% 区间、分钟向上取整、步行 ¥0、估算接口不改 trip 数据；验证：测试先红
- [ ] 3.2 实现 `TripRouteEstimateService` 与 `TripController` 的 `GET /{tripId}/route-estimate` 端点及响应 record；验证：3.1 测试转绿，`mvnw test` 全量通过（含既有 trip 测试无回归）
- [ ] 3.3 先写 `TripPlanValidator`/`TripPlan.TripStop` 快照单测：`toNextEstimate` 可省略/null、三字段齐全校验（缺字段/非数值/负值/非整数分钟/low>high → 400）、合法快照 PUT→详情往返原样保留（不被丢弃）、存量无快照 plan 无回归；验证：测试先红
- [ ] 3.4 扩展 `TripPlan.TripStop` record 与 `TripPlanValidator.parseStops` 解析/校验/序列化（D7）；验证：3.3 测试转绿，`mvnw test` 全量通过

## 4. 前端：store 动作与估算查询

- [ ] 4.1 先写 vitest：`setStopTransport(ref, toNext, estimate)` 同时写入 `toNext` 与 `toNextEstimate` 并递增 `saveRevision`、estimate=null 仅存方式、非法 ref 不变、`backfillStopEstimate` 仅在 toNext 已设且快照为空时写入、`moveStop`/`takeStop`/`insertStop` 透传快照、默认展示态 `toNext ?? "drive"` 不写回、存量 `transit` 不改写；验证：测试先红
- [ ] 4.2 `types.ts` 增加 `ToNextEstimate` 类型；实现 `tripActions.setStopTransport` 与 `backfillStopEstimate`；新增 `routeEstimateQueryOptions`（key=景点对+方式，统一 request 层，低重试，有快照/samePoi 时 enabled=false，成功后条件回填）；验证：4.1 测试转绿，`apps/web` vitest 全量通过

## 5. 前端：面板段行与提示

- [ ] 5.1 先写组件/派生单测：n 景点 → n−1 段、末景点无段、0/1 景点与未排期/草稿无段、有快照直接展示且不发请求、无快照展示查询结果/加载态、切换方式清空旧快照并重新估算、打车段（含默认）行内携宠小字提示且步行/同 POI 段不展示、samePoi 仅小字提醒且不发请求不写库、每天一条公交提示（有段时）、失败态「估算暂不可用」不阻塞选择且仅存方式、段行不可拖拽；验证：测试先红
- [ ] 5.2 实现 `trip-panel.tsx` 段行/提醒/公交提示/打车携宠提示渲染与方式选择器接线（快照优先展示 + 乐观更新 + 既有防抖保存 + 成功回填）；验证：5.1 测试转绿，vitest 全量通过，既有拖拽/保存测试无回归
- [ ] 5.3 先写 `lib/trip/day-policy.ts` 纯函数 vitest（D8）：任一景点 `leashRequired=true` → required、叠加档案 `hasLeash=false` → required-no-leash；体重/肩高任一维度档案值严格大于上限 → 该景点入 sizeWarnings（含名称与限额）、等于上限不警示、档案值缺失/缓存未加载/null 政策跳过；poiId 去重、未排期景点不计入、无触发项/空天输出空结果；验证：测试先红
- [ ] 5.4 实现 `lib/trip/day-policy.ts` 并在 `trip-panel.tsx` 每天第一个 StopRow 前渲染政策提醒行（day 标题与公交提示之后；复用 `cache.locations` 与 `activePet`，非拖拽行、不写库、无新增请求；无触发项不渲染）；验证：5.3 测试转绿 + 渲染单测（含提醒行位于首个景点行前）通过，vitest 全量通过

## 6. E2E 与集成验证

- [ ] 6.1 新增途内交通 E2E（`e2e/intra-city-transport.spec.ts`）：选择-保存-刷新后快照恢复且无估算请求（拦截网络断言）、切换方式重新估算并更新快照、每天公交提示、打车段携宠提示（切步行后隐藏）、同 POI 小字提醒、估算失败仅存方式（无 Key 环境）与后续回填、每天首个景点行前政策提醒（牵引绳聚合 + 超限警示点名景点限额、未超限不提示）、段行存在时同日/跨天拖拽回归；验证：`node scripts/run-e2e.mjs` 新旧用例全绿
- [ ] 6.2 全量集成验证：后端 `mvnw test`、前端 vitest + build、E2E 全量；验证：三套命令均通过并记录输出

## 7. 文档收尾

- [ ] 7.1 更新 `docs/knowledge/architecture/README.md`（估算端点与 `RouteEstimatePort`/适配器落地）并复核 external 文档与实现一致；验证：kb-lint 通过
- [ ] 7.2 `openspec validate add-intra-city-transport-estimate --strict` 通过；核对 delta 与实现行为一致（含快照落库/优先展示/回填、同 POI 提醒、每天一条提示、打车携宠提示显隐、政策提醒位置（首个景点行前）与触发规则、默认不写库）

## Workflow follow-up

- P2 完成后：`/sdd:delta-craft` 做 AC/DoV 复核，随后 G1 决策（`/sdd:g1-decision-record`，需人工签署）。
- P3：`/sdd:atdd-design` 与 `/sdd:task-plan` 细化验收层与本清单；缓存 TTL/文案在 P3 收口。
- P4：按 TDD 实现（`/sdd:atdd-apply`），本地验证（`/sdd:local-verify-report`）后提 PR（`/sdd:pr-submit`）。
- G2/G3 人工签署后归档（`/sdd:living-merge`），Living Spec 合并并更新 registry/handoff。