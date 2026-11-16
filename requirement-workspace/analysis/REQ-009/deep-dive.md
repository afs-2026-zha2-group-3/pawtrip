# REQ-009 Deep Dive — 宠物友好景点携宠规则展示

- 上游需求：[REQ-009 宠物友好景点携宠规则展示](../../requirements/REQ-009-location-pet-rule-display.md)
- 日期：2026-11-16（Revision 3）
- 范围：已选目的地城市下的景点列表 + 景点详情；只读现有 8 个政策字段；不含管理 UI、行程内展示、非景点类型与行政区政策
- 修订说明：Revision 2 移除 `entry_policy` / `entry_note` 三档与补充说明，默认列表按 `max_pets_per_person >= 1`；Revision 3 新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入，城市浏览页不内嵌景点列表或入口按钮。

## 1. 数据契约

### 1.1 粒度与归属

- 一条 `pawtrip_location` 记录代表一个已保存地点；景点以 `type_group='attraction'` 识别。
- 政策数据直接使用现有 8 列，不新建规则表、不新增列、不新增迁移。
- 列表默认口径为 `max_pets_per_person >= 1`；`includeWithoutRules=true` 时返回该城市全部已保存景点。
- 管理端继续通过现有两个地点弹窗维护其中 6 项；`allowed_pet_types` 与 `max_single_pet_shoulder_height_cm` 仍不在弹窗中，有值才展示。

### 1.2 字段

| 业务字段 | API 字段 | 数据库列 | 类型 | 空值语义 | 单位 / 展示 |
|---|---|---|---|---|---|
| 每位游客最多携带宠物数 | `maxPetsPerPerson` | `max_pets_per_person` | `INTEGER` | `NULL` = 未配置；`0` = 禁止携带；`>=1` = 宠物友好 | 只 / 人 |
| 允许宠物类型 | `allowedPetTypes` | `allowed_pet_types` | `TEXT` | `NULL` = 未配置 | `CAT` / `DOG` / `CAT,DOG` |
| 单只宠物最大体重 | `maxSinglePetWeightKg` | `max_single_pet_weight_kg` | `REAL` | `NULL` = 未配置；`0` = 明确零值 | kg |
| 单只宠物最大肩高 | `maxSinglePetShoulderHeightCm` | `max_single_pet_shoulder_height_cm` | `REAL` | `NULL` = 未配置；`0` = 明确零值 | cm |
| 牵引绳要求 | `leashRequired` | `leash_required` | `INTEGER`（布尔） | `NULL` = 未配置；`false` = 明确不要求 | 需要 / 不需要 |
| 疫苗证明要求 | `vaccinationProofRequired` | `vaccination_proof_required` | `INTEGER`（布尔） | 同上 | 需要 / 不需要 |
| 额外费用 | `extraFeeCents` | `extra_fee_cents` | `INTEGER` | `NULL` = 未配置；`0` = 免费 | 分；展示为元 / 只 / 次 |
| 预约要求 | `reservationRequired` | `reservation_required` | `INTEGER`（布尔） | 同上 | 需要 / 不需要 |

派生状态（不存储）：

| 状态 | 条件 | 列表文案 |
|---|---|---|
| 宠物友好 | `maxPetsPerPerson >= 1` | 宠物友好 |
| 禁止携带 | `maxPetsPerPerson = 0` | 禁止携带 |
| 未配置 | `maxPetsPerPerson IS NULL` | 未配置 |

说明：

- `maxPetsPerPerson` 是唯一列表门槛；其他字段只作详情展示，不参与默认筛选。
- 不返回 `entryPolicy` / `entryNote` / `hasRuleDetails`；Revision 2 已移除这些规划字段。
- 照片、business、`poi_json` 不在公开详情返回。

### 1.3 状态流转

