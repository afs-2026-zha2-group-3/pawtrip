## Context

`apps/web` 由 TanStack Start 模板生成，当前根路由挂载模板 `Header`、`Footer`、`ThemeToggle` 和 TanStack Devtools；`styles.css` 含有约 480 行模板自定义样式；`/about` 路由与 `/` 均为模板示例。REQ-002 已完成 TanStack Query 与 request 层改造；主分支已合并 REQ-003 用户登录（会话、CSRF、`/login`、受保护路由），因此本次在替换全部 UI 的同时接入已有认证守卫。

关联需求：[REQ-004](../../../requirement-workspace/requirements/REQ-004-shadcn-ui-shell-and-tabs.md)
影响分析：[impact-brief.md](../../../requirement-workspace/analysis/REQ-004/impact-brief.md)
细化契约：[deep-dive.md](../../../requirement-workspace/analysis/REQ-004/deep-dive.md)
登录契约：[REQ-003](../../../requirement-workspace/requirements/REQ-003-user-login.md)

约束：

- 技术栈固定为 TanStack Start + React 19 + Vite 8 + Tailwind CSS 4（见 `docs/knowledge/architecture/README.md`）。
- UI 基础库固定为 shadcn/ui，底层 primitive 使用 Base UI（2026-11-14 需求方确认）；参考 `docs/knowledge/external/README.md`、`.agents/skills/shadcn/SKILL.md` 与 Base UI 官方 registry。
- 两个 Tab 对应真实路由 `/` 与 `/paws`（2026-11-14 需求方确认）。
- 现有 Living Spec `home-page`、`frontend-data-fetching`、`frontend-api-request` 的正常路径与错误呈现行为必须保持。
- 认证沿用 REQ-003：`authQueryOptions`、`_authenticated` 守卫、CSRF request 层与全局 401 处理；前端不得自建 token 存储或重复实现登录协议。

## Goals / Non-Goals

**Goals:**

- 以 shadcn/ui 重建最小应用外壳：顶部居中横向 `Home` / `Paws` 两个 Tab，Tab 与路由同步。
- `/` 保留问候语展示；`/paws` 为空页面；两页共享同一外壳并受登录保护。
- 接入 REQ-003 的 `/login`、会话守卫与登出，登录页与加载态使用 shadcn/ui 组件。
- 删除模板页头、页脚、主题切换、About 路由、Devtools UI 与全部自定义 CSS 类。
- 保持现有错误页、404 页、TanStack Query 取数与 request 层不变。

**Non-Goals:**

- 不新增 Paws 业务内容、不新增数据接口、不改后端。
- 不引入其他 UI 组件库、CSS-in-JS 或自研设计系统。
- 不新增前端测试框架；验收依赖构建、类型检查与浏览器端到端检查。
- 不做主题切换、深色模式开关、国际化。

## Decisions

### 1. Tab 由路由承载，而非页面内本地状态

- 根路由渲染应用外壳（导航 + 内容）；`/` 与 `/paws` 位于 `_authenticated` pathless 布局下，由该布局查询会话并渲染 `<Outlet />`，URL 保持 `/` 与 `/paws`。
- `/login` 不挂载应用外壳：根文档根据当前路径在 `/login` 渲染登录页自身内容，不渲染 `AppHeader`，使登录页独立于 Tab 导航与登出入口。
- 导航使用 shadcn `Tabs`（Base UI `Tabs.Root` / `Tabs.List` / `Tabs.Tab`）受控模式：`value` 由 `useRouterState` 读取当前路径映射得到，`onValueChange` 调用 `useNavigate` 切换路由；不维护第二份本地状态。
- 理由：需求方确认 Paws 为独立页面，路由可深链、支持浏览器前进后退，并让 `/paws` 作为正常路由处理。
- 备选：页面内 `TabsContent` 本地切换（无 URL，刷新后回到 Home，深链不可用）；`NavigationMenu`（语义更偏站点导航，不符合“两个 tab”的交互要求）。均不采用。

### 2. 使用 shadcn CLI 初始化并只引入所需组件

- 在 `apps/web` 内执行 shadcn CLI 初始化（Tailwind 4、`@/*` 别名、`--base base`），生成 `components.json`、`src/lib/utils.ts`；若 CLI 受网络限制，则按官方 `base-nova` registry 的等价配置手工落盘。
- 只添加 `tabs`、`card`、`button`、`input`、`label`、`alert-dialog` 六个 Base UI 版本组件；不添加图标、侧面导航等当前用不到的组件。
- 主题通过 `src/styles.css` 引入 `shadcn/tailwind.css`，并使用 Base UI `base-nova` 语义令牌。
- 理由：组件以源码形式进入仓库，符合“用组件库本身说话”；避免引入未使用的依赖与文件。
- 备选：使用 Radix 版本组件（用户明确要求 Base UI）；手写 Base UI 封装（重复造轮子、易偏离 shadcn 约定）；引入整包 UI 库（违反约束）。均不采用。

### 3. `styles.css` 仅保留 Tailwind 与 shadcn 主题层

- 保留：`@import "tailwindcss"`、shadcn 主题变量（`@theme inline`、`:root`/`.dark` 令牌）与 `@layer base`。
- 删除：Google Fonts 引入、`@tailwindcss/typography` 插件、全部自定义 CSS 变量与类选择器（`page-wrap`、`island-shell`、`nav-link`、`demo-*`、`rise-in` 等）。
- 理由：符合 `ui-foundation` 规格与用户“禁止手写样式”的要求；字体与颜色回归 shadcn 默认语义令牌。
- 备选：保留部分模板样式（与新组件视觉冲突，且难以核查）。不采用。

