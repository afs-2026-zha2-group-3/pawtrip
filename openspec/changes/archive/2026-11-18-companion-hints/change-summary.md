# Change summary — companion-hints

- Change: `2026-11-18-companion-hints`（REQ-018 伙伴提示气泡，US-52）
- Status: P5 归档；G1 Pass（IO/SA=kitty）、G2 Pass（VL=TANTA6）、G3 待签署
- PR: #151 已合并入 main（`764a08b`）
- 分支: `feat/companion-hints`

## Intent

US-52 要求每个登录后页面都有以宠物名字说话的伙伴提示，统一承接下一步建议与规则/操作反馈。旧实现把提示散落在内联文案里，口径与样式不一致；右下角已有 Chatbot 入口，再加独立伙伴头像会造成两个入口职责重叠。本变更把伙伴气泡挂在既有 Chatbot 入口上方，以宠物第一人称统一提示口径。

## What shipped

- 入口复用：沿用 `agent-fab` 的位置、样式、测试标识与可访问名称；点击直接打开既有 AgentPanel，打开面板时正在展示的气泡立即关闭且不重新弹出；未新增第二个浮动头像。
- 全局气泡：`lib/companion` store 提供统一 `say(text, mood)`，情绪 `ok / info / warn / danger` 映射四档边框；同一时刻最多一个气泡，新气泡替换旧气泡并重新计时；展示 5000ms 后自动关闭；可手动关闭。
- 署名：标题「<宠物名> · 伙伴提示」，取档案第一只宠物；无档案默认「豆包」。
- 逐页提示：`useCompanionHint` 覆盖首页、我的宠物、城市浏览、地点浏览、交通规则、我的行程、行程单；每次 pathname 切换自动展示一次，同路径重渲染不重复；数据未就绪时不弹可能误导的提示。
- 业务反馈：保存档案、选择城市、加入景点、选择大交通方式、创建/切换/只读行程、创建行程单、导出成功与失败统一经 `say()` 反馈；跨页事件气泡优先于本页情境提示。
- 文案口径：七页 hint 与全部业务事件为宠物第一人称（「我/我们」），多宠物场景保留其他宠物名字。
- 边界：`/login` 不渲染入口；`/admin/*` 不展示气泡但保留既有入口；状态仅存内存，刷新不恢复。

## Verify highlights

- 本地：后端 `./mvnw test` 271；前端 vitest 49 files / 364；`tsc --noEmit` 无错误；`npm run build -w apps/web` 成功；全量 E2E 104/104；`openspec validate --strict` 通过。
- CI：PR run 44435747026 与合并后 main run 44436980655 全绿；Backend tests 因纯前端 diff 按变更检测跳过，由本地 271 补证。
- 报告：`docs/ai4se-plugins/20261119-093534-local-verify-report.md`、`docs/ai4se-plugins/20261119-093530-pipeline-report.md`、change 目录 `ci-report.md`。

## Residual risks

1. CI Backend tests 因 paths 过滤跳过（纯前端变更），由本地 271 补证。
2. `tsc --noEmit` 不在 CI 门禁，依赖本地校验。
3. 仓库无独立 CD/部署工作流，CD 记为 n/a。
4. 气泡文案为产品口吻，E2E 仅断言关键短语，文案微调需同步断言。
5. 提示状态仅存内存，刷新丢失，属设计 D2 明确行为。

## Links

- Change: `openspec/changes/archive/2026-11-18-companion-hints/`
- Requirements: `requirement-workspace/requirements/REQ-018-companion-hints.md`
- PR: https://github.com/afs-2026-zha2-group-3/pawtrip/pull/151
