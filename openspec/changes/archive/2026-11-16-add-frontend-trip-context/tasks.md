# Tasks

## 1. 依赖与基础能力

- [x] 1.1 在 `apps/web/package.json` 增加直接依赖 `@tanstack/store`、`@tanstack/react-store`（0.11.x）与 `@dnd-kit/core`、`@dnd-kit/sortable`，更新锁文件。验证：`npm install` 后 `npm run build` 通过，无重复版本警告。
- [x] 1.2 vendor React Bits AnimatedList 为 `apps/web/src/components/ui/animated-list.tsx`：删除默认 `DEFAULT_ITEMS` 与 `@hugeicons/*` 导入，保留动画引擎与 props；增加不可选中的分组表头能力（`role=presentation`，跳过 hover、选中与键盘导航）。验证：TypeScript 编译通过，组件可在面板中渲染表头与行。
- [x] 1.3 新增统一匹配纯函数：`apps/web/src/lib/trip/policy-subjects.ts`（`active?.petId ? [pet] : allPets`）与 `apps/web/src/lib/trip/policy-match.ts`（城市类型/品种/肩高、景点类型/限养/体重/肩高/牵引/疫苗，输出友好/不友好/无法判定/未配置与原因）。验证：新增 vitest 用例覆盖有 active、无 active、加载失败、无法判定与未配置。

## 2. 后端景点列表政策字段

- [x] 2.1 为用户端景点列表响应增加每项 `petPolicies`（8 字段，与详情一致），保持既有字段与查询参数不变。验证：`cd apps/server && ./mvnw -q -Dtest=LocationQueryApiTest test` 通过，列表项包含完整政策。
- [x] 2.2 扩展后端测试断言：默认筛选与 `includeWithoutRules=true` 两种列表均返回 `petPolicies`，且空值语义与详情一致。验证：后端相关测试通过。
- [x] 2.3 确认响应为纯增量：既有 `poiId`、`name`、`address`、`maxPetsPerPerson`、分页字段不变。验证：对比旧测试断言或快照无破坏。

## 3. Trip Store 与持久化

- [x] 3.1 定义 `apps/web/src/lib/trip/types.ts`：`TripPlan`、`Trip`、`DraftTrip`、`TripState` 与缓存类型；`plan` 与 DB 完全同构，不附加视图字段。验证：类型编译通过，字段与 `TripResponses` 一致。
- [x] 3.2 实现 `apps/web/src/lib/trip/store.ts`：客户端单例 `createStore<TripState>`，actions 覆盖 `startDraft`、`updateDraft`、`discardDraft`、`setActive`、`clearActive`、`addStop`、`moveStop`、`removeStop`、`setPanelExpanded`、`setSaveStatus`、`cache` 写入。验证：store 单元测试覆盖动作后的 `plan` 形状与缓存。
- [x] 3.3 实现 `activeTripId` 持久化与 hydrate：localStorage 只写该键；登录成功后 `GET /api/trips/{id}`，200 写入 `active`，404/401 清除，网络失败保留 id 并允许重试；SSR 阶段 store 为空。验证：单测覆盖四条路径；服务端渲染不读取 localStorage。
- [x] 3.4 实现选择器与 hooks：`useActiveTrip`、`useTripCity`、`useTripPet`、`usePolicySubjects`、`usePanelExpanded`、`useSaveStatus`，使用 `useSelector` 细粒度订阅。验证：组件测试或类型检查通过，订阅字段变化时才重渲染。
- [x] 3.5 登出集成：确认登出成功后清除 `activeTripId`、`active`、草稿与行程地点缓存，并调用既有 `queryClient.clear()`。验证：单测或 E2E 断言刷新后不恢复旧行程。

## 4. Trips 页与激活生命周期

- [x] 4.1 新增 `/trips` 路由与导航 Tab，更新 `routeTree.gen.ts` 生成结果；登录守卫与路由选中状态同步。验证：直接访问 `/trips` 渲染列表页且 Tab 选中。
- [x] 4.2 实现 Trips 列表：`GET /api/trips` 按 id 升序，join 城市名与宠物名，展示城市、天数、宠物与激活状态。验证：两个行程的列表顺序与字段正确。
- [x] 4.3 实现激活、取消激活与删除：激活拉取详情写 store；删除激活中的行程先取消激活再 `DELETE`；失败保留原状态并提示。验证：E2E 覆盖三条路径与 `404` 兜底。
- [x] 4.4 实现互斥规则：存在激活行程时创建入口不可用；存在草稿时激活其他行程被阻止并提示先放弃草稿。验证：E2E 覆盖两个阻断场景。
- [x] 4.5 空态与草稿隔离：无行程时展示创建引导；草稿不出现在列表。验证：无行程与有草稿两种状态渲染正确。

## 5. 城市页改造

