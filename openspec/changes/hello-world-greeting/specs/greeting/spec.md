## ADDED Requirements

### Requirement: Greeting 持久化与初始化

系统 SHALL 在首次启动后端时通过 Flyway 迁移创建 SQLite `greeting` 表,并写入一条 `message` 为 "Hello World" 的记录。

#### Scenario: 首次启动自动建库与种子

- **WHEN** 后端在不存在数据库文件的本地环境启动
- **THEN** 系统创建 SQLite 数据库与 `greeting` 表
- **AND** 表中存在一条 `message` 为 "Hello World" 的记录

### Requirement: 问候语查询接口

系统 SHALL 提供 `GET /api/greeting`,从 `greeting` 表读取问候语,并以 `application/json` 返回状态码 `200` 与响应体 `{"message":"Hello World"}`。

#### Scenario: 查询问候语

- **WHEN** 客户端发起 `GET /api/greeting`
- **THEN** 响应状态码为 `200`
- **AND** 响应头 `Content-Type` 为 `application/json`
- **AND** 响应体为 `{"message":"Hello World"}`
