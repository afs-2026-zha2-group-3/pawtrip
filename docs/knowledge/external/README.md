---
id: kb.external.references
title: Pawtrip external dependencies and docs
area: external
---

# 三方依赖与外部文档

## Frontend

### Tanstack

Use the repository's installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `npm exec --no -- intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npm exec --no -- intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

### UI

#### shadcn/ui

- llm index: https://www.shadcn.com.cn/llms.txt
- local skill: [`.agents/skills/shadcn/SKILL.md`](../../../.agents/skills/shadcn/SKILL.md)

## Backend

### Spring Boot 4.1.2

- 依赖版本由 `spring-boot-dependencies:4.1.2` 统一管理。
- 文档:https://docs.spring.io/spring-boot/

### Spring Data JPA / Hibernate / Flyway / SQLite

- `spring-boot-starter-data-jpa`:引入 Spring Data JPA、Hibernate 与事务管理;Hibernate 版本由 Spring Boot BOM 管理(`7.4.13.Final`)。
- `org.hibernate.orm:hibernate-community-dialects`:提供 `org.hibernate.community.dialect.SQLiteDialect`,版本同样由 Spring Boot BOM 管理,无需显式写版本。
- `org.xerial:sqlite-jdbc`:版本由 Spring Boot 管理(`3.53.4.0`),驱动类 `org.sqlite.JDBC`。
- Flyway `12.4.0` 的 `flyway-core` 已注册 SQLite 支持,无需额外的 database 模块;schema 仍由 Flyway 管理,JPA `ddl-auto=none`。
- 迁移目录:`apps/server/src/main/resources/db/migration`;数据库文件:`apps/server/data/pawtrip.db`。
- 文档:
  - Spring Data JPA:https://docs.spring.io/spring-data/jpa/reference/
  - Hibernate 7.4:https://hibernate.org/orm/documentation/7.4/
  - hibernate-community-dialects:https://repo1.maven.org/maven2/org/hibernate/orm/hibernate-community-dialects/
  - Flyway:https://documentation.red-gate.com/flyway
  - SQLite JDBC:https://github.com/xerial/sqlite-jdbc

### 错误响应:Problem Details

- 错误响应采用 RFC 9457 Problem Details(`application/problem+json`),通过 Spring `ProblemDetail` 与 `ResponseEntityExceptionHandler` 输出,扩展稳定字段 `code`。
- 配置 `spring.mvc.problemdetails.enabled=true`,使框架内建异常使用同一格式。
- 文档:
  - RFC 9457:https://www.rfc-editor.org/rfc/rfc9457
  - Spring MVC Problem Details:https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html

### TanStack Query

- `@tanstack/react-query`:服务端状态、缓存与请求生命周期管理。
- `@tanstack/react-router-ssr-query`:TanStack Start 的 SSR 集成,在 `getRouter` 内创建 `QueryClient` 并接入 router context。
- 约定:query key 与 query function 集中定义在 `apps/web/src/queries/`;页面组件使用 `useQuery`,不使用 `useEffect` + `fetch` 自行管理请求。
- 错误处理约定:HTTP 调用统一经过 `apps/web/src/lib/http/request.ts`,失败抛出 typed `ApiError`;QueryClient 只对网络错误与 5xx 重试(最多 2 次),`throwOnError` 把首次加载失败交给根路由 `errorComponent`,后台刷新失败保留缓存并由 `QueryCache.onError` 记录日志。
- 文档:
  - TanStack Query:https://tanstack.com/query/latest/docs/framework/react/overview
  - TanStack Start + Query:https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query
  - Query retries:https://tanstack.com/query/latest/docs/framework/react/guides/query-retries
  - Query cancellation:https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
  - QueryCache / global error callbacks:https://tanstack.com/query/latest/docs/reference/QueryCache
  - `throwOnError`:https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
