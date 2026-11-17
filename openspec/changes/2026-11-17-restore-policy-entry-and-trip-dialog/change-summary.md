# Change summary — 2026-11-17-restore-policy-entry-and-trip-dialog

- Change id: `2026-11-17-restore-policy-entry-and-trip-dialog`
- 状态：实现与本地验证完成；PR / CI / 归档待执行
- 分支：`feat/city-trip-confirm-dialog`（基于 `origin/main` `15be046`）

## Intent

恢复「政策只通过入口查看、选城即确认行程并进入景点选择」的用户路径。此前统一地点浏览改造把选城变成了城市详情页 + 草稿面板两步流程，需求方要求回到确认弹窗方案。

## What shipped

- `/cities` 始终展示候选列表；存在激活行程或草稿也不再切换城市详情视图。
- 候选卡片恢复「查看政策」链接（`/destinations/{adcode}/policy`），候选页不内嵌政策内容。
- 新增「创建行程」对话框：目的地只读、开始/结束日期、携带宠物（默认第一只、可切换）；日期推导 1–7 天。
- 确认调用 `POST /api/trips`，创建并激活行程、写入 `activeTripId`、跳转 `/attractions`；取消无写入。
- 新增 `apps/web/src/lib/trip/duration.ts` 与单测；修复 `apps/web/src/lib/trip/types.ts` 的 `TransportMode` 导出（既有 `tsc` 报错）。
- 更新 E2E 助手与 7 个受影响 spec。
- 未改动后端、数据库与依赖。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` |
| 前端单测 | Pass | `npm test -w apps/web`：15 文件 99 用例 |
| 受影响 E2E | Pass | `CI=1 npm run test:e2e --` 5 个 spec：50 passed / 0 failed |
| 浏览器结构验证 | Pass | `/cities` 卡片含「查看政策」；「选定」打开创建行程对话框 |
| 全量 E2E / CI | Pending | 待提交 PR 后确认 |
| OpenSpec validate | Pass | `npx --no-install openspec validate <change> --strict` |
| G1 | Pass（IO=Kitty Su，SA=HARLAN HUANG，2026-11-17） | `g1-decision.md` |
| G2 | Pass（VL=SCOTT，2026-11-17；CI 证据待 PR 补录） | `g2-decision.md` |
| G3 | 待合并归档后签署 | — |

## Residual risks / follow-ups

1. 起止日期不落库，行程只保存 `totalDays`；需展示日期时另起变更。
2. 草稿 store 与面板草稿 UI 仍存在但无入口，后续单独清理。
3. 已有激活行程时再次选城会创建并激活新行程，旧行程保留在 Trips 列表。
4. `tasks.md` 4.5（全量 E2E 与 CI）与 G2 的 CI 证据待 PR 后补齐；G3 待合并归档时签署。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/destination-selection/spec.md`、`specs/trip-context/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
