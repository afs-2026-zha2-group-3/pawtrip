# Local Verify Report: refactor-web-ui-with-shadcn（rebase 登录集成）

**Date:** 2026-11-14 (timezone: Asia/Shanghai, UTC+8)
**Scope:** local+evidence
**Change id:** refactor-web-ui-with-shadcn
**Scope revision:** 3（rebase `origin/main` 登录功能，需求编号改为 REQ-004）
**Rebase base:** `b0c01bd`（Merge PR #7 feat/login）
**Branch commit:** `bd1031e`（feat(web): rebuild app shell with shadcn base ui）

## Summary

| Dimension | Status |
|-----------|--------|
| Rebase | Pass |
| Build | Pass |
| Type check | Pass |
| Backend auth + greeting tests | Pass |
| OpenSpec validation | Pass |
| Browser E2E（登录/守卫/路由） | Pass |
| Portability script | 仓库既有 3 项失败，本次无新增 |
| **Overall** | **Pass** |

## Rebase 与冲突处理

- 将 `feat/ui-refactor` rebase 到 `origin/main`（新增 session 登录、CSRF、`/login`、`_authenticated` 守卫、auth query、401 缓存清理）。
- 保留本分支 shadcn + Base UI 外壳与 `/`、`/paws` 路由；将两页移入 `_authenticated` pathless 布局，URL 不变。
- 保留删除模板 `Header`、`Footer`、`ThemeToggle`、`/about`；未恢复模板 UI。
- 合并登录能力：
  - 复用 `queries/auth.ts`、`lib/http/request.ts`、`lib/query-client.ts`，不修改认证协议。
  - `_authenticated.tsx` 会话检查态改用 shadcn `Card`。
  - `login.tsx` 用 `Card` / `Input` / `Label` / `Button` 重写，保留 auth mutation、401 通用错误与已登录跳转。
  - `__root.tsx` 顶部导航在已登录时显示 shadcn `Button` 登出，成功后清空缓存并回 `/login`。
- 需求编号冲突：主分支已占用 REQ-003（用户登录），本 UI 需求改为 REQ-004，分析目录与引用同步迁移。
- 冲突文件：`Header.tsx`（保留删除）、`routeTree.gen.ts`（重新生成）、`_authenticated/index.tsx`（保留 shadcn Home）、`about.tsx`（保留删除）、`README.md`、`package-lock.json`、`registry.md`、`handoff.md`、REQ 分析目录。
- `routeTree.gen.ts` 最终包含 `/login`、`/paws`、`/`，不含 `/about`。

## Local commands

| Command | Exit | Summary |
|---------|------|---------|
| `npm install` | 0 | 合并依赖并重新生成 lockfile |
| `npm run build` | 0 | client 344 modules，SSR 71 modules；生成 `login`、`_authenticated`、`paws` chunk |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 0 | 无类型错误 |
| `./apps/server/mvnw -f apps/server/pom.xml -q test -Dtest=AuthApiTest,SecuritySessionTest,GreetingApiTest` | 0 | 认证、会话与问候语测试通过；Flyway V1+V2 应用成功 |
| `openspec validate refactor-web-ui-with-shadcn --strict` | 0 | Change is valid |
| `npm run seed:users` | 0 | 注入本地 `demo` / `tester` 测试账号 |
| `node --test scripts/portability.test.mjs` | 1 | 5 项中 2 通过、3 失败；均为仓库既有基线问题 |

## Browser E2E

使用本 worktree 的后端（临时 8081）与 Vite dev server（临时 3004，代理 `/api` 到 8081），验证后已停止并清理临时配置。浏览器可视区域不可用，截图接口返回 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，因此以可访问性树快照与 DOM 脚本作为结构证据；视觉呈现未截图确认。

| ID | Scenario | Result | Evidence |
|----|----------|--------|----------|
| S1 | 已登录 `/` 显示居中两 Tab 与 `Log out` | Pass | tablist 2 Tab，Home 选中，Log out 可见 |
| S2 | `/` 展示问候语 | Pass | 页面文本 "Hello World" |
| S3 | 切换 Paws | Pass | URL 变为 `/paws`，Paws 选中，内容为空 |
| S4 | 直接访问 `/paws` | Pass | 刷新后仍在 `/paws`，无 404，无登录跳转 |
| S5 | 未登录访问 `/` 与 `/paws` | Pass | 均重定向 `/login`，不展示受保护内容 |
| S6a | 正确凭据登录 | Pass | `demo` / `pawtrip-demo` 登录后到 `/` 并展示问候语 |
| S6b | 错误凭据登录 | Pass | 停留 `/login`，展示 "Invalid username or password." |
| S6c | 登出 | Pass | 点击 `Log out` 后回到 `/login`，登出按钮消失 |
| S7 | 未知路由 404 | Pass | `/nope` 显示 "Page not found" 与返回首页链接 |
| S8 | 认证失败优先跳登录；问候语失败错误页 | Partial | 认证失败跳转已验证；问候语失败错误页沿用既有实现，本次未单独注入故障 |
| S9 | 模板 UI 已清理 | Pass | 无模板文案/Devtools；源码无 Header/Footer/ThemeToggle/About |
| S10 | shadcn / 无手写样式 | Pass | 登录页 data-slot：tabs、card、label、input、button 等；0 个 Radix 节点；无 `page-wrap` 等自定义类 |

补充：

- 控制台 401 日志来自未登录时 `GET /api/auth/me` 与错误凭据登录，属于主分支既有 `QueryCache`/`MutationCache` 记录行为，不是路由错误页。
- 未登录访问 `/nope` 仍显示 404；守卫只覆盖 `/` 与 `/paws`，与本次 Delta Spec 一致。

## Findings

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | portability 脚本仍有 3 项既有失败：旧文档作者路径、归档文档相对链接、重定位测试缺少 `.qoder/skills/sdd-bootstrap/scripts/init-checkpoint-log.sh` | [fact] | `scripts/portability.test.mjs` | 与本次改动无关，另开变更修复 |
| 2 | 认证查询失败与问候语失败共用错误路径，后端整体不可用时优先跳 `/login` | [fact] | `apps/web/src/routes/_authenticated.tsx`、`lib/query-client.ts` | 已在 Spec/ATDD 明确优先级；后续可增加问候语专用故障注入测试 |
| 3 | 可视截图不可用，仅完成结构级验证 | [fact] | 浏览器工具 | 由用户在可见浏览器中做最终视觉确认 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 登录成功与守卫分别触发一次 `replace` 导航 | [inference] | `apps/web/src/routes/login.tsx` | 当前无可见问题；后续如出现闪烁可合并导航来源 |
| 2 | 顶部登出使用绝对定位，窄屏需关注与 Tab 的间距 | [inference] | `apps/web/src/routes/__root.tsx` | 已在 320px 级布局上避免重叠；后续可做响应式回归 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | auth query 仅客户端启用，首屏短时显示会话检查态 | 沿用 REQ-003 设计 | SSR 渲染 `Card` 加载态，hydration 后跳转 |
| 2 | 未登录时 `/api/auth/me` 产生 401 控制台日志 | 主分支既有行为 | 不影响页面与守卫；后续可降低日志级别 |
| 3 | 无前端自动化测试 | G1 决定本次不纳入 | 构建、类型检查与浏览器 E2E 覆盖 |
| 4 | portability 基线失败 | 非本次范围 | 记录并另开变更 |

## Waiver

N/A — Overall=Pass（S8 局部沿用既有行为，已记录）。G2 待 IO/SA 签核。
