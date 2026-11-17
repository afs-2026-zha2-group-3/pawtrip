# Change summary — 2026-11-17-add-trip-itinerary

- Change id: `2026-11-17-add-trip-itinerary`
- 状态：实现与本地验证完成；未提交、未建 PR、未归档
- 分支：`feat/trip-itinerary`（基于 `main` `fcde4c7`）

## Intent

交付 US-48「查看行程单」：把分散的地点、交通与政策提醒按天汇总为一页，支持 Day 切换与地点政策展开。食宿/应急/天气与具体时间点尚无数据源，本变更按单城市口径交付，未接入板块直接隐藏。

## What shipped

- 新增 `/itinerary` 页面与 `buildItinerary` 纯函数：日期由 `startDate + (day-1)` 派生，按天生成地点与途内交通时间线。
- Day 1…N 切换；每天显示日期、城市、地点数与当天提醒；未排期地点独立区域。
- 途内交通段展示方式、估算时长与费用；打车附宠物专车提示；估算失败、同地点连续与自驾仅时长均有对应口径。
- 每个地点可展开「详细携宠政策」，复用共享 `petPolicyFields`：未配置字段隐藏，布尔 `false` 展示「不需要」，全空展示「暂无详细规则」。
- 入口：行程面板、Trips 激活行程卡片、Trips/行程单分段导航；`/itinerary` 归属 Trips 导航；未登录访问跳转 `/login`。
- 行程恢复期间展示「正在读取行程…」，避免首屏空态闪烁；城市缓存命中时不再重复请求 destinations。
- 新增单测 6 项与 `e2e/itinerary.spec.ts` 用例（本变更 8 条）；无后端与依赖变更。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0 |
| 前端单测 | Pass | `npm test -w apps/web`：24 文件 191 项 |
| 受影响 E2E | Pass | `e2e/itinerary.spec.ts`：8 passed |
| 浏览器结构验证 | Pass | Trips 高亮、分段导航、Day tab、日期头与空天状态 |
| OpenSpec validate | Pass（本变更） | change `--strict` 通过；`--specs` 23 passed / 0 failed；`--specs --strict` 有 6 项既存告警 |
| G1 / G2 / G3 | 未签署 | 需需求方明确指示并实名后补记录 |
| 全量 E2E / CI | 未运行 | 待 PR 阶段补齐 |

## Residual risks / follow-ups

1. 食宿（US-12）、应急（US-13）、天气（US-16）与具体时间点未接入，页面不展示对应内容。
2. 路线估算依赖高德与路况，失败时仅展示「估算暂不可用」；成功路径以快照固定验证，不断言真实金额。
3. 打印/导出（US-49）由后续变更承接，本变更不宣称覆盖。
4. 单城市限制：多目的地需扩展日期×城市模型。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/trip-itinerary/spec.md`、`specs/web-app-shell/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
