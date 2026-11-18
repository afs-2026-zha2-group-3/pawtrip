# Design

## Context

- 行程单 [`itinerary.tsx`](../../../apps/web/src/routes/_authenticated/itinerary.tsx) 已按 `Day` 切换，`buildItinerary` 产出当天 `stop` / `transport` 有序条目；交通方式由 `displayToNext` 推导为 `walk`、`drive` 或 `self_drive`。
- 前端已封装高德 JS API 2.0 加载器 [`loader.ts`](../../../apps/web/src/lib/amap/loader.ts)，目前只声明 `Map`、`Marker`、`InfoWindow`，地点页地图仅绘制标记点，没有路线。
- 行程缓存 `TripCache.locations`（`LocationBrowseDetail`）名称、地址、政策齐全，但**不含坐标**；坐标已存于 `pawtrip_location` 表，列表接口 `LocationSummary` 有 `longitude` / `latitude`，详情接口未下发。
- 行程单已有交通段，每段可能带 `toNextEstimate`（时长 + 费用区间）；没有快照时页面会调用既有后端估算接口。
- 高德 JS API 2.0 路线规划通过 `AMap.plugin(["AMap.Driving", "AMap.Walking"], callback)` 加载，插件 `search(origin, destination, callback)` 返回 `routes[0].distance`（米）、`routes[0].time`（秒）与 `steps[].path`；不传 `map` / `panel` 时不会自动绘制，需自行用 `AMap.Polyline` 绘制。
- 需求方明确取消天气，本次不接入 `AMap.Weather`。

## Goals / Non-Goals

**Goals:**

- 行程单当前天可一键打开路线弹窗，看到按计划顺序连接的地点路线。
- 折线形状来自高德算路，而不是两点直连；每段标注距离与时长。
- 距离与时长口径清晰：距离来自算路，时长优先与行程单已保存估算一致。
- 缺坐标、缺 Key、算路失败时页面仍可正常使用。

**Non-Goals:**

- 不做天气。
- 不做路线优化/重新排序；顺序完全跟随行程单。
- 不把路线或坐标写入 `plan_json`，不新增后端算路接口。
- 不做公交/骑行/电动车路线；`transit` 不在显示交通方式内。
- 不在 PDF/图片导出中包含地图或路线。

## Decisions

### D1：按钮放在 Day 标签行右侧，点击打开弹窗

不把按钮塞进每个 `TabsTrigger`（会产生嵌套交互元素且点击语义冲突）。在 `TabsList` 同级的右侧放一个 `Button`，文案「查看当天路线规划」，作用对象是当前 `selectedDay`。用户切换 Day 后按钮自动作用于新选中天。

弹窗使用既有 `Dialog`，标题「第 N 天路线规划」，描述带当天日期与城市。关闭弹窗不改变当前 `Day`、不触发保存。弹窗内容加 `print:hidden`，导出时不会进入打印/截图。

替代方案：行内展开地图会拉长行程单并需要导出排除逻辑；独立路由页导航成本高且与「当天」上下文分离。均不采用。

### D2：路线坐标来自地点详情，详情接口补两个可空字段

`LocationBrowseDetail` 增加 `longitude` / `latitude`，后端 `LocationDetail` 从 `PawtripLocation` 读取同名数据库字段。这样行程单已有的详情缓存可直接复用，无需额外列表请求，也不引入新的坐标接口。

坐标是数据库既有字段，接口只读，不调用高德；缺失时返回 `null`。前端不得用地址或城市中心伪造坐标。

### D3：路线段构造与方式映射

新增纯函数 `buildDayRoute(day, locations)`：

- 按 `day.entries` 顺序提取 `stop`；同一天重复 `poiId` 保留多次出现，用于编号。
- 相邻两个 stop 若 `poiId` 相同，标记为跳过，不发算路。
- 否则从两者之间的 `transport` 条目取 `displayMode`：`walk` → `AMap.Walking`，`drive` / `self_drive` → `AMap.Driving`。
- 任一端点缺坐标时进入 `missingNames`，该段不绘制；其余段照常绘制。

纯函数只负责数据整形，不接触地图实例，便于单测。

### D4：路线绘制、标注与视图

`DayRouteMap` 组件负责：

1. 用 `loadAmap()` 创建地图，容器最小高度 420px、宽度撑满弹窗。
2. 加载 `AMap.Driving` / `AMap.Walking` 插件；每个可算路段调用一次 `search`，回调中把 `steps[].path` 拼成折线路径，`new AMap.Polyline({ path, strokeColor, strokeWeight: 5 })` 绘制。
3. 地点用带序号的 `AMap.Marker`（1、2、3…）；折线用交通方式区分配色（打车/驾车与步行不同色）。
4. 每段折线在中点位置放一个 `AMap.Text`，文案为「1.2 公里 · 18 分钟」：
   - 距离 = `routes[0].distance`，小于 1000 米显示「N 米」，否则一位小数公里；
   - 时长 = 该段 `toNextEstimate.durationMinutes`；没有快照时用 `routes[0].time` 秒向上取整为分钟。
5. 全部算路结束后 `setFitView` 覆盖所有标记、折线与文本。
6. 卸载时清空 overlay、销毁地图，避免弹窗反复打开造成实例泄漏。

失败处理：单段算路失败只记录该段错误，其余段继续；弹窗内用一行提示「部分路段路线获取失败」或「路线获取失败」。未配置 Key 时显示与地点页一致的「地图未配置」占位。

### D5：状态与空态

- 当天 0 个地点：弹窗内显示「当天暂无地点」。
- 1 个地点：只显示编号标记与「当天只有一个地点，无需路线」。
- 有地点但全部缺坐标：显示「地点缺少坐标，无法绘制路线」。
- 算路中：地图上显示轻量加载提示，不阻塞关闭。

### D6：测试策略

- 单测：`day-route.test.ts` 覆盖段构造、同 POI 跳过、缺坐标过滤、距离/时长格式化与快照优先。
- 后端：`LocationQueryApiTest` 断言详情返回坐标；缺坐标地点返回 `null`。
- E2E：`itinerary.spec.ts` 断言按钮存在、点击打开对应 Day 的弹窗、关闭后仍停留在原 Day；CI 无高德 Key 时断言地图占位，不依赖外网。
- 类型检查与构建：`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build`。

## Risks / Trade-offs

- **高德 JS Key 权限**：路线规划插件要求 Key 具备 JS API 路线规划服务权限；未配置时只能看到占位，不影响行程单。
- **外部依赖不稳定**：算路可能超时或失败；按段降级，不阻塞页面。
- **距离与行程单时长可能不一致**：距离只能来自算路，时长优先用快照；若快照缺失则用算路结果，两者都来自高德，差异可接受。
- **详情接口字段增加**：属于向后兼容的可空字段；前端与后端需同步发布，旧前端忽略新字段。
- **地图实例成本**：弹窗关闭即销毁，避免常驻；反复打开会重新算路，暂不做缓存。

## Migration Plan

- 无数据库迁移；仅接口响应新增可空字段。
- 回滚：前端移除入口与弹窗、后端移除两个字段即可；无数据清理。

## Test Strategy

见 D6。重点验证：

1. 按钮作用于当前选中的 Day，弹窗标题与日期正确。
2. 同 POI 段不请求算路；缺坐标段不绘制且提示。
3. 折线标签距离来自算路、时长优先取快照。
4. 无 Key / 算路失败时行程单仍可交互、导出不受影响。
5. 详情接口坐标往返与空值语义。
