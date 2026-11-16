# Proposal

## Why

规则页（REQ-005 / US-05）目前只能"看规则"：用户仍需自己对照宠物档案判断"我家这只到底能不能用这种方式"，判断完也没有地方记录本次行程打算怎么走。本次在规则页补两件事：让规则直接对着用户已录入的宠物给结论，并让用户把本次选定的交通方式记下来，供后续生成行程单使用。

## What Changes

- 「方式」列之前新增单选项列：四种交通方式互斥单选，选中值写入 `sessionStorage`（`pawtrip:selected-transport-mode`），进入页面时回显；不产生请求、不改 URL。
- 「方式」列之后新增「是否推荐」列：按当前行规则逐只比对用户的宠物档案（体重、肩高、检疫证明），每只宠物显示「推荐 / 不推荐」及不满足原因；用户无档案时整列不渲染，表格下方显示「新增宠物档案」提示按钮（仅展示，不做跳转）。
- 规则数据补结构化字段 `shoulderLimitCm`（高铁 40cm，其余为空），供肩高判定使用；判定逻辑放在前端纯函数中，规则仍以前端常量为唯一真源。
- 复用主干已有的 `GET /api/pets` 查询当前用户档案（该接口随宠物档案能力已合并入 main，本次不改后端）。

## Capabilities

### Modified Capabilities

- `transport-rules-comparison-page`: 新增「是否推荐」列（逐只档案判定 + 无档案隐藏并提示）与交通方式单选列（互斥单选 + `sessionStorage` 临时缓存）。

### Dependencies

- `GET /api/pets`（读当前登录用户的档案列表，返回 `name`、`petType`、`weightKg`、`shoulderHeightCm`、`hasLeash`、`hasVaccinationProof`、`photo`）。已存在于主干，本次不新增、不修改后端接口与数据库迁移。

## Impact

- 前端：`apps/web/src/data/transport-rules.ts`（补 `shoulderLimitCm`）、新增判定模块与 `queries/pets.ts`、修改 `apps/web/src/routes/_authenticated/transport-rules.tsx`（两列 + 无档案提示改造）。
- 后端：无改动。
- 数据：`scripts/seed-users.mjs` 为 `demo` 账号补两只宠物（一只满足全部条件、一只全部不满足），`admin` 保持无档案，用于验收两种页面形态。
- 测试：新增判定纯函数的 vitest 用例；E2E 扩展推荐列、无档案形态、单选与缓存回显四组场景；REQ-005 现有的"档案入口是链接可跳转"断言需改为"按钮存在且不可点击"。
- 依赖顺序：本 change 的 delta 以 REQ-005（`transport-pet-rules-comparison`）合并入 main 为前置；两者都触及规则页规格，需先合并 REQ-005 再归档本 change。

## Effort Notes

- 规模：约 5 个前端文件 + 1 个种子脚本 + 1–2 个测试文件；无迁移、无后端改动。
- 顺序：T1 规则数据与判定纯函数（含单测）→ T2 档案查询 → T3 页面两列与无档案提示 → T4 种子与 E2E → T5 全量验证。
- 单 Change 理由：两列同处一张表、同一用户可见结果（打开规则页即可见），拆开会产生"只有列没有数据"的中间态。
