# frontend-api-request Specification

## Purpose
定义前端 HTTP 请求与错误呈现约定：统一 request 层、typed `ApiError`、按错误类型重试与路由级错误 UI。
## Requirements
### Requirement: 服务端请求统一经过 request 层

前端 SHALL 通过统一 `request` 层发起服务端请求。查询函数与组件 MUST NOT 直接调用 `fetch` 处理 HTTP 细节。

#### Scenario: 首页查询使用 request

- **GIVEN** 首页需要请求 `/api/greeting`
- **WHEN** TanStack Query 执行 `queryFn`
- **THEN** `queryFn` 调用统一 `request` 层
- **AND** 组件与 query options 中不存在直接 `fetch` 调用

### Requirement: 统一 typed ApiError

前端 SHALL 将非 2xx 响应解析为 typed `ApiError`,包含 `status`、`code`、`detail`、`instance` 与 `isRetryable`;网络错误与超时 SHALL 映射为可识别的 `ApiError`。

#### Scenario: 404 解析为 ApiError

- **GIVEN** 后端返回 `404` + `application/problem+json`
- **WHEN** `request` 解析响应
- **THEN** 抛出 `ApiError`
- **AND** `status=404`、`code=GREETING_NOT_FOUND`
- **AND** 错误可被路由错误页读取

#### Scenario: 网络错误

- **GIVEN** 请求因网络失败或超时未完成
- **WHEN** `request` 捕获底层错误
- **THEN** 抛出 `ApiError`
- **AND** `isRetryable=true`

### Requirement: 按错误类型重试

前端 SHALL 仅对网络错误与 5xx 重试,最多 2 次;4xx MUST NOT 自动重试。

#### Scenario: 4xx 不重试

- **GIVEN** 后端返回 `400` 或 `404`
- **WHEN** TanStack Query 评估重试
- **THEN** 不发起重试请求
- **AND** 错误直接进入错误呈现

#### Scenario: 5xx 有限重试

- **GIVEN** 后端返回 `500` 或网络失败
- **WHEN** 重试次数小于 2
- **THEN** TanStack Query 按策略重试
- **AND** 超过 2 次后停止

### Requirement: 请求可取消

前端 SHALL 将 TanStack Query 提供的 `AbortSignal` 传入 `request`;查询卸载或失效时 MUST 取消未完成请求。

#### Scenario: 卸载时取消

- **GIVEN** 首页请求尚未完成
- **WHEN** 页面卸载或查询变为非活跃
- **THEN** 底层 `fetch` 收到 abort
- **AND** 不产生未处理的请求错误

### Requirement: 路由级错误呈现

前端 SHALL 为首次加载失败提供路由级错误页与重试入口,并保留后台刷新失败时的缓存数据;根路由 SHALL 提供 `notFoundComponent`。

#### Scenario: 首次加载失败

- **GIVEN** 首页首次请求失败且无缓存数据
- **WHEN** 查询进入错误状态
- **THEN** 路由 `errorComponent` 展示错误信息与重试按钮
- **AND** 不渲染空白成功态

#### Scenario: 后台刷新失败

- **GIVEN** 首页已有缓存问候语
- **WHEN** 后台重新请求失败
- **THEN** 页面保留已缓存的问候语
- **AND** 错误被记录,不进入阻断式错误页

#### Scenario: 未知路由

- **GIVEN** 访客访问不存在的路由
- **WHEN** 路由匹配失败
- **THEN** 展示根路由 `notFoundComponent`
- **AND** 不出现默认裸 "Not Found"

### Requirement: 全局错误日志

前端 SHALL 通过 `QueryCache` / `MutationCache` 的 `onError` 统一记录错误;本次 MUST NOT 引入 toast 依赖。

#### Scenario: 查询错误记录

- **GIVEN** 任意查询失败
- **WHEN** QueryCache 的 `onError` 触发
- **THEN** 错误被记录
- **AND** 不弹出 toast

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

