# Change summary — 2026-11-17-city-browse-policy-panel

- Change id: `2026-11-17-city-browse-policy-panel`
- 状态：PR #78 已合并（`e1a9829`）；侧栏摘要精简已实现并验证，尚未提交
- 分支：`feat/city-browse-policy-panel`（已合并；精简改动在工作区）

## Intent

让城市浏览页更适合逐个比较目的地：333 个城市级行政区分页展示，每页 9 张卡片；点击卡片即可在右侧查看该城市宠物管理政策，并能直接跳到具体禁养犬名单与完整政策页。关闭侧栏后列表恢复占满外框，不留下空白右栏。首页城市政策使用可查证的公开来源，不使用演示数据。

## What shipped

- 候选列表每页 9 张，展示「第 x / y 页」与上一页/下一页；关键词或筛选变化重置到第 1 页；单页时隐藏分页；首末页按钮禁用。
- 合并 `main` 的 UI PR #77：保留封面卡片、「选择」按钮、「我的行程」标签与政策面板组件，同时把本变更的分页、点击开侧栏、关闭后回归与锚点链接作为主行为接回。
- 卡片右下角提供「选择」；点击卡片非按钮区域（或 Enter/空格）打开右侧政策侧栏，再次点击其他卡片替换内容。
- 侧栏改为图 2 的摘要形态：标题、更新月份、逐宠物匹配结论、最多 3 条政策要点，以及「{城市名}禁养犬名单」「查看完整政策与来源」两个链接；完整名单、可携带犬种与来源留在政策页，侧栏不重复。
- 「关闭城市政策」按钮：关闭后侧栏移除、列表恢复占满外框。
- 页面外框与交通规则页一致（`max-w-[1662px]`）；宽屏（≥1408px）列表自适应 + 侧栏 360px 并排，窄屏堆叠。
- 政策页禁养名单新增 `id="banned-breeds"` 与 `scroll-mt-6`，并保留「仅列出部分示例」说明。
- 数据迁移合并为单条 V26：直接写入 7 个内地城市 + 三亚的公开摘录，上饶映射 8 个禁养犬种；三沙保持未收录；不含演示数据与批量删除语句。旧 V26/V27 仅存在于本地工作分支。
- E2E：`searchCity` 适配分页；E15 侧栏字段/两只宠物/键盘/锚点滚动、E16 分页禁用态与多页重置、E17 首屏数据与来源/三沙、E19 上饶 8 条映射、E20 宽窄屏几何、E21 友好/不友好结论；同步更新 `city-pet-policy` 与 `attraction-pet-rules` 入口路径。

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| TypeScript | Pass | `npx tsc --noEmit -p apps/web/tsconfig.json` exit 0 |
| 前端单测 | Pass | `npm test -w apps/web`：29 文件 209 项通过 |
| 城市浏览 E2E | Pass | `destination-selection.spec.ts` 21/21（约 1.7m，侧栏精简后重跑） |
| 政策与景点 E2E | Pass | `city-pet-policy.spec.ts` 16/16 + `attraction-pet-rules.spec.ts` 22/22 = 38/38（约 2.1m） |
| 迁移 | Pass | 单条 V26 在全新临时库执行成功；E17/E19 校验数据；开发库未被修改 |
| 布局几何 | Pass | 2026-11-19：1800px 城市浏览与交通规则外框均 1614px；打开侧栏外框不变、两列 1178px + 360px；1600px 卡片 484px → 356px；1200px 堆叠 |
| 公开数据口径 | Pass（有限） | 来源标题与说明可读、无「演示数据」；无 `source_url`，仅人工抽样核验 |
| OpenSpec validate | Pass | `openspec validate 2026-11-17-city-browse-policy-panel --strict`：valid |
| 本地开发库 | 待重建 | 旧 V26 已执行，合并后校验和不一致；需删除 `apps/server/data/pawtrip.db` 后重建 |
| CI | 未执行 | 工作区修改未提交/推送，尚无 PR |
| G1 / G2 / G3 | 未签署 | 需需求方明确指示并实名后补记录 |

## 评审修复（2026-11-17）

- 消除「演示迁移 → 删除演示」的历史叙事：合并为单条公开数据 V26，不再批量删除既有政策。
- 侧栏补来源说明，SDD 明确来源可核验性边界，不再把「有标题」等同于「可公开查证」。
- 补齐 Scenario 证据：分页多页重置与禁用态、侧栏必填字段、两只宠物、键盘、锚点滚动、三沙覆盖范围、上饶部分名单、宽窄屏几何、友好/不友好三态。
- 将公开来源要求从 `destination-selection` 移入 `city-pet-policy`，修正 ATDD/DoV/alignment 的计数与表述。

## 修订（2026-11-19）

- 需求方要求城市浏览页外框与交通规则页尺寸一致：未选中/选中统一 `max-w-[1662px]`，选中态两列改为 `minmax(0,1fr)_360px`，打开侧栏时外框宽度不变、列表列自适应变窄。
- 卡片操作按钮由「Pick」改为「选择」，移至整张卡片右下角（`mt-auto flex justify-end`），不再绝对定位在封面下方。
- 验证：`tsc --noEmit`、`npm run build -w apps/web` 通过；目标 5 个 spec 33 passed；`validate --strict` valid。
- 早期 ATDD/DoV/alignment 中关于 E20、`max-w-5xl`/`max-w-[1408px]`、976px 定宽与「Pick」的记录为历史证据，已被本节替代。

## P1–P5 状态

- P1 proposal：完成。
- P2 specs / design / DoV / alignment：完成；G1 未签。
- P3 ATDD / tasks：完成；ATDD 为回溯记录，不作为 TDD 证据。
- P4 实现与本地验证：完成；合并 main 后 tsc、209 条单测、21 + 38 条 E2E 全部通过；布局几何已自动化；本地开发库待重建。
- P5：PR #78 已合并（`e1a9829`）；侧栏精简已本地验证，未提交；G1–G3 未签；未归档。

## Residual risks / follow-ups

1. 政策条文为人工摘录，可能与地方最新文件不一致；页面提示以当地政府最新文件为准。
2. 三亚规定 2027-03-01 起施行，尚未生效，已在来源标题与说明标注。
3. 三沙未查到已施行的公开养犬规定，保持未收录。
4. 政策表无 `source_url`，侧栏与政策页只展示来源标题与说明；不宣称逐条可打开原文。
5. 上饶仅映射 35 个禁养品种中的 8 个，页面标注部分名单。
6. 候选接口 `policyCovered`/`bannedBreeds` 仍为占位，未接入真实覆盖状态。
7. 客户端分页一次加载全部候选；数量继续增长时需评估服务端分页。
8. 合并后的 V26 与本地已执行旧 V26 校验和不一致，需重建本地开发库。
9. 归档时需同步主规格 Purpose，移除「政策数据源未定、展示暂缓」旧口径。

## Links

- Proposal: `proposal.md`
- Design: `design.md`
- Specs: `specs/destination-selection/spec.md`、`specs/city-pet-policy/spec.md`
- ATDD: `atdd-design.md`
- DoV: `dov-ac-review.md`
- Alignment: `alignment-self-check.md`
- Tasks: `tasks.md`
