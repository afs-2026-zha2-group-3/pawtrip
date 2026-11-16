# Design

## Context

- 现状：`administrative_region` 已有 V7 结构化入园字段（数量、体重、牵引、疫苗、费用、预约），`pawtrip_location` 另有 V9 的 `allowed_pet_types`；两者都没有政策文本、禁养犬种名单、来源与更新时间。
- 行政区数据来自 V5 种子：333 个市级节点，珠海为 `440400 珠海市（city，父级 440000）`；北京等直辖市是 province 级叶节点。
- main 另有 `city_allowed_dog_breed`（城市允许品种，白名单方向）与 `dog_breed` 参考目录；本变更复用允许品种表并随政策返回展示，但匹配只按禁养关联，白名单缺失不能推导为安全。
- 宠物档案已合并（V8–V14）：`pet` 表有名称、类型、体重、肩高、牵引、疫苗、照片，以及 `dog_breed` 犬种关联（DOG 必填）；犬种取值来自 `dog_breed` 目录（V13 共 20 个可选品种），禁养匹配直接复用该目录 id，避免依赖两套名称词表。
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
  source_title    TEXT NOT NULL
  source_note     TEXT          -- 链接或摘录说明，可空
  updated_month   TEXT NOT NULL -- 'YYYY-MM'
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  CHECK (updated_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]')

city_banned_dog_breed
  adcode          TEXT NOT NULL REFERENCES city_pet_policy(adcode) ON DELETE CASCADE
  dog_breed_id    INTEGER NOT NULL REFERENCES dog_breed(id) ON DELETE CASCADE
  PRIMARY KEY (adcode, dog_breed_id)
```

- **已收录 = 该 adcode 有行；未收录 = 无行。** AC-3 不依赖"所有字段为空"这类脆弱约定。
- 禁养犬种用关联表保存：匹配直接比较 `dog_breed.id`，与宠物档案共用同一份可选犬种目录，避免"名单全称 vs 档案简称"两套词表。
- 可携带犬种复用 main 的 `city_allowed_dog_breed`，只从 `dog_breed` 固定目录中选择；该表由后台管理系统维护，本迁移不写入种子。政策查询一并返回，页面展示少量示例。
- 备选：继续给 `administrative_region` 加列。被否——每个城市都有行，无法自然表达"未收录"，只能约定 `source_title IS NOT NULL`；且该表被多个 story 共用，列会持续膨胀。
- 备选：把禁养名单存成 JSON 字符串再按名称比较（初版）。被否——名称不一致时静默漏报，且无法与档案的犬种选择共用同一个标识。
- 备选：把政策条目也拆成子表。推迟——当前没有按条目或按品种反查的需求，先避免三套实体与排序约束。

### 2. 只读接口：`GET /api/cities/{adcode}/pet-policy[?breedId=...]`

```json
200 已收录：
{
  "adcode": "440400", "name": "珠海市", "covered": true,
  "areaScope": "严格管理区",
  "policies": ["..."],
  "bannedBreeds": ["比特犬", "..."],
  "allowedBreeds": ["柯基犬", "..."],
  "source": { "title": "……通告", "note": "……" },
  "updatedMonth": "2025-07",
  "match": { "breedId": 18, "breedName": "比特犬", "matched": true, "allowed": false }
}

