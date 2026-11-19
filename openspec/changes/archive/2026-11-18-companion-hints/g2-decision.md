# G2 decision — 2026-11-18-companion-hints

- Gate: G2（Verify）
- Change id: `2026-11-18-companion-hints`（REQ-018 伙伴提示气泡，US-52）
- Inputs:
  - local-verify: `docs/ai4se-plugins/20261119-093534-local-verify-report.md`（**Overall Pass**：后端 271 / 前端 364 / tsc / build / 全量 E2E 104 / `validate --strict` 通过）
  - pipeline ci: `docs/ai4se-plugins/20261119-093530-pipeline-report.md`；change 内槽位 `openspec/changes/2026-11-18-companion-hints/ci-report.md`（**Overall Pass，E1 全绿**：合并后 main run 44436980655；PR run 44435747026 同样全绿）
  - pipeline cd: n/a（仓库仅 `.github/workflows/ci.yml`，无独立部署工作流）
  - PR: #151（`feat/companion-hints` → `main`，合并提交 `764a08bb5dc3ec89f4f78a005367c56c8e7114cf`，merged 2026-11-19T01:26:58Z）
- Dimension results:
  - build: Pass（`./mvnw test` 271；vitest 49 files / 364；`tsc --noEmit` 无错误；`npm run build -w apps/web` 成功）
  - scan: Skipped / n/a（仓库无独立 secret-scan/SAST 作业；已核对本次提交无 `.env`/密钥文件）
  - review: Pass（入口复用 `agent-fab`；打开面板隐藏气泡；admin 无气泡；预览缓存键隔离；文案统一宠物第一人称并同步 E2E）
  - evidence: Pass（tasks 全勾选；proposal/design(D1–D8)/atdd-design/alignment-self-check/dov-ac-review 与实现一致；`validate --strict` 通过）
  - ci: Pass（PR CI 与合并后 main CI 全绿；Backend tests 因纯前端 diff 按变更检测跳过，由本地 271 补证）
  - cd: n/a
- Defect grades: CRITICAL 0 / WARNING 0 / SUGGESTION 0
- Decision: **Pass**
- Waivers / conditions + owners: 无。以下为已接受残余风险（不构成 Gate 条件）：
  1. CI Backend tests 因 paths 过滤跳过（纯前端变更）——本地 `./mvnw test` 271 passed 补证（owner=SA）
  2. `tsc --noEmit` 不在 CI 门禁——本地 tsc 通过（owner=SA）
  3. 仓库无独立 CD/部署工作流——与既有 change 口径一致，记为 n/a（owner=SA）
  4. 气泡文案为产品口吻，E2E 仅断言关键短语；文案微调需同步断言（owner=SA）
  5. 提示仅存内存，刷新丢失——设计 D2 明确行为（owner=IO）
- Approvers: VL=**TANTA6**（用户本会话明确签署；2026-11-19）
- Timestamp: 2026-11-19（Asia/Shanghai）

## Traceability appendix

| Requirement | Spec | Code | Test |
|-------------|------|------|------|
| 复用 Chatbot 入口，点击打开 Agent 面板（打开时气泡隐藏） | `specs/companion-hints/spec.md` R1 | `apps/web/src/components/agent/agent-panel.tsx` / `components/companion/companion.tsx` | `agent-panel.test.tsx` A1–A4 + 面板打开用例 / `e2e/companion-hints.spec.ts` E3 |
| 气泡署名与第一人称内容 | R2 | `components/companion/companion.tsx` / 各页 `useCompanionHint` | `companion.test.tsx` C7–C8 / E1 |
| 路由切换自动展示、5 秒自动关闭、事件优先 | R3 | `lib/companion/{store,selectors,use-companion-hint}.ts` | `store.test.ts` U1–U8 / `companion.test.tsx` C1–C6 / E1–E2 |
| 四档情绪与业务事件反馈 | R4 | 七页 `companionActions.say()` 调用点 | `e2e/{paws-pet-management,city-pet-policy,attraction-pet-rules,rule-recommendation-and-selection}.spec.ts` |
| 非模态、可访问性、边界（login/admin/窄窗/内存态） | R5 | `companion.tsx` / `agent-panel.tsx` | `companion.test.tsx` C10–C15 / E4–E5 |
