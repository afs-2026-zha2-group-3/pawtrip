## 1. 后端持久化与种子

- [ ] 1.1 按官方文档核实 SQLite JDBC 驱动与 Flyway 的依赖坐标、版本及 SQLite 支持模块,并加入 `apps/server/pom.xml`
- [ ] 1.2 在 `apps/server/src/main/resources/application.yml` 配置 SQLite 数据源与 Flyway;将数据库文件路径加入 `.gitignore`
- [ ] 1.3 新增 `V1__create_greeting.sql`,创建 `greeting` 表并插入 "Hello World"
- [ ] 1.4 启动后端,确认数据库文件、`greeting` 表与种子记录自动生成

## 2. 后端问候接口

- [ ] 2.1 实现问候语读取与 `GET /api/greeting`,返回 `{"message":"Hello World"}`
- [ ] 2.2 请求接口,确认状态码 `200`、`Content-Type: application/json` 与响应体符合预期

## 3. 前端首页

- [ ] 3.1 在 `apps/web/vite.config.ts` 增加 `/api` → `http://localhost:8080` 开发代理
- [ ] 3.2 将 `apps/web/src/routes/index.tsx` 替换为最小页,客户端请求 `/api/greeting` 并展示 `message`
- [ ] 3.3 浏览器访问首页确认展示 "Hello World";修改数据库中的 `message` 并刷新,确认展示随接口变化

## 4. 验证与文档

- [ ] 4.1 运行后端测试与构建、前端构建,确认无回归
- [ ] 4.2 更新 `README.md`,补充启动顺序、数据库文件位置与接口验收方式
- [ ] 4.3 补充 `docs/knowledge` 中的 SQLite/Flyway 配置与架构说明
