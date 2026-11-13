## Why

当前 `apps/web` 仍是 TanStack Start 模板形态，包含大量与 PawTrip 无关的页头、页脚、主题切换、About 路由和手写 CSS。需要一次性清理这些模板残留，并以 shadcn/ui 作为唯一 UI 基础重建最小应用外壳，为后续页面提供统一的导航与组件基线。

对应需求：[REQ-004](../../../requirement-workspace/requirements/REQ-004-shadcn-ui-shell-and-tabs.md)。
影响分析：[impact-brief.md](../../../requirement-workspace/analysis/REQ-004/impact-brief.md)。
细化契约：[deep-dive.md](../../../requirement-workspace/analysis/REQ-004/deep-dive.md)。
登录契约：[REQ-003](../../../requirement-workspace/requirements/REQ-003-user-login.md)。

## What Changes

- **BREAKING**（开发期 UI）：删除 `apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx`、`apps/web/src/routes/about.tsx` 及模板自定义样式，界面不再展示原模板导航、页脚和主题切换。
- 重建 `apps/web/src/styles.css`：仅保留 Tailwind 4 引入与 shadcn/ui 主题变量，移除所有手写类（`page-wrap`、`island-shell`、`nav-link`、`demo-*` 等）。
- 引入 shadcn/ui（Base UI）基础设施：`components.json`、`src/lib/utils.ts`、`Tabs` / `Card` / `Button` / `Input` / `Label` / `AlertDialog` 组件及所需依赖。
- 新增应用外壳：页面顶部居中的横向两 Tab 导航（`Home` / `Paws`），Tab 与路由同步；已登录时显示 `Log out`，点击后使用 shadcn `AlertDialog` 二次确认。
- `/login` 独立渲染，不显示应用外壳的 Tab 导航与登出入口。
- 首页路由 `/` 保留现有问候语内容（数据仍来自 `/api/greeting`），改为使用 shadcn/ui 组件呈现。
- 新增 `/paws` 路由：仅显示应用外壳，Tab 内容为空，暂不提供业务内容。
- 接入 REQ-003 登录：`/`、`/paws` 移入 `_authenticated` 守卫，未登录跳转 `/login`；用 shadcn 重写登录页与会话检查态。
- 保留现有路由级错误页与 `notFoundComponent` 行为，改用 shadcn/ui 组件呈现。
- 不改变 `GET /api/greeting`、数据访问、TanStack Query 取数、request 层与认证契约。

## Non-Goals

- Paws 业务内容、数据接口与后端变更
- 问候语接口、错误契约、TanStack Query 取数与 request 层变更
- 主题切换、深色模式开关、国际化
- 新增前端测试框架
- 部署、CI/CD 与跨域方案

## Capabilities

### New Capabilities

- `ui-foundation`：前端页面与交互组件统一以 shadcn/ui（Base UI）为基础，仅使用 Tailwind 布局工具类，不引入手写 CSS 类或多余包裹标签。
- `web-app-shell`：应用提供顶部居中横向两 Tab 导航，Tab 与路由（`/`、`/paws`）同步，并在两个页面间保持外壳一致；受保护路由未登录时跳转 `/login`；登录页独立渲染，登出需二次确认。
- `paws-page`：`/paws` 路由可用且受登录保护，选中 Paws Tab 时显示应用外壳，页面内容为空。

### Modified Capabilities

- 无。`home-page` 的问候语展示行为、`frontend-api-request` 的错误呈现行为与 `frontend-data-fetching` 的取数约定均保持不变；`frontend-authentication` 由 REQ-003 定义，本次仅按其契约接入 UI 与路由守卫。

## Impact

- **代码**：
  - 删除：`apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx`、`apps/web/src/routes/about.tsx`
  - 重写：`apps/web/src/styles.css`、`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/_authenticated.tsx`、`apps/web/src/routes/login.tsx`
  - 新增：`apps/web/src/routes/_authenticated/index.tsx`、`apps/web/src/routes/_authenticated/paws.tsx`、`apps/web/src/components/ui/*`（含 `alert-dialog.tsx`）、`apps/web/src/lib/utils.ts`、`apps/web/components.json`
  - 复用：`apps/web/src/queries/auth.ts`、`apps/web/src/lib/http/request.ts`、`apps/web/src/lib/query-client.ts`（来自 REQ-003）
  - 生成：`apps/web/src/routeTree.gen.ts` 由 TanStack Router 重新生成
- **依赖**：新增 shadcn/ui + Base UI 运行时依赖（`@base-ui/react`、`class-variance-authority`、`clsx`、`tailwind-merge`、`tw-animate-css`，以及提供基础样式的 `shadcn` 包）；移除模板专用的 `@tailwindcss/typography` 与 TanStack Devtools 依赖
- **接口 / 数据**：无变更
- **上游 / 下游**：无外部系统上游；shadcn/ui 组件源码来自官方 registry，运行时不依赖远程服务；下游为后续页面复用应用外壳与 `apps/web/src/components/ui/` 组件
- **风险**：Tailwind 4 下 shadcn/ui 主题变量写法与旧版不同；TanStack Start SSR 下 Tab 组件需正确反映当前路径；auth query 仅客户端启用，守卫需要处理 SSR 与会话失效；删除模板样式后需确认无残留引用导致构建失败
- **工作量**：S（约 0.5 人日）
