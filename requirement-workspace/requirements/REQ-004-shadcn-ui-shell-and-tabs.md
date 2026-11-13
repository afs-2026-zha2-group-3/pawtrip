---
id: REQ-004
title: shadcn/ui（Base UI）前端骨架与 Home/Paws 导航
status: in-change
discovery: Go (2026-11-14)
impact: ../analysis/REQ-004/impact-brief.md
deep_dive: ../analysis/REQ-004/deep-dive.md
sources:
  - apps/web/src/routes/__root.tsx
  - apps/web/src/routes/index.tsx
  - apps/web/src/routes/about.tsx
  - apps/web/src/components/Header.tsx
  - apps/web/src/components/Footer.tsx
  - apps/web/src/components/ThemeToggle.tsx
  - apps/web/src/styles.css
  - apps/web/package.json
  - openspec/specs/home-page/spec.md
  - openspec/specs/frontend-api-request/spec.md
  - openspec/specs/frontend-data-fetching/spec.md
  - docs/knowledge/architecture/README.md
  - docs/knowledge/external/README.md
---

# REQ-004: shadcn/ui（Base UI）前端骨架与 Home/Paws 导航

## Discovery Decision

Go — 候选能力清晰：删除 TanStack Start 模板 UI，以 shadcn/ui（Base UI）重建顶部居中横向 `Home` / `Paws` 两 Tab 的应用外壳；`Home` 对应 `/` 并保留现有问候语展示，`Paws` 对应 `/paws` 且内容为空。主分支已合并 REQ-003 用户登录，本次在 UI 重建基础上接入其会话守卫与 `/login` 跳转，不改变认证后端契约（2026-11-14）。

## 六字段

1. **id**:REQ-004
2. **statement**:清理 `apps/web` 中除首页问候语内容以外的全部模板 UI（Header、Footer、ThemeToggle、About 路由、自定义 CSS、Devtools），以 shadcn/ui（Base UI）作为唯一 UI 基础重建应用外壳：页面顶部居中横向展示 `Home` / `Paws` 两个 Tab；两个 Tab 对应真实路由 `/` 与 `/paws`，选中态与当前路径同步；`/` 与 `/paws` 位于登录守卫之下，未登录访问跳转 `/login`，登录页独立渲染且不显示顶部 Tab 导航，登录页与顶部登出入口使用 shadcn 组件，登出需经 shadcn 确认弹窗二次确认；`Home` 保留现有 `/api/greeting` 问候语展示，`Paws` 页面内容为空；现有路由级错误页、404 页与 TanStack Query 取数行为保持不变。
3. **actors**:
   - 已登录用户：打开 `/` 或 `/paws`，通过 Tab 在首页与 Paws 页之间切换，并可退出登录
   - 未登录访客：访问受保护路由时被引导到 `/login`，登录成功后返回 `/`
   - 前端应用 `apps/web`：渲染应用外壳、Tab 导航、登录页与页面内容
   - 开发者：维护 shadcn/ui（Base UI）组件、路由、登录守卫与页面结构
4. **rationale**:当前前端仍是脚手架模板，包含大量与 PawTrip 无关的 UI 和手写样式，无法作为后续功能的可靠基线。统一到 shadcn/ui（Base UI）并建立唯一导航外壳后，后续页面可以在一致的组件与路由结构上迭代，同时避免自定义样式继续扩散。
5. **acceptance hints**:
   - 未登录访问 `/` 或 `/paws` 时地址变为 `/login`，不展示受保护内容
   - 登录成功跳转 `/`；已登录访问 `/login` 跳回 `/`
   - `/` 与 `/paws` 顶部均显示居中的横向 `Home` / `Paws` 两 Tab，已登录时显示 `Log out`
   - 位于 `/` 时 `Home` 选中；位于 `/paws` 时 `Paws` 选中；点击 Tab 改变路由
   - `/` 内容区展示 `/api/greeting` 返回的 `message`，前端不硬编码
   - `/paws` 正常渲染应用外壳，内容区为空，不出现 404
   - `/login` 独立渲染，不显示 `Home` / `Paws` Tab 与 `Log out`；使用 shadcn Card / Input / Label / Button；登录失败停留在 `/login` 并展示通用错误
   - 点击 `Log out` 先打开 shadcn `AlertDialog` 确认弹窗；取消留在原页面，确认后才登出并回到 `/login`
   - 页面不再出现模板页头、页脚、社交链接、主题切换、About 路由与 Devtools
   - `styles.css` 不再包含 `page-wrap`、`island-shell`、`nav-link`、`demo-*` 等自定义类
   - 界面元素来自 `apps/web/src/components/ui/` 下的 shadcn/ui（Base UI）组件
   - 未知路由仍显示 404 页；认证成功但 `/api/greeting` 首次加载失败时仍进入错误页并提供重试；认证失败或后端整体不可用时跳转 `/login`
   - `npm run build` 通过，`routeTree.gen.ts` 含 `/paws`、`/login` 且不含 `/about`
