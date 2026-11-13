---
id: kb.operations.local-runbook
title: Pawtrip local environment and commands
area: operations
---

# 本地环境与常用命令

## 环境要求

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- JDK 21（后端）。使用 scoop 时可执行 `scoop reset corretto21-jdk`，或为 Maven 命令显式指定 `JAVA_HOME`。

## 安装

在仓库根目录执行：

```bash
npm install
```

## 常用命令

前端：

```bash
npm run dev          # 启动前端（vite dev，端口 3000）
npm run build        # 前端生产构建
npm run preview      # 预览前端构建产物
```

后端：

```bash
cd apps/server
JAVA_HOME=/path/to/jdk-21 ./mvnw spring-boot:run   # 端口 8080
./mvnw package
```

## 相关条目

- [架构概览](../architecture/README.md)
- [三方依赖与外部文档](../external/README.md)