| 当前 | 事件 | 结果 |
|---|---|---|
| `max_pets_per_person IS NULL` | 管理员在现有弹窗填写 `>=1` | 变为宠物友好；默认列表开始展示 |
| `max_pets_per_person IS NULL` | 管理员填写 `0` | 变为禁止携带；仅全部模式展示 |
| `max_pets_per_person >= 1` | 管理员改为 `0` | 默认列表不再展示；全部模式显示“禁止携带” |
| `max_pets_per_person >= 1` | 管理员清空 | 回到未配置；默认列表不再展示 |
| 任意 | 管理员保存其他 6 项政策 | `maxPetsPerPerson` 按表单值保存；其他字段按现有逻辑 |
| 任意 | 保存失败 | 保持原值，不产生部分更新 |
| 任意 | 读取详情 | 返回数据库当前值，不读取行政区政策 |

### 1.4 API 契约

新增用户端只读接口（登录即可，不要求 `ADMIN`）：

| 端点 | 请求 | 响应 | 错误 |
|---|---|---|---|
| `GET /api/locations/attractions` | `regionCode`（必填）、`includeWithoutRules`（默认 `false`）、`page`（默认 1）、`pageSize`（默认 20） | 分页的景点摘要 | `400` 参数非法；`401` 未登录 |
| `GET /api/locations/{poiId}` | 路径 `poiId` | 已保存地点详情 + `petPolicies`（8 字段） | `404 LOCATION_NOT_FOUND`；`401` |

列表响应示例：

```json
{
  "page": 1,
  "pageSize": 20,
  "totalElements": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false,
  "items": [
    {
      "poiId": "B0FFH...",
      "name": "情侣路",
      "typeCode": "110000",
      "typeGroup": "attraction",
      "address": "广东省珠海市香洲区",
      "regionCode": "440402",
      "maxPetsPerPerson": 1
    }
  ]
}
```

详情响应示例：

```json
{
  "poiId": "B0FFH...",
  "name": "情侣路",
  "typeCode": "110000",
  "typeGroup": "attraction",
  "address": "广东省珠海市香洲区",
  "regionCode": "440402",
  "petPolicies": {
    "allowedPetTypes": "DOG",
    "maxPetsPerPerson": 1,
    "maxSinglePetWeightKg": 8.5,
    "maxSinglePetShoulderHeightCm": 40.0,
    "leashRequired": true,
    "vaccinationProofRequired": false,
    "extraFeeCents": 1050,
    "reservationRequired": null
  }
}
```

约定：

- 列表只返回 `type_group='attraction'` 的已保存地点；不调用高德。
- 列表摘要只含 badge 所需字段与基础信息；返回 `maxPetsPerPerson` 供前端派生三态，不返回其他政策字段。
- 详情返回任意已保存地点；页面只链接景点。详情不返回照片、business、`poi_json`。
- `includeWithoutRules` 缺省为 `false`；`true` 时不加 `max_pets_per_person >= 1` 条件。
- 分页沿用现有地点分页字段形状。
- 错误沿用 Problem Details 与现有稳定 code：`VALIDATION_ERROR`、`UNAUTHENTICATED`、`LOCATION_NOT_FOUND`。

### 1.5 城市匹配

- 城市来源为 REQ-006 的 `pawtrip.selectedDestination.adcode`；前端不提供城市选择控件。
- 服务端按行政区级别匹配：城市级按 `substr(region_code, 1, 4) = substr(:regionCode, 1, 4)`；省级叶节点按 `substr(region_code, 1, 2) = substr(:regionCode, 1, 2)`，复用地点管理现有 `ValidatedRegion` 口径。
- `regionCode` 不存在或不是省/市级行政区 → `400`。
- 已保存地点的 `region_code` 可能为区县级（6 位）；前缀匹配保证能归入所属城市。

## 2. 边界枚举

