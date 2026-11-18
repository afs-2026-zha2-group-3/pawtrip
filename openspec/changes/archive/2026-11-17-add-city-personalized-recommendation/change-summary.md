# Change summary — add-city-personalized-recommendation

- Change id: `add-city-personalized-recommendation`
- 需求：REQ-014 城市个性化推荐（按宠物喜好与性格）
- 状态：实现、两次 main 同步、本地+CI 验证完成；PR #93 已合入 main（`bfadb49`）；G2 补记 Pass；本次 P5 归档
- 分支：`feat/city-personalized-recommendation`（合并提交 `e850b4d`、`8dbdd40`）；归档分支 `archive/city-recommendation-and-itinerary-export`

## Intent

宠物档案新增喜好（多选：游泳/爬山/草地奔跑/城市漫步/玩雪）与性格（单选：活泼/安静/未知），城市候选按首宠喜好与性格打分排序，得分 >0 的卡片展示「系统推荐」徽标；未填/无宠物退化为名称序，不改变既有筛选/搜索/政策标签行为。

## What shipped

- 迁移：`V27__add_region_feature_tags.sql`（administrative_region.feature_tags + 48 城种子）；`V28__add_pet_preferences_personality.sql`（pet.preferences/personality 可空列；原 V26，第二次 main 同步让位公开政策种子重编号）。
- 后端：喜好/性格/特征词表枚举（design D1 单点依据）；Pet 实体/请求/响应/服务校验（未知键 400、去重、NULL 兼容）；DestinationResponse.featureTags 只读下发（管理端写路径不触碰）。
- 前端：宠物表单喜好 Checkbox 组 + 性格 Select（未设置 sentinel→null）与详情展示；`lib/destination-recommendation.ts`（scoreCity 喜好映射/同特征去重/性格三档加成，sortByRecommendation 得分降序、同分保持服务器序）；cities.tsx 渲染前排序 + shadcn Badge「系统推荐」（与 main 分页集成：排序先于分页，徽标/封面按全局索引）。
- 测试：PetApiTest 13、DestinationApiTest 15、PetSchemaMigrationTest 扩展；vitest 211；E2E 新 spec 7 用例（翻页遍历断言）+ paws-pet-management 扩展。
- 文档：`docs/knowledge/domain/city-feature-tags.md`（新条目 + _INDEX 登记）、http-api.md pet/destinations 契约段落。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 后端 | Pass | `mvnw test` 243/243（两次同步后均全绿） |
| 前端单测 / build | Pass | vitest 211/211；`npm run build -w apps/web` exit 0 |
| E2E | Pass | 全量 173 passed / 0 failed（本地与远端 CI 一致）；本 change 定向 66/66 |
| CI（PR #93 @ `8dbdd40`） | Pass | Web / Server / E2E 三 workflow success（run 44108263036 / 44108263072 / 44108263041） |
| OpenSpec validate | Pass | `--strict` valid |

## P1–P5 状态

- P1 proposal / P2 specs·design·DoV·alignment：完成；G1 Pass（IO=SUKI，SA=RANLE，g1-decision.md）。
- P3 ATDD / tasks：完成；后端 TDD、前端直接实现（2026-11-17 用户决定）。
- P4 实现与验证：完成；11 项回归失败全部修复（含合并丢失的 cities.tsx REQ-014 集成、同分序口径、分页适配）。
- P5：PR #93 合入 main；CI 证据 PR #94 合入（`c03f536`）；G2 补记 Pass（VL=tantine）；本次归档。

## Residual risks / follow-ups

1. 同分城市保持服务器序（SQLite BINARY = Unicode 码点序，非拼音）；如需拼音序另立需求（已在 spec/KB 注明口径）。
2. CI 无 secret-scan/SAST/audit job（仓库级缺口，pipeline-report 已登记，另立 change）。
3. 多宠仅取第一只打分；其余宠物偏好影响排序为潜在后续需求。

## Links

- Proposal / Design / Specs / ATDD / DoV / Alignment / Tasks / G1 / G2：同目录各文件
- CI 证据：`openspec/changes/2026-11-17-export-itinerary-pdf/ci-report.md`（同分支同 head，两 change 共用）
- 验证报告：`docs/ai4se-plugins/20261117-223134-local-verify-report.md`、`20261117-230517-pipeline-report.md`