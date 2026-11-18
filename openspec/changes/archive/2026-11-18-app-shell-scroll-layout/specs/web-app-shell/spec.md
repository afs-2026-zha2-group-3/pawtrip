## ADDED Requirements

### Requirement: 固定应用外壳与分区滚动

登录后的应用外壳 SHALL 占满可视视口，文档根元素 MUST NOT 产生纵向滚动；顶部导航 MUST 固定在外壳顶部并位于内容滚动区之外，内容滚动 MUST NOT 改变导航位置。内容区 SHALL 作为默认且唯一的纵向滚动视口，仅当内容超出可视高度时出现滚动；`/` 与 `/paws` 在常规桌面视口下 MUST NOT 出现纵向滚动条，矮视口内容超出时 MAY 回退为内容区滚动且 MUST NOT 裁切内容。切换受保护路由后内容视口 SHALL 回到顶部，目标地址包含 `#` 锚点时 MUST NOT 复位并交由浏览器滚动到锚点。窄屏下导航 Tab 列表 SHALL 可横向滚动以访问全部 Tab，MUST NOT 被溢出裁切而不可达。`@media print` 时外壳 MUST 恢复普通文档流，MUST NOT 限制高度或裁剪内容。

#### Scenario: 顶部导航不随内容滚动

- **GIVEN** 已登录用户位于内容高度超过可视区的受保护页面
- **WHEN** 用户滚动页面内容
- **THEN** 顶部导航保持在视口顶部不动
- **AND** `window.scrollY` 保持为 0
- **AND** 内容区自身的 `scrollTop` 增大

#### Scenario: 普通页面只滚动内容区

- **GIVEN** 已登录用户位于 `/transport-rules` 且内容超过可视高度
- **WHEN** 用户滚动
- **THEN** 只有内容视口发生滚动
- **AND** 文档根不产生纵向滚动

#### Scenario: 常规视口下我的宠物页无滚动条

- **GIVEN** 视口为 1920×1080 且 `/paws` 的内容未超过内容视口高度
- **WHEN** 页面渲染完成
- **THEN** 内容视口不出现纵向滚动
- **AND** 顶部导航保持可见

#### Scenario: 矮视口兜底滚动

- **GIVEN** 视口高度不足以容纳 `/paws` 的完整内容
- **WHEN** 用户滚动内容区
- **THEN** 内容视口可纵向滚动且内容不被裁切
- **AND** 顶部导航保持固定

#### Scenario: 切换路由后内容回到顶部

- **GIVEN** 用户在某个受保护页面已把内容区滚动到非顶部位置
- **WHEN** 用户切换到另一个受保护路由
- **THEN** 新页面的内容视口 `scrollTop` 为 0

#### Scenario: 带锚点进入不复位

- **GIVEN** 用户从城市浏览进入 `/destinations/<adcode>/policy#banned-breeds`
- **WHEN** 页面渲染完成
- **THEN** 禁养犬种区块进入视口
- **AND** 内容视口 `scrollTop` 大于 0
- **AND** 外壳跳过了路由切换的滚动复位

#### Scenario: 打印恢复文档流

- **GIVEN** 用户位于行程单页面并触发打印或导出 PDF
- **WHEN** 应用进入打印媒体
- **THEN** 外壳不再限制高度与溢出
- **AND** 行程内容可跨页完整输出且不被内部滚动裁剪
- **AND** 顶部导航与应用外框不出现

#### Scenario: 窄屏导航避免裁切

- **GIVEN** 视口宽度为 390px 且当前用户为管理员（导航包含多个 Tab）
- **WHEN** 顶部导航渲染
- **THEN** Tab 列表可横向滚动访问全部 Tab
- **AND** 不存在被 `overflow-hidden` 裁切且无法访问的 Tab
