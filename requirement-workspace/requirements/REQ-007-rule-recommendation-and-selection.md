---
id: REQ-006
title: 规则页交通方式选择与宠物档案推荐列
status: implemented
discovery: Go (2026-11-16)
change: openspec/changes/add-rule-recommendation-and-selection
sources:
  - openspec/changes/transport-pet-rules-comparison/specs/transport-rules-comparison-page/spec.md
  - openspec/changes/add-rule-recommendation-and-selection/design.md
  - apps/server/src/main/java/com/pawtrip/server/pet/PetResponses.java
  - docs/knowledge/domain/transport-pet-rules.md
---

# REQ-006: 规则页交通方式选择与宠物档案推荐列

## Discovery Decision

Go — 在既有交通携宠规则对比页（REQ-005）上叠加两项用户可见能力：让用户直接看到"我的宠物在这条规则下推不推荐"，并把本次选定的交通方式暂存下来供后续生成行程单（2026-11-16 需求方追加）。

## 六字段

1. **id**：REQ-006
2. **statement**：为已登录用户在交通携宠规则对比页新增两列 —— 「方式」之前新增单选项列，用户勾选本次要用的交通方式（飞机/高铁/火车/自驾互斥单选），选中值写入浏览器 `sessionStorage` 供后续生成行程单读取；「方式」之后新增「是否推荐」列，按当前行规则逐只比对用户宠物档案（体重、肩高、检疫证明），满足显示推荐、不满足显示不推荐并列出原因；用户没有任何宠物档案时隐藏该列，在表格下方提示新增档案（按钮仅展示、不做跳转）。
3. **actors**：
   - 已登录用户（有档案）：查看逐只宠物的推荐结论与不满足原因
   - 已登录用户（无档案）：看到隐藏推荐列的完整规则表 + 新增档案提示
   - 后续行程单能力：读取 `sessionStorage` 中的交通方式
   - 后端应用 `apps/server`：本次不改动，复用主干已有 `GET /api/pets`
4. **rationale**：规则本身只是"通用条款"，用户仍需人肉对照自家宠物的体重/肩高/证件；把判定做成页面的一部分能显著降低决策成本。同时行程单需要知道用户打算怎么走，规则页正是用户做这个决定的时刻。
5. **acceptance hints**：
   - AC-1「选择」列位于「方式」之前，单选互斥，一次只能选一种方式
   - AC-2 选中值写入 `sessionStorage`（`pawtrip:selected-transport-mode`），刷新后回显，缓存不可用或值非法时降级为未选中
   - AC-3「是否推荐」列位于「方式」之后，逐只宠物显示「推荐 / 不推荐」，不推荐时列出全部原因（体重超限、肩高超限、缺少检疫证明）
   - AC-4 无档案时整列不渲染，表格下方提示新增档案，按钮点击跳转 `/paws`；档案加载失败时提示失败而非"没有档案"
   - AC-5 判定随规则行联动：切换航司后飞机行结论重算；不同行按各自阈值独立判定
   - AC-6 规则仍为前端常量唯一真源，不新增规则 API、不建规则表；判定为前端纯函数
6. **links to evidence**：
   - 需求来源：2026-11-16 需求方在 REQ-005 完成后的追加说明（两条列 + 缓存用途）
   - 判定口径决策：体重 + 肩高 + 检疫证明（需求方选定）
   - 多档案决策：逐只显示哪个满足、哪个不满足（需求方选定）
   - 交互决策：单选互斥、`sessionStorage`（需求方选定）
   - 范围决策：不做档案录入页；提示按钮跳转 `/paws`（2026-11-16 需求方指定路径，该页当前为空壳）
   - 后端契约：`apps/server/.../pet/PetResponses.java`（`PetDetail` 字段）
   - 实现与验证：`openspec/changes/add-rule-recommendation-and-selection/tasks.md`

## 实现与验证

| 项 | 内容 |
|---|---|
| 前端判定 | `apps/web/src/data/transport-rule-match.ts`（`evaluateRuleForPet`） |
| 档案查询 | `apps/web/src/queries/pets.ts`（`GET /api/pets`） |
| 页面 | `apps/web/src/routes/_authenticated/transport-rules.tsx` |
| 规则数据 | `apps/web/src/data/transport-rules.ts` 新增 `shoulderLimitCm`（高铁 40cm） |
| 种子 | `scripts/seed-users.mjs`：`demo` 两只宠物，`admin` 无档案 |
| 验证 | `vitest` 17 passed、`build` exit 0、`mvnw test` 75 tests BUILD SUCCESS、`e2e` 32 passed |

## 未闭合事项

- 依赖 REQ-005 先合并（W4 已于 2026-11-16 闭合：8 条规则 `verifiedOn` 全部补齐），否则本 change 的规格增量无法归档
- 档案录入页：跳转目标已定为 `/paws`，该页仍为空壳（`paws-page` 规格限定为空内容）；档案表单由后续 change 在该页落地，届时不需要改规则页
