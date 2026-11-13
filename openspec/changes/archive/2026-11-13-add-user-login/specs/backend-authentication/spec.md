## ADDED Requirements

### Requirement: 账号持久化与密码存储

系统 SHALL 通过 Flyway 迁移创建 SQLite `app_user` 表，至少包含唯一用户名、BCrypt 密码哈希与启用状态；系统 MUST NOT 在迁移中写入账号数据，也 MUST NOT 在数据库、日志或仓库文档中存储明文密码。本地与测试账号 SHALL 由独立脚本 `scripts/seed-users.mjs` 注入，脚本内定义若干测试账号与密码，并仅以 BCrypt 哈希写入数据库。

#### Scenario: 首次启动创建账号表且不注入账号

- **GIVEN** 本地数据库尚未执行过该迁移
- **WHEN** 后端启动并执行 Flyway 迁移
- **THEN** 数据库存在 `app_user` 表
- **AND** 表中没有任何账号记录
- **AND** 迁移文件中不包含 `INSERT` 语句或明文密码

#### Scenario: 运行种子脚本注入测试账号

- **GIVEN** `app_user` 表已由迁移创建
- **WHEN** 开发者运行 `npm run seed:users`
- **THEN** 脚本内定义的账号被写入或更新到 `app_user`
- **AND** `password_hash` 为 BCrypt 哈希（以 `$2a$`、`$2b$` 或 `$2y$` 开头）
- **AND** 重复运行脚本不会产生重复用户名记录

#### Scenario: 按用户名读取账号

- **GIVEN** 种子脚本已写入启用账号 `demo`
- **WHEN** 认证流程按用户名 `demo` 读取账号
- **THEN** 返回唯一一条账号记录
- **AND** 不返回多条歧义记录

### Requirement: 服务端会话登录

系统 SHALL 提供 `POST /api/auth/login`，接受 `application/x-www-form-urlencoded` 的 `username` 与 `password`；凭据正确时 SHALL 返回 `200` 与当前用户名，并在服务端创建 HTTP Session、通过 `Set-Cookie` 下发 `JSESSIONID`。凭据错误时 SHALL 返回 `401` 与 `code=INVALID_CREDENTIALS`，且 MUST NOT 建立已认证会话。登录成功后系统 SHALL 更换会话 ID 以防御会话固定攻击。

#### Scenario: 正确凭据登录

- **GIVEN** `app_user` 中存在启用账号且密码哈希与提交密码匹配
- **WHEN** 客户端携带有效 CSRF token 提交 `POST /api/auth/login`
- **THEN** 响应状态码为 `200`
- **AND** 响应体包含当前用户名
- **AND** 响应设置 `JSESSIONID` cookie
- **AND** 后续携带该 cookie 的 `GET /api/greeting` 返回 `200`

#### Scenario: 错误凭据登录

