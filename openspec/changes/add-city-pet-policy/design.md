# Design

## Context

- 现状：`administrative_region` 已有 V7 结构化入园字段（数量、体重、牵引、疫苗、费用、预约），`pawtrip_location` 另有 V9 的 `allowed_pet_types`；两者都没有政策文本、禁养犬种名单、来源与更新时间。
- 行政区数据来自 V5 种子：333 个市级节点，珠海为 `440400 珠海市（city，父级 440000）`；北京等直辖市是 province 级叶节点。
- main 另有 `city_allowed_dog_breed`（城市允许品种，白名单方向）与 `dog_breed` 参考目录；本变更的禁养名单是黑名单，两者独立，不能互相推导。
- 宠物档案已合并（V8–V14）：`pet` 表有名称、类型、体重、肩高、牵引、疫苗、照片，以及 `dog_breed` 犬种关联（DOG 必填）；犬种取值来自 `dog_breed` 目录，与珠海禁养名单的全称仍存在命名差异。
- 前端为 TanStack Router 文件路由，受保护路由挂在 `_authenticated` 下；查询集中在 `apps/web/src/queries/`；`components/ui` 已有 Card / Button / Field 等基础组件但无 Alert / Badge；应用外壳为 Home / Paws / 城市浏览，管理员另有地点管理与城市管理 Tab。
- 后端按 `location` 模块的分层组织，接口统一 Problem Details + 稳定 `code`；`/api/**` 需认证。
- 需求与验收见 `proposal.md` 与 `specs/city-pet-policy/spec.md`，本文只描述实现方式。

## Goals / Non-Goals

**Goals:**

- 用独立、可空、可扩展的数据结构保存城市政策，并让"已收录/未收录"有唯一、可靠的判定。
- 提供一个只读接口与一个政策详情路由，行为与 spec 的四类匹配边界一致。
- 不修改 V7/V9 已合并的字段语义，不与其他并行 story 争用同一张表。
- API 与 E2E 验收可独立、确定性地运行。

**Non-Goals:**

- 城市列表、筛选、选定（US-47）；宠物档案持久化（US-01）；政策维护后台；站内订票。
- 模糊匹配、别名归一、混种血统与体型标准判定。
- 应用外壳导航改造；新增共享 UI 组件库。
- 性能、可观测性、韧性等 NFR 测试。

## Decisions

### 1. 新建 `city_pet_policy` 表，而不是继续扩行政区列

```text
city_pet_policy
  adcode          TEXT PRIMARY KEY REFERENCES administrative_region(adcode)
  area_scope      TEXT          -- 如"严格管理区"，可空
  policies_json   TEXT NOT NULL -- JSON 字符串数组，保序
  banned_breeds   TEXT NOT NULL -- JSON 字符串数组，保序
  source_title    TEXT NOT NULL
  source_note     TEXT          -- 链接或摘录说明，可空
  updated_month   TEXT NOT NULL -- 'YYYY-MM'
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  CHECK (updated_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')
```

- **已收录 = 该 adcode 有行；未收录 = 无行。** AC-3 不依赖"所有字段为空"这类脆弱约定。
- 政策文本与名单用 JSON 保存：MVP 只有珠海一城，服务端在内存中做集合判断即可；需要"按品种筛城市"时再拆子表。
- 备选：继续给 `administrative_region` 加 4 列。被否——每个城市都有行，无法自然表达"未收录"，只能约定 `source_title IS NOT NULL`；且该表被多个 story 共用，列会持续膨胀。
- 备选：政策条目与禁养犬种拆两张子表。推迟——当前没有按条目或按品种反查的需求，先避免三套实体与排序约束。

### 2. 只读接口：`GET /api/cities/{adcode}/pet-policy[?breed=...]`

```json
200 已收录：
{
  "adcode": "440400", "name": "珠海市", "covered": true,
  "areaScope": "严格管理区",
  "policies": ["..."],
  "bannedBreeds": ["比特斗牛梗犬", "..."],
  "source": { "title": "……通告", "note": "……" },
  "updatedMonth": "2025-07",
  "match": { "breed": "比特斗牛梗犬", "matched": true }
}

200 未收录：{ "adcode": "440300", "name": "深圳市", "covered": false }
404：Problem Details + code CITY_NOT_FOUND
```

- 未收录取 200 + `covered:false`，因为它不是错误；未知 adcode 才 404，避免把脏数据当空态。
- 城市名从 `administrative_region` 解析；政策行可选。行政区支持任意叶节点（市级或 province 级直辖市），当前只有珠海有政策行。
- 备选：未收录返回 404。被否——前端需要把它渲染成正常空态，Problem Details 会把正常状态变成错误分支。

### 3. 匹配只在后端，规则集中在一处

- 输入：可选 `breed`；空白按"没有品种"处理。
- 判定：
  - `breed` 为空 / `"其他"` / 名单为空 → `match: null`（不做结论）。
  - 名单非空且品种精确命中 → `matched: true`。
  - 名单非空且品种不在其中 → `matched: false`。
