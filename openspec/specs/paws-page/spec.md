# paws-page Specification

## Purpose

定义受登录保护的 `/paws` 宠物管理页面：以 Tilted Card 画廊展示当前用户的宠物，支持整卡查看详情、弹窗内编辑、新增、删除与照片管理，并保持应用外壳与 `Paws` Tab 选中。

## Requirements

### Requirement: Paws 页面展示当前用户的宠物画廊

应用 SHALL 在受登录保护的 `/paws` 路由展示当前用户自己的宠物。页面 SHALL 从 `GET /api/pets` 读取宠物，并以 Tilted Card 卡片网格展示；卡片顺序 MUST 与接口返回的 id 升序一致。卡片右下角标签 SHALL 在狗有品种时优先显示品种名称，否则显示猫/狗类型。页面 SHALL 保留应用外壳与 `Paws` Tab 选中状态。

#### Scenario: 从 Home 切换到 Paws

- **GIVEN** 已登录用户位于 `/`
- **WHEN** 用户选中 `Paws` Tab
- **THEN** 浏览器地址为 `/paws`
- **AND** 页面显示顶部导航且 `Paws` Tab 处于选中状态
- **AND** 页面请求 `GET /api/pets` 并展示返回的宠物卡片

#### Scenario: 直接访问 Paws

- **GIVEN** 已登录用户在地址栏输入 `/paws`
- **WHEN** 页面渲染
- **THEN** 页面正常显示应用外壳与宠物内容
- **AND** 不出现 404 页面

#### Scenario: 未登录访问 Paws

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访问 `/paws`
- **THEN** 浏览器地址变为 `/login`
- **AND** 不展示宠物内容或添加宠物入口

#### Scenario: 只展示本人宠物

- **GIVEN** 当前用户和其他用户都拥有宠物
- **WHEN** 页面加载宠物列表
- **THEN** 仅展示当前用户的宠物
- **AND** 不展示其他用户的宠物

#### Scenario: 卡片内容与顺序

- **GIVEN** `GET /api/pets` 按 id 升序返回多只宠物
- **WHEN** 页面渲染宠物画廊
- **THEN** 每张卡片展示宠物照片（无照片时展示占位样式）、名字与右下角标签
- **AND** 狗的标签优先显示品种名称，无品种时显示“狗”
- **AND** 猫的标签显示“猫”
- **AND** 卡片顺序与接口返回顺序一致

#### Scenario: 空列表

- **GIVEN** 当前用户没有任何宠物
- **WHEN** 宠物列表加载成功
- **THEN** 页面展示空状态提示与添加宠物入口
- **AND** 不展示任何宠物卡片

#### Scenario: 列表加载中

- **GIVEN** 宠物列表请求尚未完成
- **WHEN** 页面渲染
- **THEN** 展示加载占位，不展示空状态文案
- **AND** 加载完成后以实际结果替换占位

#### Scenario: 首次加载失败

- **GIVEN** 宠物列表请求失败且没有缓存数据
- **WHEN** 查询进入错误状态
- **THEN** 页面展示可读错误信息与重试入口
- **AND** 不展示空状态文案

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

### Requirement: 新增宠物

页面 SHALL 提供添加宠物入口并打开创建表单弹窗。提交 SHALL 调用 `POST /api/pets`；成功后关闭弹窗并使宠物列表失效，新宠物按 id 升序出现在列表末尾。创建失败时弹窗 SHALL 保留输入并展示可读错误。

#### Scenario: 添加宠物成功

- **GIVEN** 用户已登录且位于 `/paws`
- **WHEN** 用户填写合法字段并提交创建
- **THEN** 请求 `POST /api/pets` 且请求体包含全部可写字段
- **AND** 成功后关闭创建弹窗
- **AND** 宠物列表刷新并包含新宠物

#### Scenario: 添加宠物失败

- **GIVEN** 创建请求返回校验错误、网络错误或服务端错误
- **WHEN** 用户提交创建
- **THEN** 创建弹窗保持打开且保留已填写内容
- **AND** 展示可读错误提示

#### Scenario: 不填写照片也可创建

- **GIVEN** 用户未选择照片
- **WHEN** 其余字段合法并提交创建
- **THEN** 请求不包含照片数据
- **AND** 新宠物卡片在无照片时展示占位样式

### Requirement: 删除宠物需二次确认

详情弹窗 SHALL 提供删除入口。删除操作 MUST 先展示 shadcn `AlertDialog` 二次确认；取消 MUST NOT 发送删除请求；确认 SHALL 调用 `DELETE /api/pets/{id}`，成功后关闭相关弹窗并使宠物列表失效。

#### Scenario: 取消删除

