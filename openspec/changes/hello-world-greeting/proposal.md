## Why

PawTrip 当前只有前端与后端脚手架,尚无任何贯通数据层到页面的功能。需要一条最小但真实的全链路(数据库 → 后端接口 → 前端页面)来验证目标技术栈可用,并为后续功能提供可信基线。本次是仓库的首个 change。

对应需求:[REQ-001](../../../requirement-workspace/requirements/REQ-001-hello-world-home-page.md)。

## What Changes

- 新增 SQLite `greeting` 表,由 Flyway V1 迁移自动建表并种入一条 "Hello World" 记录
- 后端新增 `GET /api/greeting`,读取数据库并返回 `200` + `{"message":"Hello World"}`
- 前端首页由模板内容替换为最小页,请求同源 `/api/greeting` 并展示返回的 `message`
- 前端开发服务器新增 `/api` → `http://localhost:8080` 代理,后端不配置 CORS
- 无 **BREAKING** 变更

## Capabilities

### New Capabilities

- `greeting`:后端从 SQLite 读取问候语,并通过 `GET /api/greeting` 对外提供查询
- `home-page`:React 首页加载后展示接口返回的问候语文本

### Modified Capabilities

- 无。`openspec/specs/` 当前为空,本次为首个 change,所有能力均为新增。

## Impact

- **代码**:
  - `apps/server/pom.xml`、`application.yml`:新增 SQLite JDBC 与 Flyway 依赖和配置
  - `apps/server` 新增问候读取与 `GET /api/greeting` 实现
  - `apps/server/src/main/resources/db/migration/V1__create_greeting.sql`:建表与种子
  - `apps/web/vite.config.ts`:新增 `/api` 开发代理
  - `apps/web/src/routes/index.tsx`:替换为问候展示页
- **依赖**:SQLite JDBC 驱动、Flyway;具体版本与兼容性在实现前按官方文档核实
- **数据**:本地嵌入式 SQLite 文件,无需独立数据库服务;文件不应提交到 Git
- **不在范围**:多语言、问候语管理 UI、用户账户与权限、部署与 CI/CD、接口失败态处理
- **风险**:Spring Boot 4.1.2 与 SQLite/Flyway 的兼容性;TanStack Start SSR 期间的相对 URL 请求;种子迁移对已存在数据库文件的幂等性
- **工作量**:S(约 0.5–1 人日),详见 [impact brief](../../../requirement-workspace/impact-brief.md)
