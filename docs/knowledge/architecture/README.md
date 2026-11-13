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
- 文件路由位于 `apps/web/src/routes`，`src/routeTree.gen.ts` 由插件生成

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080
- 