# trip-context Specification

## Purpose

本能力拥有前端行程上下文：激活行程 store、草稿到确认的生命周期、`activeTripId` 持久化与恢复、`/trips` 激活页、左下角行程面板、计划防抖自动保存、统一宠物政策匹配主体、大交通方式标签、创建行程确认弹窗与单城市激活规则。

## Requirements

### Requirement: 激活行程上下文与持久化

系统 SHALL 使用 TanStack Store 保存当前激活行程，`active` 对象 MUST 与后端 trip 的 DB 字段同构（`id`、`name`、`cityAdcode`、`petId`、`totalDays`、`startDate`、`plan`、`transportMode`、`createdAt`、`updatedAt`），MAY 额外保存城市、宠物与地点详情缓存。浏览器端 MUST 只持久化 `activeTripId`；行程内容与缓存 MUST NOT 写入持久化存储。登录成功后系统 SHALL 按 `activeTripId` 拉取详情并写入 store；详情返回 `404` 或 `401` 时 MUST 清除 `activeTripId` 与本地行程状态；登出 MUST 清除 `activeTripId` 与行程相关缓存。

#### Scenario: 刷新后恢复激活行程

- **GIVEN** 用户有一个激活行程且 localStorage 保存了 `activeTripId`
- **WHEN** 用户刷新页面并完成登录态恢复
- **THEN** 系统请求 `GET /api/trips/{id}`
- **AND** 成功后 store 的 `active` 包含该行程的完整字段、`plan` 与 `transportMode`
- **AND** `active.startDate` 与服务端返回一致

#### Scenario: 激活行程已不存在

- **GIVEN** localStorage 中的 `activeTripId` 指向的行程已被删除
- **WHEN** 系统在登录后拉取详情
- **THEN** 接口返回 `404`
- **AND** 系统清除 `activeTripId` 与本地行程状态
- **AND** 页面回到“无激活行程”状态

#### Scenario: 登出清理

- **GIVEN** 用户有激活行程
- **WHEN** 用户确认登出且请求成功
- **THEN** `activeTripId` 被清除
- **AND** store 中的行程与地点缓存被清空

#### Scenario: 未登录不写入用户数据

- **GIVEN** 请求处于服务端渲染阶段或用户未登录
- **WHEN** store 被初始化
- **THEN** `active` 为空
- **AND** 服务端不读取或写入任何用户的行程数据

### Requirement: 左下角行程面板

系统 SHALL 在登录后的页面左下角展示基于 React Bits AnimatedList 的行程面板。折叠态 SHALL 悬浮于页面左下角，顶部以 tag 展示城市、天数与宠物名，并按天分组展示地点，包含"未排期"分组。面板 SHALL 提供展开按钮；展开后 SHALL 扩展至页面内容高度、增加宽度，并使后方页面内容向右挤压（移动端 MAY 使用全屏面板）。面板列表 MUST 按 `plan.days` 的 `day` 升序与 `stops` 数组顺序渲染，`unscheduled` MUST 单独成组。地点行 SHALL 支持拖拽：同日排序、跨天移动、拖入或拖出"未排期"；同一 `poiId` MAY 在同一天出现多次。

#### Scenario: 折叠态展示 tag 与分组

- **GIVEN** 用户存在激活行程
- **WHEN** 任一受保护页面渲染
- **THEN** 左下角显示折叠面板
- **AND** 顶部 tag 显示城市、天数与宠物名
- **AND** 列表按天分组并包含"未排期"分组

#### Scenario: 展开面板挤压内容

- **GIVEN** 面板处于折叠态
- **WHEN** 用户点击展开
- **THEN** 面板高度扩展至页面内容高度且宽度增大
- **AND** 页面主内容区域在剩余宽度内重新布局

#### Scenario: 同日拖拽排序

- **GIVEN** 第 1 天有两个地点
- **WHEN** 用户将第二个地点拖到第一个之前
- **THEN** 第 1 天 `stops` 顺序更新
- **AND** 触发防抖保存

