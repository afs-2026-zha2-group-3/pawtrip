---
id: kb.interfaces.frontend-backend-boundary
title: Pawtrip frontend and backend boundary
area: interfaces
---

# 前后端边界与接口约定

## 端口与运行时边界

- 开发时前端运行在 3000 端口，后端 Spring Boot 运行在 8080 端口。
- 前端基于 TanStack Start，自身也提供服务端能力；调用 Spring Boot 的接口必须使用可区分的路径前缀，避免与前端自身服务端路由冲突。
- 具体前缀尚未在架构层定稿；新增接口时在此登记路径、方法、请求与响应结构，并同步 `apps/server` 实现。

## 当前接口清单

暂无已实现的业务接口。首批需求见根目录 `TODO.md`（REQ-001 约定 `GET /api/greeting`）。

## 相关条目

- [架构概览](../architecture/README.md)
- [本地环境与常用命令](../operations/README.md)
