# REQ-018 Deep Dive — 伙伴提示（豆包伙伴气泡）

- 上游需求：[REQ-018 伙伴提示](../../requirements/REQ-018-companion-hints.md)
- Impact Brief：[impact-brief.md](impact-brief.md)
- OpenSpec change：`openspec/changes/2026-11-18-companion-hints/`
- 日期：2026-11-18
- 范围：伙伴入口（复用 Chatbot）、气泡展示、`say()`、逐页提示、业务事件、自动关闭与窄窗；不含后端、迁移、新依赖与 Agent 面板内部改造

## 1. 交互契约

| 项 | 契约 |
|---|---|
| 入口 | 右下角 Chatbot 按钮：`fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg`，保留 `data-testid="agent-fab"` 与「打开/关闭行程规划助手」可访问名称 |
| 点击入口 | `agentActions.setOpen(true)`；不先展示提示、不切换为关闭态（面板自有关闭按钮） |
| 气泡位置 | 入口上方：`absolute right-0 bottom-full mb-3` |
| 气泡宽度 | `w-[min(20rem,calc(100vw-2rem))]`；窄窗收窄且不溢出 |
| 气泡层级 | 与入口同容器 `z-[70]`；高于页面内容与 AgentPanel（`z-[60]`） |
| 自动出现 | `pathname` 变化后、该页 hint 就绪时展示一次；同 pathname 重渲染不重复；返回同一页面再次切换会重新展示 |
| 展示时长 | 5000ms；每次新气泡重置；旧计时器取消 |
| 替换 | 新气泡立即替换旧气泡，同一时刻最多一个 |
| 事件优先 | `kind="event"` 的气泡在 5000ms 内优先；本页 hint 延后，事件关闭后补展示 |
| 关闭 | 气泡右上角关闭按钮调用 `dismiss(id)`；自动关闭同样按 id 匹配，避免误关新气泡 |
| 署名 | 第一只宠物名；无档案或查询失败默认「豆包」 |
| 头像内容 | 有照片用宠物照片；无照片用爪印贴纸 |
| 可访问性 | 气泡 `role="status"` + `aria-live="polite"`；关闭按钮有 `aria-label`；不夺取焦点 |
| 非模态 | 无遮罩、无焦点陷阱；不阻塞滚动与点击 |
| 边界页面 | `/login` 无入口（不在认证外壳）；`/admin/*` 抑制气泡但保留入口 |

## 2. 状态模型

```ts
type CompanionMood = "ok" | "info" | "warn" | "danger";
type CompanionBubbleKind = "hint" | "event";

interface CompanionBubble {
  id: number;          // 单调递增，用于计时器与关闭匹配
  text: string;
  mood: CompanionMood;
  kind: CompanionBubbleKind;
  createdAt: number;   // 事件优先级判定
}

interface CompanionHint {
  text: string;
  path: string;        // 声明文案的 pathname
}

interface CompanionState {
  hint: CompanionHint | null;
  bubble: CompanionBubble | null;
  nextId: number;
}
```

动作语义：

| 动作 | 语义 |
|---|---|
| `setHint(text, path)` | 同 path + 同 text 为 no-op；否则写入 `hint` |
| `clearHint(path)` | 仅当 `hint.path === path` 时清空，避免卸载旧页面时清掉新页面 hint |
| `showHint()` | 取当前 `hint` 生成 `kind="hint"`、`mood="info"` 气泡；无 hint 为 no-op |
| `say(text, mood = "info")` | 生成 `kind="event"` 气泡；新 id、新 `createdAt`，替换旧气泡 |
| `dismiss(id?)` | 无参或 id 匹配时清空气泡；id 不匹配不处理 |

页面接入：`useCompanionHint(text)` 内部订阅 pathname；`text !== null` 时 `setHint`，卸载时 `clearHint(pathname)`。加载中（数据 pending）传 `null`，避免先闪错误提示。

自动展示实现要点：

1. 记录 `autoShownPath`，仅当与当前 pathname 不同且 hint 属于当前 path 时展示。
2. 若存在未过期（`Date.now() - createdAt < 5000`）的 `event` 气泡，则等待，不覆盖。
3. 展示后写入 `autoShownPath`；pathname 变化后自然允许下一次展示。
4. 定时器以 `bubble.id` 为依赖；新气泡出现时清理旧定时器。

## 3. 逐页提示矩阵

