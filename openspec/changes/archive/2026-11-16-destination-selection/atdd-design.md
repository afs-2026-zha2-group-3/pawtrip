# ATDD Design — destination-selection

- 日期：2026-11-16（P3，G1 Pass 后；同日需求方修订：移除 V14 政策数据，候选=全部城市级行政区，政策判断 TODO）
- 上游：`specs/destination-selection/spec.md`（7 需求）、`specs/web-app-shell/spec.md`（6 需求）、`dov-ac-review.md`、`consistency-lint.md`（L5 外部依赖）
- 消费方：`design.md` / `tasks.md`（/sdd:task-plan）

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `@SpringBootTest` + `@AutoConfigureMockMvc` + 独立 SQLite（`target/*.db`），参照 `AdminLocationApiTest` 模式；新增 `apps/server/.../destination/DestinationApiTest.java` | 单端点契约：城市级候选列表、政策占位字段、401、keyword/petFriendly 服务端筛选 |
| E2E | Playwright，新增 `e2e/destination-selection.spec.ts`；导航/守卫/登出扩展既有 `authentication.spec.ts`、`admin-location-management.spec.ts` 或在新 spec 内覆盖 | 用户可见路径：搜索→筛选→选定→chip→登出清除（禁养提醒暂缓 TODO） |
| Defer UT | 前端禁养匹配纯函数、sessionStorage 选定状态工具 | apply 期 unit-level TDD，本文不展开 UT 套件 |

外部依赖门控：凡需要「档案品种 × 政策数据」输入的用例标 `@profile-dependency`，先编写、以 `test.fixme` 挂起并注明依赖（breed 已随 PR #41 交付；门控仅剩政策数据源 TODO，确定后启用）；无档案分支（退化筛选、未选 chip、登出清除）不受阻塞。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 建议附加 | 依据 |
|---|---|---|---|---|
| A1 | 未认证请求候选接口 → 401 + `code=UNAUTHENTICATED`（候选列表） | API | Security（advisory，待确认） | 单端点状态码/Problem Details |
| A2 | 候选响应为全部城市级行政区（含珠海/杭州）与省份；政策字段占位 false/空数组（候选列表/政策占位契约，2026-11-16 修订） | API | — | 单端点 body 契约 |
| A3 | ~~禁养名单条目含来源政府文件与更新时间~~（V14 移除，数据源就绪后恢复） | API | — | 暂缓 TODO |
| A4 | 反向：不存在选定目的地写入端点（Non-goal 服务端持久化） | API | — | 无 POST/PUT 选定路由 |
| A5 | `keyword` 服务端过滤：城市名/省份命中、trim、无结果空数组（城市搜索，2026-11-16 修订） | API | — | 查询参数契约 |
| A6 | `petFriendly=true` 按限养数过滤：null/>=1 保留、0 排除；与 keyword 组合（宠物友好筛选，2026-11-16 修订） | API | — | 查询参数契约 |
| A7 | 候选响应含 `allowedPetTypes`/`allowedDogBreedIds`，与行政区配置一致（叠加匹配，2026-11-16 增强） | API | — | 响应字段契约 |
| A8 | `petFriendly=true&petType=DOG/CAT`：类型 null=不允许排除、包含保留；未传 petType 退化仅限养数（叠加匹配，2026-11-16 修订） | API | — | 查询参数契约 |
| A9 | `petType=DOG&breedId`：允许列表空=未配置放行、非空须含 id；CAT 跳过品种层；未开筛选不参与（叠加匹配） | API | — | 查询参数契约 |
| A10 | `petType` 非法值 → 400（叠加匹配） | API | — | 枚举绑定 |
| A11 | `shoulderHeightCm`：城市上限 null=不限制保留、超限排除；响应含 `maxSinglePetShoulderHeightCm`（叠加匹配肩高维度） | API | — | 查询参数契约 |
| A12 | V16 全城市种子：全部城市级行政区 `allowed_pet_types='CAT,DOG'` + 7 个非烈性允许品种含哈士奇（全城市种子） | API | — | 迁移数据契约 |
| E1 | 打开 `/cities` 展示城市级候选卡片（含两城，无政策 Badge）（候选列表） | E2E | — | UI 可见 |
| E2 | 搜索「杭州」/「广东」过滤 + 计数；无结果空态（城市搜索） | E2E | — | UI 交互 |
| E3 | 启用筛选 → 默认无限养数城市全保留（宠物友好筛选） | E2E | — | 不依赖外部档案 |
| E4 | 有档案品种命中启用筛选 → 仅未命中城市（宠物友好筛选） | E2E `@profile-dependency` | — | 需政策数据源（breed 已交付） |
| E5 | 关闭筛选恢复全部候选（宠物友好筛选） | E2E | — | UI 交互 |
| E6 | 命中城卡片「档案品种禁养」Badge；「其他」/未收录不触发（禁养犬种匹配） | E2E `@profile-dependency`（未收录分支无档案可测） | — | UI Badge |
| E7 | 选定杭州 → 确认提示承载规划上下文（选定目的地） | E2E | — | UI 可见 |
| E8 | 刷新/重进 `/cities` 选定保留（选定目的地） | E2E | — | 同标签页会话内刷新保留（sessionStorage） |
| E9 | 重选珠海覆盖 + 顶栏 chip 同步（选定目的地/顶栏上下文） | E2E | — | 跨页面状态 |
| E10 | 命中禁养仍可选定 + 高亮提醒持续（选定时禁养提醒） | E2E `@profile-dependency` | — | 需政策数据源（breed 已交付） |
| E11 | 未命中不展示禁养提醒（选定时禁养提醒） | E2E `@profile-dependency` | — | 需政策数据源（breed 已交付） |
| E12 | 顶栏 chip 已选「杭州」/未选「目的地未选」（顶栏上下文） | E2E | — | UI 可见 |
| E13 | 确认登出 → 回 `/login` + 清缓存 + 清已选目的地（受保护路由） | E2E | — | 全路径状态 |
| E14 | 导航三 Tab + `/cities` 同步/守卫；管理 Tab 与 `/admin/cities` 守卫（web-app-shell 5 需求） | E2E | — | 跨页面导航；既有 spec 回归 |
| E15 | 反向：`/cities` 不展示政策条文详情（Non-goal #14） | E2E | — |  absence 断言 |
| E16 | 反向：筛选仅宠物友好维度，无设施/评价参与（Non-goal Release 2） | E2E | — | 单一筛选开关 |
| E17 | 匹配标签（绿/红/类型 null 红）+ 叠加筛选仅珠海保留 + 肩高上限收紧后排除（叠加匹配/匹配标签；admin 建档案避免并行干扰，node:sqlite 配置城市政策） | E2E | — | UI 可见 + 计数 |
| E18 | 已选定再点取消：Alert/chip/sessionStorage 清除，可重新选定（取消选定） | E2E | — | UI 交互 |

