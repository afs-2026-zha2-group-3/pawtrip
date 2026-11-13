## MODIFIED Requirements

### Requirement: 问候语查询接口

系统 SHALL 提供 `GET /api/greeting`,仅允许持有有效已认证会话的客户端调用,从 `greeting` 表读取问候语,并以 `application/json` 返回状态码 `200` 与响应体 `{"message":"Hello World"}`。未认证请求 SHALL 返回 `401 application/problem+json` 与 `code=UNAUTHENTICATED`,不得返回问候语。

#### Scenario: 已认证查询问候语

- **GIVEN** 后端已启动、`greeting` 表存在种子记录且客户端持有有效已认证会话
- **WHEN** 客户端发起 `GET /api/greeting`
- **THEN** 响应状态码为 `200`
- **AND** 响应头 `Content-Type` 为 `application/json`
- **AND** 响应体为 `{"message":"Hello World"}`

#### Scenario: 未认证查询问候语

- **GIVEN** 客户端没有有效已认证会话
- **WHEN** 客户端发起 `GET /api/greeting`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=UNAUTHENTICATED`
- **AND** 响应不包含问候语
