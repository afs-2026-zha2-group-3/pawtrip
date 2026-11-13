# REQ-004 Impact Brief

## 1. Requirement set

- [REQ-004 shadcn/ui 前端骨架与 Home/Paws 导航](../../requirements/REQ-004-shadcn-ui-shell-and-tabs.md)
- Deep-dive：[deep-dive.md](deep-dive.md)

## 2. As-is asset inventory（证据路径）

**Knowledge base**

- `docs/knowledge/architecture/README.md`：前端栈为 Vite 8 / React 19 / TanStack Router·Start / Tailwind CSS 4 / shadcn/ui（Base UI）；运行拓扑与前端取数约定
- `docs/knowledge/external/README.md`：shadcn/ui 本地技能入口 `.agents/skills/shadcn/SKILL.md`、llms 索引
- `docs/knowledge/rules/architecture/react-patterns.md`、`rules/quality/react-coding-style.md`、`rules/security/react-security.md`、`rules/process/spec-first.md`
- `.agents/skills/shadcn/SKILL.md`：shadcn CLI 与 Tailwind 4 组件约定

**Living Spec**

- `openspec/specs/home-page/spec.md`：首页展示 `/api/greeting` 的 `message`
- `openspec/specs/frontend-data-fetching/spec.md`：TanStack Query、集中 query options、客户端取数边界
- `openspec/specs/frontend-api-request/spec.md`：request 层、typed `ApiError`、重试、路由级错误页与 404
- `openspec/specs/greeting/spec.md`、`openspec/specs/backend-data-access/spec.md`、`openspec/specs/backend-error-handling/spec.md`：本次不改动

**Post-archive SDD assets**

- `openspec/changes/archive/2026-11-13-hello-world-greeting/`：首页与问候语基线
- `openspec/changes/archive/2026-11-13-refactor-data-access-and-query/`：Query / request / Problem Details 基线

**当前实现**

- `apps/web/src/routes/__root.tsx`：模板外壳、错误页、404、Devtools、主题初始化脚本
- `apps/web/src/routes/index.tsx`：首页问候语
- `apps/web/src/routes/about.tsx`：模板示例页
- `apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx`：模板 UI
- `apps/web/src/styles.css`：模板自定义变量与类（约 480 行）
- `apps/web/package.json`、`apps/web/vite.config.ts`、`apps/web/tsconfig.json`：依赖、Devtools 插件、`@/*` 别名
- `apps/server/**`：本次无改动

## 3. As-is → proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/web/src/routes/__root.tsx` | 模板 Header/Footer/ThemeToggle/Devtools + 自定义错误页/404 样式 | 移除模板与 Devtools，使用 shadcn `Tabs` 构建顶部居中导航；错误页/404 改用 `Card` + `Button`，行为不变 |
| `apps/web/src/routes/_authenticated/index.tsx` | 自定义 `island-shell` 样式展示问候语，位于登录保护布局下 | 使用 shadcn `Card` 展示同一 `greetingQueryOptions` 数据 |
| `apps/web/src/routes/about.tsx` | 模板示例页 | 删除 |
| `apps/web/src/routes/_authenticated/paws.tsx` | 不存在 | 新增受登录保护的 `/paws` 空页面 |
| `apps/web/src/routes/_authenticated.tsx` | 登录守卫，加载态使用模板样式 | 保留守卫逻辑，加载态改用 shadcn `Card` |
| `apps/web/src/routes/login.tsx` | 原生表单与模板样式 | 用 shadcn `Card` / `Input` / `Label` / `Button` 重写，保留 auth mutation 与 401 错误 |
| `apps/web/src/routes/__root.tsx` | 模板 Header 已删除，无登录态 UI | 顶部导航在已登录时显示 shadcn `Button` 登出 |
| `apps/web/src/queries/auth.ts`、`lib/http/request.ts`、`lib/query-client.ts` | 来自 REQ-003 | 直接复用，不修改认证协议 |
| `apps/web/src/components/Header.tsx` 等 | 模板组件 | 删除 |
| `apps/web/src/styles.css` | Google Fonts + typography + 自定义变量/类 | 仅保留 Tailwind 引入、shadcn 主题变量与基础层 |
| `apps/web/package.json` | 模板 UI / Devtools / typography 依赖 | 新增 shadcn + Base UI 运行时依赖（`@base-ui/react`、`shadcn` 等）；移除模板专用依赖 |
| `apps/web/vite.config.ts` | 含 `devtools()` 插件 | 移除 Devtools 插件，保留 `/api` 代理 |
| `apps/web/src/components/ui/*`、`src/lib/utils.ts`、`components.json` | 不存在 | 按 shadcn CLI（`--base base`，base-nova）等价配置生成 Base UI 组件 |
| `openspec/specs/home-page/spec.md` | 首页展示问候语 | 行为不变，checked no impact |
| `openspec/specs/frontend-*` | 取数与错误契约 | 行为不变，checked no impact |
| `apps/server/**` | 问候语接口与错误契约 | 无改动 |