- **GIVEN** 删除确认弹窗已打开
- **WHEN** 用户选择取消
- **THEN** 不发送删除请求
- **AND** 宠物仍保留在列表中

#### Scenario: 确认删除

- **GIVEN** 删除确认弹窗已打开
- **WHEN** 用户确认删除
- **THEN** 请求 `DELETE /api/pets/{id}`
- **AND** 成功后宠物从列表移除
- **AND** 若删除的是最后一只宠物，页面展示空状态

#### Scenario: 删除失败

- **GIVEN** 删除请求返回网络错误或其它服务端错误
- **WHEN** 用户确认删除
- **THEN** 展示可读错误提示
- **AND** 宠物仍保留在列表中

#### Scenario: 宠物被未结束行程使用

- **GIVEN** 宠物被至少一个未结束的行程引用
- **WHEN** 用户打开该宠物的删除确认弹窗
- **THEN** 弹窗展示包含引用行程名称的不可删除原因
- **AND** 删除按钮不可用

#### Scenario: 宠物仅被已结束行程使用

- **GIVEN** 宠物只被已结束的行程引用
- **WHEN** 用户打开该宠物的删除确认弹窗
- **THEN** 弹窗提示这些已结束行程将随宠物一并删除
- **WHEN** 用户确认删除
- **THEN** 请求 `DELETE /api/pets/{id}`
- **AND** 成功后宠物与这些已结束行程一并移除

### Requirement: 宠物照片上传、展示与移除

照片是可选字段。表单 SHALL 支持选择图片、即时预览与移除；提交时 SHALL 将照片以 base64 字符串写入 `photo`，移除照片时 MUST 提交 `null`。前端 SHALL 拒绝非图片文件与超过 5MB 的图片并展示提示。展示照片时 SHALL 根据 base64 魔数推断 MIME 类型；无照片或无法识别图片格式时 SHALL 展示占位样式，不渲染损坏图片。

#### Scenario: 选择图片并预览

- **GIVEN** 用户在宠物表单中
- **WHEN** 用户选择一张合法图片
- **THEN** 表单展示该图片的预览
- **AND** 提交时请求体包含对应的 base64 照片数据

#### Scenario: 移除已保存的照片

- **GIVEN** 正在编辑一只有照片的宠物
- **WHEN** 用户移除照片并保存
- **THEN** 更新请求的 `photo` 为 `null`
- **AND** 宠物卡片改为展示占位样式

#### Scenario: 拒绝非法照片

- **GIVEN** 用户选择非图片文件或超过 5MB 的图片
- **WHEN** 文件被选中
- **THEN** 表单展示可读错误提示
- **AND** 不设置预览，也不发送该文件数据

#### Scenario: 按实际格式展示照片

- **GIVEN** 宠物照片以 base64 形式返回且未携带 content type
- **WHEN** 页面渲染卡片或详情
- **THEN** 前端根据图片字节的魔数推断 MIME 类型并正确展示图片
- **AND** 无法识别格式时展示占位样式，不显示损坏图片

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

### Requirement: 宠物喜好与性格维护

宠物创建与编辑表单 SHALL 提供「喜好」多选（固定 5 项：游泳、爬山、草地奔跑、城市漫步、玩雪）与「性格」单选（固定 3 项：活泼好动、温和平静、胆小敏感，含「未设置」项），两者均可不填且 MUST NOT 成为必填校验。宠物接口 SHALL 支持请求与响应的 `preferences`（键数组，可省略或空数组）与 `personality`（单键或 null）；键 SHALL 使用固定词表（喜好 SWIMMING/HIKING/GRASS_RUNNING/CITY_WALKING/SNOW_PLAY，性格 ENERGETIC/CALM/TIMID）。服务端 SHALL 校验枚举合法性，非法键 MUST 返回 400 且 `code=VALIDATION_ERROR`、不落库；重复喜好键 SHALL 去重后存储。保存 SHALL 持久化并在编辑时回显；未填与旧档案 SHALL 视为未设置。既有必填校验（名字/类型/犬种/体重/肩高）MUST 保持不变。

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

#### Scenario: 重复喜好键去重

- **GIVEN** 创建或更新请求的 `preferences` 含重复键
- **WHEN** 服务端处理请求
- **THEN** 保存成功且重复键只保存一次
- **AND** 响应回显去重后的喜好集合

#### Scenario: 旧客户端不传新字段仍合法

- **GIVEN** 创建或更新请求不包含 `preferences` 与 `personality`
- **WHEN** 其余字段合法
- **THEN** 保存成功，两字段为未设置

#### Scenario: 旧档案读取兼容

- **GIVEN** 数据库存在迁移前创建的宠物
- **WHEN** 用户读取列表与详情
- **THEN** 该宠物正常读取，喜好与性格为未设置
- **AND** 其余字段展示不变
