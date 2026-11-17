---
id: REQ-013
title: 地点浏览卡片展示图片与评分
status: ready
discovery: Go (2026-11-17)
sources:
  - ../intents/REQ-013-location-browse-card-media.md
  - openspec/specs/trip-attractions/spec.md
  - openspec/changes/unify-location-browsing/proposal.md
  - docs/knowledge/external/README.md
---

# REQ-013：地点浏览卡片展示图片与评分

## Discovery Decision

Go — 需求方向明确：用户端地点浏览卡片按参考图结构重构（封面图 → 名称 → 地址+星级评分 → 政策标签 → 限制与费用行 → 政策说明行），详情弹窗同步展示封面图与评分。关键事实（2026-11-17 代码与开发库核实）：照片（`location_photo`）与评分（`business_json.rating`，如 "4.3"/"4.8"）已随高德 POI 快照入库，仅用户端 API 与卡片未暴露，因此零迁移、零管理端改动即可落地。4 个 blocking OQ 已于 2026-11-17 与用户确认 resolved（全部采纳推荐）。编号 REQ-013 由用户指定。

## 六字段

1. **id**：REQ-013
2. **statement**：已登录用户在激活行程城市下浏览地点时，地点卡片展示封面照片、名称、地址与星级评分、宠物政策标签、关键限制与费用、由政策自动生成的说明文字；详情弹窗同步展示封面照片与评分。图片与评分复用已入库的高德照片与商业信息快照，缺失时优雅降级。
3. **actors**：
   - 已登录用户：浏览地点卡片与详情，据图片、评分与政策摘要快速筛选
   - 后端 `apps/server`：用户端地点列表/详情 DTO 暴露封面照片 URL 与评分（只读数据库）
   - 前端 `apps/web`：重构 `LocationCard` 与详情弹窗头部，浏览器直载图片
   - 管理员：不受影响（既有照片预览与政策编辑保持不变）
4. **rationale**：当前卡片只有文字与政策标签，缺少图片与评分这两个最直观的筛选信号；数据已在库却未暴露，补齐展示可显著提升浏览与决策效率，且改动面小。
5. **acceptance hints**：
   - AC-1：有已保存照片的地点，卡片顶部展示第一张照片作为封面；详情弹窗同样展示
   - AC-2：`business_json.rating` 存在时，地址行展示琥珀色星标与评分（如 ★ 4.6）；无评分时隐藏
   - AC-3：无照片或图片加载失败时显示中性占位，卡片其余信息与操作不受影响
   - AC-4：限制与费用行按现有字段展示（如「≤15 kg · 附加费 ¥80」），null 项不展示
   - AC-5：说明行由政策字段自动生成（如「公共区域需牵引 · 需疫苗证明」）
   - AC-6：6 个地点类型 Tab 卡片结构一致；查看详情、添加到行程、暂不排期操作保持不变
6. **links to evidence**：
   - 用户端卡片现状（无图片/评分）：`apps/web/src/routes/_authenticated/attractions/-location-card.tsx`
   - 用户端 DTO（无图片/评分）：`apps/server/src/main/java/com/pawtrip/server/location/LocationQueryResponses.java`
   - 照片已入库且管理端可预览（直载 + 失败降级 + `safeImageUrl` http/https 校验）：`apps/web/src/routes/_authenticated/admin/-location-editor.tsx`（`LocationPhotoPreview`）
   - 高德快照含 rating（开发库抽样 2026-11-17）：`pawtrip_location.business_json` 如 `{"keytag":"经济型","rating":"4.8",...}`；2 个地点共 6 张照片
   - 高德集成口径（照片浏览器直载、不落二进制）：`docs/knowledge/external/README.md`
   - 浏览统一架构（6 Tab 共用卡片与共用列表 API）：`openspec/changes/unify-location-browsing/`（11/11 tasks complete，代码已在 main，change 尚未归档）

## Ready 形状

### Intent

把已入库的高德照片与评分暴露到用户端地点列表/详情 API，并按参考图把地点卡片重构为「封面图 + 名称 + 地址★评分 + 政策标签 + 限制费用行 + 政策说明行」结构；详情弹窗头部同步封面图与评分。不新增数据字段，不改管理端。

### Actors 与权限边界

