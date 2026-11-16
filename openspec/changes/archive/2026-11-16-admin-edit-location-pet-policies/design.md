# Design

## Context

`pawtrip_location` 已有 6 个可空政策列（V7），`PawtripLocation` 已提供 getter 与 `updatePetPolicies`，但管理 API 只处理游玩时间，两个地点弹窗也只展示游玩时间。管理员地点页面、分页与详情读取已存在，本设计在其上扩展。需求见 [proposal.md](proposal.md) 与 [specs/location-management/spec.md](specs/location-management/spec.md)。

## Goals / Non-Goals

**Goals:**

- 在不新增数据库迁移的前提下，把 6 项政策接入现有管理 API 与两个现有弹窗。
- 用可选的 `petPolicies` 对象明确“未提交不改”与“提交即整体替换”的更新语义。
- 用统一的前端表单与转换逻辑保证三态布尔、空值、元/分换算和校验一致。

**Non-Goals:**

- 行政区政策维护、公共页面/行程展示、列表政策列或筛选。
- 修改游玩时间、照片、POI 基础信息或认证契约。
- 引入新的表单库、状态库或后端依赖。

## Decisions

### D1：请求与响应都使用 `petPolicies` 对象

管理 API 的创建与更新请求使用可选 `petPolicies` 对象；地点详情响应始终返回 `petPolicies` 对象（内部 6 个字段可空）。理由是对象能把政策与游玩时间等字段分组，避免详情响应平铺 6 个字段，也让前端回填有稳定的命名空间。

- `POST`：`petPolicies` 缺省或为 `null` 时 6 项保存为 `NULL`。
- `PATCH`：`petPolicies` 缺省或为 `null` 时政策不变；出现对象时以对象内容整体替换 6 项，字段 `null` 表示清空。要清空全部政策，应发送包含 6 个 `null` 的对象，而不是省略对象。
- 响应：`GET /api/admin/locations/{poiId}` 返回 `petPolicies`，未配置字段为 `null`；列表响应不变。

备选方案：平铺 6 个请求字段实现最简单，但任何只提交游玩时间的 PATCH 都会把政策清空；逐字段 presence 检测最灵活，但需要额外的 JSON 存在性处理。当前只有一个管理端客户端，可选对象在安全性与实现成本之间更平衡。

### D2：复用实体既有字段，写入合并为一次事务

- 创建：构造 `PawtripLocation` 后调用既有 `updatePetPolicies`，不修改实体与数据库迁移。
- 更新：扩展 `LocationWriteService` 的更新方法，一次事务内写入游玩时间与政策；仅当请求包含 `petPolicies` 时调用 `updatePetPolicies`，保证“缺省不改”。
- 校验：在应用服务写入前完成。数量为非负整数；体重与费用非负；体重通过 `BigDecimal.valueOf(value).scale() <= 2` 限制两位小数；非法值沿用现有 400 invalid-query，且不产生部分写入。

备选方案：在实体构造函数中增加 6 个参数，会拉长已有构造函数并影响多处测试；先构造再调用 `updatePetPolicies` 改动面更小。用 `Double` 直接判断小数位不可靠，`BigDecimal.valueOf` 基于数值的十进制表示，足以覆盖接口校验。

### D3：两个弹窗共享政策表单与转换逻辑

新增受控的 `PetPolicyFields` 组件与 `pet-policy` 转换辅助函数，供 `AmapCandidateEditor` 与 `SavedLocationEditor` 共用：

- 数值输入以字符串保存，提交时统一解析；数量要求整数，体重与费用最多两位小数。
- 额外费用按元输入，使用字符串拆分整数与小数部分换算为分，避免浮点误差；回填时由分转元。
- 布尔字段使用 `unset` / `required` / `not-required` 三态，映射为 `null` / `true` / `false`。
- 空字符串映射为 `null`；`0` 保留为明确零值。
- 校验保持现有单条错误消息模式：返回首个错误及对应字段，界面显示可读文案并标记该字段；不做跨字段业务规则。

`AmapCandidateEditor` 在游玩时间区块之后增加“携宠政策”区块，所有类型都显示；`SavedLocationEditor` 改为单表单始终渲染，游玩时间仅景点显示，政策区块与关闭/保存操作对所有类型可用。为容纳两列布局，创建弹窗宽度可放宽到 `max-w-2xl`；现有 `DialogContent` 已具备最大高度与滚动。

备选方案：两个弹窗各自维护一份状态，代码重复且容易在单位与校验上漂移；按类型拆两个表单会增加同弹窗内的条件结构。共享受控组件更符合当前规模。

### D4：字段与单位映射

| 界面标签 | API 字段 | 单位 / 形态 |
|---|---|---|
| 每位游客最多携带宠物数（只） | `maxPetsPerPerson` | 非负整数 |
| 单只宠物最大体重（kg） | `maxSinglePetWeightKg` | 非负数，最多两位小数 |
| 牵引绳要求 | `leashRequired` | `null` / `true` / `false` |
| 疫苗证明要求 | `vaccinationProofRequired` | `null` / `true` / `false` |
| 额外费用（元 / 只 / 次） | `extraFeeCents` | 表单元、最多两位小数；API 与数据库为分 |
| 预约要求 | `reservationRequired` | `null` / `true` / `false` |

## Risks / Trade-offs

- [更新语义误用] → `petPolicies` 缺省或为 `null` 时不改政策；前端始终提交完整对象，后端测试覆盖“缺省不改”。
- [小数精度] → 费用用字符串换算为分；体重用 `BigDecimal.valueOf` 校验两位小数；超出直接拒绝，不静默舍入。
- [非景点表单结构调整] → `SavedLocationEditor` 从“仅景点渲染表单”改为“单表单始终渲染”，可能影响既有景点保存；用现有游玩时间 e2e 回归。
- [响应结构变更] → 详情新增 `petPolicies` 对象，前端类型与 e2e mock 必须同步；列表不变，影响面受控。
- [弹窗高度] → 6 个新字段增加高度；依赖现有 `max-h` 与滚动，必要时放宽创建弹窗宽度。
- [部署顺序] → 建议先发布后端再发布前端；旧前端不发送 `petPolicies` 时政策保持不变。

## Migration Plan

1. 发布后端：新增请求/响应字段与服务校验，保持旧请求兼容。
2. 发布前端：新增两个弹窗的政策编辑与类型层。
3. 回滚：回滚前后端代码即可；V7 列与已有政策数据保留，不需要数据库回滚或数据修复。

## Open Questions

无。PATCH 语义、体重精度、非景点表单结构与列表范围已在 Pre-SDD 阶段确认。
