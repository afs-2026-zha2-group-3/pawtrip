# Change summary — 2026-11-17-transport-mode-panel-picker

- Change id: `2026-11-17-transport-mode-panel-picker`
- 状态：已合并（PR #73，merge `8770c88`）并归档；G2 Pass（VL=SCOTT）、G3 Pass（SA=LEO）
- 分支：`feat/transport-mode-in-panel`（基于 `main` `fcde4c7`）

## Intent

让用户在地点浏览页的行程面板里直接选择大交通方式，不必为选一种方式跳到交通规则页，同时看到当前行程宠物的推荐结论。

## What shipped

- 行程面板顶部只读大交通 tag 改为选择入口：已选显示「大交通 · 方式名」，未选显示「选择大交通」。
- 新增浮层：飞机/高铁/火车/自驾四项，按激活行程宠物显示「宠物名 · 推荐/不推荐」及原因；飞机标注默认航司；右上角「规则详情」跳转 `/transport-rules`。
- 宠物档案加载中/失败分别展示「正在读取宠物档案…」与「暂时无法读取宠物档案，请稍后重试。」，入口与方式选择保持可用。
- delta 用 `RENAMED Requirements` + `MODIFIED` 把「大交通方式面板标签」升级为「大交通方式面板选择入口」，已在干净 `main` 上验证归档可应用。
- 选择即写入激活行程 `transportMode`，沿用 600ms 防抖保存；规则页单选同步回显。
- 新增 Base UI Popover 封装、`transportModeOptions` 纯函数与单测；E2E 新增面板选择与详情跳转用例。
- 无新增依赖、后端接口或数据库改动。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | 合并 main 前 `tsc` 通过；合并后仅 main 既有 `anchors.test.ts` fixture 错误，与本变更无关，CI 不跑 tsc |
| 前端单测 | Pass | `npm test -w apps/web`（合并 main 后）：26 文件 194 项 |
| 受影响 E2E | Pass | `rule-recommendation-and-selection`：合并前 7 passed；PR Browser E2E 全量通过 |
| 浏览器结构验证 | Pass | 浮层结论、选择后标签与「已保存」、规则页单选同步 |
| OpenSpec validate | Pass | change `--strict` 通过；`--specs` 24 passed（非 strict；全量 strict 仍有无关 TBD Purpose 失败） |
| G1 / G2 / G3 | G2 Pass（VL=SCOTT）；G3 Pass（SA=LEO）；G1 未单独记录 | `g2-decision.md`、`g3-decision.md` |
| 全量 E2E / CI | Pass | PR #73：Web build 37s、Browser E2E 9m4s |

## Residual risks / follow-ups

1. 飞机结论固定按默认航司（中国国际航空）；规则页切换航司后的结论可能不同，浮层已标注。
2. 宠物档案不可用时浮层只展示方式与状态文案，不给结论；加载中与失败文案已分开。
3. 全量 E2E 与 CI 已由 PR #73 覆盖并通过。
4. 提交范围：新增 `popover.tsx`、`transport-mode-picker.tsx`、`transport-mode-options.ts` 与其单测、本 change 目录；修改 `trip-panel.tsx`、E2E、2 份 delta 与 living spec。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/trip-context/spec.md`、`specs/transport-rules-comparison-page/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
- Gates: `g2-decision.md`、`g3-decision.md`
