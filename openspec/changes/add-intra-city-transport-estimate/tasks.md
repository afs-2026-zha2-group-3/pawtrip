# Tasks

> P3 细化任务清单（G1 Pass 2026-11-17，IO/SA=kitty；同日第 5 轮大交通自驾联动修订已同步，G1 Revision 2 Pass 2026-11-17 重签）。设计依据：[design.md](design.md)（D1–D9）与 [atdd-design.md](atdd-design.md)（API A1–A7 / E2E E1–E13 分层、fixtures、Non-goal 反向验证）；复核：[dov-ac-review.md](dov-ac-review.md)、[g1-decision.md](g1-decision.md)。实现遵循 ATDD：验收检查先红，UT 红绿归 `/sdd:atdd-apply`。

## 1. 前置：知识库与高德冒烟

- [x] 1.1 将已核对的高德路线规划 2.0 文档（驾车/步行端点、`show_fields=cost`、`taxi_cost`、坐标 ≤6 位小数、`origin_id`/`destination_id`）补入 `docs/knowledge/external/`，并更新 `docs/knowledge/architecture/README.md` 的端口/适配器说明；验证：文档含参数与返回字段表，`scripts/kb-lint.sh`（Git Bash）通过
- [x] 1.2 用真实 `AMAP_API_KEY` 冒烟 `GET /v5/direction/driving` 与 `/v5/direction/walking`（含 `show_fields=cost`），确认 Key 权限与 `taxi_cost` 可用；验证：记录两请求的响应样例（脱敏）于 change 目录，失败则升级用户决策

## 2. 服务端：路线规划端口与适配器

- [x] 2.1 先写适配器单测（fake `AmapTransport`）：驾车/步行参数构造（坐标 ≤6 位、`show_fields=cost`、POI ID）、`taxi_cost`/`duration` 解析、缺失/非数值/上游失败/Key 缺失的类型化异常；验证：测试先红
- [x] 2.2 新增 `application.model.maps` 估算请求/结果 record、`application.port.maps.RouteEstimatePort`、`infrastructure.amap.api.AmapRouteEstimateAdapter` 与 `RouteEstimateException`；验证：2.1 测试转绿（`apps/server` 下 `mvnw test`）
- [x] 2.3 先写 `GlobalExceptionHandler` 映射单测（`RouteEstimateException` → `UPSTREAM_FAILURE` 502，不泄露 Key/原始报文），再实现映射；验证：映射测试通过

## 3. 服务端：估算端点与换算

- [x] 3.1 先写 API 验收 `TripRouteEstimateApiTest`（ATDD A1–A4：MockMvc + 独立 SQLite 测试库 + `@MockitoBean RouteEstimatePort`）：未登录 401、非本人 404、缺参/mode 非法/poiId 不存在 400、±20% 区间与分钟向上取整、步行 0/0、上游失败/Key 缺失 502 不泄露 Key、估算后 plan_json 不变；同步先写 `TripRouteEstimateService` 单测（坐标缺失 400、换算边界）；验证：测试先红
- [x] 3.2 实现 `TripRouteEstimateService` 与 `TripController` 的 `GET /{tripId}/route-estimate` 端点及响应 record；验证：3.1 测试转绿，`mvnw test` 全量通过（含既有 trip 测试无回归）
- [x] 3.3 先写 `TripApiTest` 快照与枚举扩展（ATDD A5/A6/A7：非法快照缺字段/非数值/负值/非整数分钟/low>high → 400；合法快照 PUT→详情往返原样保留；`toNext=self_drive` 合法且往返保留（快照费用 0/0）、枚举外值仍 400；可省略/存量无快照兼容、version 保持 1）与 `TripPlanValidator`/`TripPlan.TripStop` 快照单测；验证：测试先红（当前 validator 丢弃字段且枚举不含 self_drive，roundtrip/枚举必红）
- [x] 3.4 扩展 `TripPlan.TripStop` record 与 `TripPlanValidator.parseStops` 解析/校验/序列化（D7），`toNext` 合法枚举扩展 `{walk, drive, transit, self_drive}`（D9）；验证：3.3 测试转绿，`mvnw test` 全量通过

## 4. 前端：store 动作与估算查询

