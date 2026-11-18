# Spec Delta

## REMOVED Requirements

### Requirement: 行程面板与内容布局

**Reason**: 全局左下角浮动行程面板与 `/trips` 卡片、`/itinerary` 行程单重复，展开时遮挡页面主内容；2026-11-18 评审决定废弃浮动面板。

**Migration**: 行程内容、按天分组与拖拽编辑统一在地点浏览页（`/attractions`）左栏内嵌的「每日景点行程」面板中完成，见 `trip-context`「地点浏览页每日行程面板」；查看完整行程单通过 `/itinerary`。应用外壳不再渲染任何全局行程面板，页面主内容宽度不再随面板开合变化。
