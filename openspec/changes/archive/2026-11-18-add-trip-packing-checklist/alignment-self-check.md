# Alignment self-check — 2026-11-18-add-trip-packing-checklist

- 日期：2026-11-18（P3 task-plan 最终步骤）
- 四方工件：Delta Spec（`specs/trip-packing-checklist`、`specs/trip-itinerary`）↔ `design.md`（D1–D9）↔ `tasks.md`（5 组 31 项）↔ `atdd-design.md`（API + 组件 + E2E）
- 方法：逐需求追溯 + 横切一致性检查；证据为工件内精确锚点（需求名 / 决策号 / 任务号 / ATDD 表行）

## 1. 需求级四方追溯

| Delta 需求 | 场景数 | Design | Tasks | ATDD 层行 | 结论 |
|---|---|---|---|---|---|
| tpc「行程归属与清单生成」 | 5 | D1 数据模型、D2 API 契约、D5 生成幂等 | 1.2、2.1–2.3、3.1–3.3 | §1 行 1–5；§2.1 A1–A3、A9 | Pass |
| tpc「模板与场景映射」 | 5 | D3 模板与映射、D4 尺寸分档 | 1.1、1.6、2.4 | §1 行 6–10；§2.2 T1–T6 | Pass |
| tpc「读取时同步档案与行程」 | 5 | D5 同步算法（插入/刷新/隐藏/复活/墓碑） | 1.4、3.1 | §1 行 11–15；§2.1 A7–A8 | Pass |
| tpc「自定义物品增删改」 | 4 | D2 更新规则、D6 前端查询与 mutation | 1.3、1.7、3.1–3.3、4.2 | §1 行 16–19；§2.1 A4/A5/A11；§2.3 C4/C7；E2 | Pass |
| tpc「勾选与打包进度」 | 4 | D5 进度口径、D2 响应 `progress` | 1.3、1.7、3.1–3.2、4.2 | §1 行 20–23；§2.1 A6/A12；§2.3 C3；E1 | Pass |
| tpc「未生成与无档案降级」 | 2 | D2 404 不自动生成、409 无档案 | 1.2、3.3、4.3 | §1 行 24–25；§2.1 A2/A3；§2.3 C1/C2 | Pass |
| tpc「清单项契约」 | 3 | D2 响应契约、D1 字段模型 | 1.7、3.2 | §1 行 26–28；§2.1 A10/A4/A6 | Pass |
| ti「携带清单入口与进度」 | 3 | D6 入口与进度文案、D8 导出隔离 | 4.4、5.1、5.6 | §1 行 29–31；E1、E5；`e2e/itinerary.spec.ts` 回归 | Pass |
| ti「携带清单弹窗与操作」 | 6 | D6 弹窗与操作、D7 状态分支 | 4.2、4.3、4.6、4.7、5.1–5.2、5.6 | §1 行 32–37；C3/C4/C7/C8/C9；E1/E2/E4 | Pass |
| ti「携带清单状态引导」 | 5 | D7 引导与状态分支 | 4.3、4.7、5.1 | §1 行 38–42；C1/C2/C3/C5/C6；E1 | Pass |

- tpc = `trip-packing-checklist`；ti = `trip-itinerary`。
- 场景合计：28 + 14 = 42，全部在 ATDD §1 有层归属。

## 2. 横切一致性检查

