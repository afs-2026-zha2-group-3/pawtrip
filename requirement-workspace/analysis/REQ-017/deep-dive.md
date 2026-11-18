# REQ-017 Deep Dive — 行程携带清单与打包进度

- 上游需求：[REQ-017 行程携带清单与打包进度](../../requirements/REQ-017-trip-packing-checklist.md)
- Impact Brief：[impact-brief.md](impact-brief.md)
- OpenSpec change：`openspec/changes/2026-11-18-add-trip-packing-checklist/`
- 日期：2026-11-18
- 范围：行程携带清单的生成、模板映射、读取时同步、编辑与删除、勾选进度、API 与弹窗；不含 AI、模板管理、提醒推送、购物跳转、清单独立导出

## 1. 数据契约

### 1.1 表结构（V29）

`trip_packing_checklist`

| 列 | 类型 | 约束 | 语义 |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | 清单 id |
| `trip_id` | INTEGER | NOT NULL UNIQUE，FK → `trip(id)` ON DELETE CASCADE | 每行程唯一 |
| `created_at` / `updated_at` | TEXT | NOT NULL，默认 UTC ISO | 清单时间戳；同步有变化时 touch |

`trip_packing_item`

| 列 | 类型 | 约束 | 语义 |
|---|---|---|---|
| `id` | INTEGER | PK AUTOINCREMENT | 物品行 id |
| `checklist_id` | INTEGER | NOT NULL，FK → 清单 ON DELETE CASCADE | 所属清单 |
| `category` | TEXT | CHECK IN (`DOCUMENTS`,`FOOD`,`TRAVEL`,`HEALTH`,`CLEANING`) | 分类 |
| `name` | TEXT | NOT NULL | 展示名称 |
| `quantity` | INTEGER | CHECK BETWEEN 1 AND 99 | 数量 |
| `checked` | INTEGER | CHECK IN (0,1)，默认 0 | 勾选态 |
| `source` | TEXT | CHECK IN (`TEMPLATE`,`CUSTOM`) | 来源 |
| `template_key` | TEXT | 可空 | 模板键；自定义项为 `null` |
| `state` | TEXT | CHECK IN (`ACTIVE`,`HIDDEN`,`DELETED`) | 可见/场景隐藏/用户删除墓碑 |
| `quantity_overridden` | INTEGER | CHECK IN (0,1)，默认 0 | 用户是否手动改过数量 |
| `sort_order` | INTEGER | NOT NULL | 同分类内排序 |
| `created_at` / `updated_at` | TEXT | NOT NULL | 行时间戳 |

索引：`UNIQUE(checklist_id, template_key)`（SQLite 允许多个 `NULL`，自定义项不受限）；`(checklist_id, state, sort_order)` 用于读取。

### 1.2 API 契约

| 方法 | 路径 | 请求 | 成功 | 失败 |
|---|---|---|---|---|
| POST | `/api/trips/{tripId}/packing-checklist` | 无 | 201 新建 / 200 已存在，返回清单 | 404 行程不存在或非属主；409 `PET_PROFILE_REQUIRED` |
| GET | `/api/trips/{tripId}/packing-checklist` | 无 | 200 清单（含读取时同步） | 404 行程不存在或非属主；404 `PACKING_CHECKLIST_NOT_FOUND` 未生成 |
| POST | `/api/trips/{tripId}/packing-checklist/items` | `{name, category, quantity}` | 201 新物品 + `Location` | 400 校验失败；404 清单/行程不存在 |
| PUT | `/api/trips/{tripId}/packing-checklist/items/{itemId}` | `{name?, category?, quantity?, checked?}` 至少一项 | 200 更新后物品 | 400 校验失败/空请求；404 物品不属于该清单 |
| DELETE | `/api/trips/{tripId}/packing-checklist/items/{itemId}` | 无 | 204 | 404 物品不属于该清单 |

清单响应：

```json
{
  "tripId": 12,
  "transportMode": "high_speed_rail",
  "totalDays": 2,
  "createdAt": "2026-11-18T06:00:00Z",
  "updatedAt": "2026-11-18T06:05:00Z",
  "progress": { "checked": 3, "total": 9 },
  "items": [
    {
      "id": 41,
      "category": "DOCUMENTS",
      "name": "疫苗证明",
      "quantity": 1,
      "checked": true,
      "source": "TEMPLATE",
      "templateKey": "vaccination-proof"
    }
  ]
}
```

