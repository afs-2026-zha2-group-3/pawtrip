# AC / DoV Review — add-itinerary-nearby-pet-services

- 日期：2026-11-17（P2 补登记）
- 审查对象：`specs/trip-attractions/spec.md`（ADDED 1 需求 7 场景；MODIFIED 2 需求 11 场景）
- 上游：`proposal.md`、`design.md`、`tasks.md`、`requirement-workspace/requirements/REQ-015-itinerary-nearby-pet-services.md`
- 评审状态：Delta Spec 可进入 **G1** 人工评审；本文件不是 G1 决议，不代替 IO/SA 签字

## AC 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 requirement 至少一个可测 AC | Pass | ADDED「行程景点附近宠物服务」7 场景；MODIFIED 两项沿用既有场景并补充豁免语义 | 覆盖接口契约、懒加载、营业时间回退、无坐标、空/错误态、404、免筛选与文案 |
| AC-2 AC 可观察 | Pass | 响应字段值、请求是否发生、“暂无附近宠物服务”、距离一位小数、地址/营业时间文案 | 无“美观/良好”类模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 收起不请求、无坐标、无同城服务、请求失败、未知 POI、未配置政策 | 边界均有明确期望 |
| AC-4 不把实现细节伪装成 AC | Pass | delta 仅描述外部契约与用户可见行为；距离算法作为契约约束（Haversine、取整、并列顺序）而非类/函数名 | DB-only、不实时调用高德属数据边界 |

## DoV 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 的 ADDED/MODIFIED ↔ delta 文件；零迁移、零新依赖、管理端不变 | 与 REQ-015 In/Out 一致 |
| DoV-2 歧义已列出或解决 | Pass | 用户已确认同城最近、各 1 家、营业时间回退、免筛选与文案；design 无 Open Questions | 多候选/电话/导航明确为 Non-goal |
| DoV-3 IO/SA 残余风险已记录 | Pass | 见下方残余风险 | 无专用 E2E、快照时效、同城跨区 |
| DoV-4 未声称业务实现已完成 | Pass | 本文件只评审规格；实现状态由 P4 报告与 PR #75 证据承担 | 不把代码提交当作 G1 决议 |
| DoV-5 requirement 可追溯到 proposal/REQ | Pass | 见追溯表 | 每个场景映射到 REQ-015 AC hints |

## 追溯表

| Delta scenario | 来源（REQ-015 / proposal） |
|---|---|
| 展开加载最近服务 | AC-1～AC-5；proposal「新增接口 + 行程卡片栏目」 |
| 收起不请求 | AC-1、AC-2；design D6 |
| 营业时间回退 | AC-6；design D3 |
| 景点无坐标 | AC-7；design D2 |
| 无同城服务 | AC-3、AC-7；design D1 |
| 请求失败降级 | AC-8；design D7 |
| 未知 POI | AC-7；design D2 |
| 医院与用品店不受宠物友好筛选 | AC-9、AC-11；proposal「免筛选 + 不限宠物文案」 |
| 宠物医院与宠物用品店不受门禁影响 | AC-10；proposal「医院/用品店不应用筛选」 |

## 残余风险 / G1 关注点

| 级别 | 关注点 | 说明 |
|---|---|---|
| 风险 | 无专用 E2E | 附近服务折叠栏目没有 Playwright 断言；由组件 UT + API 测试覆盖，CI 仅回归既有流程 |
| 风险 | 营业时间快照时效 | 数据为保存时快照；本期不实时刷新 |
| 风险 | 同城最近可能跨行政区 | 符合已确认口径；不额外限制区县 |
| 风险 | 请求失败态无自动化 | 组件错误分支未写测试；由实现与 `throwOnError: false` 保证 |
| 已决 | 与 REQ-012 同 PR | 两项共用地点接口与后端测试文件，用户确认合并为 PR #75 |
| 已决 | Living Spec 状态 | 医院/用品店免筛选已随 PR #75 进入 Living Spec；附近服务需求尚只在代码与测试中，需归档合并 |

## 结论

- AC-1…AC-4：Pass；DoV-1…DoV-5：Pass。
- 无阻塞性 DoV 缺口；Delta Spec 可提交 **G1** 人工评审。
- G1 决议由 IO/SA 签署；本文件不写入 Pass/Fail。
