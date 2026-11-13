# ATDD design — refactor-web-ui-with-shadcn

关联：[proposal.md](proposal.md) · [design.md](design.md) · [tasks.md](tasks.md) · Delta Spec：[ui-foundation](specs/ui-foundation/spec.md) / [web-app-shell](specs/web-app-shell/spec.md) / [paws-page](specs/paws-page/spec.md)

## 1. ATDD 分层范围

本次为前端 UI 与路由重构，无新增 API；既有 `GET /api/greeting` 契约由现有 `GreetingApiTest` 覆盖，不在本次新增 API 验收。验收层以 **E2E** 为主。

| # | 场景 | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| S1 | `/` 与 `/paws` 顶部居中显示 `Home` / `Paws` 两 Tab | E2E | Compatibility（可选） | 断言页面可见结构，需真实渲染 |
| S2 | `/` 的 `Home` 选中并展示 `/api/greeting` 的 `message` | E2E | — | 依赖真实后端与浏览器渲染 |
| S3 | 点击 `Paws` 后 URL 变为 `/paws`、Tab 选中、内容为空 | E2E | — | 用户导航 + URL + 页面状态 |
| S4 | 直接访问 `/paws` 正常渲染且不出现 404 | E2E | — | 路由直达与页面状态 |
| S5 | 未知路由仍显示 404 页 | E2E | — | 既有行为回归 |
| S6 | 首页首次加载失败进入错误页并可重试 | E2E | — | UI 错误态与用户操作 |
| S7 | 页面不再出现模板页头、页脚、社交链接、主题切换、Devtools | E2E | — | 页面可见性断言 |
| S8 | `styles.css` 无自定义类、界面组件来自 `components/ui` | E2E（静态验收） | — | 通过 `rg` + 构建验证，不引入测试框架 |

**Deferred to `/sdd:atdd-apply`（unit-level TDD）**：无独立纯逻辑模块；`pathname → Tab value` 映射逻辑极简，由 E2E 覆盖，不单列 UT。

**非目标反向验证**

| Non-goal | 反向验收 |
|---|---|
| Paws 不承载业务内容 | 打开 `/paws` 断言不出现问候语、占位文案或列表内容 |
| 不改接口与后端 | 运行既有 `GreetingApiTest`，`GET /api/greeting` 仍返回 `200` + `{"message":"Hello World"}` |
| 不做主题切换 / i18n | 页面不存在主题切换按钮与语言切换控件 |
| 不新增前端测试框架 | 仓库依赖与脚本中不出现 Playwright / Vitest / Jest 等新增项 |

## 2. 生产代码之前先写什么

仓库当前无前端测试框架，本次不引入。因此 ATDD 以**可执行的人工验收脚本**形式先于实现：

1. 启动后端与前端，按 S1–S8 执行；在实现前预期失败（仅模板 UI、无 `/paws`、Tab 不存在）。
2. 记录每条场景的实际结果，作为红灯基线。
3. 实现完成后执行同一脚本，全部转为绿灯。
4. 后端契约回归直接运行既有 `GreetingApiTest`，不新增测试代码。

## 3. Local vs CI 门禁

| 阶段 | 门禁 | 说明 |
|---|---|---|
| Local | `npm run build` | 类型检查、路由树生成、打包通过 |
| Local | 浏览器 E2E 脚本 S1–S8 | 需后端运行；失败态场景可停止后端验证 |
| Local | `node --test scripts/portability.test.mjs` | 仓库脚本回归 |
| CI | 既有后端测试与前端构建 | 不新增 CI 语义；如仓库无流水线，记录 N/A |

## 4. Data / fixtures strategy

- **共享数据**：使用现有 SQLite 种子问候语 `Hello World`；不新增迁移或测试数据。
- **E2E 前置**：`cd apps/server && ./mvnw spring-boot:run` 后 `npm run dev`。
- **失败态**：暂停后端进程或在浏览器中阻断 `/api` 请求，验证错误页与重试。
- **清理**：无新增持久化数据；测试结束后恢复后端运行即可。
- **隔离**：Paws 页面不读取数据，无需 fixture。

## 5. Non-goals

- 不写业务实现或测试代码（由 `/sdd:atdd-apply` 负责）。
- 不设计单元测试套件。
- 不引入 Playwright / Cypress / POM / Excel 用例生成器。
- 不新建 CI 产品或修改流水线语义。

## 6. NFR tests

经需求方确认：**不纳入本次 NFR 测试**（可访问性、性能、可观测性后续独立评估）。本次仅验证 UI、路由与既有行为。