- 仅返回 `state=ACTIVE` 的物品；排序：分类固定顺序 → `sort_order` → `id`。
- 错误遵循 RFC 9457 Problem Details，`code` 为业务码，`detail` 为可展示文案。
- 属主校验：`tripId` 必须属于当前登录用户，否则统一 404，不泄露存在性。

### 1.3 模板键与映射

| templateKey | 分类 | 名称 | 数量 | 条件 |
|---|---|---|---|---|
| `vaccination-proof` | 证件 | 飞机：检疫/免疫证明；否则疫苗证明 | 1 | `hasVaccinationProof` 或飞机 |
| `food` | 饮食 | 主粮（份） | `totalDays × 2` | 总是 |
| `food-bowl` | 饮食 | 折叠食盆 | 1 | 总是 |
| `water-bowl` | 饮食 | 便携水碗 | 1 | 总是 |
| `air-crate` | 出行 | 航空箱（S/M/L 码） | 1 | 飞机 |
| `cat-carrier` | 出行 | 猫用运输包（S/M/L 码） | 1 | 猫且非飞机 |
| `dog-carrier` | 出行 | 宠物运输包（S/M/L 码） | 1 | 狗且非飞机 |
| `leash` | 出行 | 牵引绳（S/M/L 码） | 1 | `hasLeash` |
| `first-aid` | 健康 | 宠物急救包 | 1 | 总是 |
| `motion-sickness` | 健康 | 宠物晕车药 | 1 | 大交通为自驾 |
| `pee-pads` | 清洁 | 尿垫 | `max(1, totalDays)` | 总是 |
| `poop-bags` | 清洁 | 拾便袋 | 1 | 狗 |
| `wipes` | 清洁 | 清洁湿巾 | 1 | 总是 |

分档：体重 `≤5 → S`、`≤15 → M`、`>15 → L`；肩高 `<35 → S`、`<55 → M`、否则 `L`。

### 1.4 读取时同步算法

输入：当前清单、当前行程（`totalDays`、`transportMode`）、当前宠物档案（可缺失）。

1. 计算当前场景适用的模板项集合（键 → 名称/分类/数量/排序）。
2. 按 `template_key` 建立现有模板行索引（含 `HIDDEN` / `DELETED`）。
3. 对每个适用项：
   - 无现有行 → 插入 `ACTIVE` 模板行（未勾选，数量为模板值）。
   - 现有行为 `DELETED` → 跳过，不复活。
   - 现有行为 `HIDDEN` → 重新激活：刷新名称/分类/排序，未覆盖数量刷新，`checked=false`。
   - 现有行为 `ACTIVE` → 刷新名称/分类/排序；未覆盖数量刷新；保留 `checked`。
4. 对现有 `ACTIVE` 模板行中不再适用的项 → 置为 `HIDDEN`（保留行与 `quantity_overridden`）。
5. 自定义项永不参与隐藏/激活。
6. 任一行有变化时 touch 清单 `updated_at`；无变化不写。
7. 宠物档案缺失时跳过同步，返回现有清单；不自动创建档案。

### 1.5 编辑与删除语义

| 来源 | 名称/分类 | 数量 | 勾选 | 删除 |
|---|---|---|---|---|
| `TEMPLATE` | 不可改，随模板刷新 | 可改；写入 `quantity_overridden=1` | 可改 | 置 `DELETED`（墓碑），不物理删除 |
| `CUSTOM` | 可改 | 可改 | 可改 | 物理删除 |

- PUT 至少携带一个字段；模板项的 `name`/`category` 即使传入也忽略。
- 新增自定义项：名称 trim 后 1–50 字符；分类必须为枚举；数量 1–99；`sort_order = max(sort_order)+1`。
- 数量覆盖后，模板后续同步不再覆盖该行数量；场景隐藏再恢复也不覆盖。
- 删除模板项后，同一场景或场景切换均不复活；`UNIQUE(checklist_id, template_key)` 保证不会重复插入。

## 2. 边界分支

