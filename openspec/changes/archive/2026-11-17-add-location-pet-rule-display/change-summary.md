# Change summary — add-location-pet-rule-display

## Intent

US-25 / REQ-009 的 AC-1：让已登录用户在已选目的地城市下查看景点及其携宠政策，用现有 `maxPetsPerPerson` 判断是否宠物友好；公开页只读数据库，不调用高德。AC-2（行程内展示）依赖 US-48，不在本次范围。

## What shipped

- 新增顶层“景区浏览”Tab（`/attractions`）与 `/attractions/$poiId` 详情；`/cities` 选定城市后自动进入该 Tab；城市浏览页不内嵌景点列表或入口按钮。
- 新增登录用户只读 API：`GET /api/locations/attractions`（默认 `maxPetsPerPerson >= 1`，`includeWithoutRules=true` 返回全部）与 `GET /api/locations/{poiId}`（现有 8 项政策字段）。
- 列表三态：`>=1` → 宠物友好、`0` → 禁止携带、`NULL` → 未配置；详情展示所有非空政策字段。
- 不新增数据库迁移/实体字段；管理端弹窗不变；公开页不调用高德。
- 新增 E2E 夹具与 12 条景点用例；目的地 E2E 更新为选城后自动进入景区 Tab；交通 Tab 顺序断言适配四个普通 Tab。
- Living Spec：新建 `attraction-pet-rules`（6 个 Requirement）；`web-app-shell` 增加“景区浏览导航 Tab”（共 11 个 Requirement）。
- Living Spec 后续演进：main 的 PR #60 `feat/unify-location-browsing` 已将 `attraction-pet-rules` 更新为“激活行程 + 弹窗详情”语义，并把导航扩展为 6 个 Tab；本归档保留本 change 在 `070c881` 合并时的历史工件，不覆盖 PR #60 的新 Living Spec。
- 变更包已归档到 `openspec/changes/archive/2026-11-17-add-location-pet-rule-display/`。
- 编号说明：原登记 REQ-008，因 main 已将 REQ-008 用于规则页推荐，合并时改编号为 **REQ-009**。

## Verify highlights

- 本地：后端全量测试通过；前端 61/61；`tsc`/`vite build` 通过；全量 E2E **81 Pass / 4 Skipped**（skipped 为既有 `@profile-dependency` fixme）。
- CI（最终 head `2d91bd2`）：Browser E2E pass 4m57s、Server tests pass 48s、Web build pass 28s。
- PR #50 已 squash 合入 main：`070c881 feat: add pet-friendly attraction browsing (#50)`。
- Gates：G1 Revision 3 Pass（IO=SUKI，SA=RANLE）；G2 Pass（VL=RANLE）；G3 Pass（SA=RANLE）。
- 归档前 `openspec validate`：本 change 的 `attraction-pet-rules` 与 `web-app-shell` 有效；`--all --strict` 有 2 个既有 WARNING（`backend-authentication` / `frontend-authentication` 的 Purpose 仍为占位），不是本变更引入。
- KB update：`Skipped (not configured)`（按 `scripts/README.md` 的基线约定记录）；架构说明 `docs/knowledge/architecture/README.md` 已更新，但不声称 KB 校验通过。

## Residual risks

- AC-2 行程内展示延后至 US-48。
- 默认列表依赖管理员维护 `maxPetsPerPerson`；未录入/`NULL` 的地点不会出现在默认列表。
- `allowed_pet_types` 与肩高不在管理弹窗中，公开详情有值才展示。
- 归档 PR 为 docs/spec-only，head 可能没有 CI check；产品代码与 CI 全绿的 PR #50 一致。
- `openspec validate --all --strict` 的 2 个 auth Purpose 占位警告为既有基线问题，本 change 未修改。

## Links

- 功能 PR #50：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/50
- 合并提交：`070c881`（squash）
- 归档路径：`openspec/changes/archive/2026-11-17-add-location-pet-rule-display/`
- Living Spec：`openspec/specs/attraction-pet-rules/spec.md`、`openspec/specs/web-app-shell/spec.md`
- 决策记录：`g1-decision.md`、`g2-decision.md`、`g3-decision.md`
- 验证报告：`docs/ai4se-plugins/20261116-164048-local-verify-report.md`、`docs/ai4se-plugins/20261116-164048-pipeline-report.md`
