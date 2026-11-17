# G2 decision — 2026-11-17-restore-policy-entry-and-trip-dialog

- Gate: G2 (Verify)
- Change id: `2026-11-17-restore-policy-entry-and-trip-dialog`
- Inputs:
  - Local verify:
    - `npx tsc --noEmit -p apps/web/tsconfig.json`：Pass
    - `npm test -w apps/web`：15 文件 99 用例通过（含 `duration.test.ts` 3 用例）
    - `CI=1 npm run test:e2e --` 受影响 7 个 spec：82 passed / 0 failed
    - 内置浏览器结构验证：`/cities` 卡片含「查看政策」；「选定」打开创建行程对话框
  - PR: 待推送后补充
  - CI runs: 待 PR 后补充（Server tests / Web build / Browser E2E）
- Dimension results:
  - Build: Pass（tsc、Vitest、Vite 开发服务运行；生产构建待 PR CI）
  - Static scan: n/a（仓库 CI 基线未配置独立 secret scan/SAST）
  - Code review: Pass（纯前端；无 `apps/server` 变更、无新增 API/依赖；仅修正 `store.ts` 的 `TransportMode` 导入来源以消除既有 `tsc` 报错）
  - Evidence: Pass（受影响 E2E 50/50；政策入口、弹窗确认、日期校验、景点跳转均有对应用例）
  - E3 Human: Signed（VL=SCOTT，2026-11-17 确认）
- Defect grades:
  - CRITICAL: 无
  - WARNING: 无
  - SUGGESTION: 全量 E2E 与三条 CI 工作流在 PR 后补跑；草稿死代码后续清理
- Decision: **Pass**
- Conditions + owners: CI 证据（三条工作流）在 PR 落地后追加到本记录（SA）；无阻塞条件
- Approvers: VL=SCOTT
- Timestamp: 2026-11-17（Asia/Shanghai）

> 本记录依据 VL=SCOTT 的明确决定转写；G3（合并归档）待 PR 合并后另行签署。
