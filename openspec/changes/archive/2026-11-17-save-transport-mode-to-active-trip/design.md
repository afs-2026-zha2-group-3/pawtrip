# 设计

## 背景

见 `proposal.md` 的 Why。当前交通规则页把单选值写到 `sessionStorage`；active trip 的运行时状态位于 `tripStore.active`，由 `activeTripId` hydrate 得到。行程编辑已通过 `saveRevision` 触发约 600ms 防抖 `PUT /api/trips/{id}`，后端当前以 `V17__create_trip.sql` 建立 trip 表。

## 目标与非目标

**目标：**

- 让大交通方式成为 trip 的服务端持久化字段，并在 active trip Store 中恢复与更新。
- 让规则页和 Trip Panel 读取同一 trip 状态，选择后复用现有防抖自动保存。
- 在没有 active trip 时阻止进入规则选择流程，提供创建或激活 trip 的入口。

**非目标：**

- 不新增服务端 active 标记；当前激活关系仍由前端 `activeTripId` 和 `tripStore.active` 管理。
- 不保存飞机行内的航司下拉值；本次字段只保存单选列代表的交通方式。
- 不新增保存按钮、独立选择缓存或新的自动保存机制。

## 技术决策

### trip 字段和 API 契约

新增可空字段 `trip.transport_mode`，取值与前端 `TransportMode` 一致：`flight`、`high_speed_rail`、`train`、`drive`。未选择时为 `NULL`。在现有 `Trip` 实体、创建/更新请求及 trip 详情响应中映射为 `transportMode`；服务端拒绝其他非空值，并按现有规则返回 `400 VALIDATION_ERROR`。创建请求未带选择时返回 `transportMode: null`。现有 trip 列表仍维持摘要职责；active trip 的恢复使用详情接口。

选用现有整量 `PUT` 而不是新增单独端点：浏览器端每次更新都从 active Store 提交当前 `name`、`totalDays`、`plan` 和 `transportMode`，交通方式与计划编辑共用同一保存版本和失败恢复逻辑。客户端与服务端随同一变更升级；创建时 `transportMode` 可空，更新请求也携带字段（无选择时为 `null`）。

### 前端状态和自动保存

规则页以 `active.transportMode` 作为已保存选择的初始值和回显来源；radio 的变更调用 trip Store action，不读取或写入 `pawtrip:selected-transport-mode`。Store action 立即更新 active trip，并递增 `saveRevision`，从而触发现有 `_authenticated` 布局的防抖保存。`save.ts` 和 `updateTrip` 将当前 `transportMode` 纳入完整请求；成功响应仍按现有 revision 守卫更新 active，失败时保留本地值并复用面板保存状态与重试行为。

交通规则页在 hydration 完成且没有 active trip 时渲染与景点浏览页一致的空态，并提供 `/cities` 与 `/trips` 导航；有 active trip 时才渲染现有规则表格与互斥单选。hydration 正在恢复已保存的 active trip 时，不应把短暂的 `active === null` 误作最终无行程状态。

Trip Panel 顶部从 active trip 的 `transportMode` 映射中文标签；有值时显示“大交通” tag，无值时不显示。页面选择、Trip Panel 和自动保存均只通过同一个 active Store 字段同步。

### 数据库迁移

在现有 V17 后新增 `V18__add_trip_transport_mode.sql`，以向后兼容的 nullable 列扩展 trip 表，并限制非空值为四种已知方式。旧记录自然保持 `NULL`，不需要回填或猜测用户选择。Flyway 是 schema 真源，JPA 不自动建表。

## 风险与权衡

- **若交通方式没有递增 `saveRevision`，选择只会停留在页面运行态。** Store action 必须走现有 revision 驱动路径；测试覆盖选择后防抖请求及重载恢复。
- **完整 PUT 的并发编辑可能覆盖较早的整量快照。** 本设计沿用现有后写覆盖与版本守卫，不引入乐观锁；每次提交从当前 active Store 读取完整值，近期选择和计划编辑共用防抖窗口。
- **客户端不能证明某个 trip 在服务端被标记为 active。** 本需求的保存目标由 UI 的 `tripStore.active.id` 决定；API 仍按现有登录用户归属校验，不新增服务端 active 语义。

## 迁移计划

1. 部署可空字段的 V18 migration，再部署同时支持 `transportMode` 的后端与前端；现有数据无需回填。
2. 回滚应用版本时可保留 V18 列，旧版本忽略该 nullable 列；不通过手工删除列回滚数据库。若需移除字段，另行提供前向修复 migration。
