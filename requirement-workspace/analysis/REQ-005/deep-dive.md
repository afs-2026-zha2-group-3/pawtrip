# REQ-005 Deep Dive — 地点宠物政策编辑

- 上游需求：[REQ-005 管理员维护地点宠物政策](../../requirements/REQ-005-location-pet-policy-editing.md)
- 日期：2026-11-16
- 范围：管理端两个现有地点弹窗 + 管理 API；不含行政区、公共展示与新迁移

## 1. 数据契约

### 1.1 粒度与归属

- 一条 `pawtrip_location` 记录持有一组政策；不新建政策表。
- 地点政策与 `administrative_region` 政策相互独立，不继承、不复制、不回退。
- 创建时未填写的字段一律为 `NULL`；编辑时可把已配置字段清回 `NULL`。

### 1.2 字段

| 业务字段 | API 字段 | 数据库列 | 类型 | 空值语义 | 单位 / 计费口径 | 校验 |
|---|---|---|---|---|---|---|
| 每位游客最多携带宠物数 | `maxPetsPerPerson` | `max_pets_per_person` | `Integer` | `NULL` = 未配置 | 只 / 人 | 非负整数 |
| 单只宠物最大体重 | `maxSinglePetWeightKg` | `max_single_pet_weight_kg` | `Double` | `NULL` = 未配置 | kg，可为小数 | 非负数，最多两位小数 |
| 牵引绳要求 | `leashRequired` | `leash_required` | `Boolean` | `NULL` = 未配置；`false` = 明确不要求 | — | `true` / `false` / `null` |
| 疫苗证明要求 | `vaccinationProofRequired` | `vaccination_proof_required` | `Boolean` | 同上 | — | `true` / `false` / `null` |
| 额外费用 | `extraFeeCents` | `extra_fee_cents` | `Long` | `NULL` = 未配置；`0` = 免费 | 分 / 只 / 次；表单按元输入，最多两位小数 | 非负整数分 |
| 预约要求 | `reservationRequired` | `reservation_required` | `Boolean` | `NULL` = 未配置；`false` = 明确不要求 | — | `true` / `false` / `null` |

### 1.3 状态流转

| 当前 | 事件 | 结果 |
|---|---|---|
| 未配置（`NULL`） | 管理员填写合法值并保存 | 保存为明确值 |
| 已配置 | 管理员清空数值或把布尔选回“未配置”并保存 | 回到 `NULL` |
| 已配置 | 管理员修改并保存 | 覆盖为新值 |
| 任意 | PATCH 未携带 `petPolicies` | 政策全部保持不变 |
| 任意 | 保存失败 | 保持原值，不产生部分写入 |
| 任意 | 读取详情 | 返回数据库当前值，不读取行政区政策 |

### 1.4 API 契约

| 端点 | 变更 |
|---|---|
| `POST /api/admin/locations` | 请求增加可选 `petPolicies` 对象；缺省或对象内字段为 `null` 均保存为 `NULL` |
| `PATCH /api/admin/locations/{poiId}` | 请求增加可选 `petPolicies` 对象；缺省表示政策不变，出现则 6 项整体替换，字段 `null` 表示清空 |
| `GET /api/admin/locations/{poiId}` | 响应增加 `petPolicies` 对象（6 个可空字段），供编辑回填 |
| `GET /api/admin/locations` | 列表响应不变，不展示政策 |
| 错误 | 非法数值沿用现有 400 invalid-query；不暴露新的错误码 |

请求示例（POST / PATCH 共用政策对象）：

```json
{
  "petPolicies": {
    "maxPetsPerPerson": 1,
    "maxSinglePetWeightKg": 8.75,
    "leashRequired": true,
    "vaccinationProofRequired": false,
    "extraFeeCents": 1050,
    "reservationRequired": null
  }
}
```

## 2. 边界枚举

