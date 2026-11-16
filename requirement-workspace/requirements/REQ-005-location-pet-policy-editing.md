---
id: REQ-005
title: 管理员维护地点宠物政策
status: in-change
discovery: Go (2026-11-16)
impact: ../analysis/REQ-005/impact-brief.md
deep_dive: ../analysis/REQ-005/deep-dive.md
sources:
  - apps/server/src/main/resources/db/migration/V7__add_pet_entry_policies.sql
  - apps/server/src/main/java/com/pawtrip/server/location/PawtripLocation.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdministrativeRegion.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationRequests.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationResponses.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationService.java
  - apps/server/src/main/java/com/pawtrip/server/location/LocationWriteService.java
  - apps/server/src/main/java/com/pawtrip/server/location/AdminLocationController.java
  - apps/web/src/routes/_authenticated/admin/-location-editor.tsx
  - apps/web/src/queries/admin-locations.ts
  - e2e/admin-location-management.spec.ts
  - apps/server/src/test/java/com/pawtrip/server/location/AdminLocationApiTest.java
  - openspec/specs/location-management/spec.md
  - openspec/changes/archive/2026-11-16-add-pet-entry-policies/
  - openspec/changes/archive/2026-11-16-admin-location-management/
  - docs/knowledge/architecture/README.md
---

# REQ-005: 管理员维护地点宠物政策

## Discovery Decision

Go — `pawtrip_location` 已有 6 个宠物政策列（V7），实体 getter 与 `updatePetPolicies` 已存在，但管理 API 与两个地点弹窗尚未暴露这些字段，管理员无法录入或修正。本轮范围已确认：两个现有弹窗、6 个字段全要、费用按元输入、适用于所有地点类型（2026-11-16）。

## 六字段

1. **id**：REQ-005
2. **statement**：管理员在“保存地点”和“pawtrip地点”编辑两个现有弹窗中，可录入和修改地点的 6 项宠物政策——每位游客最多携带宠物数、单只宠物最大体重、牵引绳要求、疫苗证明要求、额外费用与预约要求。政策与地点类型无关；留空保存为 `NULL`（未配置），`0` 为明确零值，布尔字段区分 `NULL` / `true` / `false`。额外费用在表单按人民币元输入（最多两位小数），提交与持久化使用分。保存后再次打开弹窗可看到已保存值，并可清回未配置。行政区政策和公共展示不在本需求范围。
3. **actors**：
   - 管理员（服务端要求 `ADMIN` 角色）：在管理页面新建或编辑地点政策
   - `apps/web` 管理员地点页面：展示与校验政策表单，提交创建/更新请求
   - `apps/server` 地点管理模块：校验并持久化政策字段，详情返回政策值
   - 后续公共展示页面（US-17 / US-25）：本需求只提供数据，不改展示
4. **rationale**：政策字段已落库但没有管理入口，管理员无法补录真实政策；地点数据不完整会直接影响后续“宠物友好景点”等用户故事的可用性。补齐现有弹窗的编辑能力可以避免再开新界面，并保持地点额外信息集中维护。
5. **acceptance hints**：
   - “保存地点”弹窗展示 6 项政策字段，创建请求的 `petPolicies` 包含对应值
   - “pawtrip地点”编辑弹窗按详情回填 6 项政策，保存后再次打开显示新值
   - 留空字段保存为 `NULL`；填写 `0` 保存为 `0`
   - 布尔字段可选“未配置 / 需要 / 不需要”，分别对应 `NULL / true / false`
   - 费用输入 `10.5` 元，请求与存储为 `1050` 分；重新打开显示 `10.5`
   - 负数、非整数数量、超过两位小数的体重或费用被拒绝，且不发起保存请求
   - 后端直接收到非法值返回现有 400 错误，不产生部分写入
   - 非景点类型也能编辑政策；游玩时间仍只对景点显示
   - 修改地点政策不改变任何 `administrative_region` 记录
   - 更新请求未包含 `petPolicies` 时政策保持不变；包含时 6 项整体替换，字段为 `null` 即清空
