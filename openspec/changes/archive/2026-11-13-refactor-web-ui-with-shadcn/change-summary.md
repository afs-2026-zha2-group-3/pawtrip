# Change summary — refactor-web-ui-with-shadcn

## Intent

以 shadcn/ui（Base UI）重建 PawTrip 前端骨架，删除 TanStack Start 模板 UI 与手写样式；提供顶部居中 `Home` / `Paws` 两 Tab 与真实路由 `/`、`/paws`，并接入 REQ-003 的服务端会话守卫与登录页。对应 REQ-004。

## What shipped

- 删除模板 `Header`、`Footer`、`ThemeToggle`、`/about`、Devtools UI 与 `styles.css` 中的全部自定义类。
- 初始化 shadcn/ui（Base UI，`base-nova`）：`components.json`、`src/lib/utils.ts`、Tailwind 4 主题令牌，以及 `Tabs`、`Card`、`Button`、`Input`、`Label`、`AlertDialog`。
- 根路由提供顶部居中横向 `Home` / `Paws` Tab，选中态由当前路径决定；已登录时显示 `Log out`。
- `/` 使用 shadcn `Card` 展示 `/api/greeting` 返回的 `message`；`/paws` 为空页面。
- `/`、`/paws` 位于 `_authenticated` 守卫下，未登录跳转 `/login`；登录成功回 `/`。
- `/login` 独立渲染，不显示 Tab 导航与登出入口；使用 shadcn `Card` / `Input` / `Label` / `Button`，保留 auth query、401 通用错误与已登录跳转。
- 登出使用 shadcn `AlertDialog` 二次确认；取消留在原页，确认后清理 Query 缓存并回 `/login`。
- 保留根路由错误页、404、TanStack Query 取数、request 层与认证契约。
- PR #10：`fb106ca`（merge commit）。
- 归档位置：`openspec/changes/archive/2026-11-13-refactor-web-ui-with-shadcn/`。
- KB update：`Skipped (not configured)` —— 仓库 `scripts/kb-lint.sh` 为占位脚本，未宣称 KB 校验通过。

## Verify highlights

- Local verify：`docs/ai4se-plugins/20261114-013935-local-verify-report.md`，Overall Pass；`tsc`、`npm run build`、`openspec validate --strict` 均通过。
- CI：`docs/ai4se-plugins/20261114-014513-pipeline-report.md`，E1 全绿；Web build Pass。
- 浏览器 E2E S1–S11：登录/守卫/路由/404/登出确认/独立登录页均通过。
- 静态检查：无模板自定义类、无原生 `confirm`、界面组件来自 `components/ui/`。
- 后端 `AuthApiTest`、`SecuritySessionTest`、`GreetingApiTest` 通过，接口与认证契约未变。

## Archive adjustments

- 三个新增 capability 均只含 ADDED Requirements，归档时直接创建 `ui-foundation`、`web-app-shell`、`paws-page` 三个 Living Spec。
- 既有 `home-page`、`frontend-data-fetching`、`frontend-api-request`、`frontend-authentication` 不发生 delta 修改。

## Residual risks

- portability 脚本仍有 3 项仓库既有失败，与本次无关。
- 问候语失败错误页沿用既有行为，本次未单独注入故障。
- 浏览器截图接口不可用，仅完成结构级验证，视觉需在可见浏览器确认。
- 无前端自动化测试框架；后续可独立引入。
- 登录页通过根路径判断隐藏外壳；后续公开页面增多时可提炼公开布局。

## Links

- Proposal / Design / Tasks：同目录 `proposal.md`、`design.md`、`tasks.md`。
- ATDD 与自检：同目录 `atdd-design.md`、`alignment-self-check.md`、`consistency-lint.md`、`dov-ac-review.md`。
- G1 / G2：同目录 `g1-decision.md`、`g2-decision.md`。
- PR：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/10
- Local verify：`docs/ai4se-plugins/20261114-013935-local-verify-report.md`
- Pipeline report：`docs/ai4se-plugins/20261114-014513-pipeline-report.md`
