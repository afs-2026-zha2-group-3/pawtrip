# 顶部宠物横幅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在所有非登录页面的公共顶部导航后方显示用户提供的横向宠物图案图片。

**Architecture:** 将图片复制为前端静态资源，在 `styles.css` 中定义顶部横幅样式，并给根布局的 `AppHeader` 添加稳定的语义 class。导航内容继续由现有 React 组件渲染，图片只承担背景展示，不改变路由和交互。

**Tech Stack:** React 19、TanStack Router、Tailwind CSS 4、Vite、Vitest/Playwright。

**Spec:** `docs/superpowers/specs/2026-11-17-top-pet-banner-design.md`

## Global Constraints

- 使用仓库资源路径，不依赖 `/Users/racio/Downloads` 等临时路径。
- 登录页继续不渲染公共 `AppHeader`。
- 不改变现有导航文案、路由或认证逻辑。
- 与用户对话和仓库文档使用中文。

## Review Focus

- 非登录页面：顶部横幅应显示且导航仍可点击；由构建和手工/浏览器检查覆盖。
- 登录页面：不应渲染顶部横幅；由现有根布局条件和回归检查覆盖。
- 窄视口：横幅应裁剪而不是制造横向滚动；由 `background-size: cover` 与构建检查覆盖。
- 资源打包：图片必须被 Vite 解析为仓库内资源；由构建检查覆盖。
- 现有工作区改动：只修改本次涉及文件，不覆盖用户已有改动；由 `git diff` 检查覆盖。

### Task 1: 添加顶部横幅资源与样式

**Files:**
- Create: `apps/web/src/assets/pet-heads-banner.jpeg`
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Produces: `.paw-header` 样式，提供横幅背景、约 80px 高度和窄屏裁剪行为。

- [ ] **Step 1: 写回归检查**

检查 `apps/web/src/styles.css` 中 `.paw-header` 规则包含横幅背景资源、`background-size: cover`、居中定位和不会溢出的布局约束；先运行检查确认当前规则不存在。

- [ ] **Step 2: 添加资源并实现最小样式**

将用户提供的 `IMG_168A7B4D5D64-1.jpeg` 复制为 `apps/web/src/assets/pet-heads-banner.jpeg`，并在样式文件中新增 `.paw-header`：使用该资源作为背景，背景色使用图片的浅米色，`min-height` 约 80px，`background-position: center`，`background-size: cover`，并保留现有 flex 定位。

- [ ] **Step 3: 运行前端构建**

运行 `npm run build`，确认 Vite 能解析 JPEG 资源且无 TypeScript/CSS 构建错误。

### Task 2: 将样式接入公共顶部

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`

**Interfaces:**
- Consumes: Task 1 的 `.paw-header` 样式。
- Produces: 非登录页面的 `header` 元素带有 `paw-header` class；登录页仍不渲染该元素。

- [ ] **Step 1: 写失败的组件回归检查**

在根布局测试中断言 `AppHeader` 的 `header` 具有 `paw-header` class；先运行并确认当前实现失败。

- [ ] **Step 2: 最小接入**

只给现有 `AppHeader` 的 `header` className 增加 `paw-header`，不调整认证、导航或退出登录逻辑。

- [ ] **Step 3: 运行测试与构建**

运行 `npm run test -w apps/web` 和 `npm run build`；确认新增回归检查及既有测试全部通过。

### Task 3: 交付前检查

**Files:**
- Verify: `apps/web/src/assets/pet-heads-banner.jpeg`
- Verify: `apps/web/src/routes/__root.tsx`
- Verify: `apps/web/src/styles.css`

- [ ] **Step 1: 检查差异范围**

运行 `git status --short` 与 `git diff -- apps/web/src/routes/__root.tsx apps/web/src/styles.css docs/superpowers`，确认没有覆盖无关工作区改动。

- [ ] **Step 2: 验证资源与实现**

确认构建产物中引用了横幅资源，并报告测试/构建结果；若未启动应用，不声称已完成浏览器视觉验收。

### Task 4: 重排地点浏览页并预留 AI Chatbox 区域

**Files:**
- Modify: `apps/web/src/routes/_authenticated/attractions/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/attractions/-day-timeline.tsx`
- Modify: `e2e/attraction-pet-rules.spec.ts`

**Interfaces:**
- Consumes: 现有 `TripDateCard`、`DayTimeline`、地点卡片和 `LocationMap`。
- Produces: `data-testid="attractions-layout"` 四栏桌面布局，以及 `data-testid="ai-chatbox-slot"` 的右侧 AI 预留区域。

- [ ] **Step 1: 写失败的浏览器回归测试**

新增 E2E 用例：进入有激活行程的地点浏览页，断言布局容器和 AI 预留区域可见、预留区域位于地图右侧，并断言顶部横幅存在。

- [ ] **Step 2: 运行新增用例确认失败**

运行 `npm run test:e2e:playwright -- e2e/attraction-pet-rules.spec.ts -g "four-column"`；预期因布局 test id 和顶部横幅尚不存在而失败。

- [ ] **Step 3: 实现最小布局改动**

在地点浏览页桌面断点下改为“左侧行程栏 / 中间地点卡片 / 右侧地图 / 最右 AI 预留位”四栏；将日期卡、标题、搜索和筛选保留在对应列上方；移动端退化为单列，不渲染 AI 预留位。为 `DayTimeline` 增加可选标题，地点页显示“已选择的地点”。

- [ ] **Step 4: 运行新增用例与前端构建**

运行新增 E2E 用例和 `npm run build`，确认布局行为、资源构建与已有页面代码均可编译。
