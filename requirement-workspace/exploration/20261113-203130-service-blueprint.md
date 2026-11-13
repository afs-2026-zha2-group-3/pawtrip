# Exploration — service-blueprint

- method: service-blueprint
- timestamp: 2026-11-13T20:30:00+08:00
- participants / assumptions: 与用户确认切片范围、前后端交接方式、首页呈现、接口响应格式；仓库现状来自 `apps/server` 与 `apps/web` 源码阅读
- persist: file

## Method outcome

### 切片（Slice）

开发者首次启动后端（自动建库并种入 Hello World）→ 访客打开首页 → 页面显示 Hello World。

范围：正常路径，不含接口失败与重试。

### 前台步骤（Frontstage）

| # | 用户可见步骤 | 说明 |
|---|---|---|
| F1 | 访问首页 | 浏览器打开 `http://localhost:3000/` |
| F2 | 页面骨架出现 | TanStack Start 返回页面，根布局（Header/Footer）与首页路由挂载；首页内容替换为最小页 |
| F3 | 自动获取问候语 | 首页向同源 `/api/greeting` 发起 GET；开发服务器把 `/api/*` 代理到 `http://localhost:8080` |
| F4 | 看到 Hello World | 接口返回 `{"message":"Hello World"}` 后，首页渲染该文本 |

加载等待期间的可见反馈尚未决定，归入 Assumption，由实现时按最简方式处理（例如显示占位文本）。

### 后台步骤（Backstage）

| 对应前台步骤 | 后台动作 | 支撑系统 | 标签 |
|---|---|---|---|
| F1–F2 | 提供页面与热更新 | Vite + TanStack Start（端口 3000） | Confirmed（现有骨架） |
| F1–F2 | 将 `/api` 代理到后端 | Vite dev proxy（待新增） | Confirmed（用户选择） |
| F3 | 接收 `GET /api/greeting`，返回 JSON | Spring Boot Controller（待新增） | Confirmed（需求） |
| F3 | 读取 `greeting` 表中唯一记录 | Repository/JDBC + SQLite | Confirmed（需求）；访问方式 Candidate |
| 后端首次启动 | 创建 `greeting` 表并插入 Hello World | Flyway migration + SQLite 文件 | Confirmed（需求）；文件路径 Assumption |
| F4 | 解析响应并渲染 | 首页组件的 fetch 调用 | Confirmed（用户选择） |

### 支撑流程 / 系统

- 构建与启动：`cd apps/server && mvnw spring-boot:run`；根目录 `npm run dev` 启动前端。
- SQLite 为嵌入式文件库，不需要独立数据库服务；数据库文件不应提交到 Git（Assumption：放在 `apps/server/` 下的数据目录并加入 `.gitignore`）。
- 接口契约：`GET /api/greeting` → `200 OK`，响应体 `{"message":"Hello World"}`（用户确认）。
- 现有后端 POM 尚未引入 SQLite/JDBC/Flyway 依赖；现有 `application.yml` 只配置了 8080 端口。

## Findings

### Confirmed

- 需求 REQ-001 的验收链路：SQLite `greeting` 表 → Spring Boot `GET /api/greeting` → React 首页展示。
- 开发阶段前后端通过 Vite/TanStack Start 开发代理交接，后端不配置 CORS。
- 首页替换为最小页，只呈现接口返回的 Hello World。
- 接口响应使用 JSON 对象 `{"message":"Hello World"}`。
- 现有前端为 TanStack Start + React 19；后端为 Spring Boot 4.1.2（Java 21），尚无数据库相关依赖。

### Assumption

- SQLite 文件路径与文件名（建议 `apps/server/data/pawtrip.db`），并加入 `.gitignore`。
- 加载期间显示简短占位文本；接口失败不在本次正常路径验收范围。
- 种子数据由 Flyway V1 migration 插入，而不是由应用启动代码写入。
- 前端在首页组件内用 fetch 获取，不引入数据请求库。

### Candidate

- 后端数据访问选用 JdbcTemplate / Spring Data JDBC / JPA 之一，P1 pre-spec 时定为最小方案。
- `greeting` 表结构（仅 id + message，还是带时间戳等字段）；非目标已排除多语言，倾向最小两列。
- 是否增加后端集成测试（Spring Boot + 临时 SQLite）与前端组件测试。

## Stop / continue

- Decision: continue to Pre-SDD
- Notes: 交接点已清楚，剩余为实现选型；无阻塞性冲突。

## Next

- Suggested: `/sdd:pre-spec-workdir` 和/或 `/sdd:pre-spec-req`
