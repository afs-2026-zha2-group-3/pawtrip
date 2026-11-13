# backend-error-handling Specification

## Purpose
定义后端错误响应契约：使用 RFC 9457 Problem Details、稳定错误码与全局异常映射，避免成功响应套壳。
## Requirements
### Requirement: 错误统一使用 Problem Details

后端错误响应 SHALL 使用 RFC 9457 Problem Details,媒体类型为 `application/problem+json`,至少包含 `status`、`code`、`detail` 与 `instance`。成功响应 MUST NOT 套统一 envelope。

#### Scenario: 问候语不存在

- **GIVEN** `greeting` 表为空
- **WHEN** 客户端发起 `GET /api/greeting`
- **THEN** 响应状态码为 `404`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `status=404`、`code=GREETING_NOT_FOUND`、`instance=/api/greeting`
- **AND** 响应体不包含堆栈或内部异常信息

#### Scenario: 成功响应保持原结构

- **GIVEN** `greeting` 表存在种子记录
- **WHEN** 客户端发起 `GET /api/greeting`
- **THEN** 响应体仍为 `{"message":"Hello World"}`
- **AND** 不增加 `code` / `data` 等 envelope 字段

### Requirement: 使用稳定错误码

系统 SHALL 使用稳定的机器可读 `code`,至少覆盖 `GREETING_NOT_FOUND`、`VALIDATION_ERROR` 与 `INTERNAL_ERROR`。`detail` SHALL 使用英文,便于日志与后续前端文案映射。

#### Scenario: 未捕获异常

- **GIVEN** 后端发生未预期异常
- **WHEN** 请求经过全局异常处理
- **THEN** 响应状态码为 `500`
- **AND** `code=INTERNAL_ERROR`
- **AND** `detail` 不暴露异常类名、堆栈或内部路径

#### Scenario: 校验失败

- **GIVEN** 未来接口接收到非法请求体
- **WHEN** `MethodArgumentNotValidException` 被全局异常处理捕获
- **THEN** 响应状态码为 `400`
- **AND** `code=VALIDATION_ERROR`
- **AND** 响应体包含字段级错误列表

### Requirement: 全局异常处理

系统 SHALL 通过 `@RestControllerAdvice` 统一映射领域异常、校验异常与未捕获异常;控制器与服务层 MUST NOT 各自拼装错误响应。

#### Scenario: 控制器抛出领域异常

- **GIVEN** 控制器查询不到问候语
- **WHEN** 领域异常抛出
- **THEN** 全局异常处理返回对应的 Problem Details
- **AND** 控制器不直接构造错误 JSON

### Requirement: 服务端错误日志

系统 SHALL 记录 5xx 错误日志(包含异常堆栈),4xx 不记录堆栈;日志 MUST NOT 包含凭据或敏感数据。

#### Scenario: 500 记录日志

- **GIVEN** 未捕获异常触发 `INTERNAL_ERROR`
- **WHEN** 全局异常处理生成响应
- **THEN** 服务端记录错误日志与异常堆栈
- **AND** 客户端响应中不包含堆栈