| # | 检查项 | 证据 | 结论 |
|---|---|---|---|
| 1 | 分类枚举统一大写 `DOCUMENTS/FOOD/TRAVEL/HEALTH/CLEANING` | spec = design D1/D3 = V30 CHECK = 后端枚举/响应 = 前端类型与分组 | Pass |
| 2 | 数量规则（主粮 `days×2`、尿垫 `max(1, days)`、1–99） | spec = design D3 = 迁移 CHECK = service 校验 = ATDD T6 | Pass |
| 3 | 尺寸分档（体重 5/15、肩高 35/55） | spec 场景 = design D3 = `PackingTemplate` = ATDD T6 | Pass |
| 4 | 模板为代码内静态常量、无 AI/外部服务 | spec 模板需求 = design Non-Goals = ATDD §5 反向 | Pass |
| 5 | HIDDEN/DELETED/`quantity_overridden` 语义 | spec 同步需求 = design D1/D5 = service `sync` = A7/A8 | Pass |
| 6 | 进度按可见物品行，分母随增删变化 | spec 进度需求 = design D5 = 后端 `progress` = A6/A12 + E1 | Pass |
| 7 | 属主边界与认证（401 / 他人 404） | spec 场景 = design D2 = A2 | Pass |
| 8 | 错误码三件套 | spec 降级需求 = design D2 = `ApiErrorCode` = A2/A3/A5 | Pass |
| 9 | 每行程一份清单、删除行程级联 | spec 生成需求 = design D1 = A9 + 迁移测试 | Pass |
| 10 | V30 只新增两张表与索引 | design Migration Plan = 迁移测试 = ATDD §4 | Pass |
| 11 | 入口与弹窗形态复用路线规划 | spec ti 入口/弹窗 = design D6 = itinerary 同层容器 = E1 | Pass |
| 12 | 弹窗与导出隔离 | spec ti 导出场景 = design D8 = `print:hidden` = 5.6/5.7 | Pass |
| 13 | 档案变更后清单查询失效 | design D6 = tasks 4.5 = `-pet-dialogs` 前缀失效 | Pass |
| 14 | 模板项与自定义项编辑边界 | spec 增删改需求（G1 修订）= design D2/D6 = service `updateCustom`/`updateTemplate` = A4/A11 | Pass |
| 15 | GET 读取同步写库的已知风险 | design Risks + dov-ac-review Residual | Pass（非阻塞知悉） |
| 16 | tasks 链接双设计工件 | tasks 头部新增 `design.md` 与 `atdd-design.md` 链接 | Pass |
| 17 | 红测先行可执行 | tasks 1.1–1.8；ATDD §2 A10–A12、T6、C5–C9、E4–E6 | Pass |
| 18 | 场景计数 | tpc 5+5+5+4+4+2+3=28；ti 3+6+5=14；合计 42 = ATDD §1 行 1–42 | Pass |
| 19 | 无范围膨胀（AI、提醒、购物、独立导出、计划/档案字段） | proposal Out = design Non-Goals = ATDD §5 反向 | Pass |
| 20 | E2E 种子隔离 | ATDD §4 明确豆豆体重在 `finally` 恢复；tasks 5.2 同步 | Pass |
| 21 | 不新增 CI 语义 | ATDD §3 沿用 server/web/e2e 工作流 | Pass |
| 22 | NFR 口径 | ATDD §6 明确不纳入（沿用既有约定） | Pass |

## 3. P3 修订记录

| 修订 | 内容 | 原因 |
|---|---|---|
| 新增 `atdd-design.md` | 42 场景分层、A10–A12 / T6 / C5–C9 / E4–E6 红测清单、夹具与反向验证 | P3 ATDD 验收驱动 |
| tasks 头部 | 同时链接 `design.md` 与 `atdd-design.md` | 双设计工件可追溯 |
| tasks 1.6–1.8 | 补模板边界、契约/改名/全量完成红测，原「先失败」顺延为 1.8 | 覆盖 spec 契约与边界场景 |
| tasks 4.7 | 补组件状态红测（失败重试、空态、删除、错误、数量回滚） | 补齐 ti 状态引导与操作失败场景 |
| tasks 5.2 | 明确豆豆体重在 `finally` 恢复 | 防止污染同 worker 其他 spec |
| tasks 5.6–5.7 | 补关闭弹窗保持 Day、打印媒体隐藏与 `itinerary` 导出回归 | 覆盖 ti 导出与只读场景 |

## 4. 结论

**Overall: Pass**（10/10 需求追溯 + 22/22 横切检查；42 个 Delta 场景全部有层归属）。计划可进入 `/sdd:quality-checklist`（P3 DoV）与后续 `/sdd:atdd-apply`。本自检不构成 Gate 决定。
