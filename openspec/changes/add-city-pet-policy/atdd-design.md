# ATDD design — add-city-pet-policy

- Change：`add-city-pet-policy`
- 输入：`specs/city-pet-policy/spec.md`、`proposal.md`、G1 Pass（KITTY / LEO）
- 范围：只设计 API 与 E2E 验收层；单元测试留给 `/sdd:atdd-apply`

## 1. 分层结论

| # | Scenario | 层 | 附加建议 | 理由 |
|---|---|---|---|---|
| 1 | 查看已收录城市的政策 | API + E2E | — | 接口契约 + 页面展示都能独立验证 |
| 2 | 展示来源与时效 | API + E2E | — | 响应字段 + 页面脚注 |
| 3 | 品种命中禁养名单 | API + E2E | — | `match.matched=true` + 高亮提醒 |
| 4 | 品种在可携带名单中 | API | 测试夹具写入 `city_allowed_dog_breed` | `matched=false, allowed=true` |
| 5 | 品种既不在禁养也不在可携带 | API + E2E | — | `match=null` + 说明无法判断 |
| 6 | 没有品种信息 | API + E2E | — | `match=null` + 引导完善档案/说明无法判断 |
| 7 | 品种不在可选犬种目录 | API | — | `breedId` 无对应目录记录，`match=null` |
| 8 | 禁养犬种关联为空 | API | — | 夹具构造"已收录但禁养关联为空" |
| 9 | 可携带犬种未配置 | API + E2E | — | 返回空数组 + 页面占位，不推断允许 |
| 10 | 未收录城市空态 | API + E2E | — | `covered=false` + 空态页 |
| 11 | 仅有行政区记录 | API | — | 与 10 同契约，用测试数据区分 |
| 12 | 行政区不存在 | API | — | 404 + 稳定错误码 |
| 13 | 未登录访问 | API | security（advisory） | 沿用全局 `401 UNAUTHENTICATED` |
| 14 | 管理员保存可携带犬种 | API + E2E | — | `PUT` 后政策查询返回新列表 |
| 15 | 清空可携带犬种 | API | — | 空数组保存后页面占位 |
| 16 | 非管理员访问维护能力 | API | security（advisory） | 403 `ACCESS_DENIED` |

Deferred to `/sdd:atdd-apply`（单元级 TDD）：犬种 id 比较函数、覆盖状态派生等纯逻辑，不在本文件展开。

## 2. 生产代码前先写的验收

### API（`CityPetPolicyApiTest`，MockMvc + 临时 SQLite）

```text
GET /api/cities/{adcode}/pet-policy[?breedId=...]

200 已收录：
{
  "adcode":"440400","name":"珠海市","covered":true,
  "areaScope":"严格管理区",
  "policies":["..."],
  "bannedBreeds":["比特犬","..."],
  "allowedBreeds":[],
  "source":{"title":"《关于调整珠海市严格管理区内禁止饲养的危险犬标准及品种的通告》"},
  "updatedMonth":"2025-07",
  "match":{"breedId":18,"breedName":"比特犬","matched":true,"allowed":false} | null
}
200 未收录：{ "adcode":"440300","name":"深圳市","covered":false }
404：Problem Details + code CITY_NOT_FOUND
401：Problem Details + code UNAUTHENTICATED
```

红测清单：禁养命中（`breedId=18`）/ 可携带命中（夹具写入 allowed 后 `breedId=10`）/ 两者都不在（`match=null`）/ 无品种 / 目录外 id（`breedId=999`）/ 禁养关联为空 / 可携带未配置 / 未收录 / 行政区不存在 / 未登录。

### 管理员接口（`AdminCityAllowedBreedsApiTest`）

```text
GET /api/admin/cities/{adcode}/allowed-breeds
200：{ "adcode":"440400", "name":"珠海市", "allowedBreedIds":[], "breeds":[{"id":1,"name":"中华田园犬",...}] }

PUT /api/admin/cities/{adcode}/allowed-breeds
请求：{ "breedIds":[10,17] }
200：保存后的同结构响应；空数组表示清空

404：未知城市或非 city 级节点 + code CITY_NOT_FOUND
400：breed id 不在 dog_breed 目录 + code VALIDATION_ERROR
403：非管理员 + code ACCESS_DENIED
```