| 规则 | 分支 | 行为 | rationale |
|---|---|---|---|
| 生成 | 清单不存在 | 创建清单并同步，返回 201 | 首次生成 |
| 生成 | 清单已存在 | 同步后返回 200，不新建 | 幂等 |
| 生成 | 行程非属主/不存在 | 404 | 不泄露存在性 |
| 生成 | 档案不存在 | 409 `PET_PROFILE_REQUIRED`，不创建清单 | 需求明确引导 `/paws` |
| 读取 | 清单未生成 | 404 `PACKING_CHECKLIST_NOT_FOUND`；前端视为正常态 | 展示生成引导 |
| 读取 | 档案已被删除 | 跳过同步，返回现有清单 | 避免读取失败 |
| 读取 | 行程天数变化 | 主粮/尿垫数量按新天数刷新（未覆盖时） | 场景映射 |
| 读取 | 大交通切换 | 适用项增删：飞机 ↔ 非飞机、自驾晕车药 | 场景映射 |
| 读取 | 体重跨档 | 运输容器尺寸刷新 | 档案映射 |
| 读取 | 肩高跨档 | 牵引绳尺寸刷新 | 档案映射 |
| 读取 | 牵引绳/疫苗证明开关 | 对应模板项出现或隐藏 | 档案映射 |
| 读取 | 模板项曾因场景隐藏 | 场景恢复时重新出现，未勾选 | 隐藏非用户意图 |
| 读取 | 模板项已被用户删除 | 场景恢复也不出现 | 尊重用户删除 |
| 读取 | 用户手动改过数量 | 模板同步不覆盖 | 用户数据优先 |
| 读取 | 自定义项 | 永不隐藏/删除 | 用户数据优先 |
| 新增 | 名称为空/超长 | 400 校验失败 | 边界输入 |
| 新增 | 数量非 1–99 整数 | 400 校验失败 | 边界输入 |
| 新增 | 非法分类 | 400 校验失败 | 枚举约束 |
| 修改 | 空请求 | 400 校验失败 | 无意义请求 |
| 修改 | 模板项传名称/分类 | 忽略，仅应用数量/勾选 | 模板一致性 |
| 修改 | 物品不属于该清单 | 404 | 属主与归属 |
| 删除 | 自定义项 | 物理删除 | 无墓碑负担 |
| 删除 | 模板项 | 墓碑 `DELETED` | 防复活 |
| 删除 | 物品不存在/不属该清单 | 404 | 归属校验 |
| 级联 | 删除行程 | 清单与物品级联删除 | 数据一致性 |
| 迁移 | 历史行程无清单 | 不预生成，首次访问展示未生成 | 不改变既有数据 |
| 并发 | 两个请求同时生成 | `trip_id` 唯一约束兜底，捕获后按已存在处理 | 幂等 |
| 并发 | 两处同时修改同一清单 | 最后写入生效，无冲突提示 | 需求未要求合并策略 |

## 3. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| REQ-011 / trip-route-estimate | 行程单 Day 行布局与交通段 | 只在 Day 行右侧增加按钮与进度；不改交通段与快照 |
| REQ-016 / trip-itinerary 路线弹窗 | 同层弹窗与导出隔离 | 交互一致；两个弹窗互不依赖；均不进导出 |
| REQ-014 / paws-page | 档案字段与保存流程 | 只读消费；保存/删除后使清单查询失效，不新增字段 |
| trip-planning | 计划结构与自动保存 | 不修改 `plan_json`、不触发计划保存 |
| trip-context | 激活行程与 Trips 页 | 清单只作用于激活行程；切换行程时 query key 随之变化 |
| trip-itinerary 导出 | PDF/图片内容 | 弹窗不进入导出 DOM；既有导出行不变 |
| backend-data-access | JPA 仓库与事务 | 沿用实体/仓库与 `@Transactional` |
| backend-error-handling | Problem Details 与业务码 | 新增 3 个错误码，沿用异常映射 |
| frontend-data-fetching / frontend-api-request | TanStack Query 与 `request` | 新查询返回 404 时转为 `null`，不作为错误 |
| browser-e2e-testing | E2E 种子与隔离 | 复用 trip-helpers；档案改动需恢复 |

## 4. 展示契约

