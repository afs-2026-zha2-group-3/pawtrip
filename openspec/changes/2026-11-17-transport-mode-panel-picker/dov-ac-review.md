# AC / DoV Review

变更：`2026-11-17-transport-mode-panel-picker`

范围：检查 Delta Spec 与需求方反馈、Design、Tasks 是否一致，并核对已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 未选时面板提供选择入口 | Pass | `specs/trip-context/spec.md` 场景「尚未选择大交通方式」；浏览器结构验证 | 虚线「选择大交通」，不展示方式名 tag |
| AC-2 已选时标签可点击 | Pass | 同 requirement；E2E 选择高铁后刷新，再次点开 `transport-mode-tag` 并断言 `aria-pressed=true` | 保留既有 testid 与文案 |
| AC-3 浮层展示四种方式 | Pass | 同 requirement；E2E 断言 `[data-mode]` 共 4 项，单测核对四种方式顺序 | 飞机/高铁/火车/自驾 |
| AC-4 按激活宠物给结论与原因 | Pass | `design.md` D1；单测 3 项；E2E 断言高铁不推荐与体重原因 | 复用 `evaluateRuleForPet` |
| AC-5 选择后自动保存并回显 | Pass | E2E 断言 `PUT transportMode=high_speed_rail`、标签更新、刷新保留 | 沿用 600ms 防抖 |
| AC-6 规则详情入口 | Pass | 浮层右上角「规则详情」；E2E 跳转 `/transport-rules` | user 截图红框位置 |
| AC-7 规则页与面板同一选择 | Pass | `specs/transport-rules-comparison-page/spec.md` 场景「面板选择后规则页回显」；E2E 面板选高铁后进入规则页断言 radio 选中 | 两处只写 store |
| AC-8 宠物数据不可用仍可选 | Pass | E2E 拦截 `/api/pets` 500：展示「暂时无法读取宠物档案，请稍后重试。」，方式项可点并发出 `PUT` | 不展示结论，不替代宠物 |
| AC-9 无新增依赖与后端改动 | Pass | 变更 diff 仅前端与 E2E | Popover 来自已有 `@base-ui/react` |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、两份 delta | 面板入口 + 浮层 + 详情链接 |
| DoV-2 歧义已解决 | Pass | `design.md` D1、D3、D5 | 默认航司、入口形态、详情链接位置 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 航司差异、宠物不可用、移动端布局 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` | 无输出即通过 |
| DoV-5 前端单测 | Pass | `npm test -w apps/web` | 24 文件 188 项通过 |
| DoV-6 受影响 E2E | Pass | `rule-recommendation-and-selection` | 7 passed |
| DoV-7 浏览器结构验证 | Pass | 内置浏览器 | 浮层结论、选择后标签与「已保存」、规则页单选同步 |
| DoV-8 规格校验 | Pass | `openspec validate <change> --strict`；`openspec validate --specs` | change strict 通过；specs 23 passed（非 strict；全量 strict 仍有 6 个无关 TBD Purpose 失败） |

## Residual concerns

- 飞机结论固定按中国国际航空，与规则页切换航司后的结论可能不同；浮层已标注航司。
- 宠物档案加载中/失败时只展示对应状态文案，不给结论；方式选择不受影响。
- 全量 E2E 与 CI 未在本变更上运行，PR 阶段补齐。
- 未提交、未建 PR、未归档；G1/G2/G3 未签署。

## Review outcome

文档层 AC/DoV 检查为 **Pass（规格层）**；不代表 Gate 已批准，也不代表 CI 已通过。
