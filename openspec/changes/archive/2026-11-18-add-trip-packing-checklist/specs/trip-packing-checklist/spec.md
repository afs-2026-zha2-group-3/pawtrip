# Spec Delta

## Purpose

为每个已确认行程生成并持久化一份携宠物品携带清单，按宠物档案与行程场景维护模板项，并记录勾选态与打包进度，供行程单页面使用。

## ADDED Requirements

### Requirement: 行程归属与清单生成

系统 SHALL 为当前用户某个行程持久化一份携带清单，同一行程 MUST 最多一份。生成与读取 MUST 只允许用户访问本人行程；非本人行程一律视为不存在。首次生成 SHALL 按当前宠物档案与行程场景创建模板物品；重复生成 MUST 返回既有清单，且 MUST NOT 重置自定义物品、数量覆盖或勾选态。删除行程时清单与清单项 SHALL 级联删除。

#### Scenario: 首次生成清单

- **GIVEN** 用户拥有一个已确认行程且该行程关联了宠物档案
- **WHEN** 用户生成该行程的携带清单
- **THEN** 返回 `201` 与按档案/场景映射的模板物品
- **AND** 同一行程再次读取仍返回同一份清单

#### Scenario: 重复生成不重置

- **GIVEN** 清单已生成且用户已新增自定义物品、修改数量并勾选部分物品
- **WHEN** 用户再次生成同一行程的清单
- **THEN** 清单不产生重复物品
- **AND** 自定义物品、数量覆盖与勾选态保持不变

#### Scenario: 访问他人行程

- **GIVEN** 用户 A 的行程属于用户 A
- **WHEN** 用户 B 生成或读取该行程的清单
- **THEN** 返回 `404` 与 `code=TRIP_NOT_FOUND`
- **AND** 不创建或修改清单

#### Scenario: 未登录访问

- **GIVEN** 请求没有有效登录会话
- **WHEN** 请求任一携带清单接口
- **THEN** 返回 `401` 与 `code=UNAUTHENTICATED`

#### Scenario: 删除行程级联删除清单

- **GIVEN** 行程已生成携带清单
- **WHEN** 用户删除该行程
- **THEN** 清单与清单项一并删除
- **AND** 不残留孤立物品

### Requirement: 模板与场景映射

清单 MUST 由人工维护的静态种子模板按宠物档案与行程场景映射生成，MUST NOT 调用 AI 或外部服务。物品分类 MUST 属于「证件 / 饮食 / 出行 / 健康 / 清洁」五类。宠物类型 SHALL 决定基础用品；体重与肩高 SHALL 决定航空箱与牵引用具尺寸档；`hasLeash` 为真 SHALL 生成牵引绳物品；`hasVaccinationProof` 为真或大交通为飞机 SHALL 生成免疫/检疫证明物品；大交通为飞机 SHALL 生成航空箱物品；主粮份数 MUST 等于总天数 × 每日份量（每日固定 2 份）。

#### Scenario: 猫的基础清单

- **GIVEN** 行程关联一只 4.5kg 的猫、大交通为高铁、总天数 3
- **WHEN** 生成清单
- **THEN** 包含猫用运输包（S 码）
- **AND** 主粮数量为 6
- **AND** 不包含航空箱与检疫/免疫证明物品

#### Scenario: 狗与飞机场景

- **GIVEN** 行程关联一只 18kg 的狗、大交通为飞机、总天数 5
- **WHEN** 生成清单
- **THEN** 包含航空箱（L 码）
- **AND** 包含检疫/免疫证明
- **AND** 主粮数量为 10

#### Scenario: 牵引绳按档案生成

- **GIVEN** 宠物档案 `hasLeash` 为真
- **WHEN** 生成清单
- **THEN** 包含对应尺寸档的牵引绳物品
- **AND** 档案 `hasLeash` 为假时不生成牵引绳物品

#### Scenario: 免疫证明按档案生成