6. **links to evidence**:
   - 现有模板 UI：`apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx`、`apps/web/src/routes/about.tsx`、`apps/web/src/styles.css`
   - 现有应用外壳与错误处理：`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/index.tsx`
   - Living Spec：`openspec/specs/home-page/spec.md`、`openspec/specs/frontend-api-request/spec.md`、`openspec/specs/frontend-data-fetching/spec.md`
   - 架构与外部依赖说明：`docs/knowledge/architecture/README.md`、`docs/knowledge/external/README.md`
   - shadcn/ui 本地技能文档：`.agents/skills/shadcn/SKILL.md`
   - shadcn Base UI registry：`https://ui.shadcn.com/r/styles/base-nova/`
   - 2026-11-14 需求方决策：两个 Tab 对应真实路由 `/` 与 `/paws`
   - 2026-11-14 需求方决策：shadcn/ui 底层 primitive 使用 Base UI
   - 登录契约：[REQ-003 用户登录与会话保护](REQ-003-user-login.md)、`openspec/changes/add-user-login/specs/frontend-authentication/spec.md`
   - 2026-11-14 需求方决策：rebase 最新 `main` 后接入登录与路由跳转，保留现有 UI 与路由

## Ready 形状

### Intent

在保持问候语正常路径、错误呈现与取数约定不变的前提下，用 shadcn/ui（Base UI）重建 PawTrip 的最小应用外壳，并接入主分支已有的会话登录，为后续页面提供统一的顶部 Tab 导航、受保护路由与组件基线。

### Actors 与权限边界

- 已登录用户（服务端会话）
- 未登录访客（仅可访问 `/login`）
- 前端 `apps/web`（展示方与路由守卫）
- 开发者（组件与路由维护方）

权限边界：认证由后端 Spring Security 负责；前端守卫只做界面引导，不作为授权依据。

### In / Out Scope

**In**

- 删除模板 `Header`、`Footer`、`ThemeToggle`、`/about` 路由、Devtools UI 与模板自定义 CSS
- 初始化 shadcn/ui（`components.json`、`src/lib/utils.ts`、Tailwind 4 主题变量），底层 primitive 固定为 Base UI
- 引入 Base UI 版本的 `Tabs`、`Card`、`Button`、`Input`、`Label`、`AlertDialog` 组件
- 根路由提供顶部居中横向 `Home` / `Paws` Tab 导航，Tab 选中态与路径同步；已登录时提供 `Log out`；`/login` 不渲染该外壳
- 登出使用 shadcn `AlertDialog` 二次确认
- `/` 使用 shadcn Card 展示现有问候语
- 新增 `/paws` 空页面
- 将 `/` 与 `/paws` 移入 `_authenticated` 守卫；未登录跳转 `/login`
- 用 shadcn 重写 `/login` 与会话检查态，保留主分支登录查询、CSRF 与 401 处理
- 错误页与 404 页改用 shadcn 组件，保留原有行为
- 更新前端架构知识说明

**Out**

- Paws 业务内容、数据接口与后端变更
- 登录后端契约（Spring Security、用户表、会话、CSRF）变更
- 问候语接口、错误契约、TanStack Query 取数与 request 层变更
- 主题切换、深色模式开关、国际化
- 新增前端测试框架
- 部署、CI/CD 与跨域方案

### Scenarios + AC Hints

**S1 两个页面共享外壳**

