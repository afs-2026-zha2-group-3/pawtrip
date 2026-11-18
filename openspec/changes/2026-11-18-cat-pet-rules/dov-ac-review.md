# AC / DoV Review

变更：`2026-11-18-cat-pet-rules`

范围：核对 US-55 验收项、Delta Spec、Design、Tasks 与已执行的验证证据；不作 Gate 决策，不代签。

## Acceptance Criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 猫可判定 | Pass | `policy-match` 单测：地点对猫给出友好/不友好；`city-pet-policy` 用例「treats a cat without a dog breed as allowed」显示 `咪咪 · 友好` | 地点与城市两级均不再一律无法判定 |
| AC-2 猫口径适用 | Pass | 单测「ignores the shoulder height cap for cats」「still applies type, weight and requirement limits to cats」；`DestinationApiTest` 猫 45cm 不被 40cm 上限排除 | 肩高仅 DOG；类型、体重、疫苗仍生效 |
| AC-3 豁免类型 | Pass | 既有 `matchLocationPolicyForType` 单测：未配置医院/用品店友好，已配置用品店仍不友好 | 保持既有行为，未扩大豁免 |
| AC-4 城市级猫判定 | Pass | `matchCityCandidate`/`matchCityPolicy` 单测（含 `DOG` 与 `null` 不友好）；E4 `豆豆 · 友好`；E15 侧栏「您的宠物豆豆不在珠海市禁养名单中」；`CityPetPolicyApiTest` 已收录与未收录城市均返回 `allowedPetTypes` | Spec 已按 2026-11-18 决定接受现有文案；判定原因为「禁养犬种名单不适用于猫」，保留在 tag `title`，不要求额外可见说明 |
| 城市筛选页猫口径（需求方补充） | Pass | `DestinationApiTest`：45cm 的猫不被 40cm 上限城市排除；类型/品种/限养数用例回归 | 肩高仅 DOG 参与服务端筛选 |

## Definition of Verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围匹配 Proposal | Pass | `proposal.md`、三份 delta | 地点、城市、筛选与接口字段均在范围内；未引入猫品种 |
| DoV-2 歧义已解决 | Pass | `design.md` D1–D5 | 数据源、肩高、豁免、`null=不允许`、友好猫现有文案均已确认 |
| DoV-3 残余风险已记录 | Pass | `design.md` Risks | 类型清空、前后端不同步、未带 petType 的肩高请求 |
| DoV-4 类型检查 | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0（2026-11-18） | 本分支 |
| DoV-5 前端单测 | Pass | `policy-match.test.ts` 23/23（本轮补跑） | 新增猫 `allowedPetTypes=null` 与猫牵引断言 |
| DoV-6 服务端测试 | Pass | `DestinationApiTest` 12/12、`CityPetPolicyApiTest` 11/11（均本轮运行） | 未收录城市新增 `allowedPetTypes` 断言 |
| DoV-7 受影响 E2E | Pass | `destination-selection.spec.ts` + `city-pet-policy.spec.ts` 34/34（约 2.4m，2026-11-18 本轮重跑） | 临时库；开发库未被修改。此前 37/37 为静态计数，两条 spec 实际共 34 条用例 |
| DoV-8 规格校验 | Pass | `npx --no-install openspec validate 2026-11-18-cat-pet-rules --strict`：valid | 本变更 |
| DoV-9 CI | 未运行 | 分支 `feat/us-55-cat-pet-rules` 已提交 `7c6d0a6`，未推送 | 不记为 Pass |
| DoV-10 SDD 顺序 | 回溯 | 实现早于 proposal/design/specs/tasks | 本记录不声称 TDD；按 spec-first 规则属欠账补录 |

## Residual concerns

- 友好猫文案已决（2026-11-18）：Spec 接受侧栏「未命中禁养名单」与政策页 tag，不要求额外说明；判定原因仍保留在 tag `title`。
- 城市 `allowed_pet_types` 为 null 时按「不允许」处理（已确认）；后台清空类型会使城市对猫显示不友好。
- 旧后端不返回 `allowedPetTypes` 时前端会把猫判不友好；需前后端同批发布。
- 服务端不再对未携带 `petType` 的请求应用肩高过滤；应用内前端总是成对传参。
- 猫没有品种目录，未来若引入猫品种限制需另开变更。
- 城市筛选入口只使用第一只宠物档案，猫口径未通过 UI 筛选用例覆盖，由服务端集成测试覆盖。
- G1–G3 未签署；本文件不代签。

## Review outcome

文档层 AC/DoV 检查为 **Pass（实现范围，带历史/未跑项）**：判定逻辑与数据字段有单测、服务端集成测试或 E2E 证据；AC-4 在 2026-11-18 确认的文案口径下通过，`null=不允许` 已确认。E2E 34/34 本轮通过，CI 未运行。SDD 工件为回溯补录。该结果不代表 Gate 已批准。
