# Tasks

- 依据：`specs/destination-selection/spec.md`、`specs/web-app-shell/spec.md`（行为契约）；`design.md`（D1–D7 技术决策）；`atdd-design.md`（A/E 用例编号与 red 顺序、`@profile-dependency` 门控）
- 外部依赖：宠物档案由 US-01 change 交付（breed/读取接口/`/paws`）；本清单不含档案实现，相关用例见组 5

## 1. 数据地基与候选接口（后端）

- [x] 1.1 摘录珠海/杭州政策收录状态与禁养犬种名单（政府公开文件，逐条记录来源与更新时间；核对品种用词与原型 BREEDS 词表一致，词表外品种先标记待协调）——验证：产出种子数据清单，每条含 source/updated，词表覆盖核对记录
- [x] 1.2 编写 `DestinationApiTest`（atdd-design A1–A4：401 Problem Details、候选响应含两城收录状态与名单、条目来源字段、无选定写入端点；附带断言管理 API 无禁养名单维护端点）——验证：`./mvnw test` 新用例按预期红
- [x] 1.3 新增 Flyway 迁移（版本号按 design D3 避让外部 V8/V9）：`administrative_region` 加 `policy_covered`（候选范围由该列驱动，无 pilot 列），新表 `region_banned_breed`，注入 1.1 种子；同步 JPA 实体与 repository——验证：新增 schema/迁移测试断言列、表、种子行通过（参照 `LocationSchemaMigrationTest` 模式）
- [x] 1.4 实现 `GET /api/destinations` 只读接口（DTO：adcode/name/province/policyCovered/bannedBreeds[]，纳入既有认证链）——验证：A1–A4 转绿
- [x] 1.5 `docs/knowledge/architecture/README.md` 增补 destination 模块、数据契约与迁移说明——验证：文档与实际接口/表结构一致

## 2. 前端状态与纯函数

- [x] 2.1 localStorage 选定目的地工具 + 订阅 hook（键 `pawtrip.selectedDestination`，读写/覆盖/清除，design D4）——验证：单元测试覆盖读/写/重选覆盖/清除/订阅通知，绿
- [x] 2.2 禁养匹配与筛选谓词纯函数（精确匹配；空/「其他」/未收录短路；无档案退化 covered-only，design D1/D5）——验证：单元测试覆盖上述分支，绿
- [ ] 2.3 cities query + pet-profile 只读 adapter（请求失败/无档案按「无档案」退化，design D6）——验证：adapter 单元测试（错误→退化）绿；开发环境 `/cities` 能取回候选数据

## 3. /cities 目的地选择页

- [ ] 3.1 先写 E2E E1/E2（两城卡片+收录 Badge；搜索「杭州」/「广东」+计数；无结果空态）再实现候选列表与搜索——验证：`e2e/destination-selection.spec.ts` E1/E2 绿
- [ ] 3.2 先写 E2E E3/E5/E16（无档案退化筛选、关闭恢复全部、仅政策维度）再实现筛选开关与计数——验证：对应用例绿
- [ ] 3.3 先写 E2E E7/E8（选定确认提示承载规划上下文；刷新/重进保留）再实现选定交互与持久化——验证：对应用例绿
- [ ] 3.4 先写 E2E E15 反向用例（页面不出现政策条文详情内容/入口）随实现落地——验证：E15 绿

## 4. 应用外壳（chip / 登出 / 导航回归）

- [ ] 4.1 先写 E2E E12/E9（顶栏 chip 已选/未选；重选后同步）再实现 `__root.tsx` chip——验证：对应用例绿
- [ ] 4.2 先写 E2E E13（确认登出→回 `/login`+清缓存+清已选目的地）再实现登出清理；回归 E14（三 Tab 与 `/cities` 同步、管理 Tab 与 `/admin/cities` 守卫）——验证：E13/E14 绿，既有 `authentication.spec.ts`、`admin-location-management.spec.ts` 保持绿
- [ ] 4.3 `docs/knowledge/architecture/README.md` 增补前端选定状态约定（localStorage 键、登出清除、chip 数据源）——验证：文档与实现一致

## 5. 外部依赖门控用例（档案品种相关）

- [ ] 5.1 编写 E2E E4/E6/E10/E11（品种命中筛选、禁养 Badge、命中仍可选定+提醒、未命中无提醒）并以 `test.fixme` 挂起，注明依赖 US-01 change 的 breed/读取接口契约——验证：用例存在且被跳过，运行报告可见 fixme 标注；fixture 方案按 atdd-design §5 预留

## 6. 集成验证（仅跨组整体检查）

- [ ] 6.1 后端全量测试——验证：`./mvnw test` 全绿（含既有回归）
- [ ] 6.2 E2E 全量——验证：`npm run test:e2e` 全绿（与 CI 相同用例；fixme 门控用例除外）
- [ ] 6.3 规格覆盖核对——验证：`openspec validate destination-selection --strict` 通过；13 条 requirement 的 scenario 与 A/E 用例对照无遗漏（门控项显式标注）；diff 审查确认未新增档案端点、未改 `/paws`（Non-goal 反向验证）

## Workflow follow-up

- 外部档案 change 交付后：核对 breed 词表与 adapter 契约，解除组 5 `test.fixme` 并转绿（E4/E6/E10/E11），必要时补联调修复
- G2 人工决策后进入 P4 apply/verify；本地验证报告（/sdd:local-verify-report）；PR 提交需用户明确授权，不推送
- P5：living-merge 时同步 `web-app-shell` 主 spec Purpose（lint L1）；归档前完成 change-summary 与 G3