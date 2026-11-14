# Proposal

## Why

现有后端测试覆盖了认证 API，但尚未验证真实浏览器中的路由跳转、CSRF Cookie、服务端会话与前后端代理能否协同工作。为关键登录流程增加 Playwright E2E，可在本地可视化调试，并在 CI 中作为跨端回归门禁。

## What Changes

- 在仓库根目录加入固定版本的 Playwright 测试依赖与 E2E 命令。本地有头运行使用机器上已安装的 Google Chrome，不要求额外安装 Playwright 浏览器；CI 安装 Playwright 管理的 Chromium 并以无头方式执行同一组测试。
- 为访客跳转、错误登录、成功登录/刷新会话、登出等关键用户流程增加浏览器测试。
- E2E 使用专用 SQLite 数据库和测试账号，禁止清理或复用开发数据库。
- 新增独立 CI 工作流，启动前后端、初始化专用测试数据库、安装 Chromium 并运行 E2E；失败时保留诊断报告。
- 补充中文开发文档，说明本地 Chrome、CI 浏览器安装、本地运行和数据库隔离方式。

## Capabilities

### New Capabilities
- `browser-e2e-testing`: 定义 PawTrip 关键浏览器用户流程的 E2E 覆盖、本地/CI 运行方式及测试数据隔离要求。

### Modified Capabilities

无。

## Impact

- 依赖及命令：根目录 `package.json`、`package-lock.json`。
- 新增 Playwright 配置与 E2E 测试/环境启动脚本。
- 新增 GitHub Actions E2E 工作流，涉及 Node 24、Java 21、SQLite、Chromium。
- 更新中文开发文档；不修改现有业务 API 或生产数据库行为。