- **GIVEN** 宠物档案 `hasVaccinationProof` 为真且大交通不是飞机
- **WHEN** 生成清单
- **THEN** 包含疫苗证明物品

#### Scenario: 物品分类固定

- **GIVEN** 清单已生成
- **WHEN** 用户查看清单
- **THEN** 每个物品只属于「证件 / 饮食 / 出行 / 健康 / 清洁」之一
- **AND** 不出现其他分类

### Requirement: 读取时同步档案与行程

每次读取已生成清单时，系统 SHALL 按当前宠物档案与当前行程重新计算模板物品并合并：新适用的模板物品 SHALL 补入且默认未勾选；不再适用的模板物品 SHALL 隐藏；仍适用的模板物品 SHALL 按模板更新名称、分类与数量。自定义物品、用户手动修改过的数量与已勾选状态 MUST 保留；用户显式删除的模板物品 MUST NOT 因同步而复活。同步 MUST NOT 重置任何已有勾选态。

#### Scenario: 档案变更更新模板项

- **GIVEN** 清单已生成且用户已勾选部分物品
- **WHEN** 宠物体重变化导致航空箱尺寸档变化后用户重新读取清单
- **THEN** 航空箱物品更新为新尺寸档
- **AND** 仍存在的物品勾选态保持不变

#### Scenario: 行程天数变更更新粮食

- **GIVEN** 清单已生成且主粮数量未被用户手动修改
- **WHEN** 行程总天数从 3 改为 5 后用户重新读取清单
- **THEN** 主粮数量更新为 10
- **AND** 既有勾选态保持不变

#### Scenario: 大交通变更增减场景物品

- **GIVEN** 清单已生成且大交通为高铁
- **WHEN** 大交通改为飞机后用户重新读取清单
- **THEN** 清单补入航空箱与检疫/免疫证明且默认未勾选
- **AND** 大交通再改回高铁后这些场景物品不再出现在清单中

#### Scenario: 自定义项与手动数量保留

- **GIVEN** 清单包含用户新增的自定义物品，且用户手动修改过某个模板物品的数量
- **WHEN** 档案或行程变更后用户重新读取清单
- **THEN** 自定义物品仍存在
- **AND** 手动修改过的数量不被模板覆盖

#### Scenario: 删除的模板项不复活

- **GIVEN** 用户删除了某个模板物品
- **WHEN** 档案或行程变更后用户重新读取清单
- **THEN** 该模板物品仍不出现在清单中
- **AND** 进度不包含该物品

### Requirement: 自定义物品增删改

用户 SHALL 能在清单中新增自定义物品、修改物品数量与勾选态并删除物品；自定义物品还 SHALL 能修改名称与分类。模板物品的名称与分类 MUST 随模板维护，用户仅可修改其数量与勾选态。所有变更 MUST 服务端持久化。新增物品 MUST 校验名称 trim 后非空、分类属于固定五类、数量为 1–99 的整数；非法请求 MUST 返回 `400` 且 `code=VALIDATION_ERROR`。删除 MUST 使物品不再出现在清单与进度中。自定义物品与模板物品 MUST 合并持久化，刷新页面或换设备同账号登录后结果一致。

#### Scenario: 新增自定义物品

- **GIVEN** 清单已生成
- **WHEN** 用户新增名称「宠物雨衣」、分类「出行」、数量 1 的物品
- **THEN** 返回 `201` 且清单包含该物品
- **AND** 该物品来源为自定义

#### Scenario: 修改数量并持久化

- **GIVEN** 清单包含一个数量为 1 的物品
- **WHEN** 用户将数量改为 3 并刷新页面
- **THEN** 数量仍为 3
- **AND** 换设备以同账号登录后数量仍为 3

#### Scenario: 删除物品

- **GIVEN** 清单包含一个自定义物品
- **WHEN** 用户删除该物品
- **THEN** 返回 `204`
- **AND** 该物品不再出现在清单与进度中