| 分支 | 归属 | 预期行为 |
|---|---|---|
| 数量留空 | In | 保存 `NULL` |
| 数量填 `0` | In | 保存 `0` |
| 数量为负数 / 小数 / 非数字 | In（拒绝） | 前端提示错误且不发请求；后端返回 400 |
| 体重留空 | In | 保存 `NULL` |
| 体重填 `0` | In | 保存 `0` |
| 体重为负数 / 非数字 | In（拒绝） | 前端提示错误且不发请求；后端返回 400 |
| 体重带小数 | In | 接受，如 `8.75` |
| 体重超过两位小数 | In（拒绝） | 前端提示错误且不发请求；后端返回 400 |
| 费用留空 | In | 保存 `NULL` |
| 费用填 `0` | In | 保存 `0`，表示免费 |
| 费用为负数 / 非数字 | In（拒绝） | 前端提示错误且不发请求；后端返回 400 |
| 费用超过两位小数 | In（拒绝） | 提示错误，不静默舍入 |
| 费用 `0.01` 元 | In | 保存 `1` 分 |
| 费用 `10.5` 元 | In | 保存 `1050` 分 |
| 布尔选“未配置” | In | 保存 `NULL` |
| 布尔选“需要” | In | 保存 `true` |
| 布尔选“不需要” | In | 保存 `false` |
| 景点地点 | In | 游玩时间 + 政策均可编辑 |
| 非景点地点 | In | 只编辑政策；游玩时间不显示 |
| 创建路径 | In | 政策随 `POST` 一次保存；未携带 `petPolicies` 时 6 项均为 `NULL` |
| 编辑路径 | In | 政策随 `PATCH` 一次保存；未携带 `petPolicies` 时政策不变 |
| 保存失败 | In | 显示既有失败提示，保留表单值，不部分写入 |
| 直接调用 API 传非法值 | In（拒绝） | 400，且不写入 |
| 行政区政策 | Out | 不读取、不写入、不继承 |
| 列表展示 / 公共展示 | Out | 本需求不展示 |

## 3. 跨 REQ / 既有能力对齐

| 资产 | 关系 | 处理 |
|---|---|---|
| REQ-001 问候语 | 无关 | checked, no impact |
| REQ-002 数据访问/错误处理 | 复用 400 invalid-query 错误路径 | checked, no contract change |
| REQ-003 登录 | 复用 `ADMIN` 权限 | checked, no change |
| REQ-004 前端骨架 | 复用 shadcn 表单组件与管理员页面结构 | checked, no change |
| `openspec/specs/location-management/spec.md` | 政策持久化与空值语义已存在；本次增加管理编辑与 API 契约 | 后续 delta 修改 |
| `openspec/changes/archive/2026-11-16-admin-location-management/` | 管理页、弹窗、分页与详情基线 | 在其上扩展 |
| `openspec/changes/archive/2026-11-16-add-pet-entry-policies/` | 6 列、实体字段、`updatePetPolicies` 基线 | 直接复用，无迁移 |
| GitHub US-17 / US-25 | 未来公共展示消费者 | 本需求只提供数据，Out of scope |
| `requirement-workspace/registry.md` | 仅登记 REQ-001…004 | 追加 REQ-005；其余 4 个归档 change 的登记缺口另行处理 |

## 4. 通知 / 展示契约

不涉及通知。

| 展示面 | 触发 | 受众 | 内容 / 字段 | 通道 |
|---|---|---|---|---|
| “保存地点”弹窗 | 管理员点击未保存 POI 的编辑 | 管理员 | POI 基础信息；景点显示游玩时间；所有类型显示 6 项政策 | Web 弹窗 |
| “pawtrip地点”编辑弹窗 | 管理员点击已保存地点的编辑 | 管理员 | POI / 商业 / 照片；景点显示游玩时间；6 项政策按详情回填 | Web 弹窗 |
| 表单错误 | 校验失败 | 管理员 | 字段级可读错误，不发起请求 | 弹窗内错误提示 |
| 保存失败 | API 错误或网络失败 | 管理员 | 既有失败提示，保留输入 | 弹窗内错误提示 |
| 地点列表 / 公共页面 | — | — | 本需求不展示政策 | — |

政策字段展示标签：

- 每位游客最多携带宠物数（只）
- 单只宠物最大体重（kg）
- 额外费用（元 / 只 / 次）
- 牵引绳要求（未配置 / 需要 / 不需要）
- 疫苗证明要求（未配置 / 需要 / 不需要）
- 预约要求（未配置 / 需要 / 不需要）

## 5. DoR 9–12 自检

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 9 | Data contract decided | Pass | 本文 1.1–1.4 |
| 10 | Boundary enumerated | Pass | 本文第 2 节覆盖所有分支 |
| 11 | Cross-REQ aligned | Pass | 本文第 3 节；无未收敛 ✗ |
| 12 | Notification / display contract | Pass | 本文第 4 节；无通知，两个展示面已列明 |

## 6. 已澄清的非阻塞问题

| status | question | resolution |
|---|---|---|
| resolved | 更新接口按整体替换还是缺省字段不变？ | 可选 `petPolicies` 对象：缺省不改，出现则 6 项整体替换 |
| resolved | 体重输入允许几位小数、如何显示？ | 最多两位小数，超过拒绝 |
| resolved | 非景点地点现有弹窗缺少保存操作，表单结构如何调整？ | 单表单始终渲染，游玩时间仅景点显示 |
| resolved | 是否在列表展示政策摘要？ | 本需求不做 |
