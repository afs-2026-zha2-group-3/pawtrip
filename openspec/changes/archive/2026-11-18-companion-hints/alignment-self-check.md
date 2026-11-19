# Alignment self-check — 2026-11-18-companion-hints

- 日期：2026-11-18（P3 task-plan 最终步骤）
- 四方工件：Delta Spec（`specs/companion-hints/spec.md`）↔ `design.md`（D1–D8）↔ `tasks.md`（5 组 35 项）↔ `atdd-design.md`（Unit + Component + E2E）
- 方法：逐需求四方追溯 + 横切一致性检查；证据为工件内精确锚点（需求名 / 决策号 / 任务号 / ATDD 行号）
- 口径来源：需求方 2026-11-18 确认「复用现有 Chatbot 入口、每切换页面出现、保持 5s、点击即 AI 面板」

## 1. 需求级四方追溯

| Delta 需求 | 场景数 | Design | Tasks | ATDD 层行 | 结论 |
|---|---|---|---|---|---|
| R1「伙伴气泡复用现有 Chatbot 入口」 | 3 | D1、D5、D7 | 1.3、1.4、1.8、1.9、4.3、4.4 | §1 行 1–3；C9/C10/C11；A1–A3；E3/E4 | Pass |
| R2「气泡署名与内容」 | 3 | D2、D5 | 1.4、1.5、4.2、4.3 | §1 行 4–6；C7/C8/C12；A4 | Pass |
| R3「路由切换自动展示与自动关闭」 | 5 | D2、D3、D4 | 1.1、1.2、1.6、1.7、2.1–2.7、4.1、4.2、4.4 | §1 行 7–11；U1–U5；C1–C6；E1/E2/E5 | Pass |
| R4「统一提示接口与业务反馈」 | 5 | D2、D5、D6 | 1.1、1.2、2.1–2.7、3.1–3.6、4.1–4.6 | §1 行 12–16；U2/U8；C15；E1；B1–B4；4.6 源码检查 | Pass |
| R5「非模态、窄窗与挂载边界」 | 5 | D5、D7、D8 | 1.4、1.5、1.9、4.2、4.4、4.6 | §1 行 17–21；C12–C15；E3/E4/E5；既有 `trip-planning-agent` 登录页断言 | Pass |

- R = `companion-hints` 需求序号。
- 场景合计：3 + 3 + 5 + 5 + 5 = 21，全部在 ATDD §1 有层归属，无遗漏。
- 业务事件判定复用 `evaluateRuleForPet` / `violatedLimitTags` / `matchCityCandidate`，mood 透传由 U1/U2 覆盖，判定组合由 B1–B4 覆盖。

## 2. 横切一致性检查

