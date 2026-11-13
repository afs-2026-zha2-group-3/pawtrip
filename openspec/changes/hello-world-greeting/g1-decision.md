# G1 decision — hello-world-greeting

- Gate:G1(Align)
- Change id:`hello-world-greeting`
- Input artifacts:
  - Delta Spec:[specs/greeting/spec.md](specs/greeting/spec.md)
  - Delta Spec:[specs/home-page/spec.md](specs/home-page/spec.md)
  - AC/DoV review:[dov-ac-review.md](dov-ac-review.md)
  - Consistency lint:[consistency-lint.md](consistency-lint.md)
  - Upstream:[proposal.md](proposal.md)、[REQ-001](../../../requirement-workspace/requirements/REQ-001-hello-world-home-page.md)
- Findings:
  - **Scope**:与 proposal 一致,`greeting` 与 `home-page` 两个新增能力完整覆盖 What Changes;无静默扩张或遗漏。
  - **Ambiguity**:OQ-1 路径定为 `apps/server/data/pawtrip.db`;OQ-2 失败态确认非目标;OQ-3 表结构定为 `id` + `message`;OQ-4 测试定为仅后端接口集成测试。无未解决歧义。
  - **Conflict**:无。首轮 5 项 WARNING(P3/P4/S4/T2/D3)与 1 项 SUGGESTION 已修复,lint 复核 Pass(0/0/0)。
  - **Accepted partial**:AC-3 为 Partial——失败/超时场景不进入 Delta,以 Non-Goals 显式排除;签核人接受。
- Decision:**Pass**
- Conditions + owners:无(Pass,无整改条件)
- Residual risks(已知并接受,非阻塞条件):
  - 后端不可用时首页无文本,负责人 Dev,后续 change 处理。
  - 验收须使用全新数据库文件,负责人 Dev。
  - Spring Boot 4.1.2 与 SQLite/Flyway 兼容性由 `tasks.md` 2.3 集成测试兜底,负责人 Dev。
- Approvers:IO=Echo Luo;SA=Echo Luo
- Timestamp:2026-11-13T21:05:00+08:00
- Recorded by:Echo Luo(人工签核)

## Next

- Pass → 进入 `/sdd:p3`(Design & decompose)。
