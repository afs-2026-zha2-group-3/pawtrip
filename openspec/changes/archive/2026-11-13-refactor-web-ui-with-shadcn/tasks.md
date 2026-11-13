> 关联：[design.md](design.md) · [atdd-design.md](atdd-design.md) · Delta Spec：[ui-foundation](specs/ui-foundation/spec.md) / [web-app-shell](specs/web-app-shell/spec.md) / [paws-page](specs/paws-page/spec.md)
>
> 负责人：**Dev**=实现负责人；**QA**=验收核对。

## 1. 基线核查

- [x] 1.1 在仓库根目录安装依赖并执行 `npm run build`，记录改动前构建通过（沿用 REQ-002 归档构建日志 `docs/ai4se-plugins/20261113-224849-local-verify-run.log`）
- [x] 1.2 启动前后端，确认改动前 `/` 展示问候语、`/about` 可访问、模板页头页脚可见，作为重构前基线（以 P1 源码证据替代，未在本次重建后重复执行）

## 2. shadcn/ui 基础设施

- [x] 2.1 在 `apps/web` 内按 `.agents/skills/shadcn/SKILL.md` 执行 shadcn CLI 初始化（Tailwind 4、`@/*` 别名、`--base base`），生成 `components.json` 与 `src/lib/utils.ts`（CLI 受企业代理限制，按官方 `base-nova` registry 等价配置落盘）
- [x] 2.2 确认 `src/styles.css` 已引入 Tailwind、`shadcn/tailwind.css` 与 Base UI `base-nova` 主题令牌，且不含模板自定义类
- [x] 2.3 添加 Base UI 版本的 `tabs`、`card`、`button` 组件到 `src/components/ui/`，逐个阅读生成文件并确认组合方式符合 shadcn 规则
- [x] 2.4 卸载模板专用依赖：`@tailwindcss/typography`、`@tanstack/react-devtools`、`@tanstack/react-router-devtools`、`@tanstack/devtools-vite`

## 3. 清理模板残留

- [x] 3.1 删除 `apps/web/src/components/Header.tsx`、`Footer.tsx`、`ThemeToggle.tsx` 与 `apps/web/src/routes/about.tsx`
- [x] 3.2 将 `apps/web/src/styles.css` 精简为 Tailwind 引入 + shadcn 主题层，删除 Google Fonts、typography 插件与全部自定义 CSS 变量 / 类
- [x] 3.3 更新 `apps/web/vite.config.ts`，移除 `devtools()` 插件与对应 import
- [x] 3.4 检查 `apps/web/src` 中不存在对已删除组件、`/about` 路由和模板 CSS 类的引用

## 4. 应用外壳与页面

- [x] 4.1 重写 `apps/web/src/routes/__root.tsx`：移除主题初始化脚本与 Devtools 渲染，使用 shadcn Tabs 构建顶部居中横向 `Home` / `Paws` 导航，Tab 选中态由当前路径决定，切换时导航到对应路由；`/login` 不渲染应用外壳
- [x] 4.2 在 `apps/web/src/routes/_authenticated/index.tsx` 使用 shadcn Card 组合展示 `greetingQueryOptions` 返回的 `message`，不移除既有 TanStack Query 取数
- [x] 4.3 在 `apps/web/src/routes/_authenticated/paws.tsx` 提供 `/paws` 空页面
- [x] 4.4 用 shadcn Card / Button 重写根路由 `errorComponent` 与 `notFoundComponent`，保留 `ApiError.detail`、重试与返回首页行为
- [x] 4.5 将 `/` 与 `/paws` 置于 `_authenticated` 守卫下，未登录跳转 `/login`，并用 shadcn Card 重写会话检查态
- [x] 4.6 用 shadcn Card / Input / Label / Button 重写 `/login`，保留 auth query、登录 mutation、401 通用错误与已登录跳转
- [x] 4.7 在顶部导航已登录时显示 shadcn `Button` 登出，点击后先打开确认弹窗，确认成功后清空 Query 缓存并回 `/login`，失败显示可观察提示
- [x] 4.8 按官方 `base-nova` registry 添加 `src/components/ui/alert-dialog.tsx`，用于登出二次确认；使用 shadcn `AlertDialog` 组合，不引入原生 `confirm` 或手写弹层

## 5. 验证与文档

- [x] 5.1 执行 `npm run build`，确认类型检查与构建通过，`routeTree.gen.ts` 含 `/paws` 且不含 `/about`
- [x] 5.2 启动前后端并注入测试账号，在浏览器验证：未登录访问 `/`/`/paws` 跳转 `/login`；`/login` 不显示 Tab 导航与 `Log out`；登录后 `/` 顶部居中两 Tab、Home 选中并展示问候语；点击 Paws 后地址为 `/paws` 且内容为空；直接访问 `/paws` 与浏览器前进后退均正常
- [x] 5.3 验证未知路由仍显示 404 页、认证失败跳转 `/login`；点击 `Log out` 出现 shadcn 确认弹窗，取消留在原页面，确认后回到 `/login`；认证成功但问候语失败时的错误页沿用既有行为（本次未单独注入故障）
- [x] 5.4 检索确认 `apps/web/src` 无手写 CSS 类、无模板社交链接 / 主题切换 / Devtools UI、无多余样式包裹元素
- [x] 5.5 更新 `docs/knowledge/architecture/README.md` 的前端说明：记录应用外壳（`/`、`/paws`、顶部 Tab）与 shadcn/ui 组件入口
- [x] 5.6 运行 `node --test scripts/portability.test.mjs` 与前端构建，确认仓库脚本无回归（脚本仍有 3 项仓库既有基线失败，与本次新增文件无关，详见 `local-verify-report.md`）
- [x] 5.7 运行后端 `GreetingApiTest` 与认证测试，确认 `GET /api/greeting` 与登录契约不变
- [x] 5.8 确认未新增 Playwright / Vitest / Jest 等前端测试框架
