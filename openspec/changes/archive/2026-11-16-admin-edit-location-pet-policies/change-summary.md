# Change summary — admin-edit-location-pet-policies

## Intent

`pawtrip_location` 已有 6 项宠物政策字段，但管理 API 与两个地点弹窗尚未暴露，管理员无法录入或修正真实政策。本变更补齐现有管理入口，为后续公共展示提供可用数据。

## What shipped

- 管理 API 增加可选 `petPolicies` 对象：创建/更新接受 6 个可空字段，详情返回；PATCH 缺省不改，出现则整体替换。
- “保存地点”和“pawtrip地点”两个现有弹窗增加共享政策表单，支持三态布尔、空值、元/分换算与校验；政策适用于所有地点类型。
- 更新时保留上游新增的 `allowedPetTypes` 与 `maxSinglePetShoulderHeightCm` 字段。
- 修复 Windows e2e teardown：等待子进程关闭并对临时目录删除做 `EBUSY/EPERM` 重试。
- Living Spec `location-management` 新增“管理员编辑地点宠物政策”与“管理 API 暴露地点宠物政策”两个 Requirement。
- 变更包已移入 `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies/`。

## Verify highlights

- 本地验证 Overall Pass：build 通过、后端 80 tests、e2e 11 passed。
- GitHub Actions 6 个 check 全绿（Browser E2E、Server tests、Web build）。
- `openspec validate --specs`：14 passed，0 failed。
- 报告：`docs/ai4se-plugins/20261116-131218-local-verify-report.md`、`docs/ai4se-plugins/20261116-131758-pipeline-report.md`。

## Residual risks

- 上游新增的 `allowedPetTypes` / `maxSinglePetShoulderHeightCm` 尚未在本需求 UI/API 暴露；当前更新时保留、创建时为空。
- 政策公共页面/行程展示属于 US-17 / US-25 后续范围。
- 详情响应新增 `petPolicies` 对象，部署时建议先后端再前端。
- 本机 Maven wrapper 缓存需对齐；CI 标准流程不受影响。

## Links

- PR #37（功能，已 squash 合并）：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/37
- PR #38（归档）：https://github.com/afs-2026-zha2-group-3/pawtrip/pull/38
- Living Spec：`openspec/specs/location-management/spec.md`
- 决策记录：`g1-decision.md`、`g2-decision.md`
- 验证报告：`docs/ai4se-plugins/20261116-131218-local-verify-report.md`、`docs/ai4se-plugins/20261116-131758-pipeline-report.md`
