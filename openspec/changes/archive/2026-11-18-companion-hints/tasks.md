# Tasks

设计依据：`design.md`；验收分层：`atdd-design.md`；需求：`requirement-workspace/requirements/REQ-018-companion-hints.md`。

实施口径：前端直接实现，不红测先行；每项实现同步补齐对应测试。E2E 新增用例 5 个，满足 ≤30 上限。

## 1. 全局伙伴能力

- [x] 1.1 对齐 `lib/companion/store.ts`：`say(text, mood)`、`setHint/clearHint/showHint/dismiss`、id 递增与 `createdAt`；补齐 `store.test.ts` U1–U8（含同 path 去重、id 不匹配不误关、无 storage 写入）
- [x] 1.2 对齐 `useCompanionHint(text)`：按 pathname 登记/清理；页面数据 pending 或 hydration 未完成时传 `null`
- [x] 1.3 恢复 `agent-fab` 并收敛为唯一入口：保留原 `Bot` 图标、位置/尺寸/`z-[70]`/`data-testid`/可访问名称；点击改为 `agentActions.setOpen(true)`，面板已开时再点不关闭；`aria-expanded={open}`
- [x] 1.4 入口与气泡同一 `fixed right-4 bottom-4 z-[70]` 容器：气泡 `absolute right-0 bottom-full mb-3`，`w-[min(20rem,calc(100vw-2rem))]`，四种情绪共用统一边框色 `border-[#EC9455]`
- [x] 1.5 气泡内容：标题「<第一只宠物名> · 伙伴提示」，无档案回退「豆包」；纯文本正文；关闭按钮；`role="status"` + `aria-live="polite"`；不显示头像/图标；移除「AI 规划」按钮
- [x] 1.6 自动展示与计时：`autoShownPath` 初始化为当前 pathname（首挂载/刷新不弹）；pathname 切换后展示一次；同一 pathname 重渲染不重复；5000ms 自动关闭；定时器按 `bubble.id` 校验
- [x] 1.7 事件优先：未过期 `event` 气泡存在时不弹 hint 且不写 `autoShownPath`；事件关闭后补弹本页 hint
- [x] 1.8 清理旧口径：删除独立 `companion-avatar` 头像、`COMPANION_BUBBLE_MS=4600`、点击头像展示提示、气泡内 AI 按钮；`_authenticated.tsx` 不再单独挂载旧 `Companion`
- [x] 1.9 边界：`/login` 无入口；`/admin/*` 不展示气泡但保留既有入口（入口组件按 pathname 抑制气泡与自动展示）

## 2. 逐页提示矩阵

- [x] 2.1 首页 `/`：加载中不展示；无档案 / 无行程 / 有激活行程 / 有行程未激活
- [x] 2.2 我的宠物 `/paws`：加载中不展示；无档案引导建档；已选档案维护提示
- [x] 2.3 城市浏览 `/cities`：数据未就绪不展示；无档案筛选引导；有档案看政策提示
- [x] 2.4 地点浏览 `/attractions`：无行程 / 未选锚点 / 已有锚点下一步 / 普通浏览
- [x] 2.5 交通规则 `/transport-rules`：无行程 / 有宠物按名字对比 / 无宠物通用提示
- [x] 2.6 我的行程 `/trips`：加载中不展示；无行程创建引导；有激活行程切换提示；有行程未激活
- [x] 2.7 行程单 `/itinerary`：注水中不展示；无行程 / 未生成 / 已结束 / 正常

## 3. 业务事件反馈

- [x] 3.1 保存宠物档案 → `ok`；品种/体重缺失 → `warn`
- [x] 3.2 选择城市 → `ok`；命中禁养 → `danger`；推荐集为空 → `info`
- [x] 3.3 加入景点 → `ok`；政策限制 → `warn`；大交通/途内未选 → `info`
- [x] 3.4 选择大交通方式 → `ok`；超重/肩高/检疫 → `warn`；禁带 → `danger`
- [x] 3.5 创建行程 → `ok`；切换/继续编辑/只读行程 → `ok` / `info`；草稿/已结束 → `warn` / `info`
- [x] 3.6 创建行程单 → `ok` / 失败 `danger`；导出图片成功 → `ok`，失败 → `danger`；PDF → `ok`

