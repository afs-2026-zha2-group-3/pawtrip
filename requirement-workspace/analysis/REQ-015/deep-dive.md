# REQ-015 Deep Dive — 行程单当天路线规划

- 上游需求：[REQ-015 行程单当天路线规划](../../requirements/REQ-015-day-route-planning.md)
- Impact Brief：[impact-brief.md](impact-brief.md)
- OpenSpec change：`openspec/changes/2026-11-18-add-day-route-planning/`
- 日期：2026-11-18
- 范围：`/itinerary` 当天路线入口与弹窗、高德 JS 路线绘制与标注、用户端地点详情坐标字段；不含天气、路线优化、计划写入、后端算路接口、导出包含路线

## 1. 数据契约

### 1.1 坐标字段（后端 → 前端）

| 业务概念 | API 字段 | 类型 | 来源 | 空值语义 |
|---|---|---|---|---|
| 经度 | `longitude` | `number \| null`（Java `Double`） | `pawtrip_location.longitude` | 未保存 = `null` |
| 纬度 | `latitude` | `number \| null`（Java `Double`） | `pawtrip_location.latitude` | 未保存 = `null` |

- 仅扩展 `GET /api/locations/{poiId}` 的 `LocationDetail`；其余字段、状态码、认证行为不变。
- 不新增列表字段（`LocationSummary` 已有坐标）；不新增接口；无迁移。
- 后端只读数据库，不调用高德；响应不包含原始 POI、`business` 或照片列表。
- 前端 `LocationBrowseDetail` 增加同名可空字段；旧缓存对象缺字段时视为 `null`。

### 1.2 路线段输入（纯函数）

输入来自当天行程条目与地点详情缓存：

| 字段 | 来源 | 用途 |
|---|---|---|
| `poiId` | `TripStop.poiId` | 编号、去重判断、坐标查找 |
| 顺序 | `day.entries` 中的 `stop` 顺序 | 折线与编号顺序，不做重排 |
| `displayMode` | 相邻两 stop 之间的 `transport` 条目 | `walk` → 步行；`drive`/`self_drive` → 驾车 |
| `toNextEstimate.durationMinutes` | 前一个 stop | 时长优先值（可缺） |
| `longitude` / `latitude` | `LocationBrowseDetail` | 算路端点；任一缺失则该段不可算 |

输出建议形态（命名由 design/实现定稿）：

```ts
type DayRouteSegment =
  | {
      kind: "route";
      fromPoiId: string;
      toPoiId: string;
      mode: "walk" | "drive";
      from: { longitude: number; latitude: number };
      to: { longitude: number; latitude: number };
      savedDurationMinutes: number | null;
    }
  | { kind: "skip"; fromPoiId: string; toPoiId: string }
  | { kind: "unroutable"; fromPoiId: string; toPoiId: string; missingPoiIds: string[] };
```

### 1.3 高德算路结果映射

| 高德字段 | 用途 | 规则 |
|---|---|---|
| `routes[0].distance` | 距离 | 米；`< 1000` → 「N 米」，`>= 1000` → `(m/1000).toFixed(1)` 公里 |
| `routes[0].time` | 兜底时长 | 秒；`Math.ceil(seconds / 60)` 分钟 |
| `routes[0].steps[].path` | 折线几何 | 拼接各 step 的 `[lng, lat]` 点列，绘制 `AMap.Polyline` |
| 该段 `toNextEstimate.durationMinutes` | 优先时长 | 存在即展示，忽略算路时长（距离仍取算路） |

不传 `map`/`panel` 给插件，避免自动绘制；折线与文本自行创建与销毁。

## 2. 边界分支

| 规则 | 分支 | 行为 | rationale |
|---|---|---|---|
| 入口 | 当前选中天变化 | 按钮始终作用于最新 `selectedDay`；弹窗内内容随打开时的天确定 | design D1 |
| 入口 | 关闭弹窗 | 保持当前天；不保存、不写计划 | 只读边界 |
| 段构造 | 相邻同 `poiId` | 标记跳过，不发算路 | 无位移，避免无效请求 |
| 段构造 | 任一端点缺坐标 | 该段不绘制；收集缺失地点名称提示 | 不伪造坐标 |
| 段构造 | 两端坐标齐全 | 按 `displayMode` 生成 route 段 | 方式跟随行程单 |
| 段构造 | `transit` | 已在 `displayToNext` 归一为 `drive`/`self_drive`，不单独分支 | 与时间线一致 |
| 距离 | `distance < 1000` | 「N 米」 | 需求已定 |
| 距离 | `distance >= 1000` | 一位小数公里 | 需求已定 |
| 时长 | 有快照 | 快照分钟 | 与时间线一致 |
| 时长 | 无快照 | 算路秒向上取整 | 避免显示 0 分钟 |
| 时长 | 算路 61 秒 | 2 分钟 | 向上取整 |
| 高德 | JS Key 未配置 | 「地图未配置」占位；不发算路 | 与地点页一致 |
| 高德 | 单段失败 | 该段不绘制并提示；其他段继续 | 非阻塞降级 |
| 高德 | 全部段失败 | 展示失败提示；地图可保留地点标记 | 非阻塞 |
| 高德 | 迟到回调 | 弹窗关闭后忽略，不更新已销毁地图 | 防实例泄漏 |
| 空态 | 当天 0 地点 | 「当天暂无地点」；不发请求 | 需求已定 |
| 空态 | 当天 1 地点 | 编号标记 + 「当天只有一个地点，无需路线」 | 需求已定 |
| 地图 | 打开/关闭 | 创建与销毁地图、清空 overlay | 防泄漏 |
| 导出 | 打印/图片 | 弹窗不进入导出路径 | 需求已定 |
| 计划 | 查看路线 | 不调用 `tripActions` 写操作、不触发保存 | 需求已定 |