6. **links to evidence**：
   - 数据库与实体：`V7__add_pet_entry_policies.sql`、`PawtripLocation.java`、`AdministrativeRegion.java`
   - 现有 API：`AdminLocationRequests.java`、`AdminLocationResponses.java`、`AdminLocationController.java`、`AdminLocationService.java`、`LocationWriteService.java`
   - 现有界面：`apps/web/src/routes/_authenticated/admin/-location-editor.tsx`、`apps/web/src/queries/admin-locations.ts`
   - 现行规格与基线：`openspec/specs/location-management/spec.md`、`openspec/changes/archive/2026-11-16-add-pet-entry-policies/`、`openspec/changes/archive/2026-11-16-admin-location-management/`
   - 测试：`e2e/admin-location-management.spec.ts`、`AdminLocationApiTest.java`、`LocationRepositoryTest.java`
   - 架构说明：`docs/knowledge/architecture/README.md`
   - 2026-11-16 需求方决策：两个弹窗、6 字段、费用按元、所有地点类型
   - 2026-11-16 设计确认：PATCH 用可选 `petPolicies` 对象，缺省不改、出现则整体替换
   - 2026-11-16 设计确认：体重最多两位小数；编辑弹窗单表单始终渲染；列表不展示政策

## Ready 形状

### Intent

让管理员在现有地点弹窗中补全和修正地点的宠物政策，使 `pawtrip_location` 上的 6 项政策可从管理界面维护，供后续公共展示使用。

### Actors 与权限边界

- 管理员（`ADMIN`）：唯一可写入角色，权限仍由服务端 Spring Security 校验。
- 管理端前端：只负责展示、校验与提交，不作为授权依据。
- 管理端 API：负责最终校验与持久化。
- 普通用户：无管理入口，不在本需求范围。

### In / Out Scope

**In**

- “保存地点”（高德未保存 POI）弹窗增加政策编辑区，创建时随地点一起保存
- “pawtrip地点”编辑弹窗增加政策编辑区，读取详情回填并保存修改
- 管理 API 的创建/更新请求增加可选 `petPolicies` 对象，详情响应的 `petPolicies` 对象包含 6 个可空政策字段
- 表单校验：非负、数量整数、体重与费用最多两位小数、布尔三态
- 费用元与分之间的换算
- 非景点地点也显示政策编辑区
- 后端 API 与端到端测试覆盖新建、回填、清除、非法值

**Out**

- `administrative_region` 政策的编辑界面或 API
- 行政区到地点的政策继承、复制或回退
- US-17 / US-25 的公共页面与行程内政策展示
- “pawtrip地点”列表新增政策列、筛选或排序
- 新数据库迁移、批量导入、删除政策
- 修改游玩时间、照片、POI 基础信息的既有行为

### Scenarios + AC Hints

**S1 新建地点填写政策**

- Given 管理员打开未保存 POI 的“保存地点”弹窗
- When 填写 6 项政策并保存
- Then 创建请求的 `petPolicies` 包含 6 个字段
- And 地点详情返回相同的政策值

**S2 留空表示未配置**

- Given 管理员新建地点
- When 数量、体重、费用留空，布尔保持“未配置”
- Then 保存后 6 个字段均为 `NULL`

**S3 零值是明确值**

- Given 管理员填写数量 `0` 或费用 `0`
- When 保存并重新打开
- Then 对应字段显示 `0`，不被当作未配置

**S4 编辑已保存地点并回填**

- Given 地点已有政策值
- When 管理员打开“pawtrip地点”编辑弹窗
- Then 6 项字段显示已保存值
- When 修改并保存
- Then 更新请求的 `petPolicies` 包含修改后的 6 个字段，重新打开显示新值

**S5 清回未配置**

- Given 地点已配置某项政策
- When 管理员清空该字段并保存
- Then 更新请求的 `petPolicies` 对应字段为 `null`
- And 保存后为 `NULL`，重新打开显示为空

**S6 布尔三态**

- Given 管理员编辑牵引绳、疫苗证明或预约要求
- When 选择“未配置 / 需要 / 不需要”
- Then 分别保存为 `NULL / true / false`
- And 重新打开时选中对应项

**S7 数值校验**

- Given 管理员填写负数、非整数数量或超过两位小数的费用
- When 点击保存
- Then 显示可读错误，且不发起保存请求
- And 后端直接收到非法值时返回 400，不产生部分写入

**S8 费用单位换算**

- Given 管理员在费用输入框填写 `10.5`
- When 保存
- Then 请求与存储值为 `1050` 分
- And 重新打开显示 `10.5`

**S9 所有地点类型**

- Given 地点不属于景点类型
- When 管理员打开编辑弹窗
- Then 仍显示政策编辑区和保存操作
- And 游玩时间不显示