- 已登录用户：只读浏览；接口沿用现有登录保护（401），不要求 ADMIN。
- 后端只读数据库（`pawtrip_location` + `location_photo`），MUST NOT 调用高德。
- 管理端接口与编辑能力不变；原始 POI/商业信息/照片列表详情仍仅管理员可见，用户端只暴露封面 URL 与评分两个标量。

### In / Out Scope

**In**

- 后端用户端 `GET /api/locations` 列表项与 `GET /api/locations/{poiId}` 详情新增可空字段：封面照片 URL（第一张照片 `source_url`）、评分（`business_json.rating`）
- 前端 `LocationCard` 重构为参考图结构（封面图、名称、地址+★评分、既有政策标签、限制与费用行、政策说明行）
- 详情弹窗头部展示封面图与评分，既有政策字段与行程操作保留
- 图片失败/缺失降级（中性占位）；评分缺失隐藏；限制/费用/说明行按有值项展示
- 6 个类型 Tab 通用；前端单测与 E2E 更新

**Out**

- 押金、清洁费、自由文本描述等新数据字段（已决：复用现有字段）
- 管理端照片/评分维护、上传或挑选封面
- 图片服务端下载、代理或存储（沿用浏览器直载口径）
- 用户评分/评论、多图轮播、按评分排序/筛选
- 高德实时补拉照片或评分（DB-only）

### Scenarios + AC Hints

#### S1：封面图展示（AC-1）

- **Given** 激活行程城市内某地点已保存照片（`location_photo` 有记录）
- **When** 用户浏览地点列表
- **Then** 该卡片顶部展示第一张照片作为封面（固定宽高比裁切），浏览器直载来源 URL

#### S2：评分展示（AC-2）

- **Given** 地点 `business_json.rating` = "4.6"
- **When** 用户浏览卡片或打开详情
- **Then** 地址行展示琥珀色星标与「4.6」；rating 缺失或非数值时不展示评分元素

#### S3：图片缺失/加载失败降级（AC-3）

- **Given** 地点无照片，或照片 URL 加载失败/非 http(s)
- **When** 用户浏览卡片
- **Then** 封面区域显示中性占位（图标 + 类型标签），名称、政策、操作按钮均正常

#### S4：限制与费用行（AC-4）

- **Given** 地点 `maxSinglePetWeightKg`=15、`extraFeeCents`=8000、其余限制为 null
- **When** 用户浏览卡片
- **Then** 展示「≤15 kg · 附加费 ¥80」；null 项不出现；全部为空时整行隐藏

#### S5：政策说明行（AC-5）

- **Given** 地点 `leashRequired`=true、`vaccinationProofRequired`=true
- **When** 用户浏览卡片
- **Then** 说明行展示自动文案「公共区域需牵引 · 需疫苗证明」；无可生成项时整行隐藏

#### S6：详情弹窗同步（AC-1/AC-2）

- **Given** 用户点击「查看详情」
- **When** 弹窗打开
- **Then** 头部展示封面图与评分（降级规则同卡片），既有 8 项政策展示与添加行程操作不变

#### S7：类型通用与操作回归（AC-6）

- **Given** 用户切换住宿/宠物医院/餐厅等类型 Tab
- **When** 浏览各类型列表
- **Then** 卡片结构一致；查看详情、添加到行程（第 N 天）、暂不排期、已加入徽章行为与现状一致

#### S8：API 契约

- **Given** 已登录用户
- **When** 请求 `GET /api/locations` 或 `GET /api/locations/{poiId}`
- **Then** 响应含可空封面照片 URL 与评分字段；只读数据库；未认证 401、不存在 404 行为不变

### Constraints

- 零 Flyway 迁移、零新依赖、零管理端改动。
- 后端 DB-only，不调用高德；评分来自快照字符串，展示原样（一位小数），不做数值运算或排序。
- 图片沿用管理端既有安全模式：仅 http/https URL、`referrerPolicy="no-referrer"`、`onError` 降级；图片可用性依赖上游 URL。
- 用户端只暴露封面 URL 与评分两个标量，不下发完整 `business_json`/照片列表（管理端边界不变）。
- 前端遵循 TanStack Query/`request` 层约定与 shadcn 组件语言；卡片网格布局（sm 两列）保持。
- 实现前形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。
- 依赖：`unify-location-browsing` 代码已在 main（PR #60）；其 change 包尚未归档，P2 拆 delta 时以其契约为准，避免与未归档 delta 冲突。

### Context

