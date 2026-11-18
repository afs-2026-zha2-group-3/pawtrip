# Local Verify Report: add-itinerary-nearby-pet-services

**Date:** 2026-11-17 (timezone: +0800)
**Root:** D:/train/day/pawtrip
**Scope:** local+evidence
**Change id:** `2026-11-17-add-itinerary-nearby-pet-services`（REQ-015，PR #75）

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped（仓库 CI 基线未配置独立 SAST/secret scan） |
| Code review | Pass |
| Evidence (OpenSpec) | Partial（V3 错误态/距离并列缺自动化；V5 Living Spec 待归档合并） |
| **Overall** | Partial |

**PR gate:** 本地命令全绿；Evidence 为 Partial 属非阻塞缺口，PR 已提交且 CI 全绿。G2 由 VL 人工决定，本报告不自签。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `mvn -f apps/server/pom.xml clean test` | docs/feedback/verification-commands.md（等价的非 wrapper 调用） | 0 | **233 tests passed**，0 failures / 0 errors |
| `npm run test -w apps/web` | docs/feedback/verification-commands.md | 0 | **207 tests passed**（28 files） |
| `npm run build` | docs/feedback/verification-commands.md | 0 | Vite / TanStack Start 构建成功 |
| `CI=true npm run test:e2e` | docs/feedback/verification-commands.md | — | 本次未本地重复执行；由 PR #75 CI Browser E2E 覆盖（9m28s，success） |

环境说明：`./mvnw` 尝试下载 Maven 3.9.16 失败（网络不可达），改用本机缓存 `~/.m2/wrapper/dists/apache-maven-3.9.16/.../bin/mvn` 执行；Maven 版本与 wrapper 配置一致。工作区仅有 `apps/server/.mvn/wrapper/maven-wrapper.properties` 的本地未提交修改（3.10.0 → 3.9.16），与本次代码无关。

## Code-review highlights

- `GET /api/locations/{poiId}/nearby-services` 只读已保存地点；同城范围由景点 `regionCode` 推导，前端不传城市，避免跨城查询。
- 最近服务按 Haversine 距离取最小，并列按地点 `id` 升序；类别无结果、候选无坐标或景点无坐标返回 `null`；未知 POI 返回 404。
- 营业时间优先 `business_json.opentime_week`，回退 `opentime_today`，都缺失为 `null`；不调用高德实时接口。
- 行程组件默认收起，`enabled: open` 懒加载；失败使用 `throwOnError: false`，不阻塞卡片其他内容。
- 医院/用品店免筛选在仓库 SQL 与前端查询参数双层实现；前端同时隐藏“显示全部地点”开关并调整空态。
- 未配置政策的医院/用品店统一按“不限宠物/友好”展示；`isPetPolicyConfigured` 去除重复判定。
- 零迁移、零新依赖；管理端接口与写入能力未改动。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | `tasks.md` 1.1–5.4 全部完成 |
| V2 | Requirement coverage | Pass | [fact] | ADDED 1 需求 + MODIFIED 2 需求均有实现锚点与测试证据 |
| V3 | Scenario coverage | Partial | [fact] | 7 个 ADDED 场景中，请求失败态与“距离并列按 ID”无自动化；其余由 API/组件/纯函数测试覆盖 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 见 `alignment-self-check.md` |
| V5 | Spec drift | Partial | [fact] | 医院/用品店免筛选已在 Living Spec；“附近宠物服务”ADDED requirement 尚未合并，待 P5 归档 |
| V6 | Design follow-through | Pass | [fact] | design D1–D7 均已落地 |
| V7 | Code pattern fit | Pass | [inference] | 复用 TanStack Query、既有 Axios/request 封装、shadcn/ui；无新增依赖 |
| V8 | Upstream basis | Pass | [fact] | 可追溯到 REQ-015、proposal 与 PR #75 提交说明 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | `docs/ai4se-plugins/20261117-173057-pipeline-report.md`（CI 3/3 success）+ 本地命令 exit 0 |
| E2 AI | Pass | 本报告与 change 的 P1–P3 工件 |
| E3 Human | Pending | G2 需 VL 签署；G1/G3 亦待人工 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ⚠️（V3 两处缺自动化） |
| Q2 Correct? | V4–V5 | ✅（V5 待归档） |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ✅（缺口已记录，非阻塞） |

## Findings

### CRITICAL

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| — | 无 | — | — | — |

### WARNING

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 无专用 E2E 断言附近服务折叠栏目，CI 仅回归既有流程 | [fact] | `e2e/` | 后续在行程单 E2E 补展开/空态断言 |
| 2 | 请求失败态无自动化用例 | [fact] | `nearby-pet-services.test.tsx` | 增加 fetch reject 用例，断言“暂时无法获取附近宠物服务” |
| 3 | “距离并列按 ID 升序”无并列夹具 | [fact] | `LocationQueryApiTest` | 构造等距医院并断言顺序 |
| 4 | Living Spec 尚无附近服务 requirement | [fact] | `openspec/specs/trip-attractions/spec.md` | PR 合并后 `/sdd:living-merge` 归档 |

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | `./mvnw` 下载失败依赖本机缓存 | [fact] | `apps/server/.mvn/wrapper/maven-wrapper.properties` | 在 CI/本地固化 Maven 版本或允许 wrapper 离线缓存 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 仅展示各 1 家，距离较远时信息价值有限 | 已确认产品口径 | accepted（followups BZ-2） |
| 2 | 营业时间为保存时快照，可能过期 | DB-only 约束 | accepted（followups BZ-3） |
| 3 | 同城最近可能跨行政区 | 已确认口径 | accepted |
| 4 | 无专用 E2E / 失败态未自动化 | 时间与用例成本 | tracking（followups TD-1/TD-3） |
| 5 | Living Spec 未归档附近服务需求 | PR 未合并 | tracking（followups TD-4） |

## Waiver

N/A — no waiver（Overall = Partial，非 Fail；未请求人工 Waiver）。

## Post-archive addendum（2026-11-18）

- V5 已闭环：change 已归档，`trip-attractions` 合并「行程景点附近宠物服务」，`openspec validate --all --strict` 27 passed / 0 failed。
- V3 剩余缺口（请求失败态、距离并列、专用 E2E）仍由 `followups.md` 跟踪；本报告 Overall 保持 Partial 作为归档前事实记录。
