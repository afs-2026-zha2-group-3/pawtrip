# Consistency Lint — 2026-11-18-add-trip-packing-checklist

日期：2026-11-18
范围：`proposal.md`、`specs/trip-packing-checklist/spec.md`、`specs/trip-itinerary/spec.md`、`design.md`、`tasks.md`、`dov-ac-review.md`

| 检查项 | 结果 | 证据 / 说明 |
|---|---|---|
| 分类枚举大小写一致 | Pass | 迁移、Design SQL、API 响应与前端类型统一为 `DOCUMENTS/FOOD/TRAVEL/HEALTH/CLEANING`；Design 模板表已改为大写 |
| 数量规则一致 | Pass | 主粮 `totalDays × 2`；尿垫 `max(1, totalDays)`；数量范围 1–99 在 Spec、Design、迁移与校验中一致 |
| 尺寸分档一致 | Pass | 体重 `≤5 S / ≤15 M / >15 L`；肩高 `<35 S / <55 M / ≥55 L`；Design 与实现一致，运输包已改为 S/M/L |
| 状态语义一致 | Pass | `ACTIVE` 展示、`HIDDEN` 场景隐藏可恢复、`DELETED` 用户删除墓碑不复活；Spec、Design、实现一致 |
| 进度口径一致 | Pass | 按可见物品行统计；Spec、Design、后端响应与前端文案一致 |
| 错误码一致 | Pass | `PACKING_CHECKLIST_NOT_FOUND`、`PACKING_ITEM_NOT_FOUND`、`PET_PROFILE_REQUIRED` 与 Design/实现一致 |
| API 路径与方法一致 | Pass | `POST/GET /api/trips/{tripId}/packing-checklist`、`POST/PUT/DELETE .../items[/{itemId}]` 与 Design、Tasks、实现一致 |
| 入口形态一致 | Pass | Spec、Design、P1 需求均为 Day 标签行按钮 + 弹窗；与「查看当天路线规划」同层 |
| 模板项编辑边界一致 | Pass | Spec/Design/UI/API 均为模板项只改数量与勾选、自定义项可改数量/勾选，行内改名/分类不在本期 UI |
| 术语一致 | Pass | 「携带清单」「清单项/物品」「打包进度」统一；无「行李清单」「装备清单」混用 |
| Tasks 与 Design 对齐 | Pass | 5 组任务覆盖 V29、领域、服务/API、前端查询/弹窗、E2E 与验证命令 |
| AC 与 Scenario 追溯 | Pass | `dov-ac-review.md` 追溯表 10/10 行；AC-1…AC-9 均有场景与任务承接 |
| 导出隔离一致 | Pass | `trip-itinerary` Delta、Design、弹窗 `print:hidden` 与既有导出策略一致 |
| 规范校验 | Pass | `npx --no-install openspec validate 2026-11-18-add-trip-packing-checklist --strict` → valid |

## Findings

| 级别 | 位置 | 问题 | 处理 |
|---|---|---|---|
| SUGGESTION | 进度文案 | 按物品行计但文案为「件」，主粮数量 10 仍计 1 件 | 保持需求口径，在验收说明中注明；不改文案 |
| SUGGESTION | Design 前端范围 | Design 曾写自定义项「行内编辑名称/分类」，实现未暴露 | 已修正为「API 支持、本期 UI 不做行内改名/分类」 |
| SUGGESTION | 迁移编号 | V29 与 main 并行迁移可能冲突 | P4 合并 main 时按实际最新版本重编号并复跑迁移测试 |

BLOCKER：0；WARNING：0；SUGGESTION：3。Verdict：**Pass**。
