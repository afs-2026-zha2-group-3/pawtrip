# Change Summary — add-itinerary-nearby-pet-services（REQ-015）

- 日期：2026-11-17
- 状态：实现与 CI 已完成；**PR #75 已合并（squash `70c7ca8`）；G1/G2 Pass、G3 Conditional Pass；归档待执行（G3 条件）**
- PR：[#75](https://github.com/afs-2026-zha2-group-3/pawtrip/pull/75)（head `f160d71`，merged 2026-11-17）

## Intent

在行程单景点卡片内直接展示同城最近的宠物医院与宠物用品店，并修正宠物医院/用品店被宠物友好筛选隐藏的问题，让基础服务始终可见。

## What shipped

- `GET /api/locations/{poiId}/nearby-services`：同城最近医院与用品店各至多 1 家，含名称、地址、直线距离（Haversine，取整到米）与营业时间（`opentime_week` → `opentime_today` → null）。
- 行程单景点卡片新增“附近宠物服务”折叠栏目：默认收起、展开懒加载、加载/空/错误态；距离一位小数公里，地址与营业时间缺失有降级文案。
- 行程 stop 条目暴露 `poiId`；新增 `nearbyPetServicesQueryOptions`。
- 宠物医院/用品店免宠物友好筛选：后端查询豁免、前端不传 `petFriendlyOnly`、隐藏“显示全部地点”开关。
- 未配置政策的医院/用品店展示“不限宠物/友好/允许所有宠物，无额外限制”。
- 零迁移、零新依赖；管理端不变。

## Verify highlights

| 层 | 结果 | 证据 |
|---|---|---|
| 后端 | 233 tests，0 failures / 0 errors | 本地 `mvn clean test`（缓存 Maven 3.9.16） |
| 前端 | 28 files / 207 tests 通过 | 本地 `npm run test -w apps/web` |
| 构建 | `npm run build` 成功 | 本地构建输出 |
| CI | Server / Web / Browser E2E 全绿 | PR #75 checks（E2E 9m28s） |

## Residual risks

- 仅展示各 1 家；较远时信息价值有限（后续可扩展多候选/阈值）。
- 营业时间为保存时快照，可能过期；本期不实时校验。
- 无专用 E2E；组件 UT + API 测试覆盖，CI 回归既有流程。
- 请求失败态与“距离并列”无自动化用例。

## Links

- P1：`requirement-workspace/requirements/REQ-015-itinerary-nearby-pet-services.md`、`analysis/REQ-015/{impact-brief,deep-dive}.md`
- P2：`proposal.md`、`specs/trip-attractions/spec.md`、`dov-ac-review.md`
- P3：`design.md`、`tasks.md`、`atdd-design.md`、`alignment-self-check.md`、`consistency-lint.md`
- P4：`docs/ai4se-plugins/20261117-*.md`（local-verify、pipeline、quality-checklist）、`ci-report.md`
- P5：本文件、`followups.md`、`g3-decision.md`（Conditional Pass）

## Gaps

- G1 Pass（IO=SUKI、SA=RANLE）、G2 Pass（VL=RANLE）、G3 Conditional Pass（SA=RANLE，2026-11-18）；本 change 为 PR 提交后的补登记，规格与实现顺序倒置。
- G3 条件：执行 `/sdd:living-merge` 归档；当前 OpenSpec archive 未执行，ADDED requirement 尚未进入 Living Spec。
