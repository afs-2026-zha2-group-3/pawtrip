# Design — 地点选择下拉与地点卡片改版

- Change：`2026-11-19-location-select-dropdown-and-card-redesign`（REQ-019）
- 上游：`requirements/REQ-019-location-select-dropdown-and-card-redesign.md`、`analysis/REQ-019/{impact-brief,deep-dive}.md`、用户 2026-11-19 截图
- 范围：前端导航与地点页 + 卡片视觉；后端新增可空简介字段；无新依赖。

## Goals

- 顶部「地点浏览」改为「地点选择」下拉（景点 / 酒店和餐厅），选择即进入对应类型页面。
- 酒店与餐厅合并为一个页面，由页面内「酒店」「餐厅」两个 tag 切换；列表与地图合并进同一个外框。
- 类型状态由 URL `?type=` 承载，刷新与前进/后退保持；页内类型下拉入口全部移除。
- 酒店与餐厅默认展示激活行程城市全量列表；「离景点最近」锚点筛选保留为可选。
- 地点卡片按截图重构：封面叠层标签、右下角评分徽标、标题、简介、右下角「Day 1 +」。
- 简介来自后端可空字段；卡片、详情弹窗与地图详情卡统一取值与回退。

## Non-goals

- 新增或重排其他主导航项。
- 为宠物医院/宠物用品店新增导航入口。
- 管理端简介编辑界面、AI 生成简介或高德实时补拉。
- 改变 5km 半径、Haversine、距离排序、宠物友好筛选与分页语义。
- 改变地图加载、列表/地图联动、行程保存、行程单与导出。
- 新增押金、清洁费等卡片字段或多选 chips。

## Decisions

### D1 导航下拉结构与可访问性

- 保留 `Tabs` 与 `TabsList` 承载首页、我的宠物、城市浏览、交通规则、我的行程与管理项；移除 `attractions` 的 `TabsTrigger`。
- 为保持同一条胶囊导航容器，新增外层容器承载背景与阴影，`TabsList` 改为透明无内边距；「地点选择」`Select` 作为 `TabsList` 的兄弟节点放在同一容器内，避免把 combobox 嵌进 `role="tablist"`。
- `SelectTrigger`：
  - `aria-label="地点选择"`，可见文案固定为「地点选择」，右侧保留 chevron。
  - 处于 `/attractions` 时使用与激活 Tab 相同的深色胶囊样式；其他页面保持普通胶囊。
  - 高度与左右内边距沿用 `navPillClass`（`px-4 py-2 text-sm rounded-full`）。
- `SelectContent` 选项固定为「景点」与「酒店和餐厅」两项（值 `attraction` / `lodging`）；`/attractions` 下按当前类型显示勾选，`hotel` 与 `restaurant` 均视为「酒店和餐厅」。
- `onValueChange`：
  - `attraction` → `navigate({ to: "/attractions" })`（不写 `type`）。
  - `lodging` → `navigate({ to: "/attractions", search: { type: "hotel" } })`；进入合并页的酒店 tag。餐厅由页面内 tag 切换，导航下拉不再提供独立入口。
- `activeTab` 在景点路径下不再返回 `attractions`（无对应 Tab），改为空值，避免无 trigger 的激活值；其余 Tab 行为不变。
- 否决：在 `TabsList` 内直接放 `Select`（tablist 内混入 combobox，ARIA 语义不正确）；用 Popover 手写菜单（需重复键盘与选中态逻辑，`Select` 已具备）。

### D2 URL 类型状态与页面查询

- 路由：
  ```ts
  validateSearch: (search: Record<string, unknown>) => {
    const type = search.type;
    return type === "hotel" || type === "restaurant" ? { type } : {};
  }
  ```
  非法或未知值不报错，按景点处理，也不会写回 URL。
- 页面：`const { type: typeParam } = Route.useSearch(); const typeGroup = typeParam ?? "attraction";`
- 删除组件内 `typeGroup` state 与 `setTypeGroup`；类型切换只通过导航发生。
- 类型变化副作用：`activeKeytag = null`、`page = 1`；激活行程城市、搜索词、锚点与「显示全部地点」保持。
- 激活行程变化：清空锚点、chip、搜索词与页码；类型由 URL 保持，不重置。
- `locationTypesQueryOptions` 仅用于字典与后端 type codes；导航选项与顺序由前端常量固定，确保恰好三项。
- `TYPE_LABELS` 作为页面标题与卡片类型文案来源，`hotel` 显示「酒店」（不使用类型目录的「住宿」）。

### D3 门禁移除与锚点保留