#### Scenario: 跨天拖拽

- **GIVEN** 第 1 天与第 2 天各有地点
- **WHEN** 用户将第 1 天的一个地点拖到第 2 天
- **THEN** 该地点从第 1 天移除并插入第 2 天目标位置
- **AND** 触发防抖保存

#### Scenario: 同一天允许重复地点

- **GIVEN** 第 1 天已包含某景点
- **WHEN** 用户再次把同一景点加入第 1 天
- **THEN** 第 1 天保留两条相同 `poiId` 的记录
- **AND** 两条记录可分别拖拽与删除

#### Scenario: 拖入与拖出未排期

- **GIVEN** "未排期"分组存在一个地点
- **WHEN** 用户将其拖到第 2 天，或将某天地点拖入未排期
- **THEN** `plan.days` 与 `plan.unscheduled` 按目标位置更新
- **AND** 同一 `poiId` 不会同时出现在 `days` 与 `unscheduled`（已排期优先）

### Requirement: 计划编辑与自动保存

激活行程的计划或大交通方式变更 SHALL 先乐观更新 store，再以约 600ms 防抖合并为一次 `PUT /api/trips/{id}`，请求体 MUST 包含 `{ name, totalDays, startDate, plan, transportMode }`。面板 SHALL 展示 `保存中`、`已保存` 或 `保存失败` 状态。保存失败时 MUST 保留本地改动并提供重试；服务端返回 `400 VALIDATION_ERROR` 时 MUST 重新拉取详情并以服务端数据为准。系统 MUST NOT 引入乐观锁，整量更新为后写覆盖。

#### Scenario: 乐观更新

- **GIVEN** 用户激活了一个行程
- **WHEN** 用户加入一个地点
- **THEN** 面板立即显示该地点
- **AND** 在防抖窗口内不发送请求

#### Scenario: 防抖合并保存

- **GIVEN** 用户在 600ms 内连续进行多次拖拽
- **WHEN** 防抖窗口结束
- **THEN** 系统只发送一次 `PUT`
- **AND** 请求体包含最终 `plan`、当前 `transportMode` 与 `startDate`

#### Scenario: 选择大交通方式后自动保存

- **GIVEN** 用户激活了一个行程
- **WHEN** 用户在交通规则页选择一种大交通方式
- **THEN** active trip 在 store 中立即反映该选择
- **AND** 系统防抖保存该行程，`PUT` 请求体包含所选 `transportMode`

#### Scenario: 保存失败可重试

- **GIVEN** `PUT` 返回网络错误或 `5xx`
- **WHEN** 保存失败
- **THEN** 面板展示保存失败状态
- **AND** 本地改动保留
- **AND** 用户可点击重试重新发送

#### Scenario: 校验失败以服务端为准

- **GIVEN** `PUT` 返回 `400 VALIDATION_ERROR`
- **WHEN** 系统收到响应
- **THEN** 重新请求该行程详情
- **AND** store 的 `active` 被替换为服务端数据
- **AND** 面板提示保存失败原因

### Requirement: 统一政策匹配主体

所有政策匹配处 SHALL 使用同一匹配主体：存在激活行程且已绑定宠物时，只匹配该宠物；否则匹配当前用户的全部宠物。匹配结果 SHALL 以宠物名 tag 展示；有激活宠物时 MUST 只展示该宠物一个 tag，无激活行程时 MUST 为每只宠物展示一个 tag。结果状态 SHALL 统一为友好、不友好、无法判定或未配置。宠物数据加载失败时 MUST 展示"暂时无法读取宠物"类提示，MUST NOT 展示"无宠物"。

#### Scenario: 激活行程只匹配携带宠物

- **GIVEN** 用户有激活行程且 `petId` 指向「旺财」
- **WHEN** 用户浏览城市政策、景点列表或景点详情
- **THEN** 政策匹配只针对「旺财」
- **AND** 只展示「旺财」一个 tag

#### Scenario: 无激活行程匹配全部宠物

