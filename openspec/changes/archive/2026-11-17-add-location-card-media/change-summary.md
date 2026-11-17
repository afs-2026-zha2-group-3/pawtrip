# Change summary — add-location-card-media

- Change id: `add-location-card-media`（REQ-013）
- 状态：已合并（PR #65，merge `fe472ab`，2026-11-17）并归档
- 分支：`feat/location-browse-card`

## Intent

用户端地点浏览卡片补齐图片与评分两个最直观的筛选信号：照片（`location_photo`）与评分（`business_json.rating`）已随高德快照入库，仅用户端 API 与卡片未暴露。零迁移、零新依赖、零管理端行为改动。

## What shipped

- 共享列表 `GET /api/locations` 与用户详情 `GET /api/locations/{poiId}` 新增可空标量 `coverPhotoUrl`（按照片顺序第一张 `source_url`）与 `rating`（快照原样透传）；DB-only，不下发原始 POI/business/照片列表。
- 后端按页批量 IN 查询取照片防 N+1（D1）；Jackson 解析 rating，trim 非空才返回、解析失败视同缺失（D2）；DTO 纯增量（D3）。
- 卡片重构：封面（16:9）→ 名称 → 地址 + 琥珀星标评分 → 既有徽章/tag → 限制费用行（≤X kg / ≤X cm / 附加费 ¥X，分转元去尾零）→ 政策说明行（仅 true 布尔生成短语）→ 操作 footer 不变；空数组整行隐藏。
- 详情弹窗头部同步封面与评分，降级同卡片；6 个地点类型结构一致。
- 降级：无照片 / 非 http(s) / 加载失败 → 中性占位（图标 + 类型标签），无重试；评分缺失或非数值 → 隐藏。
- `safeImageUrl` 提取为共享 `lib/location-image.ts`；新增 `lib/location-summary.ts` 纯函数与 `-location-cover.tsx` / `-location-rating.tsx` 组件。
- E2E 种子扩展媒体组合，图片用 `photos.e2e.test` route 夹具不依赖外网；media E1–E9 新增用例。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 后端测试 | Pass | `./mvnw test`：177 tests，BUILD SUCCESS |
| 前端构建/类型 | Pass | `npm run build`、`npx tsc --noEmit` exit 0 |
| 前端单测 | Pass | vitest 17 文件 117 用例（含纯函数 TDD） |
| 全量 E2E | Pass | 108 passed / 0 failed（Chromium）；media E1–E9 全绿、管理端回归绿 |
| CI | Pass | PR #65：Browser E2E / Server tests / Web build 全 SUCCESS（head `791e90f`） |
| OpenSpec validate | Pass | `openspec validate "add-location-card-media" --strict` |
| G1 | Pass（IO=Kitty，SA=Leo，2026-11-17） | `g1-decision.md` |
| G2 | Pass（VL=Scott，2026-11-17） | `g2-decision.md` |
| G3 | Pass（SA=Leo，2026-11-17） | `g3-decision.md` |

本地验证报告：`docs/ai4se-plugins/20261117-132353-local-verify-report.md`。

## Residual risks / follow-ups

1. 上游高德照片 URL 可能过期/防盗链：规格降级为中性占位、不阻塞操作；不做代理与重试（已接受权衡）。
2. 评分为保存时快照，不随高德刷新；如需刷新另起变更。
3. 组件/卡片/弹窗行为验证由 E2E 承担（仓库无 RTL/jsdom 且零新依赖约束），纯函数按 vitest TDD——偏差记录于 tasks P4 执行记录。
4. 既有 TBD Purpose 占位（5 个 capability）与 trip-planning 长需求文本为既有 validate WARNING/FAIL，另开文档清理。
5. 390px 行程面板默认全屏抽屉、主导航间距偏紧为既有 UI 观察项，非本 change 引入。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/location-management/spec.md`、`specs/trip-attractions/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/65