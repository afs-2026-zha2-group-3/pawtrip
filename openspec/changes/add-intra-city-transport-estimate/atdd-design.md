# ATDD 设计 — add-intra-city-transport-estimate

- 阶段：P3（G1 Pass 2026-11-17，IO/SA=kitty）；供 `/sdd:task-plan` 消费
- 输入：3 个 delta specs（trip-route-estimate / trip-context / trip-planning）、`dov-ac-review.md`、`design.md`（D1–D8）
- 规则依据：`@rule:java-testing`（JUnit5 + AssertJ + Mockito）、`@rule:react-testing`（Vitest + RTL，UT 归 apply）、`@rule:pipeline-iac`（GitHub Actions web/server/e2e 三工作流，命令契约 `docs/feedback/verification-commands.md`）
- NFR 专项测试：**不纳入，延后**（用户 2026-11-17 确认；高德配额/耗时风险由 tasks 1.2 真实 Key 冒烟与失败兜底场景覆盖）

## 1. 验收层范围与场景分层

仅设计 **API**（服务端 MockMvc，沿用 `TripApiTest` 模式）与 **E2E**（Playwright，新增 `e2e/intra-city-transport.spec.ts`）两层；纯逻辑项延后到 `/sdd:atdd-apply` 单元级 TDD。

### API 层（`apps/server`，@SpringBootTest + MockMvc + 独立 SQLite 测试库）

| # | 场景主题 | 层 | 依据 |
|---|---|---|---|
| A1 | 估算接口访问控制：未登录 401 / 非本人 404 / 缺参・mode 非法・poiId 不存在 400 | API | 单端点 HTTP 契约 |
| A2 | 换算：taxi_cost 50→40/60（±20%）、61 秒→2 分钟（向上取整）、步行 0/0 | API | mock `RouteEstimatePort` 返回定值，断言响应体 |
| A3 | 估算接口不写库：任意估算请求后详情 `plan_json` 不变 | API | 同一服务边界内 GET 详情即可证明无写入 |
| A4 | 上游失败 / Key 缺失 / 关键字段缺失非数值 → 类型化 502，不泄露 Key 与原始报文 | API | mock port 抛 `RouteEstimateException`，断言 Problem Details |
| A5 | PUT 非法快照拒绝：缺字段/非数值/负值/非整数分钟/low>high → 400 VALIDATION_ERROR | API | 单端点校验契约（扩展 `TripApiTest`） |
| A6 | 快照往返保留 / 可省略 / 存量无快照兼容 / version 保持 1 | API | PUT→GET 详情 roundtrip，真实 validator + DB |

### E2E 层（Playwright，真实前后端 + 种子数据；CI 无高德 Key）

| # | 场景主题 | 层 | 依据 |
|---|---|---|---|
| E1 | n 景点→n−1 段行、末景点无段、0/1 景点/未排期/草稿无段、段行不可拖拽 | E2E | UI 可见行为 |
| E2 | 默认打车展示不写库：查看后 GET 详情 `toNext`/`toNextEstimate` 仍为空 | E2E | 「未写入」需全路径证明 |
| E3 | 快照优先展示且不发估算请求（API 预置快照 + 路由拦截断言零请求） | E2E | 跨刷新持久化 + 网络 absence |
| E4 | 切换方式保存并刷新恢复（CI 无 Key：切步行→估算失败→仅存方式；恢复断言 `toNext=walk`） | E2E | 用户路径 + 持久化；成功估算展示由 A2 覆盖 |
| E5 | 每天一条公交静态提示（有段时）、空天/单景点天不展示 | E2E | UI 可见行为 |
| E6 | 打车携宠提示显隐：打车段（含默认）展示、切步行隐藏、同 POI 段不展示 | E2E | UI 可见行为 |
| E7 | 政策提醒：位置在每天首个景点行前；牵引绳聚合、hasLeash=false 加强、超限警示点名景点限额、未超限/档案缺失/空天/无触发不提示、未排期不计入 | E2E | UI 可见行为 + 档案×政策跨模块 |
| E8 | 同 POI 段仅小字提醒：无价格/时长/选择器、零估算请求、不写库 | E2E | UI + 网络/DB absence |
| E9 | 估算失败兜底：「估算暂不可用」不阻塞选择与保存、仅存方式不写伪造值 | E2E | CI 无 Key 天然失败路径 |
| E10 | 段行存在时同日/跨天拖拽回归（快照随 stop 透传不丢） | E2E | 真实拖拽交互 |

### 延后到 `/sdd:atdd-apply`（单元级 TDD，不在本文展开）

- 适配器参数构造/解析（坐标 ≤6 位、`show_fields=cost`、POI ID、fake `AmapTransport`）
- `lib/trip/day-policy.ts` 纯函数（严格大于/去重/缺失跳过/聚合）
- store actions（`setStopTransport`/`backfillStopEstimate`/透传/revision 递增）与回填竞态守卫
- 组件渲染细节（加载态、选择器接线）；`TripPlanValidator` 单元细节（API 层 A5/A6 已覆盖契约）
- 估算成功后回填快照的前端行为（CI 无 Key 不可 E2E；store UT + 本地真实 Key 冒烟覆盖）

