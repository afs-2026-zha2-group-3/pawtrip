> 关联:[design.md](design.md) · [atdd-design.md](atdd-design.md) · Delta Spec:[greeting](specs/greeting/spec.md) / [home-page](specs/home-page/spec.md)
>
> 负责人:**Dev**=实现负责人;**QA**=验收核对;**IO**=需求与集成负责人。

## 1. 后端依赖与持久化(Dev)

- [x] 1.1 按官方文档核实 SQLite JDBC 驱动与 Flyway 的依赖坐标、版本及 SQLite 支持模块,并加入 `apps/server/pom.xml`
- [x] 1.2 在 `apps/server/src/main/resources/application.yml` 配置 SQLite 数据源与 Flyway;将数据库目录 `apps/server/data/` 加入 `.gitignore`
- [x] 1.3 新增 `V1__create_greeting.sql`,创建 `greeting` 表并插入 "Hello World"

## 2. 后端问候接口:验收测试先行(Dev)

- [x] 2.1 先编写 `GreetingApiTest`(API 验收层),使用临时 SQLite 启动上下文,断言 `GET /api/greeting` 的 `200`、`Content-Type: application/json` 与 `$.message == "Hello World"`;确认实现缺失时测试失败(红)
- [x] 2.2 实现问候语读取与 `GET /api/greeting`,返回 `{"message":"Hello World"}`,使 2.1 的测试通过(绿)
- [x] 2.3 运行后端测试,并手工请求接口确认状态码、响应头与响应体符合预期

## 3. 前端首页(Dev;QA 核对)

- [x] 3.1 在 `apps/web/vite.config.ts` 增加 `/api` → `http://localhost:8080` 开发代理
- [x] 3.2 将 `apps/web/src/routes/index.tsx` 替换为最小页,客户端请求 `/api/greeting` 并展示 `message`
- [x] 3.3 执行 E2E-2 / E2E-3:浏览器访问首页确认展示 "Hello World";修改数据库 `message` 并刷新,确认展示随接口变化,随后恢复干净数据库

## 4. 非目标反向验证(QA;Dev 配合)

- [x] 4.1 确认首页无语言切换与问候语管理控件,且只展示接口返回的单一文本
- [x] 4.2 确认不带凭证请求 `GET /api/greeting` 仍返回 `200`,系统无登录门槛
- [x] 4.3 确认后端停止时页面无重试按钮或降级提示,且后端响应无 CORS 头,浏览器经同源代理访问

## 5. 验证与文档(Dev;IO 复核)

- [x] 5.1 更新 `README.md`,补充启动顺序、数据库文件位置与接口验收方式
- [x] 5.2 补充 `docs/knowledge` 中的 SQLite/Flyway 配置与架构说明
- [x] 5.3 端到端验收:冷启动建库(E2E-1)、首页展示(E2E-2)、内容跟随(E2E-3)全部通过;运行后端测试与前端构建无回归;记录验证结果
