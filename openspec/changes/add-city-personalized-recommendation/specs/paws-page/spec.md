# Spec Delta — paws-page

## MODIFIED Requirements

### Requirement: 整卡打开详情并支持弹窗内编辑

宠物卡片 SHALL 整卡可点击，并支持 Tab 聚焦后按 Enter 或 Space 打开详情弹窗。详情弹窗 SHALL 展示照片、名字、类型、品种（狗）、体重、肩高、牵引绳、免疫证明、喜好与性格，并 SHALL 提供编辑入口在同一弹窗内切换到编辑表单。保存 SHALL 调用 `PUT /api/pets/{id}`，成功后更新弹窗展示并使宠物列表失效；取消编辑 SHALL 回到查看状态且不发送请求。

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

#### Scenario: 详情展示喜好与性格

- **GIVEN** 宠物已保存喜好「游泳」「草地奔跑」与性格「活泼好动」
- **WHEN** 用户打开该宠物的详情弹窗
- **THEN** 弹窗展示「喜好：游泳、草地奔跑」与「性格：活泼好动」

#### Scenario: 详情未设置喜好与性格

- **GIVEN** 宠物未填写喜好与性格（含迁移前旧档案）
- **WHEN** 用户打开该宠物的详情弹窗
- **THEN** 喜好与性格均显示「未设置」

## ADDED Requirements

### Requirement: 宠物喜好与性格维护

宠物创建与编辑表单 SHALL 提供「喜好」多选（固定 5 项：游泳、爬山、草地奔跑、城市漫步、玩雪）与「性格」单选（固定 3 项：活泼好动、温和平静、胆小敏感，含「未设置」项），两者均可不填且 MUST NOT 成为必填校验。宠物接口 SHALL 支持请求与响应的 `preferences`（键数组，可省略或空数组）与 `personality`（单键或 null）；键 SHALL 使用固定词表（喜好 SWIMMING/HIKING/GRASS_RUNNING/CITY_WALKING/SNOW_PLAY，性格 ENERGETIC/CALM/TIMID）。服务端 SHALL 校验枚举合法性，非法键 MUST 返回 400 且 `code=VALIDATION_ERROR`、不落库。保存 SHALL 持久化并在编辑时回显；未填与旧档案 SHALL 视为未设置。既有必填校验（名字/类型/犬种/体重/肩高）MUST 保持不变。

#### Scenario: 创建时勾选喜好并选择性格

- **GIVEN** 用户打开添加宠物弹窗
- **WHEN** 用户勾选喜好「游泳」「草地奔跑」、选择性格「活泼好动」，其余字段合法并提交
- **THEN** 请求 `POST /api/pets` 携带对应喜好键数组与性格键
- **AND** 创建成功且响应回显所选值

#### Scenario: 编辑回显与修改

- **GIVEN** 宠物已保存喜好与性格
- **WHEN** 用户打开编辑表单
- **THEN** 已选喜好呈勾选态、性格呈选中态
- **AND** 修改后保存，详情与列表展示更新后的值

#### Scenario: 不填喜好与性格也可保存

- **GIVEN** 用户未勾选任何喜好且性格保持「未设置」
- **WHEN** 其余字段合法并提交创建或更新
- **THEN** 保存成功，两字段为未设置
- **AND** 不展示喜好或性格的必填错误

#### Scenario: 清空已保存的喜好与性格

- **GIVEN** 宠物已保存喜好与性格
- **WHEN** 用户取消全部喜好勾选、性格选回「未设置」并保存
- **THEN** 更新请求携带空喜好数组与 null 性格
- **AND** 保存后详情显示「未设置」

#### Scenario: 未知喜好键被拒绝

- **GIVEN** 创建或更新请求携带词表之外的喜好键
- **WHEN** 服务端处理请求
- **THEN** 返回 400 且 `code=VALIDATION_ERROR`
- **AND** 不写入或修改宠物数据

#### Scenario: 未知性格键被拒绝

- **GIVEN** 创建或更新请求携带词表之外的性格键
- **WHEN** 服务端处理请求
- **THEN** 返回 400 且 `code=VALIDATION_ERROR`
- **AND** 不写入或修改宠物数据

#### Scenario: 旧客户端不传新字段仍合法

- **GIVEN** 创建或更新请求不包含 `preferences` 与 `personality`
- **WHEN** 其余字段合法
- **THEN** 保存成功，两字段为未设置

#### Scenario: 旧档案读取兼容

- **GIVEN** 数据库存在迁移前创建的宠物
- **WHEN** 用户读取列表与详情
- **THEN** 该宠物正常读取，喜好与性格为未设置
- **AND** 其余字段展示不变