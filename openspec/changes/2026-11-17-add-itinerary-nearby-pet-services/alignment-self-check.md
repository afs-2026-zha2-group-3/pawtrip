# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-17-add-itinerary-nearby-pet-services`（REQ-015）

- 日期：2026-11-17（P3 补登记，按已实现代码与验证证据复核）
- 输入：`proposal.md`、delta spec（ADDED 1 需求 7 场景；MODIFIED 2 需求 11 场景）、`design.md`（D1–D7）、`dov-ac-review.md`、`atdd-design.md`、`tasks.md`（全勾选）
- `openspec validate "2026-11-17-add-itinerary-nearby-pet-services" --strict`：通过

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | 「行程景点附近宠物服务」→ D1 范围/最近、D2 契约、D3 营业时间、D6 懒加载、D7 文案；「医院/用品店不受宠物友好筛选」→ D4；「不限宠物展示」→ D5 | 每条 requirement 均有对应决策，无规格要求悬空 |
| Spec → ATDD | Pass | 展开/空/无坐标/404/免筛选 → A1–A5；收起不请求/空态 → F1/F2；免筛选与未配置 → F3–F5；`poiId` 前提 → F6；query key → F7 | 无专用 E2E，见已知缺口 |
| Design → Tasks | Pass | D1/D2/D3 → 1.1–1.4；D4 → 2.1–2.2、4.1–4.3；D5 → 4.4；D6 → 3.3–3.4；D7 → 3.3 | 每个决策落到可验证任务 |
| ATDD → Tasks | Pass | A1–A5 → 1.1–1.4、2.1；F1–F2 → 3.3；F3–F5 → 4.1–4.2；F6 → 3.2；F7 → 3.1 | 任务完成状态与测试文件一致 |
| AC-1 traceability（接口与展示） | Pass | Spec 7 场景；Tasks 1.x/3.x；API A1–A4、组件 F1–F2 | 契约、懒加载、回退、空/错误/404 均可追踪 |
| AC-2 traceability（免筛选） | Pass | Spec「医院与用品店不受宠物友好筛选」「不受门禁影响」；Tasks 2.1/4.3；API A5 | 后端与前端双保险 |
| AC-3 traceability（不限宠物展示） | Pass | Spec「医院与用品店不受宠物友好筛选」场景末条；Tasks 4.1/4.2/4.4；纯函数 F3–F5 | 徽章、tag、政策区、地图 chips |
| Non-goal coverage | Pass | 电话/导航/多候选/实时高德/迁移变更均未出现在 delta 与代码；`business_json` 只读 | 零迁移、零新依赖由代码审查与 build 佐证 |
| Task verifiability | Pass | 每项含测试文件或命令；P4 执行记录含 233/207/build/CI 结果 | 5.x 验证已完成 |

## Gaps / residual risks

- 无专用 E2E 断言附近服务折叠栏目；组件 UT + API 测试覆盖，CI 仅回归既有流程。
- 组件测试未覆盖请求失败态；实现以 `throwOnError: false` 与错误文案保证，未自动化。
- “距离并列按 ID 升序”未构造并列夹具。
- Living Spec 的医院/用品店免筛选已随 PR 直接更新；附近服务 ADDED requirement 需 P5 归档合并。
- 本 change 为 PR #75 提交后的补登记，G1 未经人工签署；规格与实现顺序倒置已如实记录。

## Outcome

**Pass（计划层，P4 后复核）**：Spec、Design、ATDD 与 Tasks 一致，已知缺口均已记录且不构成规格矛盾。该结果不代表 Gate 决策；G1/G2/G3 决议另见对应 decision 文件（当前为 Pending）。
