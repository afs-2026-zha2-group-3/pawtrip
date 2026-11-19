# Consistency Lint — 2026-11-18-companion-hints

日期：2026-11-18
范围：`proposal.md`、`specs/companion-hints/spec.md`、`design.md`、`tasks.md`、`dov-ac-review.md`、P1 REQ-018。

| 检查项 | 结果 | 证据 / 说明 |
|---|---|---|
| 入口形态一致 | Pass | Proposal、Delta、Design D1、Tasks 1.3/1.4 均为「复用既有 `agent-fab`，点击打开面板，不新增第二个头像」 |
| 点击行为一致 | Pass | Delta「点击入口 MUST 直接打开 Agent 面板」；Design D1 `setOpen(true)`；Tasks 1.3 |
| 气泡内 AI 按钮 | Pass | Delta、Design D5、Tasks 1.5 均为「移除，入口即 AI 入口」 |
| 署名规则一致 | Pass | Delta、Design D5、P1 REQ-018 均为「第一只宠物名；无档案默认豆包」 |
| 展示时长一致 | Pass | Delta、Design D4、Tasks 1.6 均为 5000ms；P1 记录已覆盖故事原 4.6 秒 |
| 自动触发一致 | Pass | Delta「pathname 变化后自动展示一次，同路径不重复」；Design D3；Tasks 1.2 |
| 事件优先级一致 | Pass | Delta「事件未过期优先」；Design D3；`dov-ac-review.md` Residual concerns |
| 替换与计时一致 | Pass | Delta「新气泡替换并重新计时，同时最多一个」；Design D4；Tasks 1.1 |
| 情绪映射一致 | Pass | Delta 四档情绪；Design D5 边框/状态点色值；Tasks 1.1、3.x |
| 页面矩阵一致 | Pass | P1 `analysis/REQ-018/deep-dive.md` §3 与 Tasks 2.1–2.7 逐页对应；加载中均不展示 |
| 事件矩阵一致 | Pass | P1 deep-dive §4 与 Tasks 3.1–3.6 对应；判定复用既有业务结果 |
| 管理端边界一致 | Pass | Delta、Design D7、Tasks 1.9 均为「无气泡、保留入口」 |
| 登录页边界一致 | Pass | Delta、Design D7 均为「无入口」；登录页不在认证外壳 |
| 非模态/可访问性一致 | Pass | Delta、Design D5 均为 `role="status"`、不抢焦点、不阻塞 |
| 窄窗规则一致 | Pass | Delta、Design D5、Tasks 1.4 均为 `min(20rem, calc(100vw - 2rem))` |
| 持久化口径一致 | Pass | Delta、Design D2 均为仅内存；无服务端写入 |
| 零后端/零迁移一致 | Pass | Proposal Impact、Design Migration、Dov DoV-9 均为 N/A |
| 既有内联提示 | Pass | Proposal、P1 Out、Design Non-goals 均声明保留，不删除 |
| Tasks 与 Design 对齐 | Pass | 5 组 35 项覆盖 store、入口/气泡、逐页、事件、测试与验证命令；头部链接 `design.md` 与 `atdd-design.md` |
| ATDD 与任务对齐 | Pass | `atdd-design.md` 21 场景分层；`alignment-self-check.md` 5/5 追溯 + 30/30 横切 Pass；E2E 新增 5 项 ≤30 |
| AC 与 Scenario 追溯 | Pass | `dov-ac-review.md` 5 个 Requirement / 21 个 Scenario，AC-1…AC-7 全覆盖 |
| 术语一致 | Pass | 统一「伙伴提示」「伙伴气泡」「Chatbot 入口」；无「独立头像」「agent-fab 移除」残留 |
| 规范校验 | Pass | `npx --no-install openspec change validate 2026-11-18-companion-hints --strict` → valid（2026-11-18） |

## Findings

| 级别 | 位置 | 问题 | 处理 |
|---|---|---|---|
| SUGGESTION | 管理端边界 | 故事「admin 不出现伙伴」与既有入口全局可用存在解释空间 | 按「伙伴提示不出现、入口保留」实施，Design D7 已记录 |
| SUGGESTION | 当前实现 | WIP 仍为独立头像、4.6 秒、点击展示提示、已移除 `agent-fab` | P4 按 Design D1/D5 收敛；G1 仅依据规格与设计 |
| SUGGESTION | 验证缺口 | 依赖未安装，单测/E2E 未运行 | P4 执行 Tasks 4.1–4.6、5.1–5.7；DoV-7/DoV-10 不记 Pass |

BLOCKER：0；WARNING：0；SUGGESTION：3。Verdict：**Pass**。