| # | 检查项 | 证据 | 结论 |
|---|---|---|---|
| 1 | 唯一入口，不新增第二个头像 | spec R1 = design D1 = tasks 1.3/1.8 = C10 + A2 + E3 | Pass |
| 2 | 入口位置/尺寸/图标/测试标识/可访问名不变 | spec R1 = design D1/D5 = tasks 1.3 = C9 + A1 + `trip-planning-agent` 回归 | Pass |
| 3 | 点击入口直接打开面板，不先弹气泡 | spec R1 = design D1 = tasks 1.3 = C9 + A1 + E3 | Pass |
| 4 | 入口不依赖激活行程 | spec R1 = design D1 = tasks 1.3 = A1（既有用例） | Pass |
| 5 | 气泡位于入口上方、同一固定容器 | spec R1/R2 = design D1/D5 = tasks 1.4 = C13 + E3 boundingBox | Pass |
| 6 | 署名取第一只宠物，无档案回退「豆包」 | spec R2 = design D5 = tasks 1.5 = C7 + A4 | Pass |
| 7 | 关闭按钮可用且不关闭入口 | spec R2 = design D5 = tasks 1.5 = C8 | Pass |
| 8 | 气泡无头像/图标/「AI 规划」按钮 | spec R2 = design Non-goals/D5 = tasks 1.5 = C12 + ATDD §5 | Pass |
| 9 | 每 5000ms 自动关闭 | spec R3 = design D4 = tasks 1.6 = C4 + E2 | Pass |
| 10 | 每个 pathname 只自动展示一次 | spec R3 = design D3 = tasks 1.2/1.6 = C2/C3 + E1 | Pass |
| 11 | 首挂载/刷新不自动展示 | spec R5「状态不持久化」= design D3 = tasks 1.6 = C1 + E5 | Pass |
| 12 | 新气泡替换旧气泡并重新计时 | spec R3 = design D2/D4 = tasks 1.1/1.6 = U2/U3/C5 | Pass |
| 13 | 未过期事件优先，关闭后补 hint | spec R3 = design D3 = tasks 1.7 = C6 | Pass |
| 14 | `say(text, mood)` 四情绪与边框映射 | spec R4 = design D2/D5 = tasks 1.1/1.5 = U1 + C12 `data-mood` | Pass |
| 15 | 7 页提示无盲区 | spec R4 = design D6 = tasks 2.1–2.7 = E1 + 4.6 源码检查 | Pass |
| 16 | 数据未就绪不展示误导提示 | spec R4 = design D3 = tasks 1.2/2.x = C15 | Pass |
| 17 | 业务事件全部经 `say()`，页面不自建气泡 | spec R4 = design D6 = tasks 3.1–3.6 = B1–B4 + ATDD §5 | Pass |
| 18 | 非模态、不抢焦点、不阻塞滚动/点击 | spec R5 = design D5 = tasks 1.5 = C12/C14 | Pass |
| 19 | 窄窗收窄且不遮挡关键操作 | spec R5 = design D5 = tasks 1.4 = C13 + E1 真实视口 | Pass |
| 20 | `/admin/*` 无气泡但保留入口 | spec R5 = design D7 = tasks 1.9 = C11 + E4 | Pass |
| 21 | `/login` 无入口与气泡 | spec R5 = design D7 = tasks 1.9 = 既有 `trip-planning-agent` E2E | Pass |
| 22 | 状态仅内存、刷新丢失 | spec R5 = design D2 = tasks 1.6 = U8 + E5 | Pass |
| 23 | E2E 新增用例 ≤ 30 | ATDD §2.4 新增 5 项；§2.5 仅扩断言不新增用例 | Pass（5/30） |
| 24 | 前端不红测、直接实现口径 | ATDD 头部 + tasks 头部声明；测试与实现同步补齐 | Pass |
| 25 | 零后端、零迁移、零新依赖 | proposal Out = design Migration = ATDD §5 反向检查 | Pass |
| 26 | tasks 链接双设计工件 | `tasks.md` 头部同时链接 `design.md` 与 `atdd-design.md` | Pass |
| 27 | 场景计数一致 | spec 3+3+5+5+5=21 = ATDD §1 行 1–21 | Pass |
| 28 | NFR 口径 | ATDD §6 明确不纳入，功能验收不另立 NFR | Pass |
| 29 | 与 Living Spec 不冲突 | 无 `trip-planning-agent` / `web-app-shell` delta；`openspec validate --strict` 通过 | Pass |
| 30 | 旧 WIP 口径清理有任务承接 | design Risks + tasks 1.8 明确删除独立头像、4600ms、气泡 AI 按钮 | Pass |

## 3. P3 修订记录

| 修订 | 内容 | 原因 |
|---|---|---|
| 新增 `atdd-design.md` | 21 场景分层；U1–U8 / C1–C15 / A1–A4 / E1–E5 / B1–B4 测试清单；夹具、门禁、反向验证 | P3 验收驱动 |
| `design.md` D3 | 明确 `autoShownPath` 初始化为当前 pathname，首挂载与刷新不自动展示 | 消除「每切换页面出现」与「状态不持久化」的歧义 |
| `tasks.md` | 重排为「实现 + 同步测试」，链接双设计工件；新增旧口径清理、事件扩断言、DoV 回填 | 对齐前端直接实现约定与 ATDD 分层 |
| 业务事件层 | 明确在既有两个业务 spec 内追加 `data-mood` 断言（B1–B4），不新增 E2E 用例 | 控制 E2E 数量并覆盖真实触发路径 |
| `tasks.md` 4.2 | 补充 C15（hint 未就绪不弹） | 覆盖 R4「数据未就绪不展示」 |
| `design.md` D1/D5 + tasks 1.3 | 入口保留原 `Bot` 图标与按钮样式，不改为宠物照片 | 与 spec R1「保留原有样式」对齐 |

## 4. 结论

**Overall: Pass**（5/5 需求追溯 + 30/30 横切检查；21 个 Delta 场景全部有层归属；E2E 新增 5 项，满足 ≤30 上限）。计划可进入 P3 质量清单与后续 P4 实现。本自检不构成 Gate 决定。
