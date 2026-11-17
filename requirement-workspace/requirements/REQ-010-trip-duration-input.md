---
id: REQ-010
title: 输入旅游总天数
status: archived-superseded
discovery: Go (2026-11-16)
impact: ../analysis/REQ-010/impact-brief.md
deep_dive: ../analysis/REQ-010/deep-dive.md
sources:
  - ../intents/REQ-010-trip-duration.md
  - apps/web/src/routes/_authenticated/cities.tsx
  - apps/web/src/lib/selected-destination.ts
  - apps/web/src/queries/auth.ts
  - openspec/specs/destination-selection/spec.md
  - openspec/specs/web-app-shell/spec.md
  - docs/knowledge/architecture/README.md
  - docs/knowledge/rules/process/spec-first.md
---

# REQ-010：输入旅游总天数

> **归档状态（2026-11-17）**：Archived (superseded)。原 `sessionStorage` 方案经 PR #54 实现合并（CI 全绿）后，被 active-trip 架构（PR #55–#58）取代：天数现为服务端 trip 的 `totalDays`，经行程面板「行程天数」输入。change 包已按 superseded 归档至 `openspec/changes/archive/2026-11-17-add-trip-duration-input/`（含 G2/G3 补录决策）。下文保留原始需求口径作为历史记录。

## Discovery Decision

Go — 需求边界明确：在已有登录保护的 `/cities` 目的地选择页先显示默认 1 天的 1–7 天步进器，合法后才可选定目的地；进入景点页后按总天数显示横向天数项，并使用浏览器 `sessionStorage` 保存当前会话的单条总天数。US-09 尚未在当前基线中提供行程生成页面，本需求只定义可复用的状态读取与必填守卫契约，不新增生成页或生成算法。

## 六字段

1. **id**：REQ-010
2. **statement**：已登录用户选定目的地后，可以在 `/cities` 输入 1–7 天的旅游总天数；合法值写入当前浏览器会话的 `sessionStorage`，重填覆盖；非法值不写入，并在进入 US-09 行程生成时被引导回输入处。
3. **actors**：
   - 已登录用户：选择目的地、输入或修改旅游总天数
   - 前端应用 `apps/web`：渲染步进器、校验输入、保存和读取当前会话状态
   - 景点页：按总天数提供第 1 天至第 N 天的横向浏览项
   - US-09 行程生成：读取总天数并按天生成行程；为下游消费者，不在本需求实现
4. **rationale**：行程生成需要明确的天数边界；将天数在目的地选择阶段确定并复用，可以避免生成后人工调整，同时保持本需求为纯前端、低耦合的状态能力。
5. **acceptance hints**：
   - `/cities` 在目的地卡片前始终展示带可访问标签的「旅游总天数」步进器，默认 1，步长为 1，最小值 1，最大值 7；合法后才能选定目的地
   - 输入 1–7 的整数后，当前值可被读取并写入 `sessionStorage`；再次输入覆盖旧值
   - 点击减号/加号到边界时不越界，并给出边界提示；手工输入 0、8、负数、小数或非数字时显示错误，存储中的上一个合法值保持不变
   - 重新加载同一浏览器标签页后，已保存的合法值恢复到步进器
   - 没有合法值时，下游行程生成入口使用必填守卫，提示「请先填写旅游总天数」并引导回 `/cities` 的天数输入处
   - 景点页从左到右显示“第 1 天”至“第 N 天”，N 等于总天数
   - US-09 读取到合法值后，使用该值作为按天行程的总天数
6. **links to evidence**：
   - 目的地选择页：`apps/web/src/routes/_authenticated/cities.tsx`
   - 目的地会话存储：`apps/web/src/lib/selected-destination.ts`
   - 登录用户身份与会话查询：`apps/web/src/queries/auth.ts`
   - 目的地既有契约：`openspec/specs/destination-selection/spec.md`
   - 前端架构与状态约定：`docs/knowledge/architecture/README.md`

## Ready 形状

### Intent

在已选目的地后收集并保存当前浏览器会话的旅游总天数，使未来的 US-09 行程生成可以直接按 1–7 天安排日程。

### Actors 与权限边界

- 已登录用户可操作 `/cities` 的天数输入。
- 未登录用户由既有认证守卫拦截；本需求不改变权限模型。
- US-09 作为下游消费者读取合法天数；前端守卫是导航引导，不替代任何服务端授权。

### In / Out Scope

**In**

- `/cities` 已选目的地状态下的旅游总天数步进器
- 1–7 整数校验、边界提示与非法值不落存储
- `sessionStorage` 单条当前行程总天数的读取、覆盖和会话内恢复
- 面向 US-09 的总天数读取契约与“未填写”引导约定

**Out**