| 页面 | 状态 | 文案 | 情绪 |
|---|---|---|---|
| `/` 首页 | 数据加载中 | 不展示 | — |
| `/` | 无宠物档案 | 先给毛孩子建个档案吧，我帮你记住它的小习惯 | info |
| `/` | 有档案、无行程 | 去城市浏览挑个目的地，我们从那里开始 | info |
| `/` | 有激活行程 | 继续完善「<行程名>」的行程吧 | info |
| `/` | 有行程但未激活 | 去「我的行程」点一张卡片，接着上次的旅程 | info |
| `/paws` | 加载中 | 不展示 | — |
| `/paws` | 已选中宠物 | <名字>的档案在这里维护，体重和品种越准，推荐越稳 | info |
| `/paws` | 无档案 | 先给毛孩子建个档案吧，之后的推荐都靠它 | info |
| `/cities` | 档案/宠物加载中 | 不展示 | — |
| `/cities` | 有第一只宠物 | 点城市看政策，推荐城市排在前面 | info |
| `/cities` | 无档案 | 建档后可按品种筛选城市，我先带你看政策 | info |
| `/attractions` | 无激活行程 | 先创建或激活行程，才能按城市挑地点 | info |
| `/attractions` | 附近类型未选锚点 | 先选一个景点作为锚点，再挑附近餐厅住宿 | info |
| `/attractions` | 已有锚点 | 点「下一步」按距离挑附近餐厅住宿 | info |
| `/attractions` | 普通浏览 | 把想去的景点加入行程，我帮你串成每天的路线 | info |
| `/transport-rules` | 无激活行程 | 先创建或激活行程，再对照携宠规则选大交通 | info |
| `/transport-rules` | 有宠物 | 对比各方式携宠规则，选适合<宠物名>的 | info |
| `/transport-rules` | 无宠物 | 对比各方式携宠规则，选一个适合毛孩子的 | info |
| `/trips` | 加载中 | 不展示 | — |
| `/trips` | 无行程 | 创建第一份行程，从城市浏览选个目的地开始 | info |
| `/trips` | 有激活行程 | 当前编辑「<行程名>」，点其他卡片可切换 | info |
| `/trips` | 有行程未激活 | 点卡片切换激活行程，或者创建一份新的 | info |
| `/itinerary` | 行程注水中 | 不展示 | — |
| `/itinerary` | 无激活行程 | 先创建行程并生成行程单，这里会按天汇总 | info |
| `/itinerary` | 未生成行程单 | 还没生成行程单，回到地点浏览点「创建行程单」 | info |
| `/itinerary` | 行程已结束 | <行程名>已结束，只读查看，仍可导出分享 | info |
| `/itinerary` | 正常 | 按天核对交通食宿应急，可导出分享 | info |

## 4. 业务事件矩阵

| 触发 | 条件 | 文案（示例） | 情绪 |
|---|---|---|---|
| 保存宠物档案 | 品种/体重缺失 | <名字>的档案已保存，补全品种和体重后推荐会更准 | warn |
| 保存宠物档案 | 完整 | <名字>的档案已保存，下一步去城市浏览挑目的地吧 | ok |
| 选择城市 | 命中禁养 | <城市>命中禁养名单，建议换个目的地 | danger |
| 选择城市 | 正常 | <城市>政策已展开，下一步去交通规则看携宠要求 | ok |
| 城市结果为空 | 推荐集为空 | 暂无符合条件的目的地，换个关键词或关闭宠物友好筛选试试 | info |
| 加入景点 | 命中政策限制 | 加入成功，但<限制标签>可能与<宠物名>不符 | warn |
| 加入景点 | 正常 | 已把<地点>加入第 N 天，继续挑附近地点吧 | ok |
| 进入附近筛选 | 存在未选交通的 stop | 给景点选个交通方式，方便估算当天时间 | info |
| 进入地点浏览 | 大交通未选 | 还没选大交通，先去交通规则挑一个吧 | info |
| 选择交通方式 | 禁带 | 该方式不可携带宠物，换一个更稳妥 | danger |
| 选择交通方式 | 超重/肩高/缺检疫 | <宠物名>：<原因>，可以再对比其他方式 | warn |
| 选择交通方式 | 满足 | 已选<方式>，下一步去地点浏览挑景点 | ok |
| 切换/继续行程 | 草稿未确认 | 有未确认草稿，先放弃草稿再切换行程吧 | warn |
| 切换/继续行程 | 已结束 | 该行程已结束，只能查看和导出 | info |
| 切换/继续行程 | 正常 | 已切换到「<行程名>」，继续安排吧 | ok |
| 创建行程 | 成功 | 「<行程名>」已创建，下一步选一个大交通方式吧 | ok |
| 创建行程单 | 成功 | 行程单生成好了，按天核对交通和食宿吧 | ok |
| 创建行程单 | 失败 | 行程单生成失败，稍后再试一次 | danger |
| 导出图片 | 成功 | 行程单图片已导出，可以分享给同行伙伴 | ok |
| 导出图片 | 失败 | 图片导出失败，再试一次吧 | danger |
| 导出 PDF | 打开打印 | 已打开打印，可选择另存为 PDF | ok |

## 5. 展示契约

