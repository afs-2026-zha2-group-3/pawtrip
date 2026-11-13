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

Go — 候选能力清晰：删除 TanStack Start 模板 UI，以 shadcn/ui（Base UI）重建顶部居中横向 `Home` / `Paws` 两 Tab 的应用外壳；`Home` 对应 `/` 并保留现有问候语展示，`Paws` 对应 `/paws` 且内容为空。与 Living Spec `home-page`、`frontend-data-fetching`、`frontend-api-request` 无行为冲突，仅替换 UI 载体（2026-11-14）。

## 六字段

1. **id**:REQ-004
2. **statement**:清理 `apps/web` 中除首页问候语内容以外的全部模板 UI（Header、Footer、ThemeToggle、About 路由、自定义 CSS、Devtools），以 shadcn/ui（Base UI）作为唯一 UI 基础重建应用外壳：页面顶部居中横向展示 `Home` / `Paws` 两个 Tab；两个 Tab 对应真实路由 `/` 与 `/paws`，选中态与当前路径同步；`Home` 保留现有 `/api/greeting` 问候语展示，`Paws` 页面内容为空；现有路由级错误页、404 页与 TanStack Query 取数行为保持不变。
3. **actors**:
   - 访客：打开 `/` 或 `/paws`，通过 Tab 在首页与 Paws 页之间切换
   - 前端应用 `apps/web`：渲染应用外壳、Tab 导航与页面内容
   - 开发者：维护 shadcn/ui（Base UI）组件、路由与页面结构
4. **rationale**:当前前端仍是脚手架模板，包含大量与 PawTrip 无关的 UI 和手写样式，无法作为后续功能的可靠基线。统一到 shadcn/ui（Base UI）并建立唯一导航外壳后，后续页面可以在一致的组件与路由结构上迭代，同时避免自定义样式继续扩散。
5. **acceptance hints**:
   - `/` 与 `/paws` 顶部均显示居中的横向 `Home` / `Paws` 两 Tab
   - 位于 `/` 时 `Home` 选中；位于 `/paws` 时 `Paws` 选中；点击 Tab 改变路由
   - `/` 内容区展示 `/api/greeting` 返回的 `message`，前端不硬编码
   - `/paws` 正常渲染应用外壳，内容区为空，不出现 404
   - 页面不再出现模板页头、页脚、社交链接、主题切换、About 路由与 Devtools
   - `styles.css` 不再包含 `page-wrap`、`island-shell`、`nav-link`、`demo-*` 等自定义类
   - 界面元素来自 `apps/web/src/components/ui/` 下的 shadcn/ui（Base UI）组件
   - 未知路由仍显示 404 页；首页首次加载失败仍进入错误页并提供重试
   - `npm run build` 通过，`routeTree.gen.ts` 含 `/paws` 且不含 `/about`
6. **links to evidence**:
   - 现有模板 UI：`apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx`、`apps/web/src/routes/about.tsx`、`apps/web/src/styles.css`
   - 现有应用外壳与错误处理：`apps/web/src/routes/__root.tsx`、`apps/web/src/routes/index.tsx`
   - Living Spec：`openspec/specs/home-page/spec.md`、`openspec/specs/frontend-api-request/spec.md`、`openspec/specs/frontend-data-fetching/spec.md`
   - 架构与外部依赖说明：`docs/knowledge/architecture/README.md`、`docs/knowledge/external/README.md`
   - shadcn/ui 本地技能文档：`.agents/skills/shadcn/SKILL.md`
   - shadcn Base UI registry：`https://ui.shadcn.com/r/styles/base-nova/`
   - 2026-11-14 需求方决策：两个 Tab 对应真实路由 `/` 与 `/paws`
   - 2026-11-14 需求方决策：shadcn/ui 底层 primitive 使用 Base UI

## Ready 形状

### Intent

在保持问候语正常路径、错误呈现与取数约定不变的前提下，用 shadcn/ui（Base UI）重建 PawTrip 的最小应用外壳，为后续页面提供统一的顶部 Tab 导航与组件基线。

### Actors 与权限边界

- 访客（无认证）
- 前端 `apps/web`（展示方）
- 开发者（组件与路由维护方）

权限边界：无用户账户与权限体系（非目标）。

### In / Out Scope

**In**

- 删除模板 `Header`、`Footer`、`ThemeToggle`、`/about` 路由、Devtools UI 与模板自定义 CSS
- 初始化 shadcn/ui（`components.json`、`src/lib/utils.ts`、Tailwind 4 主题变量），底层 primitive 固定为 Base UI
- 引入 Base UI 版本的 `Tabs`、`Card`、`Button` 组件
- 根路由提供顶部居中横向 `Home` / `Paws` Tab 导航，Tab 选中态与路径同步
- `/` 使用 shadcn Card 展示现有问候语
- 新增 `/paws` 空页面
- 错误页与 404 页改用 shadcn 组件，保留原有行为
- 更新前端架构知识说明

**Out**