- [x] 5.1 移除 `/cities` 对 `selected-destination`、`trip-duration`、天数输入与确认提示的引用。验证：grep 无相关导入，页面可编译。
- [x] 5.2 无激活且无草稿时保留候选列表、搜索与宠物友好筛选；点击「选定」创建草稿、切换到城市详情并展开面板，不发送创建请求。验证：E2E 断言无 `POST /api/trips` 且页面进入详情。
- [x] 5.3 有激活或草稿时只渲染城市详情：城市名/省份、政策要点、允许宠物条件、景点数量与完整政策页链接；复用现有接口，不新增端点。验证：详情字段来自三个既有接口。
- [x] 5.4 候选卡片匹配标签改为逐宠物 tag（全部宠物），覆盖友好/不友好/无法判定、无宠物与接口失败。验证：组件测试或 E2E 覆盖四种状态。
- [x] 5.5 删除 `apps/web/src/lib/selected-destination.ts`、`apps/web/src/lib/trip-duration.ts` 及其单测；启动/登录后清理 `pawtrip.selectedDestination` 与 `pawtrip.tripDuration` 残留键。验证：grep 无旧键引用，旧键被移除。
- [x] 5.6 重写 `e2e/destination-selection.spec.ts` 与 `e2e/trip-duration-input.spec.ts`：覆盖创建草稿、确认、刷新丢草稿与候选/详情切换。验证：Playwright 用例通过。

## 6. 景点页与统一政策匹配

- [x] 6.1 改造 `/attractions`：以 `active.cityAdcode` 为唯一城市；无激活或仅草稿时展示"先创建或激活行程"空态且不请求列表；天 tab 由 `totalDays` 生成。验证：E2E 覆盖三种状态与 tab 数量。
- [x] 6.2 在列表卡片与详情增加「加入第 N 天」与「暂不排期」：N 取当前天 tab；写入 `plan` 并触发乐观更新；草稿期不展示入口。验证：E2E 覆盖加入当天、未排期与重复加入。
- [x] 6.3 列表卡片与详情使用新增 `petPolicies` 按统一主体展示逐宠物 tag；未配置维度跳过，无法判定单独展示。验证：E2E 在激活/无激活两种状态下断言 tag 数量。
- [x] 6.4 城市政策页与交通规则页接入统一主体：有激活宠物只评估该宠物，否则全部宠物；加载失败不显示"无宠物"。验证：E2E 或组件测试覆盖有/无激活两种状态。
- [x] 6.5 补充匹配纯函数单测：类型不允许、品种为空放行、肩高超限、限养 0、牵引/疫苗不足、`null` 跳过。验证：`npm test` 相关用例通过。

## 7. 行程面板与拖拽

- [x] 7.1 新增全局行程面板组件：折叠态左下角浮层、tag 行（草稿期城市只读 + 天数 1–7 + 宠物单选 + 确认/放弃；激活期只读 + 保存状态）、展开/收起按钮。验证：草稿与激活两种渲染状态正确。
- [x] 7.2 使用 AnimatedList 渲染分组列表：每天表头 + stops + "未排期"表头 + unscheduled，按 `day` 升序与数组顺序。验证：分组、空白天、空未排期渲染正确。
- [x] 7.3 接入 `@dnd-kit`：每天与未排期作为容器，stop 行为 sortable；专用拖拽把手、`DragOverlay`、跨天移动与同日排序；重复 `poiId` 使用派生 key。验证：E2E 覆盖同日排序、跨天移动、拖入/拖出未排期与重复地点。
- [x] 7.4 实现乐观更新与防抖保存：约 600ms 合并 `PUT`，版本号守卫；失败保留本地并提供重试；`400` 时重新拉取详情以服务端为准。验证：E2E 或集成测试覆盖成功、网络失败、重试与 `400`。
- [x] 7.5 在认证布局实现展开后内容右挤：桌面端左侧固定宽度、页面在剩余区域居中；移动端展开为全屏面板；`/login` 不渲染面板。验证：三种视口下布局与面板可见性正确。
- [x] 7.6 补充行程面板 E2E：确认前禁止加入与拖拽、确认后可编辑、保存状态展示、取消激活后面板回到无行程状态。验证：Playwright 用例通过。

## 8. 文档与回归

- [x] 8.1 更新 `docs/knowledge/architecture/README.md`：前端 trip 上下文与 store 形状、`activeTripId` 持久化、统一政策匹配主体、景点列表 `petPolicies` 契约、AnimatedList + dnd-kit 面板。验证：文档字段、路由与行为与实现一致。
- [x] 8.2 运行前端回归：`npm run test`、`npm run build`，确认类型检查与单测通过。验证：无失败用例与构建错误。
- [x] 8.3 运行后端回归：`cd apps/server && ./mvnw test`，确认景点列表扩展未破坏既有用例。验证：BUILD SUCCESS。
- [x] 8.4 运行 Playwright 全量：确认重写后的目的地、行程、景点政策与认证用例通过。验证：无失败用例。
- [x] 8.5 非目标审查：确认未修改 trip 后端契约、未持久化草稿/整份行程、未提供 `toNext` 编辑、未做行程改名与多标签同步。验证：`git diff` 与反向断言。
- [x] 8.6 清理审查：grep 确认 `pawtrip.selectedDestination`、`pawtrip.tripDuration`、`useSelectedDestination`、`useTripDuration` 无残留引用（清理逻辑自身除外）。验证：grep 结果为空或仅剩清理代码。