- Delta 以 `RENAMED Requirements` 将语义已反转的「餐厅的选择门禁」更名为「酒店与餐厅的默认列表与可选锚点」，并在同名 MODIFIED 块保留原有 4 个场景名。
- 删除 `gated`（`nearbyType && anchorPoiId === null`）及全部引用：查询 `enabled`、加载判断、空态、地图占位、分页条件。
- 酒店/餐厅未选锚点：请求 `{ regionCode, typeGroup, petFriendlyOnly, page }`，展示城市全量列表。
- 选中锚点：请求 `{ ..., nearPoiId }`，服务端 5km 过滤、距离升序与 `distanceMeters` 不变。
- 清除锚点：`anchorPoiId = null`、`page = 1`，恢复全量。
- 酒店/餐厅共用 `anchorPoiId`；两类切换保留锚点并重置页码。
- 锚点候选不存在或激活行程变化：清空锚点并恢复全量；不再出现「餐厅门禁空态」。
- 移除 `enterNearbyLocations` 与 `backToAttractions`；景点页不再显示「选择住宿/餐厅」。
- 空态文案按类型生成：`该城市暂无已保存酒店` / `该城市暂无已保存餐厅`；锚点激活时保留「该锚点 5km 内暂无…」。

### D4 页头与工具栏重排

- 第一行：`h1` 标题（景点/酒店/餐厅）+ 右侧搜索框（`aria-label="搜索地点"`，placeholder「搜索...」，圆角胶囊）；酒店与餐厅类型在标题下方增加「酒店」「餐厅」tag 组（`aria-label="地点类型"`），当前类型为深色激活态，点击 tag 以搜索参数导航，保留城市/锚点/搜索词并重置页码。
- 第二行：keytag chips 横向滚动；激活 chip 使用琥珀浅底（`bg-paw-accent-soft text-paw-accent-strong`）或截图中的浅黄底，未激活为描边胶囊。
- 景点类型：保留「显示全部地点」复选框，置于 chips 同行或下一行的次要位置；`petRulesApply` 才显示。
- 移除：页内「地点类型筛选」下拉、「返回景点选择」、「选择住宿/餐厅」；酒店/餐厅类型只保留两个 tag。
- 保留：`PolicySubjectNotice`、分页控件、`data-testid="location-list"` 与 `attractions-layout` 网格。

### D5 卡片结构、叠层标签与操作

卡片容器：

- 保留根 `Card` 的 `data-slot="card"`、`role="button"`（有 `onLocate` 时）、键盘 Enter/Space、`onClick={onLocate}`、`highlighted` 边框。
- 视觉：`rounded-[14px] border border-[#E8E8E8] bg-card p-2.5 shadow-[0_2px_8px_rgba(38,31,18,0.04)]`，纵向间距 `gap-2.5`。

封面区（相对定位）：

- `LocationCover` 改为 `aspect-[4/3] rounded-[10px]`（截图卡片接近 4:3；替换原 `aspect-[2.3]`）。
- 左上叠层（`absolute left-2 top-2 flex flex-wrap gap-1`）：
  - `PetFriendlyBadge` 新增 `tone="overlay"`：琥珀底 + 深色字（`bg-[#F6C445] text-[#5A3B00]`），文案保持「宠物友好 / 禁止携带 / 未配置 / 不限宠物」。
  - `keytag` 标签：半透明白底 + 深色字（`bg-white/85 text-paw-ink backdrop-blur-sm`），`text-[11px] h-5 px-2 rounded-full`；`keytag` 为空时不渲染。
  - 截图中的第二个地点标签（如「户外区域」）在当前数据模型没有独立字段，不从类型或地址臆造；仅当 `keytag` 存在时展示一个地点标签。
- 右下角评分：`LocationRating` 新增 `variant="badge"`：
  - 琥珀胶囊（`bg-paw-rating text-white`），星标 + 数值，`h-6 px-2 text-xs rounded-full`，位于 `absolute bottom-2 right-2`。
  - 评分缺失或非法时整个徽标不渲染。
  - 保留 `data-testid="location-rating"`。
- 左下叠层政策要求标签（`absolute bottom-2 left-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-1`，宽度为右下评分留位）：
  - `noteParts`（「公共区域需牵引」「需疫苗证明」「需提前预约」）：半透明白底 + 灰色字，`h-5 text-[11px] px-2 rounded-full bg-white/85 backdrop-blur-sm`。
  - `limitTags`（超重/超肩高）：保留 `text-destructive` 与描边，叠加 `bg-white/85 backdrop-blur-sm` 保证图上看清。