- [x] 4.1 先写 vitest：`setStopTransport(ref, toNext, estimate)` 同时写入 `toNext`（含 `self_drive`）与 `toNextEstimate` 并递增 `saveRevision`、estimate=null 仅存方式、非法 ref 不变、`backfillStopEstimate` 仅在 toNext 已设且快照为空时写入、`moveStop`/`takeStop`/`insertStop` 透传快照、默认展示态 `toNext ?? (transportMode==="drive" ? "self_drive" : "drive")` 不写回、存量 `transit` 不改写、切换 `transportMode` 不改写已存 toNext/快照；验证：测试先红
- [x] 4.2 `types.ts` 增加 `ToNextEstimate` 类型与 `toNext` 枚举 `self_drive`；实现 `tripActions.setStopTransport` 与 `backfillStopEstimate`；新增 `routeEstimateQueryOptions`（key=景点对+方式，统一 request 层，低重试，有快照/samePoi 时 enabled=false，驾车 self_drive 复用 mode=drive 仅取时长、落库快照费用 0/0，成功后条件回填）；验证：4.1 测试转绿，`apps/web` vitest 全量通过。注：回填快照行为由本组 UT + 1.2 本地真实 Key 冒烟覆盖（CI 无 Key，E2E 不可行，ATDD §6）

## 5. 前端：面板段行与提示

- [ ] 5.1 先写组件/派生单测：n 景点 → n−1 段、末景点无段、0/1 景点与未排期/草稿无段、有快照直接展示且不发请求、无快照展示查询结果/加载态、切换方式清空旧快照并重新估算、打车段（含非自驾默认与自驾模式切为打车的段）行内携宠小字提示且驾车/步行/同 POI 段不展示、samePoi 仅小字提醒且不发请求不写库、每天一条公交提示（有段且大交通非自驾时）、失败态「估算暂不可用」不阻塞选择且仅存方式、段行不可拖拽；自驾联动（D9）：transportMode=drive 时默认驾车仅时长无费用不写库、「选择其他途内交通方式」下拉（打车/步行）与可显式选回的驾车、显式选驾车写 self_drive + 费用 0/0 快照、公共交通/未选择选择器无驾车选项、切换大交通不改写已存值；验证：测试先红
- [ ] 5.2 实现 `trip-panel.tsx` 段行/提醒/公交提示/打车携宠提示渲染与方式选择器接线（快照优先展示 + 乐观更新 + 既有防抖保存 + 成功回填；选择器与提示显隐按 `active.transportMode` 派生，D4/D9）；验证：5.1 测试转绿，vitest 全量通过，既有拖拽/保存测试无回归
- [ ] 5.3 先写 `lib/trip/day-policy.ts` 纯函数 vitest（D8）：任一景点 `leashRequired=true` → required、叠加档案 `hasLeash=false` → required-no-leash；体重/肩高任一维度档案值严格大于上限 → 该景点入 sizeWarnings（含名称与限额）、等于上限不警示、档案值缺失/缓存未加载/null 政策跳过；poiId 去重、未排期景点不计入、无触发项/空天输出空结果；验证：测试先红
- [ ] 5.4 实现 `lib/trip/day-policy.ts` 并在 `trip-panel.tsx` 每天第一个 StopRow 前渲染政策提醒行（day 标题与公交提示之后；复用 `cache.locations` 与 `activePet`，非拖拽行、不写库、无新增请求；无触发项不渲染）；验证：5.3 测试转绿 + 渲染单测（含提醒行位于首个景点行前）通过，vitest 全量通过

## 6. E2E 与集成验证

