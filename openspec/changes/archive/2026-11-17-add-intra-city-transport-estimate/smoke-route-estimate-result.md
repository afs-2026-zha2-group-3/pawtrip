# Tasks 1.2 冒烟验证结果（真实 AMAP_API_KEY）

- 日期：2026-11-17
- 脚本：`smoke-route-estimate.mjs`（Key 从仓库根 `.env` 读取，全程不打印 Key）
- 样例坐标：origin `120.000000,30.000000` → destination `120.100000,30.100000`（杭州，≤6 位小数，经度在前）
- 请求参数：`show_fields=cost`、`origin_id=B023B09GXZ`、`destination_id=B023B02842`、`output=json`（strategy 未传，用默认 32）

## 响应样例（脱敏摘要）

### GET /v5/direction/driving

```json
{"mode":"drive","httpStatus":200,"status":"1","info":"OK","infocode":"10000","count":"3","taxi_cost":"127","durationSeconds":"2816","distanceMeters":"41532"}
```

### GET /v5/direction/walking

```json
{"mode":"walk","httpStatus":200,"status":"1","info":"OK","infocode":"10000","count":"1","taxi_cost":null,"durationSeconds":"30460","distanceMeters":"38075"}
```

## 结论

- 两接口 `status="1"` 且 `infocode="10000"`，Key 权限可用 → **SMOKE_PASS**。
- driving：`route.taxi_cost`（字符串元，"127"）与 `route.paths[0].cost.duration`（字符串秒，"2816"）均返回，字段类型与 KB 文档一致。
- walking：无 `route.taxi_cost`（null），`paths[0].cost.duration`（"30460"）返回 → 步行费用按设计固定 ¥0，仅取时长。
- 字段均为字符串，适配器解析需做数值转换（design D2）。