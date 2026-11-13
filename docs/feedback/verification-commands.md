# Verification commands

三层停检命令（静态 → 运行时 → 系统）。自动化部分供 `/sdd:local-verify-report` 执行；系统层为可重复人工验收。

<!-- ai4se-verify-commands -->
npm run build
cd apps/server && ./mvnw test

## Static

- `npm run build`：前端类型检查与生产构建。

## Runtime

- `cd apps/server && ./mvnw test`：后端上下文测试与 `GET /api/greeting` 接口验收测试（临时 SQLite）。

## System

1. 删除 `apps/server/data/pawtrip.db` 后启动后端，确认数据库文件自动创建。
2. `curl http://localhost:8080/api/greeting` 返回 `200` 与 `{"message":"Hello World"}`。
3. 启动前端并访问 `http://localhost:3000/`，页面展示同一文本。
4. 修改数据库 `message` 后刷新首页，确认展示随接口变化；验证后删除数据库文件并重启恢复。
