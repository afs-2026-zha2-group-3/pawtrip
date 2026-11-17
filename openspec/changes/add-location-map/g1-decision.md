# G1 decision — add-location-map

- Gate: G1 (Align)
- Change id: `add-location-map`
- Input artifacts:
  - Delta Spec: `openspec/changes/add-location-map/specs/trip-attractions/spec.md`（2 个 ADDED Requirement / 12 个 Scenario）
  - AC / DoV review: `openspec/changes/add-location-map/dov-ac-review.md`
  - ATDD design: `openspec/changes/add-location-map/atdd-design.md`
  - Alignment self-check: `openspec/changes/add-location-map/alignment-self-check.md`
  - Proposal / Design: `proposal.md`、`design.md`
  - Upstream: `requirement-workspace/requirements/REQ-012-nearby-location-filter.md`、`analysis/REQ-012/`、GitHub issue #20（US-12）
  - OpenSpec validation: `openspec validate add-location-map --strict` → valid
- Findings:
  - Scope: 地点页右侧地图（桌面左右布局、移动端列表下方），复用 `GET /api/locations` 按 `pageSize=100` 取完全部分页；marker 与列表卡片联动、“在地图查看”、InfoWindow、地图详情卡片；公开详情在既有 coverPhotoUrl/rating 上增加 keytag/businessArea；未配置 Key 或 SDK 失败时占位降级；V22 仅关联测试地点 JSON，无 schema 变更。
  - Ambiguity: 生产安全密钥代理、轻量点位接口、押金/清洁费与宠物设施字段均为 design Open Questions，不阻塞本期地图主链。
  - Conflict: 地图从 `add-nearby-location-filter` 的 Non-goals 拆出为独立 change，避免范围膨胀；详情摘要字段为 `GET /api/locations/{poiId}` 的最小增量，不新增独立接口。
  - Residual concerns（不构成 G1 条件）: ① 真实地图链路（marker 联动、卡片定位、筛选刷新、SDK 失败）无自动化，E2E 强制空 Key；② `tasks.md` 6.5 尚未闭环（重启后端后确认照片/评分）；③ 安全密钥直连前端 bundle，生产需代理；④ V22 依赖同名真实 POI。
- Decision: **Pass**
- Conditions + owners: 无（Pass）；残余关注点：真实地图人工验收与 6.5 闭环（owner: SA/VL）、生产密钥代理方案（owner: SA）、V22 数据复核（owner: VL）
- Approvers: IO=SUKI; SA=RANLE
- Timestamp: 2026-11-17T13:05:50+0800

> 本记录依据具名人类签署人的明确决定转写；用户明确指示按 IO=SUKI、SA=RANLE 记录本次 G1 Pass，代理不代为决策。残余关注点仅作实现/验证/归档阶段的协调提示，不改变 G1 结论。