- **GIVEN** 用户无激活行程且有两只宠物
- **WHEN** 用户浏览需要政策匹配的页面
- **THEN** 系统分别对两只宠物给出结论
- **AND** 以两个宠物名 tag 展示

#### Scenario: 宠物缓存加载中

- **GIVEN** 用户有激活行程且宠物缓存尚未就绪
- **WHEN** 页面渲染政策 tag
- **THEN** 系统展示加载状态
- **AND** 不使用其他宠物替代

#### Scenario: 宠物数据加载失败

- **GIVEN** 宠物接口请求失败
- **WHEN** 页面渲染政策匹配
- **THEN** 系统提示暂时无法读取宠物
- **AND** 不展示"无宠物"提示

#### Scenario: 无法判定

- **GIVEN** 激活宠物为猫或没有犬种信息
- **WHEN** 页面展示城市禁养犬种匹配
- **THEN** 该宠物 tag 显示"无法判定"
- **AND** 不显示"友好"或"不友好"

### Requirement: 大交通方式面板选择入口

行程面板顶部 SHALL 提供大交通方式入口：active trip 已选择时展示包含“大交通”和方式中文名的可点击 tag；未选择时展示「选择大交通」入口，MUST NOT 展示带方式名的大交通 tag。入口 SHALL 打开选择浮层，逐项展示飞机、高铁、火车、自驾；存在可用宠物档案时按激活行程绑定的宠物展示推荐或不推荐结论与不推荐原因，宠物数据不可用时 MUST NOT 使用其他宠物替代，入口仍 SHALL 可选。浮层 SHALL 提供前往交通规则页查看完整规则的链接。选择后 SHALL 立即更新 store 的 `transportMode` 并沿用既有防抖保存链路，与交通规则页保持同一选择。

#### Scenario: 从面板选择方式

- **GIVEN** active trip 的 `transportMode` 为空
- **WHEN** 用户点击「选择大交通」入口并选择「自驾」
- **THEN** 面板入口更新为包含“大交通”和“自驾”的 tag
- **AND** 系统防抖保存该行程，`PUT` 请求体包含 `transportMode=drive`

#### Scenario: 面板展示推荐结论

- **GIVEN** active trip 绑定宠物「毛毛」，其体重、肩高或检疫证明不满足某方式
- **WHEN** 用户打开大交通方式浮层
- **THEN** 对应方式展示不推荐结论
- **AND** 列出不满足的原因
- **AND** 提供前往交通规则页的链接

#### Scenario: 已选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为 `flight`
- **WHEN** 行程面板渲染
- **THEN** 面板顶部展示包含“大交通”和“飞机”的 tag

#### Scenario: 尚未选择大交通方式

- **GIVEN** active trip 的 `transportMode` 为空
- **WHEN** 行程面板渲染
- **THEN** 面板顶部展示「选择大交通」入口
- **AND** 不展示带方式名的大交通 tag

### Requirement: 创建行程确认弹窗

选定城市后，系统 SHALL 打开创建行程对话框，固定展示所选城市，并在单一日历上依次选择开始日期与结束日期，同时选择携带宠物。日期 MUST 完整，按含首尾计算的天数 MUST 为 1–7 的整数；宠物 MUST 为当前用户的一只宠物，默认选中第一只。城市 MUST NOT 可编辑。用户确认时系统 SHALL 调用 `POST /api/trips`，成功后把返回详情设为激活行程、写入 `activeTripId`、失效 Trips 列表查询并跳转 `/attractions`；行程名 SHALL 由城市、天数与宠物名自动生成。取消 MUST NOT 调用创建接口或改变激活行程。系统 SHALL 把所选开始日期作为 `startDate` 持久化到行程；结束日期 MUST 由 `totalDays` 派生，MUST NOT 单独持久化。

#### Scenario: 确认城市、日期与宠物

