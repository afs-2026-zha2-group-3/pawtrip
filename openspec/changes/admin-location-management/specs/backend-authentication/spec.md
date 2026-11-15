# Spec Delta

## ADDED Requirements

### Requirement: 用户角色持久化与注入
系统 SHALL 为每个账号持久化 `USER` 或 `ADMIN` 角色；现有账号通过 schema migration 获得 `USER` 默认角色，迁移 MUST NOT 注入账号记录。开发/测试账号及管理员账号 SHALL 由 `scripts/seed-users.mjs` 注入并幂等更新。

#### Scenario: 升级已存在的用户表
- **GIVEN** 数据库已经执行现有账号表迁移
- **WHEN** 新 schema migration 添加角色字段
- **THEN** 原有账号角色默认为 `USER`
- **AND** 该迁移不插入管理员或其他账号记录

#### Scenario: 种子脚本注入管理员
- **GIVEN** 数据库已包含账号角色字段
- **WHEN** 开发者运行账号种子脚本
- **THEN** 普通开发账号写入 `USER` 角色
- **AND** 专用开发/测试管理员账号写入 `ADMIN` 角色
- **AND** 重复运行不会产生重复账号

### Requirement: 认证用户响应包含角色
登录成功响应与 `GET /api/auth/me` SHALL 返回当前用户的用户名和角色，且 MUST NOT 返回密码哈希或其他认证敏感信息。

#### Scenario: 登录成功返回角色
- **GIVEN** 用户使用有效凭据登录
- **WHEN** 登录成功响应返回
- **THEN** 响应包含用户名及 `USER` 或 `ADMIN` 角色
- **AND** 响应不包含密码哈希

#### Scenario: 查询当前用户角色
- **GIVEN** 用户持有有效会话
- **WHEN** 请求 `GET /api/auth/me`
- **THEN** 响应包含当前用户名及其持久化角色
- **AND** 响应不包含认证敏感信息

### Requirement: 管理 API 仅允许管理员
管理 API SHALL 要求已认证用户具有 `ADMIN` 角色；未认证请求 MUST 返回既有 `401 UNAUTHENTICATED` Problem Details，已认证但非管理员的请求 MUST 返回既有 `403 ACCESS_DENIED` Problem Details，且不得执行请求操作。

#### Scenario: 管理员访问管理 API
- **GIVEN** 请求用户已认证且角色为 `ADMIN`
- **WHEN** 用户调用管理 API
- **THEN** 请求通过角色授权并执行对应操作

#### Scenario: 普通用户访问管理 API
- **GIVEN** 请求用户已认证且角色为 `USER`
- **WHEN** 用户调用管理 API
- **THEN** 服务端返回 `403` 与 `code=ACCESS_DENIED`
- **AND** 不执行管理操作

#### Scenario: 未认证访问管理 API
- **GIVEN** 请求没有有效登录会话
- **WHEN** 用户调用管理 API
- **THEN** 服务端返回 `401` 与 `code=UNAUTHENTICATED`
- **AND** 不执行管理操作
