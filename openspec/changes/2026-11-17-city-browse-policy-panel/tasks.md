# Tasks

## 1. 分页

- [x] 1.1 `cities.tsx` 新增 `PAGE_SIZE = 9`、`page` 状态、`pageCount`/`currentPage`/`pageStart` 派生与 `visibleCandidates` 切片。
- [x] 1.2 `keyword`（防抖后）或 `friendlyOnly` 变化时重置到第 1 页；`currentPage` 取 `min(page, pageCount)` 防止越界。
- [x] 1.3 渲染 `<nav aria-label="城市分页">`：第 x / y 页、上一页/下一页及首末页禁用；`pageCount > 1` 时才展示。
- [x] 1.4 计数行改为「共 {总数} 个候选 · 点击卡片查看政策」，总数不随翻页变化。

## 2. 政策侧栏

- [x] 2.1 移除卡片内「查看政策」链接，卡片只保留「选定」；点击/Enter/空格在目标不是 `button, a` 时设置 `selectedCity`。
- [x] 2.2 新增 `CityPolicyPanel`/`CityPolicyCard`：标题「{城市}宠物管理政策」、更新月份、适用范围、政策要点、逐宠物结论、来源；`useQuery(cityPetPolicyQueryOptions(adcode, null))` 复用政策查询。
- [x] 2.3 布局：未选中 `max-w-5xl` 居中；选中 `max-w-[1408px]` + `min-[1408px]:grid-cols-[minmax(0,976px)_360px]`，列表列固定 976px、侧栏 360px 且宽屏 sticky；窄屏堆叠。
- [x] 2.4 侧栏链接「{政策名}禁养犬名单」→ `/destinations/{adcode}/policy#banned-breeds`，「查看完整政策与来源」→ 完整政策页。
- [x] 2.5 新增「关闭城市政策」按钮，关闭后 `selectedCity = null`，`main` 回到居中宽度，无空白右栏。
- [x] 2.6 未收录城市展示「暂无当地政策数据」；查询中/失败展示对应状态；侧栏以 `key={adcode}` 切换城市时重置。

## 3. 政策页锚点

- [x] 3.1 政策页禁养犬种名单外层加 `id="banned-breeds"` 与 `scroll-mt-6`，支持侧栏锚点跳转。

## 4. 测试与适配

- [x] 4.1 `e2e/trip-helpers.ts` 新增 `searchCity`，`openTripDialog` 先搜索再定位卡片。
- [x] 4.2 适配受分页影响的既有用例（E1/E2/E5–E9/E13），所有卡片定位先搜索；E1 断言 9 张卡片与分页。
- [x] 4.3 新增 E15 侧栏与禁养名单锚点、E16 分页与搜索重置、E17 第一页公开政策与三沙未收录、E18 关闭侧栏、E19 上饶部分名单、E20 宽窄屏几何、E21 友好/不友好结论。
- [x] 4.4 更新 `city-pet-policy.spec.ts` 入口用例（侧栏 → 完整政策页）与 `attraction-pet-rules.spec.ts` E5（先搜索杭州）。

## 5. 公开政策数据

- [x] 5.1 将旧 V26（演示）与 V27（替换）合并为单条 `V26__seed_city_policy_public_data.sql`，不保留演示数据与批量删除语句；旧迁移仅本地执行过，未进入共享环境。
- [x] 5.2 单条 V26 写入 8 个首页城市的公开政策摘录：七台河、三亚、三明、三门峡、上饶、东莞、东营、中卫；上饶映射 8 个禁养犬种。
- [x] 5.3 三沙保持未收录；三亚标注 2027-03-01 起施行；来源说明与更新月份随条目写入；上饶注明只映射犬种目录内的部分品种。
- [x] 5.4 侧栏展示来源标题与来源说明；E17 验证第一页至少 8 城有政策要点且均有来源、无「演示数据」、三沙展示覆盖范围；E19 验证上饶 8 条映射与部分名单说明。

