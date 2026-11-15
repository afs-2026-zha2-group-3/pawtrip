# Spec Delta

## ADDED Requirements

### Requirement: 管理员地点管理导航 Tab
应用 SHALL 为 `ADMIN` 用户在顶部导航提供“地点管理”Tab，并与管理员地点管理路由同步；非管理员 SHALL NOT 在顶部导航看到该 Tab。

#### Scenario: 管理员看到地点管理 Tab
- **GIVEN** 当前用户已登录且角色为 `ADMIN`
- **WHEN** 应用顶部导航渲染
- **THEN** 导航显示“地点管理”Tab
- **AND** 选择该 Tab 导航到 `/admin/locations`

#### Scenario: 普通用户不看到地点管理 Tab
- **GIVEN** 当前用户已登录且角色为 `USER`
- **WHEN** 应用顶部导航渲染
- **THEN** 导航不显示“地点管理”Tab

#### Scenario: 管理员页面的导航选中状态
- **GIVEN** 管理员当前位于 `/admin/locations`
- **WHEN** 顶部导航渲染
- **THEN** “地点管理”Tab 处于选中状态

### Requirement: 管理员页面路由守卫
管理员地点管理路由 SHALL 仅允许已认证且角色为 `ADMIN` 的用户访问；前端路由守卫 SHALL 与后端管理 API 授权相互独立。

#### Scenario: 普通用户直接访问管理员路由
- **GIVEN** 当前用户已认证且角色为 `USER`
- **WHEN** 用户直接访问 `/admin/locations`
- **THEN** 管理页面内容不显示
- **AND** 用户返回普通受保护页面

#### Scenario: 未登录用户访问管理员路由
- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 用户访问 `/admin/locations`
- **THEN** 用户被引导到 `/login`
- **AND** 管理页面内容不显示
