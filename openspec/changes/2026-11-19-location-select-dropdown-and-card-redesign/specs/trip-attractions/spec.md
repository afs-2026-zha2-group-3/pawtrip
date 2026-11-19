# Spec Delta

## ADDED Requirements

### Requirement: 地点选择导航与类型页面

顶部导航 SHALL 提供名为「地点选择」的下拉入口，选项 MUST 恰为「景点」与「酒店和餐厅」；选择「景点」MUST 进入 `/attractions`，选择「酒店和餐厅」MUST 进入 `/attractions?type=hotel`，并在同一页面顶部提供「酒店」「餐厅」两个类型 tag。当前类型 SHALL 由 URL 查询参数 `type` 表达（`attraction` 可缺省、`hotel`、`restaurant`），刷新、前进与后退 MUST 保持该类型与对应 tag 的激活态。页内 tag 切换 MUST 保留激活行程城市、锚点与搜索词，并将页码重置为第一页。页面 MUST NOT 再提供页内的「地点类型筛选」「返回景点选择」或「选择住宿/餐厅」入口。其余主导航项保持现状。

#### Scenario: 从导航切换到酒店和餐厅

- **GIVEN** 用户处于任意已登录页面
- **WHEN** 用户打开「地点选择」下拉并选择「酒店和餐厅」
- **THEN** 页面进入 `/attractions?type=hotel`
- **AND** 页面顶部的「酒店」tag 处于激活态
- **AND** 列表展示该行程城市的酒店

#### Scenario: 页内 tag 切换餐厅

- **GIVEN** 用户位于「酒店和餐厅」页面且「酒店」tag 激活
- **WHEN** 用户点击「餐厅」tag
- **THEN** 页面进入 `/attractions?type=restaurant`
- **AND** 「餐厅」tag 处于激活态并展示该城市的餐厅列表

#### Scenario: 刷新保持类型

- **GIVEN** 用户位于 `/attractions?type=restaurant`
- **WHEN** 用户刷新页面
- **THEN** 页面仍展示餐厅列表
- **AND** 「餐厅」tag 保持激活态
- **AND** 导航「地点选择」保持可用

#### Scenario: 返回景点

- **WHEN** 用户在「地点选择」下拉中选择「景点」
- **THEN** 页面进入 `/attractions`
- **AND** 列表标题显示「景点」

### Requirement: 地点卡片概览与简介

地点卡片 SHALL 按概览结构展示：封面图上叠加宠物友好徽标、`keytag`、评分徽标与政策要求标签；封面下方展示名称、简介、可选距离与宠物适住标签；底部右侧 MUST 提供默认文案为「请选择日期」的添加入口，点击后 SHALL 展开可选「第 N 天」与「暂不排期」的下拉框，其无障碍名称 MUST 为「添加到行程」；用户选择后入口文案 SHALL 更新为所选日期（如「第 1 天」）或「暂不排期」，且仍可再次打开下拉重复选择同一天。政策要求标签（如「公共区域需牵引」「需疫苗证明」「需提前预约」及超限红标）MUST 叠放在封面图内，MUST NOT 出现在封面下方。封面下方标签区 MUST 只展示按当前宠物判定的适住标签（如「豆豆 · 友好」）。简介 MUST 优先使用地点 `description`，缺失时回退地址。详情弹窗与地图详情卡 MUST 同步展示简介。

#### Scenario: 卡片展示简介与评分

- **GIVEN** 某地点有 `description` 与评分
- **WHEN** 用户浏览地点列表
- **THEN** 卡片封面显示宠物友好徽标、keytag 与评分徽标
- **AND** 卡片简介显示该 `description`
- **AND** 底部显示「请选择日期」添加入口
- **AND** 选择「第 1 天」后入口文案更新为「第 1 天」

#### Scenario: 政策要求标签叠于封面

- **GIVEN** 某地点要求公共区域牵引并需要疫苗证明
- **WHEN** 用户浏览地点列表
- **THEN** 「公共区域需牵引」「需疫苗证明」显示在封面图范围内
- **AND** 封面下方的标签区不显示这两项政策要求标签

#### Scenario: 封面下方只保留宠物适住标签

- **GIVEN** 激活行程的宠物可被该地点接纳
- **WHEN** 用户浏览地点列表
- **THEN** 封面下方显示「豆豆 · 友好」这类按宠物判定的适住标签
- **AND** 卡片其余信息与操作正常展示

#### Scenario: 简介缺失回退地址

- **GIVEN** 某地点 `description` 为空但存在地址
- **WHEN** 用户浏览地点列表
- **THEN** 卡片简介显示地址

#### Scenario: 详情同步简介

- **GIVEN** 某地点有 `description`
- **WHEN** 用户打开详情弹窗或地图详情卡
- **THEN** 两处均展示该简介

### Requirement: 地点列表与地图同框

