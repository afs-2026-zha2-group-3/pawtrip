# ATDD Design — add-location-card-media

- 日期：2026-11-17
- 上游：`specs/location-management/spec.md`（1 需求）、`specs/trip-attractions/spec.md`（3 需求）、`dov-ac-review.md`、`design.md`、`tasks.md`
- 基线：main `87a1a45`；既有 `LocationQueryApiTest`、`e2e/attraction-pet-rules.spec.ts`、`scripts/seed-e2e-attractions.mjs` 在其上扩展，不另起炉灶

## 1. 验收层范围

| 层 | 框架与位置 | 说明 |
|---|---|---|
| API | `@SpringBootTest` + `@AutoConfigureMockMvc` + 独立 SQLite，扩展 `apps/server/.../location/LocationQueryApiTest.java` | 列表/详情媒体字段契约：首张选取、缺失 null、rating 透传、DB-only、管理边界 absence |
| E2E | Playwright（Chromium），扩展 `e2e/attraction-pet-rules.spec.ts`；真实后端 + 独立 E2E SQLite；图片用 route 拦截确定性夹具 | 用户可见路径：卡片封面/评分/摘要行 → 降级 → 详情弹窗 → 类型切换 → 操作回归 |
| Defer UT | vitest：`lib/location-summary.ts` 纯函数、`-location-cover.tsx` / `-location-rating.tsx` 组件、卡片/弹窗结构 | apply 期 unit-level TDD，本文不展开 UT 套件（见 §8） |

NFR 测试：本 change 无 SLA/并发/可观测性新需求，不新增 NFR 验收（沿用 REQ-009 口径）；批量照片查询的 N+1 规避由 design D1 与代码审查保证。

## 2. 场景分层表

| # | 场景（需求来源） | 层 | 依据 |
|---|---|---|---|
| A1 | 列表项含 `coverPhotoUrl`（首张照片 URL）与 `rating`（"4.6"）；既有字段不变（封面与评分字段/列表项携带） | API | 单端点 body 契约 |
| A2 | 多张照片按 `photo_order` 取第一张（封面取第一张照片） | API | 排序契约 |
| A3 | 无照片且快照无 rating → 两字段均 `null`，响应结构不变（媒体数据缺失） | API | 可空契约 |
| A4 | 详情 `GET /api/locations/{poiId}` 含同语义两字段；既有详情字段不变（详情携带） | API | 单端点 body 契约 |
| A5 | rating 快照为空串/空白/非法 JSON → `null`（design D2；媒体缺失边界） | API | 解析兜底 |
| A6 | 列表/详情读取不触发高德交互（媒体字段只读数据库） | API | `verifyNoInteractions(placeSearchPort)` |
| A7 | 反向：用户端列表/详情 JSON 不含原始 POI、完整 `business`、照片列表/照片元数据（管理边界） | API | JSON absence |
| A8 | 回归：管理端已保存列表多出两个标量但既有字段与筛选不变；管理详情仍含 poi/business/photos（D3） | API | 增量兼容 |
| A9 | 回归：未认证 401、不存在 404、非法参数 400 不变 | API | 既有契约回归 |
| E1 | 有图有分地点：卡片顶部封面可见（16:9 容器）、地址行星标 + 「4.6」（卡片封面与评分） | E2E | UI 可见 |
| E2 | 无图地点：封面区域中性占位（图标 + 类型标签）；名称/政策/操作正常（无照片占位） | E2E | UI 可见 |
| E3 | 图片 URL 加载失败（route abort）：占位与 E2 一致；无「获取图片」/重试按钮（加载失败降级） | E2E | UI + absence |
| E4 | 无 rating 地点：不出现评分元素；地址正常（评分缺失隐藏） | E2E | absence 断言 |
| E5 | 体重 15 + 附加费 8000 地点：行文案「≤15 kg」「附加费 ¥80」，无肩高项；全空地点整行不出现（限制费用行） | E2E | UI 文案 + absence |
| E6 | 牵引 + 疫苗 true 地点：说明行含「公共区域需牵引」「需疫苗证明」；无可生成项地点整行不出现（政策说明行） | E2E | UI 文案 + absence |
| E7 | 打开详情弹窗：头部封面 + 评分；政策字段、逐宠物 tag、「添加到行程/暂不排期」保留；无图无分地点弹窗占位 + 评分隐藏（弹窗媒体同步/降级） | E2E | 跨组件 UI |
| E8 | 切换住宿/餐厅类型：卡片结构一致；查看详情、添加第 N 天、暂不排期、已加入徽章行为不变（类型结构一致） | E2E | 操作回归 |
| E9 | 反向：卡片与弹窗不出现「押金」「清洁费」字样；无评分排序/筛选控件、无多图轮播（Non-goals） | E2E | absence 断言 |
| E10 | 回归：管理端地点编辑弹窗照片预览与政策编辑不变（零管理端改动） | E2E | 既有 `admin-location-management.spec.ts` 保持绿 |

