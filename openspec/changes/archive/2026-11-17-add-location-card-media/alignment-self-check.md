# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`add-location-card-media`（REQ-013）

- 日期：2026-11-17（P4 完成后补录，按已实现代码与验证证据复核计划层一致性）
- 输入：`proposal.md`、两份 delta spec（4 需求 17 场景）、`design.md`（D1–D5）、`dov-ac-review.md`、`atdd-design.md`（A1–A9 / E1–E10 / Defer UT）、`tasks.md`（全勾选）
- `npx --no-install openspec validate "add-location-card-media" --strict`：通过

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | `location-management`「用户端地点封面与评分字段」→ D1（批量取首张）/D2（rating 透传）/D3（DTO 纯增量）；`trip-attractions`「地点卡片封面与评分」→ D4 组件 + D5 视觉；「限制费用与政策说明行」→ D4 纯函数；「详情弹窗媒体同步」→ D4 弹窗头部 | 每条 requirement 均有对应决策，无规格要求悬空 |
| Spec → ATDD | Pass | 17 场景全覆盖：列表携带→A1/A7、详情携带→A4、首张选取→A2、缺失 null→A3/A5、DB-only→A6；封面展示/评分展示→E1、无照片占位→E2、加载失败降级→E3、评分缺失隐藏→E4；有值项/全空隐藏→E5、说明生成/无可生成隐藏→E6；弹窗媒体/降级→E7、类型一致→E8 | 反向场景（管理边界、Non-goals）由 A7/A8/E9/E10 承担 |
| Design → Tasks | Pass | D1→1.1、D2→1.2、D3→1.3、D4→2.1–2.3/3.1–3.3、D5→2.3/3.2；E2E 种子→4.1；集成验证→5.1–5.2 | 每个决策落到可验证任务 |
| ATDD → Tasks | Pass | A1–A9→1.1–1.3（`LocationQueryApiTest` 扩展）；E1–E9→4.2；E10→5.2（管理端回归）；Defer UT→2.1/2.2（vitest 纯函数） | 组件/卡片/弹窗 UT 改由 E2E 承担，见下方偏差记录 |
| AC-1 traceability（封面与评分字段） | Pass | Spec `location-management` 5 场景；Tasks 1.1–1.3；API A1–A9 先红后绿 | 契约、首张、null、DB-only、管理边界均可追踪 |
| AC-2 traceability（卡片封面与评分） | Pass | Spec `trip-attractions`「地点卡片封面与评分」5 场景；Tasks 2.3/3.2；E2E media E1–E4/E9 | 展示与三类降级 + absence 断言 |
| AC-3 traceability（限制费用与说明行） | Pass | Spec「地点卡片限制费用与政策说明行」4 场景；Tasks 2.2/3.2；vitest 18 例 + E2E media E5/E6 | 顺序、单位换算、仅 true 生成短语、整行隐藏 |
| AC-4 traceability（弹窗媒体同步） | Pass | Spec「详情弹窗媒体同步」3 场景；Tasks 3.3；E2E media E7/E8 | 弹窗降级同卡片、操作回归、类型结构一致 |
| Non-goal coverage | Pass | 押金/清洁费→E9 absence；管理端改动→A8/E10 回归；图片代理/重试→E3/A6；评分排序/轮播→E9；高德实时补拉→A6 `verifyNoInteractions` | 零迁移、零新依赖由代码审查与 build 佐证 |
| Task verifiability | Pass | `tasks.md` 每项含命令或行为验证；P4 执行记录含红→绿证据、各命令结果与用例数 | 5.1/5.2 全量验证已完成 |

## Gaps / residual risks（含 P4 已记录偏差）

- 验证口径调整：tasks 2.3/3.2/3.3 原文「组件/卡片/弹窗单测」由 E2E media E1–E9（真实 Chromium）承担——仓库无 RTL/jsdom 基础设施且 design 约束零新依赖；纯函数仍按 vitest TDD（18 例）。
- 夹具偏差：ATDD §5 政策组合甲落在 `e2e-zhu-hotel`（`e2e-zhu-a` 保留 REQ-009 既有政策断言）；组合乙全空 = `e2e-zhu-b`；media E6 全空夹具修正为无名景点（渔女 `leashRequired=1` 按规格应生成牵引短语）。
- media E8 先「暂不排期」再「添加第 1 天」：既有 `addStop` 去重契约，非本 change 行为。
- 遗留观察（非本 change 引入，不修）：390px 下行程面板默认全屏抽屉需点「收起」；主导航 tabs 与 Log out 间距偏紧。
- 上游照片 URL 可用性与评分快照时效为已接受的产品权衡（dov-ac-review 残余风险表）。

## Outcome

**Pass（计划层，P4 后复核）**：Spec、Design、ATDD 与 Tasks 一致，P4 偏差均已记录于 `tasks.md` 执行记录且不构成规格矛盾。该结果不代表 Gate 决策；G1/G2 决议另见 `g1-decision.md` / `g2-decision.md`。