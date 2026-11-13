# Verification matrix

| Area | Check | Command / evidence | Owner |
|---|---|---|---|
| Frontend build | TypeScript/SSR 构建 | `npm run build` | Dev |
| Backend runtime | 上下文 + API 验收测试 | `cd apps/server && ./mvnw test` | Dev |
| Database | 冷启动建库与种子 | `apps/server/data/pawtrip.db` + `greeting` 表 | Dev |
| API contract | `GET /api/greeting` | `curl -D - http://localhost:8080/api/greeting` | Dev |
| Homepage | 展示接口文本并随数据变化 | 浏览器访问 `http://localhost:3000/` | QA |
| Non-goals | 无鉴权/无 CORS/无失败态 UI | API 响应头、页面快照 | QA |
