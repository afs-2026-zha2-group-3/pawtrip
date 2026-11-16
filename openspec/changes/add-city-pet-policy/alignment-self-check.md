# 对齐自检 — add-city-pet-policy

- 日期：2026-11-16
- 输入：`specs/city-pet-policy/spec.md`、`design.md`、`tasks.md`、`atdd-design.md`
- 结论：**Pass**（无阻塞缺口）

| 检查 | 结果 | 证据 |
|---|---|---|
| 每条 requirement 有对应 design 决策与 task | Pass | R1→D1/D2/D4、task 1.1–1.3/2.3/3.4；R2→D3、task 2.1–2.3/3.2–3.4；R3→D1 行存在、task 1.1/2.3/3.4；R4→D2 404、task 2.3；R5→D7、task 2.4/3.7 |
| ATDD 场景行都有 task 承接 | Pass | 16 行场景：API 由 task 2.1–2.4 覆盖，E2E 由 task 3.3–3.4/3.7 覆盖 |
| Non-goals 反向用例都有 task | Pass | 接口反向（`POST /api/cities/{adcode}/pet-policy` 405、`GET /api/admin/pet-policies` 404）在 task 2.1；UI 反向在 task 3.3 |
| tasks 与 ATDD 设计不冲突 | Pass | 测试先行顺序、夹具策略、NFR 不纳入与 atdd-design 一致 |
| 文档归属正确 | Pass | living spec 与知识库更新属 P5，已列入 Workflow follow-up |
| id 匹配口径一致 | Pass | spec 的"犬种 id / 目录外不判定"与 design D1/D3、tasks 1.2/2.2、atdd 红测清单一致；G1 补充记录已登记材料性变更 |
| 档案输入口径一致 | Pass | spec"第一只带犬种的宠物"、design D3/D5、tasks 3.2–3.4、atdd E2E 均按宠物档案驱动，无 URL 品种参数 |
| 允许表匹配口径一致 | Pass | spec 三态匹配、design D3、tasks 2.1–2.2、atdd 红测清单一致；可携带表由后台维护且迁移不写种子，在 spec/design/tasks/G1 补充记录中一致声明 |
| 后台维护口径一致 | Pass | spec R5、design D7、tasks 2.4/3.7、atdd 管理员接口与 E2E 行一致；权限沿用 `/api/admin/**` |

## 自检中修正的缺口

初稿 tasks 只把"档案/政策后台"反向验证放在 E2E；ATDD 将其归为接口层（405/404）。已在 task 2.1 补两个接口反向用例，并保留 task 3.3 的 UI 反向验证。合并 main 后，`POST /api/pets` 已成为正式接口，反向用例改为本变更的只读路径。2026-11-16 匹配契约由名称改为犬种 id 后，已同步 spec、design、atdd、tasks 与 G1 补充记录，删除"其他"/名称不完全一致场景。随后又把输入来源从 URL 演示参数改为当前用户宠物档案，并同步全部规划文档。
