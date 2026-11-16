# AC / DoV Review — add-location-pet-rule-display（Revision 3）

- 日期：2026-11-16
- 审查对象：`openspec/changes/add-location-pet-rule-display/specs/attraction-pet-rules/spec.md`、`specs/web-app-shell/spec.md`
- 上游：`proposal.md`、`requirement-workspace/requirements/REQ-009-location-pet-rule-display.md`（Revision 3）、`analysis/REQ-009/`
- 评审状态：Delta Spec 可进入 **G1 Revision 3** 人工评审；本文件不是 G1 决议，不代替 IO/SA 签字
- 修订说明：Revision 2 移除 `entry_policy`/`entry_note` 与新增迁移；Revision 3 新增顶层“景区浏览”Tab，`/cities` 选定城市后自动进入，城市浏览页不内嵌景点列表或入口按钮；旧 G1 Pass 不再覆盖当前范围

## AC 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 requirement 至少一个可测 AC | Pass | `attraction-pet-rules/spec.md` 6 个 requirement 均含至少一个 `#### Scenario`；`web-app-shell/spec.md` 含 3 个 scenario | 覆盖列表、三态、详情、字段语义、API、入口、导航选中 |
| AC-2 AC 可观察 | Pass | 默认门槛、三态 badge、字段文案、`401/404/400`、空态均为可观察结果 | 无“正确/良好”等模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 未选目的地、无景点、无友好景点、非景点排除、空字段隐藏、未认证、地点不存在、城市参数非法 | 与 REQ-009 S1–S12、deep-dive 边界表一致 |
| AC-4 不把实现细节伪装成 AC | Pass | 约束使用外部契约（页面、API、字段语义）；未出现类名/函数名/框架选择 | “不新增列/迁移”是数据边界约束，不是内部实现 |

## DoV 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | `proposal.md` 明确无迁移/无三档；New `attraction-pet-rules` + Modified `web-app-shell`；delta 两个文件一一对应 | 未静默扩范围；Revision 2 是已确认的范围收缩 |
| DoV-2 歧义已列出或解决 | Pass | 6 个 blocking OQ 均 resolved；deep-dive 记录 2 个 deferred 实现细节 | 数据补齐前列表为空是已知风险，不是规格歧义 |
| DoV-3 IO/SA 残余风险已记录 | Pass | 见下方“残余风险”；G1 Revision 2 由 IO/SA 决定 | 归档顺序、E2E 种子、数据维护 |
| DoV-4 未声称业务实现已完成 | Pass | 本 change 仅 proposal + delta spec + P3 设计；无代码改动 | P4 才进入实现 |
| DoV-5 requirement 可追溯到 proposal/REQ | Pass | 见下方 traceability 表 | 每项均可映射到 REQ-009 场景或 proposal 条目 |

## 追溯表

| Delta requirement | 来源（REQ-009 / proposal） |
|---|---|
| 已选城市下的景点列表 | REQ-009 S1、S7、S8、S10、S11；proposal“新增 /attractions 景点列表” |
| 宠物友好口径与切换 | REQ-009 S2、S3、S4；proposal“默认 maxPets>=1，可切换全部” |
| 景点详情与携宠政策展示 | REQ-009 S5、S6；proposal“新增详情页” |
| 政策字段的展示语义 | REQ-009 acceptance hints / constraints；deep-dive 1.2、第 4 节 |
| 景点与地点只读查询 API | REQ-009 S9、S11；proposal“新增登录用户可读的地点查询 API” |
| 景点页入口与自动跳转 | REQ-009 S1、S1a、S12；proposal“选择城市后自动进入景区 Tab” |
| 景区浏览导航 Tab（web-app-shell） | REQ-009 Affected capabilities；proposal“新增景区浏览 Tab” |

## 残余风险 / G1 Revision 2 关注点

| 级别 | 关注点 | 说明 |
|---|---|---|
| 风险 | 默认门槛依赖 `maxPetsPerPerson` 已维护 | 未录入/`NULL` 的地点不会进入默认列表；数据补齐前可能为空；由现有管理弹窗维护 |
| 风险 | 现有管理弹窗只编辑 6 项 | `allowed_pet_types` 与肩高不在弹窗中；公开详情有值才展示，不要求本 change 补录 |
| 风险 | 归档顺序 | `web-app-shell` 新增“景区浏览”Tab；`destination-selection` delta 引入“城市浏览”Tab。本 change MUST 在 destination-selection 归档之后再归档 |
| 风险 | 导航 Tab 数量增加 | 顶部普通 Tab 从三个变为四个；destination-selection 的既有 E2E 已按自动跳转更新，全量 E2E 通过 |
| 风险 | E2E 种子 | 需要新增 `seed-e2e-attractions.mjs` 写入测试地点；只操作临时库，不触碰开发库 |
| 已决 | AC-2 行程内展示 | Out of Scope，依赖 US-48；Delta Spec 未包含行程内 requirement |
| 已决 | 非景点类型 | Out of Scope；列表只含 `type_group='attraction'` |
| 已决 | 三档/迁移 | Revision 2 移除 `entry_policy`/`entry_note`；本 Delta 不包含新增列或迁移 |

## 结论

- AC-1…AC-4：Pass。
- DoV-1…DoV-5：Pass。
- 无阻塞性 DoV 缺口；Delta Spec 可提交 **G1 Revision 3** 人工评审。
- G1 决议由 IO/SA 重新签署；旧 G1 Pass 仅覆盖 Revision 2，本文件不写入 Pass/Fail。