## 4. Blast radius

- **直接受影响**：`apps/web` 的根路由、首页路由、组件目录、样式入口、依赖与 Vite 配置。
- **不受影响**：`apps/server`（含 REQ-003 登录后端）、SQLite/Flyway、`GET /api/greeting`、TanStack Query 与 request 层、错误响应契约。
- **运行拓扑**：不变；浏览器仍通过 Vite `/api` 代理访问 Spring Boot，认证使用同源会话 cookie。

## 5. Artifact impact

- **Specs**：新增 `ui-foundation`、`web-app-shell`、`paws-page` 三个 delta capability；既有 6 个 Living Spec 不修改。
- **Tests**：仓库当前无前端测试框架；不新增框架。验证依赖 `npm run build` 与浏览器端到端检查；后端测试无需变更。
- **Docs / KB**：`docs/knowledge/architecture/README.md` 已合并 REQ-003 认证章节，本次补充应用外壳、受保护路由、`/paws` 与 shadcn 组件入口。
- **OpenSpec**：变更包 `openspec/changes/refactor-web-ui-with-shadcn/`。

## 6. Dual-track notes

- **OpenSpec**：一个 change 覆盖外壳、页面与 UI 基础约定；delta specs 按 capability 拆分，便于归档合并。
- **Agile**：可拆为「清理模板 + shadcn 基础设施」「应用外壳与两页面」「验证与文档」三类任务，但用户可见价值集中在同一垂直切片，建议单 change 交付。

## 7. Risks & blockers

| 风险 | 影响 | 缓解 |
|---|---|---|
| shadcn CLI 在 TanStack Start + Tailwind 4 下初始化参数不确定，且企业代理可能阻断下载 | 可能生成错误的组件路径或主题变量 | 实现前运行 `npx shadcn@latest init --help` / `info`；受限时按官方 `base-nova` registry 源码手工落盘并核对 |
| `routeTree.gen.ts` 残留 `/about` | 构建或路由异常 | 通过 `npm run build` / `dev` 重新生成后核查 |
| 删除自定义样式引发未发现的引用 | 构建失败或样式缺失 | 删除后全局检索模板类与组件引用，并以构建兜底 |
| 误删错误页 / 404 行为 | 违反现有 Living Spec | 仅替换呈现组件，保留 `errorComponent` / `notFoundComponent` 逻辑并使用现有场景验收 |
| rebase 登录分支产生路由/文档冲突 | 路由树、需求编号或知识库漂移 | 保留 UI/路由，吸收 `_authenticated` 守卫；需求编号改 REQ-004；重新生成 `routeTree.gen.ts` |
| 登录守卫与 SSR 时序不一致 | 首屏闪烁或错误跳转 | auth query 仅客户端启用，SSR 渲染会话检查态；复用 REQ-003 的 401 清理逻辑 |

**Critical blockers**：无。

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`refactor-web-ui-with-shadcn`。理由：场景约 8 个但同属一个垂直切片（应用外壳 + 两个页面），范围 S，可独立运行与验收；拆分会导致外壳与页面契约强耦合、验收碎片化。
- 依赖 / 阶段：单阶段，无跨 change 依赖；`web-app-shell` 与 `paws-page` 依赖 `ui-foundation` 的组件基础，但在同一 change 内顺序实现即可。
- 不推荐按技术层拆成「样式清理」「组件初始化」「导航」多个 change：会在中间状态产生不可演示的 UI。
