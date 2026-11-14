# Design

## Context

参见 `proposal.md` 的动机。当前前端 Vite 服务默认监听 3000 并将 `/api` 代理到 8080；Spring Boot 默认使用 `apps/server/data/pawtrip.db`，种子脚本支持显式传入数据库路径。E2E 覆盖现有 `frontend-authentication`、`backend-authentication`、`home-page` 与 `greeting` 契约，不改变业务 API。

## Goals / Non-Goals

**Goals:**
- 本地和 CI 通过一个入口启动/停止前后端、准备种子数据并运行同一套浏览器测试。
- 通过独立端口和系统临时目录中的 SQLite 文件，避免连接或改写开发服务器与开发数据库。
- 本地有头调试、CI 无头执行，失败能保留 Playwright 诊断材料。

**Non-Goals:**
- 不增加第二、第三种浏览器项目或视觉截图基线。
- 不改变认证、首页或后端 API 的业务行为。
- 不覆盖部署环境或真实外部服务。

## Decisions

1. **在根工作区管理 Playwright 与跨端测试。** E2E 同时依赖 `apps/web`、`apps/server` 和根目录种子脚本，因此在根目录固定 Playwright 版本、放置测试配置，并集中定义运行命令；首期仅运行 Chromium。独立放进前端 workspace 会让跨服务环境编排和仓库级命令更分散。
2. **使用一个 Node 编排脚本管理测试生命周期。** 脚本为每次运行创建系统临时目录中的全新数据库，使用独立后端/前端端口启动 Spring Boot 和 Vite；后端迁移完成后，显式将种子脚本指向该数据库，再运行测试并停止子进程、删除临时数据。相比要求开发者手动启动服务或复用 `data/pawtrip.db`，这能让隔离成为默认行为，而不只是文档约定。
3. **通过可选环境变量配置前端 API 代理目标。** 普通开发仍默认代理 `http://localhost:8080`；E2E 启动 Vite 时将代理指向独立测试后端端口。测试前端走真实同源 API 路径，不直接绕过 UI 或用网络 mock 替代认证。
4. **本地 Chrome 与 CI Chromium 分别运行同一套测试。** 本地 headed 命令通过 Playwright 的 `channel: "chrome"` 使用机器已安装的 Google Chrome，不需要下载 Playwright 浏览器二进制；CI 不设置该 channel，使用 CI 步骤安装的 Playwright Chromium 并无头运行。CI 固定单 worker，失败保留 trace、截图/报告并上传 artifact。CI 使用独立工作流覆盖前端、后端、E2E、种子脚本、依赖和工作流文件的变更。
5. **使用现有测试账号种子脚本，但绝不使用其默认数据库。** 编排脚本始终传入临时数据库绝对路径；若测试环境启动失败，不回退到默认数据库或重用已有服务。

## Risks / Trade-offs

- [CI 安装 Playwright Chromium 会增加浏览器下载和工作流时间] → 仅在 CI 安装 Chromium 及 Linux 依赖；本地 headed 直接使用已安装的 Google Chrome，不要求重复下载浏览器。
- [后端启动和数据库迁移比纯前端测试慢] → 单次测试运行只启动一次后端，等待明确的 API 就绪响应后再播种与执行。
- [本地未安装 Google Chrome 时 headed 命令无法启动] → 在中文文档中明确 Chrome 是本地 headed 的前置条件，并在启动失败时保留 Playwright 的可读错误。
- [固定测试端口可能与其他进程冲突] → 使用与日常开发端口不同的端口并启用严格端口检查；发生冲突时快速失败，不复用已有服务。
- [清理临时数据或进程时可能遇到中断] → 在正常退出、错误和信号处理路径中停止受管子进程并清除本次临时目录；开发数据库不在清理范围内。
- [Node 文档版本与种子脚本能力不一致] → E2E 本地文档声明 Node 24+，并指出现有种子脚本依赖 Node 内置 `node:sqlite`。

## Migration Plan

无需迁移生产数据或改动生产配置。本地安装根目录 npm 依赖并确保机器已有 Google Chrome，即可运行 headed 测试；本地无头运行才需额外安装 Playwright Chromium。CI 在 Ubuntu 上安装 Playwright Chromium 及系统依赖。回滚时移除 E2E 工作流、脚本和开发依赖即可；运行时 SQLite 文件位于系统临时目录并由脚本清理。
