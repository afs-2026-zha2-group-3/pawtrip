# Tasks

## 1. Playwright 与隔离测试环境

- [x] 1.1 在根工作区固定 Playwright 依赖、添加运行命令与 Chromium 配置，并实现临时 SQLite 数据库及前后端子进程编排；验证 E2E 启动使用独立端口/临时数据库且启动失败不会回退到开发数据库。
- [x] 1.2 将 Vite API 代理目标改为可由 E2E 环境覆盖、开发环境仍默认指向 8080；验证现有开发启动配置保持原值且 E2E 请求代理到独立后端。

## 2. 用户流程测试与本地文档

- [x] 2.1 添加访客跳转、错误登录、成功登录后刷新保持会话、登出后再次拦截四个浏览器场景；使用系统 Chrome 本地 headed 和 Playwright Chromium headless 验证全部通过。
- [x] 2.2 在中文 README 补充 Node 24+、本地已安装 Chrome 前置条件、运行命令及临时数据库隔离说明；注明 `npm install` 不安装浏览器，按文档命令运行 E2E 并确认开发数据库不变。

## 3. CI 接入与集成验证

- [x] 3.1 新增独立 E2E GitHub Actions 工作流，覆盖前后端与 E2E 相关路径、安装 Node/Java/Chromium、运行无头测试并上传诊断 artifact；验证工作流 YAML 与触发路径包含两端代码和测试配置。
- [x] 3.2 执行 `openspec validate add-playwright-e2e --strict`、前端构建及 CI 模式 E2E，确认规格、构建和端到端链路均通过。
