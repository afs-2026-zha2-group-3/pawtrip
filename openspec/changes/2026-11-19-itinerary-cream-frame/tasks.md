# Tasks

## 1. 恢复 main 版本

- [x] 1.1 `itinerary.tsx`、`day-route-dialog.tsx`、`day-route-map.tsx` 恢复 main 版本
- [x] 1.2 删除 `day-route-panel.tsx` 与 `2026-11-19-inline-day-route-panel` 变更包
- [x] 1.3 撤销 `PageFrame` 的 `mainClassName` 使用，页面恢复正常滚动与默认宽度

## 2. 保留页框描边

- [x] 2.1 行程单页框保持 `border-2 border-paw-accent-soft`（`#FFEFD6`）
- [x] 2.2 行程单页框移除 `shadow-pet-card`，页面无阴影
- [x] 2.3 页面其余布局与卡片阴影保持 main 版本

## 3. 测试与验证

- [x] 3.1 恢复 main 的 `itinerary.spec.ts` 与 `day-route-planning.spec.ts`
- [x] 3.2 `itinerary.spec.ts` 增加页框描边 `rgb(255, 239, 214)` 与 `box-shadow: none` 断言
- [x] 3.3 `tsc --noEmit`、`npm run build -w apps/web`、目标 E2E
- [x] 3.4 `openspec change validate 2026-11-19-itinerary-cream-frame --strict`

- 验证：`tsc --noEmit`、`npm run build -w apps/web` 通过；vitest 375 passed；`itinerary`/`day-route-planning`/`attraction-pet-rules`/`attractions-timeline-hints` 共 33 passed；`validate --strict` valid。
- 未提交、未推送。
