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

### Spring JDBC / Flyway / SQLite

- `spring-boot-starter-flyway`:引入 JDBC、HikariCP 与 Flyway `12.4.0`。
- `org.xerial:sqlite-jdbc`:版本由 Spring Boot 管理(`3.53.4.0`),驱动类 `org.sqlite.JDBC`。
- Flyway `12.4.0` 的 `flyway-core` 已注册 SQLite 支持,无需额外的 database 模块。
- 迁移目录:`apps/server/src/main/resources/db/migration`;数据库文件:`apps/server/data/pawtrip.db`。
- 文档:
  - Flyway:https://documentation.red-gate.com/flyway
  - SQLite JDBC:https://github.com/xerial/sqlite-jdbc
