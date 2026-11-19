# Quality Checklist Report: p3

**Date:** 2026-11-18 (timezone: +0800)
**Root:** C:\Users\TANTA6\.qoder\worktrees\app\d19223\pawtrip
**Stages:** p3
**Focus:** full-stage
**Change:** 2026-11-18-companion-hints（REQ-018 伙伴提示）

## Summary

### p3 — ATDD design & task alignment

| Check id | Required? | Status | Evidence |
|----------|-----------|--------|----------|
| P3-1 ATDD design artifact | yes | Pass | `atdd-design.md`：21 场景分层表（Unit / Component / E2E）、U1–U8 / C1–C15 / A1–A4 / E1–E5 / B1–B4 测试清单、夹具与门禁、Non-goals 反向验证、NFR 口径 |
| P3-2 Design & task coherence | yes | Pass | `design.md` D1–D8 与 `tasks.md` 5 组 35 项一一对应；D3 明确首挂载/刷新不自动展示；tasks 头部链接 `design.md` 与 `atdd-design.md` |
| P3-3 Alignment self-check | yes | Pass | `alignment-self-check.md`：5/5 需求四方追溯、30/30 横切检查 Pass、21 场景无遗漏、E2E 新增 5 项 ≤30 |
| P3-4 Actionable task ordering | yes | Pass | `tasks.md` 按「全局能力 → 逐页提示 → 业务事件 → 测试补齐 → 验证收口」排序；每项可独立验证；旧 WIP 口径清理（独立头像/4600ms/气泡 AI 按钮）有 1.8 承接 |

| **Stage Overall** | — | Pass | 4/4 在焦必需项通过，无 Fail/Partial |

### Roll-up

| Scope | Overall | Notes |
|-------|---------|-------|
| selected stages (p3) | Pass | 单阶段，无 Fail/Partial |

## Gaps

| Check id | Gap | Owner (if known) | Suggested next |
|----------|-----|------------------|----------------|
| — | 无必检缺口 | — | — |

## Notes

- ATDD 口径：本 change 为纯前端，按仓库约定不红测先行；P4 直接实现并同步补齐测试，E2E 新增 5 项（≤30）。
- 业务事件覆盖：B1–B4 在既有 `paws-pet-management`、`city-pet-policy`、`attraction-pet-rules`、`transport-rules` / `rule-recommendation-and-selection` 内追加 `data-mood` 断言，不新增 E2E 用例。
- 口径澄清：`autoShownPath` 初始化为当前 pathname，首挂载与刷新不自动展示，与「每切换页面出现」「刷新后不保留」同时成立。
- 入口口径：保留既有 `agent-fab` 的原 `Bot` 图标、尺寸与样式（spec R1「保留原有样式」），仅把点击改为直接打开面板；不改为宠物照片。
- 依赖仍未安装，单测/E2E 未运行；执行证据留给 P4，不在本清单中宣称为已验证。
- 本报告不是 Gate 决定；G1 已由用户签署 Pass，G2/G3 仍须后续人工签署。
- 下一步：进入 P4，按 `tasks.md` 收敛 WIP 并补齐测试与验证。
