# Proposal

> 上游需求：REQ-014 城市个性化推荐（按宠物喜好与性格），`requirement-workspace/requirements/REQ-014-city-personalized-recommendation.md`（ready-for-split，DoR ①–⑫ 全过，11 个 OQ 全部 resolved）。影响分析：`requirement-workspace/analysis/REQ-014/impact-brief.md`（blocker=0）；deep-dive：同目录 `deep-dive.md`（A0 Pass）。

## Why

现有 `/cities` 候选仅按名称排序，宠物友好筛选只解决「能不能去」，不解决「适不适合我家宠物」。用户最易提供的个性化信号是宠物的喜好与性格；以确定性标签匹配打分排序（如喜欢游泳→海滨城市排前），可显著提升目的地决策效率，且复用既有前端纯函数判定与单宠口径先例，改动面可控。

## What Changes

- 宠物档案新增「喜好」（固定 5 项多选：游泳/爬山/草地奔跑/城市漫步/玩雪）与「性格」（固定 3 项单选：活泼好动/温和平静/胆小敏感），均可空；数据库迁移 V26、实体/请求/响应契约扩展、服务端枚举校验（非法 → 400 VALIDATION_ERROR）、创建/编辑表单与详情展示。
- 行政区新增城市特征标签（海滨/山地/湖泊/草原/城市公园/雪景）：迁移 V27 增列并以种子维护 48 个知名旅游城市（含珠海=海滨、杭州=湖泊+城市公园；清单见需求附录 A，adcode 已核对 V5）；未标注城市为空。
- `GET /api/destinations` 响应每项新增只读 `featureTags`；既有参数、筛选与服务端名称序不变，不加排序参数。
- `/cities` 进入即呈现个性化结果：前端纯函数按第一只宠物打分（喜好命中城市特征每项 +2、性格按映射加成 +1），得分降序、同分维持名称序；得分 >0 的城市排前且卡片右上角展示「系统推荐」徽标（仅徽标，无理由文字）；未填喜好与性格、无档案或档案读取失败时维持现有名称排序、无徽标。
- 搜索、宠物友好筛选、逐宠物政策标签、选定流程行为不变（排序叠加在服务端过滤后的集合上）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `paws-page`：档案表单/详情新增喜好与性格两字段（可空、固定词表）；读写契约扩展与服务端枚举校验；既有必填校验不变。
- `destination-selection`：候选接口下发城市特征标签；候选列表按第一只宠物喜好与性格个性化打分排序；被推荐卡片右上角「系统推荐」徽标；未填/失败退化名称序。

（`city-management` 不修改：本需求无管理端界面与写 API 变化，特征数据为种子注入的只读数据层扩展，契约归入 `destination-selection`。）

## Impact

- **后端**：`pet` 表与 `Pet` 实体/`PetRequests`/`PetResponses`/`PetService`（枚举校验）；`administrative_region` 表与 `AdministrativeRegion` 实体（只读特征列）；`DestinationController.DestinationResponse` 增 `featureTags`；新迁移 V26/V27（当前最新 V25）。
- **前端**：`-pet-dialogs.tsx` 表单与详情（Checkbox 组 + Select 含「未设置」）；`queries/pets.ts`、`queries/pet-profile.ts` 类型扩展；`cities.tsx` 打分排序与徽标；新增 `lib/` 推荐打分纯函数与单测。
- **测试**：后端 pet/destinations API 测试；前端打分函数单测；`e2e/paws-pet-management.spec.ts`、`e2e/destination-selection.spec.ts` 更新。
- **依赖/系统**：无新依赖、无外部服务、无管理端改动；旧客户端不传新字段仍合法，候选接口只增只读字段，向后兼容。
- **规模评估**：M（2 个迁移、约 5 个工作切片：词表与迁移 → pet API/表单 → 特征下发 → 前端排序+徽标 → 测试与 KB）；单 change 交付，避免「档案字段无消费方 / 排序无数据源」的不可验收中间态。