# Design

## Context

`add-trip-planning` 已交付 `trip` 表与 `/api/trips` CRUD，`plan` v1 为 `{version, days:[{day, stops:[{poiId, toNext?}]}], unscheduled:[{poiId}]}`；城市与宠物创建后不可变，更新为整量 `PUT`。前端目前仍以两个 `sessionStorage` 键承载规划上下文：

- `pawtrip.selectedDestination`：`/cities` 选定、`/attractions` 城市筛选、顶栏 chip；
- `pawtrip.tripDuration`：`/cities` 天数输入、`/attractions` 天 tab（纯展示）。

现有可复用约定：TanStack Router/Start（SSR）、TanStack Query、shadcn/Base UI、`request` 统一 CSRF/Problem Details；`@tanstack/store` 与 `@tanstack/react-store` 0.11.2 已作为传递依赖存在。React Bits AnimatedList 为可选中 listbox，带入场弹簧动画，但**不支持拖拽、分组表头或受控选中**。

本设计以 `add-trip-planning` 为基线；其他未归档 change 不参与契约推导，归档时需要另行对齐。

## Goals / Non-Goals

**Goals**

- 用 TanStack Store 的激活行程上下文替换 `sessionStorage` 目的地/天数，并让城市、景点、政策、交通规则共享同一上下文。
- 草稿 → 确认 → 激活 → 取消激活的单一生命周期；只持久化 `activeTripId`。
- Trips 页集中管理行程；左下角 AnimatedList 面板承载 tag、按天分组的地点与展开编辑。
- 计划编辑乐观更新 + 防抖保存，异常可重试。
- 统一"有激活宠物只匹配该宠物，否则匹配全部宠物"的政策匹配主体。

**Non-Goals**

- 不修改 trip 后端契约、不新增迁移、不做草稿服务端状态。
- 不做推荐算法、自动排程、地点间交通耗时/时刻编辑。
- 不做多标签页实时同步；整量 `PUT` 后写覆盖。
- 不迁移旧 `sessionStorage` 内容为 trip；仅清理旧键。
- 不做行程改名、分享、导出、地图。

## Decisions

### D1 生命周期：内存草稿 → 服务端 active

```
无 active / 无 draft
  /cities 候选列表
      │ 选定城市
      v
draft { cityAdcode, totalDays?, petId? }   // 仅内存
  面板 tag 可编辑；页面切到该城市详情
      │ 确认（天数 1–7、单只宠物）
      v
POST /api/trips  ->  active（与 DB 同构）
      │ 计划编辑：乐观更新 + 防抖 PUT
      │
      └─ /trips 取消激活 -> 清 active + activeTripId，回到无 active
```

- 确认前不落库；草稿刷新即丢失（需求方确认）。
- 同一时间最多一个 draft 或一个 active。存在 draft 时创建入口禁用；存在 active 时只有取消激活后才能再创建。
- 激活一个已有 trip 时若存在 draft，需先显式放弃 draft。
- 行程名在确认时自动生成：`{城市名} · {totalDays}天 · {宠物名}`；v1 不提供改名入口。
- 备选：草稿持久化 → 否决（需求方要求只持久化 `activeTripId`）；后端草稿态 → 否决（超出 trip-planning 契约）。

### D2 Store：DB 同构 + 缓存

```ts
type TripPlan = {
  version: 1;
  days: { day: number; stops: { poiId: string; toNext?: string | null }[] }[];
  unscheduled: { poiId: string }[];
};

type Trip = {
  id: number;
  name: string;
  cityAdcode: string;
  petId: number;
  totalDays: number;
  plan: TripPlan;
  createdAt: string;
  updatedAt: string;
};

type TripState = {
  draft: { cityAdcode: string; totalDays: number | null; petId: number | null } | null;
  active: Trip | null;
  cache: {
    city: { adcode: string; name: string; province: string } | null;
    pets: Record<number, Pet>;
    locations: Record<string, AttractionDetail>;
  };
  panel: { expanded: boolean };
  save: { status: 'idle' | 'saving' | 'saved' | 'error'; lastSavedAt?: string; message?: string };
  hydration: 'idle' | 'loading' | 'ready' | 'missing';
};
```

