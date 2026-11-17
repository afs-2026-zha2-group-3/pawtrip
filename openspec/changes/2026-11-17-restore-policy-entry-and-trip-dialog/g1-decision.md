# G1 决策记录：恢复政策入口与创建行程弹窗

- Change ID：`2026-11-17-restore-policy-entry-and-trip-dialog`
- Gate：G1 Align
- 决策：Pass
- 时间：2026-11-17（Asia/Shanghai）
- IO：Kitty Su
- SA：HARLAN HUANG

## 输入材料

- `proposal.md`
- `specs/destination-selection/spec.md`
- `specs/trip-context/spec.md`
- `dov-ac-review.md`
- `design.md`
- `atdd-design.md`
- `tasks.md`
- `alignment-self-check.md`
- `npx --no-install openspec validate 2026-11-17-restore-policy-entry-and-trip-dialog --strict`：通过

## 对齐结论

- 本变更限定为前端交互返工：候选页始终展示，政策只通过「查看政策」入口查看。
- 选定城市改为「创建行程」确认弹窗：城市只读、起止日期必填、携带宠物默认第一只并可切换。
- 日期仅用于推导 1–7 天的 `totalDays`，不落库；行程名沿用「城市 · N天 · 宠物名」。
- 确认后调用既有 `POST /api/trips`，创建并激活行程后跳转 `/attractions`；取消无写入。
- 移除激活行程下的城市详情视图与草稿确认用户路径；不新增后端接口、迁移或依赖。
- P2 的 Delta Spec、Design、AC/DoV Review 与 P3 的 ATDD Design、Task Plan 已完成且通过对齐检查。

## 条件与责任人

- 本变更无阻塞条件。
- 后续若需在 Trips 页展示起止日期，需另起变更增加行程日期字段与迁移（SA 确认）。
- 草稿 store 与面板草稿 UI 变为无入口死代码，后续单独清理（SA 排期）。

> 本记录依据既有团队签署口径补录：IO=Kitty Su、SA=HARLAN HUANG；决策由 SA 于 2026-11-17 确认。
