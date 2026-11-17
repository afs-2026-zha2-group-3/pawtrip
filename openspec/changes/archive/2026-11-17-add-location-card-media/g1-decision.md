# G1 决策记录：地点浏览卡片展示图片与评分

- Change ID：`add-location-card-media`（REQ-013）
- Gate：G1 Align
- 决策：Pass（补录）
- 时间：2026-11-17（Asia/Shanghai）
- IO：Kitty
- SA：Leo

## 输入材料

- `proposal.md`
- `specs/location-management/spec.md`（1 需求 5 场景）
- `specs/trip-attractions/spec.md`（3 需求 12 场景）
- `dov-ac-review.md`（AC-1…AC-4 / DoV-1…DoV-5 全 Pass）
- `design.md`（D1–D5，无 Open Questions）
- `atdd-design.md`（API A1–A9 / E2E E1–E10 / Defer UT）
- `tasks.md`
- `alignment-self-check.md`（Pass，计划层）
- `npx --no-install openspec validate "add-location-card-media" --strict`：通过

## 对齐结论

- 复用已入库数据：封面取 `location_photo` 按照片顺序第一张 `source_url`，评分取 `business_json.rating` 快照原样透传（可空字符串，数值校验在前端）；不新增押金、清洁费、自由文本描述字段。
- 用户端共享列表与详情新增 `coverPhotoUrl`、`rating` 两个可空标量；DB-only，不调用高德，不下发原始 POI、完整 business 或照片列表；管理端契约语义不变（纯增量）。
- 卡片结构：封面（16:9）→ 名称 → 地址 + 琥珀星标评分 → 既有徽章/tag → 限制费用行 → 政策说明行 → 操作 footer 不变；详情弹窗头部同步媒体，降级规则一致；6 个地点类型结构一致。
- 降级口径：无照片 / 非 http(s) / 加载失败 → 中性占位（图标 + 类型标签），无重试；评分缺失或非数值 → 隐藏；摘要行无可展示项 → 整行隐藏；仅 true 布尔生成短语，不编造否定文案。
- 限制费用行顺序与单位：体重 ≤X kg → 肩高 ≤X cm → 附加费 ¥X（分转元、去尾零）；说明行短语「公共区域需牵引 / 需疫苗证明 / 需提前预约」。
- 零 Flyway 迁移、零新依赖、零管理端 UI 改动；delta 全 ADDED，与未归档 `unify-location-browsing` 无冲突。
- blocking OQ×4 全部 resolved（2026-11-17 用户确认）；NB×5 由 design D4/D5 定稿。

## 条件与责任人

- 本变更无阻塞条件。
- P4 已于 2026-11-17 完成，PR #65 已合并入 main（`fe472ab`），CI 全绿；P4 验证口径调整（组件 UT 由 E2E 承担）与夹具偏差见 `tasks.md` 执行记录，SA 知悉并接受。
- 上游照片 URL 可用性与评分快照时效为已接受的产品权衡（见 `dov-ac-review.md` 残余风险表）；如未来需要图片代理或评分刷新，另起变更（SA 排期）。

> 本记录依据用户指定角色补录：IO=Kitty、SA=Leo；2026-11-17 签署。G2（Verify）由 VL=Scott 另行签署，G3（合并归档）待后续门禁。