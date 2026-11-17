# Tasks

## 1. 后端媒体字段

- [x] 1.1 `LocationPhotoRepository` 新增 `findAllByLocationIdInOrderByLocationIdAscPhotoOrderAsc`；`LocationQueryService.locations` 对当前页地点 ID 批量取照片并按地点取首张 `sourceUrl`（D1）。验证：新增服务层测试断言多地点分页时封面各取首张、无照片地点为 null。
- [x] 1.2 服务层解析 `business_json.rating`（Jackson，trim 非空才返回，解析失败视同缺失，D2），详情路径复用 `findAllByLocationIdOrderByPhotoOrderAsc` 取首张。验证：测试覆盖 rating 存在/缺失/空串/非法 JSON 与详情首张照片。
- [x] 1.3 `LocationQueryResponses.LocationSummary` 与 `LocationDetail` 增加可空 `coverPhotoUrl`、`rating`（D3），接线控制器响应。验证：`apps/server` 测试断言列表与详情响应含两字段且既有字段不变、响应不含原始 POI/business/照片列表；`./mvnw test` 全绿（含管理端列表回归）。

## 2. 前端共享工具与媒体组件

- [x] 2.1 提取 `safeImageUrl` 至 `apps/web/src/lib/location-image.ts`，管理端 `-location-editor.tsx` 改为 import。验证：管理端既有测试与 `npm run build` 通过，行为不变。
- [x] 2.2 新增 `lib/location-summary.ts` 纯函数 `restrictionFeeParts` / `policyNoteParts`（D4 顺序、单位换算、去尾零、仅 true 布尔生成短语）。验证：vitest 覆盖部分有值/全空/分转元（8000→¥80、8050→¥80.5）/三布尔短语与空数组。
- [x] 2.3 新增 `attractions/-location-cover.tsx`（16:9、object-cover、no-referrer、onError/非 http(s)/null → 图标+类型标签占位，无重试）与 `-location-rating.tsx`（琥珀 Star + 原样值，null/非数值隐藏）。验证：组件单测覆盖有图/无图/加载失败/非法 URL 与有分/无分/非数值。

## 3. 卡片与详情弹窗集成

- [x] 3.1 `queries/locations.ts` 的 `LocationSummary` / `LocationBrowseDetail` 增加 `coverPhotoUrl`、`rating` 可空字段。验证：`npm run build` 类型检查通过。
- [x] 3.2 重构 `LocationCard`：封面 → 名称 → 地址+评分 → 既有徽章/tag → 限制费用行 → 说明行（空数组整行隐藏）→ 操作 footer 不变。验证：卡片单测断言结构顺序、行隐藏、已加入徽章与三个操作入口保留。
- [x] 3.3 `LocationDetailDialog` 头部插入封面与评分（降级同卡片），其余政策展示与加入行程操作不变。验证：弹窗单测断言媒体展示/降级与既有关闭、添加行程行为回归。

## 4. E2E 种子与场景

- [x] 4.1 扩展 `scripts/seed-e2e-attractions.mjs`：为部分地点写入 `business_json.rating` 与 `location_photo` 行（含多张照片验证首张），保留无图无分地点。验证：脚本幂等重跑后数据库抽样符合组合预期。
- [x] 4.2 `e2e/attraction-pet-rules.spec.ts`（或新增 spec）覆盖：封面图可见、评分 ★ 展示、无图占位、无分隐藏、限制费用/说明行文案、详情弹窗媒体同步、切换类型结构一致。验证：`npm run test:e2e` 相关用例通过（Chromium）。

## 5. 集成验证

- [x] 5.1 全量验证：`apps/server` `./mvnw test`、`apps/web` `npm run build` + vitest、E2E 全量；浏览器实测卡片与弹窗（有图/无图、窄屏两列→单列）无布局破损与控制台错误。验证：记录各命令退出码与用例数于验证报告。
- [x] 5.2 `openspec validate "add-location-card-media" --strict` 通过；管理端地点列表/编辑弹窗回归（照片预览、政策编辑不变）。验证：validate 输出与管理端 E2E 用例通过。