- 服务端、数据库、账号维度持久化和跨浏览器同步
- `localStorage`、跨标签页同步和会话结束后的保留
- US-09 行程生成页面、生成算法，以及具体景点加入某一天的持久化分配
- 新增行程生成路由或修改目的地选择以外的导航结构

### Scenarios + AC Hints

#### S1：选定目的地后输入合法天数

- **Given** 用户已登录并已选定目的地
- **When** 用户在 `/cities` 将旅游总天数设为 3
- **Then** 步进器显示 3，`sessionStorage` 保存 3，且该值可供下游读取

#### S2：边界值限制

- **Given** 步进器当前值为 1 或 7
- **When** 用户继续点击减号或加号
- **Then** 值保持在 1 或 7，并显示对应边界提示

#### S3：非法输入不覆盖合法值

- **Given** `sessionStorage` 中已有合法值 3
- **When** 用户输入 0、8、-1、1.5 或非数字
- **Then** 显示范围/整数提示，存储值仍为 3

#### S4：会话内恢复

- **Given** 用户已在当前标签页保存 5 天
- **When** 刷新或重新进入 `/cities`
- **Then** 步进器恢复显示 5

#### S5：生成前必填引导

- **Given** 当前会话没有合法总天数
- **When** US-09 触发行程生成入口
- **Then** 阻止进入生成流程，提示先填写旅游总天数，并导航到 `/cities` 的天数输入处

#### S6：下游按天读取

- **Given** 当前会话已保存总天数 4
- **When** US-09 读取总天数
- **Then** 下游获得整数 4，并以 4 作为按天行程的天数

### Constraints

- 技术栈沿用 React 19、TanStack Router/Start、Tailwind CSS 4、shadcn/ui Base UI。
- 前端状态遵循仓库约定；浏览器会话状态可以由 `sessionStorage` 管理，不引入新状态库。
- 存储读写必须在浏览器端执行，避免 SSR 首帧读取浏览器 API。
- `sessionStorage` 读取的数据必须重新校验，不能信任被手工修改的字符串。
- 页面接口调用仍遵循既有 `request` 层；本需求不增加服务端调用。
- 实现前需形成 OpenSpec 变更规格，遵循 `@rule:spec-first`。

### Context

当前目的地页通过 `useSelectedDestination()` 从 `sessionStorage` 恢复已选城市；同页还存在交通方式使用 `sessionStorage` 的前端约定。仓库没有 US-09 行程生成页面，因此本需求只提供天数状态能力和下游接入边界。

### Affected Capabilities

- **ADDED** `trip-duration-input`：当前会话内旅游总天数的输入、校验、保存和读取契约
- **MODIFIED** `destination-selection`：在目的地卡片前增加默认 1 天的总天数输入和选定按钮守卫；不改变城市候选、搜索、筛选和目的地存储行为
- **DOWNSTREAM CONTRACT** `itinerary-generation`：US-09 读取合法总天数并按天生成；本需求不实现该能力

### Open Questions

| class | status | question | owner | note |
|---|---|---|---|---|
| blocking | resolved | 本需求是否新增 US-09 行程生成页？ | Product / Dev | 否；US-09 后续接入本需求的读取契约与必填守卫 |
| blocking | resolved | 天数保存在哪里？ | Product / Dev | 当前浏览器 `sessionStorage`；不做服务端或 `localStorage` 持久化 |
| non-blocking | resolved | 重新选择目的地时是否清空天数？ | Dev | 不清空；总天数属于当前会话行程输入，用户可直接重填；避免无需求的隐式重置 |
| non-blocking | deferred | US-09 生成页的具体路由和入口文案是什么？ | US-09 owner | 由 US-09 接入时确定，不影响本需求的状态契约 |

## DoR Findings

| severity | status | location | issue | fix hint |
|---|---|---|---|---|
| BLOCKER | resolved | Intent / Scope | 初版 AC-1 同时要求按账号服务端保存，但用户已改为当前会话 `sessionStorage` | 已按最新口径移除服务端与账号持久化目标 |
| BLOCKER | resolved | 下游边界 | 当前仓库没有 US-09 行程生成路由 | 明确 US-09 为下游消费者，本需求只提供读取/守卫契约，不新增生成页 |
| BLOCKER | resolved | 输入状态 | 未定义非法输入是否覆盖已有合法值 | 明确非法输入不得覆盖已有合法值；deep-dive 已列出分支 |
| WARNING | deferred | US-09 导航 | 生成入口路由和回跳定位实现尚未存在 | 由 US-09 接入时确定；本需求输出可定位到 `/cities` 天数输入的目标约定 |
| SUGGESTION | resolved | 文案 | 具体中文边界提示可在 P3 统一 | 规格只固定语义，不锁死视觉文案样式 |

BLOCKER 数：0。
