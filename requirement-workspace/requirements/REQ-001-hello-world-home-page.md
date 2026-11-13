---
id: REQ-001
title: Hello World 首页全链路
status: in-change
discovery: Go (2026-11-13)
impact: ../impact-brief.md
deep_dive: ../deep-dive.md
sources:
  - TODO.md
  - requirement-workspace/exploration/20261113-203130-service-blueprint.md
  - apps/server/pom.xml
  - apps/server/src/main/resources/application.yml
  - apps/web/src/routes/index.tsx
  - apps/web/vite.config.ts
---

# REQ-001: Hello World 首页全链路

## Discovery Decision

Go — 候选能力清晰:打通 SQLite `greeting` 表 → Spring Boot `GET /api/greeting` → React 首页展示的最小链路。`openspec/specs/` 当前为空,本次是首个 change,无既有能力冲突(2026-11-13)。

## 六字段

1. **id**:REQ-001
2. **statement**:为验证项目脚手架,首页展示的 "Hello World" 必须由后端从 SQLite 读取并通过 `GET /api/greeting` 提供,前端不得硬编码该文本。
3. **actors**:
   - 访客:打开首页,看到问候语
   - 前端应用 `apps/web`:请求接口并渲染
   - 后端应用 `apps/server`:提供接口并读取数据库
   - 开发者:首次启动后端以完成建库与种子
4. **rationale**:用最小可观察链路确认前端、后端、数据库三端在目标技术栈上贯通,为后续 PawTrip 功能提供可信基线。
5. **acceptance hints**:
   - 首次启动后端后 SQLite 文件自动创建,`greeting` 表包含一条 "Hello World" 记录
   - `GET /api/greeting` 返回 `200` 与 `{"message":"Hello World"}`
   - 启动前端并访问首页,页面显示接口返回的 "Hello World",文案不在前端硬编码
6. **links to evidence**:
   - [TODO.md](../../TODO.md) 的 REQ-001 小节
   - [exploration 蓝图](../exploration/20261113-203130-service-blueprint.md)
   - `apps/server/pom.xml`、`apps/server/src/main/resources/application.yml`
   - `apps/web/src/routes/index.tsx`、`apps/web/vite.config.ts`

## Ready 形状

### Intent

让访客在首页看到来自数据库的 "Hello World",以验证前后端与数据库全链路可用。

### Actors 与权限边界

- 访客(无认证)
- 前端 `apps/web`(展示方,不拥有数据)
- 后端 `apps/server`(接口与数据读取方)
- 开发者(本地启动与验收)

权限边界:无用户账户与权限体系(非目标)。

### In / Out Scope

**In**

- SQLite `greeting` 表、Flyway V1 迁移与种子数据
- Spring Boot `GET /api/greeting`
- React 首页最小页展示接口返回值
- 开发代理:`/api/*` → `http://localhost:8080`

**Out**

- 多语言支持
- 问候语管理 UI
- 用户账户与权限
- 后端不可用时的重试 / 降级 / 友好错误页(本次仅验收正常路径)
- 部署与 CI/CD

### Scenarios + AC Hints

**S1 首次启动建库**

- Given 本地尚无可用的 SQLite 数据库文件
- When 启动后端
- Then 自动创建数据库文件与 `greeting` 表,表中存在一条 "Hello World" 记录

**S2 接口读取**

- Given 后端已启动且种子记录存在
- When 客户端发起 `GET /api/greeting`
- Then 返回 `200`,响应体为 `{"message":"Hello World"}`

**S3 首页展示**

- Given 后端已启动
- When 访客打开 `http://localhost:3000/`
- Then 页面展示 "Hello World",该文本来自接口响应而不是前端常量

**Boundary**:本次不定义接口失败 / 超时时的前台行为(见 OQ-2)。

### Constraints

- 技术栈固定:React(TanStack Start,现有)、Spring Boot 4.1.2 / Java 21、SQLite(嵌入式)、Flyway
- 现有后端尚未引入 SQLite / JDBC / Flyway 依赖,需要补充
- 端口:前端 `3000`,后端 `8080`
- 开发期通过开发代理同源访问 `/api`,后端不配置 CORS
- 仓库结构:npm workspace(`apps/web`)+ Maven(`apps/server`)
- 规格先行:实现前需形成 OpenSpec change(@rule:spec-first)

### Context

PawTrip 当前只有脚手架,无业务功能;`openspec/specs/` 为空,本次是首个 change。前后台交接与界面呈现已在 explore 阶段与用户确认,详见 exploration 蓝图。

### Affected Capabilities

- **ADDED** `greeting`:SQLite `greeting` 表、Flyway 种子与 `GET /api/greeting` 查询
- **ADDED** `home-page`:首页经开发代理请求 `/api/greeting` 并展示 `message`

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 前后端如何交接? | — | Confirmed:开发代理 `/api` → 8080,后端不配 CORS(explore) |
| blocking | resolved | `GET /api/greeting` 响应格式? | — | Confirmed:JSON `{"message":"Hello World"}`(explore) |
| blocking | resolved | 首页如何呈现? | — | Confirmed:替换为最小页,仅展示接口返回值(explore) |
| blocking | resolved | 种子数据由谁写入? | — | Confirmed:Flyway V1 迁移写入(需求) |
| non-blocking | deferred | OQ-1 SQLite 数据库文件路径与命名,以及是否加入 `.gitignore`? | Dev | 后续解决;不影响拆分与影响面 |
| non-blocking | deferred | OQ-2 接口失败 / 超时时的前台行为是否需要在本次变更处理? | Product / Dev | 后续解决;当前按非目标处理 |
| non-blocking | deferred | OQ-3 `greeting` 表除 `id` + `message` 外是否还需要其他字段? | SA / Dev | 后续解决;单条记录场景倾向最小两列 |
| non-blocking | deferred | OQ-4 是否要求后端集成测试与前端组件测试? | QA / Dev | 后续解决;验收标准未提及测试层级 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| WARNING | deferred | `docs/knowledge/architecture/README.md` | 内容不完整,缺少数据库与接口说明,as-is 基线偏薄 | 实现完成后补充数据库、接口与运行拓扑说明 |
| SUGGESTION | deferred | `openspec/specs/` | Living Spec 为空,本次为首个 change | 在 impact brief 记录基线缺口,归档后建立首个 spec |

## Evidence / Verification Notes

- 现有前端首页为模板内容,无数据请求逻辑:`apps/web/src/routes/index.tsx`
- 现有 Vite 配置无代理:`apps/web/vite.config.ts`
- 现有后端仅 Web 依赖,无数据库依赖:`apps/server/pom.xml`
- 现有后端仅配置应用名与 8080 端口:`apps/server/src/main/resources/application.yml`