| 触发 / 界面 | 内容 | 状态 |
|---|---|---|
| `/itinerary` Day 标签行 | 「携带清单」按钮 + 「已打包 X / Y 件」 | 未生成显示「未生成」；读取失败显示「进度暂不可用」 |
| 弹窗标题 | 「携带清单」+ 说明「按宠物档案与行程场景生成，勾选与修改会自动保存」 | 头部复用爪印贴纸 |
| 加载中 | 「正在读取携带清单…」 | 不阻塞关闭 |
| 加载失败 | 「清单加载失败，请稍后重试」+ 重试 | 可重试 |
| 未生成 | 「尚未生成携带清单」+「生成携带清单」 | 不显示 0/0 |
| 无档案 | 说明 +「去创建宠物档案」链接 `/paws` | 生成失败后展示 |
| 清单 | 进度条文案 + 分类分组 + 物品行 | 空分类不展示 |
| 物品行 | 勾选框、名称、数量输入、删除按钮 | 勾选后名称加删除线 |
| 完成态 | 「全部打包完成，可以出发啦！」 | 全部物品勾选时 |
| 新增表单 | 名称、分类下拉、数量、新增按钮 | 默认分类「出行」、数量 1 |
| 校验错误 | 「请填写物品名称。」/「数量需为 1–99 的整数。」 | 行内提示 |
| 操作错误 | 服务端 `detail` 或「操作失败，请稍后重试。」 | 弹窗底部 |
| 导出 PDF/图片 | 不含弹窗内容 | 与既有导出一致 |

## 5. 测试计划

### 后端 API（`PackingChecklistApiTest`）

1. 生成返回 201 与模板项；重复生成返回 200 且清单 id 不变。
2. 未登录/非属主行程返回 404。
3. 档案缺失生成返回 409 `PET_PROFILE_REQUIRED`（直连 JDBC 构造）。
4. 新增/修改/删除自定义项；校验错误（空名称、数量越界、非法分类、空修改）。
5. 勾选与取消；进度按行统计。
6. 档案变化同步：体重跨档改容器、牵引绳/疫苗证明开关、猫狗切换、大交通高铁↔飞机往返。
7. 保留用户数据：自定义项、手动数量、勾选；删除模板项后场景切换不复活；隐藏项恢复且未勾选。
8. 删除行程级联删除清单与物品。

### 迁移（`PackingChecklistSchemaMigrationTest`）

- 表与列存在；唯一索引与查询索引存在；`trip_id` 唯一；分类/来源/状态/数量 CHECK 生效；删除行程级联。

### 模板单测（`PackingTemplateTest`）

- 猫/高铁/3 天：无航空箱、无检疫证明、主粮 6、猫用运输包 S。
- 狗/飞机/5 天：航空箱 L、检疫/免疫证明、主粮 10。
- 牵引绳条件与肩高分档；疫苗证明来自档案。
- 分类顺序与集合。

### 前端组件（`packing-checklist-dialog.test.tsx`）

- 生成后渲染分类与进度；勾选后进度与完成态。
- 新增自定义物品；空名称校验。
- 无档案引导 `/paws`。

### E2E（`e2e/packing-checklist.spec.ts`）

- E1 未生成 → 生成 → 9 项与分类 → 勾选 → 刷新持久化 → 全部勾选完成态。
- E2 自定义新增、主粮数量改 8、删除尿垫 → 刷新保留。
- E3 勾选 + 自定义后修改体重 4.5→12 → 运输包 S→M，勾选与自定义保留；测试结束恢复体重。

### 门禁命令

- 后端：`cd apps/server && ./mvnw test`
- 前端：`npm run test -w apps/web`
- 构建：`npm run build -w apps/web`
- E2E：`node scripts/run-e2e.mjs e2e/packing-checklist.spec.ts`
- 规格：`npx openspec validate 2026-11-18-add-trip-packing-checklist --strict`

## 6. DoR ⑨–⑫ 结论

- **⑨ 数据契约**：表结构、API、响应 JSON、模板键、同步算法与编辑语义均已定稿；无未决字段。
- **⑩ 边界分支**：生成/读取/同步/编辑/删除/级联/并发共 29 条分支均有明确行为；无未定义分支。
- **⑪ 跨 REQ 一致性**：与 trip-planning、trip-context、paws-page、trip-itinerary、导出、后端与前端基础设施逐项核对，无冲突；不影响既有行为。
- **⑫ 展示与测试**：入口、进度、弹窗各状态、分类与完成态已定义；后端/前端/E2E/迁移测试分层明确；E2E 种子污染风险有缓解。
- 结论：⑨–⑫ 全部 Pass；BLOCKER=0；无阻塞未知依赖。
