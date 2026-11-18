# G2 decision — 2026-11-17-export-itinerary-pdf

- Gate: G2 (Verify)
- Change id: `2026-11-17-export-itinerary-pdf`
- 性质：**补记**。实际放行决定发生于 2026-11-17（tantine 签署 Waiver 后用户指示提交 PR）；经用户 2026-11-17 交互批准补写本记录。
- Inputs:
  - local-verify: `docs/ai4se-plugins/20261117-223134-local-verify-report.md`（Overall=Fail：唯一 CRITICAL 为 6.8 真实 Chrome 打印预览人工记录未执行；完整 Waiver 已嵌入，签署人 tantine，期限 2026-11-24）
  - pipeline ci: `docs/ai4se-plugins/20261117-230517-pipeline-report.md` 与 `ci-report.md`（E1 ✅全绿；PR #93 @ `8dbdd40`）
  - pipeline cd: n/a（未宣称部署）
- Dimension results:
  - Build: Pass（web build exit 0）
  - Scan: Skipped（仓库无独立静态扫描命令）
  - Review: Pass（导出视图/打印样式/规则卡实现与 design 一致；itinerary 规则文案回归已修复）
  - Evidence: Partial→条件放行（自动化证据全绿：itinerary E2E、打印媒体结构验证、图片导出 PNG 断言；6.8 人工证据 Pending，Waiver 覆盖）
  - CI: Pass（E1 全绿）
  - CD: n/a
- Defect grades:
  - CRITICAL: 6.8 真实 Chrome 打印预览人工记录未执行（页眉页脚抑制依赖 Chrome 131+ `@page` 页边距盒，自动化仅验证 print 媒体结构）→ Waiver 放行
  - WARNING: 无遗留
  - SUGGESTION: 天气/应急/食宿板块无数据源不伪造（既定边界）
- Decision: Conditional Pass
- Waivers / conditions + owners:
  | 项 | 负责人 | 补救期限 | 签署 |
  |---|---|---|---|
  | 6.8 真实 Chrome 打印预览人工记录（版本、页眉页脚开关、A4 排版） | tantine | 2026-11-24 | tantine（2026-11-17 交互签署，见 local-verify 报告 Waiver 表） |
- Approvers: VL=tantine
- Timestamp: 2026-11-17T23:20:00+0800（补记转写时间）

## Traceability appendix

| Requirement | Spec | Code | Test |
|-------------|------|------|------|
| 导出 PDF（打印态全量内容） | `specs/trip-itinerary/spec.md` | `itinerary.tsx` 导出按钮/打印态、`index.css` `@page`/print 样式 | `itinerary.spec.ts`（emulateMedia print 结构断言）；6.8 人工记录 Pending |
| 导出图片（PNG 长图） | `specs/trip-itinerary/spec.md` | 离屏导出视图 + `html-to-image@1.11.13`、`imageFileName` | `itinerary.spec.ts`（PNG 签名/1080px/失败恢复）、vitest |
| 大交通携宠规则卡 | `specs/trip-itinerary/spec.md` | `getRuleForMode` 规则卡（hidden print:flex） | `itinerary.spec.ts`（高铁/飞机/自驾/无方式分支） |

> 本记录依据具名 VL 的明确决定转写；决策由 tantine 作出（Waiver 签署 + 用户交互批准补记），代理不代为决策。