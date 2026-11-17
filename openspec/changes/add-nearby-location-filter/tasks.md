# Tasks

## 1. 后端附近筛选查询

- [x] 1.1 在 `LocationQueryController` 为 `GET /api/locations` 接入可选 `nearPoiId`，并传给 `LocationQueryService`；验证未登录仍为 `401`、未带参数请求的现有 API 测试全部通过。
- [x] 1.2 在 `LocationQueryService` 实现锚点校验（存在、`typeGroup=attraction`、经纬度非空）、Haversine 计算、`≤5000m` 过滤、距离升序/`id` 升序排序与过滤后分页，并在 `LocationSummary` 增加 `distanceMeters`；新增 API 测试覆盖 5km 内、5km 外、恰好 5000m、无坐标候选排除、排序、距离字段和过滤后 `totalElements`/`hasNext`。
- [x] 1.3 在 `PawtripLocationRepository` 增加按区域/类型/`petFriendlyOnly` 读取候选集合的查询，保留现有 `findLocationPage` 供未带锚点路径使用；用 API 测试验证区域前缀、类型、宠物友好与距离筛选的组合。
- [x] 1.4 补齐锚点非法场景测试（不存在、非景点、无坐标返回 `400 VALIDATION_ERROR`）、未带 `nearPoiId` 的回归测试，以及“不调用高德”的断言；在 `apps/server` 运行 `./mvnw test` 验证通过。
- [x] 1.5 更新 `docs/knowledge/architecture/README.md` 的地点 API 说明，记录 `nearPoiId`、`distanceMeters`、固定 5km 与服务端排序/分页语义；核对文档描述与实现和测试一致。

## 2. 前端锚点选择与门禁

- [x] 2.1 从激活行程的 `plan.days[].stops` 与地点详情查询派生锚点候选：仅 `typeGroup=attraction`、按 `poiId` 去重、排除 `unscheduled`；缺失详情复用现有 `locationBrowseDetailQueryOptions`，并处理加载/失败态；新增单测覆盖候选过滤、去重与未排期排除。
- [x] 2.2 在“酒店”类型下增加“离景点最近”下拉与清除操作，酒店列表默认展示全部已保存酒店；在“景点”类型下保留“行程景点锚点”选择器供餐厅筛选使用；由 E2E 覆盖酒店默认列表、下拉过滤、空候选禁用与景点列表不受影响。
- [x] 2.3 为餐厅增加未选锚点门禁：不发起餐厅列表请求，展示“请先在景点页选择行程景点”空态与返回“景点”类型入口；酒店不因未选锚点门禁；由 E2E 覆盖门禁、酒店默认列表与宠物医院/用品店不受影响。
- [x] 2.4 让酒店下拉与景点页选择器共用锚点，两类之间切换保留锚点并重置页码；锚点景点被移出行程或激活行程变化时自动清除锚点；由 E2E 覆盖共用、酒店恢复全量、餐厅恢复门禁。

## 3. 前端距离查询与展示

- [x] 3.1 扩展 `LocationListParams`、查询 key 与 URL，加入 `nearPoiId`；仅餐厅/酒店在已选锚点时传入，其他类型不传；新增查询单测验证 URL、key 与参数组合。
- [x] 3.2 在距离筛选结果的卡片上显示“距{锚点名}约 X.Xkm”（一位小数），并保留既有“第 N 天”标识；由 E2E 覆盖格式与共存。
- [x] 3.3 处理 5km 内无结果、锚点无坐标和候选详情加载失败等状态，确保不把无坐标地点当作 0 距离；后端 API 测试覆盖锚点无坐标与候选无坐标，E2E 覆盖无坐标锚点提示。
- [x] 3.4 验证距离筛选与宠物友好/显示全部地点、类型和分页仍是 AND 关系，且页码在锚点/类型变化时重置；在 `apps/web` 运行 `npm test` 与 `npm run build` 验证通过。

## 4. E2E 夹具与端到端

- [x] 4.1 更新 `scripts/seed-e2e-attractions.mjs`：为既有地点写入可控经纬度，并新增 5km 内/外餐厅与酒店夹具；验证种子脚本可重复执行且既有地点浏览 E2E 通过。
- [x] 4.2 新增 E2E 覆盖：酒店默认展示全部列表；“离景点最近”选择已排期景点后只显示 5km 内酒店、按距离升序并显示距离；餐厅未选锚点门禁且无列表请求；酒店选择的锚点与餐厅共用；锚点被移出行程后酒店恢复全量、餐厅恢复门禁；宠物友好/显示全部地点叠加；无已排期景点时下拉禁用提示。
- [x] 4.3 运行受影响 E2E 套件（地点浏览、行程面板、类型筛选相关），确认距离筛选未破坏既有详情弹窗、加入行程与分页行为。
- [x] 4.4 新增 V20 珠海测试酒店/餐厅迁移（含宠物政策与 5km 内外样本），V21 将坐标/名称/地址修正为真实 POI 数据；在开发库验证默认展示 6 家宠物友好酒店、4 家宠物友好餐厅；验证后端全量测试通过。

## 5. 集成验证

- [x] 5.1 串行运行 `npm run test:e2e -- e2e/attraction-pet-rules.spec.ts e2e/trips-panel.spec.ts --workers=1`，确认锚点、门禁、距离筛选与既有流程端到端通过。
- [x] 5.2 运行后端 `./mvnw test`、前端 `npm test -w apps/web` 与 `npm run build -w apps/web`，修复本 change 引入的失败并记录验证结果。
- [ ] 5.3 按仓库流程补全 P3 验证与 G1/G2/G3 记录；P3 文档（`dov-ac-review.md`、`atdd-design.md`、`alignment-self-check.md`）与本地验证报告（`docs/ai4se-plugins/20261117-130447-local-verify-report.md`）已补齐；G1 Pass 已记录（IO=SUKI、SA=RANLE，2026-11-17）；G2/G3 由对应角色签署，不由实现者代签。