| 元素 | 内容 / 样式 |
|---|---|
| 气泡容器 | `rounded-2xl border-2 bg-card p-3 shadow-xl`，`right-0 bottom-full mb-3` |
| 标题 | `<宠物名> · 伙伴提示`，`text-xs font-medium text-muted-foreground`，前置状态点 |
| 正文 | `text-sm leading-5 text-foreground`，纯文本 |
| 关闭 | 右上角 20px 图标按钮，`aria-label="关闭伙伴提示"` |
| 情绪 | `ok`：`border-emerald-300` / `bg-emerald-500`；`info`：`border-[#EC9455]` / `bg-[#EC9455]`；`warn`：`border-amber-400` / `bg-amber-500`；`danger`：`border-red-400` / `bg-red-500` |
| 入口 | 宠物照片（圆形裁切）或爪印贴纸；`size-12`、`border-2 border-card`、`bg-paw-accent-soft`、`shadow-lg` |
| 无「AI 规划」按钮 | 入口即 AI 入口；气泡只承载提示与关闭 |
| 动画 | 无额外动画；替换即时呈现 |

## 6. 测试计划

### store 单测（`apps/web/src/lib/companion/store.test.ts`）

1. `say()` 生成 event 气泡并递增 id；再次 `say()` 替换文本与 id。
2. `setHint` 同 path/text no-op；不同文案更新。
3. `clearHint(path)` 只清匹配 path 的 hint。
4. `showHint()` 生成 hint 气泡；无 hint no-op。
5. `dismiss(id)` 只清匹配 id；无参清空。

### 组件单测（`apps/web/src/components/agent/agent-panel.test.tsx` 扩展或新增）

1. 有档案时标题为「豆豆 · 伙伴提示」；无档案为「豆包 · 伙伴提示」。
2. hint 就绪后自动展示；同 pathname 重渲染不重复。
3. 假定时器推进 4999ms 气泡仍在，5000ms 后消失。
4. 新气泡替换旧气泡并重置计时。
5. 点击 `agent-fab` 打开 `agent-panel`（既有用例保持）。
6. `/admin/*` 不渲染气泡，但入口存在。
7. 事件气泡未过期时不展示页面 hint；事件关闭后展示。

### E2E（`e2e/companion-hints.spec.ts`）

- E1 登录后首页出现气泡，标题含宠物名，5 秒内可见，超过 5 秒消失。
- E2 依次切换我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单，每页出现对应提示。
- E3 点击右下角入口打开 `agent-panel`；关闭面板后入口仍可用。
- E4 保存宠物档案后出现 `ok` 情绪气泡；档案不完整时为 `warn`。
- E5 `/admin/locations` 无气泡但入口可见。

### 回归

- `apps/web/src/components/agent/agent-panel.test.tsx`
- `e2e/trip-planning-agent.spec.ts`
- `e2e/attraction-pet-rules.spec.ts`
- `e2e/app-shell-layout.spec.ts`

### 门禁命令

- 前端单测：`cd apps/web && npx vitest run`
- 构建：`npm run build -w apps/web`（或本地 `tsc --noEmit`）
- 定向 E2E：`node scripts/run-e2e.mjs e2e/companion-hints.spec.ts`
- 规格：`npx --no-install openspec change validate 2026-11-18-companion-hints --strict`

## 7. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| `trip-planning-agent`（REQ-00x） | 入口与面板 | 保留面板与 `agent-fab`；入口点击由切换改为直接打开，面板能力不变 |
| `web-app-shell` | 全局面板挂载与滚动容器 | 在既有挂载内增加气泡；不改布局与滚动 |
| REQ-006 目的地选择 | 城市卡片选择与政策 | 只新增 `say()` 反馈；不改选定/取消逻辑 |
| REQ-008 规则推荐 | 交通方式单选与判定 | 只读 `evaluateRuleForPet` 结果生成气泡；不改选择与缓存 |
| REQ-012 附近筛选 | 锚点与门禁 | 只新增提示；不改门禁与距离规则 |
| REQ-014 城市推荐 | 排序与徽标 | 不介入排序；提示不依赖推荐得分 |
| REQ-017 携带清单 | 行程单弹窗 | 不介入清单；导出反馈与既有导出一致 |
| 既有内联提示 | 途内携宠小字、政策对比提醒 | 保留；伙伴气泡不替代 |
| 后端 / 数据库 | — | 零改动，无一致性风险 |

## 8. DoR ⑨–⑫ 结论

- **⑨ 数据契约**：伙伴状态字段、动作语义、署名来源、`createdAt` 优先级与 id 匹配已定稿；无未决字段；无服务端契约。
- **⑩ 边界分支**：登录页/管理端、加载中、无档案、有照片/无照片、同路径重渲染、跨页事件竞争、快速连续事件、窄窗、面板打开/关闭均有明确行为。
- **⑪ 跨 REQ 一致性**：与 Agent 面板、外壳、目的地、规则推荐、附近筛选、城市推荐、携带清单逐项核对，无冲突；不改变既有业务判定与数据。
- **⑫ 展示与测试**：入口、气泡标题/正文/情绪/关闭、七个页面矩阵与事件矩阵已定义；store/组件/E2E 分层明确；既有 `agent-fab` 测试标识保留，回归风险可控。
- 结论：⑨–⑫ 全部 Pass；BLOCKER=0；无阻塞未知依赖。