#### Scenario: 非法新增请求

- **GIVEN** 用户新增物品时名称为空白、分类不在固定五类或数量为 0
- **WHEN** 提交请求
- **THEN** 返回 `400` 与 `code=VALIDATION_ERROR`
- **AND** 清单不新增物品

### Requirement: 勾选与打包进度

清单 SHALL 暴露每个物品的勾选态 `checked`。进度 MUST 按可见物品行数计算：已勾选行数 / 总行数；新增或删除物品 MUST 同步改变分母；全部物品勾选时进度 MUST 为 100%；总行数为 0 时进度 MUST 为 0%。勾选或取消勾选 MUST 服务端持久化，刷新与换设备同账号登录后保留。

#### Scenario: 勾选与取消勾选

- **GIVEN** 清单共 4 个物品且均未勾选
- **WHEN** 用户勾选其中 1 个
- **THEN** 进度为 1/4
- **AND** 取消勾选后进度为 0/4

#### Scenario: 增删改变分母

- **GIVEN** 清单共 4 个物品且其中 1 个已勾选
- **WHEN** 用户新增 1 个物品
- **THEN** 进度为 1/5
- **AND** 删除一个未勾选物品后进度为 1/4

#### Scenario: 全部完成

- **GIVEN** 清单所有可见物品均已勾选
- **WHEN** 用户查看进度
- **THEN** 进度为 100%
- **AND** 页面显示完成态

#### Scenario: 跨设备保留勾选态

- **GIVEN** 用户已勾选部分物品
- **WHEN** 用户换设备以同账号登录并打开清单
- **THEN** 勾选状态与进度保留

### Requirement: 未生成与无档案降级

未生成清单时读取 MUST 返回 `404` 与 `code=PACKING_CHECKLIST_NOT_FOUND`，系统 MUST NOT 在读取时自动生成。当前行程关联的宠物档案不存在时，生成 MUST 返回 `409` 与 `code=PET_PROFILE_REQUIRED` 且不创建清单。页面 MUST 按这两种状态分别引导先生成清单或先创建宠物档案。

#### Scenario: 尚未生成清单

- **GIVEN** 行程存在但尚未生成携带清单
- **WHEN** 用户读取清单
- **THEN** 返回 `404` 与 `code=PACKING_CHECKLIST_NOT_FOUND`
- **AND** 不创建清单

#### Scenario: 无宠物档案

- **GIVEN** 行程关联的宠物档案已不存在
- **WHEN** 用户生成清单
- **THEN** 返回 `409` 与 `code=PET_PROFILE_REQUIRED`
- **AND** 不创建清单

### Requirement: 清单项契约

清单响应 SHALL 包含行程标识、当前大交通、当前总天数、生成/更新时间、物品数组与进度。每个物品 MUST 包含 `id`、`category`、`name`、`quantity`、`checked`、`source`（`TEMPLATE` 或 `CUSTOM`）与可空 `templateKey`；模板物品 MUST 具有稳定的 `templateKey`，自定义物品的 `templateKey` MUST 为 `null`。物品 SHALL 按固定分类顺序与稳定排序返回。

#### Scenario: 响应包含物品契约字段

- **GIVEN** 清单已生成
- **WHEN** 用户读取清单
- **THEN** 每个物品包含 `id`、`category`、`name`、`quantity`、`checked`、`source` 与 `templateKey`
- **AND** 模板物品的 `templateKey` 非空

#### Scenario: 自定义物品无模板键

- **GIVEN** 用户新增一个自定义物品
- **WHEN** 用户读取清单
- **THEN** 该物品 `source` 为 `CUSTOM`
- **AND** `templateKey` 为 `null`

#### Scenario: 响应包含进度

- **GIVEN** 清单共 3 个物品且 2 个已勾选
- **WHEN** 用户读取清单
- **THEN** 响应进度为已勾选 2、总数 3
