# 意图记录：管理员维护地点宠物政策

- 日期：2026-11-16
- 来源：会话需求（管理员“保存地点”弹窗截图 + 需求方说明）
- Discovery：Go（2026-11-16）
- 关联需求：[REQ-005](../requirements/REQ-005-location-pet-policy-editing.md)

## 原始意图

在管理员地点管理的现有弹窗中增加 6 项宠物政策的编辑字段。V7 已为 `pawtrip_location` 增加对应列，但管理 API 与界面尚未暴露，管理员无法录入或修正这些政策。

## 已确认决策

| 日期 | 决策 | 说明 |
|---|---|---|
| 2026-11-16 | 两个现有弹窗都加 | “保存地点”（高德未保存 POI）与 “pawtrip地点”编辑弹窗，不新增弹窗 |
| 2026-11-16 | 6 个政策字段全部可编辑 | 与 V7 迁移字段一一对应 |
| 2026-11-16 | 额外费用按“元”输入 | 表单最多两位小数，提交与存储使用分 |
| 2026-11-16 | 适用于所有地点类型 | 政策与 `typeGroup` 无关；当前类型选项只有“景点” |
| 2026-11-16 | 沿用既有语义 | `NULL` 表示未配置，`false` 表示明确不要求，`0` 表示明确零值；地点政策不从行政区继承 |
| 2026-11-16 | 空输入写 `NULL` | 编辑时可把已配置字段清回未配置 |
| 2026-11-16 | 更新用可选 `petPolicies` 对象 | 缺省不改，出现则 6 项整体替换；POST 同样使用该对象 |
| 2026-11-16 | 体重最多两位小数 | 超过两位拒绝；费用同样最多两位 |
| 2026-11-16 | 编辑弹窗单表单始终渲染 | 政策所有类型可编辑，游玩时间仅景点显示 |
| 2026-11-16 | 列表不展示政策 | 两个地点表格保持不变 |

## 明确不做

- 行政区（`administrative_region`）政策维护界面
- US-17 / US-25 的公共展示与行程内展示
- 地点列表新增政策列或筛选
- 行政区到地点的政策继承或复制
- 新数据库迁移、删除政策或批量导入

## 证据

- 截图对应界面：`apps/web/src/routes/_authenticated/admin/-location-editor.tsx`
- 数据库字段：`apps/server/src/main/resources/db/migration/V7__add_pet_entry_policies.sql`
- 已归档基线：`openspec/changes/archive/2026-11-16-add-pet-entry-policies/`、`openspec/changes/archive/2026-11-16-admin-location-management/`
- 现行规格：`openspec/specs/location-management/spec.md`
