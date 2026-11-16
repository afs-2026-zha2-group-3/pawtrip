# Local Verify Report: add-location-pet-rule-display

**Date:** 2026-11-16 (timezone: +0800)
**Root:** D:\train\day\pawtrip
**Scope:** local+evidence
**Change id:** add-location-pet-rule-display

## Summary

| Dimension | Status |
|-----------|--------|
| Build | Pass |
| Static scan | Skipped |
| Code review | Pass |
| Evidence (OpenSpec) | Pass |
| **Overall** | **Pass** |

**PR gate:** Overall=Pass；E3 人工评审仍为 Pending。Agents must not self-approve Waiver/Gate.

说明：本报告对应 Revision 3（景区浏览独立 Tab + 选择城市自动跳转）与 PR #50（`374b4cec`）。

## Local commands

| Command | Source | Exit | Summary |
|---------|--------|------|---------|
| `cd apps/server && ./mvnw test` | `docs/feedback/verification-commands.md` | 0 | 后端全量通过；新增 `LocationQueryApiTest` 12/12、`LocationRepositoryTest` 6/6 |
| `npm test -w apps/web` | 同上 | 0 | Vitest **46/46** |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | README | 0 | 类型检查通过 |
| `npm run build -w apps/web` | README | 0 | 客户端与 SSR 构建通过 |
| `npm run test:e2e` | README | 0 | Playwright **38 passed / 4 skipped**；skipped 为既有 `@profile-dependency` fixme |
| `openspec validate add-location-pet-rule-display --strict` | OpenSpec | 0 | valid，无 issues |

## Code-review highlights

- 后端：新增 `LocationQueryController/Service/Responses`；`findAttractionPage` 只查数据库，默认 `max_pets_per_person >= 1`，支持城市/区县前缀与 `includeWithoutRules`；详情返回现有 8 个政策字段；无高德调用、无新增迁移/实体字段；认证沿用 `/api/**`，错误沿用 Problem Details。
- 前端：顶部新增“景区浏览”Tab；`/cities` 选定城市后自动进入 `/attractions`，城市浏览页不内嵌景点列表/入口按钮；列表三态（宠物友好/禁止携带/未配置）与 8 字段详情复用现有语义；分页与空态覆盖无城市、无景点、无友好景点。
- 测试：新增 `attraction-pet-rules.spec.ts` 12 条 E2E（含城市浏览页无入口的反向断言）；`destination-selection.spec.ts` 更新为选定后自动进入景区 Tab；全量回归无既有功能失败。
- 范围控制：PR #50 未包含本地无关改动（`package.json` 的 seed:locations、`scripts/seed-locations-amap.mjs`、`openspec/specs/location-management/spec.md`）。

## Evidence checklist

| ID | Check | Result | Mark | Notes |
|----|-------|--------|------|-------|
| V1 | Task completion | Pass | [fact] | `tasks.md` 18/18 `- [x]` |
| V2 | Requirement coverage | Pass | [fact] | `attraction-pet-rules` 6 个 Requirement + `web-app-shell` 1 个 Requirement 均有实现 |
| V3 | Scenario coverage | Pass | [fact] | 列表/三态/详情/字段/API/入口场景由 API + E2E 覆盖 |
| V4 | Requirement↔impl mapping | Pass | [fact] | 迁移查询 → API；摘要 `maxPetsPerPerson` → 三态 badge；详情 → 8 字段；城市选择 → 自动跳转 |
| V5 | Spec drift | Pass | [fact] | 未发现三档/迁移残留；`entryPolicy`/`entryNote` 仅出现在反向审计/历史记录 |
| V6 | Design follow-through | Pass | [fact] | D1–D12 均落实；D9 改为独立景区 Tab + 自动跳转 |
| V7 | Code pattern fit | Pass | [fact] | 复用既有 record/service/controller、Spring Data、TanStack Query、shadcn 组件与 Playwright 模式 |
| V8 | Upstream basis | Pass | [fact] | 全部变更可追溯到 REQ-008/proposal/tasks；PR 文件清单无无关文件 |

## Evidence slots (E1 / E2 / E3)

| Slot | Status | Source |
|------|--------|--------|
| E1 Machine | Pass | 本地 6 条命令 exit 0；CI 3 个 check 全绿（见 pipeline report） |
| E2 AI | Pass | 本报告 + V1–V8 + code review |
| E3 Human | Pending | 需 VL 评审；不得由代理签署 |

## Five-question map

| Q | Maps to | Status |
|---|---------|--------|
| Q1 Complete? | V1–V3 | ✅ |
| Q2 Correct? | V4–V5 | ✅ |
| Q3 Coherent? | V6–V7 | ✅ |
| Q4 Necessary only? | V8 | ✅ |
| Q5 Risk controllable? | residual + red lines | ✅ |

## Findings

### CRITICAL

无。

### WARNING

无。

### SUGGESTION

| # | Finding | Mark | Location | Suggestion |
|---|---------|------|----------|------------|
| 1 | 默认列表依赖 `maxPetsPerPerson` 已维护；开发库中大量导入地点仍为 `NULL` | [fact] | 本地 `pawtrip_location` | 上线前补充数据核对清单；本地已给 5 条珠海景点设置测试政策 |
| 2 | 顶部普通 Tab 从三个变为四个 | [inference] | `__root.tsx` | 已通过全量 E2E；后续新增 Tab 时继续回归导航守卫 |

## Residual risks

| # | Risk | Why open | Mitigation |
|---|------|----------|------------|
| 1 | 默认门槛依赖 `maxPetsPerPerson` 已维护 | 数据补齐前默认列表可能为空 | accepted；现有管理弹窗维护；提供数据核对 |
| 2 | `allowed_pet_types` 与肩高不在管理弹窗中 | 现有管理 UI 只编辑 6 项 | 公开详情有值才展示；后续需求再扩展录入 |
| 3 | AC-2 行程内展示未实现 | 依赖 US-48 | tracking；本 PR 明确 Out of Scope |
| 4 | 归档顺序依赖 destination-selection | 两 change 同时修改 `web-app-shell` | 在 destination-selection 归档后再归档本 change |
| 5 | CD 部署验证尚未执行 | PR 未合并 | 合并后按流程执行；本报告仅覆盖 local+CI |

## Waiver

N/A — no waiver（Overall=Pass）。