## 3. 先于生产代码编写（red 顺序）

1. **A1–A5 先红**：扩展 `LocationQueryApiTest`，fixture 插入照片与 rating 快照；断言两字段值/首张/null → 驱动 D1 批量查询、D2 解析与 D3 DTO。
2. **A6–A9 同批红→绿**：DB-only、absence 与管理端/错误契约回归随 API 实现转绿。
3. **E1–E7 先红**：扩展 E2E 种子（rating + 照片 + 组合）与 route 夹具；先写卡片媒体/摘要行/弹窗断言 → 驱动前端组件与卡片重构。
4. **E8–E10 回归与反向**随主体红→绿；既有 E2E 全量保持绿。
5. 纯函数与组件 UT 在 apply 期 TDD 补齐（§8）。

## 4. 本地 vs CI 门禁

- 本地 API：`cd apps/server && ./mvnw test`（与 CI 同一测试）
- 本地 E2E：`npm run test:e2e`（无头 Chromium，与 CI 相同）
- 前端：`npm run build` + vitest（apps/web）
- CI：既有 GitHub Actions，任一失败即阻断
- 回归：`AdminLocationApiTest`、`admin-location-management` / `destination-selection` / `trip-duration-input` 等既有 E2E 必须保持绿

## 5. 数据 / fixtures 策略

**API 层**

- 沿用 `LocationQueryApiTest` 独立 SQLite 与 `@BeforeEach` 清表；新增 fixture：
  - 地点甲：2 张照片（`photo_order` 0/1，URL 不同）+ `business_json` `{"rating":"4.6"}` → A1/A2。
  - 地点乙：无照片 + `business_json` `{}` → A3。
  - 地点丙：`business_json` `{"rating":"  "}` 与非法 JSON 各一例 → A5。
- `@MockitoBean PlaceSearchPort` 断言无高德交互（A6）。

**E2E 层**

- 扩展 `scripts/seed-e2e-attractions.mjs`（只操作临时 E2E 库）：
  - 既有 `e2e-zhu-a`（情侣路）：`business_json` 写 `{"rating":"4.6"}`；插入 2 张 `location_photo`（order 0/1），`source_url` 用确定性假域 `https://photos.e2e.test/a-0.png` / `a-1.png` → 首张断言。
  - 既有 `e2e-zhu-b`：无照片、无 rating → 占位/隐藏。
  - 既有 `e2e-zhu-hotel`：1 张照片 `https://photos.e2e.test/broken.png` + rating "4.8" → 失败降级。
  - 政策组合：甲体重 15 + 附加费 8000 + 牵引/疫苗 true；乙全空 → 行隐藏。
- Playwright `page.route("https://photos.e2e.test/**")`：`a-*.png` 返回本地 1×1 PNG 字节（fulfill），`broken.png` abort → 不依赖外网，失败态确定性。
- 幂等：按 `poi_id`/`location_id` 覆盖写入，重跑不残留。

## 6. Non-goals 与反向验证

| Non-goal | 反向用例 | 层 |
|---|---|---|
| 押金/清洁费/描述新字段 | E9：无「押金」「清洁费」文案；代码审查无新 migration/列 | E2E + 审查 |
| 管理端照片/评分维护 | E10：管理弹窗无新增编辑项；A8 管理详情契约不变 | E2E + API |
| 图片代理/下载/重试 | E3：无重试按钮；A6 后端不请求照片 URL；审查无二进制接口 | E2E + API |
| 评分排序/筛选、多图轮播 | E9：无相应控件 | E2E |
| 高德实时补拉 | A6：`verifyNoInteractions(placeSearchPort)` | API |
| 原始 POI/business/照片列表下发 | A7：用户端 JSON absence | API |

## 7. NFR 测试

不纳入：无 SLA/并发/可观测性新需求。照片批量查询防 N+1 由 D1 设计 + 代码审查覆盖（每页恰好一次照片 IN 查询）。

## 8. Defer UT 清单（apply 期 TDD）

- `restrictionFeeParts`：顺序 体重→肩高→附加费；去尾零（15.0→15）；分转元（8000→¥80、8050→¥80.5）；null 跳过；全空→[]。
- `policyNoteParts`：三布尔 true 短语映射；false/null 不生成；全空→[]。
- rating 校验：null/空白/非数值→隐藏；"4.6" 原样展示。
- `safeImageUrl` 迁移后管理端与封面组件行为一致（http/https 通过、data:/相对/非法→undefined）。
- 封面组件：null/失败/非法 URL → 占位（图标 + 类型标签）；有效 URL → img（no-referrer）。
- 卡片/弹窗结构：媒体区顺序、行隐藏、操作入口保留。