| 分支 | 归属 | 预期行为 |
|---|---|---|
| 未选择目的地 | In | `/attractions` 显示“请先选择目的地”，提供 `/cities` 入口；不请求列表 |
| 在 `/cities` 选定城市 | In | 更新已选目的地并自动进入 `/attractions`；顶部“景区浏览”Tab 选中 |
| 城市浏览页 | Out | 不内嵌景点列表，不显示“查看{城市}景点”按钮 |
| 已选城市无已保存景点 | In | 显示“该城市暂无已保存景点” |
| 已选城市有景点但无 `maxPetsPerPerson >= 1`（默认模式） | In | 显示“该城市暂无宠物友好的已保存景点”，提示可切换全部 |
| 关闭“显示全部景点” | In | 只返回 `max_pets_per_person >= 1` 的景点 |
| 打开“显示全部景点” | In | 返回该城市全部已保存景点 |
| `maxPetsPerPerson >= 1` | In | 列表/详情显示“宠物友好” |
| `maxPetsPerPerson = 0` | In | 全部模式显示“禁止携带” |
| `maxPetsPerPerson IS NULL` | In | 全部模式显示“未配置” |
| `allowedPetTypes` 为 `CAT` | In | 显示“猫” |
| `allowedPetTypes` 为 `DOG` | In | 显示“狗” |
| `allowedPetTypes` 为 `CAT,DOG` | In | 显示“猫和狗” |
| `allowedPetTypes` 为 `NULL` | In | 不显示该行 |
| 数值字段为 `0` | In | 显示 `0`（费用显示 `0 元 / 只 / 次`） |
| 数值字段为 `NULL` | In | 不显示该行 |
| 布尔字段 `true` | In | 显示“需要” |
| 布尔字段 `false` | In | 显示“不需要” |
| 布尔字段 `NULL` | In | 不显示该行 |
| 费用 `1050` 分 | In | 显示 `10.5 元 / 只 / 次` |
| 费用 `1` 分 | In | 显示 `0.01 元 / 只 / 次` |
| 全部政策字段为 `NULL` | In | 详情显示“暂无携宠政策” |
| 非景点类型（酒店/餐厅/医院/用品店） | Out | 不出现在景点列表 |
| 直接请求非景点 `poiId` | In | 详情可返回（页面不链接）；不进入景点列表 |
| `poiId` 不存在 | In（拒绝） | `404 LOCATION_NOT_FOUND` |
| `regionCode` 缺失/非法 | In（拒绝） | `400`，不返回其他城市数据 |
| 未登录 | In（拒绝） | `401 UNAUTHENTICATED`，前端跳转 `/login` |
| 普通用户 / 管理员 | In | 均可查看；不要求 `ADMIN` |
| 页码超出范围 | In | 返回空页，不报错 |
| 选定城市变更 | In | 列表按新 `regionCode` 重新请求 |
| 登出 | In | sessionStorage 清除；`/attractions` 回到未选择目的地状态 |
| 照片 / business / 原始 POI | Out | 不在公开详情展示 |
| 行程内展示 | Out | 依赖 US-48，另行接入 |
| 新增 `entry_policy` / `entry_note` | Out | Revision 2 已移除，不新增列/迁移 |

## 3. 跨 REQ / 既有能力对齐

| 资产 | 关系 | 处理 |
|---|---|---|
| REQ-006 选择目的地 | 提供已选城市 `adcode`；选定后自动进入 `/attractions` | 只读消费其选定状态；自动跳转属于本能力的入口集成，不修改其候选/筛选/存储逻辑 |
| REQ-005 管理员维护地点宠物政策 | 提供 6 项政策与现有弹窗 | 不改管理 API/弹窗；`maxPetsPerPerson` 由现有表单维护 |
| `openspec/specs/location-management/spec.md` | 描述地点管理、政策字段与字段语义 | 管理行为不变；复用现有 8 列，checked, no requirement change |
| `openspec/specs/web-app-shell/spec.md` | 顶部 Tab 与路由同步 | MODIFIED：`/attractions` 归入“城市浏览”Tab；不新增 Tab |
| `openspec/changes/destination-selection/` | 仍在 change 中，提供 `/cities` 与选定状态 | 依赖其实现；本需求只增加进入景点页的 UI 入口；P2 delta 需避免与其 web-app-shell delta 冲突 |
| US-17 / US-08 / US-12 | 后续餐厅/酒店/食宿规则展示 | 复用现有政策字段与展示语义；不新增枚举 |
| US-48 查看行程单 | AC-2 的行程内展示 | Out of Scope；详情组件按可复用设计 |
| US-04 当地养犬政策 | 城市级政策（`city_pet_policy`） | 独立数据与展示；不与地点规则继承/合并 |
| V9 / V11 既有列 | `allowed_pet_types`、`max_single_pet_shoulder_height_cm` | 只读展示，有值才显示 |
| `paws-page` / 宠物档案 | 无直接关系 | checked, no impact |
| 管理员地点列表 | 不展示政策 | 不变；公开列表独立 |

