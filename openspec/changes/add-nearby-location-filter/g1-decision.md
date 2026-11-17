# G1 decision — add-nearby-location-filter

- Gate: G1 (Align)
- Change id: `add-nearby-location-filter`
- Input artifacts:
  - Delta Spec: `openspec/changes/add-nearby-location-filter/specs/trip-attractions/spec.md`（4 个 ADDED Requirement / 27 个 Scenario）
  - AC / DoV review: `openspec/changes/add-nearby-location-filter/dov-ac-review.md`
  - ATDD design: `openspec/changes/add-nearby-location-filter/atdd-design.md`
  - Alignment self-check: `openspec/changes/add-nearby-location-filter/alignment-self-check.md`
  - Proposal / Design: `proposal.md`、`design.md`
  - Upstream: `requirement-workspace/requirements/REQ-012-nearby-location-filter.md`、`analysis/REQ-012/deep-dive.md`、`analysis/REQ-012/impact-brief.md`、GitHub issue #20（US-12）
  - OpenSpec validation: `openspec validate add-nearby-location-filter --strict` → valid
- Findings:
  - Scope: 酒店类型默认展示 + “离景点最近”下拉；景点类型保留锚点选择器；餐厅未选锚点门禁；`GET /api/locations` 可选 `nearPoiId`，Haversine 固定 5km 含边界、距离升序、过滤后分页并返回 `distanceMeters`；无 schema 迁移，V20/V21 仅珠海测试数据。地图拆到独立 `add-location-map`，未混入本 Delta。
  - Ambiguity: `impact-brief.md` 记录阻塞开放问题 0、DoR BLOCKER 0；5km 是否可配置、多景点距离聚合为 deferred，归属后续需求或上游 US-12，不阻塞本 Delta。
  - Conflict: 酒店口径已由“未选锚点门禁”改为“默认列表 + 下拉”，Delta/Design/Tasks/E2E 已同步；餐厅保留门禁，两类共用锚点。未改变管理端、高德调用、认证与错误契约。
  - Residual concerns（不构成 G1 条件）: ① 恰好 5000m 的 API 过滤边界缺直接夹具；② 景点页选择/清除锚点不改变景点列表、激活行程切换清空锚点缺自动化；③ 依赖未归档的 `unify-location-browsing` 且其存在既有 validate 错误；④ 距离筛选依赖地点经纬度维护。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；残余关注点：边界与缺失自动化用例（owner: SA/VL）、前置 change 归档协调（owner: SA）、地点坐标数据维护（owner: PO/SA）
- Approvers: IO=SUKI; SA=RANLE
- Timestamp: 2026-11-17T13:05:50+0800

> 本记录依据具名人类签署人的明确决定转写；用户明确指示按 IO=SUKI、SA=RANLE 记录本次 G1 Pass，代理不代为决策。残余关注点仅作实现/验证/归档阶段的协调提示，不改变 G1 结论。
