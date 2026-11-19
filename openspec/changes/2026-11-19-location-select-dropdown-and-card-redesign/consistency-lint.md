# Consistency Lint — 2026-11-19-location-select-dropdown-and-card-redesign

日期：2026-11-19
范围：`proposal.md`、`specs/trip-attractions/spec.md`、`specs/location-management/spec.md`、`design.md`、`tasks.md`、`dov-ac-review.md`、P1 REQ-019 与 `analysis/REQ-019/{impact-brief,deep-dive}.md`。

| 检查项 | 结果 | 证据 / 说明 |
|---|---|---|
| 导航范围一致 | Pass | Proposal「What Changes」、Requirement AC-1、Design D1、Tasks 2.1 均为「只把地点浏览改为地点选择下拉，其余导航不变」 |
| 下拉选项一致 | Pass | Delta「地点选择导航与类型页面」、Design D1、P1 REQ-019 均为景点/酒店/餐厅三项 |
| 类型状态一致 | Pass | Delta「地点类型筛选」、Design D2、P1 deep-dive §2 均为 URL `?type=`，非法值回退景点 |
| 刷新/前进后退一致 | Pass | Delta 场景「刷新保持类型」、Design D2、Tasks 2.2 均要求保持类型 |
| 页内入口移除一致 | Pass | Delta「地点类型筛选」、Design D4、Tasks 2.2 均为移除类型下拉/返回景点/选择住宿餐厅 |
| 酒店/餐厅默认全量一致 | Pass | Delta「酒店与餐厅的默认列表与可选锚点」「行程景点锚点选择」、Design D3、Tasks 3.1 一致 |
| 锚点筛选一致 | Pass | Delta 三个锚点场景、Design D3、Tasks 3.2 均为可选、5km、共用锚点、清除恢复 |
| 门禁移除范围一致 | Pass | Delta 酒店/餐厅场景、Design D3、P1 impact §3 均明确不再有门禁空态与恢复门禁 |
| 需求命名一致 | Pass | G1 预审将语义已反转的「餐厅的选择门禁」通过 `RENAMED Requirements` 改为「酒店与餐厅的默认列表与可选锚点」，MODIFIED 块与 proposal/复核表同步；归档可应用（沿袭 transport-mode-panel-picker 先例） |
| 标题文案一致 | Pass | Delta 场景标题「酒店」、Design D2、P1 AC-2 均要求酒店而非「住宿」 |
| 卡片结构一致 | Pass | Delta「地点卡片概览与简介」「地点卡片封面与评分」、Design D5、Tasks 4.1 均为封面叠层 + 标题 + 简介 + Day 1 + |
| 封面规格一致 | Pass | G1 预审补充 MODIFIED「地点卡片封面与评分」：4:3 裁切、封面右下角评分徽标、移除独立地址行，消除与 Living Spec 原文（16:9、地址行评分）的冲突；媒体降级与无重试规则保留 |
| 评分位置一致 | Pass | Design D5 与截图为封面右下角徽标；P1 intent/requirements/impact-brief 中的「右上角」已于 G1 预审统一修正为右下角 |
| 简介来源一致 | Pass | Delta「地点简介字段」、Design D7、P1 三字段澄清均为后端可空 `description` |
| 简介回退一致 | Pass | Delta 场景「简介缺失回退地址」、Design D7、P1 AC-6 与 deep-dive §4 一致 |
| 详情/地图卡简介一致 | Pass | Delta 场景「详情同步简介」、Design D7、Tasks 4.3 一致 |
| Day 控件可访问名一致 | Pass | Delta「无障碍名称为添加到行程」、Design D6、Tasks 4.2 一致 |
| 锚点 5km 规则未变 | Pass | P1 impact §4、Design Non-goals、Delta「5km 附近筛选」未修改，均声明算法不变 |
| E2E 更新范围一致 | Pass | Design D8、Tasks 5.1、`dov-ac-review.md` Residual concerns 覆盖同一 4 个 spec |
| E2E 数量约束一致 | Pass | P1 需求 Constraints、Design D8、Dov AC-8 均为新增用例 ≤30 |
| Living Spec 修改面一致 | Pass | Proposal Capabilities 与三份 Delta 目录一致：trip-attractions 6 个需求（2 ADDED + 4 MODIFIED + 1 RENAMED）、web-app-shell 2 个 MODIFIED、location-management 1 个 ADDED |
| 导航契约覆盖 | Pass | G1 预审补充 `web-app-shell` delta：六个 Tab 改为五个 Tab + 「地点选择」下拉；`/attractions` 不选中 Tab、由下拉保持激活态，消除与原导航要求的冲突 |
| Tasks 与 Design 对齐 | Pass | 5 组 14 项覆盖后端、导航、门禁、卡片、测试；每项含验证点 |
| AC 与 Scenario 追溯 | Pass | `dov-ac-review.md` 9 个 Requirement / 37 个 Scenario，AC-1…AC-8 全覆盖 |
| 无新依赖 | Pass | Proposal Impact、Design 范围、P1 impact 均声明零新依赖 |
| 迁移编号 | Pass | `V30` 为当前最新，`V32` 为本次新增；设计引用一致 |
| 规范校验 | Pass | `npx --no-install openspec change validate 2026-11-19-location-select-dropdown-and-card-redesign --strict` → valid（2026-11-19） |

## Findings

| 级别 | 位置 | 问题 | 处理 |
|---|---|---|---|
| SUGGESTION | 卡片操作 | 截图未展示「查看详情」，但既有详情弹窗与 4 处 E2E 依赖该可访问名 | Design D5 保留低强调 ghost 文字按钮；若用户要求完全按截图，可改为标题区域打开详情并同步改 E2E |
| SUGGESTION | 封面标签 | 截图含「森林公园」「户外区域」两个地点标签，数据模型只有单个 `keytag` | Design D5 只渲染实际 `keytag`，不臆造标签；如需多标签另行立需求 |
| SUGGESTION | Living Spec 锚点 | 「行程景点锚点选择」保留「景点类型下行程景点锚点选择器」条目，基线页面未见该控件 | 属既有漂移，本 change 不新增/不删除该能力；P4 不为该控件写新测试 |
| SUGGESTION | 当前分支 | `index.tsx` 仍有 `setTypeGroup`/`gated` 残留，`V32` 中 `B02F400HUL` 重复 UPDATE | Design D3/D7 与 Risks 已列明，P4 一次性收敛并删除重复 UPDATE |
| SUGGESTION | 导航 ARIA | 原 `TabsList` 内直接放 `Select` 会出现 tablist + combobox 混排 | Design D1 改为共享视觉容器内 `TabsList` 与 `Select` 并列 |
| SUGGESTION | E2E 旧断言 | `attraction-pet-rules` 仍按 `tab`「地点浏览」进入；`transport-rules` 断言旧导航文案 | Design D8 与 Tasks 5.1 要求同步更新，属预期改动 |

BLOCKER：0；WARNING：0；SUGGESTION：6。Verdict：**Pass**。