## 6. 规格同步

- [x] 6.1 `specs/destination-selection/spec.md`：新增「候选列表分页」；改写「候选列表与政策入口」；将「禁养犬种匹配（展示暂缓）」改名为「禁养犬种精确匹配」；将「政策数据占位契约」收窄为「候选政策字段占位」。
- [x] 6.2 `specs/city-pet-policy/spec.md`：新增「候选列表城市政策侧栏」。
- [x] 6.3 proposal、design、ATDD、DoV、alignment、tasks 与本摘要落盘。

## 7. 验证

- [x] 7.1 `npx tsc --noEmit -p apps/web/tsconfig.json` 通过。
- [x] 7.2 `npm test -w apps/web`：30 文件 212 项通过。
- [x] 7.3 `e2e/destination-selection.spec.ts`：21/21 通过（约 1.5m）。
- [x] 7.4 `e2e/city-pet-policy.spec.ts` 15/15 与 `e2e/attraction-pet-rules.spec.ts` 22/22，合计 37/37 通过（约 2.0m）。
- [x] 7.5 `npx --no-install openspec validate 2026-11-17-city-browse-policy-panel --strict`：valid。
- [x] 7.6 宽窄屏几何、关闭居中、键盘打开与锚点滚动已由 E20/E15 自动化断言覆盖。

## 8. 评审修复（2026-11-17）

- [x] 8.1 合并迁移：删除演示 V26 与 V27，改为单条公开数据 V26；不再按 adcode 批量删除既有政策，消除误删风险。
- [x] 8.2 清理 `target/classes` 残留旧迁移，避免 Flyway「同一版本多个迁移」；E2E 临时库成功执行 26 个版本。
- [x] 8.3 侧栏新增来源说明展示；SDD 明确政策表无 `source_url`，可核验性限定为标题/说明可读与人工抽样。
- [x] 8.4 E15 补齐更新月份、适用范围、来源标题与说明、两只宠物原因、仍需遵守提示；新增 Enter/Space 打开与锚点滚动断言。
- [x] 8.5 E16 补首页/末页按钮禁用态、候选总数不变，并用 21 城的「广东」验证从第 2 页重置到「第 1 / 3 页」。
- [x] 8.6 E17 补每城来源断言、三沙覆盖范围说明与「不展示政策要点」。
- [x] 8.7 新增 E19：上饶页面展示 6 个示例与「等 8 种」，接口返回 8 条禁养映射，页面标注部分名单。
- [x] 8.8 新增 E20：1600px 下卡片宽度不变、侧栏在右、`max-w-[1408px]`；关闭后 `max-w-5xl`；1200px 下堆叠。
- [x] 8.9 新增 E21：侧栏友好/不友好逐宠物结论与命中时隐藏通用提示。
- [x] 8.10 将政策公开来源与核验要求从 `destination-selection` 移入 `city-pet-policy`，并改写「查询目的地的养犬政策」。
- [x] 8.11 修正 ATDD/DoV/alignment 中的证据描述与计数，区分自动化证据、有限来源口径与待办项。

## 9. 后续

- [ ] 9.1 本地开发库已执行旧 V26，合并后需删除 `apps/server/data/pawtrip.db` 并重建；E2E 临时库已验证不受影响。
- [ ] 9.2 提交评审修复、推送分支并创建 PR；补跑 CI（Web build 与 Browser E2E）。
- [ ] 9.3 G1/G2/G3 由需求方实名签署；本记录不代签。
- [ ] 9.4 归档时同步主规格 `destination-selection` 的 Purpose（移除「政策数据源未定、展示暂缓」旧口径）并合并重命名/收窄后的需求。
- [ ] 9.5 归档顺序：本变更与 `2026-11-17-export-itinerary-pdf` 不涉及同一需求，可按 PR 合并顺序分别归档；`add-intra-city-transport-estimate` 仍为未提交草稿，不参与归档。
