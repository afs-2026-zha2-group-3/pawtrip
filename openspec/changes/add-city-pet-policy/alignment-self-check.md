# 对齐自检 — add-city-pet-policy

- 日期：2026-11-16
- 输入：`specs/city-pet-policy/spec.md`、`design.md`、`tasks.md`、`atdd-design.md`
- 结论：**Pass**（无阻塞缺口）

| 检查 | 结果 | 证据 |
|---|---|---|
| 每条 requirement 有对应 design 决策与 task | Pass | R1→D1/D2/D4、task 1.1–1.3/2.3/3.4；R2→D3、task 2.1–2.3/3.2–3.4；R3→D1 行存在、task 1.1/2.3/3.4；R4→D2 404、task 2.3 |
| ATDD 场景行都有 task 承接 | Pass | 12 行场景：API 由 task 2.1–2.3 覆盖，E2E 由 task 3.3–3.4 覆盖 |
| Non-goals 反向用例都有 task | Pass | 接口反向（`POST /api/cities/{adcode}/pet-policy` 405、`GET /api/admin/pet-policies` 404）在 task 2.1；UI 反向在 task 3.3 |
| tasks 与 ATDD 设计不冲突 | Pass | 测试先行顺序、夹具策略、NFR 不纳入与 atdd-design 一致 |
| 文档归属正确 | Pass | living spec 与知识库更新属 P5，已列入 Workflow follow-up |

## 自检中修正的缺口

初稿 tasks 只把"档案/政策后台"反向验证放在 E2E；ATDD 将其归为接口层（405/404）。已在 task 2.1 补两个接口反向用例，并保留 task 3.3 的 UI 反向验证。合并 main 后，`POST /api/pets` 已成为正式接口，反向用例改为本变更的只读路径。
