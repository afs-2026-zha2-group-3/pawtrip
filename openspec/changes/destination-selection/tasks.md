# Tasks

- 依据：`specs/destination-selection/spec.md`、`specs/web-app-shell/spec.md`（行为契约）；`design.md`（D1–D7 技术决策）；`atdd-design.md`（A/E 用例编号与 red 顺序、`@profile-dependency` 门控）
- 外部依赖：宠物档案由 US-01 change 交付（breed/读取接口/`/paws`）；本清单不含档案实现，相关用例见组 5

## 1. 数据地基与候选接口（后端）

- [x] 1.1 ~~摘录珠海/杭州政策收录状态与禁养犬种名单~~（2026-11-16 需求方移除 V14，种子数据任务作废；摘录稿见 `seed-data.md` 存档，数据源确定后可复用）
- [x] 1.2 编写 `DestinationApiTest`（atdd-design A1–A4：401 Problem Details、候选响应、无选定写入端点；附带断言管理 API 无禁养名单维护端点）——验证：`./mvnw test` 新用例按预期红
- [x] 1.3 ~~新增 Flyway 迁移（policy_covered + region_banned_breed + 种子）~~（2026-11-16 需求方移除，见 1.7）
- [x] 1.4 实现 `GET /api/destinations` 只读接口（DTO：adcode/name/province/policyCovered/bannedBreeds[]，纳入既有认证链）——验证：A1–A4 转绿
- [x] 1.5 `docs/knowledge/architecture/README.md` 增补 destination 模块、数据契约与迁移说明——验证：文档与实际接口/表结构一致
- [x] 1.6 候选接口增加 `keyword`/`petFriendly` 服务端搜索与筛选（2026-11-16 需求方修订，design D5）——验证：A5/A6 API 用例红→绿
- [x] 1.7 移除 V14 政策数据（2026-11-16 需求方修订，design D2/D3）：删除迁移/禁养实体与仓库/`policyCovered` 列映射；候选改为 `level='city'` 全量；政策 Badge/提醒判断点留 TODO，DTO 占位 false/空数组；前端移除政策 Badge/禁养提醒/「筛选口径」行（留 TODO）；E2E 计数与 Badge 断言同步调整——验证：后端全量绿、vitest/tsc 绿、E2E 全绿
- [x] 1.8 宠物友好筛选按每人限养数落地（2026-11-16 需求方指定，design D5）：`max_pets_per_person` null 或 >=1 即友好，0 排除，不再 TODO——验证：A6 API 用例覆盖排除/保留/keyword 组合，绿

## 2. 前端状态与纯函数

- [x] 2.1 sessionStorage 选定目的地工具 + 订阅 hook（键 `pawtrip.selectedDestination`，读写/覆盖/清除，design D4；2026-11-16 需求方修订 localStorage→sessionStorage）——验证：单元测试覆盖读/写/重选覆盖/清除/订阅通知，绿
- [x] 2.2 禁养匹配纯函数（精确匹配；空/「其他」短路；仅 Badge/选定提醒用途，搜索/筛选已移至服务端，design D1/D5）——验证：单元测试覆盖上述分支，绿
- [x] 2.3 cities query + pet-profile 只读 adapter（请求失败/无档案按「无档案」退化，design D6）——验证：adapter 单元测试（错误→退化）绿；开发环境 `/cities` 能取回候选数据

## 3. /cities 目的地选择页

- [x] 3.1 先写 E2E E1/E2（全部城市级候选卡片；搜索「杭州」/「广东」+计数；无结果空态）再实现候选列表与搜索（keyword 参数驱动 query，防抖 300ms）——验证：`e2e/destination-selection.spec.ts` E1/E2 绿
- [x] 3.2 先写 E2E E3/E5/E16（限养数筛选默认全保留、关闭恢复全部、无「筛选口径」注记行）再实现筛选开关与计数（petFriendly 参数驱动）——验证：对应用例绿
- [x] 3.3 先写 E2E E7/E8（选定确认提示承载规划上下文；刷新/重进保留）再实现选定交互与持久化——验证：对应用例绿
- [x] 3.4 先写 E2E E15 反向用例（页面不出现政策条文详情内容/入口）随实现落地——验证：E15 绿

