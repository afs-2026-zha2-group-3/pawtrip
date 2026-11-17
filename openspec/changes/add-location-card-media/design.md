# Design

## Context

动机见 proposal.md - Why。实现基线（main `87a1a45`）：

- 用户端列表/详情由 `LocationQueryService` 只读 `pawtrip_location`，DTO 为 `LocationQueryResponses.LocationSummary` / `LocationDetail`（均无媒体字段）；管理端已保存列表复用同一查询。
- 照片在 `location_photo`（`location_id`、`photo_order`、`source_url`），`LocationPhotoRepository` 现仅有按单地点查询方法；评分在 `pawtrip_location.business_json`（TEXT，Jackson 解析，`rating` 为字符串如 "4.8"）。
- 前端卡片 `-location-card.tsx` 与详情弹窗 `-location-detail-dialog.tsx` 共用 `queries/locations.ts` 类型；管理端 `-location-editor.tsx` 已有 `safeImageUrl`（仅 http/https）+ `no-referrer` + `onError` 降级的图片预览模式。
- 约束：零迁移、零新依赖、零管理端行为改动；delta 全 ADDED，与未归档 `unify-location-browsing` 无冲突。

## Goals / Non-Goals

**Goals**

- 列表页一次分页查询 + 一次批量照片查询取回封面，避免 N+1。
- 卡片与弹窗共用同一封面/评分组件与降级逻辑；摘要行为可单测的前端纯函数。
- 管理端 `safeImageUrl` 提取为共享工具，两处复用（DRY）。

**Non-Goals**

- 不做评分排序/筛选、多图轮播、图片代理或缓存；不改管理端 UI 与契约语义。
- 不引入状态管理新范式；沿用 TanStack Query 既有 query key。

## Decisions

### D1 封面批量取数：按页 IN 查询 + Java 取首张

`LocationPhotoRepository` 新增 `findAllByLocationIdInOrderByLocationIdAscPhotoOrderAsc(Collection<Long> ids)`；服务层对当前页地点 ID 一次查询，按 `locationId` 分组取第一条 `sourceUrl`。

- 备选 A：每地点 `findFirst…`（N+1，页大小 ≤100 时最多 100 次查询）— 弃。
- 备选 B：SQLite 窗口函数原生 SQL 取每组首行 — 查询复杂、与 JPA 派生查询风格不一致；每地点照片数少（高德通常 ≤10），按页全量取回开销有界 — 弃。
- 详情路径复用既有 `findAllByLocationIdOrderByPhotoOrderAsc` 取首张。

### D2 评分透传为可空字符串，数值校验在前端

服务层用 Jackson 解析 `business_json`，取 `rating` 文本值（trim 后非空才返回，否则 `null`）；解析失败视同缺失返回 `null`，不抛错。后端不做数值化：快照语义原样透传，展示合法性（`Number.isFinite`）由前端判定（NB-4）。

- 备选：后端转 `Double` — 会把 "4.6" 变 4.6 丢失快照原样性，且非法值需要后端定义错误语义；弃。

### D3 DTO 扩展为纯增量

`LocationSummary` 与 `LocationDetail` 各加 `String coverPhotoUrl, String rating` 两个可空组件；`from` 工厂改签名接收媒体值。管理端已保存列表复用共享查询，响应随之多出两个字段——纯增量、管理端 UI 不读取，不影响其契约场景（「不返回原始 POI/business/照片详情」仍成立：封面 URL 与评分是标量摘要，非照片列表或完整 business）。

### D4 前端组件拆分与共享

- `lib/location-image.ts`：自管理端编辑器提取 `safeImageUrl`（原样迁移，管理端改 import）。
- `attractions/-location-cover.tsx`：封面组件（`aspect-video` 16:9、`object-cover`、`referrerPolicy="no-referrer"`、`onError` 降级）；占位为 muted 底 + lucide `ImageOff`/`MapPin` 图标 + 类型标签文本；无重试操作。卡片与弹窗共用，弹窗同尺寸单图（NB-5）。
- `attractions/-location-rating.tsx`：琥珀星标（lucide `Star`，`fill` 琥珀色）+ 原样一位小数值；`rating` null/空白/非数值时返回 null（NB-4）。
- `lib/location-summary.ts` 纯函数：
  - `restrictionFeeParts(policies)`：顺序 体重 `≤X kg` → 肩高 `≤X cm` → `附加费 ¥X`（NB-2）；数值去尾零（15.0→15）；分转元去尾零（8000→¥80、8050→¥80.5）；null 项跳过。
  - `policyNoteParts(policies)`：仅三个布尔项为 true 时生成短语（NB-3）：`leashRequired`→「公共区域需牵引」、`vaccinationProofRequired`→「需疫苗证明」、`reservationRequired`→「需提前预约」；false/null 不生成（不编造「无需牵引」类否定文案）；限养数已由 `PetFriendlyBadge` 表达、类型/体重/肩高已由限制行与匹配 tag 表达，不重复。
  - 两函数返回数组，组件以「·」连接渲染；空数组整行隐藏。
- `LocationCard` 结构重排：封面 → `CardHeader`（名称 + 地址/评分行）→ `CardContent`（类型徽章、宠物友好徽章、逐宠物 tag、限制费用行、说明行、已加入徽章）→ `CardFooter` 操作不变。弹窗头部在 `DialogHeader` 下插入封面 + 评分，其余不变。
- `queries/locations.ts`：`LocationSummary` / `LocationBrowseDetail` 增加 `coverPhotoUrl: string | null; rating: string | null`；query key 不变（响应增量无需失效策略变更）。

### D5 视觉口径（NB-1 定稿）

沿用应用既有 shadcn 主题（清新森绿方向），不新增主题色：封面 16:9 圆角随 Card 顶部；评分星标用 `text-amber-500` 填充（与参考图琥珀星一致，应用已有琥珀点缀）；占位用 `bg-muted` + `text-muted-foreground`；摘要行 `text-sm text-muted-foreground`，费用数值可用 `text-foreground` 强调。卡片网格（sm 两列）与分页不变。

## Risks / Trade-offs

- [高德照片 URL 过期/防盗链导致大量占位] → 规格已定降级为中性占位且不阻塞操作；`no-referrer` 沿用管理端已验证模式；不做重试与代理（Non-Goal）。
- [评分快照字符串形态不一（空串/非数值）] → 后端 trim 空→null，前端数值校验隐藏；两层兜底均有场景覆盖。
- [按页取回全部照片的行数放大] → 每地点照片数有界（高德 ≤10 量级），页 ≤100 → 最坏千行级、仅 URL/序号列参与映射，可接受；若未来照片量级变化再改窗口函数查询。
- [管理端列表响应多出字段] → 纯增量，管理端测试断言不锁定完整字段集则不受影响；tasks 中安排管理端回归。
- [E2E 种子地点无照片/评分] → 需扩展种子覆盖有图/无图、有分/无分组合，否则媒体场景不可验证；列入 tasks。
- [unify-location-browsing 未归档] → 本 change delta 全 ADDED，归档顺序无冲突；实现基于 main 代码而非其未合并文本。

## Migration Plan

无数据库迁移。部署为纯增量 API 字段 + 前端重构，直接随常规发布；回滚即 revert 提交，无数据兼容问题（新字段可空、旧前端忽略未知字段）。

## Open Questions

无（NB-1…NB-5 已在 D4/D5 定稿）。