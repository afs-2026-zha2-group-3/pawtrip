## Context

行程单 `/itinerary` 当前只有 Day 标签、当天路线规划入口与行程卡片，没有携带物品的数据模型与页面。行程数据在 `trip` 表（`total_days`、`transport_mode`、`pet_id`），宠物档案在 `pet` 表（`pet_type`、`weight_kg`、`shoulder_height_cm`、`has_leash`、`has_vaccination_proof`）。前后端分别使用 Spring Data JPA + Flyway（SQLite）与 TanStack Query + shadcn 组件。

US-18 要求按档案与行程场景生成清单并支持增删改与勾选，US-19 要求进度按已勾选物品数 / 总物品数统计并跨设备保留。已确认两项交互决策：

- 清单使用与「查看当天路线规划」一致的弹窗形态，行程单页同日展示打包进度。
- 清单生成后，读取时自动跟随当前行程（大交通、天数）与宠物档案同步模板项。

## Goals / Non-Goals

**Goals:**

- 一次行程一份服务端持久化清单，勾选态、数量覆盖、自定义物品跨刷新/设备保留。
- 静态人工模板 + 档案/行程映射生成，不调用 AI 或外部服务。
- 读取时按最新档案与行程合并模板项，保留用户数据，删除的模板项不复活。
- 行程单页入口、进度、弹窗复用现有组件与视觉风格，导出不含清单。

**Non-Goals:**

- 不做出发前未完成提醒（Release 2）、一键购买（Release 4）、AI 生成。
- 不新增清单模板表或后台维护界面；模板为代码内常量。
- 不引入新的 UI 依赖或自定义弹窗形态。
- 不改动行程计划、Day 选择与保存逻辑。

## Decisions

### 数据模型：清单 + 物品，模板项用状态位实现隐藏/墓碑

`V30__create_trip_packing_checklist.sql` 新建两张表：

```sql
CREATE TABLE trip_packing_checklist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (trip_id) REFERENCES trip(id) ON DELETE CASCADE
);

CREATE TABLE trip_packing_item (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id        INTEGER NOT NULL,
    category            TEXT NOT NULL CHECK (category IN ('DOCUMENTS','FOOD','TRAVEL','HEALTH','CLEANING')),
    name                TEXT NOT NULL,
    quantity            INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    checked             INTEGER NOT NULL DEFAULT 0,
    source              TEXT NOT NULL CHECK (source IN ('TEMPLATE','CUSTOM')),
    template_key        TEXT,
    state               TEXT NOT NULL CHECK (state IN ('ACTIVE','HIDDEN','DELETED')),
    quantity_overridden INTEGER NOT NULL DEFAULT 0,
    sort_order          INTEGER NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (checklist_id) REFERENCES trip_packing_checklist(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_packing_item_template ON trip_packing_item(checklist_id, template_key);
CREATE INDEX idx_packing_item_checklist ON trip_packing_item(checklist_id, state, sort_order);
```

- `state` 区分三种模板项生命周期：`ACTIVE` 展示、`HIDDEN` 因场景不再适用而隐藏、`DELETED` 用户显式删除的墓碑。`HIDDEN` 可再次适用时复活；`DELETED` 永不复活。
- 自定义物品固定 `source=CUSTOM`、`template_key=NULL`、`state=ACTIVE`。SQLite 唯一索引允许多个 `NULL`，不影响自定义项。
- `quantity_overridden` 标记用户手动改过的数量，同步时跳过覆盖。
- 分类在 DB 与 API 使用英文枚举值（`DOCUMENTS/FOOD/TRAVEL/HEALTH/CLEANING`），前端负责中文文案与固定顺序。避免 DB 中文值带来的编码与排序问题。
- 清单表不冗余 `user_id`：归属永远经由 `trip` 校验，减少一处可能不一致的状态。
- 行程删除依赖 FK `ON DELETE CASCADE` 级联删除清单与物品。SQLite 需确认连接已开启外键约束（现有迁移已使用 FK，沿用）。

### API：行程下嵌套资源，读不自动生成

