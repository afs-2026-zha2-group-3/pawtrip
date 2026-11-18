# AC / DoV Review — 行程携带清单与打包进度

变更：`2026-11-18-add-trip-packing-checklist`

范围：核对 REQ-017（US-18 / US-19）的验收要求、Delta Spec、Design、Tasks 与当前验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 生成与幂等（US-18 AC-1） | Pass | Delta `trip-packing-checklist`「行程归属与清单生成」；`PackingChecklistApiTest` 首次生成 201、重复生成 200 且 id/用户数据不变 | 未生成时读取 404，前端作为正常态展示生成引导 |
| AC-2 分类与模板映射（US-18 AC-2） | Pass | Delta「模板与场景映射」「物品分类固定」；`PackingTemplateTest` 猫 3 天、狗飞机 5 天、牵引绳/疫苗证明、分类集合；前端弹窗按五类固定顺序 | 2 天豆豆场景生成 9 项，行数与分类均有断言 |
| AC-3 增删改持久化（US-18 AC-3） | Pass（文档）/ 待 E2E | Delta「自定义物品增删改」；`PackingChecklistApiTest` 新增 201、改数量、删除 204、非法入参 400；组件测试新增自定义物品与空名称校验 | 刷新/换设备持久化由服务端唯一数据源保证；E2E 增删改与刷新用例待 P4 执行 |
| AC-4 同步与保留（US-18 AC-4） | Pass（文档+UT）/ 待 E2E | Delta「读取时同步档案与行程」5 个场景；API 测试覆盖体重分档、天数改主粮、高铁↔飞机往返、自定义/数量覆盖/勾选保留、删除不复活、隐藏恢复未勾选 | E2E 档案同步用例已编写，待 P4 运行并恢复种子体重 |
| AC-5 勾选与进度（US-19 AC-1/AC-2/AC-5） | Pass | Delta「勾选与打包进度」；API 测试进度按行统计；组件测试勾选后 2/2 与完成态；行程单与弹窗共用接口数据 | 进度分母为可见物品行，不按数量求和；文案「X / Y 件」口径已在 design 记录 |
| AC-6 跨设备持久化（US-19 AC-3） | Pass（设计保证） | Delta「修改数量并持久化」「跨设备保留勾选态」；清单与物品均服务端存储，前端无本地副本 | 同账号多会话读取同一服务端数据；无多端离线合并需求 |
| AC-7 未生成与无档案（US-19 AC-4，引导） | Pass | Delta「未生成与无档案降级」；`PackingChecklistApiTest` 404 `PACKING_CHECKLIST_NOT_FOUND`、409 `PET_PROFILE_REQUIRED`；组件测试 `/paws` 链接 | 未生成 404 不作为查询错误；无档案不生成无依据清单 |
| AC-8 属主、墓碑与级联（US-18/US-19 边界） | Pass | Delta「访问他人行程」「删除行程级联删除清单」「删除的模板项不复活」；API 测试非属主 404、级联、墓碑同步；迁移测试外键级联 | 非属主与不存在统一 404，不泄露存在性 |
| AC-9 导出隔离与回归（US-18/US-19 边界） | Pass（文档）/ 待回归 | Delta `trip-itinerary`「导出不包含清单」；弹窗使用 `print:hidden` 且不在导出渲染树；既有行程单导出用例未改动 | 需在 P4 运行 `e2e/itinerary.spec.ts` 回归确认 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、两份 Delta Spec、`design.md` | 生成/同步/编辑/勾选/进度/引导均在范围内；AI、模板管理、提醒、购物、独立导出明确排除 |
| DoV-2 歧义已解决 | Pass | `design.md` Decisions 与 Open Questions（无） | 分类枚举大小写、运输包分档、尿垫下限、HIDDEN/DELETED 语义、模板项编辑边界均已在 design 定稿 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks / Trade-offs；下方 Residual concerns | GET 同步写库、进度行数文案、隐藏行占用、外键依赖、档案删除限制、迁移编号冲突 |
| DoV-4 Delta Spec 可校验 | Pass | `npx --no-install openspec validate 2026-11-18-add-trip-packing-checklist --strict` → valid（2026-11-18） | ADDED `trip-packing-checklist` + MODIFIED `trip-itinerary` |
| DoV-5 场景覆盖与追溯 | Pass | 下方 Requirement ↔ Scenario ↔ AC ↔ Task 表 | 两份 Delta 共 7 个 Requirement、28 个 Scenario；AC-1…AC-9 全部有场景与任务承接 |
| DoV-6 任务可执行 | Pass | `tasks.md` 5 组 21 项，含红测先行与验证命令 | 每项有明确文件/动作；5.3–5.5 列 E2E、全量测试与规格校验 |
| DoV-7 实施先行交叉证据 | Partial | 后端 15 项清单测试通过；前端 4 项组件测试通过；`npm run build -w apps/web` 通过（2026-11-18） | E2E 与全量回归未完成；不据此宣称 P4 完成 |
| DoV-8 跨 REQ 一致性 | Pass | `design.md` Context；P1 `analysis/REQ-017/impact-brief.md` §3 | 不改 trip-planning 计划、trip-context 激活语义、paws-page 档案字段；与 REQ-016 路线弹窗同层、互不影响、均不进导出 |
| DoV-9 迁移可验证 | Pass（文档+UT） | `PackingChecklistSchemaMigrationTest`：表、唯一索引、CHECK、级联 | V29 只新增表与索引，不回填历史行程；首次访问展示未生成 |
| DoV-10 E2E 与全量验证 | 待执行 | `e2e/packing-checklist.spec.ts` 已编写 | 需在 P4 运行并修复档案种子恢复；不记为 Pass |