- 卡片与列表/详情 API 由 `unify-location-browsing` 统一：6 类型 Tab 共用 `LocationCard`，用户端与管理端共用 `GET /api/locations`。
- 高德 POI 2.0 `show_fields=business,photos`：business 含 rating（字符串）、keytag 等；photos 含 title + url。保存地点时已快照入库。
- 参考图（海湾·宠物友好酒店）中「押金 ¥300」「清洁费 ¥80/晚」为示意；已决用现有「附加费」字段映射，不新增费用字段。
- 开发库当前仅 2 个地点（均有照片与评分）；E2E 种子需覆盖有图/无图、有分/无分组合。

### Affected Capabilities

- **MODIFIED** `trip-attractions`：地点浏览卡片与详情弹窗展示封面图、评分、限制费用行与政策说明行（命名与 delta 拆分待 proposal-split）
- **MODIFIED** `location-management`：共用只读列表/详情契约新增可空封面照片 URL 与评分字段

### Open Questions

| # | class | status | question | owner | note |
|---|---|---|---|---|---|
| OQ-1 | blocking | resolved | 参考图「押金 ¥300」「清洁费 ¥80/晚」：新增数据字段还是复用现有字段？ | Product / Dev | 已决（2026-11-17，用户确认）：复用现有字段。限制费用行展示体重上限（≤X kg）与附加费（extraFeeCents，¥X）；不新增押金/清洁费字段，零迁移零管理端改动 |
| OQ-2 | blocking | resolved | 说明文字行来源：政策自动生成还是新增描述字段？ | Product / Dev | 已决（2026-11-17，用户确认）：由现有 8 项政策字段自动拼接中文文案（如「公共区域需牵引 · 需疫苗证明」），不新增自由文本字段 |
| OQ-3 | blocking | resolved | 范围：仅列表卡片还是详情弹窗同步？ | Product | 已决（2026-11-17，用户确认）：卡片 + 详情弹窗头部同步展示封面图与评分，API 只扩展一次 |
| OQ-4 | blocking | resolved | 图片与评分数据源：复用高德快照还是允许管理员维护？ | Product / Dev | 已决（2026-11-17，用户确认）：复用已入库高德照片（第一张作封面）与 `business_json.rating`；无评分隐藏、无图/失败显示中性占位；不新增维护能力 |
| NB-1 | non-blocking | resolved | 封面图宽高比与占位样式 | Dev | 建议默认：16:9 裁切（object-cover）；占位为中性底色 + 图标 + 类型标签；design D4/D5 定稿（2026-11-17） |
| NB-2 | non-blocking | resolved | 限制费用行字段集与顺序 | Dev | 建议默认：体重 ≤X kg → 肩高 ≤X cm → 附加费 ¥X；有值才展示；design D4/D5 定稿（2026-11-17） |
| NB-3 | non-blocking | resolved | 政策说明行生成规则全集 | Dev | 已决：仅三个布尔项（牵引/疫苗证明/需预约）为 true 时生成短语，以「·」连接；类型/限养数/体重肩高由既有徽章与限制行表达，不重复；design D4/D5 定稿（2026-11-17） |
| NB-4 | non-blocking | resolved | rating 非法值（非数值字符串）处理 | Dev | 建议默认：视同缺失隐藏；design D4/D5 定稿（2026-11-17） |
| NB-5 | non-blocking | resolved | 详情弹窗封面图尺寸/是否多图 | Dev | 建议默认：与卡片同封面单图，不做轮播；design D4/D5 定稿（2026-11-17） |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Open Questions | 4 个 blocking OQ（费用字段/说明来源/范围/数据源） | 2026-11-17 与用户确认，全部采纳推荐 resolved |
| WARNING | resolved | NB-1…NB-5 | 5 个非阻塞展示细节未定稿 | 已给建议默认，design D4/D5 定稿（2026-11-17）；不阻塞进入 proposal |

基础 8 项自检：①意图清晰 ✓ ②actors 与权限边界 ✓ ③范围有界（In/Out）✓ ④场景具体（S1–S8）✓ ⑤异常/边界（S3 降级、S2/NB-4 非法评分、S4 空行隐藏）✓ ⑥结果可验证 ✓ ⑦依赖与触点（unify-location-browsing 契约、高德快照、前后端）✓ ⑧blocking OQ=0 ✓。BLOCKER 数：0。⑨–⑫ 待 deep-dive（影响分析后）执行。