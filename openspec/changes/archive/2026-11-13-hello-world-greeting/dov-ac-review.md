# Delta Spec AC / DoV 评审 — hello-world-greeting

- 日期:2026-11-13(+08:00)
- 步骤:`/sdd:delta-craft step=review`(修复后复评)
- Delta Spec:
  - [specs/greeting/spec.md](specs/greeting/spec.md)
  - [specs/home-page/spec.md](specs/home-page/spec.md)
- 上游依据:[proposal.md](proposal.md)、[REQ-001](../../../requirement-workspace/requirements/REQ-001-hello-world-home-page.md)、[impact-brief.md](../../../requirement-workspace/impact-brief.md)、[deep-dive.md](../../../requirement-workspace/deep-dive.md)
- 结构校验:`openspec validate hello-world-greeting --strict` → valid

## Acceptance criteria(AC)

| 项 | 结果 | 证据 | 说明 |
|---|---|---|---|
| AC-1 每个 Requirement 至少一条可测 AC | Pass | `specs/greeting/spec.md:3-24`、`specs/home-page/spec.md:3-18` | 3 条 Requirement 均有对应 Scenario;状态码、响应头、响应体、页面文本均可测 |
| AC-2 AC 可观察 | Pass | `specs/greeting/spec.md:9-12,20-24`、`specs/home-page/spec.md:9-12,16-18` | 以 HTTP 响应与页面可见文本为观察点,无内部实现断言 |
| AC-3 高风险负向/边界场景已声明 | Partial | `proposal.md` Non-Goals、`design.md:49` | 失败态显式排除并已由签核人接受;Delta 不提供失败场景,属有意范围决策,不阻塞 G1 |
| AC-4 AC 不含模糊词或伪装的实现细节 | Pass | `specs/greeting/spec.md:5`、`specs/home-page/spec.md:5` | 未出现“正确处理/快速”等模糊词;Flyway 为 proposal 已确认约束,可追溯 |

## Definition of verified(DoV)

| 项 | 结果 | 证据 | 说明 |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | `proposal.md` What Changes / Capabilities vs 两个 Delta Spec | `greeting` 与 `home-page` 均被覆盖,无静默扩张或遗漏;上游能力命名已对齐 |
| DoV-2 歧义已列出或解决 | Pass | `design.md:28-29,49,60-66`、本文件“未决项结论” | OQ-1/OQ-3/OQ-4 已确认,OQ-2 确认非目标 |
| DoV-3 IO / SA 残余风险已记录 | Pass | `design.md` Risks、`requirement-workspace/deep-dive.md` | 兼容性、SSR、代理、种子幂等与失败态均列明 |
| DoV-4 未声称业务实现已完成 | Pass | 本 change 仍为 spec 阶段 | 仅存在 proposal/spec/design/tasks,无实现代码提交 |
| DoV-5 Requirement 可追溯到 proposal / 已批准需求 | Pass | `proposal.md` What Changes、REQ-001 S1–S3 | 建库种子、接口、首页展示逐项对应 |

## 未决项结论

| 项 | 结论 | 落点 |
|---|---|---|
| OQ-1 数据库文件路径与 `.gitignore` | `apps/server/data/pawtrip.db`;忽略 `apps/server/data/` | `design.md:28`、`tasks.md` 1.2 |
| OQ-2 失败 / 超时前台行为 | 保持非目标,仅验收正常路径 | `proposal.md` Non-Goals、`design.md:49` |
| OQ-3 `greeting` 表字段 | `id INTEGER PRIMARY KEY` + `message TEXT NOT NULL` | `design.md:29` |
| OQ-4 测试层级 | 仅后端接口集成测试,前端不加组件测试 | `design.md` 决策 7、`tasks.md` 2.3 |

## 结论

- 阻塞性 Fail:**0**
- Partial:**AC-3**(失败态为已接受的非目标,不构成歧义)
- G1-ready:是,可提交人工 G1 决策

## 残余风险

1. **失败态无 UI**:后端不可用时首页无文本,已在 Non-Goals 中显式排除并由签核人接受。
2. **种子幂等**:验收须使用全新数据库文件;已有旧文件需清理。
3. **兼容性 R1**:由新增后端接口集成测试兜底,但测试在实现阶段才落地。

## 修订记录

- 2026-11-13:补齐 4 个 Scenario 的 GIVEN 前置条件;确认 OQ-1/OQ-2/OQ-3/OQ-4;design 增加决策 7(测试策略)与决策 6 的备选方案;tasks 调整验证收尾顺序并新增 2.3;对齐 REQ-001 能力命名。

## 说明

本文件仅为 AC/DoV 评审记录,不构成 Gate 决策。
