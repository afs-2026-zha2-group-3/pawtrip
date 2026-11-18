# Proposal

## Why

携宠出行的物品比普通旅行更多，用户目前只能靠记忆或通用清单准备，容易遗漏粮食、药品、牵引绳、航空箱等宠物必需品（US-18）。清单生成后还需要逐项确认是否已装进箱子，并在出发前看到整体打包进度（US-19）。PawTrip 当前没有清单数据模型与页面，本 change 补齐这块能力。

## What Changes

- 行程单 `/itinerary` 新增「携带清单」入口与打包进度文案（已勾选物品数 / 总物品数），入口与「查看当天路线规划」同层。点击打开与路线规划一致的弹窗，弹窗内按分类展示物品，支持勾选/取消勾选、新增自定义物品、删除物品、修改数量。
- 新增服务端清单领域：一次行程一份清单，按 `trip_id` 唯一；清单项共享数据模型（`id`、分类、名称、数量、勾选态、来源`TEMPLATE`/`CUSTOM`、模板键、排序）。清单与勾选态服务端按账号持久化，刷新与换设备同账号登录后保留。
- 生成采用静态人工维护模板 + 档案/场景映射，MVP 不做 AI：类型（猫/狗）→基础用品；体重/肩高→航空箱尺寸档与牵引用具规格；`hasLeash`/`hasVaccinationProof`→牵引绳/疫苗证明物品；大交通为飞机→航空箱与检疫/免疫证明；天数→粮食份数（天数 × 每日份量，固定每日 2 餐）。
- 清单生成后，读取时按当前行程（大交通、天数）与当前宠物档案同步模板项：新增的适用项自动补入，不适用的模板项隐藏，名称/分类与未手动覆盖的数量按模板刷新；自定义项、用户手动修改过的数量与已勾选状态保留。用户显式删除的模板项不会因同步被复活。
- 无宠物档案时接口返回 `PET_PROFILE_REQUIRED`，页面引导先到 `/paws` 创建档案；尚未生成清单时页面展示生成引导，不显示无意义进度。
- 不做出发前未完成提醒（Release 2）、一键购买缺少物品（Release 4）与 AI 生成。

## Capabilities

### New Capabilities

- `trip-packing-checklist`: 行程携带清单的服务端持久化、模板与场景映射、档案/行程变更合并规则、勾选态与打包进度口径。

### Modified Capabilities

- `trip-itinerary`: 行程单页新增携带清单入口、进度文案、清单弹窗与无档案/未生成/完成态引导。

## Impact

- 后端：新增 Flyway `V30__create_trip_packing_checklist.sql`；新增 `packing` 领域（实体、仓库、模板映射、服务、控制器、请求/响应 DTO）；新增错误码 `PACKING_CHECKLIST_NOT_FOUND`、`PACKING_ITEM_NOT_FOUND` 与 `PET_PROFILE_REQUIRED`；行程删除级联删除清单。
- 前端：新增 `apps/web/src/queries/packing-checklist.ts`；新增 `apps/web/src/components/trip/packing-checklist-dialog.tsx`；`apps/web/src/routes/_authenticated/itinerary.tsx` 增加入口、进度与弹窗；宠物保存后使清单查询失效以触发档案同步。
- 测试：后端 `PackingChecklistApiTest`、模板映射单测与迁移测试；前端清单纯函数/查询或组件测试；E2E 覆盖生成、增删改、勾选进度、持久化、档案变更保留自定义与勾选、无档案/未生成引导。
- 无新增依赖；模板为代码内静态常量，不建模板表、不调用外部服务。
