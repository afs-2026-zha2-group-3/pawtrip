## MODIFIED Requirements

### Requirement: 首页展示问候语

已登录用户访问首页时,首页 SHALL 在加载后从同源 `/api/greeting` 获取问候语,并展示响应中的 `message` 文本。该文本 MUST NOT 在前端代码中硬编码。未登录用户访问首页时,前端 SHALL 跳转到 `/login`,且 MUST NOT 展示问候语或受保护页面内容。

#### Scenario: 已登录用户打开首页

- **GIVEN** 用户持有有效已认证会话且后端 `/api/greeting` 可用
- **WHEN** 用户打开 `http://localhost:3000/`
- **THEN** 页面展示 "Hello World"
- **AND** 该文本来自 `/api/greeting` 的响应
- **AND** 不发生登录跳转

#### Scenario: 未登录用户打开首页

- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 用户打开 `http://localhost:3000/`
- **THEN** 浏览器跳转到 `/login`
- **AND** 页面不展示问候语或受保护页面内容

#### Scenario: 展示内容跟随接口返回

- **GIVEN** 首页已能正常展示问候语且用户保持已登录
- **WHEN** `greeting` 表中的 `message` 变为其他文本且 `GET /api/greeting` 返回该文本
- **THEN** 刷新首页后展示新的文本
