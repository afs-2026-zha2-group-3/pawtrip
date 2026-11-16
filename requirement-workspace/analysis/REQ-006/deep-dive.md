# Deep-dive — REQ-006 选择目的地

- 日期：2026-11-16
- 上游：[impact-brief.md](impact-brief.md)（方向 add，触发 Phase 2.5）
- 模式：主动 probing；业务决策均已由需求方确认，未知数据值标 `{TBD}`，不臆造

## ① 数据契约

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| 城市政策收录状态 | 城市（`administrative_region.adcode`，level=city 或直辖市省级叶节点） | adcode、policy_covered（布尔）、pilot（是否试点候选） | 未收录 → 已收录（种子/后续维护）；不回退 | PR #32 方向（政策挂行政区）+ 需求方决策 2026-11-16 |
| 禁养犬种名单条目 | 城市 × 品种 | region_adcode、breed_name（与档案品种同一词表）、source（政府文件名）、updated（摘录年月） | 静态种子，无生命周期 | 原型 CITIES.banned/source/updated 口径；珠海/杭州具体名单 `{TBD}`（实现期政府文件摘录，deferred 数据任务） |
| 宠物档案（外部依赖，只读消费） | 用户维度（grain 以外部 change 为准） | 本 change 仅消费 breed（品种，可空/「其他」）；**契约要求**：breed 枚举与禁养词表一致、提供当前用户档案读取接口 | 创建/编辑由外部 change 定义，本 change 不关心 | G1 Revision 2026-11-16：US-01 change 交付（现远端 `feature/add-pet-schema` 仅 schema，无 breed/接口/页面） |
| 已选目的地（客户端状态） | 浏览器（localStorage） | adcode、city_name、selected_at | 未选 → 选定 → 重选覆盖；登出清除 | 需求方决策 2026-11-16（前端本地存储 + 登出即清除） |

品种词表约束（对外部档案 change 的契约要求）：档案品种枚举与禁养名单使用**同一词表**（原型 BREEDS：柯基/金毛寻回犬/拉布拉多/泰迪/柴犬/边境牧羊犬/比熊/比特犬/日本土佐/其他）；若珠海/杭州官方名单出现词表外品种，需与对方协调扩充枚举后再摘录，保证精确匹配可命中。

## ② 边界归属

| rule | branch | in/out | rationale |
|---|---|---|---|
| 禁养判定 | 档案品种精确命中名单 → 命中 | in | AC-4；列表 Badge + 选定确认高亮 |
| 禁养判定 | 无档案 / 品种空 / 品种=「其他」 | in（不触发判定） | 原型口径；无档案时筛选退化为仅按收录状态 |
| 禁养判定 | 城市政策未收录 | in（不触发判定） | 原型口径 |
| 禁养判定 | 别名/混血/模糊匹配 | out | 原型明确不支持 |
| 宠物友好筛选 | 开启：covered 且未命中 | in | AC-2 原型口径（已确认） |
| 宠物友好筛选 | 关闭：全部试点候选 | in | 原型 dest-1 |
| 搜索 | 关键字匹配城市名/省份；无结果 → 空态提示 | in | AC-1 + 原型空态 |
| 搜索 | 空关键字 → 全部试点候选 | in | 原型默认态 |
| 档案表单输入完整性 | type/breed 校验与保存行为 | out | G1 Revision：档案表单由外部 change（US-01）交付 |
| 选定 | 命中禁养仍可选定，提醒持续 | in | 原型 dest-3；不阻断 |
| 选定 | 候选范围外城市（非试点） | out | 候选=珠海+杭州（已确认） |
| 登出 | 清除 localStorage 已选目的地 | in | 需求方确认 2026-11-16；与登出清 Query 缓存一致 |
| 政策条文展示/维护 | 全部 | out | #14 承接 |
| 完整档案字段（体型/体重/年龄/性格） | 全部 | out | US-01 承接 |
| 服务端持久化选定目的地 | 全部 | out | 已确认前端存储 |

## ③ 跨 REQ 一致性

