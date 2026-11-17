# Proposal

## Why

城市浏览页当前把 333 个城市级行政区一次性平铺，页面过长且难以浏览。政策入口也要求用户离开候选列表跳转到独立政策页，无法边看候选边比较政策。

需求方要求：候选列表分页；点击城市卡片后在该城市右侧直接展示宠物管理政策；侧栏提供跳转到具体禁养犬名单的链接。同时候选数据不得使用演示数据，必须可公开查证。

## What Changes

- `/cities` 候选列表改为每页 9 张卡片的分页展示，提供「第 x / y 页」与上一页/下一页；关键词或宠物友好筛选变化时回到第 1 页。
- 候选卡片只保留「选定」按钮，移除卡片内「查看政策」链接；点击卡片非按钮区域（或聚焦后按 Enter/空格）在右侧打开政策侧栏。
- 侧栏展示城市政策标题、更新时间、适用范围、逐宠物匹配结论、政策要点、来源标题与来源说明，以及「{政策名}禁养犬名单」（锚点到 `/destinations/{adcode}/policy#banned-breeds`）与「查看完整政策与来源」两个链接。
- 侧栏提供「关闭城市政策」按钮；关闭后候选列表恢复居中，不保留空白右栏。
- 宽屏下侧栏位于列表右侧并排，列表列宽固定为 976px，打开侧栏后卡片宽度不缩小、列表整体左移；窄屏下侧栏堆叠在列表下方。
- 政策页为禁养犬种名单增加 `#banned-breeds` 锚点与滚动偏移，并保留「仅列出部分示例」说明。
- 数据：只保留一条 V26 迁移，直接写入 8 个城市可公开查证的政策摘录（七台河、三亚、三明、三门峡、上饶、东莞、东营、中卫），三沙保持未收录；不引入演示或虚构数据。旧演示迁移与 V27 替换迁移已合并删除，仅本地开发库执行过旧 V26，需重建开发库。
- 候选接口 `policyCovered`/`bannedBreeds` 仍为占位值，本变更不改后端接口；侧栏使用既有 `GET /api/cities/{adcode}/pet-policy`。

## Capabilities

### New Capabilities

- 无。分页与侧栏分别落在既有 `destination-selection` 与 `city-pet-policy` 能力上。

### Modified Capabilities

- `destination-selection`: 新增「候选列表分页」；改写「候选列表与政策入口」（卡片点击打开侧栏、卡片无政策链接、关闭与布局）；将已过时的「禁养犬种匹配（展示暂缓）」改名为「禁养犬种精确匹配」，将「政策数据占位契约」收窄为「候选政策字段占位」，数据来源要求移交 `city-pet-policy`。
- `city-pet-policy`: 新增「候选列表城市政策侧栏」与「侧栏政策来源与名单入口」；改写「查询目的地的养犬政策」，补充来源说明、公开数据口径与部分名单说明。

## Impact

- 前端：`apps/web/src/routes/_authenticated/cities.tsx`（分页、选中城市、侧栏、来源说明与关闭）、`apps/web/src/routes/_authenticated/destinations/$adcode/policy.tsx`（禁养名单锚点）。
- 数据：仅新增 `apps/server/src/main/resources/db/migration/V26__seed_city_policy_public_data.sql`；不含演示数据，无表结构变更。旧 V26/V27 仅存在于本地工作分支，合并后删除。
- 测试：`e2e/destination-selection.spec.ts`（E1/E2/E5–E9/E13/E15–E21）、`e2e/city-pet-policy.spec.ts`、`e2e/attraction-pet-rules.spec.ts`、`e2e/trip-helpers.ts`（新增 `searchCity`，`openTripDialog` 自动搜索）。
- 无后端接口变更，无新增依赖。
- 政策数据为政府公开文件的人工摘录，存在时效与来源可追溯性风险；三亚规定尚未生效，三沙未收录。
