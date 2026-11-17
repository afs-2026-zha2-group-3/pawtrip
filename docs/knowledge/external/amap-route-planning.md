---
id: kb.external.amap-route-planning
title: 高德路线规划 2.0（驾车/步行）
area: external
---

# 高德路线规划 2.0（驾车/步行）

> 来源：高德开放平台官方文档《路径规划 2.0》（页面标注最后更新 2026-06-17），2026-11-17 核对。
> 官方入口：https://lbs.amap.com/api/webservice/guide/api/newroute
> 本项目使用方：REQ-011 途内交通估算（`add-intra-city-transport-estimate`），仅用驾车与步行两个端点；公交/骑行/电动车不在范围。

## 服务地址与请求方式

| 能力 | URL | 请求方式 |
|---|---|---|
| 驾车路线规划 | `https://restapi.amap.com/v5/direction/driving` | GET；**参数过长导致请求失败时官方要求改用 POST**（共享传输层因此不得固化为 POI 专用动态代理） |
| 步行路线规划 | `https://restapi.amap.com/v5/direction/walking` | GET |

- Key 为必填参数 `key`（Web 服务 API 类型，仅服务端持有）；`output` 缺省 `json`。
- 输入参数与输出数据编码统一 UTF-8。

## 请求参数（本项目相关）

| 参数名 | 含义 | 规则 | 必填 | 缺省 |
|---|---|---|---|---|
| `key` | 高德 Key | Web 服务 API Key | 是 | 无 |
| `origin` | 起点经纬度 | **经度在前，纬度在后**，`,` 分割，小数点后**不得超过 6 位** | 是 | 无 |
| `destination` | 终点经纬度 | 同上 | 是 | 无 |
| `origin_id` | 起点 POI ID | 起点为 POI 时建议填充，提升算路准确性 | 否 | 无 |
| `destination_id` | 终点 POI ID | 终点为 POI 时建议填充 | 否 | 无 |
| `show_fields` | 返回结果控制 | 筛选可选字段类；多个用 `,` 分割；**未设置时只返回基础信息类字段**（驾车 `taxi_cost` 属基础字段；`cost.duration` 必须设置 `show_fields=cost` 才返回） | 否 | 空 |
| `strategy`（仅驾车） | 算路策略 | `32`=默认（高德推荐，同 APP 默认）；其余见官方表 | 否 | 32 |
| `alternative_route`（仅步行） | 返回路线条数 | 1/2/3；不传默认返回一条 | 否 | 空 |
| `isindoor`（仅步行） | 室内算路 | 0 不需要 / 1 需要 | 否 | 0 |

本项目约定：驾车与步行均传 `show_fields=cost` 与 `origin_id`/`destination_id`；坐标统一格式化 ≤6 位小数（经度在前）；不传 `strategy`（用默认 32）。

## 返回结果（本项目相关字段）

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | string | 成功 `"1"`，失败 `"0"` |
| `info` | string | 成功 `"ok"`，失败为错误原因 |
| `infocode` | string | `"10000"` 代表正确 |
| `count` | string | 路径规划方案总数 |
| `route.origin` / `route.destination` | string | 起/终点经纬度 |
| `route.taxi_cost` | string | **预计出租车费用，单位元（仅驾车返回，基础字段）** |
| `route.paths[]` | object | 算路方案详情（取第一条 `paths[0]`） |
| `route.paths[].distance` | string | 方案距离，单位米 |
| `route.paths[].cost.duration` | string | **线路耗时，单位秒**（需 `show_fields=cost`；驾车/步行均有） |
| `route.paths[].cost.tolls`（驾车） | string | 道路收费，单位元（本项目不使用） |

注意：
- 数值字段均为**字符串**，可能缺失或非数值，解析必须类型化防御（本项目映射 `UPSTREAM_FAILURE` 502，不泄露 Key 与原始报文）。
- 步行返回无 `route.taxi_cost`；步行 `show_fields=cost` 下另有 `cost.taxi`（预估打车费用），本项目不使用——步行费用 ¥0 为产品决策。
- 成功判定沿用 POI 适配器口径：`status=="1" && infocode=="10000"`。

## 本项目换算规则（REQ-011，产品决策非高德返回）

- 打车费用区间 = `taxi_cost` ±20%（low/high，元）。
- 时长 = `duration` 秒 → 分钟**向上取整**。
- 步行费用固定 ¥0（costLowYuan=costHighYuan=0）。
- 大交通自驾联动（第 5 轮修订）：驾车（`toNext=self_drive`）时长**复用驾车端点**（前端查询 `mode=drive` 仅取 `durationMinutes`），不新增 API mode；落库快照费用 0/0 仅存不展示。

## 配额与权限

- 服务调用量受 Key 配额与权限约束（官方流量限制页）；真实 Key 冒烟见 change tasks 1.2。
- Key 缺失应用可启动，调用以类型化错误失败（`AmapTransportException(MISSING_API_KEY)` → `RouteEstimateException(MISSING_CONFIGURATION)` → 502）。

## 实现落点

- 端口：`application.port.maps.RouteEstimatePort`（入参/出参 record 位于 `application.model.maps`）。
- 适配器：`infrastructure.amap.api.AmapRouteEstimateAdapter`，复用共享 `AmapTransport.getJson(path, params)`（自动附加 `key`/`output`）与 `AmapProperties`/`AmapConfiguration`（`amapRestClient` 超时）。
- 换算服务：`trip.TripRouteEstimateService`（±20%、向上取整、步行 ¥0）；端点 `GET /api/trips/{tripId}/route-estimate?fromPoiId&toPoiId&mode`（`mode ∈ {walk, drive}`）。