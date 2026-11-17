---
id: kb.domain.city-feature-tags
title: 城市特征标签（REQ-014 个性化推荐词表与种子）
area: domain
---

# 城市特征标签

为 `/cities` 个性化推荐提供城市侧特征数据（REQ-014）。与养犬政策（`city-pet-policy.md`）相互独立：特征只影响推荐排序与「系统推荐」徽标，不参与政策判定。

- 后端常量：`com.pawtrip.server.destination.CityFeatureTags.KEYS`（只读词表，不做写入校验）
- 下发接口：`GET /api/destinations` 每项 `featureTags: string[]`（契约见 `interfaces/http-api.md`「城市特征标签」）
- 前端打分：`apps/web/src/lib/destination-recommendation.ts`（喜好映射 +2、性格加成 +1）

## 词表（design D1）

| 键 | 含义 |
|----|------|
| `COASTAL` | 海滨 |
| `MOUNTAIN` | 山地 |
| `LAKE` | 湖泊 |
| `GRASSLAND` | 草原 |
| `CITY_PARK` | 城市公园 |
| `SNOW` | 雪景 |

## 数据与种子口径

- 存储：`administrative_region.feature_tags`（可空 TEXT，逗号分隔，V27 增列）。
- 种子：V27 按 REQ-014 附录 A 为 48 城写入特征，多特征按附录 A 顺序逗号拼接（如杭州 330100=`LAKE,CITY_PARK`、阿勒泰 654300=`GRASSLAND,SNOW,MOUNTAIN`）；未列出城市保持 NULL（如韶关 440200）。
- 解析：trim/去空段/去重（保留首次出现顺序），NULL/空白 → 空数组。
- 维护：仅迁移种子；管理端 `GET/PATCH /api/admin/cities` 契约不含该字段，写路径不触碰该列。
- 宠物侧喜好/性格词表见 `interfaces/http-api.md`「宠物喜好与性格」；喜好→特征映射与性格加成规则见 REQ-014 design D6。