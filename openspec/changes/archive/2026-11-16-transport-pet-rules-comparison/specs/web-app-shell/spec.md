# Spec Delta

## ADDED Requirements

### Requirement: 交通规则导航 Tab

应用 SHALL 为所有已登录用户在顶部导航提供「交通规则」Tab，位置在「城市浏览」之后、管理员专属 Tab 之前，并与 `/transport-rules` 路由同步；该 Tab MUST 对所有已登录用户可见，MUST NOT 仅限管理员。

#### Scenario: 已登录用户看到交通规则 Tab

- **WHEN** 已登录用户查看顶部导航
- **THEN** 导航显示「交通规则」Tab
- **AND** 该 Tab 位于「城市浏览」之后

#### Scenario: 选择交通规则 Tab

- **WHEN** 用户点击「交通规则」Tab
- **THEN** 浏览器地址变为 `/transport-rules`
- **AND** 「交通规则」Tab 处于选中状态

#### Scenario: 直接访问交通规则路由

- **WHEN** 已登录用户直接访问 `/transport-rules`
- **THEN** 「交通规则」Tab 处于选中状态
- **AND** 其他 Tab 不处于选中状态

#### Scenario: 普通用户同样可见

- **WHEN** 当前用户角色为 `USER`
- **THEN** 顶部导航仍显示「交通规则」Tab

### Requirement: 交通规则页面路由守卫

`/transport-rules` SHALL 仅允许已认证用户访问；前端路由守卫 MUST 在未登录时跳转 `/login`，且 MUST NOT 展示规则页面内容。

#### Scenario: 未登录用户访问交通规则路由

- **WHEN** 浏览器没有有效登录会话且访问 `/transport-rules`
- **THEN** 用户被引导到 `/login`
- **AND** 规则页面内容不显示