地点浏览页 SHALL 将地点列表与地图置于同一张外框容器内：列表在左、地图在右，二者共用圆角、边框与背景，MUST NOT 使用阴影；行程面板列与列表/地图外框的描边 SHALL 使用淡奶黄（`paw-accent-soft`，`#FFEFD6`）。地图 MUST 在外框内保留上下与右侧间距，MUST NOT 与外框边缘贴齐；地图自身 SHALL 有独立圆角与描边。行程面板等其他列 MUST NOT 并入该外框。列表滚动 MUST 发生在外框内部，不带动地图与页面其他区域。窄屏下地图 MUST 堆叠在列表下方并保持可用的最小高度。

#### Scenario: 列表与地图同框

- **GIVEN** 用户打开任一地点浏览页
- **WHEN** 页面渲染完成
- **THEN** 列表与地图处于同一个带边框的容器内
- **AND** 地图在外框内四周保留间距，右缘不与外框贴齐
- **AND** 行程面板列与列表/地图外框的描边为淡奶黄（`#FFEFD6`）且无阴影

#### Scenario: 窄屏地图堆叠

- **GIVEN** 视口宽度小于分栏断点
- **WHEN** 用户浏览地点页
- **THEN** 地图显示在列表下方
- **AND** 两者仍处于同一外框内
- **AND** 地图四周保留与外框的间距

## RENAMED Requirements

- FROM: `### Requirement: 餐厅的选择门禁`
- TO: `### Requirement: 酒店与餐厅的默认列表与可选锚点`

## MODIFIED Requirements

### Requirement: 地点类型筛选

地点浏览页 SHALL 由顶部导航「地点选择」下拉驱动地点类型；下拉选项 MUST 恰为「景点」与「酒店和餐厅」，前者对应 `/attractions`，后者进入 `/attractions?type=hotel` 并在页面顶部提供「酒店」「餐厅」两个类型 tag。当前类型 MUST 由 URL 查询参数 `type` 表达（`attraction` 可缺省、`hotel`、`restaurant`），非法或未知值 MUST 视为景点。导航选择或页内 tag 切换 MUST 保留激活行程城市并将页码重置为第一页；页面 MUST NOT 再提供页内「地点类型筛选」「返回景点选择」或「选择住宿/餐厅」入口。

#### Scenario: 默认浏览景点

- **GIVEN** 用户打开 `/attractions` 且存在激活行程
- **WHEN** 页面加载完成
- **THEN** 列表标题显示「景点」
- **AND** 列表只显示该行程城市的景点
- **AND** 页面不显示「酒店」「餐厅」类型 tag

#### Scenario: 切换到其他地点类型

- **GIVEN** 用户当前正在查看景点列表
- **WHEN** 用户在「地点选择」下拉中选择「酒店和餐厅」
- **THEN** 页面进入 `/attractions?type=hotel`
- **AND** 页面显示「酒店」「餐厅」两个类型 tag，且「酒店」tag 激活
- **AND** 列表只显示该行程城市的酒店

#### Scenario: 页内 tag 切换餐厅

- **GIVEN** 用户位于 `/attractions?type=hotel`
- **WHEN** 用户点击列表头部的「餐厅」tag
- **THEN** 页面进入 `/attractions?type=restaurant`
- **AND** 「餐厅」tag 激活，列表只显示该行程城市的餐厅

#### Scenario: 类型变更重置分页

- **GIVEN** 用户位于第 2 页
- **WHEN** 用户通过导航下拉或页内 tag 切换地点类型
- **THEN** 列表从第 1 页开始展示新类型结果

#### Scenario: 非法类型回退景点

- **GIVEN** 用户访问 `/attractions?type=park`
- **WHEN** 页面加载完成
- **THEN** 页面按景点类型展示
- **AND** 不因非法参数报错或空白

### Requirement: 地点卡片封面与评分

地点卡片 SHALL 在顶部以 4:3 裁切展示封面图（浏览器直载来源 URL，不经后端代理），并在封面上叠放宠物友好徽标、`keytag` 与右下角琥珀色评分徽标；卡片不再单独展示地址行。无照片、URL 非 http(s) 或加载失败时，封面区域 MUST 显示中性占位（图标 + 类型标签），且 MUST NOT 提供「获取图片」或重试操作；评分缺失或非数值时 MUST 隐藏评分徽标。卡片其余信息与操作 MUST 不受媒体降级影响。

#### Scenario: 封面展示

- **GIVEN** 某地点的 `coverPhotoUrl` 为有效 HTTP(S) 照片 URL
- **WHEN** 用户浏览地点列表
- **THEN** 该卡片顶部以 4:3 裁切展示封面图
- **AND** 图片由浏览器直接加载，不经过 Pawtrip 后端代理

#### Scenario: 无照片占位

- **GIVEN** 某地点 `coverPhotoUrl` 为 `null`
- **WHEN** 卡片渲染
- **THEN** 封面区域显示中性占位（图标 + 类型标签）
- **AND** 名称、政策标签与操作按钮正常展示

#### Scenario: 加载失败降级

- **GIVEN** 封面 URL 非 http(s) 或浏览器加载失败
- **WHEN** 卡片渲染
- **THEN** 封面区域显示与无照片一致的中性占位
- **AND** 不显示「获取图片」或重试操作

#### Scenario: 评分展示

