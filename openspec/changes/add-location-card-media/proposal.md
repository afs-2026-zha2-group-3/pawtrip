# Proposal

## Why

用户端地点浏览卡片目前只有名称、地址与政策标签，缺少图片与评分这两个最直观的筛选信号；而照片（`location_photo`）与评分（`business_json.rating`）已随高德 POI 快照入库，仅用户端 API 与卡片未暴露。补齐展示可显著提升浏览与决策效率，且零迁移、零管理端改动（REQ-013，2026-11-17 用户诉求与参考卡片截图）。

## What Changes

- 用户端共享地点列表 `GET /api/locations` 的每个列表项与地点详情 `GET /api/locations/{poiId}` 新增两个可空标量字段：封面照片 URL（该地点第一张已保存照片的 `source_url`）与评分（`business_json.rating` 快照值）；仍只读数据库，不调用高德，不下发原始 POI、完整 `business` 或照片列表（管理端边界不变）。
- 地点卡片按参考图重构为：封面图（16:9 裁切，浏览器直载）→ 名称 → 地址 + 琥珀色星标评分 → 既有政策标签 → 限制与费用行（体重 ≤X kg、肩高 ≤X cm、附加费 ¥X，有值才展示）→ 政策说明行（由 8 项政策字段自动拼接中文短语，如「公共区域需牵引 · 需疫苗证明」）。
- 详情弹窗头部同步展示封面图与评分；既有政策字段、逐宠物 tag 与「添加到行程 / 暂不排期」操作保持不变。
- 降级规则：无照片 / URL 非 http(s) / 加载失败 → 中性占位（图标 + 类型标签）；评分缺失或非数值 → 隐藏评分元素；限制费用行与说明行无可展示项 → 整行隐藏。
- 不新增押金、清洁费、自由文本描述等数据字段（已决：复用现有字段）；不改管理端；6 个地点类型 Tab 卡片结构一致。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-attractions`：新增「地点卡片媒体与政策摘要」要求——卡片封面图、评分、限制费用行、政策说明行的展示与降级规则，及详情弹窗头部媒体同步；以 ADDED 要求落地，不改动 `unify-location-browsing`（已完成未归档）正在修改的既有要求，避免 delta 冲突。
- `location-management`：新增「用户端地点封面与评分字段」要求——共享列表与用户详情的两个可空标量契约、第一张照片选取规则、评分快照语义与 DB-only 约束；同样以 ADDED 要求落地，与既有「pawtrip地点列表」「前端通过来源 URL 直接显示图片」要求兼容（封面 URL 为单标量，不属于被禁止下发的照片详情/原始 business）。

## Impact

- **后端 API**：`LocationQueryResponses.LocationSummary` 与用户端 `LocationBrowseDetail` 增加可空 `coverPhotoUrl`、`rating`；`LocationQueryService` 读取 `location_photo` 第一张与 `business_json.rating`。管理端接口与响应不变。
- **前端**：`apps/web/src/routes/_authenticated/attractions/-location-card.tsx` 重构、`-location-detail-dialog.tsx` 头部扩展、`queries/locations.ts` 类型扩展；图片沿用管理端 `safeImageUrl` + `no-referrer` + `onError` 降级模式；限制费用/说明行为前端纯函数。
- **数据库与依赖**：零 Flyway 迁移、零新依赖。
- **测试与文档**：后端列表/详情契约测试、前端卡片单测（有图/无图、有分/无分、行隐藏）、E2E 种子覆盖媒体组合；Living Spec 更新：`trip-attractions` +3 要求、`location-management` +1 要求。
- **依赖与顺序**：基于 `unify-location-browsing`（PR #60 已在 main）的统一卡片与共享列表契约；其 change 包未归档，本 change 的 delta 全部为 ADDED，归档顺序无冲突。