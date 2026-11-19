# G1 decision — location-select-dropdown-and-card-redesign

- Gate: G1（Align）
- Change id: `2026-11-19-location-select-dropdown-and-card-redesign`（REQ-019 地点选择下拉与地点卡片改版）
- Status: 已签署（2026-11-19）
- Inputs:
  - `proposal.md`；`specs/trip-attractions/spec.md`（2 ADDED + 4 MODIFIED + 1 RENAMED）、`specs/web-app-shell/spec.md`（2 MODIFIED）、`specs/location-management/spec.md`（1 ADDED）
  - `design.md`（D1–D8：导航下拉结构与可访问性、URL 类型状态、门禁移除与锚点保留、页头工具栏、卡片叠层与操作、DaySelect 紧凑形态、简介契约与回退、测试与回滚）
  - `tasks.md`（5 组 14 项，含后端简介、导航、全量列表、卡片视觉、测试与验证）
  - 复核：`dov-ac-review.md`（AC-1…AC-8 文档层 Pass；DoV-7/DoV-10 Defer）、`consistency-lint.md`（0 BLOCKER / 0 WARNING / 6 SUGGESTION，Verdict Pass）
  - 上游需求：`requirement-workspace/requirements/REQ-019-location-select-dropdown-and-card-redesign.md`（AC-1…AC-8、S1–S8，8 个 OQ 全部 resolved，DoR ⑨–⑫ Pass，BLOCKER=0）；`intents/REQ-019-...md`；`analysis/REQ-019/{impact-brief,deep-dive}.md`；用户 2026-11-19 截图
  - 校验：`npx --no-install openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict` 通过（2026-11-19）
- G1 预审修正（已合入变更包）：
  1. 评分徽标位置按截图统一为封面右下角；P1 intent/requirements/impact-brief 原「右上角」表述已修正，Day 入口统一为卡片底部右侧。
  2. 「餐厅的选择门禁」语义已反转，使用 `RENAMED Requirements` 改为「酒店与餐厅的默认列表与可选锚点」，并在同名 MODIFIED 块保留原有 4 个场景名（沿袭 transport-mode-panel-picker 归档先例）。
  3. 补充 MODIFIED「地点卡片封面与评分」：4:3 裁切、封面叠层、封面右下角评分徽标、移除独立地址行；保留媒体降级与「不提供获取图片/重试」规则，消除与 Living Spec 原文（16:9、地址行评分）的冲突。
  4. 补充 `web-app-shell` MODIFIED「顶部居中横向导航」「Tab 与路由同步」：导航由六个 Tab 改为五个 Tab + 「地点选择」下拉，`/attractions` 不选中 Tab、由下拉保持激活态，消除与原导航契约的冲突。
- Findings:
  - 范围：Proposal What Changes、三份 Delta、Design Goals 与 REQ-019 In/Out 一致；单 Change 交付「导航下拉 + URL 类型 + 取消门禁 + 卡片改版 + 简介字段 + 测试同步」。医院/用品店导航入口、管理端简介编辑、AI 摘要、5km/排序算法、地图与导出均未混入。
  - 歧义：无未决 blocking 项。下拉结构、URL 白名单、类型切换与行程切换的状态清理、门禁移除、评分与标签位置、Day 控件形态、简介回退均已定稿；8 个 P1 OQ 全部 resolved。
  - 冲突：已消除两处 Living Spec 语义冲突（卡片封面/评分、web-app-shell 导航组成）；`trip-attractions` 既有 5km 契约、政策匹配、地图联动、加入行程与详情弹窗媒体规则不变；`location-management` 仅新增可空字段，管理端 UI 不变。
  - 残余风险（非阻塞，IO/SA 知悉）：
    1. 当前分支中间态不可编译（`attractions/index.tsx` 仍引用已删除的 `setTypeGroup`/`gated`），且 `V31` 对 `B02F400HUL` 有重复 UPDATE；由 P4 一次性收敛。
    2. 依赖未安装，单测、build 与 Playwright 未运行；DoV-7/DoV-10 记 Defer，不得据此宣称 P4 完成。
    3. 截图中第二个地点标签（如「户外区域」）无数据来源，仅渲染单个 `keytag`，不臆造标签。
    4. 截图未展示「查看详情」，Design 保留低强调 ghost 入口以维持详情弹窗与既有 E2E 可访问名。
    5. Day 触发器可见文案按截图固定为「Day 1」+ plus，选择项仍为第 1..N 天与「暂不排期」，无障碍名保持「添加到行程」。
    6. Living Spec 其他导航标签（`Home`/`Paws`/`景区浏览`）与现有 UI 文案存在既有漂移；本 change 只移除 `景区浏览` Tab 并新增下拉，不顺带重命名其他标签。
    7. 本会话无 `/sdd:quality-checklist` 插件命令，P2 质量清单未生成；以 `dov-ac-review.md` 与 `consistency-lint.md` 作为等效复核证据。
- Decision: **Pass**
- Conditions + owners: 无（Pass）。上述 7 项为非阻塞知悉项，均有 P4 归属或属既有漂移，不构成 Gate 条件。
- Approvers: IO=kitty；SA=kitty（用户指定同一人签署，沿袭 REQ-016 / REQ-017 G1 同人签署先例）
- Timestamp: 2026-11-19

> 本记录不构成 G2/G3 授权。签署通过后进入 P3：`atdd-design.md`、`alignment-self-check.md` 与红绿任务重排；随后 P4 按本变更包收敛实现并运行验证。
