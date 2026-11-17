# Alignment self-check — add-nearby-location-filter

- 日期：2026-11-17
- 输入：`specs/trip-attractions/spec.md`（4 个 ADDED Requirement）、`design.md`、`tasks.md`、`atdd-design.md`、`dov-ac-review.md`
- 结论：**Pass**（Spec → Design → Tasks → ATDD 可逐项对齐；无静默扩范围；地图已拆到独立 change）

## 1. Spec → Design → Tasks → ATDD

| Delta Requirement | Design | Tasks | ATDD | 结果 |
|---|---|---|---|---|
| 行程景点锚点选择 | D1 候选派生；D4 酒店下拉/景点页选择器；D5 页面状态与自动清理 | 2.1、2.2、2.4 | E3/E4/E5、UT `anchors.test.ts` | Pass |
| 餐厅的选择门禁 | D4 餐厅门禁；D5 酒店恢复默认列表 | 2.2、2.3、2.4 | E1/E7/E9 | Pass |
| 5km 附近筛选与距离展示 | D2 服务端过滤；D6 米制返回/公里展示 | 1.2、3.1、3.2、3.3 | A1/A2/A5、E2/E3/E8 | Pass |
| 附近筛选的共享地点查询契约 | D2 过滤后分页；D3 接口通用性；D7 无迁移 | 1.1–1.5 | A1–A8 | Pass |

## 2. 范围变化记录

| 日期 | 变化 | 同步情况 |
|---|---|---|
| 2026-11-17 | 酒店从“未选锚点门禁”改为“默认展示列表 + 离景点最近下拉”，与餐厅门禁区分 | `proposal.md`、`design.md` D4、Delta 第 2 个 requirement、E2E 已同步 |
| 2026-11-17 | 原“地图暂缓”调整为独立 change `add-location-map` 承接，并追加地图详情卡片与详情摘要字段 | 本 Delta 未新增地图 requirement；`design.md` Non-Goals 中的“不引入地图 SDK”仍限定本 change |
| 2026-11-17 | V21 将 V20 珠海测试数据坐标修正为真实 POI 坐标 | `README.md`、`registry.md`、`handoff.md` 已登记；`tasks.md` 4.4 仅写 V20，本文件补充记录，建议在 4.4 补注 V21 |

以上变化均为需求方已确认的口径调整或数据修正，不是静默扩范围。

## 3. Non-goals 反向覆盖

| Non-goal | 反向验证 | 位置 |
|---|---|---|
| 自动推荐/评分/多景点聚合 | 无推荐接口与评分字段；查询只接受单锚点 | 代码审查、ATDD 第 6 节 |
| 地图/定位/驾车距离/路径规划 | 本 Delta 无地图 requirement；地图在 `add-location-map` | Delta Spec、ATDD 第 6 节 |
| 新增数据库列/迁移 | 无 schema migration；V20/V21 仅数据 | 代码审查、`design.md` D7 |
| 锚点持久化 | 页面内 `useState`；刷新/重进不保留 | `attractions/index.tsx`、ATDD 第 6 节 |
| 改变管理端/AMap/认证/错误契约 | 管理端与既有 API 测试保持绿；`verifyNoInteractions` | `LocationQueryApiTest` |
| 景点/宠物医院/用品店应用距离筛选 | E7；`nearbyType` 仅 hotel/restaurant 传 `nearPoiId` | E2E + 代码审查 |
| 排除已加入行程的地点 | E6 保留已加入餐厅 | E2E |
| UI 样式、小型犬/大型犬/押金/清洁费/搜索 | 未新增对应字段或控件 | 代码审查 |

## 4. Task 边界检查

- Tasks 1.x–5.x 均可映射到至少一个 Delta Requirement 或 Non-goal 反向验证，无“顺手重构”任务。
- 每组任务包含验证方式：1.x 带 API 测试与后端全量；2.x/3.x 带单测与 E2E；4.x 带夹具脚本、V20/V21 数据与回归；5.x 做集成验证。
- 未改变行程 `TripPlan` 结构、管理端写入、认证授权或外部高德调用。
- 5.3（补 P3 验证与 Gate 记录）仍为未完成项：本文件与 `atdd-design.md`、`dov-ac-review.md` 补齐 P3 部分；G1/G2/G3 需对应角色签署。

## 5. P3 checklist 证据

| 检查项 | 结果 | 证据 |
|---|---|---|
| P3-1 AC / DoV review 存在 | Pass | `dov-ac-review.md` |
| P3-2 ATDD design 存在并区分 API/E2E/UT | Pass | `atdd-design.md` |
| P3-3 对齐自检无静默扩范围 | Pass | 本文第 1–3 节 |
| P3-4 任务可执行且含验证 | Pass | `tasks.md` 各组验证步骤；覆盖缺口见第 6 节 |

## 6. 残余风险

- 前置 `unify-location-browsing` 已于 2026-11-17 随 origin/main 归档，依赖已解除。
- 恰好 `5000m` 的 API 过滤边界、景点页选择锚点不改变景点列表、激活行程切换清空锚点缺少直接自动化，见 `dov-ac-review.md`。
- 距离筛选依赖地点经纬度已维护；V20/V21 只提供珠海测试数据。
- Gate 记录待 IO/SA（G1）、VL（G2）、SA（G3）人工签署，代理不代签。
