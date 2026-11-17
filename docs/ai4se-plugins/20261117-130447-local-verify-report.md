# Local Verify Report: add-nearby-location-filter + add-location-map

**Date:** 2026-11-17 (timezone: +0800)
**Root:** D:/train/day/pawtrip
**Scope:** local+evidence
**Change id:** `add-nearby-location-filter`、`add-location-map`（REQ-012）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass（复用既有记录） |
| Static scan | Skipped（仓库 CI 基线未配置独立 SAST/secret scan） |
| Code review | Pass |
| Evidence (OpenSpec) | Partial（P3 工件已补齐；Gate 与 CI 证据未完成） |
| **Overall** | Partial |

**PR gate:** Fail blocks `/sdd:pr-submit` unless Waiver below is complete.
Agents must not self-approve Waiver.

## Local commands

按用户 2026-11-17 指示，已执行过的验证不重复运行；下表区分本次执行与既有记录。既有记录来自同一工作区（`requirement-workspace/registry.md`、`handoff.md`、`tasks.md`）。

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `npm run test -w apps/web` | 本次执行（2026-11-17 13:02） | 0 | 16 test files / **102 passed**（含 `distance.test.ts`、`anchors.test.ts`、`locations-browsing.test.ts`） |
| `npm run build` | 既有记录（2026-11-17） | 0 | 前端生产构建通过（本次未重跑） |
| `cd apps/server && ./mvnw test` | 既有记录（2026-11-17） | 0 | **178 tests passed**（本次未重跑；Git Bash 下 wrapper 下载 3.9.16 失败，既有记录使用缓存 Maven 执行） |
| `CI=true npm run test:e2e` | 既有记录（2026-11-17） | 0 | 新增 `nearby-location-filter` **10 passed**；`attraction-pet-rules` **13 passed**；`trips-panel` **13 passed**（本次未重跑） |

## Code-review highlights