正文：

- 标题行：名称 `text-[15px] font-semibold leading-6 text-paw-ink`，单行截断；右侧保留已加入行程的「第 N 天」深色小标签。
- 简介：`location.description ?? location.address ?? "地址未收录"`，`line-clamp-2 text-xs leading-5 text-[#8A8A8A]`；不再单独渲染地址行。
- 距离：锚点激活且有 `distanceMeters` 时，在简介下展示「距{锚点名}约 X.Xkm」（`text-xs text-muted-foreground`）。
- 宠物适住标签：`PolicyTags`（如「豆豆 · 友好」）放在简介下的紧凑标签行；`noteParts` 与 `limitTags` 已移至封面，MUST NOT 在正文重复。
- 移除原「keytag + 评分」独立行（评分移至封面，keytag 移至封面叠层）。

底部操作：

- `mt-auto flex items-center justify-between gap-2`，`onClick` 阻止冒泡。
- 左侧保留低强调文字按钮「查看详情」（`Button variant="ghost" size="sm"`，`text-xs`），用于打开详情弹窗并维持既有 E2E 可访问名；截图未展示该按钮，属于为保留详情能力与无障碍入口的最小偏差。
- 右侧 `DaySelect` 紧凑形态（见 D6）。
- 保留 `查看详情`、`添加到行程` 可访问名与操作回调。

### D6 DaySelect 紧凑形态

- `DaySelect` 新增 `variant?: "default" | "compact"`，卡片使用 `compact`。
- 触发器：
  - 深色胶囊：`h-7 rounded-full bg-[#0A0A0A] px-3 text-xs font-medium text-white`。
  - 可见文案：`Day 1` + `Plus` 图标（不显示 `CircleFadingPlus`）。
  - `aria-label` 仍为「添加到行程」；`title` 在行程已结束时提示只读。
- 展开内容不变：第 1..N 天与「暂不排期」。
- 详情弹窗与地图卡继续使用默认白底胶囊样式。

### D7 简介数据契约与回退

- 表与迁移：
  - `pawtrip_location` 增加 `description TEXT`（可空）。
  - `V31__add_location_description.sql` 仅新增列与种子 UPDATE；不建索引、不改约束。
- 后端：
  - `PawtripLocation.description` + getter + `updateDescription`（测试夹具用）。
  - `LocationSummary` 与 `LocationDetail` 增加 `description`；`from(...)` 透传。
  - 不新增管理端写入接口。
- 前端：
  - `LocationSummary.description: string | null`；`LocationBrowseDetail.description?: string | null`。
  - 新增 `locationDescription(location)` 纯函数（`lib/location-summary.ts`）：`description ?? address ?? "地址未收录"`；卡片、详情弹窗与地图卡共用。
- 详情弹窗：`DialogDescription` 下增加简介段落（`text-sm text-muted-foreground`），类型与地址行保留。
- 地图详情卡：标题/类型行下增加简介行，再展示照片、地址、营业时间与电话。
- 种子：珠海演示与 E2E 夹具补文案；`B02F400HUL` 只保留一条简介，使用截图口径「沿着林间小径慢慢走，和毛孩子一起享受山海绿意。」；删除 `V31` 中第二条重复 UPDATE。
- 回退：简介为空即展示地址；地址也为空展示「地址未收录」；无外部请求。

### D8 测试与回滚

- E2E 辅助：
  - `openAttractions` 改为点击「地点选择」下拉并选择「景点」；或直接访问 `/attractions`。
  - 类型切换：酒店/餐厅改为先选「酒店和餐厅」，再用页内 tag 切换；激活态断言改为页面标题、tag 或下拉当前项。
  - `NAV_TABS` 与导航文案数组更新为「地点选择」。
- E2E 断言：
  - 酒店/餐厅未选锚点直接出现列表，无门禁空态。
  - 选中锚点后仍为 5km 列表，清除后恢复全量。
  - 卡片简介展示；`description` 为空时展示地址。
  - 紧凑 `DaySelect` 仍可通过 `combobox` 名「添加到行程」添加。
- 单测：
  - `locations-browsing.test.ts` 查询键/URL 不变。
  - 简介回退纯函数；导航 `validateSearch` 白名单（如新增路由测试）。
- 回滚：
  - 导航恢复 `TabsTrigger`「地点浏览」，页面恢复页内类型控件与门禁；`description` 列保留为可空，不删列、不回填。
  - 卡片恢复原结构；`description` 字段可继续由后端返回，前端忽略。

