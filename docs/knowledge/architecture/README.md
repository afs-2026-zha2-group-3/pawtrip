---
id: kb.architecture.overview
title: Pawtrip architecture overview
area: architecture
---

# Pawtrip 架构概览

## 仓库结构

前后端同仓，前端不独立成 npm 包发布。

```text
pawtrip/
├─ apps/
│  ├─ web/      前端：Vite + TanStack Start
│  └─ server/   后端：Spring Boot（Maven）
├─ .agents/     本地 Agent 技能
├─ docs/        项目文档与知识库
└─ package.json npm workspace 根（Intent、脚本）
```

## 技术栈

### 前端（apps/web）

- Vite 8、React 19、TanStack Router / Start、Tailwind CSS 4
- 由 TanStack 官方 CLI 初始化，构建工具为 Vite
- 文件路由位于 `apps/web/src/routes`，`src/routeTree.gen.ts` 由插件生成

### 后端（apps/server）

- Spring Boot 4.1、Java 21、Maven Wrapper
- 启动类：`com.pawtrip.server.ServerApplication`
- 端口：8080

## 运行时模型

- 开发时前端独立运行在 3000 端口，后端运行在 8080 端口。
- 前端自身包含 TanStack Start 服务端能力，与 Spring Boot 的接口需要明确区分路径前缀，见[前后端边界](../interfaces/README.md)。

## 编码约定

- 前端代码只放在 `apps/web`，后端代码只放在 `apps/server`。
- 共享文档放 `docs/`；结构化项目知识放 `docs/knowledge/`；Agent 技能放 `.agents/`。
- 不要手工修改 `apps/web/src/routeTree.gen.ts`。

## 相关条目

- [前后端边界与接口约定](../interfaces/README.md)
- [本地环境与常用命令](../operations/README.md)
- [三方依赖与外部文档](../external/README.md)
