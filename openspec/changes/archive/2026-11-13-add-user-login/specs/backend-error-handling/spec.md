## ADDED Requirements

### Requirement: 安全层错误统一使用 Problem Details

系统 SHALL 对认证与授权相关错误返回 RFC 9457 Problem Details（`application/problem+json`），至少包含 `status`、`code`、`detail` 与 `instance`。安全过滤器链（未认证、登录失败、CSRF/授权拒绝）与 MVC 异常处理 MUST 输出同一响应结构，不得返回 HTML 登录页、`302` 重定向或空响应体。错误码 SHALL 至少包含 `UNAUTHENTICATED`（401）、`INVALID_CREDENTIALS`（401）与 `ACCESS_DENIED`（403）。

#### Scenario: 未认证访问业务接口

- **GIVEN** 客户端没有有效会话
- **WHEN** 请求 `GET /api/greeting`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `status=401`、`code=UNAUTHENTICATED`、`instance=/api/greeting`
- **AND** 响应不包含堆栈或内部异常信息

#### Scenario: 登录凭据错误

- **GIVEN** 客户端提交错误用户名或密码
- **WHEN** 请求 `POST /api/auth/login`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=INVALID_CREDENTIALS`

#### Scenario: CSRF 校验失败

- **GIVEN** 客户端对非安全方法缺少或使用无效 CSRF token
- **WHEN** 请求到达安全过滤器链
- **THEN** 响应状态码为 `403`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=ACCESS_DENIED`
- **AND** 不执行状态变更

### Requirement: 认证错误不泄露敏感信息

系统 SHALL 对用户名不存在与密码错误返回相同的状态码、错误码与通用 `detail`。认证错误响应与日志 MUST NOT 包含明文密码、密码哈希、会话 ID、堆栈或用户是否存在等信息。

#### Scenario: 不存在的用户名

- **GIVEN** 客户端提交不存在的用户名
- **WHEN** 登录失败
- **THEN** 响应体与密码错误场景一致
- **AND** 不包含“用户不存在”等可枚举信息

#### Scenario: 认证错误日志

- **GIVEN** 登录失败或未认证请求被拒绝
- **WHEN** 系统记录日志
- **THEN** 日志不含明文密码、密码哈希或会话 ID
- **AND** 客户端响应不含堆栈