## Requirement ↔ Scenario ↔ AC ↔ Task 追溯

| Delta Requirement | Scenario 数 | AC | Tasks |
|---|---|---|---|
| 行程归属与清单生成 | 5 | AC-1、AC-8 | 1.2、2.1–2.3、3.1–3.3 |
| 模板与场景映射 | 5 | AC-2 | 1.1、2.4 |
| 读取时同步档案与行程 | 5 | AC-4 | 1.4、3.1 |
| 自定义物品增删改 | 4 | AC-3、AC-8 | 1.3、3.1–3.3、4.2 |
| 勾选与打包进度 | 4 | AC-5、AC-6 | 1.3、3.1–3.2、4.2 |
| 未生成与无档案降级 | 2 | AC-7 | 1.2、4.3 |
| 清单项契约 | 3 | AC-2、AC-3、AC-5 | 3.2 |
| `trip-itinerary`：入口与进度 | 3 | AC-5、AC-9 | 4.4 |
| `trip-itinerary`：弹窗与操作 | 6 | AC-3、AC-5、AC-9 | 4.2–4.3 |
| `trip-itinerary`：状态引导 | 5 | AC-1、AC-7 | 4.3 |

> 注：两份 Delta 合计 7 个 `trip-packing-checklist` Requirement（28 个 Scenario 中的 25 个）与 3 个 `trip-itinerary` Requirement（14 个 Scenario）；上表按验收链归并展示。

## Residual concerns

- **GET 带写操作**：读取时同步会更新模板项；单用户单行程数据量小，事务内执行可接受。若未来读多写多，需要改为显式同步接口。
- **进度文案口径**：进度按物品行数统计，主粮数量 10 仍计 1 行；文案「X / Y 件」沿用需求口径，需在验收说明中保持一致。
- **模板项不可改名/改分类**：弹窗仅暴露数量、勾选、删除；API 虽支持自定义项更新名称/分类，本期 UI 不做行内改名/分类，design 已记录。
- **隐藏行与墓碑行占用**：场景切换会保留 `HIDDEN`/`DELETED` 行，模板项数量有上限，暂无清理逻辑。
- **档案删除限制**：现网禁止删除被行程引用的宠物，`PET_PROFILE_REQUIRED` 主要覆盖历史脏数据；测试用直连 JDBC 构造。
- **E2E 种子隔离**：档案同步用例将豆豆体重改为 12kg，必须在 `finally` 恢复原值，避免污染同 worker 的其他 spec。
- **迁移编号**：当前最新 V28；若 main 并行产生 V29，需顺延重编号并复跑迁移测试。
- **G1/G2/G3 未签署**：本记录不代签；P4 全量验证与 E2E 未完成，不得据此宣称交付完成。

## Review outcome

文档层 AC/DoV 检查为 **Pass（实现范围）**：Delta Spec、Design、Tasks 与 REQ-017 的 9 条 AC 全部可追溯，规格 `validate --strict` 通过，design 与最终契约的三处不一致已修正。DoV-7 为 Partial、DoV-10 待执行：E2E 与全量回归仍属 P4 工作。本结果不代表 Gate 已批准，也不代表 CI 已通过。
