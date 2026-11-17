# ATDD Design

变更：`add-trip-duration-input`

## ATDD layers in scope

### API 层

本 Change 不涉及 HTTP API、服务端写入或数据库，因此 **API 层不适用**。不新增 Mock API、MSW handler 或后端验收端点。

### E2E 层

使用项目已有的 Playwright 浏览器验收路径，新增 `e2e/trip-duration-input.spec.ts`，通过登录后的真实 `/cities` 页面验证用户可见行为：

| 场景 | 层级 | 推荐额外层 | 归类理由 |
|---|---|---|---|
| 选定前显示默认 1 天并设置 1–7 天 | E2E | 可访问性检查（建议） | 涉及目的地选择前置输入、页面渲染、步进器交互和会话状态 |
| 1/7 边界不可越界 | E2E | 可访问性检查（建议） | 断言用户可见控件值与提示 |
| 越界、小数、非数字不覆盖合法值 | E2E | — | 需要真实输入事件与页面反馈 |
| 同一标签页刷新后恢复 | E2E | — | 需要真实浏览器 `sessionStorage` 生命周期 |
| 新标签页/会话结束不承诺恢复 | E2E 反向验证 | — | 验证 Proposal 的非目标，不断言跨标签页持久化 |
| 景点页按总天数横向显示天数项 | E2E | 可访问性检查（建议） | 读取同一会话总天数，验证 1 到 N 的显示范围 |
| 不新增服务端请求或数据库写入 | E2E 反向验证 | — | 页面交互过程中不应新增 `/api` 写入请求；实现评审同时检查变更范围 |
| US-09 缺少总天数时阻止生成 | 延后至 US-09 E2E | — | 当前 Change 不包含行程生成路由，不能虚构验收页面 |
| US-09 读取合法天数按天生成 | 延后至 US-09 E2E | — | 当前 Change 只提供读取契约，完整路径由下游 Change 验收 |

### Deferred to `/sdd:atdd-apply`（unit-level TDD）

以下纯逻辑由实现阶段先写红、再实现：

- 1–7 整数判定；0、负数、8+、小数、空值、非数字均拒绝
- 从 `sessionStorage` 读取并解析合法整数；非法存储值返回未填写
- 合法值写入并覆盖旧值；非法值不写入
- 生成前读取契约返回 `number | null`，不直接暴露原始字符串

本设计不展开单元测试套件结构，避免越过实现阶段的 TDD 责任边界。

## What is written before production code

1. 新增 E2E 验收骨架 `e2e/trip-duration-input.spec.ts`，先以失败状态覆盖：
   - 登录并选定城市前，旅游总天数控件已可见且默认值为 1。
   - 清空或输入非法值时，目的地「选定」按钮不可用。
   - 输入 1、7 及中间值，步进器显示正确值。
   - 继续减小 1 或增大 7 时值不越界并出现提示。
   - 输入非法值时错误可见，且之前的合法 `sessionStorage` 值不被覆盖。
   - 刷新同一标签页后合法值恢复。
   - 进入景点页后按设置天数从左到右显示“第 1 天”到“第 N 天”。
   - 不验证跨标签页/浏览器重启恢复，因为它们是非目标。
2. 实现阶段新增纯函数/存储模块的单测，覆盖上述 Deferred UT 清单。
3. 不新增 API 测试，因为本变更没有服务端边界。

## Local vs CI gate expectations

- 本地开发：先运行目标 E2E（真实前后端临时环境）确认验收失败，再实现；随后运行目标 E2E、前端类型检查和构建。
- 前端逻辑：运行项目现有 Vitest 单测命令（以最新基线 `package.json` 为准），不引入新测试框架。
- CI：沿用仓库现有 Web build、前端单测和 Playwright E2E job；不新增 CI 产品、服务或自定义门禁语义。
- 完整验证至少包含：前端单测、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build`、目标 E2E。
- 失败场景必须通过可访问角色/标签查询，不依赖 React 内部状态或实现细节。

## Data / fixtures strategy

- 复用现有 E2E 登录种子与目的地候选数据；测试选择稳定的城市名称或 `data` 语义，不写死 UI 卡片索引。
- 每个测试在开始时清理 `sessionStorage` 中的 `pawtrip.tripDuration` 与 `pawtrip.selectedDestination`，避免用例顺序污染。
- 刷新恢复场景在同一 Playwright page/context 内执行；不复用跨用例上下文。
- 非法输入场景先设置合法值 3，再执行非法输入，读取页面或浏览器存储确认仍为 3。
- 不创建生产数据库夹具，不修改 `apps/server/data/pawtrip.db`，不新增 API fixture。

## Non-goals and reverse verification

- **服务端/账号持久化**：E2E 不请求新增保存 API；代码审查确认本 Change 无 `apps/server` 变更。
- **`localStorage` 或跨标签页同步**：E2E 不断言跨标签页恢复；实现不得写入 `localStorage`。
- **US-09 生成页**：E2E 不新增或模拟生成页；下游接入另开验收。
- **行程生成算法**：本设计不生成按天内容；仅验证天数状态契约可以被下游读取。
- **新增 UI 库/CI 产品**：依赖与流水线清单保持不变。

## NFR scope

性能、可观测性、压力、兼容性矩阵等 NFR 测试本轮 deferred / out of scope：需求没有 SLA、吞吐量或监控指标，且本变更无网络请求和服务端负载变化。若 US-09 引入生成计算或持久化，再单独评估 NFR。
