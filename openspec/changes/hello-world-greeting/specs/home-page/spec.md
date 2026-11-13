## ADDED Requirements

### Requirement: 首页展示问候语

首页 SHALL 在加载后从同源 `/api/greeting` 获取问候语,并展示响应中的 `message` 文本。该文本 MUST NOT 在前端代码中硬编码。

#### Scenario: 访客打开首页

- **WHEN** 访客打开 `http://localhost:3000/` 且后端可用
- **THEN** 页面展示 "Hello World"
- **AND** 该文本来自 `/api/greeting` 的响应

#### Scenario: 展示内容跟随接口返回

- **WHEN** `greeting` 表中的 `message` 变为其他文本且 `GET /api/greeting` 返回该文本
- **THEN** 刷新首页后展示新的文本
