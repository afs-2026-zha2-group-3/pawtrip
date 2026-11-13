# Pawtrip

前后端同仓项目。

```
apps/
├─ web/     Vite / TanStack Start 前端
└─ server/  Spring Boot 后端（Maven）
```

## 环境要求

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- JDK 21（后端）。使用 scoop 时可执行 `scoop reset corretto21-jdk`，或为 Maven 命令显式指定 `JAVA_HOME`。

## 安装

在仓库根目录执行：

```bash
npm install
```

## 开发

```bash
# 前端：http://localhost:3000
npm run dev

# 后端：http://localhost:8080
cd apps/server
mvnw spring-boot:run
```

## 构建

```bash
npm run build     # 前端生产构建
npm run preview   # 预览构建产物
```

后端打包：

```bash
cd apps/server
mvnw package
```

更多约定见 [docs/architecture.md](docs/architecture.md)。
