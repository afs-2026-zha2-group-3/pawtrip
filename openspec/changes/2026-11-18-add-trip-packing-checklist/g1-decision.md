# G1 decision — add-trip-packing-checklist

- Gate: G1（Align）
- Change id: `add-trip-packing-checklist`（REQ-017 行程携带清单与打包进度，US-18 / US-19）
- Status: 已签署（2026-11-18）
- Inputs:
  - `proposal.md`、`specs/trip-packing-checklist/spec.md`（ADDED，7 需求 25 场景）、`specs/trip-itinerary/spec.md`（MODIFIED，3 需求 14 场景）
  - `design.md`（D1–D9：数据模型与状态机、API 契约、静态模板与映射、读取时同步、前端弹窗与入口、错误码、测试策略、迁移与回滚）
  - `tasks.md`（5 组 21 项，含红测先行、E2E 与全量验证命令）
  - 复核：`dov-ac-review.md`（AC-1..AC-9、DoV-1..DoV-10；DoV-7 Partial、DoV-10 待执行）、`consistency-lint.md`（0 BLOCKER / 0 WARNING / 3 SUGGESTION，Verdict Pass）
  - P2 质量清单：`docs/ai4se-plugins/20261118-141608-quality-checklist-report.md`（Overall Pass，P2-3 G1 未代签）
  - 上游需求：`requirement-workspace/requirements/REQ-017-trip-packing-checklist.md`（AC-1..AC-9、S1..S9，12 blocking + 4 non-blocking OQ 全部 resolved，DoR BLOCKER=0）；`intents/REQ-017-trip-packing-checklist.md`；`analysis/REQ-017/{impact-brief,deep-dive}.md`
  - 校验：`openspec validate 2026-11-18-add-trip-packing-checklist --strict` 通过（2026-11-18，G1 预审修正后复跑）
- G1 预审修正（已合入变更包）：
  1. `specs/trip-packing-checklist/spec.md`「自定义物品增删改」明确：用户可改数量与勾选；自定义项可改名/分类；模板项名称/分类随模板维护，仅数量与勾选可改。
  2. `proposal.md` Impact 补列 `PACKING_ITEM_NOT_FOUND`，与 design 和实现一致。
- Findings:
  - 范围：delta 与 proposal What Changes、REQ-017 In/Out 一致；单 Change 交付连贯能力（入口与进度 + 弹窗 + 模板映射 + 读取同步 + 增删改 + 引导态 + 导出隔离）；AI 生成、模板管理界面、未完成提醒、一键购买、独立清单导出均未混入规格。
  - 歧义：无未决 blocking 项。分类枚举、运输容器与牵引绳尺寸分档、主粮 `totalDays × 2`、尿垫 `max(1, totalDays)`、HIDDEN/DELETED 语义、模板项编辑边界、进度按行口径均已在 design 定稿并落入 delta。
  - 冲突：不改 `trip-planning` 计划结构、`trip-context` 激活行程语义、`paws-page` 档案字段；与 REQ-016 路线弹窗同层、互不影响、均不进 PDF/图片导出；V29 经核实为当前唯一最新迁移（V28 之后无并行版本）。
  - 残余风险（非阻塞，IO/SA 知悉）：
    1. GET 读取时同步会更新模板项（事务内执行，单行程数据量小；design Risks）
    2. 进度按物品行统计但页面文案为「X / Y 件」，主粮数量 10 仍计 1 件（按需求口径，验收说明需一致）
    3. 模板项名称/分类不可由用户修改，只随模板刷新（有意限制，避免同步回滚）
    4. `HIDDEN`/`DELETED` 行保留占位，暂无清理逻辑（模板项数量有上限）
    5. `PET_PROFILE_REQUIRED` 主要覆盖历史脏数据（现网禁止删除被行程引用的宠物）
    6. E2E 尚未重跑；档案同步用例须在 `finally` 恢复种子体重；若 main 并行产生 V29 需顺延重编号并复跑迁移测试
    7. 当前实现已先行，`tasks.md` 复选框未回填；P4 按验证结果统一勾选并保留证据
- Decision: **Pass**
- Conditions + owners: 无（Pass）。上述 7 项为非阻塞知悉项，已有归属或运行期降级，不构成 Gate 条件。
- Approvers: IO=kitty；SA=kitty（用户指定同一人签署，沿袭 REQ-011 / REQ-016 G1 先例，2026-11-18）
- Timestamp: 2026-11-18

> 本记录为人工 G1 决定的落盘，不构成 G2/G3 授权。下一步：P3（ATDD 设计与对齐自检），并回填 P4 验证证据。
