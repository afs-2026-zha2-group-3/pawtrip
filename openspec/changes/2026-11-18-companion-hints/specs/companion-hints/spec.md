## ADDED Requirements

### Requirement: 伙伴气泡复用现有 Chatbot 入口

登录后的应用 SHALL 继续使用右下角既有 Chatbot 圆形入口作为伙伴入口；入口 MUST 保留原有位置、样式、测试标识与可访问名称。点击入口 MUST 直接打开 Agent 面板，MUST NOT 先展示提示气泡，也 MUST NOT 新增第二个浮动头像。入口与气泡 MUST NOT 依赖激活行程存在，并 MUST 可通过键盘操作。

#### Scenario: 点击入口打开 Agent 面板

- **GIVEN** 用户已登录且位于任一登录后页面
- **WHEN** 用户点击右下角 Chatbot 入口
- **THEN** 既有 Agent 面板打开
- **AND** 已在展示的伙伴气泡立即隐藏且被丢弃，MUST NOT 浮在面板之上
- **AND** 关闭面板后气泡不重新弹出，入口仍然可用

#### Scenario: 不新增第二个浮动头像

- **GIVEN** 用户已登录并停留在业务页面
- **WHEN** 页面渲染完成
- **THEN** 右下角只有一个 Chatbot 圆形入口
- **AND** 伙伴气泡挂在该入口上方

#### Scenario: 入口不依赖激活行程

- **GIVEN** 用户已登录且没有激活行程
- **WHEN** 用户停留在任一登录后页面
- **THEN** Chatbot 入口仍然可见且可点击

### Requirement: 气泡署名与内容

伙伴气泡 SHALL 渲染在入口上方，标题 MUST 为「<宠物名> · 伙伴提示」，宠物名 SHALL 取宠物档案第一只宠物；无宠物档案时 MUST 默认显示「豆包」。气泡正文 SHALL 以宠物第一人称（「我/我们」）叙述情境与业务事件；需要指代其他宠物时 SHALL 使用其名字，MUST NOT 用第三人称称呼气泡署名的宠物。气泡 SHALL 提供关闭按钮；气泡 MUST NOT 再包含单独的「AI 规划」按钮。气泡 MUST 为非模态浮层，MUST NOT 显示头像、图标或身份标签等额外装饰。

#### Scenario: 有档案时使用宠物名署名

- **GIVEN** 用户已登录且存在名为「豆豆」的宠物档案
- **WHEN** 伙伴气泡展示
- **THEN** 标题显示「豆豆 · 伙伴提示」

#### Scenario: 无档案时使用默认署名

- **GIVEN** 用户已登录且没有任何宠物档案
- **WHEN** 伙伴气泡展示
- **THEN** 标题显示「豆包 · 伙伴提示」

#### Scenario: 关闭气泡

- **GIVEN** 伙伴气泡正在展示
- **WHEN** 用户点击气泡关闭按钮
- **THEN** 气泡立即关闭
- **AND** Chatbot 入口保持可用

### Requirement: 路由切换自动展示与自动关闭

每次路由 pathname 变化后，当前页面的情境提示 SHALL 自动展示一次；同一 pathname 的重渲染 MUST NOT 重复弹出。气泡 SHALL 在展示 5000 毫秒后自动关闭；新的气泡 MUST 立即替换旧气泡并重新计时，同一时刻 MUST 最多存在一个气泡。跨页业务事件产生的气泡在未过期前 SHALL 优先展示，MUST NOT 与本页情境提示叠加。

#### Scenario: 切换页面自动展示

- **GIVEN** 用户已登录
- **WHEN** 用户从一个业务页面切换到另一个业务页面
- **THEN** 新页面的情境提示自动出现在入口上方

#### Scenario: 同一路径不重复弹出

- **GIVEN** 当前页面已自动展示过情境提示
- **WHEN** 页面因查询或状态更新而重渲染
- **THEN** 不再次弹出同一页面的情境提示

#### Scenario: 五秒后自动关闭

- **GIVEN** 气泡已展示且期间没有新气泡
- **WHEN** 经过 5000 毫秒
- **THEN** 气泡自动关闭

#### Scenario: 新气泡替换旧气泡