- `GET /api/locations` 仅在提供 `nearPoiId` 时进入距离路径；未提供时继续使用原数据库分页与 `ORDER BY id ASC`，向后兼容。
- 锚点校验覆盖存在、`typeGroup=attraction`、经纬度非空；非法锚点统一 `400 VALIDATION_ERROR`。
- 距离使用 Haversine，固定 `5000m` 含边界；候选无坐标排除；排序使用未舍入距离，响应 `distanceMeters` 四舍五入。
- 前端 `nearPoiId` 只在餐厅/酒店传入（`nearbyType`），景点/宠物医院/用品店不应用距离筛选。
- 锚点状态为页面 `useState`；激活行程变化与锚点不再属于候选时自动清空。
- 地图点位复用列表接口，按 `pageSize=100` 循环取完全部分页；筛选参数与列表一致。
- InfoWindow HTML 对名称/地址做转义；地图详情卡片按字段有无条件渲染，不伪造押金/清洁费/设施。
- 详情摘要从 `poi_json`/`business_json` 解析，优先 `https` 照片；原始 `photos`/`business`/`poi` 不进入响应。
- 本批改动未新增数据库 schema；V23/V24/V25 仅测试数据与 JSON 关联。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Partial | [fact] | `nearby` 4/4 组完成，5.3 的 G1/G2/G3 待签；`map` 6.5 未闭环；P3 文档本次补齐 |
| V2 | Requirement coverage | Pass | [fact] | 4 + 2 个 ADDED requirement 均有实现锚点与至少一层验收证据 |
| V3 | Scenario coverage | Partial | [fact] | 27 + 12 个 scenario 中，恰好 5000m API 边界、景点页锚点不改变列表、行程切换清空锚点、真实地图联动/详情卡片无自动化覆盖 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 见 `atdd-design.md` 场景表与 `alignment-self-check.md` 映射表 |
| V5 | Spec drift | Pass | [fact] | 酒店默认列表 + 下拉、餐厅门禁、地图详情卡片与摘要字段均已同步 Delta 与实现 |
| V6 | Design follow-through | Pass | [fact] | `nearby` D1–D7 与 `map` D1–D6 均落地；地图安全密钥代理明确为后续项 |
| V7 | Code pattern fit | Pass | [inference] | 复用 TanStack Query、既有 shadcn/ui 组件与行程 store；新增前端代码无新 npm 依赖 |
| V8 | Upstream basis | Pass | [fact] | 改动可回溯到 tasks 1.x–6.x 与 design 决策 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Partial | 本地命令记录通过（前端本次复核，后端/E2E 复用既有记录）；无 CI 报告（代码尚未提交/推送） |
| E2 AI | Pass | 本报告、`dov-ac-review.md`、`atdd-design.md`、`alignment-self-check.md` |
| E3 Human | Pending | 需 VL 对 G2 作出签署；G1/G3 分别待 IO/SA、SA |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ⚠️ 功能实现完整；Gate 与 6.5 未闭环，部分边界缺自动化 |
| Q2 Correct? | V4–V5 | ✅ 行为与 Delta Spec 一致 |
| Q3 Coherent? | V6–V7 | ✅ 设计与实现一致，复用既有模块 |
| Q4 Necessary only? | V8 | ✅ 无 schema 变更；地图为独立 change；无越界重构 |
| Q5 Risk controllable? | 残余风险 | ⚠️ 真实地图验证、密钥代理、数据维护需跟踪 |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| W1 | 真实地图链路（marker 联动、卡片定位、筛选刷新、SDK 失败）无自动化 | [fact] | `-location-map.tsx`、`e2e/nearby-location-filter.spec.ts` | E2E 保持空 Key；补 mock `window.AMap` 的组件测试，或有 Key 环境固定人工验收清单 |
| W2 | 恰好 `5000m` 的 API 过滤边界无直接夹具 | [fact] | `LocationQueryApiTest` | 增加一个约 5000m 的候选，断言“含边界”出现在结果中 |
| W3 | “景点页选择/清除锚点不改变景点列表”无自动化 | [fact] | `attractions/index.tsx` | 在 E2E 中先选景点页锚点，断言列表内容不变 |
| W4 | 激活行程切换自动清空锚点仅代码审查覆盖 | [fact] | `attractions/index.tsx` effect | 增加切换行程的 E2E，断言酒店恢复全量、餐厅恢复门禁 |
| W5 | `add-location-map` 6.5 未闭环 | [fact] | `tasks.md` | 重启后端后确认地图详情卡片照片/评分，再勾选 6.5 |
| W6 | 无 CI 证据；代码尚未提交 | [fact] | 工作区 | 提交/推送后运行 CI，补 `ci-report.md` 与 G2 证据 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| S1 | 安全密钥直连前端 bundle | [fact] | `apps/web/src/lib/amap/loader.ts` | 生产改用 `serviceHost` 代理并配置域名白名单 |
| S2 | 地图点位请求数随数据增长 | [inference] | `mapLocationsQueryOptions` | 数据量增长后引入轻量点位接口或聚合 |
| S3 | V25 依赖同名真实 POI | [fact] | `V25__enrich_zhuhai_test_location_business.sql` | 保留“找不到同名记录则不改”的兜底；测试数据更新时复核 |
| S4 | InfoWindow HTML 转义函数未单测 | [inference] | `-location-map.tsx` | 抽离 `escapeHtml` 并补纯函数测试 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 真实地图链路回归只能人工发现 | 外部 SDK 不宜作为 CI 依赖 | accepted（有 Key 环境验收清单） |
| 2 | 距离筛选依赖地点坐标维护 | 生产数据由管理端/抓取脚本补齐 | tracking（数据维护 owner） |
| 3 | 前置 `unify-location-browsing` 已随 origin/main 归档（2026-11-17） | 依赖已收口 | mitigated |
| 4 | 安全密钥进入前端 bundle | 本期直连方案 | tracking（生产代理） |
| 5 | 6.5 与 CI/Gate 未闭环 | 实现收尾与提交流程未完成 | tracking |

## Waiver

N/A — 无豁免，本报告不构成放行。

## 结论

**Overall = Partial。** 本地功能验证记录通过（后端 178、前端 102、相关 E2E 全绿），无 CRITICAL；但 6.5、CI 证据与部分边界自动化未闭环，E3 待 VL 签署。是否在 G2 以「Partial + 已接受残余风险」放行，由 VL 决定，本报告不自签。
