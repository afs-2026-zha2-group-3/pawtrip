# Tasks

## 1. 数据层

- [x] 1.1 先写 `CityPetPolicySchemaMigrationTest`：断言 V15 后 `city_pet_policy` / `city_banned_dog_breed` 两表与约束存在、珠海行存在、禁养关联为 8 个可选犬种、未收录城市无行；在迁移编写前运行并确认失败。验证：`cd apps/server && ./mvnw -Dtest=CityPetPolicySchemaMigrationTest test` 先红。
- [x] 1.2 新增 `V15__create_city_pet_policy.sql`：建两表并写入珠海（440400）政策行；禁养犬种按 `dog_breed.name` 查找 id 写入关联（当前 8 个可映射品种），记录 `source_title`、`source_note`、`updated_month` 与 `area_scope="严格管理区"`。验证：1.1 的迁移测试转绿。
- [x] 1.3 新增 `CityPetPolicy` 实体（含 `@ManyToMany` 禁养犬种关联）与 `CityPetPolicyRepository`，映射可空 `area_scope`。验证：仓库往返测试（写入后读回政策条目、来源与更新月份一致，珠海关联 8 个品种）通过。

## 2. 后端接口

- [x] 2.1 先写 `CityPetPolicyApiTest`：覆盖禁养命中（`breedId=18`）、可携带命中（JDBC 写入允许表后 `breedId=10`）、两者都不在、无品种、目录外 id（`breedId=999`）、禁养关联为空、可携带未配置、未收录、行政区不存在、未登录，并加两个反向接口用例（`POST /api/cities/{adcode}/pet-policy` 返回 405、`GET /api/admin/pet-policies` 返回 404）。验证：`./mvnw -Dtest=CityPetPolicyApiTest test`。
- [x] 2.2 实现三态匹配：id 在禁养关联 → `matched:true, allowed:false`；不在禁养但在可携带关联 → `matched:false, allowed:true`；两者都不在或目录外 → `match:null`。验证：2.1 中匹配用例转绿。
- [x] 2.3 实现 `GET /api/cities/{adcode}/pet-policy?breedId=` 与响应 DTO（返回禁养与可携带犬种名单），并新增 `CITY_NOT_FOUND` 错误码；未收录返回 200 + `covered:false`，未知 adcode 返回 404。验证：`CityPetPolicyApiTest` 全类通过，含 401 与 404 用例。
- [x] 2.4 实现管理员维护城市可携带犬种：`GET/PUT /api/admin/cities/{adcode}/allowed-breeds`，校验城市级别与固定犬种目录，保存后政策查询立即返回新列表。验证：`AdminCityAllowedBreedsApiTest` 全类通过（含 403/400/404 与政策联动）。

## 3. 前端

- [x] 3.1 新增 `apps/web/src/queries/city-pet-policy.ts`：类型、query key `["city-pet-policy", adcode, breedId ?? null]` 与请求封装（`breedId` 仅在存在时入参）。验证：`npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 3.2 政策页接入 `petsQueryOptions()`：从 `GET /api/pets` 取第一只带犬种的宠物，用 `dogBreed.id` 驱动匹配；没有宠物或没有犬种时不判定。验证：`npx tsc --noEmit` 与 E2E。
- [x] 3.3 先写 `e2e/city-pet-policy.spec.ts`：用管理员账号通过宠物 API 造数据，覆盖禁养命中、两者都不在、无宠物、宠物无犬种、可携带未配置、未收录、行政区不存在、来源与免责，以及城市列表/档案表单/政策后台/订票四个反向用例。验证：`npm run test:e2e -- city-pet-policy`。
- [x] 3.4 实现路由 `apps/web/src/routes/_authenticated/destinations/$adcode/policy.tsx` 与多态页面（禁养命中红、可携带命中绿、两者都不在/无宠物/无犬种说明、未收录空态；404 交根错误页）；政策卡片始终展示禁养与可携带犬种的少量示例，来源说明使用用户可读文案。验证：3.3 的 E2E 用例转绿。
- [x] 3.5 重新生成 `routeTree.gen.ts` 并构建，确认只新增该路由、无手工编辑。验证：`npm run build` 成功且生成文件差异仅包含新路由。
- [x] 3.6 在城市浏览页（US-47）每个候选卡增加「查看政策」链接，跳转 `/destinations/{adcode}/policy`，不修改全局导航。验证：E2E 从 `/cities` 搜索珠海并进入政策页。
- [x] 3.7 补齐 `/admin/cities` 城市管理页：选择城市、从固定目录勾选可携带犬种并保存；复用 admin 路由守卫与现有组件，保存后失效政策查询缓存。验证：`npm run test:e2e -- city-pet-policy` 中管理员配置用例转绿。
- [x] 3.8 复跑全量 E2E，确认管理员配置可携带犬种后用户政策页显示"未命中禁养名单"，且其他政策用例不受影响。验证：`npm run test:e2e` 全绿。

## 4. 集成

- [x] 4.1 运行本地全量门禁：`./mvnw test`、`npm run build`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run test:e2e` 全部通过。验证：四条命令退出码为 0。
- [ ] 4.2 提交分支并发起 PR，确认 `server.yml`、`web.yml`、`e2e.yml` 三个工作流均通过。验证：PR 检查全绿，作为 G2 的输入证据。

## Workflow follow-up

- G2 由项目约定的人工签署人确认后进入归档。
- P5 归档时把 `city-pet-policy` delta 合并进 living spec，并更新知识库（如项目要求）。
- 档案品种已接入本页（读取第一只带犬种的宠物）；若后续支持多宠物选择，需在页面增加宠物切换。
- 若后续需要覆盖珠海通告的其余 30 个品种，先扩充 `dog_breed` 目录或补充名称映射，再追加 V16+ 关联数据。
- 后台目前只维护可携带犬种；政策文本、禁养名单与来源维护仍不在本变更范围。

## 契约调整记录（2026-11-16，材料性变更，待 G2 确认）

- 匹配输入由品种全称改为可选犬种目录 id（`?breedId=`）；V15 以 `city_banned_dog_breed` 关联表保存 8 个可映射品种，不再存 JSON 名单。
- 移除"品种为其他"与"名称不完全一致"场景，新增"品种不在可选犬种目录"场景；页面展示范围后续调整为少量示例，见下条。
- 匹配输入进一步改为当前用户宠物档案（第一只带犬种的宠物），移除 URL 品种参数；页面文案改为用户可读描述，来源说明不再暴露内部字段。
- 展示范围调整为始终展示禁养与可携带犬种的少量示例；可携带犬种复用 `city_allowed_dog_breed`，由后台管理系统维护，迁移不写种子。
- 匹配改为三态：禁养命中、可携带命中（未命中禁养）、两者都不在则不判定。
- 新增 `/admin/cities` 可携带犬种维护能力，数据由管理员从固定目录选择，不使用迁移或脚本预置。
- 该调整发生在 G1 之后，属材料性变更，需 IO/SA 在 G2 确认（见 `g1-decision.md` 补充记录）。