| 方法 | 路径 | 成功 | 失败 |
|------|------|------|------|
| POST | `/api/trips/{tripId}/packing-checklist` | 首次 201 / 已有 200 | 404 `TRIP_NOT_FOUND`；409 `PET_PROFILE_REQUIRED` |
| GET | `/api/trips/{tripId}/packing-checklist` | 200（读取时先同步） | 404 `TRIP_NOT_FOUND`；404 `PACKING_CHECKLIST_NOT_FOUND` |
| POST | `/api/trips/{tripId}/packing-checklist/items` | 201 | 400 `VALIDATION_ERROR`；404 `PACKING_CHECKLIST_NOT_FOUND` |
| PUT | `/api/trips/{tripId}/packing-checklist/items/{itemId}` | 200 | 400、404 `PACKING_ITEM_NOT_FOUND` |
| DELETE | `/api/trips/{tripId}/packing-checklist/items/{itemId}` | 204 | 404 `PACKING_ITEM_NOT_FOUND` |

- 所有接口先 `findByIdAndUserId(tripId, userId)`，他人行程统一 404 `TRIP_NOT_FOUND`，不泄露存在性。
- GET 不自动创建；未生成返回 `PACKING_CHECKLIST_NOT_FOUND`，前端据此展示生成引导。
- POST 幂等：已存在清单时执行一次同步并返回 200，不重置任何用户数据。
- 错误码新增 `PACKING_CHECKLIST_NOT_FOUND(404)`、`PACKING_ITEM_NOT_FOUND(404)`、`PET_PROFILE_REQUIRED(409)`。
- 响应契约：

```json
{
  "tripId": 12,
  "transportMode": "flight",
  "totalDays": 5,
  "createdAt": "...",
  "updatedAt": "...",
  "progress": { "checked": 3, "total": 9 },
  "items": [
    {
      "id": 41,
      "category": "DOCUMENTS",
      "name": "检疫/免疫证明",
      "quantity": 1,
      "checked": false,
      "source": "TEMPLATE",
      "templateKey": "vaccination-proof"
    }
  ]
}
```

- `progress` 由后端按 `state=ACTIVE` 的物品行数计算，前端不重复推导；`total=0` 时 `checked=0`。
- 排序：分类固定顺序 `DOCUMENTS → FOOD → TRAVEL → HEALTH → CLEANING`，同类内按 `sort_order`、`id`。
- PUT 请求体 `{ name?, category?, quantity?, checked? }` 全可选，但至少一项；`quantity` 为 1–99 整数。对 `TEMPLATE` 物品只应用 `quantity`（并置 `quantity_overridden`）与 `checked`；`name/category` 由模板维护，忽略传入值，避免下一次同步被覆盖造成「改了又变回去」。`CUSTOM` 物品四项均可改。
- DELETE 对 `TEMPLATE` 置 `state=DELETED`；对 `CUSTOM` 直接删除行。两者都立即从响应与进度中消失。

### 模板与映射：代码内静态常量

```text
TemplateItem(templateKey, category, name, quantity, applicability)
```

固定分类顺序与基础模板（名称可直接作为静态种子文案）：

| templateKey | 分类 | 名称 | 数量 | 适用条件 |
|-------------|------|------|------|----------|
| vaccination-proof | DOCUMENTS | 疫苗证明 / 检疫/免疫证明 | 1 | `hasVaccinationProof` 或 `transportMode=flight` |
| food | FOOD | 主粮（份） | `totalDays × 2` | 始终 |
| food-bowl | FOOD | 折叠食盆 | 1 | 始终 |
| water-bowl | FOOD | 便携水碗 | 1 | 始终 |
| air-crate | TRAVEL | 航空箱（S/M/L 码） | 1 | `transportMode=flight` |
| cat-carrier | TRAVEL | 猫用运输包（S/M/L 码） | 1 | `pet_type=cat` 且非飞机 |
| dog-carrier | TRAVEL | 宠物运输包（S/M/L 码） | 1 | `pet_type=dog` 且非飞机 |
| leash | TRAVEL | 牵引绳（S/M/L 码） | 1 | `hasLeash` |
| first-aid | HEALTH | 宠物急救包 | 1 | 始终 |
| motion-sickness | HEALTH | 宠物晕车药 | 1 | `transportMode=drive` |
| pee-pads | CLEANING | 尿垫 | `max(1, totalDays)` | 始终 |
| poop-bags | CLEANING | 拾便袋 | 1 | `pet_type=dog` |
| wipes | CLEANING | 清洁湿巾 | 1 | 始终 |

