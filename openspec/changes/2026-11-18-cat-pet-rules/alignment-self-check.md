# Spec / Design / ATDD / Tasks Alignment Self-Check

变更：`2026-11-18-cat-pet-rules`

## 检查结果

| Check | Result | Evidence | Notes |
|---|---|---|---|
| Spec → Design | Pass | 三份 delta、`design.md` | D1 允许类型数据源、D2 肩高仅 DOG、D3 猫判定口径、D4 豁免、D5 UI 不变 |
| Spec → ATDD | Pass | `atdd-design.md` | Scenario 均已对照；友好猫文案按 2026-11-18 决定改为接受现有展示 |
| Design → Tasks | Pass | `design.md`、`tasks.md` | 判定、接口、筛选、测试、规格与验证均有任务 |
| ATDD → Tasks | Pass | `atdd-design.md`、`tasks.md` 1–6 | 测试与验证对应各组 |
| AC-1 猫可判定 traceability | Pass | Spec 地点/城市要求；Tasks 1.1、2.1–2.2；单测 + E2E | 地点与城市两级均有结论 |
| AC-2 猫口径 traceability | Pass | Spec 肩高仅 DOG；Tasks 1.1、1.3、3.1；单测 + `DestinationApiTest` | 肩高跳过，其余维度保留 |
| AC-3 豁免 traceability | Pass | Spec 医院/用品店；Tasks 1.2；既有单测 | 未配置友好、已配置仍判定 |
| AC-4 城市猫判定 traceability | Pass | Spec 猫按允许类型；Tasks 2.1–2.3；单测 + E2E + API | 判定与数据正确；友好猫文案按 2026-11-18 决定由 Spec 接受现有展示 |

## Scenario 级映射

| Requirement | Scenario | 证据 |
|---|---|---|
| 宠物友好叠加匹配（类型与品种） | 猫不参与肩高筛选 | `DestinationApiTest` catTall 断言 |
| 宠物友好叠加匹配（类型与品种） | 类型未配置视为不允许 | `DestinationApiTest.petFriendlyFilterMatchesPetTypeWhenProvided`：类型为 null 的城市被排除 |
| 宠物友好叠加匹配（类型与品种） | 类型/品种/限养数/无档案场景 | 既有服务端用例回归 |
| 候选卡片匹配标签 | 猫按城市允许类型显示友好 | 单测；E4 `豆豆 · 友好` |
| 候选卡片匹配标签 | 城市不允许携带猫 | 单测 `allowedPetTypes='DOG'` 与 `null` |
| 候选卡片匹配标签 | 城市类型不允许 | 单测「is unfriendly when the pet type is not allowed」 |
| 候选卡片匹配标签 | 城市允许品种为空视为未配置 | 单测「treats an empty allowed breed list as unconfigured and passes」 |
| 候选卡片匹配标签 | 多宠物逐只 / 无宠物 / 接口失败 | E4、E21、E13、E14 |
| 景点详情政策匹配 | 猫不参与肩高判定 | 单测「ignores the shoulder height cap for cats」 |
| 景点详情政策匹配 | 猫命中体重限制 | 单测「still applies type, weight and requirement limits to cats」 |
| 景点详情政策匹配 | 宠物医院未配置政策视为友好 | 既有 `matchLocationPolicyForType` 单测 |
| 景点详情政策匹配 | 已配置政策的宠物用品店仍判定 | 既有 `maxPetsPerPerson=0` 单测 |
| 景点详情政策匹配 | 激活宠物命中 / 全部满足 / 维度跳过 / 逐只判定 | 既有单测与地点 E2E 回归 |
| 查询目的地的养犬政策 | 返回城市允许宠物类型 | `CityPetPolicyApiTest` |
| 查询目的地的养犬政策 | 已收录 / 犬种示例 / 未配置 / 来源 | 既有政策页 E2E 回归 |
| 禁养犬种匹配与高亮提醒 | 猫按城市允许类型显示友好 | 单测与 `咪咪 · 友好` tag 通过；E15 侧栏「未命中禁养名单」文案按 2026-11-18 决定为可接受呈现 |
| 禁养犬种匹配与高亮提醒 | 城市不允许携带猫 | 单测 `allowedPetTypes='DOG'` 与 `null` |
| 禁养犬种匹配与高亮提醒 | 禁养犬种关联为空 | `CityPetPolicyApiTest.returnsNoMatchWhenBannedListIsEmpty`（禁养与可携带均为空 → 无结论）；允许名单命中由单测「is friendly when the breed is allowed」覆盖 |
| 禁养犬种匹配与高亮提醒 | 存在激活行程时只判定激活宠物 | `policy-subjects.test.ts`「uses only the active pet when a trip is active」 |
| 禁养犬种匹配与高亮提醒 | 犬只命中 / 未命中 / 不在名单 / 无犬种 / 无档案 | 既有 `city-pet-policy` E2E 与单测 |

## Gaps / residual risks

- 友好猫文案已决（2026-11-18）：Spec 接受侧栏「未命中禁养名单」与政策页 tag，不要求额外说明；判定原因保留在 tag `title`。
- `allowedPetTypes=null` 已确认维持「不允许」。
- 城市筛选 UI 未新增专用用例：筛选只取第一只宠物，猫口径由服务端集成测试覆盖。
- 未运行 CI；分支已提交未推送。
- 主规格 `destination-selection`、`city-pet-policy`、`trip-attractions` 将在归档时同步；归档时必须更新 `city-pet-policy` Purpose 为含猫与 `allowedPetTypes` 的口径，当前只存在 delta。
- 主规格「以宠物名 tag 展示结论」与侧栏文本 banner 的既有口径不一致，归档时一并明确。
- G1–G3 未签署；本文件不代签。

## Outcome

**Pass（实现与自动化证据）**：判定逻辑、接口字段与 Scenario 映射一致；单测 23/23、服务端 12/12 + 11/11 与 E2E 34/34 均为本轮运行（此前 37/37 为静态计数）。友好猫文案与 `null=不允许` 已由产品确认；SDD 为回溯补录，CI 未运行。
