## Context

当前 schema 由 Flyway 管理，SQLite 数据表包括 `administrative_region` 与 `pawtrip_location`；持久化模型分别为 `AdministrativeRegion` 与 `PawtripLocation`。行政区表同时存省级和城市级记录，直辖市以省级叶节点表示。地点实体已有独立的 `regionCode`，但本变更不建立政策继承关系。

现有数据库记录没有宠物规则值，新增字段必须允许历史数据保持未知。此次范围限定为数据库迁移与 JPA 持久化模型，不扩展 Controller、API DTO 或前端界面。

## Goals / Non-Goals

**Goals:**

- 在行政区和 Pawtrip 地点表各增加六项独立、可空的宠物政策字段。
- 保持已有数据与现有查询/API 行为不变。
- 以明确单位和空值语义表示数量、体重、要求及费用。

**Non-Goals:**

- 不从行政区向地点继承或复制政策。
- 不新增或修改 API、管理界面及请求/响应契约。
- 不为历史记录推断或回填宠物政策值。

## Decisions

### 两张现有表分别存储政策

在 `administrative_region` 与 `pawtrip_location` 各添加以下列：

| 列名 | SQLite 类型 | JPA 类型 | 语义 |
| --- | --- | --- | --- |
| `max_pets_per_person` | `INTEGER` | `Integer` | 每位游客最多携带的宠物只数 |
| `max_single_pet_weight_kg` | `REAL` | `Double` | 单只宠物最大体重，kg，可为小数 |
| `leash_required` | `INTEGER` | `Boolean` | 是否要求牵引绳 |
| `vaccination_proof_required` | `INTEGER` | `Boolean` | 是否要求疫苗证明 |
| `extra_fee_cents` | `INTEGER` | `Long` | 每只宠物每次到访的人民币费用，以分存储 |
| `reservation_required` | `INTEGER` | `Boolean` | 是否需要预约 |

包装类型保留 `NULL`，表示未知或未配置；布尔值 `false` 表示明确不要求。数量、体重和费用使用非负值约束；布尔列限制为 `NULL`、`0` 或 `1`。费用以整数分存储，避免浮点金额误差；人民币单位和每只宠物每次到访的计费口径来自已确认需求。

采用两张表上的独立列，而不引入共用规则表或关联表：这符合数据需按行政区、地点各自持有且不继承的要求，也避免增加本次范围外的关联模型。

### 使用后续 Flyway 迁移并保留历史未知值

新增 `V7` 迁移，通过向两张表添加可空列扩展 schema。不给字段设置默认值或回填语句，因此已有行得到 `NULL`，原有记录和其他列不需重建。JPA 模型增加与列对应的可空属性；不改现有读取/写入 API。

为 `pawtrip_location` 的数量、体重和费用增加非负约束，为布尔列增加 `NULL`/`0`/`1` 约束。所有规则值均允许 `NULL`，以兼容尚未采集信息的历史记录。

### 以迁移测试验证数据兼容性与约束

扩展现有 schema migration 测试，覆盖从 V6 升级后的列存在性、旧记录的 `NULL` 值、允许空值、可存储小数体重、布尔取值范围、非负数约束及两表字段独立性。保留现有迁移链和查询行为测试。

## Risks / Trade-offs

- [API 尚未暴露新字段] → 本次范围已限定为 schema 与持久化模型；后续 API/界面变更需明确沿用 `NULL`、布尔和费用单位语义。
- [行政区与地点存在重复字段] → 重复是有意的，因为两层规则独立且不继承；未来如引入继承语义，需要单独设计而不是依赖空值隐式回退。
- [费用固定为人民币] → 以整数分存储满足当前需求；若将来支持多币种，需新增币种语义和迁移，而非重解释现有数值。

## Migration Plan

1. 添加 V7 Flyway 迁移，为两张表增加六项可空列及值域约束。
2. 扩展两个 JPA 实体，使模型映射新增列，保持既有调用端和 API 不变。
3. 运行迁移测试验证旧数据保留、默认 `NULL` 及约束行为。
4. 回滚时由 Flyway 的目标版本控制恢复旧 schema；不执行数据回填或删除旧业务数据。

## Open Questions

无。字段业务含义、NULL 语义、城市记录范围、地点与行政区的独立关系及本次范围均已确认。
