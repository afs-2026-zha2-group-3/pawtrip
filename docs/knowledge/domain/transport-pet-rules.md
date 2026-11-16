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

每条规则含四个基础维度，页面基础列顺序固定：方式、能否携带、体重上限、容器要求、办理流程概要。

| 字段 | 语义 |
|------|------|
| `allowanceStatus` | 状态标识唯一数据源：`allowed`（可携带）/ `conditional`（有条件）/ `not_allowed`（不可）；页面不得按方式硬编码 |
| `allowanceNote` | 有条件/不可时的补充说明（如短鼻品种不承运） |
| `weightLimitKg` | 数值上限；`null` 表示无统一限制（如自驾），页面显示「无统一限制」 |
| `transportForm` | `checked`（托运）/ `cabin`（客舱）/ `isolated_checked`（隔离托运）/ `self`（自驾） |
| `extra` | 扩展列取值字典；当前含 `quarantineRequirement`（检疫证明列） |

## 当前 8 条记录与来源

| id | 方式 | 承运方 / 形态 | 体重上限 | 状态 | 已复核 |
|----|------|---------------|----------|------|--------|
| `flight-ca-checked` | 飞机 | 中国国际航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-mu-checked` | 飞机 | 中国东方航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-cz-checked` | 飞机 | 中国南方航空 / 托运 | ≤32 kg | conditional | 2026-11-16 |
| `flight-hu-checked` | 飞机 | 海南航空 / 托运 | ≤32 kg | conditional | 待复核 |
| `flight-hu-cabin` | 飞机 | 海南航空 / 客舱 | ≤5 kg | conditional | 待复核 |
| `high-speed-rail-isolated` | 高铁 | 国铁「爱宠行」/ 隔离托运 | ≤15 kg（肩高 ≤40 cm、身长 ≤52 cm） | conditional | 2026-11-16 |
| `train-baggage` | 火车 | 铁路行包托运 | ≤20 kg | conditional | 待复核 |
| `drive-self` | 自驾 | 自行携带 | 无统一限制 | allowed | 待复核 |

来源清单（与常量 `sourceUrl` / `sourceTitle` 一致）：

1. 国航：作为行李托运的小动物 — `https://m.airchina.com.cn/c/invoke/xlxxnext/xlxxnext8@pg`
2. 东航：小动物运输服务须知 — `https://www.ceair.com/global/static/Announcement/TravelTips/SpecialPassengerServiceNotice/LittleAnimal/`
3. 南航：小动物运输 — `https://www.csair.com/sg/zh/tourguide/luggage_service/checked_luggage/live_animals/`
4. 海南航空：宠物托运 — `https://www.hnair.com/lvxingxinxi/tsgh/tyxdw/`
5. 海南航空：客舱运输宠物规定 — `https://www.hnair.com/adnews/cwkcgafu/`
6. 国铁集团：高铁宠物托运「爱宠行」服务 — `http://wap.china-railway.com.cn/xwzx/zhxw/202604/t20260409_155381.html`
7. 铁路旅客禁止、限制携带和托运物品目录（12306）— `https://mobile.12306.cn/otsmobile/h5/otsbussiness/info/prohibitedGoods.html`
8. 自驾携宠出行注意事项（通用汇编）— `https://m.pcauto.com.cn/wenda/4656385.html`

## 维护约定

- 规则为**人工摘录**自官方渠道，发布前须逐条复核来源；`verifiedOn` 为空表示未复核，页面显示「待复核」标记，且合并前必须补齐（缺一不得合并）。
- 更新规则 = 修改常量文件 + 更新 `verifiedOn`，无需改页面；新增列 = 在 `extra` 加键 + 在列配置加一项。
- 页面与知识库均以承运方最新规则为准，不提供「推荐 / 符合 / 不适合」判定，也不提供站内订票。
- 宠物档案与规则的实际比对属于后续能力（US-06），规则目录本身不读取用户档案。