## 4. 测试补齐（对照 `atdd-design.md`）

- [x] 4.1 `lib/companion/store.test.ts`：U1–U8 全绿
- [x] 4.2 `components/companion/companion.test.tsx`：C1–C15（首挂载不弹、切页自动弹、同页去重、5 秒、事件替换与优先、署名兜底、关闭、单入口、admin、非模态、窄窗类名、hint 未就绪不弹）
- [x] 4.3 扩展 `components/agent/agent-panel.test.tsx`：A1–A4（既有 13 项不回归、入口只开不关、admin 入口仍在、空档案回退「豆包」）
- [x] 4.4 新增 `e2e/companion-hints.spec.ts`：E1–E5（逐页提示、5 秒关闭、唯一入口打开面板且打开时气泡隐藏、admin 无气泡、reload 不恢复）
- [x] 4.5 扩断言并回归：在 `paws-pet-management`、`city-pet-policy`、`attraction-pet-rules`、`transport-rules` / `rule-recommendation-and-selection` 既有用例追加 `data-mood` 断言（ATDD B1–B4），同时回归 `trip-planning-agent`、`app-shell-layout`。证据（2026-11-18）：paws `ok`、city `danger`、rule `warn/ok`、attraction `warn/ok` 均已断言；`trip-planning-agent` 6/6、全量 E2E 104/104 通过
- [x] 4.6 源码检查：`useCompanionHint` 覆盖 7 个页面；新增 E2E 用例数 5 ≤ 30

## 5. 验证与收口

- [x] 5.1 安装依赖（`npm install`，当前工作树 `node_modules` 缺失）
- [x] 5.2 `cd apps/web && npx vitest run`（先定向 `src/lib/companion src/components/companion src/components/agent`，再全量）
- [x] 5.3 `npx tsc --noEmit -p apps/web/tsconfig.json` 与 `npm run build -w apps/web`
- [x] 5.4 `node scripts/run-e2e.mjs e2e/companion-hints.spec.ts`，条件允许再跑回归 spec。证据（2026-11-18）：companion 5/5、受影响 7 个 spec 45/45、全量 22 个 spec 104/104（含 admin 两套）；追加「打开面板气泡隐藏」后复验 companion + trip-planning-agent 11/11（2026-11-19）
- [x] 5.5 `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` → Change valid（2026-11-18）
- [x] 5.6 回填 `dov-ac-review.md`：DoV-7 由 Partial 更新为实测结果、DoV-10 记录验证证据
- [x] 5.7 若验证暴露口径偏差，先更新 `atdd-design.md` / `design.md` 再改实现，保持四向一致。验证期修正实现（不涉及口径变更）：入口外壳 `pointer-events-none` + 子元素 `pointer-events-auto`，避免方形命中区遮挡面板发送按钮；管理端不发起宠物预览请求，避免其 401 触发全局缓存清理
- [x] 5.8 气泡文案统一为宠物第一人称（2026-11-19 用户反馈）：七页 hint 与全部业务事件改为「我/我们」口吻，多宠物场景保留其他宠物名字；同步更新 `attraction-pet-rules`、`city-pet-policy`、`destination-selection`、`paws-pet-management`、`rule-recommendation-and-selection` 的 E2E 断言。证据：vitest 364、受影响 6 spec 32/32、全量 E2E 104/104、`tsc --noEmit` 通过
- [x] 5.9 气泡边框统一（2026-11-19 用户反馈：绿色边框与其他气泡不一致）：删除按情绪切换的 `MOOD_BORDER`，四种情绪统一 `border-[#EC9455]`，情绪仅由标题前状态点表达；spec 需求口径、`design.md` D5 表格与实现同步。测试：`companion.test.tsx` 的 warn 断言改为统一边框并新增「四种情绪边框一致、状态点各不相同」用例。证据：`tsc --noEmit` 通过、companion + agent-panel 30/30、`npm run build -w apps/web` 通过、`companion-hints.spec.ts` 5/5；浏览器实测 `info` 气泡 `borderTopColor: rgb(236, 148, 85)`