200 未收录：{ "adcode": "440300", "name": "深圳市", "covered": false }
404：Problem Details + code CITY_NOT_FOUND
```

- 未收录取 200 + `covered:false`，因为它不是错误；未知 adcode 才 404，避免把脏数据当空态。
- 城市名从 `administrative_region` 解析；政策行可选。行政区支持任意叶节点（市级或 province 级直辖市），当前只有珠海有政策行。
- `bannedBreeds` 来自禁养关联，`allowedBreeds` 来自后台维护的城市允许品种表；两者都只含 `dog_breed` 目录内的品种，页面各展示少量示例。
- 备选：未收录返回 404。被否——前端需要把它渲染成正常空态，Problem Details 会把正常状态变成错误分支。

### 3. 匹配只在后端，规则集中在一处

- 输入：可选 `breedId`（正整数），由前端从当前用户宠物档案中第一只带犬种的宠物取得；缺失、非整数或不在 `dog_breed` 目录时按"不做判定"处理。
- 多宠物：`GET /api/pets` 按 id 升序返回，前端取第一只带犬种的宠物，符合 G1 已确认的单宠物口径与兜底规则。
- 判定（三态）：
  - id 在禁养关联中 → `matched: true, allowed: false`。
  - id 不在禁养关联但城市允许品种表中 → `matched: false, allowed: true`。
  - id 为空、不在目录、既不在禁养也不在可携带，或两个关联都未配置 → `match: null`（不做结论）。
- 禁养关联为空不会阻断判定：品种在可携带关联中仍返回"未命中禁养"；可携带关联为空时不能把"未命中禁养"当作安全。
- 前端只渲染 `match`，不复制比较逻辑。
- 备选：前端拿禁养名单自行比较。被否——规则会分裂成两套，UAT 与 e2e 容易验出不同口径。
- 备选：按品种全称精确匹配（初版）。被否——档案只能从 `dog_breed` 目录选品种，官方名单全称与目录名称不一致时会静默漏报；改用 id 后契约与数据源统一。
- 备选：别名归一、包含匹配。超出 MVP，且会造成"比特"误命中"比特犬"的歧义；仅做 id 相等判断。

### 4. 数据种子：V15 建表并写入珠海

- 迁移号使用 **V15**：main 已占用 V8–V14（宠物档案、犬种参考数据与宠物犬种关联），原计划的 V10 与 main 版本号冲突。
- 同一迁移创建 `city_pet_policy` 与 `city_banned_dog_breed`，并插入珠海（`440400`）一行：`areaScope="严格管理区"`，政策条目来自条例与通告摘要，`source_title`、`source_note`、`updated_month` 记录版本。
- 禁养关联通过 `dog_breed.name` 查找 id 写入，当前可映射 8 个可选品种：比特犬、藏獒、德国牧羊犬、罗威纳犬、杜宾犬、秋田犬、高加索犬、卡斯罗犬。官方全称对照：比特斗牛梗犬→比特犬、西藏獒犬→藏獒、俄罗斯高加索犬→高加索犬、意大利卡斯罗犬→卡斯罗犬。
- 珠海通告中其余 30 个品种不在 `dog_breed` 可选目录内，无法从档案选中，因此不参与判定；该限制写入 G1 补充记录，由 G2 确认。
- `city_allowed_dog_breed` 不在迁移中写种子：可携带品种由后台管理系统从固定目录中选择维护（见 D7）；未配置时接口返回空数组，页面显示"暂未收录可携带犬种"。
- 其他城市不建行，天然是"未收录"；后续城市用新的 V16+ 迁移追加，不修改已合并的 V15。
- 备选：拆 V15 建表 + V16 种子。被否——V5 已有建表与种子同迁移的先例，拆开无收益。
- 备选：向 `dog_breed` 目录补齐 30 个品种。超出本变更范围，且会改变 US-01 的档案词表；本期不扩目录。
- 备选：做政策维护后台。超出本期范围，数据以人工摘录 + 发布前复核保证。

### 5. 前端路由与宠物档案接入

- 路由文件：`apps/web/src/routes/_authenticated/destinations/$adcode/policy.tsx`，URL 为 `/destinations/{adcode}/policy`；在城市浏览页每个候选卡提供「查看政策」链接，不修改 `__root.tsx` 导航。
- 数据来源：`useQuery(petsQueryOptions())` 读取 `GET /api/pets`，取第一只带 `dogBreed` 的宠物，把 `dogBreed.id` 传给政策查询；查询键 `["city-pet-policy", adcode, breedId ?? null]`。
- 页面不接收 URL 品种参数：用户维护过档案后，判定结果必须与档案一致，避免分享链接或历史参数覆盖真实档案。
- 页面状态：命中（红色提示，指出宠物名与品种，说明该城市政策不支持携宠旅行）、未命中（绿色提示）、无宠物（引导添加宠物）、宠物无犬种（说明无法判断）、城市无禁养关联（说明暂时无法判断）、未收录（空态卡片）；404 交给根路由 `errorComponent` 展示 `ApiError.detail`。
- 页面在政策卡片内始终展示禁养犬种与可携带犬种的少量示例（各最多 6 个），命中与未命中状态都展示；两者都不是完整名单，需附"以当地政府通告为准"的说明。
- 可携带犬种为空时显示"暂未收录可携带犬种"，未列入可携带名单的品种显示"暂时无法判断"；匹配仍只依据禁养与可携带两个 id 关联。完整禁养名单不在页面展开，避免让用户自行核对长名单。
- 来源说明使用用户可读文案（如"内容整理自公开发布的通告，具体执行以当地主管部门解释为准"），不暴露内部字段或匹配实现。
- 不新建 `components/ui` 组件：提示条用 Card + Tailwind 工具类组合，避免与其他 story 争用共享组件。
- 备选：用 URL 参数传入品种（初版）。被否——用户已维护档案后仍让 URL 决定判定结果，容易与真实档案不一致；E2E 改用管理员账号通过 `POST /api/pets` 造数据驱动。

### 6. 测试组织

- 后端 `CityPetPolicyApiTest`：MockMvc + 临时 SQLite；夹具直接写库构造"珠海已收录 / 空关联 / 未收录 / 不存在"四种数据；覆盖禁养命中（id 18）、后台配置可携带（id 10 → `allowed:true`）、两者都不在（`match:null`）、无品种、目录外 id、401、404。
- 后端 `AdminCityAllowedBreedsApiTest`：管理员读取目录、保存/清空可携带犬种、未知品种/城市/非城市节点校验、非管理员拒绝，并验证政策查询立即反映保存结果。
- 前端 `e2e/city-pet-policy.spec.ts`：`scripts/run-e2e.mjs` 的临时库执行全部迁移，珠海种子可用；E2E 用管理员账号通过 `GET/POST/DELETE /api/pets` 创建和清理宠物，政策页据档案犬种判定；断言命中/未命中状态都展示禁养示例、可携带犬种未配置时显示占位、管理员在城市管理保存柯基犬后政策页显示"未命中禁养"。
- 具体分层与反向用例见 `atdd-design.md`。

### 7. 后台维护城市可携带犬种

- 接口：`GET /api/admin/cities/{adcode}/allowed-breeds` 返回城市名、当前可携带犬种 id 与固定犬种目录；`PUT` 接收 `{ "breedIds": [10, 17] }`，在同一事务内替换关联。空数组表示清空。
- 校验：adcode 必须存在且 `level='city'`，否则 404 `CITY_NOT_FOUND`；breed id 必须全部存在于 `dog_breed`，否则 400 `VALIDATION_ERROR`；沿用 `/api/admin/**` 的 ADMIN 权限。
- 页面：`/admin/cities` 提供城市下拉、犬种勾选与保存；复用 admin 路由守卫与 `Checkbox` / `Card` 组件；保存后失效政策查询缓存，重新进入用户页即可看到最新列表。
- 备选：用迁移或脚本预置可携带品种。被否——数据应由业务在后台维护，脚本无法覆盖后续城市调整。
- 取舍：本期不做审计与并发冲突检测，保存为整体替换（last write wins）；管理员操作频率低，可接受，后续需要时再加快照或版本号。

## Risks / Trade-offs

- [名单数据准确性无法由测试证明] → 强制记录来源、更新月份与免责声明；发布前人工复核；已知限制写入 G1 记录。
- [可选目录覆盖面不足导致漏报] → 珠海通告 38 种中只有 8 种可从档案选择，其余 30 种无法触发提醒；沿用 G1 已确认的"词表外品种不判定"，并在来源说明与 G1 补充记录中明示，后续按需扩目录或补映射。
- [官方名称与目录名称不同] → V15 通过 `dog_breed.name` 显式映射 8 个品种（比特斗牛梗犬→比特犬等）并保留注释；不引入运行时别名归一，避免同一品种出现多种判定口径。
- [白名单与黑名单混用] → `city_allowed_dog_breed` 是允许品种白名单，本变更只展示、不用于判定；禁养结论只来自禁养关联，白名单为空不得推导为安全。
- [可携带品种维护] → `city_allowed_dog_breed` 由后台管理系统维护，本迁移不写种子；上线前需在城市管理中配置，否则页面显示暂未收录。
- [后台误清空可携带名单] → 清空后页面只显示"暂未收录可携带犬种"，不会把品种误判为允许；保存为整体替换，需在操作后复核。
- [关联表按品种反查] → `city_banned_dog_breed` 已按 `dog_breed_id` 建索引；若 US-47 需要按品种筛城市，可直接查询该表。
- [多宠物判定范围] → 只使用第一只带犬种的宠物，其余宠物不参与本页判定；符合 G1 单宠物口径，若将来支持多宠物需在页面增加选择。
- [路由入口] → 城市浏览页（US-47）每个候选卡提供「查看政策」链接；不修改全局导航。
- [档案犬种缺失] → 宠物为猫或未填写犬种时不判定，页面明确说明无法判断，不把"无信息"当作安全。
- [迁移号冲突] → main 已占用 V8–V14，本变更使用 V15；合并后不得再改号。
- [生成文件冲突] → `routeTree.gen.ts` 由 dev/build 重新生成，不手工编辑。

## Migration Plan

1. V15 迁移：建 `city_pet_policy` 与 `city_banned_dog_breed`，写入珠海政策行与 8 个可选犬种关联。
2. 后端新增 `com.pawtrip.server.policy` 模块（实体、仓库、服务、控制器）与 `CITY_NOT_FOUND` 错误码。
3. 前端新增政策详情路由与查询封装，读取宠物档案犬种驱动匹配展示；补齐 `/admin/cities` 可携带犬种维护页。
4. 补齐 API 与 E2E 验收测试，按 `atdd-design.md` 的红测顺序开发。
5. 回滚：Flyway 回退到 V14 并删除两张表即可；不改动既有表结构，不涉及数据回填。

## Open Questions

无。珠海名单的具体条文与日期在实现时按公开发布页面录入；若录入时发现名单版本更新，仍按同一结构写入 V15，不改设计。

## 2026-11-17 修订记录（对齐当前代码）

- 匹配主体改为统一政策匹配主体：存在激活行程且已绑定宠物时仅判定该宠物，否则判定全部宠物，并以宠物名 tag 展示；页面不再取"第一只带犬种的宠物"传入 `breedId`。`GET /api/cities/{adcode}/pet-policy` 仍保留可选 `breedId`，页面以 `breedId=null` 查询后在前端完成逐宠物判定。
- 政策入口从候选卡「查看政策」迁移到城市详情视图的「查看完整城市政策」；选定城市后 `/cities` 展示城市详情。
- 管理员维护可携带犬种改为复用 `/admin/cities` 城市管理页与 `PATCH /api/admin/cities/{adcode}` 的 `allowedDogBreedIds` 整体替换；原 `GET/PUT /api/admin/cities/{adcode}/allowed-breeds` 未落地。
- 上述调整由 `add-frontend-trip-context` 与 `location-and-city-policy-editing` 引入，本变更实现随之对齐。
