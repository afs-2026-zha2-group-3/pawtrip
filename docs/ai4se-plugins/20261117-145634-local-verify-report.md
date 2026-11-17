# Local Verify Report: add-nearby-location-filter + add-location-map（最终）

**Date:** 2026-11-17 (timezone: +0800)
**Root:** D:/train/day/pawtrip
**Scope:** local+evidence
**Change id:** `add-nearby-location-filter`、`add-location-map`（联合 PR #69）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped（仓库 CI 基线未配置独立 SAST/secret scan） |
| Code review | Pass |
| Evidence (OpenSpec) | Partial（V1/V3 仍有未闭环项，Gate 未签） |
| **Overall** | Partial |

**PR gate:** 本地 Overall 仍为 Partial；CI 已全绿，G2 是否放行由 VL 决定，本报告不自签。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `mvn -f apps/server/pom.xml clean test` | 本次执行（2026-11-17 14:20） | 0 | **228 tests passed**，0 failures / 0 errors |
| `npm run test -w apps/web` | 本次执行（补装 `jsdom` 后） | 0 | **191 tests passed**（25 files） |
| `npm run build` | 本次执行 | 0 | Vite / TanStack Start 构建成功 |
| 受影响 E2E（4 个 spec） | 本轮修复后执行 | 0 | `attraction-pet-rules` 22、`nearby-location-filter` 10、`trips-panel` 12、`trip-duration-input` 4；均在 rebase 前的 base 上通过 |
| `CI=true npm run test:e2e`（全量） | GitHub Actions（最终 base） | 0 | **138 passed**（10m52s），见 `20261117-145634-pipeline-report.md` |

按用户要求不再本地重复运行全量 E2E；最终 base 的回归由 CI 覆盖。

## Code-review highlights

- `GET /api/locations` 的 `nearPoiId` 路径与既有数据库分页路径分离，未带参数时行为不变。
- 锚点校验、Haversine、5km 含边界、距离升序、过滤后分页均有 API 测试。
- 前端 `nearPoiId` 只在餐厅/酒店传入；锚点状态为页面内 `useState`，行程变化时自动清空。
- 地图复用现有列表接口与 `coverPhotoUrl`/`rating`；详情接口仅新增 `keytag`/`businessArea`，不暴露原始 JSON。
- 迁移重编号为 V23–V25，与 main 的 `V20__add_trip_start_date` 不冲突。
- E2E 适配了双列布局下固定行程面板遮挡卡片按钮的问题（`withTripPanelNotBlocking`），面板自身行为仍由 `trips-panel` 套件覆盖。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Partial | [fact] | `add-location-map` 6.5 已闭环；`add-nearby-location-filter` 5.3 的 G2/G3 仍待签 |
| V2 | Requirement coverage | Pass | [fact] | 4 + 2 个 ADDED requirement 均有实现锚点与验收证据 |
| V3 | Scenario coverage | Partial | [fact] | 恰好 5000m API 过滤边界、景点页锚点不改变列表、行程切换清空锚点仍缺直接自动化 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 见两个 change 的 `atdd-design.md` / `alignment-self-check.md` |
| V5 | Spec drift | Pass | [fact] | 酒店默认列表 + 下拉、餐厅门禁、地图详情字段与实现一致 |
| V6 | Design follow-through | Pass | [fact] | nearby D1–D7、map D1–D6 均落地 |
| V7 | Code pattern fit | Pass | [inference] | 复用 TanStack Query、shadcn/ui、行程 store；无新增前端依赖 |
| V8 | Upstream basis | Pass | [fact] | 改动可回溯到 tasks 与 design 决策 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | CI 3/3 jobs success；本地命令全部 exit 0 |
| E2 AI | Pass | 本报告与两个 change 的 P3/P4 工件 |
| E3 Human | Pending | G2 需 VL 签署；G3 需归档后 SA 签署 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ⚠️ 功能完整；Gate 与 3 个边界自动化缺口未闭环 |
| Q2 Correct? | V4–V5 | ✅ 行为与 Delta Spec 一致 |
| Q3 Coherent? | V6–V7 | ✅ 设计与实现一致 |
| Q4 Necessary only? | V8 | ✅ 无 schema 越界；地图为独立 change |
| Q5 Risk controllable? | 残余风险 | ⚠️ 真实地图验证、密钥代理、数据维护需跟踪 |

## Findings

### CRITICAL

无。

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| W1 | 真实地图链路（marker 联动、卡片定位、筛选刷新、SDK 失败）无自动化 | [fact] | `-location-map.tsx` | 保持空 Key E2E；补 mock `window.AMap` 组件测试或有 Key 人工验收清单 |
| W2 | 恰好 `5000m` 的 API 过滤边界无直接夹具 | [fact] | `LocationQueryApiTest` | 增加约 5000m 候选并断言“含边界” |
| W3 | “景点页选择/清除锚点不改变景点列表”无自动化 | [fact] | `attractions/index.tsx` | 在 E2E 中先选景点页锚点并断言列表不变 |
| W4 | 激活行程切换自动清空锚点仅代码审查覆盖 | [fact] | `attractions/index.tsx` effect | 增加切换行程 E2E |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| S1 | 安全密钥直连前端 bundle | [fact] | `apps/web/src/lib/amap/loader.ts` | 生产改用 `serviceHost` 代理 |
| S2 | 地图点位请求数随数据增长 | [inference] | `mapLocationsQueryOptions` | 后续引入轻量点位接口 |
| S3 | InfoWindow HTML 转义函数未单测 | [inference] | `-location-map.tsx` | 抽离 `escapeHtml` 并补纯函数测试 |
| S4 | 双列布局下固定行程面板会遮挡卡片底部按钮 | [fact] | `trip-panel.tsx` / 地点页布局 | E2E 已适配；建议后续调整布局或折叠态高度（`followups.md` TD-6） |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 真实地图回归只能人工发现 | 外部 SDK 不宜作为 CI 依赖 | accepted（有 Key 验收清单） |
| 2 | 距离筛选依赖地点坐标维护 | 生产数据由管理端/抓取脚本补齐 | tracking |
| 3 | 3 个边界场景缺自动化 | 未在本轮补用例 | tracking（W2–W4） |
| 4 | G2/G3 未签署、change 未归档 | 流程收尾未完成 | tracking |

## Waiver

N/A — 无豁免，本报告不构成放行。

## 结论

**Overall = Partial。** 本地构建与测试全部通过，CI 3/3 全绿（E2E 138 passed）；剩余为 3 个边界场景缺自动化与 G2/G3 未签署。是否以「Partial + CI 全绿 + 已接受残余风险」通过 G2，由 VL 决定，本报告不自签。
