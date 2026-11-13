# Local Verify Report: refactor-web-ui-with-shadcn

**Date:** 2026-11-14 (timezone: Asia/Shanghai, UTC+8)
**Scope:** local+evidence
**Change id:** refactor-web-ui-with-shadcn
**Scope revision:** 2（技术基座由 Radix 改为 shadcn/ui + Base UI）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Type check | Pass |
| Static scan | Pass |
| Browser E2E | Pass |
| Backend regression | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | **Pass** |

**PR gate:** Pass — 不阻塞后续 G2。尚未创建提交或 PR；需用户明确授权。

## 技术基座

- shadcn/ui `base-nova` 风格，底层 primitive 为 Base UI（`@base-ui/react`）。
- `apps/web/components.json`：`style=base-nova`。
- `apps/web/src/components/ui/`：`tabs`、`card`、`button` 均来自官方 base-nova registry；源码中无 `@radix-ui` 引用。
- `apps/web/src/styles.css`：仅 Tailwind、`shadcn/tailwind.css`、`@theme inline` 语义色映射、`:root` / `.dark` 中性色令牌与 `@layer base`。

## Local commands

| Command | Exit | Summary |
|---------|------|---------|
| `npm run build` | 0 | client 299 modules，CSS 31.29 kB；SSR 64 modules；生成 `/paws` chunk |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | 0 | 无类型错误 |
| `./apps/server/mvnw -f apps/server/pom.xml -q test -Dtest=GreetingApiTest` | 0 | `GET /api/greeting` 契约回归通过 |
| `node --test scripts/portability.test.mjs`（删除项暂存后） | 1 | 5 项中 2 通过、3 失败；失败均为仓库既有基线问题，与本次新增文件无关（见 Findings） |
| `openspec validate refactor-web-ui-with-shadcn --strict` | 0 | Change is valid |

补充检查：

| 检查 | 结果 |
|---|---|
| `apps/web/src/routeTree.gen.ts` | 含 `/paws`，不含 `/about` |
| `apps/web/src` 检索 `page-wrap` / `island-shell` / `nav-link` / `demo-` / `ThemeToggle` / `react-devtools` | 无匹配 |
| 浏览器 DOM 检索 `data-radix-*` | 0 个节点 |
| 浏览器 DOM 检索模板文案（About / Theme / GitHub / Twitter / Bluesky） | 无匹配 |
| 导航布局 | `header` 为 `display:flex`、`justify-content:center`；2 个 Tab |

## Browser E2E

验证使用本 worktree 的 Vite dev server（临时端口 3002）；后端复用已在 8080 运行的同一 Spring Boot 应用。验证后已停止 dev server 并清理临时文件。

| ID | Scenario | Result | Evidence |
|----|----------|--------|----------|
| S1 | 两个页面共享顶部居中横向两 Tab 外壳 | Pass | `/` 与 `/paws` 均渲染 `tablist` + 2 Tab，header 居中 |
| S2 | `/` 选中 Home 并展示问候语 | Pass | Home `aria-selected=true`，内容区展示 "Hello World" |
| S3 | 点击 Paws 切换到 `/paws` 且内容为空 | Pass | 点击后 URL 为 `/paws`，Paws 选中，无内容区子节点 |
| S4 | 直接访问 `/paws` | Pass | 刷新式导航后外壳保留、Paws 选中、无 404 |
| S5 | 未知路由显示 404 | Pass | `/nope` 显示 "Page not found" + 返回首页链接 |
| S6 | 首页首次加载失败进入错误页 | Pass | 临时将 `/api` 代理指向不可达端口，显示 "Request failed with status 502" + "Try again" |
| S7 | 模板 UI 已清理 | Pass | DOM 无模板文案、无 Devtools；源码无 Header/Footer/ThemeToggle/About |
| S8 | 无手写样式类 | Pass | `styles.css` 无自定义选择器；DOM 无模板 CSS 类 |
| — | 浏览器前进/后退 | Pass | `/` ↔ `/paws` 切换后选中态与 URL 一致 |
| — | Console | Pass | 仅 `/nope` 产生预期的 404 资源错误，无 hydration/运行时报错 |

## Evidence checklist

