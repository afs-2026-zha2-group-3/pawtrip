# AC / DoV 评审 — add-city-pet-policy

- 评审日期：2026-11-16（第二轮）
- 评审对象：`specs/city-pet-policy/spec.md`（4 条 requirement，11 个 scenario）
- 上游依据：`proposal.md`、GitHub issue #14（US-04）、原型 dest-2、living spec `location-management`
- 评审范围：仅评审 Delta Spec 的可验收性与对齐度；不含 G1 决策，不代表规格已批准

## 1. AC 清单

| 条目 | 结果 | 证据 | 说明 |
|---|---|---|---|
| AC-1 每条 requirement 至少一个可测 AC | Pass | `spec.md:9-78` | 4 条 requirement 均至少有一个 scenario |
| AC-2 AC 可观察、无空泛表述 | Pass | `spec.md:13-78` | 命中提醒、未命中提示、空态、未找到错误均可从外部观察；"高亮"的具体样式留到 design |
| AC-3 高风险负向 / 边界已覆盖 | Pass | `spec.md:37-55`、`spec.md:67-78` | 覆盖无品种、品种为"其他"、名称不完全一致、名单为空、未收录、行政区不存在 |
| AC-4 AC 未伪装实现细节 | Pass | `spec.md:67` | 第一轮的实现词已移除，scenario 标题与正文均为行为描述 |

## 2. DoV 清单

| 条目 | 结果 | 证据 | 说明 |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | `proposal.md:11-19`、`spec.md:9-78` | proposal 已补 404 错误、来源/免责声明、名单为空三条；spec 无超出 proposal 的行为 |
| DoV-2 歧义已列出或解决 | Pass | `proposal.md:18`、`spec.md:23-25` | 品种来源已在 proposal 定为可配置演示输入；展示样式、试点城市清单、城市名口径属 design/数据范围 |
| DoV-3 角色关注点已记录 | Pass | 见第 3 节 | IO / SA 残留风险已列出，等待签署人确认 |
| DoV-4 未声称实现完成 | Pass | 本 change 无代码变更 | 未写入业务代码，也未声称任何实现已完成 |
| DoV-5 需求可追溯到 proposal / 已批准需求 | Pass | R1–R3 → `proposal.md:11-13,17` + issue #14 AC-1/2/3；R4 → `proposal.md:14`；空名单 → `proposal.md:16`；来源与免责 → `proposal.md:15` | 全部 requirement 与关键边界均有上游条文 |

## 3. IO / SA 残留关注点

| 角色 | 关注点 | 影响 |
|---|---|---|
| IO | 试点城市清单与政策数据复核责任人（故事假设为人工摘录、季度复核） | 数据准确性无法由测试证明，需人工背书 |
| IO | 来源、更新时间、免责声明是否为本期 Must | 已写入 proposal，若 G1 降级需同步修改 spec |
| SA | 品种词表契约：档案品种枚举与禁养名单必须同源，否则精确匹配静默失效 | 已复核（2026-11-16）：issue #1 已记录"必须使用珠海全称"；main 的 V13 `dog_breed` 种子需在 US-01 落地时修正，本变更不做别名归一 |
| SA | "已收录"的判定口径（政策记录存在 vs 来源非空） | 影响 AC-3 与后续城市筛选，需在 design 固化 |
| SA | 未收录（无政策记录）与"已收录但名单为空"两种状态的区分 | spec `spec.md:52-70` 已分别描述，实现时不得合并 |

## 4. 修订记录

| 轮次 | 结论 | 主要发现 |
|---|---|---|
| 第一轮（2026-11-16） | 不满足 G1-ready（6 Pass / 3 Partial） | AC-4 标题含实现词；DoV-1 的 404/免责/空名单不在 proposal 范围；DoV-5 上述条目缺少追溯 |
| 修正 | — | `spec.md:67` 标题改为"仅有行政区记录但未录入政策"；`proposal.md:14-16` 补充 404、来源与免责、名单为空三条 |
| 第二轮（2026-11-16） | 通过（9 / 9 Pass），无阻塞项 | 上一轮 3 项 Partial 均已关闭 |
| 合并复核（2026-11-16） | 结论不变 | main 合并后：迁移号 V10 → V14；`POST /api/pets` 反向用例改为 `POST /api/cities/{adcode}/pet-policy` 405；品种词表契约由 issue #1 约束承接 |

## 5. 结论

第二轮评审 **9 项全部 Pass，无阻塞缺口**，从评审角度可以进入 G1。本评审不构成 Gate 决策：G1 仍需 IO 与 SA 实名签署，第 3 节的残留关注点应在决策记录中确认或转 design 处理。
