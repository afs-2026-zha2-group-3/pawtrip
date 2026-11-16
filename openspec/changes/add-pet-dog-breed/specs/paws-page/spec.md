## MODIFIED Requirements

### Requirement: 整卡打开详情并支持弹窗内编辑

宠物卡片 SHALL 整卡可点击，并支持 Tab 聚焦后按 Enter 或 Space 打开详情弹窗。详情弹窗 SHALL 展示照片、名字、类型、品种（狗）、体重、肩高、牵引绳与免疫证明，并 SHALL 提供编辑入口在同一弹窗内切换到编辑表单。保存 SHALL 调用 `PUT /api/pets/{id}`，成功后更新弹窗展示并使宠物列表失效；取消编辑 SHALL 回到查看状态且不发送请求。

#### Scenario: 点击整卡打开详情

- **GIVEN** 宠物画廊已展示宠物卡片
- **WHEN** 用户点击任意卡片区域
- **THEN** 打开该宠物的详情弹窗
- **AND** 弹窗展示该宠物的全部可查看字段

#### Scenario: 键盘打开详情

- **GIVEN** 用户通过 Tab 将焦点移到宠物卡片
- **WHEN** 用户按下 Enter 或 Space
- **THEN** 打开该宠物的详情弹窗

#### Scenario: 编辑并保存

- **GIVEN** 详情弹窗处于查看状态
- **WHEN** 用户进入编辑、修改名字与体重并提交
- **THEN** 请求 `PUT /api/pets/{id}` 且请求体包含全部可写字段
- **AND** 保存成功后弹窗展示更新后的字段
- **AND** 宠物列表重新加载并显示更新后的数据

#### Scenario: 取消编辑

- **GIVEN** 详情弹窗处于编辑状态且字段已被修改
- **WHEN** 用户取消编辑
- **THEN** 弹窗回到查看状态并展示修改前的数据
- **AND** 不发送更新请求

#### Scenario: 保存失败

- **GIVEN** 更新请求返回校验错误、网络错误或服务端错误
- **WHEN** 用户提交编辑
- **THEN** 弹窗保持编辑状态并展示可读错误提示
- **AND** 已填写的字段不被清空
- **AND** 宠物列表保持不变

#### Scenario: 详情展示狗品种

- **GIVEN** 狗已选择品种
- **WHEN** 用户打开该狗的详情弹窗
- **THEN** 弹窗展示品种名称
- **AND** 猫的详情不展示品种行

### Requirement: 宠物表单校验与错误提示

宠物表单 SHALL 在提交前校验：名字 trim 后非空、类型为 `CAT` 或 `DOG`、体重与肩高为大于 0 的有限数值；类型为 `DOG` 时 MUST 选择品种，类型为 `CAT` 时 MUST NOT 提交品种。校验失败 MUST NOT 发送请求，并 SHALL 展示可读的字段错误。服务端返回校验错误时 SHALL 保留输入并展示通用保存失败提示。

#### Scenario: 名字为空

- **GIVEN** 用户将名字留空或仅输入空白字符
- **WHEN** 用户提交表单
- **THEN** 不发送请求
- **AND** 展示名字必填错误

#### Scenario: 体重或肩高非正数

- **GIVEN** 用户将体重或肩高填写为 0、负数或非数字
- **WHEN** 用户提交表单
- **THEN** 不发送请求
- **AND** 展示对应字段必须大于 0 的错误

#### Scenario: 狗未选择品种

- **GIVEN** 用户将类型选为狗但未选择品种
- **WHEN** 用户提交表单
- **THEN** 不发送请求
- **AND** 展示请选择品种错误

#### Scenario: 切换为猫清除品种

- **GIVEN** 用户已为狗选择品种
- **WHEN** 用户将类型切换为猫
- **THEN** 品种选择被清除且不再显示
- **AND** 提交时 `dogBreedId` 为 `null`

#### Scenario: 服务端校验失败

- **GIVEN** 前端校验通过但服务端返回 `400`
- **WHEN** 表单提交失败
- **THEN** 弹窗保持打开且保留输入
- **AND** 展示通用保存失败提示

## ADDED Requirements

### Requirement: 狗的品种选择与接口契约

宠物接口 SHALL 支持 `dogBreedId`（请求）与 `dogBreed`（响应）。类型为 `DOG` 时 `dogBreedId` MUST 指向 `dog_breed` 中存在的品种且不可为空；类型为 `CAT` 时 MUST NOT 携带品种。前端品种选项 SHALL 来自 `GET /api/dog-breeds` 并按名称升序展示；已存在但尚无品种的狗 SHALL 可被读取，并在编辑保存前要求补选品种。

#### Scenario: 创建狗时选择品种

- **GIVEN** 用户创建一只狗并选择名录中的品种
- **WHEN** 用户提交创建
- **THEN** 请求体包含非空 `dogBreedId`
- **AND** 响应包含对应的 `dogBreed` 对象（`id`、`name`、`officialAggressive`）

#### Scenario: 更新狗的品种

- **GIVEN** 一只狗已有品种
- **WHEN** 用户改为另一个品种并保存
- **THEN** 更新请求包含新的 `dogBreedId`
- **AND** 响应与详情展示新的品种名称

#### Scenario: 狗缺少品种被拒绝

- **GIVEN** 创建或更新请求的类型为 `DOG` 且 `dogBreedId` 为空
- **WHEN** 服务端处理请求
- **THEN** 返回 `400` 且 `code=VALIDATION_ERROR`
- **AND** 不写入或修改宠物数据

#### Scenario: 未知品种被拒绝

- **GIVEN** 请求携带不存在的 `dogBreedId`
- **WHEN** 服务端处理请求
- **THEN** 返回 `400` 且 `code=VALIDATION_ERROR`

#### Scenario: 猫携带品种被拒绝

- **GIVEN** 创建或更新请求的类型为 `CAT` 且携带 `dogBreedId`
- **WHEN** 服务端处理请求
- **THEN** 返回 `400` 且 `code=VALIDATION_ERROR`

#### Scenario: 品种选项来自名录

- **GIVEN** 用户在表单中将类型选为狗
- **WHEN** 品种下拉加载
- **THEN** 选项来自 `GET /api/dog-breeds`
- **AND** 按品种名称升序展示

#### Scenario: 历史无品种的狗

- **GIVEN** 数据库中已存在未记录品种的狗
- **WHEN** 用户查看列表与详情
- **THEN** 该狗仍可正常读取
- **AND** 详情将品种显示为未设置
- **AND** 用户编辑保存前必须补选品种