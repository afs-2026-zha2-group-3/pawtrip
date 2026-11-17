// REQ-011 tasks 1.2：真实 Key 冒烟高德路线规划 2.0（驾车/步行，show_fields=cost）。
// 用法：node openspec/changes/add-intra-city-transport-estimate/smoke-route-estimate.mjs
// 输出脱敏摘要（不含 Key 与完整原始报文）；Key 从仓库根 .env 的 AMAP_API_KEY 读取。
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const env = readFileSync(resolve(root, ".env"), "utf8");
const match = env.match(/^AMAP_API_KEY=(.+)$/m);
if (!match || !match[1].trim()) {
  console.error("MISSING_API_KEY: .env 中未找到 AMAP_API_KEY");
  process.exit(2);
}
const key = match[1].trim();

// 杭州样例坐标（与 TripApiTest 种子一致）：西湖 → 灵隐寺方向
const origin = "120.000000,30.000000";
const destination = "120.100000,30.100000";

async function smoke(mode, path) {
  const url = new URL(`https://restapi.amap.com${path}`);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("show_fields", "cost");
  url.searchParams.set("origin_id", "B023B09GXZ"); // 样例 POI ID（可选参数，验证接受性）
  url.searchParams.set("destination_id", "B023B02842");
  url.searchParams.set("key", key);
  url.searchParams.set("output", "json");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await res.json();
  const firstPath = body?.route?.paths?.[0];
  const summary = {
    mode,
    httpStatus: res.status,
    status: body?.status,
    info: body?.info,
    infocode: body?.infocode,
    count: body?.count,
    taxi_cost: body?.route?.taxi_cost ?? null,
    durationSeconds: firstPath?.cost?.duration ?? null,
    distanceMeters: firstPath?.distance ?? null,
  };
  console.log(JSON.stringify(summary));
  return summary;
}

const driving = await smoke("drive", "/v5/direction/driving");
const walking = await smoke("walk", "/v5/direction/walking");

const ok =
  driving.status === "1" && driving.infocode === "10000" &&
  driving.taxi_cost != null && driving.durationSeconds != null &&
  walking.status === "1" && walking.infocode === "10000" &&
  walking.durationSeconds != null;
console.log(ok ? "SMOKE_PASS" : "SMOKE_FAIL");
process.exit(ok ? 0 : 1);