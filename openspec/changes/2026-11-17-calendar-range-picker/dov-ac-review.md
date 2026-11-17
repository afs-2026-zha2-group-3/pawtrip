# AC / DoV Review

变更：`2026-11-17-calendar-range-picker`

范围：检查 Delta Spec 与需求方书面要求、Design、Tasks 是否一致，并核对本变更已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 日期在单一日历上选择 | Pass | `specs/trip-context/spec.md`：`创建行程确认弹窗`；`specs/destination-selection/spec.md`：`选定城市与创建行程确认` | 弹窗以一张月历收集起止日期 |
| AC-2 区间可见且端点可区分 | Pass | `design.md` D5；浏览器结构验证 | 区间底色连续，端点 `aria-pressed=true` 且实心圆角 |
| AC-3 天数按含首尾计算并限制 1–7 | Pass | `duration.ts`、`duration.test.ts`；E2E 同日/3 天/超 7 天 | `daysBetween` 未改动 |
| AC-4 未选完整或超过 7 天时拒绝创建 | Pass | `specs/trip-context/spec.md` 场景「日期范围无效」；E7、超限用例 | 提示后保持弹窗且不发送 `POST` |
| AC-5 再次点击可重新开始区间 | Pass | `specs/trip-context/spec.md` 场景「重新选择日历范围」；`trip-duration-input` 重用例 | 点击更早日期时以新日期为起点 |
| AC-6 创建、取消、宠物选择行为不变 | Pass | E6 与既有弹窗用例；`trip-helpers.ts` | 仅替换日期输入区域 |
| AC-7 不新增依赖与后端改动 | Pass | `package.json` 未变；本变更 diff 仅前端与 E2E | 自研 `CalendarRange` |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、`design.md`、两份 delta | 纯前端交互替换 |
| DoV-2 歧义已解决 | Pass | `design.md` D3、D4 | 早于开始日期采用重新开始；超 7 天仍由提交校验 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 无方向键导航、跨月需翻月、归档顺序 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` | 无输出即通过 |
| DoV-5 受影响 E2E | Pass | `npm run test:e2e -- e2e/destination-selection.spec.ts e2e/trip-duration-input.spec.ts` | 两次运行均 19 passed |
| DoV-6 浏览器结构验证 | Pass | 内置浏览器 | 5 天区间端点与区间底色正确；跨月 9 天提示超限；缺结束日期提示；月切换正常 |
| DoV-7 需求可追溯 | Pass | 需求方截图与文字要求 → proposal → delta spec → E2E | AC-1 至 AC-7 均有场景或用例 |

## Residual concerns

- 未在本变更范围内重跑全量 E2E 与 CI；PR 阶段需补齐。
- 自研日历不支持方向键在选择日期间移动；如后续多处使用日期选择，应评估换用成熟日历库。
- 与 `2026-11-17-add-trip-start-date` 修改同一组 requirement，归档顺序应先本变更、后日期持久化变更。
- 工作区同时存在日期持久化改动，本评审仅针对日历交互相关文件。

## Review outcome

文档层 AC/DoV 检查为 **Pass（规格层）**；不代表 G1/G2 已批准，也不代表 CI 已通过。