- **GIVEN** 用户已选定杭州，在日历上选择 2026-12-01 至 2026-12-03，并选择宠物「豆豆」
- **WHEN** 用户点击「确定」
- **THEN** 系统调用 `POST /api/trips`
- **AND** 创建 `totalDays=3` 且 `startDate=2026-12-01` 的杭州行程
- **AND** 该行程成为激活行程并写入 `activeTripId`
- **AND** 页面跳转 `/attractions`

#### Scenario: 开始日期随行程保留

- **GIVEN** 用户用 2026-12-01 至 2026-12-03 创建并激活了行程
- **WHEN** 用户刷新页面
- **THEN** 系统拉取行程详情
- **AND** 激活行程仍包含 `startDate=2026-12-01` 与 `totalDays=3`

#### Scenario: 取消不写入

- **GIVEN** 用户已打开创建行程对话框并在日历上选择日期
- **WHEN** 用户点击「取消」
- **THEN** 对话框关闭
- **AND** 不调用 `POST /api/trips`
- **AND** 当前激活行程保持不变

#### Scenario: 日期范围无效

- **GIVEN** 用户只选择了开始日期，或所选区间推导出超过 7 天
- **WHEN** 用户点击「确定」
- **THEN** 系统提示需要完整的日期范围且天数为 1–7
- **AND** 对话框保持打开且不创建行程

#### Scenario: 重新选择日历范围

- **GIVEN** 用户已在日历上选择了开始与结束日期
- **WHEN** 用户再点击一个日期
- **THEN** 该日期成为新的开始日期
- **AND** 结束日期清空，等待用户重新选择

#### Scenario: 默认宠物

- **GIVEN** 用户有两只宠物「豆豆」与「毛毛」
- **WHEN** 用户打开创建行程对话框
- **THEN** 携带宠物默认选中「豆豆」
- **AND** 用户可切换为「毛毛」

#### Scenario: 无宠物不可创建

- **GIVEN** 用户没有任何宠物档案
- **WHEN** 用户打开创建行程对话框
- **THEN** 系统提示先添加宠物
- **AND** 「确定」不可用

### Requirement: Trips 页与单城市激活

系统 SHALL 提供受登录保护的 `/trips` 页面，列出当前用户的全部已持久化行程，按 `id` 升序展示城市、天数、宠物与激活状态，并提供激活、取消激活与删除操作。同一时间 MUST 最多存在一个激活行程；存在激活行程时 MUST NOT 创建新行程，`/cities` 的「选定」入口 MUST 不可用，只有取消激活后才能重新创建。激活行程时系统 SHALL 拉取详情并写入 store；删除激活中的行程 MUST 先取消激活再调用 `DELETE /api/trips/{id}`。系统 MUST NOT 再通过城市候选页创建草稿。

#### Scenario: 列出本人行程

- **GIVEN** 用户有两个已持久化行程
- **WHEN** 用户打开 `/trips`
- **THEN** 页面按 `id` 升序展示两个行程
- **AND** 每个行程显示城市、天数与宠物
- **AND** 激活中的行程带有激活标识

#### Scenario: 激活已有行程

- **GIVEN** 用户无激活行程并打开 `/trips`
- **WHEN** 用户点击某行程的激活
- **THEN** 系统请求该行程详情并写入 store
- **AND** `activeTripId` 被写入 localStorage

#### Scenario: 取消激活后可创建

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 取消激活
- **THEN** 系统清除 `active` 与 `activeTripId`
- **AND** 用户可在 `/cities` 重新创建行程

#### Scenario: 激活期间不可创建

- **GIVEN** 用户存在激活行程
- **WHEN** 用户打开 `/cities`
- **THEN** 页面展示候选列表与政策入口
- **AND** 「选定」不可用，并提示先在 Trips 取消激活

#### Scenario: 删除激活中的行程

- **GIVEN** 用户存在激活行程
- **WHEN** 用户在 `/trips` 确认删除该行程
- **THEN** 系统先取消激活
- **AND** 调用 `DELETE /api/trips/{id}`
- **AND** 成功后该行程从列表移除

### Requirement: 途内交通段行展示

