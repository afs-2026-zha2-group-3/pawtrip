# Verification commands

三层停检命令（静态 → 运行时 → 系统）。自动化部分供 `/sdd:local-verify-report` 执行；系统层为可重复人工验收。

<!-- ai4se-verify-commands -->
npm run build
cd apps/server && ./mvnw test
CI=true npm run test:e2e

## Static

- `npm run build`：前端类型检查与生产构建。

## Runtime

- `cd apps/server && ./mvnw test`：后端上下文、认证与 `GET /api/greeting` 接口验收测试（临时 SQLite）。
- `CI=true npm run test:e2e`：启动隔离的前后端和临时 SQLite，通过 Playwright Chromium 验收认证浏览器流程；CI 先安装 Chromium 及系统依赖。

## System

1. 删除 `apps/server/data/pawtrip.db` 后启动后端，确认数据库文件自动创建且 `app_user` 为空。
2. 在根目录运行 `npm run seed:users`，确认测试账号写入。
3. 无 cookie `curl http://localhost:8080/api/greeting` 返回 `401` + `application/problem+json` + `code=UNAUTHENTICATED`。
4. 使用脚本账号登录后携带会话 cookie 请求 `GET /api/greeting`，返回 `200` 与 `{"message":"Hello World"}`。
5. 启动前端并访问 `http://localhost:3000/`：未登录跳转 `/login`；登录后展示同一文本且顶部出现“退出登录”。
