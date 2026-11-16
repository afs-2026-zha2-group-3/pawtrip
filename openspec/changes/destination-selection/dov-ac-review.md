# AC / DoV Review — destination-selection

- 日期：2026-11-16（G1 Revision 后复审：宠物档案改外部依赖，paws-page delta 已移除）
- 评审对象：`specs/destination-selection/spec.md`、`specs/web-app-shell/spec.md`
- 校验：`openspec validate destination-selection --strict` → valid（Revision 后重跑）
- 上游：`proposal.md`、REQ-006（原编号 REQ-005，2026-11-16 合并 main 后改编号；正文历史提及保留原编号）（`requirement-workspace/requirements/REQ-006-destination-selection.md`）

## Acceptance criteria

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每条需求至少一个可测 AC | Pass | 2 个 delta 共 13 条 requirement，均含 ≥1 scenario（destination-selection 7 条 / web-app-shell 6 条） | strict 校验通过 |
| AC-2 AC 可观察 | Pass | 各 scenario 均为 WHEN/THEN 可观察结果（列表内容、Badge、地址、响应码、顶栏文案） | 无「工作良好」类模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 401 未认证、搜索空态、品种「其他」/空/无档案、政策未收录、登出清除、重选覆盖、命中不阻断 | 高风险分支均出自 deep-dive ②；档案表单校验划归外部 change |
| AC-4 非实现细节伪装 | Pass | 「预置种子数据」为数据契约表述；「浏览器端持久化」为需求方确认的行为决策，未指定存储技术 | 品种词表一致性为对外部档案能力的数据契约约束，非实现 |

## Definition of verified

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 scope 与 proposal 一致 | Pass | proposal What Changes ↔ delta 逐条对应；G1 Revision 同步移除档案实现项，无静默扩围 | 政策详情/档案实现/服务端持久化均显式 Non-Goals/MUST NOT |
| DoV-2 歧义列出或解决 | Pass | 6 项决策已 Confirmed（REQ-005 OQ 表 + G1 Revision）；剩余歧义仅种子数据值（deferred，非契约） | 外部档案契约缺口已作为依赖风险显式记录（见下） |
| DoV-3 角色残余风险已记录 | Pass | 见下「IO/SA 残余关注」 | |
| DoV-4 未声称业务实现完成 | Pass | 本 change 仅有规划 artifact，无业务代码 | |
| DoV-5 需求可追溯 | Pass | 见下追溯矩阵 | 档案输入来自外部能力，已在 Purpose 与匹配需求中声明 |

## 追溯矩阵（issue AC → delta requirement）

| issue #15 AC | delta requirement | 文件 |
|---|---|---|
| AC-1 搜索并选定 | 目的地候选列表 / 城市搜索 / 选定目的地与规划上下文 | destination-selection |
| AC-2 宠物友好筛选 | 宠物友好筛选 / 城市政策收录状态与禁养名单数据 | destination-selection |
| AC-3 选定生效 | 选定目的地与规划上下文 / 顶栏目的地上下文展示 / 受保护路由与登录跳转（登出清除） | destination-selection / web-app-shell |
| AC-4 禁养提醒 | 禁养犬种匹配 / 选定时禁养高亮提醒（档案品种输入由外部档案能力提供） | destination-selection |
| （外部依赖）宠物档案 | 不在本 change delta 内；由 US-01 change 交付（breed/接口/`/paws` 页面） | 外部 change（现远端 `feature/add-pet-schema`） |
| （事实补齐）Cities/管理 Tab | 顶部居中横向导航 / Tab 与路由同步 / 管理员管理导航 Tab / 管理员页面路由守卫 | web-app-shell |

## IO / SA 残余关注

- **IO（数据准确性/合规）**：珠海/杭州禁养名单与收录状态必须从政府公开文件摘录并标注来源与更新时间；品种词表需覆盖官方名单用词，否则精确匹配漏判（deep-dive ① 词表约束）。
- **SA（架构/依赖）**：选定状态为浏览器级，换设备不跟随（需求方已接受）；登出清除已入 spec。**外部依赖风险：档案 change 现仅 pet 表 schema（无 breed、无接口、无 `/paws` 页面），AC-2 完整口径与 AC-4 的实现/E2E 受其交付进度阻塞；需与对方协调 breed 词表一致、读取接口契约与合并顺序（含 Flyway 版本号）**。禁养判定与 #14 的扩展边界已在 deep-dive ③ 锚定。
- **QA**：E2E 需覆盖「命中禁养仍可选定」「无档案退化筛选」「登出清除」三条关键链路（P3 ATDD 设计承接）；档案相关用例以外部契约就绪为前提。

## 结论

无阻塞 Fail/Partial；Delta Spec 可提交 G1 人工决策。**G1 需知悉：AC-2/AC-4 的完整验收依赖外部档案 change 交付（需求方已确认等待策略）。** 本评审不构成 G1 Pass。