## 2. 先于生产代码编写的验收检查（red）

1. `TripRouteEstimateApiTest`（新增，A1–A4）：`@MockitoBean RouteEstimatePort` 定值/抛异常，先红
2. `TripApiTest` 扩展（A5/A6）：快照校验与 roundtrip 用例，先红（当前 validator 丢弃字段 → roundtrip 必红）
3. `e2e/intra-city-transport.spec.ts`（E1–E10）：先写断言骨架跑红，再进入实现
4. 实现顺序遵循 tasks.md TDD 分组；UT 红绿归 apply

## 3. 本地与 CI 门禁（对齐 `@rule:pipeline-iac`，不新增门禁）

| 层 | 本地命令 | CI 工作流 |
|---|---|---|
| API/UT（server） | `apps/server` 下 `mvnw test` | `server.yml`：`./mvnw -B test` |
| 前端 UT + 构建 | `apps/web` vitest + `npm run build` | `web.yml`：`npm ci` + `npm run build` |
| E2E | `node scripts/run-e2e.mjs` | `e2e.yml`：`CI=true npm run test:e2e`（chromium） |

- 命令契约 `docs/feedback/verification-commands.md` 不变（无新增门禁）；纯文档提交不触发 CI
- CI 无 `AMAP_API_KEY`：E2E 只走确定性路径（失败兜底 + 预置快照）；真实 Key 冒烟为本地任务（tasks 1.2），不进 CI

## 4. 数据 / fixtures 策略

- **API**：沿用 `TripApiTest` 模式——独立 SQLite 测试库（`target/*.db`，`@DynamicPropertySource` 重置）、真实 repository 写入用户/宠物/景点（含坐标）、`@MockitoBean RouteEstimatePort` 隔离高德；每用例自建数据，无共享清理负担
- **E2E 账号/宠物**：沿用 `seed-users.mjs` worker 账号 `petowner-wN`（豆豆 CAT 4.5kg/25cm hasLeash=1；毛毛 DOG 38kg/55cm hasLeash=1）；**hasLeash=false 加强场景**由用例内 `POST /api/pets` 新建专用档案并在激活行程时绑定（不改既有种子，避免影响 paws 既有用例计数）
- **E2E 景点**：沿用 `seed-e2e-attractions.mjs`——珠海 `e2e-zhu-a`（8.5kg/40cm、leash=1）/`e2e-zhu-b`（leash=1）/`e2e-zhu-c`（leash=1）/`e2e-zhu-d`（政策全 null）；杭州 `e2e-hz-a`（10kg、leash=1）。**坐标现为 NULL** → 估算确定性失败（E9 天然 fixture）；E3/E4 快照路径经 `PUT /api/trips/{id}` 预置合法 `toNextEstimate`，不依赖坐标与 Key
- **超限/未超限配对**：毛毛 38kg/55cm 对 `e2e-zhu-a`（8.5kg/40cm）→ 双维度超限警示；豆豆 4.5kg/25cm → 未超限不提示；`e2e-zhu-d` 全 null → 无触发不提醒
- **清理**：沿用 `trip-helpers.ts` `resetTrips`（每用例前清空行程）；新建宠物用例内自行删除；种子脚本幂等（`DELETE e2e-%` 重插）
- **网络断言**：`page.route` 拦截 `/api/trips/*/route-estimate` 计数（E3 零请求、E8 零请求、E2 无额外 PUT）

## 5. Non-goals 与反向验证

本文档不产出：业务实现代码、UT 套件设计、Playwright/POM/Excel 生成器、新 CI 产品。

| Non-goal（proposal 范围外） | 反向验证 | 层 |
|---|---|---|
| 租车 | 方式选择器无「租车」选项 | E2E |
| 公共交通算路/可选 | 无公交/地铁选项；拦截断言无 transit 估算请求 | E2E |
| 站内叫车/实时计价 | 段行无叫车/预订按钮；费用为静态区间语义 | E2E |
| 可携宠筛选（Release 2） | 面板无新增宠物友好筛选控件 | E2E |
| 新增导航 Tab/路由 | 导航项数量与既有一致 | E2E |
| 估算 API 写库 | A3：估算后 plan_json 不变 | API |
| 政策提醒写库/新后端接口 | E7 附带：提醒渲染后无额外 PUT、无新增 API 请求 | E2E |
| plan_json 破坏性变更 | A6：version=1、存量计划无回归 | API |
| 默认展示写库 | E2：查看后 toNext/快照仍为空 | E2E |

## 6. 残余与移交

- 成功估算的端到端展示（真实高德）仅本地冒烟（tasks 1.2），CI 不覆盖——已在 G1 知悉项登记
- 回填快照 E2E 不可行（CI 无 Key）→ store UT + 本地冒烟；`/sdd:task-plan` 需将其排入 apply 任务
- 下一步：`/sdd:task-plan`（细化 tasks.md 与 Spec/Design/ATDD 对齐自检）