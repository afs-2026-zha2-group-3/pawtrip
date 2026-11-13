## ADDED Requirements

### Requirement: 请求携带同源会话凭据

前端统一 `request` 层 SHALL 使用同源凭据发起请求，使浏览器自动携带 `JSESSIONID` cookie。请求层 MUST NOT 从 `localStorage`、`sessionStorage` 或内存中读取认证令牌，也 MUST NOT 手工设置 `Authorization` 头。

#### Scenario: 已登录请求自动携带会话

- **GIVEN** 浏览器持有有效 `JSESSIONID` cookie
- **WHEN** 前端通过 `request` 请求 `GET /api/greeting`
- **THEN** 请求包含同源会话 cookie
- **AND** 前端代码不读取或存储认证令牌

#### Scenario: 未登录请求不伪造身份

- **GIVEN** 浏览器没有有效会话
- **WHEN** 前端通过 `request` 请求业务接口
- **THEN** 请求不包含 `Authorization` 头
- **AND** 后端返回 `401`

### Requirement: 非安全方法携带 CSRF token

前端统一 `request` 层 SHALL 对 `POST`、`PUT`、`PATCH`、`DELETE` 请求从 `XSRF-TOKEN` cookie 读取 token，并写入 `X-XSRF-TOKEN` 请求头。若 token 缺失，请求层 SHALL 先通过公开的 `GET /api/auth/me` 获取 token；仍无法获取时 MUST 抛出可识别的 `ApiError`，不得静默发送无 token 的状态变更请求。请求层 SHALL 支持 `application/x-www-form-urlencoded` 请求体，用于登录。

#### Scenario: 登录请求携带 CSRF 头

- **GIVEN** 浏览器持有 `XSRF-TOKEN` cookie
- **WHEN** 登录页提交 `POST /api/auth/login`
- **THEN** 请求包含 `X-XSRF-TOKEN` 请求头
- **AND** 请求体为表单编码
- **AND** 请求成功后浏览器更新 `XSRF-TOKEN`

#### Scenario: 登出请求携带 CSRF 头

- **GIVEN** 用户已登录且浏览器持有 `XSRF-TOKEN`
- **WHEN** 前端请求 `POST /api/auth/logout`
- **THEN** 请求包含 `X-XSRF-TOKEN` 请求头

#### Scenario: CSRF 失败可识别

- **GIVEN** 请求缺少或使用无效 CSRF token
- **WHEN** 后端返回 `403 application/problem+json`
- **THEN** `request` 抛出 `ApiError`
- **AND** `status=403`、`code=ACCESS_DENIED`
- **AND** 不自动重试

### Requirement: 401 触发认证失效

前端 SHALL 将任意业务请求的 `401` 解析为可识别的 `ApiError`（`code=UNAUTHENTICATED` 或 `INVALID_CREDENTIALS`），并触发统一认证失效处理：使 auth query 失效、清理受保护查询缓存并引导到 `/login`。`401` MUST NOT 被当作网络错误或 `5xx` 重试。

#### Scenario: 会话过期返回 401

- **GIVEN** 用户停留在业务页面且会话已过期
- **WHEN** 业务请求返回 `401`
- **THEN** `request` 抛出 `ApiError`
- **AND** 认证状态被清理
- **AND** 不发起重试
- **AND** 用户被引导到 `/login`

#### Scenario: 登录失败返回 401

- **GIVEN** 用户在 `/login` 提交错误凭据
- **WHEN** 登录请求返回 `401`
- **THEN** `request` 抛出 `ApiError` 且 `code=INVALID_CREDENTIALS`
- **AND** 登录页展示通用失败提示
- **AND** 不执行受保护页面的跳转
