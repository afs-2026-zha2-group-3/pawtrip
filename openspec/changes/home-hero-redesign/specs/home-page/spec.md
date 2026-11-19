## REMOVED Requirements

### Requirement: 首页展示问候语

**Reason**: 问候语是项目脚手架阶段的产物，已无产品价值；首页改为品牌 hero 布局，不再消费 `/api/greeting`。
**Migration**: 后端 `GET /api/greeting` 接口与 `greeting` spec 保留不动；原要求中的未登录跳转行为移入新增的「首页访问控制」要求；e2e 中首页内容断言全部移除（首页不承载测试断言）。

## ADDED Requirements

### Requirement: 首页访问控制

未登录用户访问首页时,前端 SHALL 跳转到 `/login`,且 MUST NOT 展示首页受保护内容。已登录用户访问首页时 SHALL 直接展示首页内容,且不发生登录跳转。

#### Scenario: 访客打开首页

- **WHEN** 浏览器没有有效登录会话且用户打开 `/`
- **THEN** 浏览器跳转到 `/login`
- **AND** 页面不展示首页受保护内容

#### Scenario: 已登录用户打开首页

- **WHEN** 用户持有有效已认证会话且打开 `/`
- **THEN** 页面展示首页内容
- **AND** 不发生登录跳转

### Requirement: 首页品牌展示与入口导航

已登录首页 SHALL 展示标题素材图（含主标题与副标题,并配完整 alt 文本）、两个入口按钮与一排 5 张宠物照片倾斜卡片。入口按钮 SHALL 复用现有 Button 样式组件:「创建宠物档案」SHALL 跳转 `/paws`;行程入口按钮 SHALL 在有激活行程时显示「继续旅程」并跳转 `/attractions`（地点浏览）,无激活行程时显示「开始旅程」并跳转 `/cities`（城市浏览）。首页 MUST NOT 展示问候语文本。照片卡片 SHALL 使用 vendored TiltedCard 组件（`components/ui/tilted-card.tsx` 原版,零运行时依赖）,卡片与图片尺寸均为 220×220;每张卡片 SHALL 在图片内部渲染标题（依次为 Pet Friendly Hotel、Pet Friendly Park、Pet Traffic、Pet Canteen、Pet Play,左对齐,Constantia 字体,叠加底部渐变遮罩）,标题与遮罩 SHALL 仅在悬停该卡片时显示,悬停时 MUST NOT 出现额外描边或边框;切换进入首页时,5 张卡片 SHALL 从左到右依次渐显;视口宽度不足以一行容纳 5 张卡片时,照片行 SHALL 横向滚动且卡片完整可见、不被裁剪。

#### Scenario: 已登录用户查看首页

- **WHEN** 已登录用户打开 `/`
- **THEN** 页面展示标题图、「创建宠物档案」与「开始旅程」按钮、5 张宠物照片卡片
- **AND** 页面不包含问候语文本

#### Scenario: 点击创建宠物档案

- **WHEN** 用户点击「创建宠物档案」按钮
- **THEN** 浏览器跳转到 `/paws`
- **AND** 不自动打开新建宠物弹窗

#### Scenario: 有激活行程时的首页入口

- **WHEN** 用户存在激活行程且打开首页
- **THEN** 行程入口按钮显示「继续旅程」
- **AND** 点击该按钮跳转到 `/attractions`

#### Scenario: 无激活行程时的首页入口

- **WHEN** 用户没有激活行程且打开首页
- **THEN** 行程入口按钮显示「开始旅程」
- **AND** 点击该按钮跳转到 `/cities`

#### Scenario: 悬停照片卡片显示标题

- **WHEN** 鼠标悬停某张照片卡片
- **THEN** 该卡片图片底部淡入显示标题与渐变遮罩
- **AND** 不出现额外描边或边框

#### Scenario: 切换进入首页时的卡片入场

- **WHEN** 用户切换到首页
- **THEN** 5 张照片卡片从左到右依次渐显

#### Scenario: 窄视口浏览照片行

- **WHEN** 视口宽度不足以一行容纳 5 张照片卡片
- **THEN** 照片行可横向滚动
- **AND** 每张卡片完整可见、不被裁剪