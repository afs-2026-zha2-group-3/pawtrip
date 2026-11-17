## 1. 后端：地点政策字段扩展到 8 项

- [x] 1.1 扩展 `AdminLocationRequests.PetPolicies` 与 `AdminLocationResponses.PetPolicies`，增加 `allowedPetTypes`（`String`）和 `maxSinglePetShoulderHeightCm`（`Double`），更新 `PetPolicies.from`
- [x] 1.2 扩展 `LocationWriteService.PetPolicyValues` 与 `updateExtraInfo`，创建和更新时真正写入允许宠物类型与肩高，删除透传保留逻辑
- [x] 1.3 在 `AdminLocationService` 增加允许宠物类型枚举校验与肩高非负/最多两位小数校验，并确保校验失败不产生写入
- [x] 1.4 扩展 `AdminLocationApiTest`：创建/回填/清空 8 项政策、允许宠物类型四态、肩高非法值、更新缺省不改、整体替换、行政区政策不受影响
- [x] 1.5 确认 `openspec/specs/location-management/spec.md` 的 8 项政策行为与实现一致，地点列表响应保持原结构

## 2. 后端：城市管理 API

- [x] 2.1 在 `ApiErrorCode` 增加 `REGION_NOT_FOUND`（404），并在 `AdministrativeRegionRepository` 增加按名称排序读取全部行政区的方法
- [x] 2.2 新增 `AdminCityRequests`、`AdminCityResponses`：列表项、详情（含 `allowedDogBreedIds`）、更新请求（可选 `petPolicies` 与 `allowedDogBreedIds`）
- [x] 2.3 新增 `AdminCityService` 列表逻辑：过滤出全部城市级与无市级子节点的省级记录，支持省份、级别、关键词筛选与服务端分页，仅访问数据库
- [x] 2.4 新增 `AdminCityService` 详情与更新逻辑：未知 adcode 返回 `REGION_NOT_FOUND`，非叶省份返回 400，犬种 ID 校验/去重，政策与名单按“缺省不改、出现整体替换”处理，事务内先校验后写入
- [x] 2.5 新增 `AdminCityController` 暴露 `GET /api/admin/cities`、`GET /api/admin/cities/{adcode}`、`PATCH /api/admin/cities/{adcode}`，沿用 `ADMIN` 权限
- [x] 2.6 新增 `AdminCityApiTest`：列表口径（城市 + 省级叶节点、排除普通省份）、筛选分页、详情、更新整体替换与清空、未知犬种/非叶省份/非法值拒绝、权限校验

## 3. 前端：共享 8 项政策表单

- [x] 3.1 扩展 `queries/admin-locations.ts` 的 `PetPolicies`、`SaveLocationInput` 与 `UpdateLocationInput`，增加两个字段
- [x] 3.2 扩展 `lib/pet-policy.ts` 草稿、解析、回填与格式化，支持允许宠物类型四态与肩高两位小数，并更新 `lib/pet-policy.test.ts`
- [x] 3.3 扩展 `admin/-pet-policy-fields.tsx`：增加允许宠物类型下拉与肩高输入，保持现有三态与费用逻辑
- [x] 3.4 验证 `admin/-location-editor.tsx` 两个弹窗自动获得新字段，保存/回填/清空路径完整，并更新 `queries/admin-locations.test.ts`（如涉及）

## 4. 前端：城市管理页面

- [x] 4.1 新增 `queries/admin-cities.ts`：列表、详情、更新查询键与 mutation，类型包含 8 项政策与犬种 ID 列表
- [x] 4.2 将 `admin/locations.tsx` 的 `PaginationControls` 提取为 `admin/-pagination-controls.tsx`，地点页改为复用，行为不变
- [x] 4.3 实现 `admin/cities.tsx`：省份/级别/关键词筛选、服务端分页表格、政策配置摘要列与编辑入口，保持现有管理员守卫
- [x] 4.4 新增城市编辑弹窗（`admin/-city-editor.tsx`）：复用 `PetPolicyFields`，增加可搜索犬种复选框列表、回填、校验、保存后就地更新
- [x] 4.5 犬种选项复用 `GET /api/dog-breeds`，处理加载中、加载失败与未选择（不限制）状态

## 5. 端到端测试与验证

- [x] 5.1 更新 `e2e/admin-location-management.spec.ts`，覆盖 8 项政策的请求、回填、清空与非法值提示
- [x] 5.2 新增 `e2e/admin-city-management.spec.ts`：列表口径与筛选、翻页、编辑政策与犬种、保存后回填、非管理员访问
- [x] 5.3 运行后端测试（`mvn test` 或项目既有命令），确认地点与城市 API 全绿
- [x] 5.4 运行前端单元测试与构建，确认 `pet-policy` 与查询模块测试通过
- [x] 5.5 运行 Playwright 端到端测试，并在浏览器中手动验证两个页面：地点弹窗 8 项政策、城市页筛选/分页/编辑/犬种选择、不触发高德请求
