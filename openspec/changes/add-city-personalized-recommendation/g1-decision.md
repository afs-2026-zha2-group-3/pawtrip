# G1 decision — add-city-personalized-recommendation

- Gate: G1（Align）
- Change id: `add-city-personalized-recommendation`（REQ-014 城市个性化推荐）
- Inputs:
  - `proposal.md`、`specs/paws-page/spec.md`（1 MODIFIED + 1 ADDED）、`specs/destination-selection/spec.md`（3 ADDED）、`design.md`（D1–D9）、`tasks.md`（6 组 17 项）
  - AC/DoV 复核：`dov-ac-review.md`（AC 4/4 Pass、DoV 5/5 Pass，Revision 1 补去重场景）
  - 上游需求：`requirement-workspace/requirements/REQ-014-city-personalized-recommendation.md`（DoR ①–⑫ 全过，11 OQ resolved）
  - 校验：`openspec validate add-city-personalized-recommendation --strict` 通过
- Findings:
  - 范围：与 proposal 一致，单 Change 交付连贯能力（档案字段 + 特征数据 + 打分排序 + 徽标）；city-management 不改（只读种子层）；Out 项（管理端界面/推荐理由文字/后端排序/多宠聚合/推荐开关）未混入
  - 歧义：无未决项——11 个 OQ 全部 resolved；重复喜好键处理 design D4 定稿去重并已落 delta 场景
  - 冲突：MODIFIED 块整块复制 Living Spec 后编辑，header 精确一致；既有必填校验、筛选/搜索/选定行为声明不变；无跨 REQ 契约冲突
  - 残余风险（非阻塞，IO/SA 已知悉）：词表双份常量漂移（单点词表+枚举校验缓解）、48/369 城覆盖率（用户已决接受）、档案晚到短暂名称序过渡（与现有时序一致）、徽标窄屏遮挡（E2E 并存断言+目视）
- Decision: **Pass**
- Conditions + owners: 无
- Approvers: IO=SUKI；SA=RANLE
- Timestamp: 2026-11-17（用户在对话中明确选择 G1 Pass 并指定签署人）

> 本记录为人工 G1 决定的落盘，不构成 G2/G3 授权。下一步：P3 ATDD 设计（`/sdd:atdd-design`）。