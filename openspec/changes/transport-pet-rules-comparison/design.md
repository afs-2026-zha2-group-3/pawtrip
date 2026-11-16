# Design

## Context

- 应用外壳的顶部导航由 [__root.tsx](file:///c:/code/pawtrip/apps/web/src/routes/__root.tsx) 的 `AppTabs` 实现：`activeTab` 用 `pathname` 精确匹配，`onValueChange` 用 `if/else` 导航到各路由；「城市浏览」`/cities` 已存在于 Tab 列表，`/transport-rules` 路由尚不存在。
- 受保护页面放在 `apps/web/src/routes/_authenticated/` 下，未登录由 `_authenticated` 守卫跳转 `/login`；`routeTree.gen.ts` 由插件生成，不应手改。
- 前端已具备 shadcn/ui（Base UI）组件：`components/ui/table.tsx`、`select.tsx`、`card.tsx`、`button.tsx`，无需新增依赖。
- E2E 使用 Playwright（`e2e/*.spec.ts`），登录辅助函数在 `e2e/authentication.spec.ts` 内本地定义，账号 `demo / 123456`。
- 规则内容与来源已在 `requirement-workspace/analysis/REQ-005/deep-dive.md`（D1–D8）人工摘录，其中火车、海航、自驾标记为待复核。
- 规格见 `specs/transport-rules-catalog/spec.md`、`specs/transport-rules-comparison-page/spec.md`、`specs/web-app-shell/spec.md`；动机见 `proposal.md`。

## Goals / Non-Goals

**Goals:**

- 规则内容有唯一真源（前端常量模块），改规则 = 改一处常量 + 更新复核日期。
- 页面结构（四行 × 基础列，列集合可由配置扩展）与状态语义（可携带 / 有条件 / 不可）与规则数据解耦：数据变化不需要改渲染代码。
- 航司切换是行内状态，不产生请求、不改 URL、不影响其他行。
- 顶部 Tab 与路由双向同步，行为与既有「城市浏览」Tab 一致。

**Non-Goals:**

- 不实现规则与宠物档案的对比判定（后端、随 US-06），不建档案表。
- 不提供航司全集、车次/车型/席别细分、站内订票、实时查询。
- 不把规则迁到后端或数据库，不做管理端维护界面。
- 不引入组件测试框架（沿用现有 E2E 覆盖面）。

## Decisions

### D1 规则数据以前端常量模块为唯一真源

新增 `apps/web/src/data/transport-rules.ts`：导出 `TransportRule` 类型、`transportRules` 数组与按方式/航司取数的纯函数（如 `getRulesByMode`、`getFlightRules`）。

- 理由：需求方明确"规则全部前端写死"；纯静态内容，后端不参与展示，避免为静态数据引入表结构与 API。
- 备选（已否决）：SQLite + Flyway + 只读 API。成本更高，且与"网页静态"定位不符。
- 约束：条目字段结构稳定（`id` 可被后续后端引用），后续若上移后端可按字段一一映射。

### D2 数据模型：状态枚举 + 可空体重 + 复核日期门禁

字段（camelCase）：`id`、`mode`（`flight` / `high_speed_rail` / `train` / `drive`）、`carrierCode`、`carrierName`、`transportForm`（`checked` / `cabin` / `isolated_checked` / `self`）、`allowanceStatus`（`allowed` / `conditional` / `not_allowed`）、`allowanceNote`、`allowedSummary`、`weightLimitKg`（可空）、`weightLimitNote`、`containerRequirement`、`procedureSummary`、`extra`（可选扩展字段字典）、`sourceUrl`、`sourceTitle`、`verifiedOn`（ISO 日期）、`sortOrder`。

- 列可扩展：基础四维度为必备字段，额外信息（体型限制、检疫证明、笼具规格等）放在 `extra` 字典，由列配置声明 `key` 与表头，避免为每新增一列都改类型与表格代码。

- 状态标识只由 `allowanceStatus` 决定，`allowanceNote` 承载"导盲犬除外""按航司细分"等弱化说明 → 数据驱动，避免 UI 内按行写死条件分支。
- `weightLimitKg` 可空：自驾语义为"无统一上限"，由 `weightLimitNote` 说明"无统一限制"，避免用 `0` 或凭空数字表达。
- `verifiedOn` 为空 = 未复核：评审与合并前必须补齐（合并前置条件，见 §Risks）。
- 备选：把四维度直接存成一句 `summary` 文本 → 无法支撑 US-06 的体重判定与结构化展示，否决。

### D3 页面渲染：单表四行 + 行内 Select

- 表格用 `ui/table`，列由 `transportRuleColumns` 配置数组驱动（`key`、`label`、`render(rule)`）：默认至少包含方式 + 四个基础维度；新增列 = 追加一项配置 + 在规则 `extra` 填值，表格结构代码不变。
- `TableBody` 渲染四条行记录（按 `mode` 取代表记录）；飞机行的各单元格取自当前选中航司记录。
- 航司选择用 `ui/select`，选项来自 `getFlightRules()`（国航/东航/南航/海航）；未选择时默认第一个航司，保证不出现空行。
- 航司选择状态是页面局部 `useState`，不写入 URL（页面无分享/深链需求，避免额外路由参数复杂度）。
- 状态标识按 `allowanceStatus` 映射到三种视觉态；无对应字段时退化为纯文本 `allowedSummary`。
- 表格底部固定区展示：数据来源说明（12306 / 航司官网人工摘录）、复核状态、免责声明、"无站内订票"提示。
- 无档案入口：`Button` 跳转预留档案路由（当前建议 `/paws/profile`，US-06 确认后调整）。

### D4 路由与导航

- 新增 `apps/web/src/routes/_authenticated/transport-rules.tsx`（顶层路由 `/transport-rules`，与 `/cities` 平级）。理由：用户要求放顶部导航，且规则页与城市内容无业务从属关系。
- `__root.tsx` 的 `AppTabs`：`activeTab` 增加 `pathname === "/transport-rules" ? "transport-rules"` 分支；`onValueChange` 增加对应导航；`TabsTrigger value="transport-rules"` 插在「城市浏览」之后、管理员分支之前。
- 匹配顺序按"精确等值"判断，无前缀冲突；不放宽为 `startsWith`，避免未来子路由误判。

### D5 与 US-06 的契约边界

- 本变更只保证：`id` 稳定、`weightLimitKg` 结构化、`weightLimitNote` 承载体型限制、页面预留行级"不推荐"位置（不渲染）。
- 对比判定在后端实现（US-06），后端获取规则阈值的方式（前端传参 / 后端留最小副本）在 US-06 需求阶段决定，本变更不做接口预留代码。

## Risks / Trade-offs

- 规则时效性（高铁试点扩围、航司政策调整） → `sourceUrl` + `verifiedOn` + 底部免责声明；更新规则走一次常量变更。
- 火车 / 海航 / 自驾条目尚未复核 → 合并前置：`verifiedOn` 为空的条目必须补齐并核对来源，否则不合并。
- 前端写死规则与 US-06 后端对比可能产生两套阈值 → 以 `id` + `weightLimitKg` 为迁移锚点，US-06 阶段确定后端取值方式后一次性对齐。
- 长文本（办理流程概要）在窄屏压缩 → 桌面优先的表格布局，允许单元格内换行；不为移动端另做卡片视图（本变更非目标）。
- 顶部 Tab 变多（普通 4 项、管理员 6 项）在窄屏拥挤 → 沿用现有 Tab 横向压缩，不新增长文本标签。
- 海航同时有托运与客舱两条规则 → 下拉只按航司选择，默认展示托运记录；客舱记录保留在目录中供后续证明清单/详情使用，页面暂不提供形态切换。

## Migration Plan

- 无数据迁移、无后端部署；上线即前端发布。
- 回滚：revert 该 change 的提交即可，`/transport-rules` 与 Tab 一并消失，无残留数据。
- 合并顺序：T1 规则常量（含待复核补齐）→ T2 页面 → T3 Tab 接入与 E2E；T1/T2 可并行开发，T3 需 T2 路由存在。

## Open Questions

- 档案录入路由最终路径（建议 `/paws/profile`）由 US-06 确认；本变更只放按钮，路径集中在一处常量便于替换。
- 飞机行默认航司：设计建议取排序首个（国航）；如需固定为其他航司，调整数据 `sortOrder` 即可，不改渲染逻辑。