- Given 已登录用户打开 `/` 或 `/paws`
- When 页面渲染
- Then 顶部居中显示横向 `Home` / `Paws` 两 Tab
- And 顶部显示 `Log out`

**S2 Home 展示问候语**

- Given 用户已登录且 `/api/greeting` 可用
- When 用户打开 `/`
- Then `Home` Tab 选中
- And 内容区展示接口返回的 `message`

**S3 切换到 Paws**

- Given 已登录用户位于 `/`
- When 用户点击 `Paws` Tab
- Then 地址变为 `/paws`
- And `Paws` Tab 选中
- And 内容区为空

**S4 直接访问 Paws**

- Given 已登录用户在地址栏输入 `/paws`
- When 页面渲染
- Then 显示应用外壳且 `Paws` Tab 选中
- And 不出现 404

**S5 未登录访问受保护路由**

- Given 浏览器没有有效登录会话
- When 访问 `/` 或 `/paws`
- Then 地址变为 `/login`
- And 不展示问候语或 Paws 内容

**S6 登录与登出**

- Given 用户位于 `/login`
- When 输入正确凭据并提交
- Then 跳转 `/` 并展示问候语
- When 用户点击 `Log out`
- Then 显示 shadcn 确认弹窗
- When 用户取消
- Then 留在当前页面
- When 用户确认
- Then 回到 `/login`

**S7 未知路由**

- Given 已登录用户访问不存在的路由
- When 路由匹配失败
- Then 仍显示根路由 404 页

**S8 首页数据加载失败**

- Given 用户已登录且 `/api/greeting` 请求失败
- When 首页渲染
- Then 进入路由错误页并展示可读错误信息与重试入口
- And 认证查询本身失败时优先跳转 `/login`，不展示受保护内容

**S9 模板 UI 已清理**

- Given 改造完成
- When 浏览任意页面
- Then 不出现模板页头、页脚、社交链接、主题切换或 Devtools

**S10 无手写样式类**

- Given 改造完成
- When 检查 `apps/web/src/styles.css` 与页面 JSX
- Then 样式仅来自 Tailwind 工具类与 shadcn/ui（Base UI）主题变量
- And 不存在自定义 CSS 类选择器

**S11 登录页独立**

- Given 用户位于 `/login`
- When 页面渲染
- Then 不显示 `Home` / `Paws` Tab 与 `Log out`
- And 仅展示登录内容

**Boundary**:写入接口、Paws 业务内容、主题切换、i18n、SSR 预取与前端单元测试不在本次验收范围。

### Constraints

- 技术栈固定：TanStack Start / React 19 / Vite 8 / Tailwind CSS 4
- UI 基础固定为 shadcn/ui，底层 primitive 固定为 Base UI；不得引入 Radix 版本、其他 UI 组件库或手写交互控件
- 两个 Tab 对应真实路由 `/` 与 `/paws`（2026-11-14 已确认）
- `/` 与 `/paws` 必须登录后访问；未登录跳转 `/login`（REQ-003）
- 禁止手写 CSS 类；布局仅使用 Tailwind 工具类，交互与展示使用 shadcn/ui 组件
- 现有 `GET /api/greeting`、TanStack Query 取数、request 层与错误契约不变
- 认证查询、CSRF、401 清理与登出逻辑沿用 REQ-003，不重复实现
- 保留根路由 `errorComponent` 与 `notFoundComponent` 行为
- 规格先行：实现前形成 OpenSpec change（@rule:spec-first）

### Context

REQ-001 建立了问候语全链路；REQ-002 将数据访问统一到 JPA、前端取数统一到 TanStack Query，并补齐 request 层与路由级错误处理；REQ-003 在主分支加入服务端会话登录、CSRF、`/login` 与受保护路由。当前 `apps/web` 仍是模板形态：`__root.tsx` 挂载 Header/Footer/ThemeToggle/Devtools，`styles.css` 含约 480 行自定义样式，`/about` 为示例页。本次替换前端 UI 载体并接入 REQ-003 登录，不改数据层、认证后端与接口。

### Affected Capabilities