- `active` 只放 DB 字段；`plan` 不附加视图 id、不附加缓存字段。
- 缓存只存在于内存，不写 localStorage；地点详情按需补全，供面板展示。
- 视图层拖拽身份由 `day + index` 派生，拖拽会话内保持稳定，落盘前剥离。
- 单例 store 在客户端创建；服务端初始为空状态，避免 SSR 请求间串用户。登录成功后在客户端 hydrate。
- 读取使用 `useSelector`（`@tanstack/react-store`）按字段订阅；写入通过 store actions 封装，组件不直接 `setState`。
- 备选：把缓存合并进 `plan` → 否决（污染 DB 契约）；每个页面各自 `useState` → 否决（无法跨页共享）。

### D3 持久化与 hydrate

- localStorage 仅存 `pawtrip.activeTripId`（字符串/数字）。
- 登录成功后：读 id → `GET /api/trips/{id}`：
  - 200 → `active = detail`，`hydration = ready`；
  - 404/401 → 清 id、`active = null`、`hydration = missing`；
  - 网络失败 → 保留 id，`hydration = idle`，面板提供重试。
- 登出：清 `activeTripId`、清空 store 行程与行程相关缓存、`queryClient.clear()`。
- 切换用户时以 `GET` 的所有权校验兜底；不在 localStorage 中存用户标识。
- 备选：localStorage 存整个 trip → 否决（与"只持久化 activeTripId"冲突，且存在陈旧数据）。

### D4 统一政策匹配主体

```
subjects(state) =
  active?.petId
    ? [cache.pets[active.petId] ?? 查询中的该宠物]
    : 全部宠物
```

- 所有"政策匹配处"使用同一 `subjects`：城市候选卡、城市政策页、景点列表卡、景点详情、交通规则推荐列。
- 有 active 但宠物缓存未就绪时，先展示加载态，不用其他宠物兜底。
- 无 active 时逐只宠物产出结论，以 `宠物名 + 状态` tag 展示。
- 判定域保持各领域语义，但状态词汇统一：`friendly | unfriendly | unjudgeable | unconfigured`。
  - 城市：类型/品种/肩高；猫或无犬种对禁养名单 → `unjudgeable`。
  - 景点：限养数、类型、体重、肩高、牵引、疫苗；字段为 null 表示未配置，按既有展示语义跳过对应维度。
  - 交通规则：沿用 `evaluateRuleForPet` 的推荐/不推荐与原因。
- 宠物查询失败与"无宠物"必须区分：失败显示"暂时无法读取宠物"，不显示"无宠物"。
- 备选：按页面各自取"第一只宠物" → 否决（与统一规则冲突）。

### D5 Trips 页

- 新增 `/trips`，导航 Tab `Trips` 与路由同步。
- 列表 `GET /api/trips`，按 id 升序；城市名与宠物名通过 `/api/pets`、`/api/destinations`（或缓存）join，不要求后端扩列表字段。
- 激活中的行程显示"激活中"，操作为取消激活/删除；其他行程为激活/删除。
- 删除激活中的行程：二次确认 → 先取消激活（清本地）→ `DELETE`；失败则恢复提示。
- 激活：`GET /api/trips/{id}` 后写 store；已有 active 时不允许再激活。
- 草稿不出现在 Trips 页；它只存在于左下角面板。空列表展示引导去城市页。
- 备选：Trips 页展示内存草稿 → 否决（需求方未要求，且刷新即消失会造成困惑）。

### D6 城市页：候选 ↔ 城市详情

