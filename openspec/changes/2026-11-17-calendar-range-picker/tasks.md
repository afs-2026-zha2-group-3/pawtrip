# Tasks

## 1. 日历组件

- [x] 1.1 新增 `apps/web/src/components/ui/calendar-range.tsx`：单月网格、上/下月切换、日一二三四五六表头、`yyyy-MM-dd` 状态与字符串比较。
- [x] 1.2 区间样式：区间内 `bg-muted` 连续色带，起点 `rounded-l-md`、终点 `rounded-r-md`，同日与未选结束时的起点保持 `rounded-md`；端点实心 `bg-primary`。验证：浏览器结构检查 11-10 至 11-14 端点与区间类名正确。
- [x] 1.3 无障碍与测试标记：日期按钮 `aria-label="YYYY年M月D日"`、端点 `aria-pressed`、根节点 `data-slot="calendar-range"` 与 `data-month`、月份标题 `aria-live="polite"`，所有按钮 `type="button"`。

## 2. 弹窗接入

- [x] 2.1 `apps/web/src/routes/_authenticated/-city-trip-dialog.tsx` 删除两个原生日期输入与 `Input` 引用，改为「出行日期」`CalendarRange`，选中后清除错误。
- [x] 2.2 选择语义与校验：无开始/已有完整区间/点击更早日期 → 重新开始；提交时缺日期提示「请选择开始和结束日期。」，超 7 天提示「行程需为 1–7 天。」；删除不可达的「结束日期不能早于开始日期」分支。
- [x] 2.3 天数提示：未选完整时提示「已选择 X 开始，请再选择结束日期」或初始引导；完整且合法时显示「行程共 N 天（起 至 止）」。

## 3. 测试同步

- [x] 3.1 `e2e/trip-helpers.ts` 新增 `pickCalendarDate`（按 `data-month` 自动前/后翻月并点击 `data-date`），`setTripDates` 改为先点 `isoDate(1)` 再点 `isoDate(days)`。
- [x] 3.2 `e2e/destination-selection.spec.ts`：E5 改为断言日历可见且无选中日期；E7 改为「只选开始日期」与「超过 7 天」两类拒绝，均不发送 `POST`。
- [x] 3.3 `e2e/trip-duration-input.spec.ts`：同日、3 天、超 7 天改用日历点击；「结束早于开始」用例替换为「点击更早日期重新开始区间」并断言 3 天提示。
- [x] 3.4 保留既有 `apps/web/src/lib/trip/duration.test.ts` 覆盖 `daysBetween`，无需改动。

## 4. 规格同步

- [x] 4.1 `openspec/specs/trip-context/spec.md`：`创建行程确认弹窗` 改为单一日历选择，新增「重新选择日历范围」场景，「日期范围无效」改为缺结束日期或超 7 天。
- [x] 4.2 `openspec/specs/destination-selection/spec.md`：`选定城市与创建行程确认` 与「拒绝非法日期范围」同步。
- [x] 4.3 本 change 的 delta spec、proposal、design、ATDD、DoV、alignment 与本 tasks 落盘。

## 5. 验证

- [x] 5.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 5.2 受影响 E2E 两次运行均通过：`JAVA_HOME=<JDK21> npm run test:e2e -- e2e/destination-selection.spec.ts e2e/trip-duration-input.spec.ts`，19 passed / 0 failed。该运行为组合运行，包含日期持久化改动，不能单独证明本 change；最终以同一 PR 的 CI 为准。
- [x] 5.3 内置浏览器结构验证：11-18 → 11-22 提示「行程共 5 天」且 19–21 为区间、18/22 为端点；跨月 11-25 → 12-03 提示超 7 天；仅选开始日期提交提示缺少结束日期；月切换后 `data-month` 与日期数量正确。
- [x] 5.4 `npx --no-install openspec validate 2026-11-17-calendar-range-picker --strict` 通过。

## Workflow follow-up

- 与 `2026-11-17-add-trip-start-date` 放在同一个 PR 交付：dialog 与 E2E 改动 hunk 交织，按路径拆不开。
- 先归档本变更，再归档 `2026-11-17-add-trip-start-date`；本变更 delta 中的「MUST NOT 持久化」是过渡文本，由日期 change 翻转。
- G1（Pass，IO=Kitty Su、SA=HARLAN HUANG）与 G2（Conditional，VL=SCOTT）已记录；G3 待合并归档后实名签署。
