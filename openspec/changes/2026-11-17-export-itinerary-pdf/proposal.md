# Proposal

## Why

行程单（US-48）目前只能在应用内查看。用户途中网络不稳，或需要把行程发给同行人时，无法离线保存与传递。US-49 要求把行程单导出为 PDF 或图片；本变更先交付 PDF 导出。

行程单页面本身保持不变；导出时在页面已有内容基础上补充详细信息：展开每个地点的携宠政策、附上当前大交通方式的携宠规则，并去除浏览器默认页眉页脚。

前置的行程单页面与 `buildItinerary` 已就绪，导出复用同一数据模型。天气（US-16）、应急（US-13）、食宿（US-12）尚无数据源，导出不伪造缺失板块。图片长图导出（AC-2，1080px 按天分段）不在本次范围。

## What Changes

- 行程单页头部新增「导出 PDF」按钮（页面上唯一可见改动）。
- 触发导出时切换为打印态：渲染全部天、展开所有「详细携宠政策」，并展示当前大交通方式的携宠规则（能否携带、体重/肩高限制、容器、办理流程、检疫证明、来源与复核日期）。
- 大交通规则仅在打印输出中展示，行程单页面不新增常驻板块；政策在页面上仍默认折叠。
- 打印样式：A4、抑制浏览器默认页眉页脚（URL、日期、页码），隐藏应用外框，地点卡片避免跨页。
- 打印结束或取消后恢复原来的单天视图。
- 无新增依赖、后端接口或数据迁移。

## Capabilities

### New Capabilities

- 无。本变更在既有 `trip-itinerary` 能力上增加导出需求。

### Modified Capabilities

- `trip-itinerary`: 增加「导出行程单为 PDF」需求；原有入口、按天汇总、时间线与交通、政策展开、当天提醒、未接入板块隐藏需求不变。

## Impact

- 前端：`apps/web/src/routes/_authenticated/itinerary.tsx`、`apps/web/src/components/trip/trip-panel.tsx`、`apps/web/src/routes/__root.tsx`、`apps/web/src/styles.css`。
- 数据：复用 `apps/web/src/data/transport-rules.ts` 的 `getRuleForMode`，不新增规则数据。
- 测试：`e2e/itinerary.spec.ts`。
- 无后端接口、数据库迁移与依赖变更。
