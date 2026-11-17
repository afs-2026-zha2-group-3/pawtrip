# Change summary — 2026-11-17-restore-policy-entry-and-trip-dialog

- Change id: `2026-11-17-restore-policy-entry-and-trip-dialog`
- 状态：已合并（PR #64，merge `0b59ca5`，2026-11-17）并归档
- 分支：`feat/city-trip-confirm-dialog`（基于 `origin/main` `15be046`）

## Intent

恢复「政策只通过入口查看、选城即确认行程并进入景点选择」的用户路径。此前统一地点浏览改造把选城变成了城市详情页 + 草稿面板两步流程，需求方要求回到确认弹窗方案。

## What shipped

- `/cities` 始终展示候选列表；存在激活行程或草稿也不再切换城市详情视图。
- 候选卡片恢复「查看政策」链接（`/destinations/{adcode}/policy`），候选页不内嵌政策内容。
- 新增「创建行程」对话框：目的地只读、开始/结束日期、携带宠物（默认第一只、可切换）；日期推导 1–7 天。
- 确认调用 `POST /api/trips`，创建并激活行程、写入 `activeTripId`、跳转 `/attractions`；取消无写入。
- 同一时间只支持一个激活行程：存在激活行程时候选仍展示，但「选定」禁用并提示先在 Trips 取消激活。
- 新增 `apps/web/src/lib/trip/duration.ts` 与单测；修正 `store.ts` 的 `TransportMode` 导入来源以消除既有 `tsc` 报错。
- 更新 E2E 助手与 7 个受影响 spec。
- 未改动后端、数据库与依赖。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` |
| 前端单测 | Pass | `npm test -w apps/web`：15 文件 99 用例 |
| 受影响 E2E | Pass | `CI=1 npm run test:e2e --` 7 个 spec：82 passed / 0 failed |
| 浏览器结构验证 | Pass | `/cities` 卡片含「查看政策」；「选定」打开创建行程对话框 |
| 全量 E2E / CI | Pass | PR #64：Web CI run `44012887605`、E2E CI run `44012887414`（head `f9abc94`）；Server CI 未触发（无后端变更） |
| OpenSpec validate | Pass | `npx --no-install openspec validate <change> --strict` |
| G1 | Pass（IO=Kitty Su，SA=HARLAN HUANG，2026-11-17） | `g1-decision.md` |
| G2 | Pass（VL=SCOTT，2026-11-17；CI 证据见本摘要与 tasks） | `g2-decision.md` |
| G3 | 待实名签署（归档已完成，本记录不代签） | — |

## Residual risks / follow-ups

1. 起止日期不落库，行程只保存 `totalDays`；需展示日期时另起变更。
2. 草稿 store 与面板草稿 UI 仍存在但无入口，后续单独清理。
3. 单城市口径：存在激活行程时需先到 Trips 取消激活，才能选择新城市。
4. `tasks.md` 4.5 已由 PR #64 CI 补齐；G2 记录中的 CI 条件证据见本摘要与 tasks；G3 待实名签署。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/destination-selection/spec.md`、`specs/trip-context/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
