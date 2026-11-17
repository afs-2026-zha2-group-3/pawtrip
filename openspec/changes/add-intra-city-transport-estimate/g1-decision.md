# G1 decision — add-intra-city-transport-estimate

- Gate: G1（Align）
- Change id: `add-intra-city-transport-estimate`（REQ-011 途内交通推荐：打车/步行）
- Inputs:
  - Delta Specs：`specs/trip-route-estimate/spec.md`（ADDED，3 需求 12 场景）、`specs/trip-context/spec.md`（ADDED，7 需求 26 场景）、`specs/trip-planning/spec.md`（MODIFIED「Plan JSON v1 结构」全量块，9 场景）
  - AC/DoV 复核：`dov-ac-review.md`（AC 4/4 Pass、DoV 5/5 Pass，S1–S13 全追溯，无阻塞 Fail/Partial）
  - 校验：`openspec validate add-intra-city-transport-estimate --strict` 通过（2026-11-17，四轮修订后复验）
  - 需求来源：`requirement-workspace/requirements/REQ-011-intra-city-transport.md`（S1–S13，DoR BLOCKER=0）；`analysis/REQ-011/{deep-dive,impact-brief}.md`
  - 提案与设计：`proposal.md`、`design.md`（D1–D8）、`tasks.md`（TDD 分组）
- Findings:
  - 范围：delta 与 proposal What Changes 一致，四轮修订（快照落库/打车携宠提示/每天政策对比提醒/提醒位置移到首个景点行前）均已同步，无静默扩围；范围外项（租车/实时计价/叫车/可携宠筛选/公交算路/破坏性结构变更/新 Tab）未进入规格。
  - 歧义：OQ 全部 resolved/deferred；延迟项（缓存 TTL、提示文案措辞）归属 P3，高德 KB 文档与真实 Key 冒烟归属 tasks 1.1/1.2（P3 前），无未决阻塞歧义。
  - 冲突：与 active change `unify-location-browsing`（PR #60 已合并）无能力依赖，面板文件仅更名级交集；trip-planning MODIFIED 块与 living spec 标题精确一致。
- Decision: **Pass**
- Conditions + owners: 无（Pass）。以下为非阻塞知悉项，已有归属任务，不构成 Gate 条件：
  1. 高德 Key 权限/`taxi_cost` 冒烟（IO 知悉，tasks 1.2，P3 前；失败升级用户决策）
  2. 路线规划 2.0 KB 文档补入（SA 知悉，tasks 1.1，DoR WARNING）
  3. 回滚时旧 validator 丢弃快照（SA 知悉，design Migration；方式保留、回填可恢复）
  4. 政策缓存懒加载时序（IO 知悉，design D8/Risks；未加载跳过不警示）
  5. 提示文案最终措辞（IO 知悉，P3 统一，语义已锁定）
- Approvers: IO=kitty；SA=kitty（用户指定同一人签署，沿用 REQ-007 先例）
- Timestamp: 2026-11-17