## 1. 候选页恢复政策入口

- [x] 1.1 在 `apps/web/src/routes/_authenticated/cities.tsx` 删除 `CityDetailView`、`DetailItem` 及激活/草稿判断，`/cities` 始终渲染候选列表。
- [x] 1.2 每张候选卡片补充「查看政策」链接，目标 `/destinations/$adcode/policy`，`aria-label` 为「查看{城市名}的城市政策」。验证：`/cities` 快照出现链接，页面无政策要点。

## 2. 创建行程确认弹窗

- [x] 2.1 新增 `apps/web/src/routes/_authenticated/-city-trip-dialog.tsx`：目的地只读 chip、开始/结束日期、携带宠物 Select、取消/确定。
- [x] 2.2 新增 `apps/web/src/lib/trip/duration.ts` 的 `daysBetween`：含首尾计数，结束早于开始或非法日期返回 `null`。
- [x] 2.3 确认时调用 `POST /api/trips`（`createEmptyPlan(days)`），成功后 `cacheCity`、`discardDraft`、`setActive`、`setSaveStatus("saved")`、失效 Trips 查询并 `navigate("/attractions")`；取消只关闭弹窗。
- [x] 2.4 校验：缺日期、结束早于开始、超出 1–7 天均阻止提交并展示对应提示；无宠物时提示并禁用「确定」。
- [x] 2.5 修复 `apps/web/src/lib/trip/types.ts` 未导出 `TransportMode` 导致既有 `tsc` 报错。

## 3. 测试同步

- [x] 3.1 新增 `apps/web/src/lib/trip/duration.test.ts`：同日起止、跨月、结束早于开始、非法/缺失日期。
- [x] 3.2 更新 `e2e/trip-helpers.ts`：`openTripDialog`、`setTripDates`、`chooseTripPet`、`confirmTripDialog`、`createTrip`；移除草稿天数/宠物辅助函数。
- [x] 3.3 重写 `e2e/destination-selection.spec.ts` E5–E9、E15：弹窗取消、确认跳转景点、日期校验、政策入口、候选页不内嵌政策。
- [x] 3.4 重写 `e2e/trip-duration-input.spec.ts`：同日 1 天、日期推导 3 天、拒绝超过 7 天、拒绝结束早于开始。
- [x] 3.5 更新 `e2e/trips-panel.spec.ts`：移除草稿阻止激活用例；景点页需先创建行程；活动行程宠物改为弹窗选择「毛毛」。
- [x] 3.6 更新 `e2e/transport-rules.spec.ts`、`e2e/attraction-pet-rules.spec.ts`、`e2e/city-pet-policy.spec.ts` 的 `createTrip` 调用与政策入口用例。

## 4. 验证

- [x] 4.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 4.2 `npm test -w apps/web`：99 项通过（含新增 3 项日期单测）。
- [x] 4.3 `CI=1 npm run test:e2e --` 受影响 5 个 spec：50 项通过、0 失败（destination-selection / trip-duration-input / trips-panel / city-pet-policy / rule-recommendation-and-selection）。
- [x] 4.4 内置浏览器结构验证：`/cities` 卡片含「查看政策」链接；「选定」打开创建行程对话框并展示城市、日期、携带宠物。
- [ ] 4.5 全量 E2E 与 CI 三工作流待提交 PR 后确认。