- [ ] 6.1 新增途内交通 E2E（`e2e/intra-city-transport.spec.ts`，ATDD E1–E13；断言骨架可先于面板实现写红）：段行生成/边界/不可拖拽、默认不写库（GET 详情断言，含自驾默认驾车 E11）、预置快照（PUT 合法 toNextEstimate，含 self_drive+0/0）优先展示且零估算请求（page.route 拦截）、切换方式仅存方式并刷新恢复（CI 无 Key）、每天公交提示（非自驾时）、打车携宠提示显隐（含驾车段不展示）、政策提醒（首个景点行前；毛毛 38kg/55cm × e2e-zhu-a 8.5kg/40cm 超限警示、豆豆未超限不提示、hasLeash=false 用例内新建档案、e2e-zhu-d 全 null 不提醒）、同 POI 小字提醒零请求、估算失败兜底（种子坐标 NULL 天然失败）、拖拽回归；自驾联动（E11–E13）：PUT 设 transportMode=drive → 默认驾车仅时长/兜底态不写库、下拉选打车仅存方式+携宠提示、显式切回驾车写 self_drive、自驾隐藏公交提示（政策提醒仍在）、切回公共交通恢复默认打车/公交提示且已存选择不改写（GET 详情）、公共交通选择器无驾车选项；Non-goal 反向（无租车/公交选项/叫车按钮/筛选控件/新 Tab/规则页无改动）；验证：`node scripts/run-e2e.mjs` 新旧用例全绿
- [ ] 6.2 全量集成验证：后端 `mvnw test`、前端 vitest + build、E2E 全量；验证：三套命令均通过并记录输出

## 7. 文档收尾

- [ ] 7.1 更新 `docs/knowledge/architecture/README.md`（估算端点与 `RouteEstimatePort`/适配器落地）并复核 external 文档与实现一致；验证：kb-lint 通过
- [ ] 7.2 `openspec validate add-intra-city-transport-estimate --strict` 通过；核对 delta 与实现行为一致（含快照落库/优先展示/回填、同 POI 提醒、每天一条提示（非自驾时）、打车携宠提示显隐、政策提醒位置（首个景点行前）与触发规则、默认不写库、大交通自驾联动（默认驾车/下拉切换/显式选驾车写库/公交提示隐藏/切换不改写）与 self_drive 枚举）

## Workflow follow-up

- P2 完成后：`/sdd:delta-craft` 做 AC/DoV 复核，随后 G1 决策（`/sdd:g1-decision-record`，需人工签署）。
- P3：`/sdd:atdd-design` 与 `/sdd:task-plan` 细化验收层与本清单；缓存 TTL/文案在 P3 收口。
- P4：按 TDD 实现（`/sdd:atdd-apply`），本地验证（`/sdd:local-verify-report`）后提 PR（`/sdd:pr-submit`）。
- G2/G3 人工签署后归档（`/sdd:living-merge`），Living Spec 合并并更新 registry/handoff。

## 对齐自检（Spec ↔ Design ↔ Tasks ↔ ATDD，2026-11-17，含第 5 轮大交通自驾联动修订）

| 检查 | 结果 | 说明 |
|---|---|---|
| Delta 需求 → 任务覆盖 | Pass | trip-route-estimate 3 需求→组 2/3（A1–A4）；trip-planning 快照+self_drive 契约→3.3/3.4（A5/A6/A7）；trip-context 8 需求（含大交通自驾联动）→组 4/5/6（E1–E13） |
| Design D1–D9 → 任务落点 | Pass | D1–D3→组 2/3；D4→5.1/5.2；D5/D6→组 4；D7→3.3/3.4；D8→5.3/5.4；D9→3.3/3.4（枚举）+4.1/4.2（派生/self_drive）+5.1/5.2（选择器/提示显隐）+6.1（E11–E13） |
| ATDD 分层约束 | Pass | API 验收先红（3.1/3.3 含 A7）；E2E 骨架可先红（6.1）；UT 红绿归 apply；CI 无 Key 确定性路径（预置快照含 self_drive + 坐标 NULL 失败 + PUT 设 transportMode）；回填不进 E2E（4.2 注） |
| Non-goal 反向验证 | Pass | 6.1 含 6 条 UI 反向（含规则页无改动）；A3/A6/A7/E2/E7/E11/E13 覆盖不写库/无新接口/无破坏性变更/切换不改写 |
| 门禁与命令契约 | Pass | mvnw test / vitest+build / run-e2e 对齐 pipeline-iac 三工作流，无新增门禁 |
| NFR | Pass（延后） | 用户确认不纳入，atdd-design.md 已记录 |

自检结论：**Pass**，计划完整（含第 5 轮修订）；G1 Revision 2 已 Pass（2026-11-17），P3 收口检查 `/sdd:quality-checklist` 后下一步 `/sdd:atdd-apply`（P4，前置 tasks 1.1/1.2）。