| ID | Check | Result | Notes |
|----|-------|--------|-------|
| V1 | Task completion | Pass（21/22） | `tasks.md` 除 1.2 外全部勾选；1.2 为变更前基线，本次重建后无法回溯执行，已由 P1 源码证据替代 |
| V2 | Requirement coverage | Pass | 三个 Delta Spec 的 Requirement 均有实现证据 |
| V3 | Scenario coverage | Pass | S1–S8 全部由浏览器/源码检索覆盖 |
| V4 | Requirement ↔ implementation mapping | Pass | 见下表 |
| V5 | Spec drift | Pass | 实现与 Delta Spec / design 一致；接口、取数与错误契约未变 |
| V6 | Design follow-through | Pass | Decision 1–5 均落地；404 使用 `buttonVariants()` + `Link` |
| V7 | Code pattern fit | Pass | shadcn 源码组件、Tailwind 布局、路由驱动选中态、集中 query options |
| V8 | Upstream basis | Pass | 改动均可追溯到 `tasks.md`；变更包外仅 SDD/知识库记录 |

### V4 Requirement ↔ implementation mapping

| Requirement | Implementation evidence |
|---|---|
| 页面与交互统一使用 shadcn/ui + Base UI | `apps/web/components.json`、`src/components/ui/*.tsx`、`src/lib/utils.ts` |
| 禁止手写 CSS 类 | `apps/web/src/styles.css`；页面仅使用 Tailwind 工具类 |
| 顶部居中横向 Home/Paws 两 Tab | `apps/web/src/routes/__root.tsx` `AppTabs` + `RootDocument` |
| Tab 选中态与路由同步 | `useRouterState` 读取 pathname；`useNavigate` 切换 `/`、`/paws` |
| `/` 展示问候语 | `apps/web/src/routes/index.tsx` + `greetingQueryOptions` |
| `/paws` 可访问且内容为空 | `apps/web/src/routes/paws.tsx`；`routeTree.gen.ts` 含 `/paws` |
| 错误页保留 `ApiError.detail` 与重试 | `__root.tsx` `RootErrorComponent` |
| 404 保留返回首页入口 | `__root.tsx` `NotFoundComponent` |
| 模板 UI 与自定义样式清理 | 删除 Header/Footer/ThemeToggle/About；`vite.config.ts` 移除 devtools |

## Findings

### CRITICAL

| # | Finding | Location | Suggestion |
|---|---------|----------|------------|
| — | 无 | — | — |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | `tasks.md` 1.2 的“改动前浏览器基线”未在本次重建后执行 | [fact] | `openspec/changes/refactor-web-ui-with-shadcn/tasks.md` | G2 接受以 P1 源码证据替代；不阻塞交付 |
| 2 | `scripts/portability.test.mjs` 仍有 3 项既有失败 | [fact] | `docs/ai4se-plugins/20261113-200619-bootstrap-checkpoints.md`、归档 change 相对链接、重定位测试缺失 `.qoder/skills/sdd-bootstrap/scripts/init-checkpoint-log.sh` | 与 REQ-003 无关，另开变更修复；本次不扩大范围 |
| 3 | `node --test` 首次运行因删除文件仍在 Git 索引中触发 `lstat ENOENT` | [fact] | `scripts/portability.test.mjs:16` | 提交删除后即消失；本次通过临时暂存删除项完成复核 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 未知路由 404 时 Home Tab 仍显示选中 | [inference] | `apps/web/src/routes/__root.tsx` `AppTabs` | 当前映射为“非 `/paws` 即 Home”；不影响 S5。若需语义精确，可在后续变更中让 404 无选中态 |
| 2 | 前端仍无自动化组件测试 | [inference] | `apps/web` | 本次按 G1 决定不引入测试框架；后续可独立引入 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | Base UI Tabs 受控值依赖 SSR 路径 | 已通过冷启动/深链验证 | 保持单一状态来源，不引入本地 Tab 状态 |
| 2 | shadcn CLI 受企业代理限制，组件源码由 registry 手工落盘 | CLI 无法直连 | 已核对官方 base-nova 源码；后续升级需重新比对 |
| 3 | 前端无自动化测试 | G1 决定本次不纳入 NFR 测试 | 由构建、类型检查与浏览器 E2E 覆盖 |

## Waiver

N/A — Overall=Pass。G2 待 IO/SA 签核。
