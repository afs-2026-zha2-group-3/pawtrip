# Spec Delta

## ADDED Requirements

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

面板 SHALL 在每天第一个景点行前（day 标题与公共交通提示之后），按当天已排期景点政策与行程绑定宠物档案派生展示小字提醒：任一景点 `leashRequired=true` 时展示「当天需携带牵引绳」语义，档案 `hasLeash=false` 时加强「请自备」语义；任一景点设体重/肩高上限且档案对应值超限（严格大于）时，展示点名超限景点与限额（≤Xkg/≤Ycm）的警示；未超限或档案值缺失时 MUST NOT 展示体型提醒；无景点或无触发项的天 MUST NOT 展示提醒。提醒为纯前端派生（复用景点政策缓存与宠物查询），MUST NOT 写库、MUST NOT 新增后端接口；未排期景点不计入聚合。

#### Scenario: 牵引绳需求提醒

- **GIVEN** 当天任一已排期景点 `leashRequired=true`，绑定档案 `hasLeash=true`
- **WHEN** 用户查看该天
- **THEN** 该天第一个景点行前展示「当天需携带牵引绳」类小字提醒

#### Scenario: 档案未登记牵引绳加强

- **GIVEN** 当天任一景点需牵引绳，绑定档案 `hasLeash=false`
- **WHEN** 用户查看该天
- **THEN** 提醒加强「档案未登记牵引绳，请自备」类语义

#### Scenario: 体型超限警示

- **GIVEN** 当天景点 A 设 `maxSinglePetWeightKg=10`，绑定档案 `weightKg=15`
- **WHEN** 用户查看该天
- **THEN** 该天首个景点行前小字警示「您的宠物超出景点 A 限制（≤10kg）」类语义（肩高超限同理，点名景点与限额）

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