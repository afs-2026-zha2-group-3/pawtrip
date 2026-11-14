# browser-e2e-testing Specification

## Purpose

为 PawTrip 的关键用户旅程提供可重复的真实浏览器端到端验证，并保证本地开发与 CI 使用隔离、可诊断的测试环境。

## Requirements

### Requirement: 关键认证旅程浏览器验证

E2E 测试 SHALL 通过真实浏览器验证访客访问、登录失败、登录成功、会话保持及登出等关键用户可见行为。

#### Scenario: 访客访问受保护首页
- **GIVEN** 浏览器没有有效登录会话
- **WHEN** 访客打开首页
- **THEN** 页面最终导航到登录页
- **AND** 不展示受保护的问候内容

#### Scenario: 错误凭据登录
- **GIVEN** 浏览器位于登录页
- **WHEN** 用户提交无效凭据
- **THEN** 页面显示通用登录失败提示
- **AND** 用户仍停留在登录页

#### Scenario: 登录并刷新页面
- **GIVEN** 测试数据库中存在可用测试账号
- **WHEN** 用户成功登录并刷新首页
- **THEN** 页面展示后端提供的问候语
- **AND** 刷新后仍保持已登录状态

#### Scenario: 登出后访问受保护页面
- **GIVEN** 用户已登录并位于首页
- **WHEN** 用户登出后再次打开首页
- **THEN** 页面导航到登录页
- **AND** 不展示受保护内容

### Requirement: E2E 数据与开发数据库隔离

E2E 环境 SHALL 使用独立于本地开发环境的 SQLite 数据库；创建、种子写入、重置和清理 E2E 数据 MUST NOT 修改开发数据库。

#### Scenario: 准备 E2E 数据
- **GIVEN** 本地开发数据库中已有用户数据
- **WHEN** E2E 环境启动并创建测试账号
- **THEN** 测试账号只写入 E2E 专用数据库
- **AND** 开发数据库及其数据保持不变

#### Scenario: 重置 E2E 数据
- **GIVEN** E2E 专用数据库已存在
- **WHEN** 测试环境为下一次运行重置数据库
- **THEN** 只删除或重建 E2E 专用数据库
- **AND** 不删除、不覆盖或重置开发数据库

### Requirement: 本地与 CI 运行模式一致

本地与 CI SHALL 运行相同的 E2E 用例。本地有头命令 MUST 使用机器上已安装的 Google Chrome，且 MUST NOT 要求安装 Playwright 管理的浏览器二进制；CI SHALL 使用 Playwright 管理的 Chromium 以无头模式运行，且测试失败 SHALL 使 CI 检查失败。

#### Scenario: 本地使用系统 Chrome 有头运行
- **GIVEN** 开发者已安装项目 npm 依赖和 Google Chrome
- **WHEN** 开发者运行 `npm run test:e2e:headed`
- **THEN** 测试使用机器上安装的 Google Chrome 以有头模式执行
- **AND** 不要求安装 Playwright 管理的浏览器二进制

#### Scenario: CI 使用 Playwright Chromium 无头门禁
- **GIVEN** 相关应用、测试、依赖或 E2E 配置发生变更
- **WHEN** CI 在推送或 Pull Request 上运行 E2E 检查
- **THEN** 相同测试使用 Playwright 管理的 Chromium 以无头模式执行
- **AND** 任一测试失败时工作流失败
- **AND** 失败诊断材料可供查看
