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