## 3. 跨 REQ 一致性

| 能力 / 需求 | 关系 | 结论 |
|---|---|---|
| REQ-011 / trip-route-estimate | `toNext`、`toNextEstimate` 快照与交通段展示 | 只读消费；不改变方式选择、快照写入或时间线 |
| REQ-012 / trip-attractions + 地图 | 高德 JS 加载、地图降级、地点详情 | 复用 loader 与降级语义；扩展插件与折线，不改变地点页行为 |
| REQ-013 / 地点卡片媒体 | `LocationBrowseDetail` 字段 | 只增可空坐标；封面/评分/商圈/营业时间/电话不变 |
| trip-itinerary | Day 切换、时间线、导出 | 新增入口与弹窗；Day 切换与导出行为不变 |
| trip-planning / trip-context | 计划结构与激活行程 | 不修改计划结构、不写库 |
| location-management | 用户端地点详情 | 新增坐标要求；管理员接口与列表不变 |
| 天气 | 无 | 明确排除，不引入 `AMap.Weather` 或任何天气依赖 |

## 4. 展示契约

| 触发 / 界面 | 内容 | 状态 |
|---|---|---|
| `/itinerary` Day 标签行 | 右侧按钮「查看当天路线规划」 | 始终可见；作用于当前选中天 |
| 路线弹窗标题 | 「第 N 天路线规划」；有开始日期时展示该天日期 | 描述可带城市 |
| 地图 | 编号标记 1..N；按段折线（驾车/步行配色区分） | 顺序与行程单一致，不重排 |
| 折线标注 | 「距离 · 时长」，如「1.2 公里 · 20 分钟」 | 每段一条；位置由实现定稿 |
| 算路中 | 轻量加载提示 | 不阻塞关闭 |
| 缺坐标 | 「部分地点缺少坐标」类提示 | 非阻塞；涉及段不绘制 |
| 缺 Key | 「地图未配置」占位 | 与地点页一致 |
| 单段失败 | 「部分路段路线获取失败」类提示 | 其他段继续 |
| 无地点 | 「当天暂无地点」 | 不发请求 |
| 单地点 | 编号标记 + 「当天只有一个地点，无需路线」 | 不发请求 |
| 导出 PDF/图片 | 不包含地图、折线、标注 | 与既有导出一致 |

## 5. 测试计划

### 后端 API

- `GET /api/locations/{poiId}` 对坐标齐全地点返回 `longitude`/`latitude`（如 `113.5`/`22.1`）。
- 无坐标地点两字段均为 `null`，其余字段与响应结构不变。
- 响应仍不含原始 POI、`business`、照片列表；未认证 401 不变。
- 详情读取不触发高德调用（以现有测试边界或 mock 端口证明）。

### 前端纯函数

- 段构造：顺序保持；不同 `poiId` 生成 route 段；同 `poiId` 生成 skip；缺坐标生成 unroutable。
- 方式映射：`walk` → 步行；`drive`/`self_drive` → 驾车；`transit` 经 `displayToNext` 归一。
- 距离格式：850 → 「850 米」；1234 → 「1.2 公里」；1000 → 「1.0 公里」。
- 时长：快照 20 分钟优先；无快照 61 秒 → 2 分钟；0 秒 → 0 分钟（或按实现定稿，需单测固定）。
- 空态输入：0 个/1 个 stop 不产生 route 段。

### E2E

- 打开 `/itinerary`，激活种子行程；Day 标签行右侧按钮存在。
- 选中 Day 2 点击按钮 → 出现「第 2 天路线规划」弹窗；关闭后仍选中 Day 2。
- 无高德 Key 的 CI 环境：弹窗展示地图未配置占位；行程单其他内容可用。
- 当天只有一个地点/无地点的种子场景展示对应空态（按夹具可行性）。
- 导出 PDF/图片不包含路线弹窗内容（回归既有导出用例）。

### 命令

- 后端：`./mvnw test`（或定向 `LocationQueryApiTest`）。
- 前端：`npm test` / `npx vitest run`（按仓库脚本）、`npx tsc --noEmit -p apps/web/tsconfig.json`。
- E2E：仓库既有 `scripts/run-e2e.mjs` 与 Playwright 命令。

## 6. Probe log / DoR 复核（⑨–⑫）

| 项 | 结论 | 依据 |
|---|---|---|
| ⑨ 数据契约 | 坐标字段来源、类型、空值、响应边界已定义；路线段输入输出与高德映射明确 | 第 1 节；`PawtripLocation`、`LocationDetail`、design D2–D4 |
| ⑩ 边界分支 | 同地点、缺坐标、缺 Key、单段失败、空态、迟到回调、导出隔离已枚举 | 第 2 节 |
| ⑪ 跨 REQ | 与 REQ-011/012/013、trip-itinerary、trip-planning、location-management 无冲突；天气明确排除 | 第 3 节 |
| ⑫ 展示与测试 | 入口/弹窗/标注/降级/空态契约明确；三层测试计划覆盖 AC-1…AC-7 | 第 4、5 节 |
| BLOCKER | 0 | 无阻塞性未知依赖 |