红测清单：读取目录 / 保存并立即影响政策查询 / 清空 / 未知品种 / 未知或非城市节点 / 非管理员。

### E2E（`e2e/city-pet-policy.spec.ts`）

访问 `/destinations/{adcode}/policy`，品种由当前用户宠物档案驱动（E2E 用管理员账号通过 `POST /api/pets` 造数据）：

| 用例 | 驱动方式 | 断言 |
|---|---|---|
| 命中 | 宠物犬种为比特犬（id 18） | 红色提醒含宠物名、"比特犬"与"该城市政策不支持携宠旅行"结论；展示禁养示例 |
| 不在可携带名单 | 宠物犬种为柯基犬（id 10，可携带未配置） | "暂时无法判断" + 禁养示例 + "暂未收录可携带犬种" |
| 无宠物 | 删除全部宠物 | 引导添加宠物 + 通用政策 |
| 宠物无犬种 | 宠物为猫 | 说明无法判断 |
| 未收录 | adcode=440300 | "暂无当地政策数据"空态 |
| 行政区不存在 | adcode=999999 | 错误页展示 `ApiError.detail` |
| 来源与免责 | 任一已收录用例 | 来源、更新月份、以最新文件为准、严格管理区脚注 |
| 城市浏览入口 | `/cities` 搜索珠海并点击「查看政策」 | 跳转 `/destinations/440400/policy` 并展示政策页 |
| 管理员配置可携带 | `/admin/cities` 选择珠海、勾选柯基犬并保存 | 用户政策页在犬种为柯基犬时显示"未命中禁养名单" |

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地后端 | `cd apps/server && ./mvnw test` | 含 `CityPetPolicyApiTest` |
| 本地前端 | `npm run build`、`npx tsc --noEmit -p apps/web/tsconfig.json` | 不新增检查项 |
| 本地 E2E | `npm run test:e2e` | runner 用临时 DB（18080/3100）并注入种子账号 |
| CI | 现有 `server.yml` / `web.yml` / `e2e.yml` | 不新增 CI 语义；PR 触发即门禁 |

## 4. 数据与夹具策略

- **API 夹具**：测试专用 SQLite（`target/policy-api-test.db`），Flyway 迁移后由仓库写入：珠海（已收录，含 8 个禁养关联）、另一城市（未收录）、一个"已收录但禁养关联为空"的测试行；可携带命中用例通过 JDBC 临时写入 `city_allowed_dog_breed` 并在清理时删除。认证用 `user("demo")` 后置处理器。
- **E2E 夹具**：`scripts/run-e2e.mjs` 每次创建临时 DB 并执行全部迁移，V15 的珠海禁养种子天然可用；可携带犬种未配置（由后台维护，迁移不写种子）；未收录用 440300（深圳，有行政区、无政策）；登录沿用 `demo / 123456`。
- **品种驱动**：前端读取 `GET /api/pets`，取第一只带犬种的宠物；E2E 用管理员账号通过 API 创建/清理宠物，不需要 mock 档案接口。
- **确定性**：接口按 adcode 精确查询；多宠物兜底按 id 升序取第一条（当前不适用，留给 US-01 联调）。

## 5. Non-goals 与反向验证

| Non-goal | 反向用例 |
|---|---|
| 城市列表 / 筛选 / 选定（US-47） | E2E：政策页不出现城市列表与筛选控件，不请求列表接口 |
| 宠物档案表单（US-01） | E2E：政策页无档案表单与保存按钮 |
| 政策维护后台 | API：`GET /api/admin/pet-policies` 返回 404；`POST /api/cities/{adcode}/pet-policy` 返回 405 |
| 站内订票 | E2E：政策页无订票入口或跳转 |

本 skill 不产出 Playwright/POM/Excel 生成器，也不新建 CI 产品。

## 6. NFR

不纳入。2026-11-16 与用户确认：本 change 不做性能、可观测性、韧性等 NFR 测试；安全沿用全局认证（401 已在 API 层覆盖）。
