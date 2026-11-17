# Proposal

## Why

行程单（US-48）目前只能在应用内查看。用户途中网络不稳，或需要把行程发给同行人时，无法离线保存与传递。US-49 要求把行程单导出为 PDF 或图片；本变更先交付 PDF 导出。

行程单页面本身保持不变；导出时在页面已有内容基础上补充详细信息：展开每个地点的携宠政策、附上当前大交通方式的携宠规则，并去除应用外框。图片导出复用同一导出视图，生成一张包含全部行程内容的 PNG 长图。

前置的行程单页面与 `buildItinerary` 已就绪，导出复用同一数据模型。天气（US-16）、应急（US-13）、食宿（US-12）尚无数据源，导出不伪造缺失板块。

## What Changes

- 行程单页头部新增「导出 PDF」与「导出图片」按钮（页面上唯一可见改动）。
- 触发导出时切换为打印/导出态：渲染全部天、展开所有「详细携宠政策」，并展示当前大交通方式的携宠规则（能否携带、体重/肩高限制、容器、办理流程、检疫证明、来源与复核日期）。
- 图片导出复用同一导出视图，用 `html-to-image` 生成一张 1080px 宽的 PNG 长图；不按天拆分文件。
- 大交通规则仅在导出输出中展示，行程单页面不新增常驻板块；政策在页面上仍默认折叠。未选择大交通方式时不展示规则卡，其余内容照常导出。
- 打印样式：A4、抑制浏览器默认页眉页脚（URL、日期、页码），隐藏应用外框，地点卡片避免跨页。
- 打印结束或取消后恢复当前 Day 与政策默认折叠；图片导出结束或失败后恢复页面常规状态。
- 新增依赖 `html-to-image@1.11.13`；无后端接口或数据迁移。

## Capabilities

### New Capabilities

- 无。本变更在既有 `trip-itinerary` 能力上增加导出需求。

### Modified Capabilities

- `trip-itinerary`: 增加「导出行程单为 PDF」需求；原有入口、按天汇总、时间线与交通、政策展开、当天提醒、未接入板块隐藏需求不变。

## Impact

- 前端：`apps/web/src/routes/_authenticated/itinerary.tsx`、`apps/web/src/components/trip/trip-panel.tsx`、`apps/web/src/components/trip/trip-section-nav.tsx`、`apps/web/src/routes/__root.tsx`、`apps/web/src/styles.css`。分段导航的 `print:hidden` 随 US-48 已进入 `main`，本变更在打印 E2E 中验证其被隐藏。
- 数据：复用 `apps/web/src/data/transport-rules.ts` 的 `getRuleForMode`，不新增规则数据。
- 依赖：新增 `html-to-image@1.11.13`（浏览器端 DOM 转 PNG）。
- 测试：`e2e/itinerary.spec.ts` 与 `apps/web/src/lib/trip/export-image.test.ts`，并修正 `apps/web/src/lib/trip/anchors.test.ts` 既有夹具缺字段导致的 `tsc` 失败。
- 无后端接口、数据库迁移与依赖变更。
