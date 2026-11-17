# Alignment self-check — add-location-map

- 日期：2026-11-17
- 输入：`specs/trip-attractions/spec.md`（2 个 ADDED Requirement）、`design.md`、`tasks.md`、`atdd-design.md`、`dov-ac-review.md`
- 结论：**Pass**（Spec → Design → Tasks → ATDD 可逐项对齐；真实地图验证边界已显式记录，未把人工验证写成自动化证据）

## 1. Spec → Design → Tasks → ATDD

| Delta Requirement | Design | Tasks | ATDD | 结果 |
|---|---|---|---|---|
| 地点地图展示与列表联动 | D1 JS API 加载；D2 全部点位；D3 左右布局；D4 marker/卡片联动；D5 降级 | 1.1、1.2、2.1、2.2、3.1–3.3、4.1、4.2、5.1 | A–E1、E2–E5、E8 | Pass |
| 地图详情卡片与摘要字段 | D6 复用 JSON 摘要；详情接口扩展 | 6.1–6.4 | A1–A4、E6、E7、E9 | Pass |

## 2. 范围变化记录

| 日期 | 变化 | 同步情况 |
|---|---|---|
| 2026-11-17 | 在原“地图展示与联动”之外追加“地图详情卡片与摘要字段”：InfoWindow 查看详情、照片/评分/商圈、共享详情接口摘要字段 | `proposal.md`、`design.md` D6、Delta 第 2 个 requirement、`tasks.md` 第 6 组、`LocationQueryApiTest` 已同步 |
| 2026-11-17 | 新增 V22，将 V20/V21 珠海测试地点关联同名真实 POI 的 `poi_json`/`business_json` | `proposal.md`、`design.md`、`tasks.md` 6.3 已同步；无 schema 变更 |
| 2026-11-17 | 真图验证采用 DOM/网络请求证据；内嵌浏览器无可见表面，截图受限 | `tasks.md` 5.1 已记录 |

以上为已确认的功能追加与验证方式说明，不是静默扩范围。

## 3. Non-goals 反向覆盖

| Non-goal | 反向验证 | 位置 |
|---|---|---|
| 押金/清洁费/宠物设施字段 | 卡片无对应字段；Delta 明示非必需 | `-map-location-card.tsx`、ATDD 第 6 节 |
| 原始 `photos`/`business`/`poi` JSON | API absence 断言 | `detailReturnsMapCardSummaryFields` |
| 新增后端接口/数据库迁移 | 仅扩展现有详情摘要；无 migration | 代码审查 |
| 地图样式精修/聚合/路线/定位/导航 | 未接入对应能力 | 代码审查 |
| 生产级安全密钥代理 | 设计 Open Question；本期 Vite 环境变量直连 | `design.md` |
| CI 依赖高德外网 | E2E 强制空 Key | `scripts/run-e2e.mjs` |

## 4. Task 边界检查

- Tasks 1.x–6.x 均可映射到 Delta Requirement 或 Non-goal 反向验证。
- 3.x 只调整页面布局与卡片联动，不改变列表分页与详情弹窗数据流。
- 6.1 是接口扩展的最小增量；未新增独立详情接口或 schema 列。
- 未完成项：6.5（重启本地后端后确认卡片照片/评分）。该项属于实现收尾确认，不改变 Spec/Design 对齐结论，但 G2 前应闭环。
- 5.1 的真图验证以 DOM/网络请求为证据，未声称完成截图级目视验收。

## 5. P3 checklist 证据

| 检查项 | 结果 | 证据 |
|---|---|---|
| P3-1 AC / DoV review 存在 | Pass | `dov-ac-review.md` |
| P3-2 ATDD design 存在并区分 API/E2E/人工 | Pass | `atdd-design.md` |
| P3-3 对齐自检无静默扩范围 | Pass | 本文第 1–3 节 |
| P3-4 任务可执行且含验证 | Pass | `tasks.md` 各组验证步骤；6.5 待闭环 |

## 6. 残余风险

- 真实地图链路无自动化：marker/InfoWindow/卡片定位/筛选刷新依赖有 Key 环境人工验证与代码审查。
- 6.5 未完成：照片/评分在重启后端的最终展示尚未确认。
- 安全密钥直连前端 bundle，生产需改为代理方案。
- 地图点位全量拉取的请求数随数据增长；后续可能需要轻量点位接口。
- V22 依赖开发库存在同名真实 POI；不存在时卡片缺少照片/评分。
- Gate 记录待 IO/SA（G1）、VL（G2）、SA（G3）人工签署，代理不代签。
