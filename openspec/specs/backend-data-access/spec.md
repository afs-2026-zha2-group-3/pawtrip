# backend-data-access Specification

## Purpose
定义后端关系型数据访问约定：统一使用 Spring Data JPA 仓库，schema 由 Flyway 管理，SQLite 使用 Hibernate 社区方言。
## Requirements
### Requirement: 关系型数据访问使用 Spring Data JPA 仓库

系统 SHALL 通过 Spring Data JPA 仓库访问关系型数据库。新增或改造的单表查询 MUST 优先使用仓库派生查询或 JPQL;控制器与服务层 MUST NOT 直接使用 `JdbcTemplate` 手写 SQL。

#### Scenario: 问候语查询通过仓库

- **GIVEN** 后端已配置 Spring Data JPA 与 SQLite 数据源
- **WHEN** 检查 `GET /api/greeting` 的实现
- **THEN** 控制器依赖 `GreetingRepository`
- **AND** 生产代码中不存在对 `greeting` 表的 `JdbcTemplate` 或手写 SQL 查询

#### Scenario: 新增简单查询优先使用派生查询

- **GIVEN** 开发者需要新增一个单表查询
- **WHEN** 查询条件可由仓库方法名派生表达
- **THEN** 使用仓库派生查询
- **AND** 不新增手写 SQL

### Requirement: 裸 SQL 例外需显式记录

系统 SHALL 允许在派生查询或 JPQL 无法表达时,在仓库接口内使用 `@Query`;使用原生 SQL MUST 在代码或变更记录中说明原因。

#### Scenario: 复杂查询使用 @Query

- **GIVEN** 查询超出派生查询的表达范围
- **WHEN** 开发者需要实现该查询
- **THEN** `@Query` 定义在仓库接口内
- **AND** SQL 不放入控制器或服务层
- **AND** 使用原生 SQL 时记录原因

### Requirement: Schema 由 Flyway 管理

系统 SHALL 由 Flyway 管理数据库 schema;JPA 的 schema 自动生成/更新 MUST 关闭。

#### Scenario: 应用启动不自动改表

- **GIVEN** 应用同时使用 JPA 与 Flyway
- **WHEN** 应用启动
- **THEN** JPA 不执行 schema 生成或更新
- **AND** 建表与种子由 Flyway 迁移负责

### Requirement: SQLite 使用 Hibernate 社区方言

系统 SHALL 为 SQLite 数据源配置 `org.hibernate.community.dialect.SQLiteDialect`,并保持 `GET /api/greeting` 的既有契约。

#### Scenario: 使用 SQLite 方言启动并查询

- **GIVEN** 数据源为 SQLite
- **WHEN** 应用启动并接收 `GET /api/greeting`
- **THEN** JPA 使用 `org.hibernate.community.dialect.SQLiteDialect`
- **AND** 接口返回 `200` 与 `{"message":"Hello World"}`

