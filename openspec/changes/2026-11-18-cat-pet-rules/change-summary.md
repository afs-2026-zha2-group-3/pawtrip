# Change summary — 2026-11-18-cat-pet-rules

- Change id：`2026-11-18-cat-pet-rules`（US-55）
- 状态：实现已提交 `7c6d0a6`；SDD 为回溯补录并按 2026-11-18 评审修订；友好猫文案与 `null` 语义已确认，判定与主要测试完成；SDD 工件未提交、未推送、未建 PR、未归档
- 实现顺序：功能先行，SDD 为事后补录，不声称 TDD

## Intent

US-55 要求地点宠物校验正确覆盖猫：肩高是犬类口径，不应把合格的猫判为不友好；城市级判定也不应让猫一律「无法判定」——城市没有禁养猫的规定，按允许类型判定即可，禁养犬种名单只适用于犬。

## What shipped

- 地点匹配：单只最大肩高仅对 DOG 生效；猫继续按允许类型、限养数、体重、牵引与疫苗判定。医院/用品店豁免保持既有语义。
- 城市候选：猫通过类型检查后返回友好；类型不允许时为不友好，不再无法判定。
- 城市政策：猫按城市 `allowedPetTypes` 判定——允许即友好，`matchCityPolicy` 返回「城市禁养犬种名单不适用于猫」原因并保留在 tag `title`；按 2026-11-18 决定，侧栏与政策页沿用现有文案，不要求额外可见说明。不允许即不友好。
- 城市筛选：服务端「宠物友好」的肩高过滤仅对 DOG 生效。
- 接口：`GET /api/cities/{adcode}/pet-policy` 新增 `allowedPetTypes`（收录与未收录城市均返回），前端类型同步。
- 测试：更新 E4/E15 与政策页猫用例；单测新增猫的肩高、体重、类型与城市允许类型断言；服务端补猫肩高筛选与响应字段断言。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0 |
| 前端单测 | Pass | `policy-match.test.ts` 23/23（含猫 `null` 与牵引断言） |
| 服务端测试 | Pass | `DestinationApiTest` 12/12、`CityPetPolicyApiTest` 11/11（均本轮运行；未收录城市含 `allowedPetTypes` 断言） |
| E2E | Pass | `destination-selection.spec.ts` + `city-pet-policy.spec.ts` 34/34（约 2.4m，2026-11-18 本轮重跑；此前 37/37 为静态计数） |
| 规格校验 | Pass | `openspec validate 2026-11-18-cat-pet-rules --strict` exit 0 |

## P1–P5 状态

- P1 proposal：完成。
- P2 specs / design / DoV / alignment：完成；G1 未签；友好猫文案与 `null` 语义已确认。
- P3 ATDD / tasks：完成；ATDD 为回溯记录，不作为 TDD 证据。
- P4 实现与本地验证：判定逻辑完成，单测 23/23、`CityPetPolicyApiTest` 11/11 与 E2E 34/34 本轮通过。
- P5：SDD 未提交、未推送、未建 PR、未跑 CI；G1–G3 未签、未归档。

## Scope boundaries

- AC-4 按需求方口径实现为「城市允许类型判定」，未引入猫品种目录或猫禁养名单；友好猫文案按 2026-11-18 决定由 Spec 接受现有展示，AC-4 Pass。
- 不改变犬只的犬种、肩高与政策文案。
- 城市筛选 UI 未新增专用 E2E；由服务端集成测试覆盖猫口径。
- 未运行 CI；G1–G3 未签署。

## Confirmed decisions（2026-11-18）

1. **友好猫可见说明**：采用「调整 Spec 接受现文案」，不改 UI。Spec 只要求显示友好结论，侧栏「未命中禁养名单」与政策页 tag 即为可接受呈现；`matchCityPolicy` 的原因保留在 tag `title`。
2. **`allowedPetTypes=null` 语义**：维持「不允许」，不改变实现。

## Remaining archive items

1. **归档时主规格 Purpose**：需把 `city-pet-policy` Purpose 从犬类口径更新为覆盖猫与 `allowedPetTypes`，否则归档后主规格与 delta 不一致（tasks 7.7）。
2. **侧栏 tag 口径**：主规格写「以宠物名 tag 展示结论」，侧栏实际用文本 banner；归档时需明确该要求是否覆盖侧栏（tasks 7.6）。