## 3. 先于生产代码编写（red 顺序）

1. A1–A4 API 验收先红 → 驱动候选只读接口实现（政策数据迁移已按需求方移除，占位字段随接口交付）
2. E1–E3、E5、E7–E9、E12–E14 先红 → 驱动 `/cities` 页面、sessionStorage 工具、顶栏 chip 与登出清理
3. E4/E6/E10/E11 同步编写但 `test.fixme` 挂起（注明外部契约）；外部 change 合并后转绿验证
4. E15/E16 反向用例随主体一起红→绿

## 4. 本地 vs CI 门禁（对齐既有 Rules，不新造语义）

- 本地：`./mvnw test`（API 层）；`npm run test:e2e`（与 CI 相同用例；headed 模式用系统 Chrome，见 browser-e2e-testing spec）
- CI：既有 GitHub Actions 工作流；E2E 用 Playwright Chromium 无头，任一失败即阻断
- 回归：既有 auth/admin/location E2E 与后端测试必须保持绿（Non-goal「不改动既有契约」的验证方式）

## 5. 数据 / fixtures 策略

- API：每测试类独立 SQLite（`target/destination-api-test.db`，`@DynamicPropertySource` 重置）；候选来自既有 V5 行政区种子（无政策种子，V14 已移除）；认证用 `SecurityMockMvcRequestPostProcessors.user()`；不 mock 数据访问
- E2E：独立 E2E SQLite（`scripts/run-e2e.mjs` 现有隔离机制），测试账号走 `seed:users`；MUST NOT 触碰开发库
- 档案 fixture（依赖就绪后）：向 E2E 库 pet 表直接写入品种行，或经外部 `/paws` UI 创建；词表与未来禁养数据同一词表（比特犬/柯基等）；政策数据 fixture 待数据源确定后补充
- 清理：E2E 每轮重置专用库；API 每类重置；sessionStorage 随新上下文天然清空，登出用例顺带验证清除

## 6. Non-goals 与反向验证

| Non-goal | 反向用例 | 层 |
|---|---|---|
| 政策条文详情页（#14） | E15：`/cities` 无政策条文详情内容/入口 | E2E |
| 管理端禁养名单维护界面 | 管理页无禁养编辑入口；管理 API 无禁养维护端点（随 A 组断言路由面） | E2E/API |
| 选定目的地服务端持久化 | A4：无选定写入端点；候选接口无选定状态字段 | API |
| 宠物档案实现（外部 change） | 本 change 不新增档案读写端点、不改 `/paws` 路由内容（diff 审查 + 路由面断言） | API/审查 |
| 设施/评价维度筛选 | E16 | E2E |
| 不改既有认证/错误/高德/地点管理行为 | 既有测试全量回归绿 | API+E2E |

本 skill 不写业务代码、不展开 UT 套件、不生成 Playwright/POM/Excel 生成器、不新造 CI 产品。

## 7. NFR 测试（已确认 out-of-scope）

用户 2026-11-16 确认不纳入：本 change 无 SLA/并发/可观测性新需求，仅 API + E2E 功能验收。

## 8. Defer UT 清单（apply 期 TDD）

- 禁养匹配纯函数（精确匹配、空/「其他」短路；仅 Badge/提醒用途）
- sessionStorage 选定状态读写/清除工具
- ~~筛选谓词~~（2026-11-16 修订：搜索/筛选移至服务端，由 A5/A6 API 用例覆盖）