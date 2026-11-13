---
id: kb.architecture.overview
title: Pawtrip architecture overview
area: architecture
---

# Pawtrip 架构概览

## 仓库结构

```text
pawtrip/
├─ apps/
│  ├─ web/      frontend: npm repo
│  └─ server/   backend: maven repo
└─ package.json npm workspace
```

## 技术栈

### 前端（apps/web）

- Vite 8、React 19、TanStack Router / Start、Tailwind CSS 4
- shadcn/ui

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080
- 数据访问：`spring-boot-starter-flyway`（含 JDBC 与 Flyway 12.4.0）
- 数据库：SQLite 文件 `apps/server/data/pawtrip.db`，由 Flyway `V1` 迁移建表并种入初始数据
- 数据库文件属于本地运行产物，已由 `.gitignore` 排除

## 运行拓扑

```text
Browser (http://localhost:3000)
   │  GET /api/greeting
   ▼
Vite dev server ── /api proxy ──▶ Spring Boot (http://localhost:8080)
                                      │
                                      ▼
                              SQLite apps/server/data/pawtrip.db
```

## 数据与接口

- `greeting` 表：`id INTEGER PRIMARY KEY`、`message TEXT NOT NULL`；当前单条记录由迁移写入。
- `GET /api/greeting`：读取单条问候语，返回 `200` + `application/json` + `{"message":"Hello World"}`。
- 首页在客户端挂载后请求同源 `/api/greeting`，仅展示响应中的 `message`，不在前端硬编码文案。

## 测试与验证

- 后端：`cd apps/server && ./mvnw test`，包含使用临时 SQLite 文件的接口验收测试。
- 前端：根目录 `npm run build`。
- 端到端：冷启动后端后确认数据库文件与接口，再启动前端确认首页展示；失败态与 CORS 不在当前范围。
- 