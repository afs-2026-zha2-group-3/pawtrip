---
id: kb.domain.transport-pet-rules
title: 交通携宠规则目录（规则对比页数据）
area: domain
---

# 交通携宠规则目录

交通携宠规则属于**前端常量**，不依赖后端接口与第三方实时查询。唯一真源是
`apps/web/src/data/transport-rules.ts`；页面
`apps/web/src/routes/_authenticated/transport-rules.tsx` 只通过导出函数取数
（`getRulesByMode` / `getFlightRules` / `getRuleForMode` / `getRuleById`），
常量数组 `transportRules` 不外泄。

- 能力规格：`openspec/specs/transport-rules-catalog/spec.md`、`openspec/specs/transport-rules-comparison-page/spec.md`
- 需求来源与复核证据：`openspec/changes/transport-pet-rules-comparison/deep-dive.md`（D1–D8）
- 列扩展约定：页面列配置 `transportRuleColumns`（`key`/`label`/`render`），扩展列取值来自 `rule.extra`

## 规则维度

每条规则含四个基础维度；页面列顺序为：选择（单选控件）→ 方式 → 是否推荐（有档案时）→ 能否携带 → 体重上限 → 容器要求 → 办理流程概要 → 检疫证明。

| 字段 | 语义 |
|------|------|
| `allowanceStatus` | 状态标识唯一数据源：`allowed`（可携带）/ `conditional`（有条件）/ `not_allowed`（不可）；页面不得按方式硬编码 |
| `allowanceNote` | 有条件/不可时的补充说明（如短鼻品种不承运） |
| `weightLimitKg` | 数值体重上限；`null` 表示无统一限制（如自驾），页面显示「无统一限制」 |
| `shoulderLimitCm` | 数值肩高上限；`null` 表示无统一限制；当前仅高铁为 40 cm |
| `transportForm` | `checked`（托运）/ `cabin`（客舱）/ `isolated_checked`（隔离托运）/ `self`（自驾） |
| `extra` | 扩展列取值字典；当前含 `quarantineRequirement`（检疫证明列） |

## 当前 8 条记录与来源

| id | 方式 | 承运方 / 形态 | 体重上限 | 状态 | 已复核 |
|----|------|---------------|----------|------|--------|
| `flight-ca-checked` | 飞机 | 中国国际航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-mu-checked` | 飞机 | 中国东方航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-cz-checked` | 飞机 | 中国南方航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-hu-checked` | 飞机 | 海南航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-hu-cabin` | 飞机 | 海南航空 / 客舱 | ≤5 kg | conditional | 2026-11-16 |
| `high-speed-rail-isolated` | 高铁 | 国铁「爱宠行」/ 隔离托运 | ≤15 kg（肩高 ≤40 cm、身长 ≤52 cm） | conditional | 2026-11-16 |
| `train-baggage` | 火车 | 铁路行包托运 | ≤20 kg | conditional | 2026-11-16 |
| `drive-self` | 自驾 | 自行携带 | 无统一限制 | allowed | 2026-11-16 |

来源清单（与常量 `sourceUrl` / `sourceTitle` 一致）：

1. 国航：作为行李托运的小动物 — `https://m.airchina.com.cn/c/invoke/xlxxnext/xlxxnext8@pg`
2. 东航：小动物运输服务须知 — `https://www.ceair.com/global/static/Announcement/TravelTips/SpecialPassengerServiceNotice/LittleAnimal/`
3. 南航：小动物运输 — `https://www.csair.com/sg/zh/tourguide/luggage_service/checked_luggage/live_animals/`
4. 海南航空：宠物托运 — `https://www.hnair.com/lvxingxinxi/tsgh/tyxdw/`
5. 海南航空：客舱运输宠物规定 — `https://www.hnair.com/adnews/cwkcgafu/`
6. 国铁集团：高铁宠物托运「爱宠行」服务 — `http://wap.china-railway.com.cn/xwzx/zhxw/202604/t20260409_155381.html`
7. 铁路普速列车宠物托运口径（北青报转述国铁集团/95572）— `http://railway.china.com.cn/2025-04/09/content_117813396.shtml`
8. 《道路交通安全法实施条例》第六十二条（不得有妨碍安全驾驶的行为）— `https://jtgl.beijing.gov.cn/jgj/jgxx/flfg/xzfg/119781/index.html`

## 档案判定与交通方式缓存

判定是前端纯函数 `apps/web/src/data/transport-rule-match.ts` 的 `evaluateRuleForPet(rule, pet)`，规则仍以前端常量为唯一真源；档案由 `GET /api/pets`（`apps/web/src/queries/pets.ts`）读取，后端不复制规则阈值。

判定条件（同时满足才算「推荐」）：

1. `allowanceStatus !== "not_allowed"`；
2. 存在 `weightLimitKg` 时，`pet.weightKg <= weightLimitKg`；
3. 存在 `shoulderLimitCm` 时，`pet.shoulderHeightCm <= shoulderLimitCm`；
4. `pet.hasVaccinationProof === true`（八条规则均要求检疫证明，属硬条件）。

不满足原因按「体重 → 肩高 → 检疫证明」顺序全部列出；阈值为 `null` 表示该维度无限制，跳过该维度；`hasLeash` 不参与判定（“带牵引绳”与规则的容器/口套要求不是同一维度）。页面逐只宠物显示结论；无档案时不渲染该列，并显示「新增宠物档案」按钮——点击跳转 `/paws`（该页目前为空壳，档案表单由后续 change 落地）。

交通方式选择契约（供后续行程单消费）：

| 项 | 值 |
|----|----|
| 存储 | `sessionStorage`（关闭标签页即失效） |
| 键 | `pawtrip:selected-transport-mode` |
| 取值 | `flight` / `high_speed_rail` / `train` / `drive` |
| 写入方 | 规则页「选择」列单选控件（互斥，一次一种） |
| 读取方 | 当前仅规则页回显；行程单页面待接入 |
| 非法值 / 不可用 | 丢弃缓存值、按未选中渲染，不报错 |

- 能力变更证据：`openspec/changes/add-rule-recommendation-and-selection/`（design D1–D8）

## 维护约定

- 规则为**人工摘录**自官方渠道，发布前须逐条复核来源；`verifiedOn` 为空表示未复核，页面显示「待复核」标记，且合并前必须补齐（缺一不得合并）。
- 当前 8 条规则复核日期均为 `2026-11-16`（经需求方授权由 Agent 按官方页面摘要比对，记录见 `docs/ai4se-plugins/20261116-124503-local-verify-report.md`「规则复核闭合」）。其中火车行包引国铁集团公开口径（媒体转述），自驾引《道路交通安全法实施条例》第六十二条（自驾无承运方规则）；其余为承运方官方页面。
- 海航客舱的基础费不写具体金额：承运方未在可核页面公布固定值，只写「以航司公布标准为准」，避免数字过期误导。
- 更新规则 = 修改常量文件 + 更新 `verifiedOn`，无需改页面；新增列 = 在 `extra` 加键 + 在列配置加一项。
- 页面与知识库均以承运方最新规则为准，不提供站内订票。
- 规则目录本身不保存用户选择；「选择」列的选中值只写入浏览器 `sessionStorage`（见上节）。
