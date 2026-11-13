# Architecture

## 仓库结构

前后端同仓，前端不独立成 npm 包发布。

```
pawtrip/
├─ apps/
│  ├─ web/      前端：Vite + TanStack Start
│  └─ server/   后端：Spring Boot（Maven）
├─ .agents/     本地 Agent 技能
├─ docs/        项目文档
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
- 前端自身包含 TanStack Start 服务端能力，与 Spring Boot 的接口需要明确区分路径前缀。

## 常用命令

在仓库根目录：

```bash
npm install          # 安装 workspace 依赖（含 apps/web）
npm run dev          # 启动前端（vite dev，端口 3000）
npm run build        # 前端生产构建
npm run preview      # 预览前端构建产物
```

后端：

```bash
cd apps/server
JAVA_HOME=/path/to/jdk-21 ./mvnw spring-boot:run
./mvnw package
```

## 编码约定

- 前端代码只放在 `apps/web`，后端代码只放在 `apps/server`。
- 共享文档放 `docs/`；Agent 技能放 `.agents/`。
- 不要手工修改 `apps/web/src/routeTree.gen.ts`。
