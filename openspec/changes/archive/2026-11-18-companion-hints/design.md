# Design — 伙伴提示（豆包伙伴气泡）

- Change：`2026-11-18-companion-hints`（REQ-018 / US-52）
- 上游：`requirement-workspace/requirements/REQ-018-companion-hints.md`、`analysis/REQ-018/{impact-brief,deep-dive}.md`
- 范围：前端只读消费现有数据与页面状态；零后端、零迁移、零新依赖。

## Goals

- 复用现有 Chatbot 入口，在其上方提供统一的非模态伙伴气泡。
- 每次路由切换自动展示当前页情境提示，5 秒后自动关闭。
- 业务事件经统一 `say(text, mood)` 反馈，四种情绪对应不同边框色。
- `/login` 无入口；`/admin/*` 无气泡但保留既有入口。

## Non-goals

- 新增第二个浮动头像或独立伙伴页面。
- 气泡内单独「AI 规划」按钮、语音、动画角色或对话输入。
- 服务端持久化提示历史、已读状态、A/B 或多语言。
- 改变 Agent 面板的对话、工具、方案与布局。
- 移除各页既有内联提示。

## Decisions

### D1 入口复用既有 Chatbot

- 保留 `apps/web/src/components/agent/agent-panel.tsx` 中的 `data-testid="agent-fab"` 按钮：`fixed right-4 bottom-4 z-[70] size-12 rounded-full shadow-lg`，继续使用原 `Bot` 图标与按钮样式。
- 点击行为由 `toggleOpen()` 改为 `setOpen(true)`：入口只负责打开，关闭由面板内按钮完成，避免气泡展示时误关面板。
- 可访问名称保持「打开行程规划助手」，并用 `aria-expanded={open}` 表达面板状态。
- 不新增第二个头像；气泡与入口处于同一固定容器。
- 固定容器只负责定位：容器 `pointer-events-none`，气泡与 FAB `pointer-events-auto`，避免方形命中区遮挡其下方的面板控件。
- 面板打开时气泡必须让位：`CompanionBubble` 接收 `panelOpen`，面板打开即隐藏并用 `companionActions.dismiss(id)` 丢弃当前气泡；关闭面板后不重新弹出，避免气泡浮在面板之上。
- 否决：独立伙伴头像（两个入口职责重叠）、删除 `agent-fab`（破坏既有 E2E 与需求方明确要求）。

### D2 状态模型

```ts
type CompanionMood = "ok" | "info" | "warn" | "danger";
type CompanionBubbleKind = "hint" | "event";

interface CompanionBubble {
  id: number;
  text: string;
  mood: CompanionMood;
  kind: CompanionBubbleKind;
  createdAt: number;
}

interface CompanionHint {
  text: string;
  path: string;
}

interface CompanionState {
  hint: CompanionHint | null;
  bubble: CompanionBubble | null;
  nextId: number;
}
```

- `setHint(text, path)`：同 path + 同 text no-op。
- `clearHint(path)`：仅清理匹配 path 的 hint，避免旧页面卸载清掉新页面 hint。
- `showHint()`：由当前 hint 生成 `kind="hint"`、`mood="info"` 气泡。
- `say(text, mood = "info")`：生成 `kind="event"` 气泡，替换旧气泡。
- `dismiss(id?)`：id 匹配或无参时关闭；不误关新气泡。
- 状态仅内存，不持久化。

### D3 自动展示与事件优先级

- `useCompanionHint(text)` 订阅 pathname：`text != null` 时登记 hint，卸载时按 path 清理。
- 数据 pending 或 hydration 未完成时页面传 `null`，避免先弹错误提示。
- 入口组件记录 `autoShownPath`：初始化为当前 pathname，仅当 pathname 发生切换且 hint.path 匹配时自动展示一次；展示后写入，同路径重渲染不重复。首挂载与刷新不自动展示，满足「状态不持久化」。
- 若存在未过期（`Date.now() - createdAt < 5000`）的 `event` 气泡，则暂缓本页 hint 且不写入 `autoShownPath`，事件关闭后再补。
- 否决：每个页面自行 `useEffect` 弹气泡（重复实现、时序不一致）。

### D4 计时与替换

