# Dov AC Review — add-city-personalized-recommendation

- 日期：2026-11-17
- 上游：REQ-014（`requirement-workspace/requirements/REQ-014-city-personalized-recommendation.md`，AC-1…AC-6）
- 复核范围：`specs/paws-page/spec.md`（1 MODIFIED + 1 ADDED，9+2 场景）、`specs/destination-selection/spec.md`（3 ADDED，14 场景）
- 校验：`openspec validate add-city-personalized-recommendation --strict` 通过（含去重场景补强后复验）
- 修订记录：Revision 1（2026-11-17）补「重复喜好键去重」场景与规范句（design D4 定稿的行为此前未落 delta，现已补齐）

## 1. AC 检查（pack 清单）

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每需求至少一个可测 AC | Pass | 5 个需求共 25 场景，均为 WHEN/THEN 可测形式 | MODIFIED 详情需求保留原 6 场景 + 新增 2 场景 |
| AC-2 可观察性 | Pass | 分值（+2/+1）、排序位次、徽标有无、400 code、字段回显值均为可观察断言 | 无「工作良好」类模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 非法枚举×2、空值/不填、清空、重复键去重、旧客户端、旧档案、未标注城市、无档案/失败退化、多宠取第一只、同分稳定 | 高风险路径（校验/兼容/退化）均有场景 |
| AC-4 非实现细节伪装 | Pass | 词表键为对外契约词汇；「排序在前端完成」为用户已决集成边界（方案 A），属外部约束 | 控件形态（Checkbox/Select/Badge 定位）仅在 design，未混入 spec |

## 2. DoV 检查（pack 清单）

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal What Changes ↔ delta 5 需求逐项对应；Out（管理端/理由文字/后端排序/多宠聚合/开关）未出现在 delta | city-management 不改已在 proposal 显式说明 |
| DoV-2 歧义已列或已决 | Pass | P1 11 个 OQ resolved；重复键处理 design D4 定稿去重并落 delta（Revision 1） | design Open Questions 为空 |
| DoV-3 角色残余风险（IO/SA） | Pass | 见第 4 节残余风险表 | 均非阻塞，缓解已入 design/tasks |
| DoV-4 未声称业务实现完成 | Pass | 本复核仅规划工件；tasks 全部未勾选 | 无代码改动 |
| DoV-5 需求可追溯 | Pass | 第 3 节追溯矩阵：delta 全部需求 ↔ REQ-014 AC ↔ proposal；无孤儿项 | MODIFIED 块为整块复制后编辑，header 与 Living Spec 精确一致 |

## 3. 追溯矩阵（REQ-014 AC → delta）

| REQ-014 AC | delta 需求 | 场景覆盖 |
|---|---|---|
| AC-1 表单多选/单选、持久化、回显、详情展示 | paws-page「宠物喜好与性格维护」+ MODIFIED「整卡打开详情并支持弹窗内编辑」 | 创建勾选/编辑回显/不填可存/清空/详情展示/详情未设置 |
| AC-2 可空兼容、必填校验不变、非法枚举 400 | paws-page「宠物喜好与性格维护」 | 未知喜好键/未知性格键/重复键去重/旧客户端/旧档案读取/不填可存；需求文本明示既有必填校验不变 |
| AC-3 第一只宠物打分排序（+2/+1、同分名称序、游泳→海滨排前） | destination-selection「候选个性化推荐排序」 | 喜好驱动/性格加成/仅性格/同特征去重/未填名称序/多宠第一只/筛选叠加（7 场景） |
| AC-4 得分 >0 右上角「系统推荐」徽标（仅徽标） | destination-selection「系统推荐徽标」 | 被推荐展示/未命中无/与政策标签并存/未启用无（4 场景） |
| AC-5 未填/无档案/失败退化；搜索/筛选/标签/选定不变 | destination-selection「候选个性化推荐排序」「系统推荐徽标」 | 未填维持名称序/筛选与搜索叠加/未启用排序无徽标 |
| AC-6 featureTags 下发、48 城（珠海/杭州）、未标注空 | destination-selection「候选城市特征标签契约」 | 已标注携带/未标注空/既有契约不变（3 场景） |

## 4. 残余风险（IO/SA 知悉项，非阻塞）

| # | 风险 | 归属 | 缓解 |
|---|---|---|---|
| 1 | 词表前后端双份常量漂移 | SA | design D1 单点词表 + 后端枚举校验 + tasks 1.3/5.1 对照与单测 |
| 2 | 48/369 城覆盖率低，多数城市 0 分排后 | IO | 用户已决接受；搜索/筛选可触达全部城市 |
| 3 | 档案晚于候选返回的短暂名称序过渡 | IO | 与现有 petType 传参时序一致，不做加载门禁（design D6） |
| 4 | 徽标窄屏遮挡风险 | SA | 右上角绝对定位 + tasks 5.4 E2E 并存断言 + 窄屏目视 |

## 5. 结论

AC 4/4 Pass、DoV 5/5 Pass，无阻塞缺口，Delta Spec 可提交 G1 评审。**本复核不构成 G1 决定**；G1 签署走 `/sdd:g1-decision-record`（人工 IO/SA）。