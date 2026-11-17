# AC / DoV Review — add-nearby-location-filter

- 日期：2026-11-17
- 审查对象：`openspec/changes/add-nearby-location-filter/specs/trip-attractions/spec.md`（4 个 ADDED Requirement / 27 个 Scenario）
- 上游：`proposal.md`、`design.md`、`requirement-workspace/requirements/REQ-012-nearby-location-filter.md`、`analysis/REQ-012/`、GitHub issue #20（US-12）
- 评审状态：Delta Spec 可进入 **G1** 人工评审；本文件不是 G1 决议，不代替 IO/SA 签字

## AC 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 requirement 至少一个可测 AC | Pass | 4 个 requirement 分别含 6 / 4 / 10 / 7 个 `#### Scenario` | 覆盖选择入口、门禁、5km 过滤、接口契约 |
| AC-2 AC 可观察 | Pass | 锚点选中/清除、下拉禁用、门禁空态、距离文案、`400 VALIDATION_ERROR`、`distanceMeters`、`hasNext` 均为可观察结果 | 无“正确/合理”等模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 未排期排除、重复去重、5km 边界、超出排除、无坐标候选排除、锚点无坐标、锚点不存在/非景点、未带锚点回归 | 与 `analysis/REQ-012/deep-dive.md` 边界表一致 |
| AC-4 不把实现细节伪装成 AC | Pass | 使用页面行为、HTTP 参数、状态码与响应字段；未出现类名、函数名或框架选择 | Haversine / 5km 属于外部业务口径，不是内部实现细节 |

## DoV 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 列出酒店默认列表 + 下拉、景点页锚点、餐厅门禁、`nearPoiId`、`distanceMeters`、无 schema 变更；Delta 4 个 requirement 一一对应 | 地图已拆到独立 `add-location-map`，未混入本 Delta |
| DoV-2 歧义已列出或解决 | Pass | `analysis/REQ-012/impact-brief.md` 记录阻塞开放问题 0、DoR BLOCKER 0；5km 可配置与多景点距离口径为 deferred | 多景点口径归属上游 US-12，不阻塞本 Delta |
| DoV-3 IO/SA 残余风险已记录 | Pass | 见下方“残余风险 / G1 关注点” | 含数据维护、前置 change 归档顺序 |
| DoV-4 未声称业务实现已完成 | Pass | 本审查对象为 Delta Spec；实现状态见 `tasks.md` 与本地验证报告 | 审查结论不因 P4 已实现而放宽 |
| DoV-5 requirement 可追溯到 proposal/REQ | Pass | 见下方追溯表 | 每项均可映射到 REQ-012 acceptance hints 或 proposal 条目 |

## 追溯表

| Delta requirement | 来源（REQ-012 / proposal） |
|---|---|
| 行程景点锚点选择 | REQ-012 statement、acceptance hints 第 1–3、5 条；proposal“酒店下拉 + 景点页锚点、共用状态” |
| 餐厅的选择门禁 | REQ-012 acceptance hints 第 3 条；proposal“未选锚点餐厅门禁、酒店默认列表” |
| 5km 附近筛选与距离展示 | REQ-012 acceptance hints 第 6–10 条；proposal“Haversine、≤5km、距离升序、距离文案” |
| 附近筛选的共享地点查询契约 | REQ-012 acceptance hints 第 6、8、9 条；proposal“`GET /api/locations` 增加 `nearPoiId`” |

## 残余风险 / G1 关注点

| 级别 | 关注点 | 说明 |
|---|---|---|
| 风险 | 恰好 5000m 的 API 过滤边界无直接夹具 | 现有 API 用例覆盖 5km 内、5km 外与过滤后分页；`haversineDistanceIsMetersAndHandlesBoundaryOffset` 只验证距离函数在约 5000m 处的结果，未用恰好 `5000m` 的候选验证“含边界” |
| 风险 | “景点页选择/清除锚点不改变景点列表”缺自动化 | 实现上 `nearPoiId` 只在酒店/餐厅传入（`nearbyType` 判断），但当前无 E2E 或单测直接断言该场景 |
| 风险 | 激活行程切换自动清空锚点缺 E2E | 现有 E2E 覆盖“锚点景点被移出行程”；行程 ID 变化清空锚点仅由 `useEffect` 代码审查覆盖 |
| 风险 | 无坐标候选 / 跨城锚点 | API 与 E2E 已覆盖无坐标；跨城锚点按设计允许并显示“该锚点 5km 内暂无…”空态，未单独自动化 |
| 风险 | 依赖未归档的 `unify-location-browsing` | 共享 `GET /api/locations` 来自该 change；其未归档且有既有 validate 错误，本 change 归档前需先处理或协调 |
| 风险 | 数据维护 | 距离筛选依赖 `longitude`/`latitude` 已维护；V20/V21 仅提供珠海测试数据，生产数据需管理端或抓取脚本补齐 |
| 已决 | 地图、UI 样式、小型犬/大型犬/押金/清洁费/搜索 | 不在本 Delta；地图由 `add-location-map` 承接，其余暂缓 |
| 已决 | 锚点不持久化 | 页面内状态，刷新或重新进入不保留（REQ-012“已确认口径”） |

## 结论

- AC-1…AC-4：Pass。
- DoV-1…DoV-5：Pass。
- 无阻塞性缺口；Delta Spec 可提交 **G1** 人工评审。
- G1 决议由 IO/SA 作出；本文件不写入 Pass/Fail，也不代替人工签字。
