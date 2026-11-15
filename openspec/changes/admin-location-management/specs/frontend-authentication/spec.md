# Spec Delta

## ADDED Requirements

### Requirement: 前端认证用户状态包含角色
前端集中定义的当前用户数据 SHALL 包含用户名及 `USER` 或 `ADMIN` 角色；登录成功后的 auth query 缓存 SHALL 使用包含角色的用户数据。

#### Scenario: 查询认证用户角色
- **GIVEN** 前端通过 auth query 请求当前用户
- **WHEN** `GET /api/auth/me` 成功
- **THEN** auth query 数据包含用户名与角色
- **AND** 不包含认证敏感信息

#### Scenario: 登录后缓存管理员角色
- **GIVEN** 管理员登录成功
- **WHEN** 前端更新 auth query 缓存并导航
- **THEN** 缓存用户角色为 `ADMIN`
- **AND** 后续导航与路由授权可立即识别管理员身份
