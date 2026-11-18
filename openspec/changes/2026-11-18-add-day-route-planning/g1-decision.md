# G1 decision — add-day-route-planning

- Gate: G1（Align）
- Change id: `add-day-route-planning`（REQ-015 行程单当天路线规划）
- Status: 已签署（2026-11-18）
- Inputs:
  - `proposal.md`、`specs/trip-itinerary/spec.md`（ADDED，5 需求 14 场景）、`specs/location-management/spec.md`（ADDED，1 需求 3 场景）
  - `design.md`（D1–D6：入口位置、详情坐标、段构造与方式映射、绘制与标注、状态空态、测试策略）
  - `atdd-design.md`（17 场景 API / E2E / Defer-UT 分层，假 `window.AMap` 契约，Non-goals 反向验证 6 行，NFR 不纳入）
  - `tasks.md`（8 组 27 项，1.1–1.3 红测先行并写明失败预期）
  - 对齐自检：`alignment-self-check.md`（6/6 需求四方追溯 + 21/21 横切检查 Pass）
  - P3 质量清单：`docs/ai4se-plugins/20261118-100049-quality-checklist-report.md`（P3-1–P3-4 全 Pass，Stage Overall Pass）
  - 上游需求：`requirement-workspace/requirements/REQ-015-day-route-planning.md`（S1–S8、AC-1–AC-7，7 blocking + 3 non-blocking OQ 全部 resolved，DoR BLOCKER=0）；`requirement-workspace/intents/REQ-015-day-route-planning.md`；`analysis/REQ-015/{impact-brief,deep-dive}.md`
  - 校验：`openspec validate 2026-11-18-add-day-route-planning --strict` 通过（2026-11-18）
- Findings:
  - 范围：delta 与 proposal What Changes 一致，单 Change 交付连贯能力（Day 标签行入口 + 路线弹窗 + 高德算路绘制 + 距离时长标注 + 降级空态 + 详情坐标字段）；用户 2026-11-18 明确排除天气，全工件无天气残留；Out 项（天气、地点重排、后端路线 API、transit/cycling 算路、写回行程计划、进入 PDF/图片导出、管理端改动）未混入规格。
  - 歧义：无未决 blocking 项。距离格式（「N 米」/「N.N 公里」）、时长口径（快照优先，无快照时算路秒数向上取整）、方式映射（`walk`→Walking，`drive`/`self_drive`→Driving）、同 POI 跳过、缺坐标不伪造直线均已在 delta 场景与 design D2–D4 定稿。
  - 冲突：坐标复用 `pawtrip_location` 既有字段，经 `GET /api/locations/{poiId}` 新增可空字段只读下发，无迁移、无上游调用，与 REQ-011 估算 API 契约互不影响（`toNextEstimate` 仅读取）；E2E 夹具与 REQ-011 E11 兼容——禁止修改 `e2e-zhu-b`/`e2e-zhu-c` 的空坐标，新增 `e2e-route-b`/`e2e-route-c` 专用夹具（atdd-design §4）。
  - 残余风险（非阻塞，IO/SA 知悉）：
    1. 高德 JS Key 需具备路线规划服务权限（IO 知悉，线上配置；缺 Key 或无权限走「地图未配置」降级，design Risks）
    2. 算路超时/单段失败（SA 知悉，按段降级并提示，其余段继续，design D4）
    3. 快照时长与高德算路时长不一致（SA 知悉，产品口径为快照优先，距离仍取算路，design Risks）
    4. E2E 依赖注入假 `window.AMap`，不覆盖真实 SDK 行为（SA 知悉，真实 Key 冒烟留本地验证，atdd-design §3/§4）
    5. 详情接口新增字段需前后端同步发布（SA 知悉，可空字段向后兼容，旧前端忽略，design Migration Plan）
    6. 弹窗反复打开会重新算路，暂不缓存（SA 知悉，地图实例关闭即销毁，design Risks）
- Decision: **Pass**
- Conditions + owners: 无（Pass）。上述 6 项为非阻塞知悉项，已有归属或运行期降级，不构成 Gate 条件
- Approvers: IO=SUKI；SA=RANLE（沿用 REQ-014/REQ-012 G1 签署先例，2026-11-18 用户指示落签）
- Timestamp: 2026-11-18

> 本记录为人工 G1 决定的落盘，不构成 G2/G3 授权。下一步：P4 `/sdd:atdd-apply`（按 `tasks.md` 1.1–1.3 红测先行）。
