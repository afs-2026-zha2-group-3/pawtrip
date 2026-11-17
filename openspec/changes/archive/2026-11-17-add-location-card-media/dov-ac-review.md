# AC / DoV Review — add-location-card-media

- 日期：2026-11-17
- 审查对象：`openspec/changes/add-location-card-media/specs/location-management/spec.md`（1 需求 5 场景）、`specs/trip-attractions/spec.md`（3 需求 12 场景）
- 上游：`proposal.md`、`design.md`、`tasks.md`、`requirement-workspace/requirements/REQ-013-location-browse-card-media.md`
- 评审状态：Delta Spec 可进入 **G1** 人工评审；本文件不是 G1 决议，不代替 IO/SA 签字

## AC 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 requirement 至少一个可测 AC | Pass | 4 个 requirement 共 17 个 `#### Scenario`（5+5+4+3） | 覆盖契约字段、首张选取、缺失 null、DB-only、封面/评分展示与降级、摘要行生成与隐藏、弹窗同步与类型一致 |
| AC-2 AC 可观察 | Pass | 响应字段值、占位元素、星标文案「4.6」、行文案「≤15 kg」「附加费 ¥80」、整行隐藏、操作保留均为可观察结果 | 无「美观/良好」类模糊表述；16:9 与琥珀星标为可目视/可断言的视觉契约 |
| AC-3 负向/边界覆盖 | Pass | 无照片、URL 非 http(s)、加载失败、rating null/非数值、限制费用全空、无可生成短语、多张照片取首张、非法 JSON 快照（design D2） | 与 REQ-013 S1–S8 及 NB-1…NB-5 定稿一致 |
| AC-4 不把实现细节伪装成 AC | Pass | delta 仅外部契约（API 字段、页面元素、降级行为）；无类名/函数名/框架选择 | 「只读数据库、不调用高德、不下发原始 POI/business/照片列表」为数据与安全边界约束 |

## DoV 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 两个 Modified 能力 ↔ 两个 delta 文件；零迁移、零管理端改动、不新增押金/清洁费/描述字段 | delta 全 ADDED，未触碰 unify-location-browsing 正在修改的要求 |
| DoV-2 歧义已列出或解决 | Pass | REQ-013 blocking OQ×4 已决（2026-11-17 用户确认）；NB×5 在 design D4/D5 定稿；design 无 Open Questions | 无未决口径进入 tasks |
| DoV-3 IO/SA 残余风险已记录 | Pass | 见下方「残余风险」 | 上游图片可用性、评分快照时效、管理端增量字段、E2E 图片夹具 |
| DoV-4 未声称业务实现已完成 | Pass | 本 change 目前仅 P2 规划工件 + P3 测试设计；无生产代码改动 | P4 才进入实现 |
| DoV-5 requirement 可追溯到 proposal/REQ | Pass | 见下方追溯表 | 每项映射到 REQ-013 场景与 proposal 条目 |

## 追溯表

| Delta requirement | 来源（REQ-013 / proposal） |
|---|---|
| 用户端地点封面与评分字段（location-management） | REQ-013 S8、S1/S2 数据前提；proposal「列表与详情新增两个可空标量」；OQ-4 复用高德快照 |
| 地点卡片封面与评分（trip-attractions） | REQ-013 S1、S2、S3；proposal「卡片重构」「降级规则」；NB-1/NB-4 |
| 地点卡片限制费用与政策说明行（trip-attractions） | REQ-013 S4、S5；proposal「限制费用行」「政策说明行」；OQ-1/OQ-2、NB-2/NB-3 |
| 详情弹窗媒体同步（trip-attractions） | REQ-013 S6、S7；proposal「详情弹窗头部同步」「6 类型一致」；OQ-3、NB-5 |

## 残余风险 / G1 关注点

| 级别 | 关注点 | 说明 |
|---|---|---|
| 风险 | 上游照片 URL 可用性 | 高德 URL 可能过期/防盗链；规格降级为中性占位且不阻塞操作；不做代理与重试（Non-goal），线上观感依赖上游 |
| 风险 | 评分快照时效 | rating 为保存时快照，不随高德更新；本期不做刷新（DB-only 已决口径），展示为快照值 |
| 风险 | 管理端列表增量字段 | 共享列表响应多出 `coverPhotoUrl`/`rating` 两个标量；管理端 UI 不读取；tasks 1.3/5.2 安排管理端回归 |
| 风险 | E2E 图片夹具 | 外部图片 URL 不可靠；E2E 用 Playwright route 拦截确定性 URL 返回本地图片字节（见 atdd-design §5），不依赖外网 |
| 风险 | 数据覆盖 | 开发库当前仅 2 个地点（均有图有分）；无图/无分组合依赖 E2E 种子扩展（tasks 4.1） |
| 已决 | 归档顺序 | unify-location-browsing 未归档；本 change delta 全 ADDED，先后归档均无文本冲突 |
| 已决 | 押金/清洁费/描述字段 | Out of Scope（OQ-1/OQ-2）；限制费用行仅体重/肩高/附加费 |

## 结论

- AC-1…AC-4：Pass；DoV-1…DoV-5：Pass。
- 无阻塞性 DoV 缺口；Delta Spec 可提交 **G1** 人工评审。
- G1 决议由 IO/SA 签署；本文件不写入 Pass/Fail。