- 气泡展示时长固定 5000ms（需求方 2026-11-18 确认，覆盖故事中的 4.6 秒）。
- 定时器以 `bubble.id` 为依赖；新气泡出现时清理旧定时器，避免旧计时关闭新气泡。
- 自动关闭与手动关闭都调用 `dismiss(bubble.id)`。
- 同一时刻最多一个气泡。

### D5 展示与情绪

| 情绪 | 边框 | 状态点 |
|---|---|---|
| `ok` | `border-emerald-300` | `bg-emerald-500` |
| `info` | `border-[#EC9455]` | `bg-[#EC9455]` |
| `warn` | `border-amber-400` | `bg-amber-500` |
| `danger` | `border-red-400` | `bg-red-500` |

- 气泡：`absolute right-0 bottom-full mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border-2 bg-card p-3 shadow-xl`。
- 标题：`<宠物名> · 伙伴提示`，前缀状态点；无档案默认「豆包」。
- 正文纯文本，统一以宠物第一人称（「我/我们」）叙述；涉及多只宠物时，气泡署名的宠物用「我」，其他宠物保留名字；右上角关闭按钮；不显示头像、图标或身份标签。
- 入口保持既有 `agent-fab` 的 `Bot` 图标、尺寸与样式，不改为宠物照片，避免新增第二个视觉身份。
- 可访问性：气泡 `role="status"` + `aria-live="polite"`；关闭按钮 `aria-label="关闭伙伴提示"`；不抢焦点。
- 无额外动画；替换即时呈现。

### D6 页面与业务接入

- 页面提示：`useCompanionHint` 在首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单声明文案；矩阵见 `analysis/REQ-018/deep-dive.md` 第 3 节。
- 业务事件：保存档案、选择城市、加入景点、选择交通方式、切换行程、创建行程、创建行程单、导出图片/PDF 均调用 `companionActions.say()`；矩阵见 deep-dive 第 4 节。
- 事件文案与判定复用既有业务结果（`evaluateRuleForPet`、`violatedLimitTags`、`matchCityCandidate`），不复制判定逻辑。
- 页面提示与事件文案共用同一第一人称口吻；E2E 仅断言关键短语，改文案时需同步更新（`attraction-pet-rules`、`city-pet-policy`、`destination-selection`、`paws-pet-management`、`rule-recommendation-and-selection`）。

### D7 边界

- `/login`：不在认证外壳，天然无入口与气泡。
- `/admin/*`：保留既有 Chatbot 入口；入口组件通过 pathname 判断抑制气泡与自动展示，同时跳过气泡宠物名的预览请求（管理端无气泡，且该请求的 401 会触发全局缓存清理）。
- US-80 后城市/规则页无浮动行程面板；伙伴入口不依赖激活行程，也不依赖行程面板。

### D8 测试与回滚

- 单测：store 替换/关闭/同 path 去重；组件自动展示、5 秒关闭、事件优先、署名兜底、点击入口打开面板、管理端抑制。
- E2E：`e2e/companion-hints.spec.ts` 覆盖逐页出现、5 秒关闭、点击入口打开面板、管理端无气泡；回归 `trip-planning-agent`、`attraction-pet-rules`、`app-shell-layout`。
- 回滚：移除 `lib/companion` 与气泡渲染，入口恢复 `toggleOpen()`；无数据迁移、无后端回滚。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| 路由切换时查询未就绪，提示文案短暂错误 | pending 阶段传 `null`；数据就绪后再展示 |
| 事件气泡与页面 hint 竞争 | 事件未过期优先；事件关闭后补页面 hint |
| 旧计时器误关新气泡 | 定时器按 `bubble.id` 校验 |
| 既有 `agent-fab` E2E 破坏 | 保留测试标识与可访问名称；点击语义改为直接打开 |
| 管理端出现气泡 | pathname 抑制气泡，保留入口 |
| 窄窗遮挡 | `min(20rem, 100vw - 2rem)` 自适应，无新断点 |
| 当前 WIP 与新口径不一致 | 实现阶段删除独立头像、改 5 秒、恢复入口、移除气泡内 AI 按钮 |

## Migration

- 无数据库与接口变更。
- 既有用户无迁移动作；刷新后气泡状态自然清空。

## Open Questions

- 无。blocking OQ 已在 P1 全部 resolved。