**S10 行政区政策不受影响**

- Given 某地点已配置政策
- When 管理员保存该地点政策
- Then 该地点所属 `administrative_region` 的政策字段不变
- And 地点未配置字段不从行政区推导

**S11 保存失败**

- Given 后端返回错误或网络失败
- When 管理员保存
- Then 弹窗显示既有失败提示
- And 表单值保留，数据库不产生部分更新

### Constraints

- 6 个数据库列已由 V7 创建；本需求不新增迁移。
- API 费用字段为整数分（`extraFeeCents`，`Long`）；表单按元输入，最多两位小数。
- 单只宠物最大体重最多两位小数；费用最多两位小数，超过则拒绝。
- PATCH 通过可选 `petPolicies` 对象更新政策：缺省表示不改，出现则 6 项整体替换，字段 `null` 表示清空。
- POST 同样使用可选 `petPolicies` 对象；缺省时 6 项均为 `NULL`。
- `NULL`、`false`、`0` 的语义遵循 `location-management` 现有规格。
- 复用现有管理端点与 `ADMIN` 权限；不新增角色或认证方式。
- 现有地点类型选项只有“景点”；政策仍按所有类型实现。
- 现有 `updateVisitHours` 行为与景点限制不变。
- 非法值沿用现有 400 invalid-query 错误路径。

### Context

V7 已为 `administrative_region` 与 `pawtrip_location` 各增加 6 个可空列；实体已映射并提供 `updatePetPolicies`，但管理 API 与 UI 尚未调用。当前“保存地点”和“pawtrip地点”编辑弹窗只处理游玩时间，且编辑弹窗的表单仅在景点时渲染。管理端架构见 `docs/knowledge/architecture/README.md` 的“地点管理功能模块”。

### Affected capabilities

- **MODIFIED** `location-management`：管理员可维护地点政策，管理 API 契约增加 6 个字段。
- **不新增** capability。
- **不改动** 公共展示相关能力（当前不存在）。

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 政策编辑是否只对景点开放？ | 需求方 | 已确认：所有地点类型 |
| non-blocking | resolved | 更新接口按整体替换还是“缺省字段不变”处理？ | SA | 已确认：可选 `petPolicies` 对象，缺省不改、出现则整体替换 |
| non-blocking | resolved | 体重输入允许几位小数、如何显示？ | SA / UX | 已确认：最多两位小数，超过拒绝 |
| non-blocking | resolved | 非景点地点现有弹窗缺少保存操作，表单结构如何调整？ | SA | 已确认：单表单始终渲染，游玩时间仅景点显示 |
| non-blocking | resolved | 是否在列表展示政策摘要？ | 需求方 | 已确认：本需求不做 |

## DoR 自检

| # | 检查项 | 结果 | 证据 / 说明 |
|---|---|---|---|
| 1 | Intent clear | Pass | Intent 与 statement |
| 2 | Actors defined | Pass | Actors 与权限边界 |
| 3 | Scope bounded | Pass | In / Out Scope |
| 4 | Scenarios / AC hints concrete | Pass | S1–S11 |
| 5 | Exception / boundary | Pass | S7、S11 与 deep-dive 边界表 |
| 6 | Results verifiable | Pass | 请求字段、回填值、错误提示、数据库值 |
| 7 | Dependencies / app-arch touchpoints | Pass | 管理 API、管理前端、SQLite 列、既有服务 |
| 8 | Open-questions gate | Pass | blocking = 0；4 个非阻塞项均已 resolved |
| 9 | Data contract decided | Pass | [deep-dive](../analysis/REQ-005/deep-dive.md) 数据契约表 |
| 10 | Boundary enumerated | Pass | deep-dive 边界表覆盖空值、零值、非法值、类型分支 |
| 11 | Cross-REQ aligned | Pass | deep-dive 跨 REQ 表 |
| 12 | Notification / display contract | Pass | 无通知；两个管理弹窗的展示契约已列明 |

DoR 结论：BLOCKER = 0。WARNING：`registry.md` 只登记到 REQ-004，2026-11-14 之后的 4 个归档 change 未登记，属流程缺口，不阻塞本需求。SUGGESTION：实现后可补地点政策相关知识库条目。

## Impact

见 [REQ-005 Impact Brief](../analysis/REQ-005/impact-brief.md)。