- 无 active 且无 draft：保持现有候选列表、搜索与宠物友好筛选；匹配标签改为逐宠物 tag。
- 选定城市：创建 draft，页面立即切到"该城市详情"视图，面板自动展开。
- 有 draft 或 active：`/cities` 只展示该城市详情，不展示候选、搜索、天数输入、筛选。
- 城市详情内容复用现有接口：城市名/省份（`/api/destinations`）、政策要点（`/api/cities/{adcode}/pet-policy`）、景点数量（`/api/locations/attractions?pageSize=1`）、完整政策页链接。
- draft 期如需换城市：在面板"放弃草稿"后回到候选列表；城市 tag 本身只读。
- 备选：保留候选列表并追加详情 → 否决（与"只显示激活 trip 所选城市"冲突）。

### D7 景点页：上下文、加入行程与匹配

- 仅有 active 时可用；无 active 时展示"先创建或激活行程"空态，不请求景点列表。
- 城市固定为 `active.cityAdcode`；天 tab 为 `1..active.totalDays`，当前天为本地 UI 状态，trip 切换时重置。
- 每个景点卡片/详情提供：
  - `加入第 N 天`（N 取当前天 tab）；
  - `暂不排期`（写入 `plan.unscheduled`）。
- 同日允许同一 `poiId` 重复；不做去重；跨天允许。
- 列表卡片按统一 `subjects` 展示逐宠物 tag；后端列表响应新增 `petPolicies`（8 字段），保持既有字段不变。
- 详情页同样展示逐宠物 tag 与政策字段。
- 备选：列表逐项拉详情 → 否决（N+1）；只详情出 tag → 否决（与统一规则不一致）。

### D8 计划编辑与自动保存

- Store actions：`addStop(target, poiId)`、`moveStop(from, to)`、`removeStop(target, index)`、`reorderDay(day, from, to)`。
- 所有编辑先乐观更新 store，再进入防抖队列（约 600ms）合并为一次 `PUT /api/trips/{id}`，请求体为 `{ name, totalDays, plan }`。
- 面板顶部展示 `保存中 / 已保存 / 保存失败`；失败保留本地改动并提供"重试"。
- 请求序列化：每次编辑递增版本号，仅最新响应可改写 `save` 状态；`400 VALIDATION_ERROR` 时重新拉取 detail 并以服务端为准，提示用户。
- `toNext` 不在本变更 UI 中编辑：新增 stop 不带 `toNext`；移动/删除时保留既有值，后端允许其悬空。
- 备选：显式保存按钮 → 否决（需求方选择自动保存）；每次操作立即 PUT → 否决（拖拽产生请求风暴）。

### D9 AnimatedList 与拖拽

- 以 vendor 方式引入 `components/ui/animated-list.tsx`，沿用 `tilted-card` 先例：
  - 删除默认 `DEFAULT_ITEMS` 与 `@hugeicons/*` 导入，保留 props 与动画引擎；
  - 增加最小补丁：支持不可选中的分组表头条目（`role=presentation`，跳过 hover/键盘选中）。
- 面板用单个 AnimatedList：条目序列 = 每天表头 + 当天 stops + "未排期"表头 + unscheduled。
- 拖拽使用 `@dnd-kit/core` + `@dnd-kit/sortable`：
  - 每天与"未排期"为可放置容器；stop 行为 sortable；
  - 行内提供专用拖拽把手，避免与 listbox 的点击选中冲突；`DragOverlay` 渲染拖拽预览；
  - 跨天移动在 `onDragEnd/onDragOver` 中改写目标天的 stops；
  - 重复 `poiId` 通过派生的 `day:index` key 区分，拖拽结束后重建 key。
- 备选：每天一个 AnimatedList + 自研指针拖拽 → 否决（滚动/动画/键盘被切割）；展开态换普通列表 → 否决（违背使用该组件的要求）。

### D10 面板布局