行程面板按天视图 SHALL 在某天有序景点行之间渲染途内交通段行：n（n≥2）个景点生成 n−1 段，每段语义为「上一景点 → 下一景点」，当天最后一个景点之后 MUST NOT 渲染段行；0 或 1 个景点的天、未排期分组与草稿期 MUST NOT 渲染段行。段行 SHALL 按大交通模式提供方式选择并展示对应估算（非自驾：打车/步行，打车费用区间 + 时长、步行 ¥0 + 时长；自驾：默认驾车仅时长，见「大交通自驾联动」）；估算展示 SHALL 优先取 stop 已保存的 `toNextEstimate` 快照，无快照时取估算接口结果并展示加载态。段行 MUST NOT 可拖拽、MUST NOT 参与地点排序；既有地点拖拽行为不变。

#### Scenario: 多景点天生成段行

- **GIVEN** 激活行程第 1 天串联了 3 个景点
- **WHEN** 用户查看第 1 天行程
- **THEN** 景点行之间展示 2 个交通段行，每段关联其相邻两景点
- **AND** 当天最后一个景点之后无段行

#### Scenario: 单景点或空天不生成段行

- **GIVEN** 某天只有 1 个或 0 个景点
- **WHEN** 用户查看该天
- **THEN** 不展示任何交通段行

#### Scenario: 未排期与草稿不生成段行

- **GIVEN** 存在未排期地点或行程处于草稿期
- **WHEN** 面板渲染
- **THEN** 未排期分组与草稿面板不展示交通段行

#### Scenario: 段行不可拖拽

- **GIVEN** 某天已渲染交通段行
- **WHEN** 用户尝试拖拽段行
- **THEN** 段行不参与排序，地点拖拽行为不受影响

### Requirement: 途内交通方式选择与快照持久化

段行当前方式 SHALL 取对应 stop 的 `toNext`（`drive`=打车、`walk`=步行、`self_drive`=驾车）；为空时 UI 按大交通派生的默认方式展示（非自驾：打车；自驾：驾车）且 MUST NOT 写库或触发保存。用户显式选择后系统 SHALL 乐观更新 `toNext` 与 `toNextEstimate` 快照（`{durationMinutes, costLowYuan, costHighYuan}`；显式选驾车写 `self_drive`，快照费用 0/0 仅存不展示）并复用既有约 600ms 防抖整量 `PUT /api/trips/{id}` 保存；刷新后从 `plan_json` 恢复方式与快照。已有快照时段行 SHALL 直接展示快照且 MUST NOT 调用估算接口；切换方式 SHALL 重新估算并更新快照。选择时估算不可用 SHALL 仅写 `toNext`、快照留空，待后续查询成功后回填并保存。存量 `toNext=transit` SHALL 按当前默认方式展示、不主动改写，显式选择后覆盖。

#### Scenario: 未选择时默认打车不写库

- **GIVEN** 某段对应 stop 的 `toNext` 为空，大交通为非自驾（飞机/高铁/火车或未选择）
- **WHEN** 用户查看该段
- **THEN** UI 默认按打车展示估算
- **AND** `plan_json` 中该 stop 的 `toNext` 与 `toNextEstimate` 保持为空，不触发额外保存

#### Scenario: 切换方式保存并恢复快照

- **GIVEN** 某段当前为打车且估算可用
- **WHEN** 用户切换为步行
- **THEN** 该 stop 的 `toNext` 更新为 `walk`、`toNextEstimate` 更新为步行快照（费用 0/0 + 时长）并触发既有防抖 `PUT`
- **AND** 刷新页面后该段恢复为步行并直接展示已存快照，不发起估算请求

#### Scenario: 快照优先展示

- **GIVEN** 某 stop 已保存 `toNext=drive` 与 `toNextEstimate` 快照
- **WHEN** 用户查看该段
- **THEN** 段行直接展示快照中的费用区间与时长
- **AND** 不发起估算接口请求

#### Scenario: 切换方式重新估算并更新快照

