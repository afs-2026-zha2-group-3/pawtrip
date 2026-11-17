# Alignment self-check — add-city-personalized-recommendation

- 日期：2026-11-17（P3 task-plan 最终步骤）
- 四方工件：Delta Spec（specs/paws-page、specs/destination-selection）↔ design.md（D1–D9）↔ tasks.md（6 组 17 项）↔ atdd-design.md（API+E2E）
- 方法：逐需求追溯 + 横切一致性检查；证据为工件内精确锚点（需求名/决策号/任务号/分层行号）

## 1. 需求级四方追溯

| Delta 需求 | Design | Tasks | ATDD 层行 | 结论 |
|---|---|---|---|---|
| paws-page MODIFIED「整卡打开详情并支持弹窗内编辑」（+喜好性格展示 2 场景） | D8（详情未填显示「未设置」） | 3.2（详情视图）、3.3（E2E 回归） | §1 行 1–2（E2E + 既有 6 场景回归） | Pass |
| paws-page ADDED「宠物喜好与性格维护」（9 场景） | D1 词表、D2 存储、D4 契约/校验/去重 | 1.1/1.3（列+枚举）、2.1–2.3（红测→实现→文档）、3.1–3.3（表单） | §1 行 3–10（API 8 项 + E2E 表单闭环）；§2 PetApiTest 红测清单 10 项 | Pass |
| destination-selection「候选城市特征标签契约」（3 场景） | D2/D3（V27 种子）、D5（只读下发） | 1.2（迁移红测）、4.1–4.3（红测→实现→文档） | §1 行 11–12（API + 回归）；§2 DestinationApiTest | Pass |
| destination-selection「候选个性化推荐排序」（7 场景） | D6（纯函数、稳定排序、null 退化、第一只宠物） | 5.1（vitest 红测）、5.2（实现）、5.3（接入）、5.4（E2E） | §1 行 13–16（Defer UT + E2E）；§2 E2E 表排序/性格/多宠/叠加行 | Pass |
| destination-selection「系统推荐徽标」（4 场景） | D7（右上角 Badge、无理由、不遮挡） | 5.3（渲染）、5.4（E2E 断言） | §1 行 17（E2E + 窄屏 advisory）；§2 徽标契约行 | Pass |

## 2. 横切一致性检查

| # | 检查项 | 证据 | 结论 |
|---|---|---|---|
| 1 | 词表单点一致：喜好 5 键/性格 3 键/特征 6 键 | spec 规范句 = D1 = tasks 1.3/5.2 = ATDD §4 词表夹具（同一常量字符串） | Pass |
| 2 | 重复键去重（Revision 1 新增场景） | spec 场景「重复喜好键去重」= D4 定稿 = tasks 2.1/2.2 = ATDD §1 行 8 | Pass |
| 3 | 非法键 400 不落库 | spec 2 场景 = D4 = tasks 2.1（仓库断言）= ATDD §1 行 7（API 证 absence） | Pass |
| 4 | 旧客户端/旧档案兼容 | spec 2 场景 = D2/D4 = tasks 2.1（JDBC NULL 行）/3.3 = ATDD §1 行 9–10、§4 夹具 | Pass |
| 5 | 服务端零排序改动（方案 A） | spec「MUST NOT 新增排序参数」= D5/D6 = tasks 4.2 = ATDD §1 行 12 + §5 后端排序反向 | Pass |
| 6 | 第一只宠物约定 | spec 多宠场景 = D6（pet-profile 首条）= tasks 5.2 = ATDD §4 确定性 | Pass |
| 7 | 稳定排序（同分名称序） | spec 同分场景 = D6 显式稳定比较器 = tasks 5.1 同分样本 = ATDD §1 行 13 | Pass |
| 8 | 徽标仅标记无理由 | spec 徽标需求 = D7 = tasks 5.3/5.4 = ATDD §2 徽标行 + §5 理由文字反向 | Pass |
| 9 | Non-goals 5 项全覆盖反向 | design Non-Goals = ATDD §5 五行 = tasks 4.1（PATCH 契约/排序参数）、5.4（理由文字/多宠/开关） | Pass |
| 10 | 门禁不新增 CI 语义 | ATDD §3（mvnw/vitest/build/tsc/test:e2e + 三条既有 workflow）= tasks 6.1 | Pass |
| 11 | E2E 文件归属一致 | ATDD §2（新增 city-personalized-recommendation.spec.ts + 扩展 paws spec，destination-selection.spec.ts 仅回归）= tasks 3.3/5.4（P3 已修正原 5.4 归属） | Pass |
| 12 | 迁移红测先行 | ATDD §2 PetSchemaMigrationTest = tasks 1.1/1.2（P3 已补「先失败断言再迁移」） | Pass |
| 13 | 场景计数口径 | paws 8+9=17、dest 3+7+4=14，共 31（新增/变更 25）；tasks 2.1 已修正 8→9；dov-ac-review 计数已修正 | Pass |
| 14 | 双设计链接 | tasks 头部同时链接 design.md 与 atdd-design.md（skill gotcha 要求） | Pass |
| 15 | NFR 口径 | 用户确认不纳入 = ATDD §6 = 无 tasks 额外项 | Pass |

## 3. P3 修订记录

| 修订 | 内容 | 原因 |
|---|---|---|
| tasks 1.1/1.2 | 补「先扩展 PetSchemaMigrationTest 失败断言」 | ATDD 红测先行约束 |
| tasks 2.1 | 8 场景→9 场景；补仓库断言/JDBC 夹具/载体 PetApiTest | Revision 1 去重场景 + ATDD §2 |
| tasks 3.3 | 补不填无必填错误、旧档案 E2E | ATDD §2 表单闭环/旧档案行 |
| tasks 4.1 | 补反向断言（排序参数/PATCH 契约）与载体 DestinationApiTest | ATDD §5 |
| tasks 5.4 | E2E 归属改为新增 spec；destination-selection.spec.ts 仅回归；补仅性格/多宠/开关用例 | ATDD §2 E2E 表 |
| tasks follow-up | G1 已 Pass；后续 apply→verify→G2→PR→G3→归档 | 流程状态同步 |
| atdd-design §5 | 管理端端点 PUT→PATCH（AdminCityController 实证） | 避免虚构契约 |
| dov-ac-review AC-1 | 场景计数 25→31（新增/变更 25） | 计数口径精确化 |

## 4. 结论

**Overall: Pass**（15/15 横切 + 5/5 需求追溯，无缺口）。计划可进入 `/sdd:quality-checklist`（P3 DoV）与后续 `/sdd:atdd-apply`。本自检不构成 Gate 决定。