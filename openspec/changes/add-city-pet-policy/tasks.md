# Tasks

## 1. 数据层

- [x] 1.1 先写 `CityPetPolicySchemaMigrationTest`：断言 V10 后 `city_pet_policy` 表与约束存在、珠海行存在、禁养名单数量与录入清单一致、未收录城市无行；在迁移编写前运行并确认失败。验证：`cd apps/server && ./mvnw -Dtest=CityPetPolicySchemaMigrationTest test` 先红。
- [x] 1.2 新增 `V10__create_city_pet_policy.sql`：建表并写入珠海（440400）政策行，按公开通告录入完整禁养名单，记录 `source_title`、`source_note`、`updated_month` 与 `area_scope="严格管理区"`。验证：1.1 的迁移测试转绿。
- [x] 1.3 新增 `CityPetPolicy` 实体与 `CityPetPolicyRepository`，映射 JSON 列与可空 `area_scope`。验证：仓库往返测试（写入后读回政策条目、名单、来源与更新月份一致）通过。

## 2. 后端接口

- [ ] 2.1 先写 `CityPetPolicyApiTest`：覆盖命中、未命中、无品种、品种为"其他"、名称不完全一致、名单为空、未收录、行政区不存在、未登录九类场景，并加两个反向接口用例（`POST /api/pets`、`GET /api/admin/pet-policies` 返回 404），在实现前确认失败。验证：`./mvnw -Dtest=CityPetPolicyApiTest test` 先红。
- [ ] 2.2 实现匹配服务：空品种 / "其他" / 空名单返回 `match:null`；精确命中 `matched:true`；名单非空但未命中 `matched:false`。验证：2.1 中四类匹配用例转绿。
- [ ] 2.3 实现 `GET /api/cities/{adcode}/pet-policy` 与响应 DTO，并新增 `CITY_NOT_FOUND` 错误码；未收录返回 200 + `covered:false`，未知 adcode 返回 404。验证：`CityPetPolicyApiTest` 全类通过，含 401 与 404 用例。

## 3. 前端

- [ ] 3.1 新增 `apps/web/src/queries/city-pet-policy.ts`：类型、query key `["city-pet-policy", adcode, breed ?? null]` 与请求封装（`breed` 仅在存在时入参）。验证：`npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [ ] 3.2 新增 `apps/web/src/lib/demo-pet-profile.ts`：从 `breed` 搜索参数取品种，缺省返回 `null`；为核心解析写 vitest 单测（有值、空值、其他）。验证：`npm run test -w apps/web` 通过。
- [ ] 3.3 先写 `e2e/city-pet-policy.spec.ts`：覆盖命中、未命中、无品种、其他、未收录、行政区不存在、来源与免责七类，以及城市列表/档案表单/政策后台/订票四个反向用例，实现前确认失败。验证：`npm run test:e2e -- city-pet-policy` 先红。
- [ ] 3.4 实现路由 `apps/web/src/routes/_authenticated/destinations/$adcode/policy.tsx`（`validateSearch` 校验 `breed`）与四态页面（命中红、未命中绿、不判定信息、未收录空态；404 交根错误页），不新增共享 UI 组件、不修改导航。验证：3.3 的 E2E 用例转绿。
- [ ] 3.5 重新生成 `routeTree.gen.ts` 并构建，确认只新增该路由、无手工编辑。验证：`npm run build` 成功且生成文件差异仅包含新路由。

## 4. 集成

- [ ] 4.1 运行本地全量门禁：`./mvnw test`、`npm run build`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run test:e2e` 全部通过。验证：四条命令退出码为 0。
- [ ] 4.2 提交分支并发起 PR，确认 `server.yml`、`web.yml`、`e2e.yml` 三个工作流均通过。验证：PR 检查全绿，作为 G2 的输入证据。

## Workflow follow-up

- G2 由项目约定的人工签署人确认后进入归档。
- P5 归档时把 `city-pet-policy` delta 合并进 living spec，并更新知识库（如项目要求）。
- US-01 落地后移除 `demo-pet-profile.ts`，改为读取宠物档案 query；路由与接口不变。
