## ADDED Requirements

### Requirement: 服务端数据通过 TanStack Query 获取

前端 SHALL 使用 TanStack Query 获取和缓存服务端数据。组件 MUST NOT 使用 `useEffect` + `fetch` 自行管理服务端请求状态。

#### Scenario: 首页通过 Query 获取问候语

- **GIVEN** 首页需要展示 `/api/greeting` 返回的 `message`
- **WHEN** 访客打开首页
- **THEN** 请求由 TanStack Query 发起
- **AND** 页面组件中不存在 `useEffect` + `fetch` 请求

#### Scenario: 新增服务端数据读取复用 Query

- **GIVEN** 开发者需要新增一个服务端数据读取
- **WHEN** 该数据用于页面展示
- **THEN** 使用 `queryOptions` 或 `useQuery`
- **AND** 不在组件内直接调用 `fetch`

### Requirement: QueryClient 按请求生命周期创建

应用 SHALL 在 TanStack Start 的 `getRouter` 内创建 `QueryClient`,并通过 router context 与 SSR 集成提供;MUST NOT 使用模块级共享实例。

#### Scenario: SSR 请求隔离

- **GIVEN** TanStack Start 执行服务端渲染
- **WHEN** 每个请求创建 router
- **THEN** 该请求获得独立的 `QueryClient`
- **AND** 查询缓存不跨请求共享

### Requirement: 查询键与 query options 集中定义

前端 SHALL 将 query key 与 query function 集中定义在可复用的 query options 中;页面组件 MUST NOT 内联重复定义 query key。

#### Scenario: 首页复用问候语 query options

- **GIVEN** 问候语查询已定义
- **WHEN** 首页使用该查询
- **THEN** 首页引用集中定义的 `greetingQueryOptions`
- **AND** 不在页面内重复定义 query key

### Requirement: 保持客户端取数边界

对于通过 Vite `/api` 代理提供的同源相对 URL 接口,前端 SHALL 在客户端通过 TanStack Query 取数;MUST NOT 在 SSR loader 中直接请求相对 URL。

#### Scenario: 首页不在 SSR loader 中请求相对 URL

- **GIVEN** 接口通过 Vite `/api` 代理提供
- **WHEN** 首页在服务端渲染
- **THEN** 不发起 `/api/greeting` 相对 URL 请求
- **AND** 客户端挂载后由 TanStack Query 获取数据
- **AND** 页面最终展示接口返回的 `message`