- 尺寸档：箱包按体重 `≤5kg → S、≤15kg → M、>15kg → L`（猫 4.5kg → S，狗 18kg → L）；牵引绳按肩高 `<35cm → S、<55cm → M、≥55cm → L`。
- 名称中的尺码直接拼进 `name`，读取时按最新体重/肩高刷新，满足「档案变更更新模板项」。
- 飞机场景用 `air-crate` 替代运输包：猫飞机也生成航空箱，避免同时出现两件功能重复的容器。
- 疫苗证明在飞机场景统一命名为「检疫/免疫证明」，非飞机场景用「疫苗证明」。
- `sort_order` 生成规则：`分类序号 × 100 + 模板内序号`；自定义物品取同分类当前最大值 + 1，保证稳定排序。

### 读取时同步算法

`PackingChecklistService.read()` 在事务内执行：

1. 按 `trip + userId` 加载行程；按 `pet_id` 加载宠物，缺失则（生成时）抛 `PET_PROFILE_REQUIRED`。
2. 计算当前适用模板项集合（含名称、数量、排序）。
3. 逐项匹配既有行（按 `template_key`）：
   - 不存在 → 插入 `ACTIVE`、`checked=false`、`quantity_overridden=false`。
   - `DELETED` → 跳过，永不复活。
   - `HIDDEN` → 置 `ACTIVE`、`checked=false`；`name/category` 取模板；`quantity` 在未覆盖时取模板。
   - `ACTIVE` → 更新 `name/category`；`quantity` 仅在未覆盖时更新。
4. 既有 `ACTIVE` 模板行若不在适用集合 → 置 `HIDDEN`（保留行与 `quantity_overridden`；再次适用时按「新适用默认未勾选」处理）。
5. 自定义行完全不参与同步。
6. 写回并组装响应；`updated_at` 仅在真正有变更时刷新。

- 该算法只依赖 `template_key`，不依赖物品行 id，模板改名/换尺码不会产生重复行。
- 勾选态只在新插入或 `HIDDEN → ACTIVE` 时写 `false`；其余路径不触碰 `checked`。
- 并发：清单表 `trip_id UNIQUE` 兜底重复生成；生成冲突捕获唯一约束后回读既有清单（单用户单行程场景，概率极低）。

### 前端：复用现有 Dialog / Button / Checkbox / Input / Select

- `apps/web/src/queries/packing-checklist.ts`：
  - `packingChecklistQueryOptions(tripId)`：GET；捕获 `ApiError.code === "PACKING_CHECKLIST_NOT_FOUND"` 时返回 `null`，让「未生成」成为正常状态而非错误；其他错误继续抛出。
  - `useGeneratePackingChecklist`、`useCreatePackingItem`、`useUpdatePackingItem`、`useDeletePackingItem`：成功后 `invalidateQueries({ queryKey: ["packing-checklist", tripId] })`。
  - `packingChecklistQueryKey(tripId)` 统一导出，宠物保存/删除后按前缀 `["packing-checklist"]` 失效，触发档案同步。
- `apps/web/src/components/trip/packing-checklist-dialog.tsx`：
  - 形态对齐 `day-route-dialog.tsx`：`Dialog` + `DialogContent className="max-w-3xl print:hidden"` + 爪印贴纸 + 标题/描述。
  - 顶部进度：`已打包 X / Y 件`，100% 时展示完成文案；分组顺序固定五类，空分类不渲染分组标题。
  - 每行：`Checkbox` + 名称 + 数量 `Input type="number" min=1 max=99`（失焦/回车提交）+ 删除按钮（`Button variant="ghost" size="icon"`，`Trash2` 图标）。模板项与自定义物品在弹窗内均只暴露数量、勾选与删除；API 仍支持自定义项更新名称/分类，行内改名/改分类不纳入本期 UI。
  - 底部新增区：名称 `Input` + 分类 `Select` + 数量 `Input` + `Button` 新增。
  - 状态分支：未生成 → 引导 +「生成携带清单」按钮；`PET_PROFILE_REQUIRED` → 说明 + 链接 `/paws`；加载失败 → 可读错误 + 重试；空清单 → 空态 + 新增入口。
  - 操作失败：在弹窗内展示 `ApiError.detail`，保留当前列表与输入值。
  - 弹窗不触碰 itinerary 的 Day 状态。