- **GIVEN** 用户名不存在或密码不匹配
- **WHEN** 客户端提交 `POST /api/auth/login`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=INVALID_CREDENTIALS`
- **AND** 响应与日志不包含提交的密码
- **AND** 不建立已认证会话

#### Scenario: 登录时更换会话 ID

- **GIVEN** 客户端在登录前已持有匿名 `JSESSIONID`
- **WHEN** 登录成功
- **THEN** 服务端返回新的会话 ID
- **AND** 旧会话 ID 不能继续访问 `/api/**` 业务接口

### Requirement: 当前用户查询

系统 SHALL 提供 `GET /api/auth/me`。已认证请求 SHALL 返回 `200` 与当前用户名；未认证请求 SHALL 返回 `401` 与 `code=UNAUTHENTICATED`，且 MUST NOT 返回 HTML 或重定向。

#### Scenario: 已登录查询当前用户

- **GIVEN** 客户端持有有效已认证会话
- **WHEN** 请求 `GET /api/auth/me`
- **THEN** 响应状态码为 `200`
- **AND** 响应体包含当前用户名
- **AND** 不包含密码哈希或其他敏感字段

#### Scenario: 未登录查询当前用户

- **GIVEN** 客户端没有有效会话
- **WHEN** 请求 `GET /api/auth/me`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=UNAUTHENTICATED`

### Requirement: 业务接口保护

除 `/api/auth/login`、`/api/auth/me` 与 `/api/auth/logout` 外，系统 SHALL 要求全部 `/api/**` 请求经过认证。未认证请求 MUST 返回 `401 application/problem+json`，不得返回 HTML 登录页或 `302` 重定向。已认证请求 SHALL 保持既有业务响应契约。

#### Scenario: 未认证访问业务接口

- **GIVEN** 客户端没有有效会话
- **WHEN** 请求 `GET /api/greeting`
- **THEN** 响应状态码为 `401`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `status=401`、`code=UNAUTHENTICATED`、`instance=/api/greeting`
- **AND** 响应不包含 HTML 或登录跳转

#### Scenario: 已认证访问业务接口

- **GIVEN** 客户端持有有效已认证会话
- **WHEN** 请求 `GET /api/greeting`
- **THEN** 响应状态码为 `200`
- **AND** `Content-Type` 为 `application/json`
- **AND** 响应体为 `{"message":"Hello World"}`

### Requirement: 登出

系统 SHALL 提供 `POST /api/auth/logout`。携带有效 CSRF token 的请求 SHALL 使服务端会话失效、清理安全上下文并返回 `204`；使用登出前的旧会话再次访问业务接口 MUST 返回 `401`。

#### Scenario: 已登录用户登出

- **GIVEN** 客户端持有有效已认证会话与 CSRF token
- **WHEN** 请求 `POST /api/auth/logout`
- **THEN** 响应状态码为 `204`
- **AND** 服务端会话失效
- **AND** 使用旧 `JSESSIONID` 请求 `GET /api/greeting` 返回 `401`

#### Scenario: 未登录调用登出

- **GIVEN** 客户端没有有效会话
- **WHEN** 携带有效 CSRF token 请求 `POST /api/auth/logout`
- **THEN** 请求不建立新的已认证会话
- **AND** 不暴露会话内部信息

### Requirement: CSRF 保护

系统 SHALL 对使用会话 cookie 的非安全方法启用 CSRF 保护，采用单页应用模式：将 token 写入 `XSRF-TOKEN` cookie，并从 `X-XSRF-TOKEN` 请求头读取客户端 token。缺少或无效 token 的请求 MUST 返回 `403` 与 `code=ACCESS_DENIED`，且 MUST NOT 执行状态变更。登录成功与登出后系统 SHALL 刷新或清理 CSRF token，避免继续使用旧 token。

#### Scenario: 带有效 token 的状态变更

- **GIVEN** 客户端持有与服务端匹配的 `XSRF-TOKEN`
- **WHEN** 对 `POST /api/auth/logout` 携带 `X-XSRF-TOKEN` 请求头
- **THEN** CSRF 校验通过
- **AND** 请求进入登出处理

#### Scenario: 缺少或无效 token

- **GIVEN** 客户端未携带 `X-XSRF-TOKEN` 或携带无效值
- **WHEN** 请求任意非安全方法
- **THEN** 响应状态码为 `403`
- **AND** `Content-Type` 为 `application/problem+json`
- **AND** 响应体包含 `code=ACCESS_DENIED`
- **AND** 不执行状态变更

### Requirement: 会话安全与会话 cookie

系统 SHALL 使用服务端 HTTP Session 保存认证状态，并使用 `JSESSIONID` cookie 关联会话；MUST NOT 使用 JWT 或浏览器存储的令牌。会话 cookie SHALL 为 `HttpOnly`、`SameSite=Lax`；会话默认空闲超时 SHALL 为 30 分钟；认证状态 MUST 只保存在服务端。

#### Scenario: 会话 cookie 属性

- **GIVEN** 用户登录成功
- **WHEN** 后端下发 `JSESSIONID`
- **THEN** cookie 标记为 `HttpOnly`
- **AND** cookie 的 `SameSite` 为 `Lax`
- **AND** 前端 JavaScript 不能读取该 cookie

#### Scenario: 会话过期后访问业务接口

- **GIVEN** 用户会话已达到空闲超时
- **WHEN** 客户端再次请求 `GET /api/greeting`
- **THEN** 响应状态码为 `401`
- **AND** `code=UNAUTHENTICATED`

### Requirement: 认证错误日志与敏感信息

系统 SHALL 记录认证失败事件用于排查，但 MUST NOT 在日志或错误响应中写入明文密码、密码哈希、会话 ID 或堆栈。对用户名不存在与密码错误 SHALL 返回相同的错误码与通用 `detail`，避免账号枚举。

#### Scenario: 登录失败不泄露账号状态

- **GIVEN** 用户提交不存在的用户名
- **WHEN** 登录失败
- **THEN** 响应 `code=INVALID_CREDENTIALS`
- **AND** `detail` 与密码错误场景一致
- **AND** 响应与日志不包含明文密码或密码哈希
