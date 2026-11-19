# Tasks

## 1. 废弃浮动行程面板

- [x] 1.1 应用外壳移除全局 `<TripPanel />`，只为 `/login` 之外的页面保留 Agent 面板
- [x] 1.2 地点浏览页内嵌面板头部补齐保存状态与「行程单」入口
- [x] 1.3 内嵌面板的途内交通段改用完整版（默认方式、估算、加载/失败态），删除紧凑版分支与单测
- [x] 1.4 调整依赖浮动面板的 E2E：`trips-panel`、`intra-city-transport`、`attractions-timeline-hints`、`itinerary`、`hospital-contact-copy`、`trip-helpers`

## 2. 我的行程页

- [x] 2.1 存在激活行程时「创建新行程」仍可用并跳转 `/cities`；未确认草稿保持禁用
- [x] 2.2 页面内容改用 `PageFrame` 白卡容器（与行程单页一致）
- [x] 2.3 新增 E2E：激活状态下创建新行程，新行程成为激活行程、原行程回到普通卡片

## 3. 验证

- [x] 3.1 `npx vitest run`（apps/web）328 通过
- [x] 3.2 定向 E2E（7 个受影响 spec，临时库 + worker 账号）通过
- [x] 3.3 `npx --no-install openspec change validate 2026-11-18-deprecate-floating-trip-panel --strict` 通过

## 4. 我的行程淡橘色外框（2026-11-19）

- [x] 4.1 `PageFrame` 白卡容器描边改用 `paw-accent` 淡橘色
- [x] 4.2 `tsc --noEmit`、目标 E2E
- [x] 4.3 `openspec change validate 2026-11-18-deprecate-floating-trip-panel --strict`

- 实现：`/trips` 两个 `PageFrame`（加载态与主态）均加 `border-2 border-paw-accent print:border-0`。
- 验证：浏览器实测描边 `rgb(236, 148, 85)`；`trips-panel` 新增用例通过；`tsc`/`build` 通过；`validate --strict` valid。未提交、未推送。

## 5. 淡奶黄描边与去阴影（2026-11-19）

- [x] 5.1 `/trips` 白卡容器描边改用 `paw-accent-soft` 淡奶黄（`#FFEFD6`）
- [x] 5.2 白卡容器移除阴影
- [x] 5.3 E2E 断言描边 `rgb(255, 239, 214)` 且 `box-shadow: none`
- [x] 5.4 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 5.5 `openspec change validate 2026-11-18-deprecate-floating-trip-panel --strict`

- 实现：`/trips` 两个 `PageFrame` 均 `border-2 border-paw-accent-soft print:border-0`；`PageFrame` 默认样式移除 `shadow-pet-card`。
- 验证：`trips-panel` 用例断言 `rgb(255, 239, 214)` 与 `box-shadow: none`；目标 E2E 通过；`validate --strict` valid。未提交、未推送。
