# Alignment self-check — 2026-11-18-add-day-route-planning

- 日期：2026-11-18（P3 task-plan 最终步骤）
- 四方工件：Delta Spec（`specs/trip-itinerary`、`specs/location-management`）↔ `design.md`（D1–D6）↔ `tasks.md`（8 组 27 项）↔ `atdd-design.md`（API + E2E）
- 方法：逐需求追溯 + 横切一致性检查；证据为工件内精确锚点（需求名 / 决策号 / 任务号 / ATDD 表行）

## 1. 需求级四方追溯

| Delta 需求 | Design | Tasks | ATDD 层行 | 结论 |
|---|---|---|---|---|
| trip-itinerary「当天路线规划入口与弹窗」（3 场景） | D1（Day 标签行右侧按钮、Dialog、`print:hidden`） | 5.1（弹窗）、5.2（入口/状态）、6.3（E2E）、6.5（只读/导出） | §1 行 1–3（E2E + 导出回归）；§2.3 入口与弹窗行 | Pass |
| trip-itinerary「当天路线绘制」（3 场景） | D3（段构造/方式映射）、D4（插件、折线、标记、清理） | 3.1/3.2（段构造）、4.1（loader）、4.2（地图）、6.1–6.3（夹具/假 AMap/用例） | §1 行 4–6（E2E + Defer UT）；§2.3 绘制与标注/同地点行 | Pass |
| trip-itinerary「路线距离与时长标注」（3 场景） | D4（距离取算路、时长快照优先、向上取整、Text 标注） | 3.3（格式化/时长）、4.2（绘制标注）、6.3（标签断言） | §1 行 7–9（E2E + Defer UT）；§2.2 距离/时长红测 | Pass |
| trip-itinerary「路线规划不可用时的降级」（3 场景） | D4（单段失败/无 Key 提示）、D5（全部缺坐标） | 4.3（状态）、6.4（E2E） | §1 行 10–12（E2E）；§2.3 降级/缺 Key 行 | Pass |
| trip-itinerary「路线弹窗空态」（2 场景） | D5（0 地点 / 1 地点文案与不请求） | 4.3（状态）、6.4（E2E） | §1 行 13–14（E2E）；§2.3 空态行 | Pass |
| location-management「用户端地点详情坐标字段」（3 场景） | D2（`LocationDetail` 从实体读两字段，只读、无迁移） | 1.1（API 红测）、2.1（后端字段）、2.2（测试转绿/无上游） | §1 行 15–17（API）；§2.1 坐标/null 红测 | Pass |

## 2. 横切一致性检查

| # | 检查项 | 证据 | 结论 |
|---|---|---|---|
| 1 | 坐标唯一来源与只读边界 | spec「MUST 直接读取已保存地点记录」= D2 = tasks 2.1 = ATDD §2.1 + §4 API 夹具 | Pass |
| 2 | 方式映射 `walk` / `drive` / `self_drive` | spec 绘制需求 = D3 = tasks 3.2 = ATDD §1 行 4–5 + §2.2 | Pass |
| 3 | 同 `poiId` 不发起算路 | spec 场景 = D3 = tasks 3.2 = ATDD §2.2 红测 + §2.3 同地点行 | Pass |
| 4 | 距离格式 `N 米` / `N.N 公里` | spec 场景 = D4 = tasks 3.3 = ATDD §2.2 距离红测 + §2.3 标签断言 | Pass |
| 5 | 时长快照优先与向上取整 | spec 场景 = D4 = tasks 3.3 = ATDD §2.2 时长红测 + §2.3 标签断言 | Pass |
| 6 | 缺坐标不伪造路线 | spec 降级场景 = D4/D5 = tasks 4.3/6.4 = ATDD §1 行 10 + §5 反向 | Pass |
| 7 | 未配置高德 Key 占位 | spec 降级场景 = D4 = tasks 4.3/6.4 = ATDD §3 确定性策略 + §2.3 缺 Key 行 | Pass |
| 8 | 单段失败继续绘制其他段 | spec 降级场景 = D4 = tasks 4.2/4.3/6.4 = ATDD §2.3 降级行 | Pass |
| 9 | 0/1 地点空态且不发请求 | spec 空态需求 = D5 = tasks 4.3/6.4 = ATDD §1 行 13–14 + §2.3 空态行 | Pass |
| 10 | 不修改行程计划、不写库 | spec 入口/标注需求「MUST NOT 写回」= D1/D5 = tasks 5.2/6.5 = ATDD §2.3 与 §5 反向（`PUT /api/trips` 计数 0） | Pass |
| 11 | PDF/图片导出隔离 | spec 导出场景 = D1（`print:hidden`）= tasks 5.3/6.5 = ATDD §1 行 3 + §5 反向 | Pass |
| 12 | 不做天气 | design Non-Goals + 用户 2026-11-18 决定 = tasks 6.5 = ATDD §5 反向（无 Weather 插件/UI/请求） | Pass |
| 13 | 不做路线优化/重排 | design Non-Goals = tasks 6.5 = ATDD §5 反向（标记顺序 + 无 PUT） | Pass |
| 14 | 不新增后端算路接口 | design Non-Goals = tasks 2.1/2.2 = ATDD §5 反向（`PlaceSearchPort` 无交互） | Pass |
| 15 | 不做公交/骑行 | design Non-Goals = tasks 3.2/6.3 = ATDD §5 反向（仅 Driving/Walking） | Pass |
| 16 | 夹具安全：保留 `e2e-zhu-b/c` null 坐标 | ATDD §4 明确禁止修改；REQ-011 E11 依赖 null 坐标 | tasks 6.1 = ATDD §4 | Pass |
| 17 | 不新增 CI 语义 | ATDD §3 沿用 `server.yml`/`web.yml`/`e2e.yml` | tasks 7.1–7.4 = ATDD §3 | Pass |
| 18 | 双设计链接 | tasks 头部同时链接 `design.md` 与 `atdd-design.md` | tasks 头部 | Pass |
| 19 | NFR 口径 | ATDD §6 明确不纳入（沿用既有约定） | 无额外 tasks | Pass |
| 20 | 场景计数 | trip-itinerary 3+3+3+3+2=14；location-management 3；共 17 | ATDD §1 行 1–17 | Pass |
| 21 | 认证边界不变 | spec 详情沿用已登录；既有无认证 401 测试保留 | tasks 2.2 = ATDD §1 行 15 Security（advisory） | Pass |

## 3. P3 修订记录

| 修订 | 内容 | 原因 |
|---|---|---|
| tasks 结构 | 由「契约→实现→测试」重排为「红测先行→实现→验证」，并链接 ATDD design | P3 ATDD 验收驱动要求 |
| tasks 1.3/6.2 | 新增假 AMap 注入与 `window.__routeResults` 队列 | E2E 运行器强制空 Key，绘制验收需确定性第三方替身 |
| tasks 6.1 | 新增 `e2e-route-b/c` 夹具，明确不得改 `e2e-zhu-b/c` 坐标 | 保留 REQ-011 E11 的 null 坐标失败路径 |
| atdd-design §5 | 为每条 Non-goal 补反向用例 | layer-inference 要求 |
| atdd-design §6 | NFR 记录为不纳入 | 沿用仓库既有 change 约定 |

## 4. 结论

**Overall: Pass**（6/6 需求追溯 + 21/21 横切检查，无缺口；17 个 delta 场景全部有层归属）。计划可进入 `/sdd:quality-checklist`（P3 DoV）与后续 `/sdd:atdd-apply`。本自检不构成 Gate 决定。