- **GIVEN** 某段已展示打车估算快照
- **WHEN** 用户切换为步行
- **THEN** 发起步行估算请求，段行展示步行估算结果并更新该 stop 的 `toNextEstimate`

#### Scenario: 估算失败后回填快照

- **GIVEN** 用户选择方式时估算接口不可用，该 stop 仅保存了 `toNext`、`toNextEstimate` 为空
- **WHEN** 后续估算查询成功
- **THEN** 系统回填该 stop 的 `toNextEstimate` 快照并触发既有防抖保存

#### Scenario: 存量 transit 值不改写

- **GIVEN** 某 stop 的 `toNext` 为 `transit`
- **WHEN** 用户查看该段且未做选择
- **THEN** 按当前默认方式展示（大交通非自驾时默认打车），`toNext` 保持 `transit` 不被改写

### Requirement: 大交通自驾联动

激活行程大交通 `transportMode=drive`（自驾）时，`toNext` 为空的段行 SHALL 默认展示「驾车」且仅展示预估时长、不展示费用，派生默认 MUST NOT 写库；每段 SHALL 提供「选择其他途内交通方式」下拉（打车/步行），驾车 SHALL 也可显式选择（含从打车/步行切回），显式选择任一方式后按持久化需求写入 `toNext`（驾车=`self_drive`）与快照。大交通为飞机/高铁/火车或未选择时段行 SHALL 按默认打车规则展示与选择，选择器 MUST NOT 提供驾车选项。切换大交通 MUST NOT 改写已存 `toNext` 与快照，展示 SHALL 跟随已存值（含已存 `self_drive` 段按驾车仅时长展示）。

#### Scenario: 自驾默认驾车不写库

- **GIVEN** 激活行程 `transportMode=drive`，某段 `toNext` 为空
- **WHEN** 用户查看该段
- **THEN** 段行默认展示「驾车」与预估时长，不展示费用
- **AND** `toNext` 与 `toNextEstimate` 保持为空，不触发额外保存

#### Scenario: 显式选择驾车写库

- **GIVEN** 大交通为自驾，某段当前已切为打车
- **WHEN** 用户显式切回驾车
- **THEN** 该 stop 的 `toNext` 更新为 `self_drive`、`toNextEstimate` 更新为驾车快照（费用 0/0 + 时长）并触发既有防抖 `PUT`
- **AND** 段行仅展示时长，不展示费用

#### Scenario: 自驾模式下拉切换打车

- **GIVEN** 大交通为自驾，某段默认展示驾车
- **WHEN** 用户通过「选择其他途内交通方式」下拉选择打车
- **THEN** 系统估算打车时长与费用区间并写入 `toNext=drive` 与快照（估算不可用时仅存方式）
- **AND** 该段行内展示打车携宠小字提示

#### Scenario: 自驾模式隐藏公交提示

- **GIVEN** 激活行程 `transportMode=drive`，某天存在交通段
- **WHEN** 用户查看该天
- **THEN** 不展示公共交通不可携宠静态提示
- **AND** 每天宠物政策对比提醒仍按规则展示

#### Scenario: 公共交通或未选择按既有规则

- **GIVEN** 激活行程 `transportMode` 为飞机/高铁/火车或为空
- **WHEN** 用户查看途内交通段
- **THEN** 默认按打车展示，选择器仅提供打车/步行（无驾车选项），每天公交提示按规则展示

#### Scenario: 切换大交通不改写已存选择

- **GIVEN** 某段已保存 `toNext=walk` 与快照
- **WHEN** 用户将大交通从公共交通切为自驾再切回公共交通
- **THEN** 该 stop 的 `toNext` 与快照保持不变，切回后恢复步行快照展示

#### Scenario: 已存驾车段在公共交通模式下的展示

- **GIVEN** 某段已保存 `toNext=self_drive` 与快照，大交通为公共交通
- **WHEN** 用户查看该段
- **THEN** 按驾车展示快照时长（不展示费用），选择器提供打车/步行供切换