- Paws 业务内容、数据接口与后端变更
- 问候语接口、错误契约、TanStack Query 取数与 request 层变更
- 主题切换、深色模式开关、国际化
- 新增前端测试框架
- 部署、CI/CD 与跨域方案

### Scenarios + AC Hints

**S1 两个页面共享外壳**

- Given 访客打开 `/` 或 `/paws`
- When 页面渲染
- Then 顶部居中显示横向 `Home` / `Paws` 两 Tab

**S2 Home 展示问候语**

- Given 后端已启动且 `/api/greeting` 可用
- When 访客打开 `/`
- Then `Home` Tab 选中
- And 内容区展示接口返回的 `message`

**S3 切换到 Paws**

- Given 访客位于 `/`
- When 访客点击 `Paws` Tab
- Then 地址变为 `/paws`
- And `Paws` Tab 选中
- And 内容区为空

**S4 直接访问 Paws**

- Given 访客在地址栏输入 `/paws`
- When 页面渲染
- Then 显示应用外壳且 `Paws` Tab 选中
- And 不出现 404

**S5 未知路由**

- Given 访客访问不存在的路由
- When 路由匹配失败
- Then 仍显示根路由 404 页

**S6 首页首次加载失败**

- Given `/api/greeting` 请求失败且无缓存
- When 首页渲染
- Then 进入路由错误页并展示可读错误信息与重试入口

**S7 模板 UI 已清理**

- Given 改造完成
- When 浏览任意页面
- Then 不出现模板页头、页脚、社交链接、主题切换或 Devtools

**S8 无手写样式类**

- Given 改造完成
- When 检查 `apps/web/src/styles.css` 与页面 JSX
- Then 样式仅来自 Tailwind 工具类与 shadcn/ui（Base UI）主题变量
- And 不存在自定义 CSS 类选择器

**Boundary**:写入接口、Paws 业务内容、主题切换、i18n、SSR 预取与前端单元测试不在本次验收范围。

### Constraints

- 技术栈固定：TanStack Start / React 19 / Vite 8 / Tailwind CSS 4
- UI 基础固定为 shadcn/ui，底层 primitive 固定为 Base UI；不得引入 Radix 版本、其他 UI 组件库或手写交互控件
- 两个 Tab 对应真实路由 `/` 与 `/paws`（2026-11-14 已确认）
- 禁止手写 CSS 类；布局仅使用 Tailwind 工具类，交互与展示使用 shadcn/ui 组件
- 现有 `GET /api/greeting`、TanStack Query 取数、request 层与错误契约不变
- 保留根路由 `errorComponent` 与 `notFoundComponent` 行为
- 规格先行：实现前形成 OpenSpec change（@rule:spec-first）

### Context

REQ-001 建立了问候语全链路；REQ-002 将数据访问统一到 JPA、前端取数统一到 TanStack Query，并补齐 request 层与路由级错误处理。当前 `apps/web` 仍是模板形态：`__root.tsx` 挂载 Header/Footer/ThemeToggle/Devtools，`styles.css` 含约 480 行自定义样式，`/about` 为示例页。本次仅替换前端 UI 载体，不改数据层与接口。

### Affected Capabilities

- **ADDED** `ui-foundation`：页面与交互统一使用 shadcn/ui（Base UI），禁止手写 CSS 类与多余包裹标签
- **ADDED** `web-app-shell`：顶部居中横向两 Tab 导航，Tab 与路由同步，Home 展示问候语
- **ADDED** `paws-page`：`/paws` 可访问且内容为空
- **MODIFIED** 无：`home-page`、`frontend-data-fetching`、`frontend-api-request` 行为不变

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 两个 Tab 是否对应真实路由？ | Product / Dev | Confirmed（2026-11-14）：路由 Tab，`/` 与 `/paws` |
| blocking | resolved | 现有错误页与 404 行为是否保留？ | SA / Dev | Confirmed：保留行为，仅替换为 shadcn 组件 |
| blocking | resolved | shadcn/ui 底层 primitive 选 Radix 还是 Base UI？ | Product / Dev | Confirmed（2026-11-14）：Base UI |
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

BLOCKER 数:0。

## Evidence / Verification Notes

- 当前模板 UI：`apps/web/src/components/Header.tsx:6`、`Footer.tsx:1`、`ThemeToggle.tsx:34`、`apps/web/src/routes/about.tsx:3`
- 当前外壳与错误处理：`apps/web/src/routes/__root.tsx:40-119`
- 当前自定义样式：`apps/web/src/styles.css:1-477`
- 现有 Living Spec：`openspec/specs/home-page/spec.md`、`frontend-api-request/spec.md`、`frontend-data-fetching/spec.md`
- shadcn/ui 文档入口：`.agents/skills/shadcn/SKILL.md`、https://www.shadcn.com.cn/llms.txt
- Base UI 组件源码：`https://ui.shadcn.com/r/styles/base-nova/tabs.json`、`button.json`、`card.json`