| capability | per-REQ grain+fields | aligned? | anchor |
|---|---|---|---|
| 宠物档案 | REQ-006：只读消费 breed；US-01（外部 change，`feature/add-pet-schema` 进行中）：档案表/字段/接口/页面 | ⚠ 待对齐：对方现 schema 无 breed 字段，需其补齐并保证词表一致 | 外部 change 为档案锚点，REQ-006 仅消费（G1 Revision） |
| 城市养犬政策 | REQ-006：covered 标记+禁养名单；#14（US-04，未立项）：政策条文/来源/复核+详情展示 | ✓（同挂行政区维度，字段不重叠） | REQ-006 落判定逻辑，#14 复用 |
| 应用外壳 Tab | REQ-004：Home/Paws；PR #30 代码：+Cities（spec 滞后）；REQ-006：Cities 承载目的地选择 | ✓（本 change delta 补齐 spec 事实） | web-app-shell spec |
| 携宠政策字段 | PR #32：限带/限重/牵引/疫苗/费用/预约（地点+行政区）；REQ-006：禁养名单+收录标记 | ✓（字段互补，不重叠） | V7 迁移 |

## ④ 通知 / 展示契约

| trigger or surface | recipient | content + display fields | channel | cardinality | source |
|---|---|---|---|---|---|
| 候选卡片 | 已登录用户 | 城市名、省份、「政策已收录/未收录」Badge、命中时「档案品种禁养」Badge | `/cities` 列表 | 每城一卡（2 城） | 原型 dest-1 |
| 筛选开关+计数 | 已登录用户 | 开关态、候选数、「筛选口径」说明 | `/cities` 工具栏 | 单例 | 原型 dest-1 |
| 搜索无结果 | 已登录用户 | 空态标题+建议（关筛选/换关键词） | `/cities` 列表区 | 单例 | 原型 dest-1 |
| 选定确认 | 已登录用户 | 成功提示 + 规划上下文（目的地、档案摘要、政策状态）；命中时红色禁养 Alert 持续 | `/cities` 选定视图 | 单例 | 原型 dest-3 |
| 禁养高亮提醒 | 已登录用户（品种命中） | 品种名、城市名、风险与建议文案 | 列表 Badge + 选定 Alert | 每命中城一处 | AC-4 + 原型 |
| 顶栏目的地上下文 | 已登录用户 | 当前已选城市名（未选时「目的地未选」） | 应用外壳顶栏 | 单例 | 原型 hchip；AC-3 可见性 |
| 档案必填校验 | 已登录用户 | 「类型必选」等错误提示 | `/paws` 表单（外部 change 交付，本 change 不实现） | 单例 | 原型 type-field |

## Probe log

- 2026-11-16 Q：登出时 localStorage 已选目的地是否清除？→ Confirmed：登出即清除（与 Query 缓存清理一致）。
- 2026-11-16 G1 Revision：宠物档案由外部 change（US-01）实现，本 change 只消费 → 档案契约行改为外部依赖；核查远端 `feature/add-pet-schema` 发现无 breed/接口/页面，契约缺口与进度风险已记录（阻塞 P4 实现，不阻塞规格）。顶栏 chip 确认保留。
- 其余契约由已确认决策 + 原型口径 + 既有代码约定推导，无新增阻塞问题；珠海/杭州名单具体值为 deferred 数据任务（非字段缺口）。

## DoR ⑨–⑫ 复检

- ⑨ 数据契约：4 概念均有 grain+fields+transitions；`{TBD}` 仅为种子数据值（deferred 数据任务），非字段缺口 → 通过
- ⑩ 边界枚举：含禁养判定退化分支与登出分支；档案表单校验已划归外部 change → 通过
- ③ 跨 REQ：档案对齐项标 ⚠ 待对齐（外部 breed 缺口），属外部依赖风险而非本 REQ 内部矛盾 → 通过（风险已记录）
- ⑫ 展示契约：7 个 surface 均有 trigger/recipient/content/channel → 通过

BLOCKER 数：0。
## 修订记录（2026-11-16，合并 main 后）

- 编号 REQ-005 → REQ-006（main 已将 REQ-005 用于地点宠物政策）；上文为 P1/P2 时点分析，历史口径保留。
- 数据契约修订：pilot 列与 V14 政策种子移除；候选=全部 `level='city'` 行政区；`policyCovered`/`bannedBreeds` 占位（false/空），数据源未定留 TODO。
- 状态契约修订：已选目的地 localStorage → sessionStorage（键 `pawtrip.selectedDestination`，登出清除）。
- 筛选修订：宠物友好由服务端按 `max_pets_per_person`（null 或 >=1 友好，0 排除）判定，不再依赖档案 breed；搜索亦为服务端 keyword。
- 外部依赖进展：`/api/pets` CRUD、`/api/dog-breeds`（PR #33–#36）与 `/paws` 页面（PR #40）已合并；breed 字段仍缺失，词表一致性待协调。
