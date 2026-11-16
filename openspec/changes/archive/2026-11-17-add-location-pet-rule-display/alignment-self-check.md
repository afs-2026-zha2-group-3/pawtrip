# Alignment self-check — add-location-pet-rule-display（Revision 2）

- 日期：2026-11-16
- 输入：`specs/attraction-pet-rules/spec.md`（6 需求）、`specs/web-app-shell/spec.md`（1 需求）、`design.md`、`tasks.md`、`atdd-design.md`
- 结论：**Pass**（Revision 2 已确认为范围收缩；无静默扩范围、无孤立 Requirement、无越界 Task）

## 1. Spec → Design → Tasks → ATDD

| Delta Requirement | Design | Tasks | ATDD | 结果 |
|---|---|---|---|---|
| 已选城市下的景点列表 | D7 读取 `useSelectedDestination`；无城市不请求；仅 attraction；只读数据库 | 4.2、4.3 | A1/A3/A8/A9、E1/E6/E8 | Pass |
| 宠物友好口径与切换 | D4 默认 `max_pets_per_person >= 1`；D8 三态 badge | 1.1、2.2、4.2、4.3 | A1/A2、E2/E9 | Pass |
| 景点详情与携宠政策展示 | D6 详情 `petPolicies` 8 字段；D8 局部展示组件 | 2.2、4.4 | A4/A6、E3/E4 | Pass |
| 政策字段的展示语义 | D8 复用现有格式化与 Tailwind 组合 | 4.2、4.4 | A4、E3 | Pass |
| 景点与地点只读查询 API | D3/D4/D5/D6 | 2.1、2.2 | A1–A12 | Pass |
| 景点页入口与自动跳转 | D9 `/cities` 选定后自动进入 `/attractions`，移除按钮 | 4.5 | E1/E5/E12 | Pass |
| 景区浏览导航 Tab（web-app-shell） | D9 新增顶层 Tab，`/attractions` 映射 `attractions` | 4.5 | E7 | Pass |

## 2. Revision 2 的范围变化

- 移除 `entry_policy` / `entry_note` 与新增迁移：Delta Spec 不再包含“三档持久化与录入”Requirement；Design 不再包含迁移/实体字段；Tasks 不再包含 V16/种子脚本。
- 默认门槛改为现有 `maxPetsPerPerson >= 1`：列表 Requirement、API Requirement、Design D4/D8、ATDD A1/A2/E1/E2/E9 已同步。
- `hasRuleDetails` 不再需要：列表摘要直接返回可空 `maxPetsPerPerson`，前端派生三态。
- 这是一次已确认的范围收缩，不是静默扩范围；G1 Revision 2 待 IO/SA 重签。

## 2a. Revision 3 的范围变化

- 新增顶层“景区浏览”Tab；`/cities` 选定城市后自动进入 `/attractions`；城市浏览页不内嵌景点列表或入口按钮。
- `web-app-shell` delta 从“景点路由归入城市浏览 Tab / 不新增 Tab”改为“新增景区浏览 Tab”；目的地 E2E 已按自动跳转更新。
- 无后端/数据变更；随本次实现与全量 E2E 回归验证。

## 3. Non-goals 反向覆盖

| Non-goal | 反向验证 | 位置 |
|---|---|---|
| 城市选择控件 | E10 absence 断言 | ATDD E10 |
| 城市浏览页内嵌景点/入口 | E12：`/cities` 无景点列表、无“查看景点”按钮 | ATDD E12 |
| 地点类型筛选 | E10 | ATDD E10 |
| 编辑/保存/删除 | E10 | ATDD E10 |
| 行程内展示（AC-2） | E10 无加入行程/行程区块 | ATDD E10 |
| 非景点公开列表 | A1/A2、E1/E2 | ATDD |
| 新增三档/说明字段 | A12、E10、5.5 代码审查 | ATDD |
| 照片/business/原始 POI | A12 JSON absence | ATDD |
| 高德调用 | A9 `verifyNoInteractions` | ATDD |
| 公开写入端点 | A11 路由面 | ATDD |
| 数据库迁移/新列 | 5.5 代码审查 | Tasks |

## 4. Task 边界检查

- 所有 Task 均可映射到至少一个 Delta Requirement 或 Non-goal 反向验证；无“顺手重构”任务。
- 任务组各自携带测试与文档：数据组带仓库测试与架构说明；API 组带 API 测试与接口文档；E2E 数据组带脚本验证与边界文档；前端组带 E2E/单测与路由文档；最后一组做全量集成回归。
- 无迁移任务、无实体字段任务、无生产种子脚本任务——与 Revision 2 一致。
- 归档顺序依赖已在 G1 记录与 design Risks 中明确，不属于 P3 实现任务。

## 5. P3 checklist 证据

| 检查项 | 结果 | 证据 |
|---|---|---|
| P3-1 ATDD design 存在 | Pass | `atdd-design.md`（Revision 2） |
| P3-2 Design/tasks 存在 | Pass | `design.md`、`tasks.md`（Revision 2） |
| P3-3 对齐自检无静默扩范围 | Pass | 本文第 1–3 节 |
| P3-4 任务可执行、含验证 | Pass | `tasks.md` 每组任务均含验证命令/可观察行为 |

## 6. 残余风险

- 默认门槛依赖 `maxPetsPerPerson` 已维护，数据补齐前列表可能为空；现有管理弹窗只编辑 6 项，`allowed_pet_types` 与肩高有值才展示。
- `web-app-shell` 归档顺序依赖 destination-selection。
- E2E 种子脚本只操作临时库。
- NFR 测试已由需求方确认 out of scope。
