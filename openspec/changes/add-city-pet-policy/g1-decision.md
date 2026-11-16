# G1 decision — add-city-pet-policy

- **Gate**：G1（Align）
- **Change id**：`add-city-pet-policy`
- **Inputs**：
  - `proposal.md`
  - `specs/city-pet-policy/spec.md`（4 条 requirement，11 个 scenario）
  - `dov-ac-review.md`（第二轮 AC/DoV 评审 9/9 Pass）
  - 需求来源：GitHub issue #14（US-04）、原型 dest-2、living spec `location-management`
- **Findings**：
  - 范围：单宠物、仅珠海一个试点城市、仅黑名单、档案品种词表之外的品种不判定、政策数据按公开公告管理。
  - 歧义：第一轮评审的 3 项 Partial 已通过修改 `spec.md:67` 与 `proposal.md:14-16` 关闭；第二轮无未决阻塞歧义。
  - 冲突：无。与 PR #33 的多宠物表不冲突——产品口径为单宠物，若数据库出现多行按 id 升序取第一条兜底；珠海名单只覆盖严格管理区，已在展示层以脚注说明。
- **Decision**：Pass
- **Conditions + owners**：无（Pass，无整改条件）
- **Approvers**：IO = KITTY；SA = LEO
- **Timestamp**：2026-11-16

## 已确认口径

| 议题 | 结论 |
|---|---|
| 宠物数量 | MVP 只支持单宠物；若查询返回多行，按 id 升序取第一条 |
| 试点城市 | 仅珠海（adcode 440400，严格管理区口径） |
| 名单类型 | 只有黑名单；命中即提醒 |
| 未命中 | 显示"未命中禁养名单"，但不承诺允许，保留"以当地最新规定为准" |
| 词表外品种 | 不判定，接受漏报 |
| 数据来源 | 公开通告，人工摘录并记录来源与更新月份 |

## 已知限制（转 P3 design 处理，不构成 G1 条件）

1. 珠海名单中的"有烈性犬血统的混种犬"和"体型特别巨大"不判定。
2. 档案品种词表之外的品种（如阿根廷杜高犬）无法匹配。
3. 珠海名单仅适用于严格管理区，页面以脚注说明。
4. 名单以公开通告版本为准，发布前需人工复核。
5. 迁移号从 V10 开始，避开 PR #33 已占用的 V8/V9。

## 补充记录（2026-11-16，不改变 Decision）

- 迁移号：main 已合并 V8–V13（宠物档案与犬种参考数据），原计划的 V10 与 main 版本号冲突；实现迁移号调整为 **V14**，范围、验收与已确认口径不变。
- 品种词表：main 的 V13 `dog_breed` 种子（比特犬/藏獒/高加索犬/卡斯罗犬）与珠海全称不一致；US-01 须按 issue #1 的约束改用全称或在词表层补充映射。本变更继续保持精确匹配，不引入别名归一。

## 后续

- 通过 G1 后进入 P3：`atdd-design.md` → `design.md` + `tasks.md`。
- 本记录不代表实现完成，也不改变 Delta Spec；如需修改规格，需回到 delta-craft 并重跑评审。