### D9 酒店/餐厅合并页与列表-地图同框

- 类型分组不变：URL 仍用 `?type=hotel` / `?type=restaurant`，页面内 derive `typeGroup`；导航下拉的 `lodging` 只是入口聚合，避免新增路由。
- 页内 tag：复用 `Tabs`（`value={typeGroup === "attraction" ? "" : typeGroup}`），`onValueChange` 调用 `navigate({ to: "/attractions", search: { type } })`；仅 `hotel`/`restaurant` 渲染 tag 组，景点类型不渲染。
- 城市、锚点、关键词与「显示全部地点」由现有 state 保持；`typeGroup` 变化的既有副作用已重置页码与 keytag，公寓切换不新增逻辑。
- 布局：外层网格保持 `[trip 面板][合并区]`；合并区为一张 `section`，跨原第 2–3 列（展开代理时保留占位列），内部 `flex`：列表左、地图右。
  - 容器统一 `rounded-[22px] border border-[#E8E8E8] bg-card shadow-sm overflow-hidden`；列表头部与工具栏内边距在此容器内。
  - 列表 `min-w-0 flex-1 overflow-y-auto`，保持 `data-testid="location-list"`；地图区 `w-full shrink-0 p-3`，小屏堆叠于列表下方，大屏 `lg:h-full lg:w-[36%]`，保持 `data-testid="attractions-map"`。
  - 地图区不再画分隔线；`LocationMap` 使用默认 `rounded-xl border bg-muted/30`（只传高度），因此地图在外框内上下左右均留出 `p-3` 间距，右缘不与外框贴齐。
  - 地图详情卡改为在地图区内绝对定位，不再独立带外框。
  - 地图占位符保持 `location-map-placeholder`；布局 E2E 断言改为「右缘距外框约 12px」。
  - 代理面板展开时合并区收窄但地图宽度按百分比收缩；代理占位列不并入合并外框。

## 视觉规格（按截图）

| 元素 | 规格 |
|---|---|
| 导航胶囊容器 | `rounded-full bg-card p-1.5 shadow-md`，项间距 `gap-1` |
| 导航项 | `rounded-full px-4 py-2 text-sm`；激活深色底、浅色字 |
| 列表标题 | `text-2xl leading-8 font-medium`，与搜索框同一行 |
| 搜索框 | 高 36px 圆角胶囊，左侧放大镜，宽约 210px |
| chips | 高 32px 圆角胶囊；激活浅琥珀底，未激活描边 |
| 卡片 | 约 `rounded-[14px]`，白底细描边，内边距 10px，双列网格 |
| 封面 | 约 4:3，圆角 10px，`object-cover` |
| 叠层标签 | 高 20px，`text-[11px]`；宠物友好琥珀底，keytag 半透明白底 |
| 评分徽标 | 高 24px 琥珀胶囊，右下角，星标 + 一位小数 |
| 标题 | 15–16px，semibold，单行截断 |
| 简介 | 12–13px，灰色，两行截断 |
| Day 按钮 | 高 28px 深色胶囊，白字「Day 1」+ plus，右下角 |

## Migration

- Flyway `V31` 增加可空列；既有行保持 `NULL`，前端回退地址。
- 种子文案仅影响演示与 E2E 数据；E2E 运行器使用临时数据库执行全量迁移。
- 无写接口与权限变更；无需数据回填。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| 导航从 Tab 变为下拉，破坏既有 E2E | 同步更新 4 个 spec 的导航辅助与文案断言；其余 Tab 不动 |
| `Tabs` 无对应 trigger 的激活值 | 景点路径下 `activeTab` 置空；下拉自身按路径显示激活样式 |
| 移除门禁后空数据直接暴露 | 保留加载/空态文案；无已排期景点时锚点下拉禁用并提示 |
| 截图无「查看详情」但需保留详情能力 | 使用低强调 ghost 文字按钮；保留可访问名，后续如确认可改为卡片点击 |
| 截图第二个地点标签无数据来源 | 仅展示 `keytag`；不臆造「户外区域」等标签 |
| 评分位置与原实现不同 | 评分徽标固定封面右下；保留 `location-rating` 测试标识 |
| 简介为空的旧数据 | 前端统一回退地址；不触发外部请求 |
| `V31` 重复更新同一 POI | P4 删除第二条 UPDATE，保留截图口径 |
| 当前分支半成品不可编译 | P4 一次性收敛 `setTypeGroup`/`gated` 后再验证 |

## Open Questions

- 无。P1 的 8 个 OQ 已全部 resolved；本设计仅落实展示与实现细节。