- `apps/web/src/routes/_authenticated/itinerary.tsx`：
  - Day 标签行右侧操作区改为并排两个入口：「携带清单」(`ListChecks` 图标) 与既有「查看当天路线规划」；容器沿用 `flex flex-wrap items-center justify-between gap-3 print:hidden`。
  - 入口下/旁展示进度文案：`data === null` →「未生成」；查询错误 →「进度暂不可用」；否则「已打包 X / Y 件」。
  - 仅在有激活行程时展示；查询 `enabled: Boolean(activeTrip)`。
  - 弹窗受控于本地 `useState`，关闭后 Day 不变、不触发行程保存。
- 所有入口、进度、弹窗带 `print:hidden`，与现有导出隐藏策略一致。

### 测试策略

- 后端：
  - `PackingChecklistApiTest`（`@SpringBootTest` + `MockMvc`）：首次生成 201、重复生成 200 且不重置、他人行程 404、未登录 401、未生成 GET 404、无档案 409、增删改校验与持久化、勾选进度、行程删除级联。
  - `PackingTemplateTest`：猫 4.5kg 高铁 3 天（运输包 S、主粮 6、无航空箱/疫苗证明）、狗 18kg 飞机 5 天（航空箱 L、检疫证明、主粮 10）、`hasLeash` 真假、牵引绳尺寸档。
  - 同步测试：档案体重变化更新箱包尺码、天数变化更新主粮、交通切换增减场景项、自定义项/数量覆盖/勾选保留、删除模板项不复活。
  - `PackingChecklistSchemaMigrationTest`：V30 表、唯一约束、CHECK 约束、FK 级联。
- 前端：`packing-checklist-dialog` 组件测试（mock 查询/变更），覆盖生成引导、无档案引导、勾选调用、新增校验、100% 完成态、错误提示；如纯逻辑（分类排序、进度文案）抽为小函数则加单测。
- E2E `e2e/packing-checklist.spec.ts`：API 创建行程并设置激活行程 → 行程单显示「未生成」→ 打开弹窗生成 → 进度与分类 → 勾选后刷新保留 → 新增/改数量/删除 → 档案体重变化后重开弹窗箱包尺码更新且自定义项与勾选保留。
- 验证命令：`npm run test -w apps/web`、`npm run build`、`cd apps/server && ./mvnw test`、`node scripts/run-e2e.mjs e2e/packing-checklist.spec.ts`。

## Risks / Trade-offs

- **读取即同步带来写操作**：GET 会更新模板项。单用户行程数据量小（十级行），可接受；用事务保证一致性。若后续读多写多，可改为显式同步接口，本期不做。
- **模板项名称/分类不可改**：用户对模板项只能改数量与勾选。符合「按模板刷新名称」的规格，也避免同步回滚；自定义项的完整编辑不受影响。
- **HIDDEN 状态占用行**：切换交通方式会留下隐藏行，模板项数量有上限，数据量可控；墓碑行同理。若长期膨胀，可在后续版本清理。
- **SQLite 外键级联依赖连接配置**：现有迁移已使用 `ON DELETE CASCADE`，沿用既有连接配置；迁移测试会验证级联。
- **宠物删除与行程引用**：现网禁止删除被行程引用的宠物（`PET_IN_USE`），`PET_PROFILE_REQUIRED` 主要覆盖历史脏数据；仍按要求实现并测试。
- **进度口径为行数而非数量**：规格明确按物品行数，主粮数量 10 仍只计 1 行，页面文案用「件」可能引起误解；文案标注「X / Y 件」并按行统计，与验收一致。

## Migration Plan

1. 上线 V30 迁移，仅新增表与索引，不影响既有数据。
2. 后端新接口与前端同时发布；旧客户端不调用新接口，无兼容问题。
3. 回滚：删除前端入口即可停用；服务端表可保留，重新上线后继续使用。

## Open Questions

- 无。
