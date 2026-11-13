> 关联:[design.md](design.md) · [atdd-design.md](atdd-design.md) · Delta Spec:[backend-data-access](specs/backend-data-access/spec.md) / [frontend-data-fetching](specs/frontend-data-fetching/spec.md) / [backend-error-handling](specs/backend-error-handling/spec.md) / [frontend-api-request](specs/frontend-api-request/spec.md)
>
> 负责人:**Dev**=实现负责人;**QA**=验收核对。

## 1. 后端:依赖与 JPA 配置(Dev)

- [x] 1.1 `apps/server/pom.xml` 增加 `spring-boot-starter-data-jpa` 与 `org.hibernate.orm:hibernate-community-dialects`;保留 `sqlite-jdbc`、Flyway
- [x] 1.2 `application.yml` 增加 `spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect`、`ddl-auto=none`、`open-in-view=false`
- [x] 1.3 启动后端确认 JPA 上下文与 Flyway 正常初始化,`GET /api/greeting` 仍返回原契约

## 2. 后端:实体、仓库与控制器(Dev)

- [x] 2.1 新增 `Greeting` 实体,映射既有 `greeting` 表,使用 `@Id @GeneratedValue(IDENTITY)` 与 `message` 字段
- [x] 2.2 新增 `GreetingRepository extends JpaRepository<Greeting, Long>`,使用 `findFirstByOrderByIdAsc()` 派生查询
- [x] 2.3 改造 `GreetingController`:移除 `JdbcTemplate`,注入仓库,返回 `record GreetingResponse(String message)`,路径与 JSON 字段不变
- [x] 2.4 运行 `cd apps/server && ./mvnw test`,确认 `GreetingApiTest` 通过;不删除或放宽断言

## 3. 前端:TanStack Query 接入(Dev)

- [x] 3.1 安装 `@tanstack/react-query` 与 `@tanstack/react-router-ssr-query` 到 `apps/web`
- [x] 3.2 `apps/web/src/router.tsx` 在 `getRouter` 内创建 `QueryClient`,放入 router context,调用 `setupRouterSsrQueryIntegration`
- [x] 3.3 `apps/web/src/routes/__root.tsx` 改为 `createRootRouteWithContext<{ queryClient: QueryClient }>`
- [x] 3.4 新增 `apps/web/src/queries/greeting.ts`,用 `queryOptions` 定义 `["greeting"]` 查询与 fetch 函数
- [x] 3.5 `apps/web/src/routes/index.tsx` 使用 `useQuery(greetingQueryOptions)` 替换 `useEffect` + `fetch`;展示逻辑不变
- [x] 3.6 运行根目录 `npm run build`,确认类型检查与构建通过

## 4. 验收:E2E 与反向验证(Dev;QA 核对)

- [x] 4.1 E2E-1/2:启动后端与前端,访问首页确认展示 "Hello World";Network 中 `/api/greeting` 请求由 TanStack Query 发起,无重复请求
- [x] 4.2 E2E-3:确认 SSR 首屏不请求相对 URL,客户端挂载后再请求
- [x] 4.3 E2E-4:修改数据库 `message` 后刷新,确认展示跟随;验证后恢复干净数据库
- [x] 4.4 反向验证:生产代码无 `JdbcTemplate`/手写 `greeting` SQL;首页无 `useEffect` + `fetch`;无新增写接口或管理 UI;`V1__create_greeting.sql` 未变

## 5. 文档与收口(Dev;QA 复核)

- [x] 5.1 更新 `docs/knowledge/architecture/README.md`:后端数据访问改为 Spring Data JPA + Hibernate SQLite 方言,前端取数改为 TanStack Query
- [x] 5.2 更新 `docs/knowledge/external/README.md`:补充 Spring Data JPA / Hibernate SQLite 方言 / TanStack Query 官方来源
- [x] 5.3 运行 `openspec validate refactor-data-access-and-query`,确认 Delta Spec 有效
- [x] 5.4 生成 `/sdd:local-verify-report` 所需证据:后端测试、前端构建、E2E 记录与代码检索结果

## 6. 后端:Problem Details 与全局错误处理(Dev)

- [x] 6.1 新增错误码与异常类型(`ApiErrorCode`、`ApiException`、`GreetingNotFoundException`),控制器改为抛出领域异常
- [x] 6.2 新增 `GlobalExceptionHandler extends ResponseEntityExceptionHandler`:映射领域异常、校验异常与未捕获异常;ProblemDetail 扩展 `code`;配置 `spring.mvc.problemdetails.enabled=true`
- [x] 6.3 新增错误路径测试:404 `GREETING_NOT_FOUND`、500 `INTERNAL_ERROR`、成功响应不套壳;运行 `./mvnw test`

## 7. 前端:统一 request 与错误呈现(Dev)

- [x] 7.1 新增 `api-error.ts` 与 `request.ts`:Problem Details 解析、typed `ApiError`、超时与 `AbortSignal`
- [x] 7.2 QueryClient 增加 `retry` 策略、`QueryCache`/`MutationCache` 全局 `onError`;query options 使用 `request` 并传递 `signal`
- [x] 7.3 根路由新增 `errorComponent` 与 `notFoundComponent`;首次加载失败 `throwOnError`,后台刷新失败保留缓存数据
- [x] 7.4 运行 `npm run build`;执行 E2E-5 ~ E2E-7(首次失败、后台刷新失败、未知路由)

## 8. 复核与文档(Dev;QA 复核)

- [x] 8.1 更新 `docs/knowledge/architecture/README.md` 与 `docs/knowledge/external/README.md`:补充 Problem Details、request 层与错误呈现约定
- [x] 8.2 更新 `alignment-self-check.md`、`dov-ac-review.md`、`consistency-lint.md`,重新进行 G1 签核(Revision 2 Pass,IO/SA=Echo Luo)
- [x] 8.3 重新运行后端测试、前端构建与 `openspec validate --strict`;更新本地验证报告
