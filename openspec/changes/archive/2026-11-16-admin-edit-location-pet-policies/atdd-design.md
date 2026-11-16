# ATDD Design — admin-edit-location-pet-policies

- Change：`openspec/changes/admin-edit-location-pet-policies/`
- 上游：`specs/location-management/spec.md`、`design.md`
- 日期：2026-11-16

## 1. ATDD Layers in Scope

只设计 **API** 与 **E2E** 两层验收；纯转换/校验逻辑作为 apply-time UT 延后。

| # | 场景 | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| 1 | 创建时保存政策 | API | — | 单端点请求/响应可证明持久化 |
| 2 | 更新缺省不改 | API | — | 单端点 + 数据库状态可证明 |
| 3 | 更新整体替换与清空 | API | — | 单端点 + `null` 清空可证明 |
| 4 | 详情返回 `petPolicies` | API | — | 单端点响应可证明 |
| 5 | 非法政策值返回 400 且不部分写入 | API | Security advisory | 端点校验与事务边界 |
| 6 | 列表响应不变 | API | — | 列表端点结构断言 |
| 7 | 新建地点填写政策 | E2E | — | 用户表单操作与可见结果 |
| 8 | 编辑回填与保存 | E2E | — | 用户表单操作与可见结果 |
| 9 | 清回未配置 | E2E | — | 表单清空后的可见结果 |
| 10 | 三态布尔 | E2E | — | 下拉选项与回填状态 |
| 11 | 非法数值前端拒绝 | E2E | — | 用户可见错误且不发请求 |
| 12 | 所有地点类型可编辑 | E2E | — | 非景点弹窗可见政策区（mock 非景点详情） |
| 13 | 费用元/分换算 | API + E2E | — | API 断言分；E2E 断言显示与请求 |
| 14 | 行政区政策不受影响 | API | — | 更新地点后读取行政区政策 |
| 15 | 转换与校验纯逻辑 | Defer UT | — | apply-time 单元 TDD（元/分、两位小数、三态映射） |

## 2. What Is Written Before Production Code

- 先写/红：`AdminLocationApiTest` 的 API 验收用例（创建、详情、缺省不改、整体替换、清空、400、行政区不变、列表不变）。
- 先写/红：`e2e/admin-location-management.spec.ts` 的 UI 验收用例（创建填写、编辑回填、清空、三态、前端校验、非景点 mock、费用显示与请求体）。
- 纯逻辑转换（`yuanToCents`、`centsToYuan`、政策草稿解析）在 apply 阶段按单元 TDD 编写，不在本文件展开 UT 套件。

## 3. Local vs CI Gates

| 层 | 本地 | CI |
|---|---|---|
| API | `cd apps/server && ./mvnw test` | `.github/workflows/server.yml`：`./mvnw -B test` |
| Web 单元/构建 | `npm test -w apps/web`、`npm run build` | `.github/workflows/web.yml`：同上 |
| E2E | `npm run test:e2e` | `.github/workflows/e2e.yml`：`npm run test:e2e` |

不新增 CI 语义；沿用现有三个 workflow。

## 4. Data / Fixtures Strategy

- API 层：沿用 `AdminLocationApiTest` 的临时 SQLite 与 Flyway 迁移；每个用例自建地点或行政区，断言后由临时库销毁清理。
- E2E 层：沿用 `scripts/run-e2e.mjs` 的临时数据库与种子用户（`admin` / `demo`）；`admin-location-management.spec.ts` 继续用 `page.route` mock 管理 API，避免依赖真实高德。
- 非景点场景：mock “pawtrip地点”详情返回非景点 `typeGroup`，断言政策区可见、游玩时间不显示；不新增数据库种子。
- 费用换算：API 用例断言分；E2E 拦截请求体断言分，并断言回填显示元。

## 5. Non-Goals

- 不写业务实现代码或测试代码套件（由 `/sdd:atdd-apply` 负责）。
- 不设计完整 UT 套件；纯逻辑仅列 Defer-UT。
- 不引入 Playwright/POM/Excel/批量用例生成器。
- 不新增 CI 产品或修改现有 workflow 语义。
- 不新增 NFR 测试；性能、可观测性、韧性测试记为 deferred/out of scope（本轮已确认）。

## 6. Delta → Design → Tasks 对齐自检

| Delta Requirement | Design 决策 | Tasks 分组 | 结论 |
|---|---|---|---|
| 管理员编辑地点宠物政策 | D3 共享表单、D4 字段映射 | 2.2–2.5 | 覆盖，无扩范围 |
| 管理 API 暴露地点宠物政策 | D1 `petPolicies` 对象、D2 持久化与校验 | 1.1–1.4 | 覆盖，无扩范围 |
| 非目标：行政区/公共展示/列表 | Non-Goals + 反向验证 | 3.3 范围审查 | 明确排除 |

反向验证用例：

- 行政区政策不变：API 用例读取 `administrative_region` 断言未变。
- 列表不变：API 断言列表响应字段；E2E 断言表头无政策列。
- 不新增弹窗：E2E 断言政策字段位于既有“保存地点”/“pawtrip地点”弹窗内。
- 不新增迁移：`git diff --stat` 与迁移目录审查。
