# Design

## Context

- 规则页 [transport-rules.tsx](file:///c:/code/pawtrip/apps/web/src/routes/_authenticated/transport-rules.tsx) 由列配置 `transportRuleColumns` 驱动渲染四行；飞机行通过行内 `Select` 切换航司；表格下方已有"数据来源 / 复核状态 / 免责 / 无站内订票"说明区与一个 `<a href="/paws/profile">录入宠物档案</a>` 链接。
- 规则唯一真源为 [transport-rules.ts](file:///c:/code/pawtrip/apps/web/src/data/transport-rules.ts)，字段含 `weightLimitKg`（可空）、`weightLimitNote`、`extra`；肩高限制（高铁 ≤40cm）目前只写在 `weightLimitNote` 文本里，无结构化数值。
- 宠物档案后端已随主干提供：`GET /api/pets` 返回 `[{ id, name, petType, weightKg, shoulderHeightCm, hasLeash, hasVaccinationProof, photo }]`（`PetResponses.PetDetail`），写接口同样齐备；前端尚无档案页面与查询模块。
- 前端数据请求统一走 [request.ts](file:///c:/code/pawtrip/apps/web/src/lib/http/request.ts) + TanStack Query 的 `queryOptions` 模式（见 `queries/auth.ts`）。
- 迁移现状：`pet` 表列为 `user_id / pet_type / weight_kg / has_leash / has_vaccination_proof / name / shoulder_height_cm / photo`，`name`、`shoulder_height_cm` 为 NOT NULL。
- 规格见 `specs/transport-rules-comparison-page/spec.md`；动机见 `proposal.md`。

## Goals / Non-Goals

**Goals:**

- 用户打开规则页就能看到"我这只宠物在每种方式下推不推荐"，不用人肉对照。
- 推荐结论随规则行变化（切航司、切相对独立行）实时重算，且能说明不推荐的原因。
- 用户能记下本次要用的交通方式，并在刷新后、在后续行程单页面仍能读到。
- 无档案用户看到的页面干净：没有空列，只有一句提示与一个不可点击的按钮。

**Non-Goals:**

- 不做档案录入页、不做档案增删改界面；不做按钮跳转（档案页由后续需求提供）。
- 不把判定放到后端，不新增规则 API，不做规则表。
- 不实现行程单本身，只负责写入缓存；不做"推荐排序""最佳方式"等推荐算法升级。
- 不考虑宠物品种/烈性犬与城市准入规则（属城市浏览能力），本页只看交通规则四维度。

## Decisions

### D1 判定放在前端纯函数（否决后端判定）

新增 `apps/web/src/data/transport-rule-match.ts`，导出 `evaluateRuleForPet(rule, pet)` 返回 `{ recommended, reasons }`。

- 理由：规则常量只在前端有一份，后端判定需要在后端复制体重/肩高/检疫阈值，规则一改要改两处；档案接口只提供原始字段，判定是展示层的轻量派生。
- 备选（已否决）：后端 `GET /api/pets/recommendations`。会立刻产生两套阈值，且与 REQ-006 D1「规则前端写死、不建规则 API」直接冲突。
- 偏离说明：REQ-006 design D5 曾记"对比判定后端实现、随 US-06"。本次需求明确按档案表字段直接比对、且规则仍在前端，故改在前端实现；若将来多端需要判定，再把纯函数迁到后端，接口契约不变。

### D2 判定算法与原因文案

```
满足 = allowanceStatus !== "not_allowed"
     && (weightLimitKg == null    || pet.weightKg      <= weightLimitKg)
     && (shoulderLimitCm == null  || pet.shoulderHeightCm <= shoulderLimitCm)
     && pet.hasVaccinationProof
```

- 不满足原因按固定顺序全部列出（一条宠物可同时有多条原因）：
  - `体重 38kg 超过上限 32kg`
  - `肩高 55cm 超过上限 40cm`
  - `缺少动物检疫合格证明`
  - `该方式不可携带宠物`（`allowanceStatus === "not_allowed"` 时唯一原因，其余条件不再累加）
- 阈值为空 = 该维度无限制（自驾体重无上限），跳过该维度，不用 0 或假数字占位。
- 检疫证明为硬条件：八条规则全部要求持证，缺证一律不推荐。
- `hasLeash` 不参与判定：规则要求的是运输容器/口套，与"是否带牵引绳"不是同一维度，强行比对会给出错误结论（记为本决策的显式取舍）。

### D3 规则数据补 `shoulderLimitCm`

`TransportRule` 增加 `shoulderLimitCm: number | null`；高铁行填 `40`（来源文本"肩高不超过 40 厘米"），飞机、火车、自驾填 `null`。`weightLimitNote` 保留原文不改，结构字段与说明文本并存。

### D4 列结构：勾选列最前，推荐列紧随「方式」

- 列顺序：`选择` → `方式` → `是否推荐` → 其余基础列（能否携带、体重上限、容器要求、办理流程概要、检疫证明）。
- `选择` 与 `是否推荐` 是页面级固定列（依赖页面状态），不作为 `transportRuleColumns` 配置项；列配置仍只描述规则维度，保持"加维度只改配置"的既有性质。
- 推荐列单元格：逐只宠物一行的列表，形如 `豆豆 · 推荐` / `毛毛 · 不推荐 · 体重 38kg 超过上限 32kg、缺少动物检疫合格证明`；推荐用默认前景色 + 勾选图标语义，不推荐用 `text-destructive`；列头 `是否推荐`，加 `aria-label` 便于 E2E 定位。
- 只展示「推荐 / 不推荐」两种结论，不做"部分满足"的第三种状态：任何一条硬条件不满足即不推荐，原因在文案里说清。

### D5 无档案：隐藏列 + 跳转 /paws 的提示按钮

- 档案列表为空 → 不渲染推荐列，表格下方提示区文案改为「还没有宠物档案，暂时无法给出推荐。」，并渲染 `<Button variant="outline" onClick={() => navigate({ to: "/paws" })}>新增宠物档案</Button>`。
- 跳转目标为 `/paws`（2026-11-16 需求方指定）。该页的宠物管理已由主干 `#40 feature/add-paws-pet-management` 实现，按钮点击后可直接维护档案；`PET_PROFILE_PATH` 常量与旧 `<a href>` 已删，路由用 TanStack Router 的 `navigate`，不手写字符串 `href`。
- 加载中（`isPending`）：不渲染推荐列也不渲染提示，避免列宽抖动与"无档案"误判。
- 加载失败（`isError`）：不渲染推荐列，提示区显示「宠物档案加载失败，请刷新重试」，不伪装成"没有档案"。

### D6 单选 + `sessionStorage` 缓存

- 控件：`<input type="radio" name="transport-mode">` + 行 `label`（行内可见文字为方式名，`aria-label="选择交通方式"`），四种方式互斥；不提供"取消选择"入口（未选择即缓存无值）。
- 缓存键 `pawtrip:selected-transport-mode`，值为 `TransportMode` 字面量（`flight` / `high_speed_rail` / `train` / `drive`）。
- 读取在 `useState` 初始化函数内完成，`typeof window === "undefined"` 直接返回 `null`（SSR 安全）；读到的值必须在 `transportRuleRowModes` 内，否则丢弃。
- 写入在选中回调内 `try/catch` 包裹，`sessionStorage` 被禁用时静默降级（页面仍可用，只是不持久）。
- 选择 `sessionStorage` 而非 `localStorage`：语义是"本次行程的临时选择"，关闭标签页即失效；行程单页面与规则页同源，读得到。

### D7 档案查询模块

`apps/web/src/queries/pets.ts` 在 `#40`（`feature/add-paws-pet-management`）已存在：`Pet` / `SavePetInput` / `petQueryKeys` / `petsQueryOptions()` / `createPet`・`updatePet`・`deletePet` 及其 mutation options。本 change 不另建档案模块，只在该函数内补 `staleTime: 60_000` 与 `retry: 1`，页面用 `useQuery(petsQueryOptions())`，不额外做缓存层。

### D8 种子与验收账号分工

`scripts/seed-users.mjs` 新增验收账号 `petowner`（USER，口令 `123456`），并为它幂等写入两只宠物（先按 `user_id` 删除再插入，避免重复运行叠加）：

| 名称 | 类型 | 体重 | 肩高 | 牵引绳 | 检疫证明 | 用途 |
| --- | --- | --- | --- | --- | --- | --- |
| 豆豆 | CAT | 4.5kg | 25cm | 有 | 有 | 全部满足（推荐） |
| 毛毛 | DOG | 38kg | 55cm | 有 | 无 | 超重、超高、缺证（不推荐，且各行原因不同） |

`demo` 与 `admin` 不写档案：`demo` 供 `/paws` 的「空档案 → 新建/编辑/删除」流程（`#40`），`admin` 用于验证本 change 的「无档案隐藏列 + 提示按钮」。预置档案只放在 `petowner` 上，避免与上述两个场景在同一数据库并行执行时互相干扰（Playwright 多 worker 共享一个后端）。`run-e2e.mjs` 的 `verifySeededUsers` 已同步把 `petowner` 纳入账号与角色校验。

## Risks

- **并行会话**：主干上宠物档案能力由其他会话推进，`PetResponses.PetDetail` 字段可能变动（如新增品种）。判定只读取 `weightKg`/`shoulderHeightCm`/`hasVaccinationProof`，字段缺失时前端类型报错而非静默错判。
- **REQ-006 未归档**：本 change 的 delta 以叠加方式写在 `transport-rules-comparison-page` 规格上，必须等 REQ-006 合并后再归档本 change，否则规格文件会丢内容。
- **规则阈值仍需人工复核**（2026-11-16 已关闭）：REQ-006 遗留的 4 条 `verifiedOn: null` 已补齐，8 条规则复核日期均为 `2026-11-16`（复核记录见 `docs/ai4se-plugins/20261116-124503-local-verify-report.md`「规则复核闭合」）；本 change 不再受该门禁阻隔，但推荐结论仍随规则时效性变化。
- **判定口径的局限**：品种、烈性犬、笼具规格、办理时长都不参与判定，用户可能看到"推荐"但实际仍需人工确认；免责声明已覆盖，但文案未突出，属已知取舍。

## Open Questions

- 无（另：跳转目标 `/paws` 已接上，且该页已具备宠物管理（主干 `#40`）；`openspec/specs/paws-page/spec.md` 的「暂不承载业务内容」描述属于该规格自身的待同步项，不影响本 change）。