### Requirement: 公共交通静态提示

某天存在至少一个交通段且大交通非自驾时，面板 SHALL 在该天标题下展示一条「地铁/公交：不可携带宠物上车」类静态提示（每天仅一条，文案语义固定）；大交通为自驾（`transportMode=drive`）时 MUST NOT 展示该提示；公共交通 MUST NOT 可选、MUST NOT 触发算路请求；无交通段的天 MUST NOT 展示该提示。

#### Scenario: 有交通段的天展示提示

- **GIVEN** 某天存在至少一个交通段，大交通为非自驾
- **WHEN** 用户查看该天行程
- **THEN** 该天标题下展示一条公共交通不可携宠静态提示

#### Scenario: 无交通段的天不展示提示

- **GIVEN** 某天只有 1 个或 0 个景点
- **WHEN** 用户查看该天
- **THEN** 不展示公共交通提示

#### Scenario: 自驾模式不展示提示

- **GIVEN** 激活行程 `transportMode=drive`，某天存在交通段
- **WHEN** 用户查看该天
- **THEN** 不展示公共交通不可携宠提示

### Requirement: 打车段携宠提示

段行当前展示方式为打车（含非自驾模式 `toNext` 为空时默认按打车展示，含自驾模式下用户切为打车的段）时，面板 SHALL 在该段行内展示小字提示，语义为「部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带」（文案语义固定，措辞 P3 统一）；段当前方式为驾车（`self_drive`）、步行或相邻同 POI 段 MUST NOT 展示该提示。提示为前端静态常量，MUST NOT 触发算路请求。

#### Scenario: 打车段展示携宠提示

- **GIVEN** 某段当前展示方式为打车（`toNext=drive`）
- **WHEN** 用户查看该段
- **THEN** 段行内展示宠物专车/司机同意/航空箱语义的小字提示

#### Scenario: 默认打车展示同样展示提示

- **GIVEN** 某段对应 stop 的 `toNext` 为空，大交通为非自驾
- **WHEN** 用户查看该段（UI 默认按打车展示）
- **THEN** 段行内同样展示该携宠小字提示

#### Scenario: 驾车段不展示提示

- **GIVEN** 某段当前方式为驾车（`toNext=self_drive`，或自驾模式下默认驾车展示）
- **WHEN** 用户查看该段
- **THEN** 不展示打车携宠提示

#### Scenario: 自驾模式切为打车的段展示提示

- **GIVEN** 大交通为自驾，用户将某段通过下拉切为打车
- **WHEN** 用户查看该段
- **THEN** 该段行内展示打车携宠小字提示

#### Scenario: 步行段不展示提示

- **GIVEN** 某段当前方式为步行（`toNext=walk`）
- **WHEN** 用户查看该段
- **THEN** 不展示打车携宠提示

#### Scenario: 同 POI 段不展示提示

- **GIVEN** 同一天相邻两个 stop 为同一 `poiId`
- **WHEN** 用户查看该段
- **THEN** 仅展示景点相同小字提醒，不展示打车携宠提示

### Requirement: 每天宠物政策对比提醒

面板 SHALL 按当天已排期景点政策与行程绑定宠物档案派生展示小字提醒：任一景点 `leashRequired=true` 时，在每天第一个景点行前（day 标题与公共交通提示之后）展示「当天需携带牵引绳」语义，档案 `hasLeash=false` 时加强「请自备」语义；任一景点设体重/肩高上限且档案对应值超限（严格大于）时，SHALL 在对应景点行下方展示点名宠物姓名、超限景点与限额（≤Xkg/≤Ycm）的警示（2026-11-17 修订：体型警示不再汇入当天提醒块，宠物名缺失时退化为「您的宠物」无名语义）；未超限或档案值缺失时 MUST NOT 展示体型提醒；无景点或无触发项的天 MUST NOT 展示提醒。提醒为纯前端派生（复用景点政策缓存与宠物查询），MUST NOT 写库、MUST NOT 新增后端接口；未排期景点不计入聚合。