## 4. 通知 / 展示契约

不涉及通知。

| 展示面 | 触发 | 受众 | 内容 / 字段 | 通道 |
|---|---|---|---|---|
| `/cities` 选定城市 | 选定目的地后 | 登录用户 | 自动进入 `/attractions`；返回 `/cities` 时仍显示已选定提示；不内嵌景点列表或入口按钮 | Web 跳转 |
| 顶部导航 | 任意受保护页面 | 登录用户 | “景区浏览”Tab；打开 `/attractions` 或详情时选中 | 顶部导航 |
| `/attractions` 列表 | 已选目的地 | 登录用户 | 城市名、景点名、地址、三态 badge、全部景点开关、分页 | Web 列表 |
| `/attractions` 空态 | 无目的地 / 无景点 / 无友好景点 | 登录用户 | 对应的可读提示与入口 | Web 空态 |
| `/attractions/$poiId` 详情 | 点击景点 | 登录用户 | 名称、类型、地址、三态状态、非空政策字段 | Web 详情 |
| 详情空态 | 全部政策字段为空 | 登录用户 | “暂无携宠政策” | Web 详情 |
| 顶栏 | 任意受保护页面 | 登录用户 | `/attractions` 与 `/attractions/$poiId` 时“景区浏览”Tab 选中 | 顶部导航 |

列表 badge 三态：

- `maxPetsPerPerson >= 1` → “宠物友好”
- `maxPetsPerPerson = 0` → “禁止携带”
- `maxPetsPerPerson IS NULL` → “未配置”

字段展示标签：

- 允许宠物类型：猫 / 狗 / 猫和狗
- 每位游客最多携带：`X 只 / 人`
- 单只宠物最大体重：`X kg`
- 单只宠物最大肩高：`X cm`
- 牵引绳要求：需要 / 不需要
- 疫苗证明要求：需要 / 不需要
- 额外费用：`X 元 / 只 / 次`
- 预约要求：需要 / 不需要

## 5. DoR 9–12 自检

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 9 | Data contract decided | Pass | 本文 1.1–1.5；无新增列 |
| 10 | Boundary enumerated | Pass | 本文第 2 节覆盖 0/NULL/>=1、切换、城市、错误 |
| 11 | Cross-REQ aligned | Pass | 本文第 3 节；无未收敛 ✗ |
| 12 | Notification / display contract | Pass | 本文第 4 节；无通知，展示面已列明 |

## 6. Revision 2 决策与残余项

| status | question | resolution |
|---|---|---|
| resolved | 公开页数据来源？ | `pawtrip_location` 等数据库表，不调用高德 |
| resolved | 宠物友好门槛？ | `maxPetsPerPerson >= 1` |
| resolved | 是否保留三档 `entry_policy`/`entry_note`？ | 移除，不新增列/迁移 |
| resolved | 默认列表与切换？ | 默认仅 `maxPetsPerPerson >= 1`；可切换全部 |
| resolved | 详情展示？ | 现有 8 个非空政策字段；全空显示“暂无携宠政策” |
| resolved | 景点页入口？ | Revision 3：新增顶层“景区浏览”Tab；`/cities` 选定城市后自动进入；城市浏览页不放入口/列表 |
| deferred | 列表每页条数与分页控件形态？ | 默认 20，沿用现有分页形状，P3 细化 |
| deferred | 省级叶节点的匹配实现细节？ | 复用现有 `ValidatedRegion` 逻辑，P3 按代码落地 |
| risk | 未维护 `maxPetsPerPerson` 的地点 | 默认列表不展示；数据补齐前列表可能为空；由现有管理弹窗维护 |