- **ADDED** `ui-foundation`：页面与交互统一使用 shadcn/ui（Base UI），禁止手写 CSS 类与多余包裹标签
- **ADDED** `web-app-shell`：顶部居中横向两 Tab 导航，Tab 与路由同步，Home 展示问候语；受保护路由未登录跳转 `/login`
- **ADDED** `paws-page`：`/paws` 受登录保护、可访问且内容为空
- **MODIFIED** 无：`home-page`、`frontend-data-fetching`、`frontend-api-request` 行为不变；`frontend-authentication` 由 REQ-003 定义并复用

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 两个 Tab 是否对应真实路由？ | Product / Dev | Confirmed（2026-11-14）：路由 Tab，`/` 与 `/paws` |
| blocking | resolved | 现有错误页与 404 行为是否保留？ | SA / Dev | Confirmed：保留行为，仅替换为 shadcn 组件 |
| blocking | resolved | shadcn/ui 底层 primitive 选 Radix 还是 Base UI？ | Product / Dev | Confirmed（2026-11-14）：Base UI |
| blocking | resolved | 主分支登录功能如何与现有 UI/路由合并？ | Product / Dev | Confirmed（2026-11-14）：rebase 后保留 `/`、`/paws` 与 shadcn 外壳，接入 `_authenticated` 守卫与 `/login` |
| non-blocking | deferred | 导航是否吸顶？ | Dev | 后续解决；不影响能力边界 |
| non-blocking | deferred | 是否保留 shadcn 默认深色主题令牌？ | Dev | 保留令牌但不提供切换入口；后续解决 |
| non-blocking | deferred | 是否引入前端组件测试？ | QA / Dev | 后续解决；本次以构建与浏览器验收 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Tab 与路由关系 | 未确定时无法定义导航、深链与验收 | 已与需求方确认：路由 Tab（`/`、`/paws`） |
| WARNING | resolved | `openspec/specs/frontend-api-request/spec.md` | 清理 UI 时可能误删错误页与 404 行为 | 保留行为，仅改用 shadcn 组件呈现 |
| WARNING | resolved | `docs/knowledge/architecture/README.md` | 前端结构说明在改造后过时 | 在任务 5.5 中更新 |
| WARNING | resolved | shadcn 组件选型 | 初版方案误用 Radix 版本，与需求方指定的 Base UI 不符 | 已回退 Radix 实现，改用官方 `base-nova` registry 的 Base UI 组件 |
| SUGGESTION | resolved | `openspec/specs/home-page/spec.md` | 首页展示契约保持不变 | 无需修改 Living Spec，由 `web-app-shell` 补充外壳场景 |
| BLOCKER | resolved | 需求编号冲突 | 主分支 REQ-003 已被“用户登录”占用 | 本 UI 需求改为 REQ-004，分析目录与引用同步迁移 |
| WARNING | resolved | rebase 冲突 | `Header.tsx`、`_authenticated/index.tsx`、`routeTree.gen.ts`、文档与 registry 冲突 | 保留我们的 shadcn UI/路由，吸收登录守卫；重新生成路由树 |

BLOCKER 数:0。

## Evidence / Verification Notes

- 当前模板 UI：`apps/web/src/components/Header.tsx:6`、`Footer.tsx:1`、`ThemeToggle.tsx:34`、`apps/web/src/routes/about.tsx:3`
- 当前外壳与错误处理：`apps/web/src/routes/__root.tsx:40-119`
- 当前自定义样式：`apps/web/src/styles.css:1-477`
- 现有 Living Spec：`openspec/specs/home-page/spec.md`、`frontend-api-request/spec.md`、`frontend-data-fetching/spec.md`
- shadcn/ui 文档入口：`.agents/skills/shadcn/SKILL.md`、https://www.shadcn.com.cn/llms.txt
- Base UI 组件源码：`https://ui.shadcn.com/r/styles/base-nova/tabs.json`、`button.json`、`card.json`、`input.json`、`label.json`
- 登录实现（来自 REQ-003）：`apps/web/src/queries/auth.ts`、`apps/web/src/routes/_authenticated.tsx`、`apps/web/src/routes/login.tsx`、`apps/web/src/lib/http/request.ts`、`apps/web/src/lib/query-client.ts`
- 登录契约：`openspec/changes/add-user-login/specs/frontend-authentication/spec.md`
