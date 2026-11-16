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
| 4 | 品种未命中 | API + E2E | — | `matched=false` + 页面明确提示 |
| 5 | 没有品种信息 | API + E2E | — | `match=null` + 不判定提示 |
| 6 | 品种为"其他" | API + E2E | — | 不判定，说明精确匹配口径 |
| 7 | 品种名称不完全一致 | API | — | 属接口层判定，用响应断言即可 |
| 8 | 禁养名单为空 | API | — | 需要测试夹具构造"已收录但名单为空" |
| 9 | 未收录城市空态 | API + E2E | — | `covered=false` + 空态页 |
| 10 | 仅有行政区记录 | API | — | 与 9 同契约，用测试数据区分 |
| 11 | 行政区不存在 | API | — | 404 + 稳定错误码 |
| 12 | 未登录访问 | API | security（advisory） | 沿用全局 `401 UNAUTHENTICATED` |

Deferred to `/sdd:atdd-apply`（单元级 TDD）：品种比较函数、覆盖状态派生等纯逻辑，不在本文件展开。

## 2. 生产代码前先写的验收

### API（`CityPetPolicyApiTest`，MockMvc + 临时 SQLite）

```text
GET /api/cities/{adcode}/pet-policy[?breed=...]

200 已收录：
{
  "adcode":"440400","name":"珠海市","covered":true,
  "areaScope":"严格管理区",
  "policies":["..."],
  "bannedBreeds":["比特斗牛梗犬","..."],
  "source":{"title":"《关于调整珠海市严格管理区内禁止饲养的危险犬标准及品种的通告》"},
  "updatedMonth":"2025-07",
  "match":{"breed":"比特斗牛梗犬","matched":true} | null
}
200 未收录：{ "adcode":"440300","name":"深圳市","covered":false }
404：Problem Details + code CITY_NOT_FOUND
401：Problem Details + code UNAUTHENTICATED
```

红测清单：命中 / 未命中 / 无品种 / 品种为"其他" / 名称不完全一致（"比特" ≠ "比特斗牛梗犬"）/ 名单为空 / 未收录 / 行政区不存在 / 未登录。

### E2E（`e2e/city-pet-policy.spec.ts`）

访问 `/destinations/{adcode}/policy`，品种由演示输入驱动：

| 用例 | 驱动方式 | 断言 |
|---|---|---|
| 命中 | `?breed=比特斗牛梗犬` | 红色提醒含品种名与后果；名单含该品种 |
| 未命中 | `?breed=柯基犬` | 明确提示未命中，不是"可携带"承诺 |
| 无品种 | 不带 `breed` 参数 | 不判定提示 + 通用政策 |
| 其他 | `?breed=其他` | 不判定 + 说明精确匹配 |
| 未收录 | adcode=440300 | "暂无当地政策数据"空态 |
| 行政区不存在 | adcode=999999 | 错误页展示 `ApiError.detail` |
| 来源与免责 | 任一已收录用例 | 来源、更新月份、以最新文件为准、严格管理区脚注 |

## 3. 本地与 CI 门

| 环境 | 命令 | 说明 |
|---|---|---|
| 本地后端 | `cd apps/server && ./mvnw test` | 含 `CityPetPolicyApiTest` |
| 本地前端 | `npm run build`、`npx tsc --noEmit -p apps/web/tsconfig.json` | 不新增检查项 |
| 本地 E2E | `npm run test:e2e` | runner 用临时 DB（18080/3100）并注入种子账号 |
| CI | 现有 `server.yml` / `web.yml` / `e2e.yml` | 不新增 CI 语义；PR 触发即门禁 |

## 4. 数据与夹具策略

- **API 夹具**：测试专用 SQLite（`target/policy-api-test.db`），Flyway 迁移后由仓库写入：珠海（已收录，含代表品种）、另一城市（未收录）、一个"已收录但名单为空"的测试行；不存在的 adcode 直接请求。认证用 `user("demo")` 后置处理器。
- **E2E 夹具**：`scripts/run-e2e.mjs` 每次创建临时 DB 并执行全部迁移，V14 生产的珠海种子天然可用；未收录用 440300（深圳，有行政区、无政策）；登录沿用 `demo / 123456`。
- **品种驱动**：前端演示模块从 URL 读取 `breed`，缺省即"没有档案"；E2E 不需要 mock 档案接口；宠物档案提供品种字段后只替换该模块。
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
