# Local Verify Report: refactor-web-ui-with-shadcn（Revision 4）

**Date:** 2026-11-14 (timezone: Asia/Shanghai, UTC+8)
**Scope:** local + evidence
**Change id:** refactor-web-ui-with-shadcn
**Scope revision:** 4（登录页独立渲染；登出使用 shadcn AlertDialog 二次确认）
**Branch:** `feat/ui-refactor`
**Rebase base:** `b0c01bd`（后续需 rebase 最新 `origin/main`）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Type check | Pass |
| OpenSpec validation | Pass |
| Browser E2E（S1–S11） | Pass |
| Portability script | 仓库既有 3 项失败，本次无新增 |
| **Overall** | **Pass** |

## Changes under verification

- `/login` 独立渲染：根文档在 `/login` 不挂载 `AppHeader`，登录页不显示 `Home` / `Paws` Tab 与 `Log out`。
- 登出二次确认：新增 `apps/web/src/components/ui/alert-dialog.tsx`（Base UI `base-nova` registry），`Log out` 先打开 shadcn `AlertDialog`，取消留在原页，确认后才执行登出。
- Delta Spec、Design、Tasks、ATDD、REQ-004 同步新增“登录页独立”与“登出二次确认”要求。

## Local commands

| Command | Exit | Summary |
|---------|------|---------|
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 0 | 无类型错误 |
| `npm run build` | 0 | client 427 modules，SSR 72 modules |
| `openspec validate refactor-web-ui-with-shadcn --strict` | 0 | Change is valid |
| `rg "window\\.confirm|\\bconfirm\\(" apps/web/src` | 1 | 无原生确认弹窗 |
| `rg "page-wrap|island-shell|nav-link|demo-" apps/web/src` | 1 | 无模板自定义类 |

## Browser E2E

浏览器可视区域不可用，截图接口返回 `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`，因此以可访问性树快照与 DOM 脚本作为结构证据；视觉呈现未截图确认。

| ID | Scenario | Result | Evidence |
|----|----------|--------|----------|
| S1 | 已登录 `/` 显示居中两 Tab 与 `Log out` | Pass | banner 含 Home/Paws 两 Tab，Home 选中 |
| S2 | `/` 展示问候语 | Pass | 页面文本 "Hello World" |
| S3 | 切换 Paws | Pass | URL 变为 `/paws`，Paws 选中，内容为空 |
| S4 | 直接访问 `/paws` | Pass | 刷新后仍在 `/paws`，无 404 |
| S5 | 未登录访问 `/` 与 `/paws` | Pass | 均重定向 `/login` |
| S6 | 登录、错误凭据与登出 | Pass | 正确凭据到 `/`；错误凭据停留并提示；登出确认后回 `/login` |
| S7 | 未知路由 404 | Pass | `/nope` 显示 404 页 |
| S8 | 认证失败优先跳登录；问候语失败错误页 | Partial | 认证失败跳转已验证；问候语错误页沿用既有实现，本次未注入故障 |
| S9 | 模板 UI 已清理 | Pass | 无模板页头、页脚、主题切换与 Devtools |
| S10 | 无手写样式类 | Pass | `styles.css` 仅 Tailwind + shadcn 主题层 |
| S11 | 登录页独立 | Pass | `/login` 快照仅含登录表单，无 banner、Tab 与 `Log out` |

补充：

- 点击 `Log out` 后出现 `role="alertdialog"`，包含标题、说明、`Cancel` 与确认按钮；取消后地址仍为 `/`，确认后地址变为 `/login`。
- 登录页与登出确认均来自 `apps/web/src/components/ui/` 的 shadcn 组件。

## Findings

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | portability 脚本仍有 3 项既有失败：旧文档作者路径、归档文档相对链接、重定位测试缺少脚本 | [fact] | `scripts/portability.test.mjs` | 与本次改动无关，另开变更修复 |
| 2 | 问候语失败错误页未在本次单独注入故障 | [fact] | `apps/web/src/routes/_authenticated/index.tsx` | 沿用既有 REQ-002 行为；后续可增加故障注入测试 |
| 3 | 可视截图不可用，仅完成结构级验证 | [fact] | 浏览器工具 | 由用户在可见浏览器中做最终视觉确认 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 登录页隐藏外壳采用根路由路径判断 | [inference] | `apps/web/src/routes/__root.tsx` | 若后续增加更多公开页面，可提炼独立公开布局 |
| 2 | 登出确认关闭后立即发起请求 | [inference] | `apps/web/src/routes/__root.tsx` | 当前失败提示仍显示于顶部；如需要可在弹窗内展示错误 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | auth query 仅客户端启用，首屏短时显示会话检查态 | 沿用 REQ-003 设计 | SSR 渲染 Card 加载态，hydration 后跳转 |
| 2 | 未登录时 `/api/auth/me` 产生 401 控制台日志 | 主分支既有行为 | 不影响页面与守卫 |
| 3 | 无前端自动化测试 | G1 决定本次不纳入 | 构建、类型检查与浏览器 E2E 覆盖 |
| 4 | portability 基线失败 | 非本次范围 | 记录并另开变更 |

## Waiver

N/A — Overall=Pass（S8 局部沿用既有行为，已记录）。