- **GIVEN** 旧气泡正在展示
- **WHEN** 新的业务事件或页面提示产生新气泡
- **THEN** 旧气泡立即消失
- **AND** 自动关闭计时从新气泡展示时重新开始

#### Scenario: 跨页事件优先

- **GIVEN** 用户完成创建行程等跨页动作并产生事件气泡
- **WHEN** 新页面加载完成且事件气泡尚未过期
- **THEN** 事件气泡保持展示
- **AND** 本页情境提示在事件气泡关闭后才可展示

### Requirement: 统一提示接口与业务反馈

伙伴 SHALL 提供统一的 `say(text, mood)` 接口，情绪 MUST 支持 `ok`、`info`、`warn`、`danger`，并分别映射到不同的气泡边框色。页面情境提示 SHALL 通过统一声明入口登记；首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程与行程单 MUST 无提示盲区，数据尚未就绪时 MUST NOT 展示可能误导的情境提示。业务事件（保存档案、选择城市、加入景点、选择大交通方式、切换行程、创建行程单、导出成功或失败等）MUST 经 `say()` 发出反馈，MUST NOT 由业务页面自行实现气泡。

#### Scenario: 保存档案反馈

- **GIVEN** 用户在「我的宠物」保存档案
- **WHEN** 保存成功且档案完整
- **THEN** 气泡展示成功文案，情绪为 `ok`
- **AND** 品种或体重缺失时情绪为 `warn`

#### Scenario: 选择城市反馈

- **GIVEN** 用户在城市浏览页选择城市
- **WHEN** 城市命中禁养名单
- **THEN** 气泡展示警示文案，情绪为 `danger`
- **AND** 未命中时展示下一步建议，情绪为 `ok`；推荐集为空时情绪为 `info`

#### Scenario: 加入景点反馈

- **GIVEN** 用户将景点加入行程
- **WHEN** 该景点政策与宠物档案存在限制
- **THEN** 气泡展示提醒文案，情绪为 `warn`
- **AND** 无限制时情绪为 `ok`

#### Scenario: 选择交通方式反馈

- **GIVEN** 用户在交通规则页选择一种交通方式
- **WHEN** 该方式满足当前宠物档案
- **THEN** 气泡情绪为 `ok`
- **AND** 超重、肩高或检疫不满足时为 `warn`，明确不可携带时为 `danger`

#### Scenario: 逐页提示全覆盖

- **GIVEN** 用户已登录
- **WHEN** 用户依次进入首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程与行程单
- **THEN** 每个页面在数据就绪后展示对应的情境提示

### Requirement: 非模态、窄窗与挂载边界

气泡 SHALL 使用 `role="status"` 与礼貌播报，MUST NOT 夺取焦点或阻塞页面滚动、点击与其他操作。窄桌面窗口下入口 MUST 保持右下角，气泡 SHALL 收窄并限制在视口内，MUST NOT 遮挡页面关键操作。`/login` MUST NOT 渲染 Chatbot 入口；`/admin/*` MUST NOT 展示伙伴气泡，但 SHALL 保留既有 Chatbot 入口。气泡与提示状态 MUST 仅存于内存，刷新后丢失。

#### Scenario: 气泡不阻塞页面操作

- **GIVEN** 气泡正在展示
- **WHEN** 用户滚动页面或点击其他控件
- **THEN** 操作正常执行
- **AND** 气泡不夺取焦点

#### Scenario: 窄窗口气泡收窄

- **GIVEN** 视口宽度明显小于桌面常规宽度
- **WHEN** 气泡展示
- **THEN** 气泡宽度随视口收窄并限制在可视范围内
- **AND** 气泡保持在入口上方

#### Scenario: 管理端不展示气泡

- **GIVEN** 管理员位于 `/admin/locations` 或 `/admin/cities`
- **WHEN** 页面渲染
- **THEN** 不显示伙伴气泡
- **AND** 既有 Chatbot 入口仍然可用

#### Scenario: 登录页不渲染入口

- **GIVEN** 用户位于 `/login`
- **WHEN** 页面渲染
- **THEN** 不显示 Chatbot 入口与伙伴气泡

#### Scenario: 状态不持久化

- **GIVEN** 伙伴气泡正在展示
- **WHEN** 用户刷新页面
- **THEN** 气泡回到未展示状态
- **AND** 不保留上次提示
