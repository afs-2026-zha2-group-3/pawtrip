# AC / DoV review — refactor-web-ui-with-shadcn

- Change: `refactor-web-ui-with-shadcn`
- Stage: P2 Delta Spec review
- Inputs:
  - `proposal.md`
  - `specs/ui-foundation/spec.md`
  - `specs/web-app-shell/spec.md`
  - `specs/paws-page/spec.md`
  - `design.md`、`tasks.md`
  - `requirement-workspace/requirements/REQ-003-shadcn-ui-shell-and-tabs.md`

## Acceptance criteria (AC)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 Requirement 至少有一个可测试 AC | Pass | 三个 delta spec 的 `### Requirement` 均带 `#### Scenario` | 共 7 个 Requirement、11 个 Scenario |
| AC-2 AC 可观测 | Pass | `web-app-shell` 断言 Tab 选中态、URL、内容；`ui-foundation` 断言文件与组件来源；`paws-page` 断言直接访问与空内容 | 均可通过浏览器或代码检查验证 |
| AC-3 高风险负向 / 边界场景已覆盖 | Pass | `paws-page` 直接访问 `/paws`；`ui-foundation` 模板残留与自定义类检查 | 未知路由、首次加载失败由既有 `frontend-api-request` Living Spec 覆盖，本次不重复定义 |
| AC-4 AC 不是实现细节、无模糊措辞 | Pass | 需求使用 SHALL/MUST；场景为用户可观察结果 | “多余包裹标签”由代码评审判定，任务 5.4 提供核查入口 |

## Definition of verified (DoV)

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致，无静默扩范围 | Pass | `proposal.md` 的 3 个新增 capability 与三个 delta spec 一一对应 | 无新增数据、接口或后端变更 |
| DoV-2 歧义已列出或解决 | Pass | REQ-003 Open Questions：阻断项全部 resolved；非阻断项 deferred | Tab 路由方案已于 2026-11-14 由需求方确认 |
| DoV-3 角色关注点已记录 | Pass | 本表“残余关注” | IO/SA 需确认导航文案固定为 `Home` / `Paws`，不做 i18n |
| DoV-4 未声称业务实现完成 | Pass | 本评审仅覆盖规格与设计 | 尚无生产代码改动 |
| DoV-5 Requirement 可追溯到 proposal / 已批准需求 | Pass | 每个 req 可追溯到 REQ-003 acceptance hints 与 proposal What Changes | 见下方追溯表 |

## Traceability

| Delta Requirement | Proposal / REQ-003 来源 |
|---|---|
| `ui-foundation` 页面与交互组件统一使用 shadcn/ui | What Changes「引入 shadcn/ui 基础设施」；REQ-003 acceptance hints |
| `ui-foundation` 禁止手写样式与多余包裹标签 | What Changes「重建 styles.css」；约束「禁止手写 CSS 类」 |
| `ui-foundation` 移除模板残留 UI | What Changes 第一条；Acceptance hints「不再出现模板页头…」 |
| `web-app-shell` 顶部居中横向两 Tab 导航 | What Changes「新增应用外壳」；S1 |
| `web-app-shell` Tab 与路由同步 | What Changes「Tab 与路由同步」；S2–S4；路由方案已确认 |
| `web-app-shell` Home Tab 展示问候语 | 既有 `home-page` 行为不变；S2 |
| `paws-page` Paws 页面可访问且内容为空 | What Changes「新增 `/paws` 路由」；S3–S4 |

## 残余关注

| 关注点 | Owner | 说明 |
|---|---|---|
| 导航文案固定为 `Home` / `Paws`，无 i18n | IO / Product | 与本次“不引入 i18n”的非目标一致 |
| 无前端自动化测试 | QA / Dev | 本次以 `npm run build` 与浏览器 E2E 验收；后续可独立引入测试框架 |
| shadcn CLI 初始化参数 | Dev | 实现时按本地技能文档核对，失败则手工补齐主题变量 |

## 结论

无阻断性 Fail；Delta Spec 可进入 G1 评审。G1 决策由 IO + SA 人工签署，本评审不代替 Gate。