- 前端只渲染 `match`，不复制比较逻辑。
- 备选：前端拿 `bannedBreeds` 自行比较。被否——规则会分裂成两套，UAT 与 e2e 容易验出不同口径。
- 备选：别名归一、包含匹配。超出 MVP，且会造成"比特"误命中"比特斗牛梗犬"的歧义；保持精确比较。

### 4. 数据种子：V15 建表并写入珠海

- 迁移号使用 **V15**：main 已占用 V8–V14（宠物档案、犬种参考数据与宠物犬种关联），原计划的 V10 与 main 版本号冲突。
- 同一迁移创建表并插入珠海（`440400`）一行：`areaScope="严格管理区"`，政策条目来自条例与通告摘要，禁养名单按公开通告录入（38 种 + 2025 调整新增），`source_title`、`source_note`、`updated_month` 记录版本。
- 其他城市不建行，天然是"未收录"；后续城市用新的 V16+ 迁移追加，不修改已合并的 V15。
- 备选：拆 V15 建表 + V16 种子。被否——V5 已有建表与种子同迁移的先例，拆开无收益。
- 备选：做政策维护后台。超出本期范围，数据以人工摘录 + 发布前复核保证。

### 5. 前端路由与演示输入

- 路由文件：`apps/web/src/routes/_authenticated/destinations/$adcode/policy.tsx`，URL 为 `/destinations/{adcode}/policy`；不修改 `__root.tsx` 导航，入口留给 US-47。
- `validateSearch` 校验 `breed?: string`；查询键 `["city-pet-policy", adcode, breed ?? null]`，仅在 `breed` 存在时带查询参数。
- 演示模块 `apps/web/src/lib/demo-pet-profile.ts`：从 `breed` 搜索参数取品种；缺省返回 `null`（等价"没有档案"）。档案品种词表与本页珠海全称对齐后只替换该模块，路由与查询不变。
- 页面四态：命中（红色提示 + 名单中命中项强调）、未命中（绿色提示）、不判定（信息提示）、未收录（空态卡片）；404 交给根路由 `errorComponent` 展示 `ApiError.detail`。
- 不新建 `components/ui` 组件：提示条与品种标签用 Card + Tailwind 工具类组合，避免与其他 story 争用共享组件。
- 备选：把品种放进 query key 之外由组件状态管理。被否——URL 可分享、E2E 可直接驱动，且与将来档案 query 的替换边界一致。

### 6. 测试组织

- 后端 `CityPetPolicyApiTest`：MockMvc + 临时 SQLite；夹具直接写库构造"珠海已收录 / 名单为空 / 未收录 / 不存在"四种数据；覆盖命中、未命中、无品种、其他、名称不完全一致、401、404。
- 前端 `e2e/city-pet-policy.spec.ts`：`scripts/run-e2e.mjs` 的临时库执行全部迁移，珠海种子可用；未收录用 `440300`；品种用 `?breed=` 驱动；登录沿用 `demo / 123456`。
- 具体分层与反向用例见 `atdd-design.md`。

## Risks / Trade-offs

- [名单数据准确性无法由测试证明] → 强制记录来源、更新月份与免责声明；发布前人工复核；已知限制写入 G1 记录。
- [品种词表与名单不同源导致漏报] → 精确匹配；名单中的品种必须进入档案词表；"其他"不做安全承诺；已知限制明示。main 的 `dog_breed` 种子含"比特犬 / 藏獒 / 高加索犬 / 卡斯罗犬"，与珠海全称"比特斗牛梗犬 / 西藏獒犬 / 俄罗斯高加索犬 / 意大利卡斯罗犬"不一致；把档案品种接入本页前必须按 issue #1 的约束对齐全称或补映射，本变更不引入别名归一。
- [白名单与黑名单混用] → `city_allowed_dog_breed` 是允许品种白名单，本变更是禁养黑名单；不得用"不在白名单"推导禁养结论。
- [JSON 列不可按品种反查] → 当前只有一城，服务端集合判断足够；若 US-47 需要按品种筛城市，新增子表并迁移。
- [路由暂无入口] → 本期通过直接 URL 访问，US-47 落地后加链接；不临时改导航。
- [演示参数进入生产] → `breed` 参数集中在单个模块，档案品种词表与本页对齐后删除或替换，页面不直接读取 URL。
- [迁移号冲突] → main 已占用 V8–V14，本变更使用 V15；合并后不得再改号。
- [生成文件冲突] → `routeTree.gen.ts` 由 dev/build 重新生成，不手工编辑。

## Migration Plan

1. V15 迁移：建 `city_pet_policy` 表并写入珠海政策行。
2. 后端新增 `com.pawtrip.server.policy` 模块（实体、仓库、服务、控制器）与 `CITY_NOT_FOUND` 错误码。
3. 前端新增路由、查询封装与演示品种模块。
4. 补齐 API 与 E2E 验收测试，按 `atdd-design.md` 的红测顺序开发。
5. 回滚：Flyway 回退到 V14 并删除该表即可；不改动既有表结构，不涉及数据回填。

## Open Questions

无。珠海名单的具体条文与日期在实现时按公开发布页面录入；若录入时发现名单版本更新，仍按同一结构写入 V15，不改设计。