## Workflow follow-up

- G1 Pass（IO=Kitty、SA=Leo，`g1-decision.md`）；PR #65 已合并、CI 全绿；G2 Pass（VL=Scott，`g2-decision.md`）；G3 Pass（SA=Leo，`g3-decision.md`）。Living Spec 已同步（`trip-attractions` +3、`location-management` +1），change 已归档。

## P4 执行记录（2026-11-17，/sdd-atdd-apply）

- 红→绿证据：API 新增 5 测试先红（字段缺失/空串）后绿；E2E media E1–E9 先红（7 个正向用例元素缺失；E4/E9 为反向 absence 用例，实现前天然通过、实现后防回归）后全绿。
- 验证口径调整：2.3/3.2/3.3 原文"组件/卡片/弹窗单测"改由 E2E（media E1–E9，真实 Chromium）承担——仓库无 RTL/jsdom 基础设施且 design 约束零新依赖；纯函数（`location-image`/`location-summary`）仍按 vitest TDD（18 例）。
- 夹具偏差：ATDD §5 政策组合甲（体重 15 + 附加费 8000 + 牵引/疫苗 true）落在 `e2e-zhu-hotel`，`e2e-zhu-a` 保留 REQ-009 既有政策以保护其断言（8.5 kg/40 cm/¥10.5/不需要）；组合乙全空 = `e2e-zhu-b`。
- 用例修正：media E8 先"暂不排期"再"添加第 1 天"——既有 `addStop` 契约对已排期地点拒绝重复加入未排期（store.ts 去重），非本 change 行为。
- CI 修正（PR #65 首轮 Browser E2E 红）：media E6 原误以渔女为"全空"夹具，但其 `leashRequired=1` 按规格应生成牵引短语；改用真正全空的无名景点，并为 absence 断言加卡片可见守卫、showAll 后断言 checked，消除空过假绿；本地全量 108 绿 + media 子集 repeat-each 2 共 18 绿后推送。
- 验证结果：`apps/server ./mvnw test` 177 绿；`apps/web npm run build` 绿 + vitest 114 绿；`npm run test:e2e` 全量 109 绿（含管理端回归 E10）；390×844 窄屏单列、弹窗层叠、无横向溢出、控制台无错误（临时 spec/config 验证后已删除）；`openspec validate "add-location-card-media" --strict` 通过。
- 遗留观察（非本 change 引入，不修）：390px 下行程面板默认展开为全屏抽屉需点"收起"；主导航 tabs 与 Log out 间距偏紧。
- PR #65 已开并于 `791e90f` CI 全绿（Browser E2E 7m25s / Server 1m28s / Web build 33s）。

## 门禁补录（2026-11-17）

- P1–P3 工件复核齐全，补录 `alignment-self-check.md`（Pass，计划层）；`openspec validate "add-location-card-media" --strict` 通过。
- G1 Pass 补录于 `g1-decision.md`（IO=Kitty、SA=Leo）。
- 本地复验（HEAD `3907a64`）：`apps/server ./mvnw test` 177 绿；`npm run build` + `npx tsc --noEmit` exit 0；vitest 17 文件 117 绿；`npm run test:e2e` 全量 108 passed / 0 failed（media E1–E9 全绿、管理端回归绿）；报告 `docs/ai4se-plugins/20261117-132353-local-verify-report.md`（Overall Pass）。
- PR #65 已合并入 main（`fe472ab`，2026-11-17T04:53:21Z），CI 三条工作流全 SUCCESS。
- G2 Pass 签署于 `g2-decision.md`（VL=Scott）；无阻塞条件。G3 Pass 签署于 `g3-decision.md`（SA=Leo）；Living Spec 已内联合并（`trip-attractions` +3、`location-management` +1，同步后结构核验通过），change 归档至 `openspec/changes/archive/2026-11-17-add-location-card-media/`。