#### Scenario: 牵引绳需求提醒

- **GIVEN** 当天任一已排期景点 `leashRequired=true`，绑定档案 `hasLeash=true`
- **WHEN** 用户查看该天
- **THEN** 该天第一个景点行前展示「当天需携带牵引绳」类小字提醒

#### Scenario: 档案未登记牵引绳加强

- **GIVEN** 当天任一景点需牵引绳，绑定档案 `hasLeash=false`
- **WHEN** 用户查看该天
- **THEN** 提醒加强「档案未登记牵引绳，请自备」类语义

#### Scenario: 体型超限警示

- **GIVEN** 当天景点 A 设 `maxSinglePetWeightKg=10`，绑定档案 `weightKg=15`、宠物名「毛毛」
- **WHEN** 用户查看该天
- **THEN** 景点 A 行下方小字警示「您的宠物「毛毛」超出景点 A 限制（≤10kg）」类语义（肩高超限同理，点名宠物、景点与限额）
- **AND** 当天提醒块仅含牵引绳类提醒，不含体型警示

#### Scenario: 宠物名缺失退化无名警示

- **GIVEN** 当天景点超限但绑定宠物姓名不可得
- **WHEN** 用户查看该天
- **THEN** 警示退化为「您的宠物超出景点 A 限制（≤10kg）」类无名语义，仍位于对应景点行下方

#### Scenario: 未超限不提示

- **GIVEN** 当天景点设体重上限 10kg，绑定档案 `weightKg=8`
- **WHEN** 用户查看该天
- **THEN** 不展示体型提醒

#### Scenario: 档案值缺失不警示

- **GIVEN** 当天景点设体重上限，绑定档案 `weightKg` 为空
- **WHEN** 用户查看该天
- **THEN** 无法判定超限，不展示体型警示

#### Scenario: 无触发项或空天不提醒

- **GIVEN** 当天景点政策相关字段均为 null，或当天无景点
- **WHEN** 用户查看该天
- **THEN** 不展示政策对比提醒

#### Scenario: 未排期景点不计入

- **GIVEN** 某需牵引绳景点仅在未排期分组、未排入当天
- **WHEN** 用户查看该天
- **THEN** 该景点不计入当天牵引绳聚合

### Requirement: 相邻景点相同提醒

同一天相邻两个 stop 为同一 `poiId` 时，该段 MUST NOT 调用估算接口、MUST NOT 展示价格与预估时间、MUST NOT 渲染方式选择器、MUST NOT 写入 `toNext` 或 `toNextEstimate`；面板 SHALL 仅在该景点行下方展示一行小字提醒用户景点相同（文案语义固定）。

#### Scenario: 同 POI 段仅小字提醒

- **GIVEN** 同一天相邻两个 stop 为同一 `poiId`
- **WHEN** 用户查看该段
- **THEN** 不发起估算请求，不展示价格/时长/方式选择器
- **AND** 该景点行下方展示一行小字提醒景点相同

### Requirement: 估算失败兜底

估算接口失败（高德 Key 缺失、上游失败或景点坐标缺失）时，段行 SHALL 展示「估算暂不可用」类提示；方式选择与行程保存 MUST NOT 被阻塞，MUST NOT 弹出全局错误。用户在估算不可用时选择方式，系统 SHALL 仅保存 `toNext`、`toNextEstimate` 留空，MUST NOT 写入伪造估算值。

#### Scenario: 失败不阻塞选择与保存

- **GIVEN** 某段估算请求返回上游错误
- **WHEN** 用户查看该段
- **THEN** 段行展示「估算暂不可用」类提示
- **AND** 用户仍可切换方式且行程保存不受影响

#### Scenario: 估算不可用时仅存方式

- **GIVEN** 某段估算接口不可用
- **WHEN** 用户选择打车
- **THEN** 该 stop 的 `toNext` 保存为 `drive`，`toNextEstimate` 保持为空
- **AND** 不写入任何伪造的价格/时长值
