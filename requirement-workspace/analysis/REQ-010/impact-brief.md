# REQ-010 Impact Brief：输入旅游总天数

## 1. Requirement set

- `requirement-workspace/requirements/REQ-010-trip-duration-input.md`
- `requirement-workspace/analysis/REQ-010/deep-dive.md`

## 2. As-is asset inventory（证据路径）

**Knowledge base**

- `docs/knowledge/architecture/README.md`：前端使用 React/TanStack Router/TanStack Query，浏览器端状态可由本地存储承载；所有服务端取数经过统一 request 层。
- `docs/knowledge/rules/architecture/react-patterns.md`：服务端状态与本地 UI 状态分离，容器负责状态，展示组件接收 props。
- `docs/knowledge/rules/process/react-hooks.md`：浏览器 API 读取需在客户端生命周期内执行，避免 SSR 时序问题。
- `docs/knowledge/rules/testing/react-testing.md`：优先通过可访问 DOM 和用户交互验证步进器与提示。
- `docs/knowledge/rules/process/spec-first.md`：生产代码前需要稳定的变更规格。

**Living Spec**

- `openspec/specs/destination-selection/spec.md`：目的地选择页和已选目的地使用 `sessionStorage`，选定后作为后续规划上下文。
- `openspec/specs/web-app-shell/spec.md`：登录保护、顶栏与登出行为；本需求不修改导航和登出清理。
- 当前基线未发现 `itinerary-generation` 或 US-09 的 Living Spec；记录为下游契约缺口，不新建第二个权威根目录。

**Post-archive SDD assets**

- `openspec/changes/archive/2026-11-16-destination-selection/`：目的地选择的已归档实现与验证基线。
- `openspec/changes/archive/2026-11-16-transport-pet-rules-comparison/`：纯前端 `sessionStorage` 选择状态的既有模式。
- `openspec/changes/add-location-pet-rule-display/`：当前未归档的目的地下游能力，复用已选目的地上下文但不涉及天数。

**当前实现（以最新 `origin/main` 为基线核对）**

- `apps/web/src/routes/_authenticated/cities.tsx`：渲染候选城市、选定确认和导航；尚无天数输入。
- `apps/web/src/lib/selected-destination.ts`：通过 `sessionStorage` 保存单条已选目的地，并使用 `useSyncExternalStore` 跨组件同步。
- `apps/web/src/routes/_authenticated/transport-rules.tsx`：已有 `sessionStorage` 单选状态的前端模式。
- `apps/web/src/queries/auth.ts`：当前用户查询；本需求不再按用户名隔离。
- 当前仓库没有 US-09 行程生成路由或生成算法。

## 3. As-is → proposed delta

| 资产 | As-is | Proposed delta |
|---|---|---|
| `apps/web/src/routes/_authenticated/cities.tsx` | 选定城市后展示确认提示，并进入下游页面；无天数输入 | 在确认区域增加旅游总天数步进器、范围/整数校验、合法值保存与已有值恢复；不改变城市搜索、筛选和选定行为 |
| `apps/web/src/lib/selected-destination.ts` | 独立管理 `pawtrip.selectedDestination` | 不修改既有目的地 store；新增独立的总天数状态模块/存储键，避免生命周期耦合 |
| `apps/web/src/routes/_authenticated/transport-rules.tsx` | 使用 `sessionStorage` 保存单选交通方式 | 仅作为会话状态实现参考，不改交通规则页 |
| `openspec/specs/destination-selection/spec.md` | 定义已选城市为后续规划上下文 | 增加“目的地页可输入当前会话总天数”的 delta；不改变既有目的地保存口径 |
| `openspec/specs/web-app-shell/spec.md` | 定义导航、认证与登出清理 | 检查无行为影响；不新增 Tab、路由或登出清理天数逻辑 |
| US-09 行程生成 | 当前基线无实现/规格 | 作为下游消费者读取已校验 `totalDays`，由后续 change 实现；本需求不新增页面 |
| 前端测试 | 最新基线有纯函数测试和 Playwright E2E 基线 | 新增天数存储/校验单测，并补 `/cities` 步进器的行为/E2E 验证；不引入新测试框架 |
| `docs/knowledge/architecture/README.md` | 记录目的地 sessionStorage 和前端状态约定 | 补充当前行程总天数的 sessionStorage 生命周期与 US-09 读取边界 |

## 4. Blast radius

- **直接受影响**：`apps/web` 的目的地选择页、一个新的前端状态/校验模块、对应测试。
- **间接受影响**：未来 US-09 行程生成需要依赖并读取该模块。
- **不受影响**：`apps/server`、数据库、认证 API、目的地 API、交通规则页、应用导航与登出流程。
- **运行拓扑**：不变；不新增网络请求和外部依赖。

## 5. Artifact impact

- **Specs**：新增 `trip-duration-input` 能力；对 `destination-selection` 增加同页输入的 delta；US-09 的生成规格留后续 change。
- **Tests**：纯函数/存储单测覆盖 1–7、越界、非整数、非法不覆盖与恢复；浏览器验收覆盖选定目的地后的输入和刷新恢复。
- **Docs / KB**：补充前端会话状态边界和下游读取约定。
- **No impact**：后端测试、Flyway 迁移、接口请求契约与服务端错误码。

## 6. Dual-track notes

- **OpenSpec**：建议一个 change 覆盖目的地页输入、会话状态模块和测试；规格中以 `trip-duration-input` 为新增 capability，以 `destination-selection` 为修改 capability。
- **Agile**：可拆为「会话状态与校验」「目的地页步进器」「下游守卫契约与回归验证」三个实现任务，但不拆成多个 Change；用户价值在同一页面闭环。

## 7. Risks & blockers

| 风险 | 影响 | 缓解 |
|---|---|---|
| `sessionStorage` 在隐私模式或浏览器策略下不可用 | 值无法恢复，可能影响当前会话体验 | 读写模块捕获存储异常；实现时明确降级为当前页面内存态并显示可操作提示，或按项目既有静默降级约定处理 |
| 手工修改存储字符串 | 下游可能拿到越界/非整数 | 所有读取经过统一解析与范围校验，不向下游暴露原始字符串 |
| US-09 尚无路由/入口 | AC-3/AC-4 暂不能在本 change 做完整 E2E | 本 change 只输出读取与守卫契约；US-09 接入时补集成验收 |
| 重新选择目的地后旧天数是否合理 | 可能出现用户未预期的复用 | 当前设计不隐式清空，步进器始终允许显式重填；若产品要求按目的地隔离，另开决策/变更 |

**Critical blockers**：无。US-09 缺口是已确认的下游依赖，不阻塞本前端能力的规格与实现。

## 8. Suggested split boundaries

- 建议 **1 个 Change**：`add-trip-duration-input`。
- 该 Change 的用户可见目标是：选定目的地后能输入、校验并在当前标签页恢复旅游总天数。
- 依赖 DAG：`destination-selection`（已归档基线） → `add-trip-duration-input` → `US-09 itinerary-generation`（后续消费者）。
- 不建议新增独立“sessionStorage 基础设施”Change；它没有独立用户价值，且实现规模小。