- **GIVEN** 某地点 `rating` 为 "4.6"
- **WHEN** 卡片渲染
- **THEN** 封面右下角展示琥珀色星标与「4.6」
- **AND** 评分不占用独立地址行

#### Scenario: 评分缺失或非法隐藏

- **GIVEN** 某地点 `rating` 为 `null` 或非数值字符串
- **WHEN** 卡片渲染
- **THEN** 不展示评分徽标
- **AND** 简介与操作正常展示

### Requirement: 行程景点锚点选择

地点浏览页 SHALL 提供选择锚点的控件：酒店与餐厅类型下 MUST 提供“离景点最近”下拉，景点类型下 SHALL 保留“行程景点锚点”选择器；两者 MUST 共用同一候选集合与锚点状态。候选 MUST 来自当前激活行程中已按天排期到某一天的景点，即 `plan.days[].stops` 中 `poiId` 对应 `typeGroup=attraction` 的地点；候选 MUST 按 `poiId` 去重，MUST NOT 包含仅存在于 `unscheduled` 的地点或其他类型地点。用户 MUST 能清除已选锚点。选择或清除锚点 MUST NOT 改变当前景点列表结果。锚点景点从行程移除或激活行程变化后，页面 MUST 自动清空锚点；酒店与餐厅类型 MUST 回到默认全量列表。

#### Scenario: 酒店页选择已排期景点作为锚点

- **GIVEN** 激活行程第 1 天的 stops 包含景点「长隆海洋王国」，且用户位于「酒店」类型
- **WHEN** 用户在「离景点最近」下拉中选择「长隆海洋王国」
- **THEN** 锚点显示为「长隆海洋王国」
- **AND** 酒店列表只显示该锚点 5km 内的酒店

#### Scenario: 景点页选择已排期景点作为锚点

- **GIVEN** 激活行程第 1 天的 stops 包含景点「长隆海洋王国」
- **WHEN** 用户在「景点」类型下打开“行程景点锚点”选择器并选择「长隆海洋王国」
- **THEN** 锚点显示为「长隆海洋王国」
- **AND** 当前景点列表内容不变

#### Scenario: 未排期景点不出现在候选

- **GIVEN** 激活行程的 `unscheduled` 包含景点「情侣路」，且按天 stops 中没有该景点
- **WHEN** 用户打开任一锚点选择控件
- **THEN** 「情侣路」不出现在候选中

#### Scenario: 重复景点去重

- **GIVEN** 同一景点 `poiId` 出现在第 1 天和第 2 天的 stops 中
- **WHEN** 用户打开任一锚点选择控件
- **THEN** 该景点只出现一次

#### Scenario: 清除酒店锚点

- **GIVEN** 用户已在酒店类型下选择锚点
- **WHEN** 用户清除锚点
- **THEN** 「离景点最近」下拉恢复未选态
- **AND** 酒店列表恢复为默认全量列表

#### Scenario: 锚点景点被移出行程

- **GIVEN** 用户已选择锚点「长隆海洋王国」
- **WHEN** 该景点从激活行程的所有天 stops 中被移除
- **THEN** 页面自动清空锚点
- **AND** 酒店与餐厅类型恢复默认全量列表

### Requirement: 酒店与餐厅的默认列表与可选锚点

酒店与餐厅类型 MUST 默认请求并展示当前城市该类型的全量已保存地点，MUST NOT 因未选择锚点而门禁。「离景点最近」锚点 SHALL 为可选筛选：选中后餐厅和酒店共用同一锚点、按 5km 过滤并展示距离；在页内两个 tag 之间切换 MUST 保留锚点并将页码重置为第 1 页。本需求不改变宠物医院与宠物用品店的共享地点查询语义，二者不属于「地点选择」的入口类型，也不受锚点门禁影响。

#### Scenario: 未选锚点切换到餐厅

- **GIVEN** 用户尚未选择锚点
- **WHEN** 用户在「酒店和餐厅」页面点击「餐厅」tag
- **THEN** 页面请求并展示该城市的餐厅列表
- **AND** 不显示门禁空态
- **AND** 不要求用户先返回景点页选择锚点

#### Scenario: 未选锚点切换到酒店

- **GIVEN** 用户尚未选择锚点
- **WHEN** 用户从「地点选择」下拉进入「酒店和餐厅」
- **THEN** 页面请求并展示该城市的酒店列表
- **AND** 不显示门禁空态
- **AND** 若行程中没有已排期景点，「离景点最近」下拉禁用并提示

#### Scenario: 宠物医院与宠物用品店不受门禁影响

- **GIVEN** 用户尚未选择锚点
- **WHEN** 以 `typeGroup=pet-hospital` 或 `pet-supplies` 请求共享地点列表
- **THEN** 服务端按城市与类型返回已保存地点
- **AND** 不应用锚点门禁或 5km 距离筛选

#### Scenario: 餐厅和酒店共用锚点

- **GIVEN** 用户已在酒店类型下通过「离景点最近」选择锚点
- **WHEN** 用户切换到「餐厅」
- **THEN** 餐厅列表使用同一锚点执行距离筛选
- **AND** 页码重置为第 1 页