### 4. 页面与错误态使用 shadcn 组合

- 应用外壳：根组件 `header` 居中承载 `Tabs`，已登录时在右侧绝对定位 `Log out`（`Button variant="ghost"`），内容区仅放 `<Outlet />`；`body` 使用 `bg-background text-foreground`。
- 首页：`Card` + `CardHeader` + `CardTitle` 展示接口返回的 `message`，不新增包裹层。
- Paws：路由组件返回 `null`，仅由外壳提供可见 UI。
- 登录：`Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent`，表单使用 `Label` + `Input` + `Button`，错误提示使用 `text-destructive` 的 `role="alert"`。
- 登出确认：顶部 `Log out` 作为 shadcn `AlertDialogTrigger`，弹窗使用 `AlertDialog` + `AlertDialogContent` + `AlertDialogHeader` + `AlertDialogTitle` + `AlertDialogDescription` + `AlertDialogFooter`；`AlertDialogCancel` 取消，`AlertDialogAction` 确认后才执行登出 mutation，不使用原生 `confirm`。
- 会话检查：`Card` + `CardHeader` + `CardTitle` + `CardDescription` 展示 "Checking your session…"，不使用模板容器类。
- 错误页 / 404：`Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardFooter` + `Button`；错误信息仍读取 `ApiError.detail`。Base UI `Button` 始终带 `role="button"`，因此 404 的返回首页使用 `buttonVariants()` + TanStack `Link`（语义链接），不使用 Button 包裹链接。
- 布局间距使用 Tailwind 工具类（`flex`、`justify-center`、`gap-*`、`mx-auto`、`max-w-*`），遵守 shadcn 规则（用 `gap-*` 不用 `space-y-*`，语义色不用原始色值）。
- 备选：沿用模板 `island-shell` 等自定义容器包裹 shadcn 组件（视觉与维护冲突）；为每个页面新建独立 CSS 类（违反 `ui-foundation`）。均不采用。

### 5. 登录接入沿用 REQ-003 的认证边界

- 路由：`/` 与 `/paws` 移入 `_authenticated` 布局，未登录或 auth query 失败时 `navigate({ to: "/login", replace: true })`；登录成功写 auth 缓存并回 `/`。
- 登录页：保留 `authQueryOptions`、`login()`、`useMutation` 与 `ApiError` 401 判断，只替换展示组件。
- 登出：顶部 `Log out` 先打开 shadcn `AlertDialog` 二次确认，确认后调用 `logout()`，成功后 `queryClient.clear()` 并回 `/login`；失败展示可观察提示。
- 理由：主分支已通过 G2 并覆盖 CSRF、401 缓存清理与会话过期场景；本次只做 UI 承载与路由编排，避免协议分叉。
- 备选：重新实现登录请求或自建 auth store（重复协议、易偏离 CSRF/401 处理）。不采用。

### 6. 删除模板 Devtools 与无用依赖

- 移除根路由中的 `TanStackDevtools` / `TanStackRouterDevtoolsPanel` 渲染，并移除 `vite.config.ts` 中的 `devtools()` 插件及其依赖 `@tanstack/react-devtools`、`@tanstack/react-router-devtools`、`@tanstack/devtools-vite`。
- 移除仅被旧样式使用的 `@tailwindcss/typography`。
- 理由：这些均为模板脚手架产物，不属于 PawTrip UI；保留会在页面上产生额外 UI 或无效依赖。
- 备选：保留 Devtools 以方便调试（页面出现额外浮层且继续携带无效依赖）；只删渲染、不删依赖（留下死依赖）。均不采用。

## Risks / Trade-offs

- [shadcn CLI 对 TanStack Start / Tailwind 4 的初始化参数可能与预期不同] → 实现前运行 `npx shadcn@latest init --help` 与 `info`，按 CLI 实际输出确认参数；失败时按本地技能文档手工补齐 `components.json` 与主题变量。
- [`routeTree.gen.ts` 需要同时包含 `/login`、`/paws` 且不含 `/about`] → 由 `npm run build` 触发 TanStack Router 重新生成，构建后核查文件内容。
- [Base UI Tabs 在 SSR 下的受控值依赖路径] → `useRouterState` 在服务端与客户端均可读取路径；不做本地状态，避免 hydration 不一致。
- [Base UI Button 的 `role="button"` 会覆盖链接语义] → 导航链接使用 `buttonVariants()` + `Link`，不使用 Button 包裹 `<a>`。
- [auth query 在 SSR 阶段不可用] → 守卫仅在客户端启用 auth query，SSR 渲染会话检查卡片；hydration 后再决定跳转或渲染页面。
- [登录跳转与 401 清理可能产生闪烁] → 复用 `queryClient` 的 401 清理与 `replace` 导航；登录页在 auth 成功后直接跳转，不保留表单状态。
- [删除自定义字体后视觉变化明显] → 属于本次目标；视觉以 shadcn 默认主题为准。
- [移除 Devtools 后开发调试能力减少] → 仅保留浏览器原生调试与网络面板；如后续需要可作为独立变更恢复。