## 4. 应用外壳（chip / 登出 / 导航回归）

- [x] 4.1 先写 E2E E12/E9（顶栏 chip 已选/未选；重选后同步）再实现 `__root.tsx` chip——验证：对应用例绿
- [x] 4.2 先写 E2E E13（确认登出→回 `/login`+清缓存+清已选目的地）再实现登出清理；回归 E14（三 Tab 与 `/cities` 同步、管理 Tab 与 `/admin/cities` 守卫）——验证：E13/E14 绿，既有 `authentication.spec.ts`、`admin-location-management.spec.ts` 保持绿
- [x] 4.3 `docs/knowledge/architecture/README.md` 增补前端选定状态约定（sessionStorage 键、登出清除、chip 数据源）——验证：文档与实现一致

## 5. 外部依赖门控用例（档案品种相关）

- [x] 5.1 编写 E2E E4/E6/E10/E11（品种命中筛选、禁养 Badge、命中仍可选定+提醒、未命中无提醒）并以 `test.fixme` 挂起，注明依赖政策数据源（TODO）与 US-01 change 的 breed/读取接口契约——验证：用例存在且被跳过，运行报告可见 fixme 标注；fixture 方案按 atdd-design §5 预留

## 6. 集成验证（仅跨组整体检查）

- [x] 6.1 后端全量测试——验证：`./mvnw test` 全绿（含既有回归）
- [x] 6.2 E2E 全量——验证：`npm run test:e2e` 全绿（与 CI 相同用例；fixme 门控用例除外）
- [x] 6.3 规格覆盖核对——验证：`openspec validate destination-selection --strict` 通过；两份 delta spec 共 12 条 requirement（destination-selection 6 + web-app-shell 6）的 scenario 与 A/E 用例对照无遗漏（门控项显式标注）；diff 审查确认未新增档案端点、未改 `/paws`（Non-goal 反向验证）

## 7. 宠物友好叠加匹配增强（2026-11-16 需求方，PR #44 合并后并入）

- [x] 7.1 后端：候选响应增 `allowedPetTypes`/`allowedDogBreedIds`；仓库增 `@EntityGraph` 派生查询；`petFriendly` 叠加 `petType`/`breedId`/`shoulderHeightCm` 过滤（类型 null=不允许；品种空列表/肩高 null=未配置放行，非法 petType 400）——验证：DestinationApiTest 新用例红→绿（类型排除/保留、品种排除/空列表放行、无参退化、响应字段）
- [x] 7.2 前端：pet-profile adapter 消费 `dogBreed`（取第一只，失败退化 null）；`matchesCityPetPolicy` 纯函数；destinations query 扩参——验证：adapter/纯函数/params 单测绿
- [x] 7.3 前端：卡片右上角匹配 Badge（绿/红，无档案不显示）；已选定按钮再点取消选定——验证：tsc 绿、E2E E17/E18 绿
- [x] 7.4 E2E：run-e2e.mjs 暴露临时库路径；E17 标签+叠加筛选（node:sqlite 配置城市政策、API 建档案）、E18 取消选定；既有用例回归——验证：E2E 全量绿
- [ ] 7.5 集成验证与本地报告——验证：后端全量/vitest/tsc/openspec strict/E2E 全绿；local-verify-report 更新；不提 PR（需求方指示）
- [ ] 7.6 V16 全城市种子迁移（2026-11-16 需求方指定，避让在途 PR #43 的 V15）：全部城市级行政区 `allowed_pet_types='CAT,DOG'` + 7 个非烈性允许品种（含哈士奇）；API/E2E 测试适配种子（清理恢复种子口径）——验证：种子断言用例绿、全量回归绿

## Workflow follow-up

- 外部档案 change 交付后：核对 breed 词表与 adapter 契约，解除组 5 `test.fixme` 并转绿（E4/E6/E10/E11），必要时补联调修复
- G2 人工决策后进入 P4 apply/verify；本地验证报告（/sdd:local-verify-report）；2026-11-16 需求方已授权推送分支并提 PR
- P5：living-merge 时同步 `web-app-shell` 主 spec Purpose（lint L1）；归档前完成 change-summary 与 G3