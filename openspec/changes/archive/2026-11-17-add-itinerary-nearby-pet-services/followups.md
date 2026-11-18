# Follow-ups — add-itinerary-nearby-pet-services

- 日期：2026-11-17
- 上游：`change-summary.md`、`consistency-lint.md`、`atdd-design.md` §5

## Tech debt

| # | Item | 来源 | 建议 |
|---|---|---|---|
| TD-1 | 附近服务请求失败态无自动化测试 | atdd-design §5 | 在 `nearby-pet-services.test.tsx` 增加 fetch reject 用例，断言“暂时无法获取附近宠物服务” |
| TD-2 | “距离并列按 ID 升序”无并列夹具 | atdd-design §5 | API 测试构造等距医院，断言按 ID 升序 |
| TD-3 | 无专用 E2E 覆盖折叠栏目 | atdd-design §5 | 在行程单 E2E 增加展开/空态断言，或明确由组件 UT 承担 |
| TD-4 | Living Spec 与实现短暂不一致 | consistency-lint L2 | PR 合并后执行 `/sdd:living-merge` 归档合并 ADDED requirement |

## Business backlog

| # | Item | 来源 | 建议 |
|---|---|---|---|
| BZ-1 | 附近服务展示电话与一键导航 | REQ-015 Out of Scope | 需产品确认导航跳转与电话字段来源 |
| BZ-2 | 每类展示多家或可配置距离阈值 | REQ-015 Out of Scope | 需确认卡片空间与筛选口径 |
| BZ-3 | 营业中/已打烊状态 | REQ-015 Non-goal | 需实时或规则化营业时间解析 |
| BZ-4 | 医院/用品店卡片补充更多基础信息（评分、照片） | 用户潜在诉求 | 复用 REQ-013 媒体字段，另行评估 |

## Redirect：`/sdd:evolve`

| # | Item | 说明 |
|---|---|---|
| EV-1 | 无 | 本期未发现 Harness/Rules/流水线模板改进项 |

## Gaps

- 以上条目均来自现有文档与实现残余风险，未新增未证实的需求。
- 未创建 GitHub issue；如需要请确认跟踪位置与编号。