- 折叠：`fixed bottom-4 left-4 z-50` 浮层，展示 tag 行 + 有限高度列表 + 展开按钮。
- 展开：桌面端在认证布局左侧占一列（约 380px），高度铺满内容区，页面内容在剩余区域重新居中；展开/收起使用 CSS 过渡。
- 移动端（`<lg`）：展开改为全屏 sheet，不挤压页面内容。
- Tag 行：草稿期为"城市（只读）/ 天数步进器（1–7）/ 宠物单选 + 确认 + 放弃"；active 期为只读 tag + 保存状态。
- 面板在 `/login` 不渲染；登出动画期间不读写 store。

### D11 数据获取与缓存

- Trips/Trip detail/Pets/Destinations/City policy/Attractions 继续走 TanStack Query。
- 面板展示 stop 时读 `cache.locations[poiId]`；缺失时按可见条目发起详情查询并写回缓存，按 `poiId` 去重；不阻塞列表渲染。
- 宠物在 hydrate 时一次性拉取写入 `cache.pets`；城市信息随 `/api/destinations` 写入 `cache.city`。
- 详情页查询成功后同步写缓存，保证面板与页面一致；缓存不作为详情页的权威来源。

### D12 后端景点列表扩展

- `AttractionSummary` 增加 `petPolicies`（`allowedPetTypes`、`maxPetsPerPerson`、`maxSinglePetWeightKg`、`maxSinglePetShoulderHeightCm`、`leashRequired`、`vaccinationProofRequired`、`extraFeeCents`、`reservationRequired`），复用详情字段语义。
- 为新增式字段，不改变既有字段与筛选参数；补充 `LocationQueryController` 测试断言列表项携带政策。
- 备选：新增批量详情端点 → 否决（列表字段已足够，端点冗余）。

### D13 旧状态清理与 E2E

- 删除 `lib/selected-destination.ts`、`lib/trip-duration.ts` 及其单测；移除所有引用。
- 应用启动/登录后清理 `pawtrip.selectedDestination` 与 `pawtrip.tripDuration` 残留键。
- 保留 `pawtrip:selected-transport-mode`（本变更不涉及）。
- 重写 `e2e/destination-selection.spec.ts` 与 `e2e/trip-duration-input.spec.ts`；新增 Trips、面板、加入/拖拽/保存、政策 tag 用例。

## Risks / Trade-offs

- **草稿刷新丢失** → 面板明确"未确认"状态与放弃入口；确认流程保持短路径。
- **SSR 下 store 串用户** → 服务端空状态，客户端登录后 hydrate；所有行程数据仅在客户端写入。
- **AnimatedList vendor 漂移** → 补丁保持最小并在文件头注明来源与改动点；升级需手动对照。
- **拖拽与 listbox 交互冲突** → 专用拖拽把手 + 距离阈值；禁用 hover 选中；补充键盘与指针用例。
- **防抖保存竞态** → 版本号守卫 + 400 时以服务端为准重新 hydrate；失败不丢本地改动。
- **列表响应变大** → 每项增加 8 个政策字段，分页 20 条规模可接受；后续可改投影。
- **旧 E2E 全部失效** → 与实现同批重写，避免保留基于 sessionStorage 的断言。
- **未归档 change 的契约交错** → 本变更以主 specs 与 `add-trip-planning` 为基线；归档 `add-location-pet-rule-display` / `add-city-pet-policy` 时需对齐 `trip-attractions` 与统一匹配要求。

## Migration Plan

1. 后端：景点列表增加 `petPolicies` 并补测试（纯增量，可先行部署）。
2. 前端：加入依赖、vendor AnimatedList、建立 store/actions/selectors 与持久化。
3. 落地 Trips 页与城市页双态改造。
4. 落地景点页上下文、加入行程与统一匹配主体。
5. 落地面板、拖拽与自动保存。
6. 删除旧 store 与旧 E2E，更新架构文档，跑前后端全量回归。
7. 回滚：前端整体回退；后端新增字段可保留，不影响旧前端。

## Open Questions

- 无阻塞项。后续可另行决定：行程改名、`toNext` 编辑、多标签页同步、行程分享、草稿跨会话保留。