## 1. 组件与工具准备

- [x] 1.1 运行 `npx shadcn@latest add checkbox`（在 `apps/web` 下），确认生成 Base UI 版 `src/components/ui/checkbox.tsx` 且未改动其他组件。
- [x] 1.2 运行 `npx shadcn@latest add @react-bits/TiltedCard-TS-TW`，将 `src/components/TiltedCard.tsx` 移动到 `src/components/ui/tilted-card.tsx`，删除 `'use client'`，保留默认导出与 `TiltedCardLayer` 命名导出；确认 `package.json` 未新增运行时依赖。
- [x] 1.3 新建 `apps/web/src/lib/pet-photo.ts`：实现 `photoDataUrl`（JPEG/PNG/GIF/WebP 魔数推断）与 `readPhotoFile`（类型、5MB 上限、base64 与预览 data URL）。
- [x] 1.4 为 `pet-photo` 编写单元测试，覆盖四种格式、未知格式返回 `null`、非图片与超大文件拒绝。

## 2. 数据层

- [x] 2.1 新建 `apps/web/src/queries/pets.ts`：定义 `PetType`、`Pet`、`SavePetInput`、`petQueryKeys`、`petsQueryOptions`、创建/更新/删除 mutation options，全部经统一 `request` 层。
- [x] 2.2 确认列表 `queryKey` 为 `["pets"]`，三类变更成功后均使该 key 失效。

## 3. 页面与弹窗

- [x] 3.1 新建 `apps/web/src/routes/_authenticated/-pet-card.tsx`：使用 `TiltedCard` 展示照片（无照片/未知格式显示占位）、名字与猫/狗类型；配置 `onClick`、`gyroscope={false}`、`introDelay`，整卡 Enter/Space 可打开详情。
- [x] 3.2 新建 `apps/web/src/routes/_authenticated/-pet-dialogs.tsx`：实现详情弹窗（照片、名字、类型、体重、肩高、牵引绳、免疫证明）与同弹窗内编辑模式切换。
- [x] 3.3 在详情/创建表单中实现照片选择、即时预览与移除；移除后提交 `photo: null`，无照片时允许创建。
- [x] 3.4 实现表单客户端校验：名字 trim 非空、类型为 `CAT`/`DOG`、体重与肩高为大于 0 的有限数值；校验失败不发请求并展示字段错误。
- [x] 3.5 实现创建流程：添加宠物入口、`POST /api/pets`、成功关闭弹窗并刷新列表、失败保留输入并提示。
- [x] 3.6 实现更新流程：`PUT /api/pets/{id}`，成功后用响应更新弹窗数据并回到查看模式，同时刷新列表；取消编辑回到查看模式且不发请求。
- [x] 3.7 实现删除流程：详情弹窗删除按钮关闭详情并打开页面级 `AlertDialog`；取消不发请求，确认调用 `DELETE /api/pets/{id}` 并刷新列表。
- [x] 3.8 重写 `apps/web/src/routes/_authenticated/paws.tsx`：接入列表查询，渲染响应式卡片网格、加载占位、空状态与添加入口，并按 id 升序展示。
- [x] 3.9 验证首次加载失败进入根路由错误页并提供重试，后台刷新失败保留缓存数据。

## 4. 测试与验证

- [x] 4.1 新建 `e2e/paws-pet-management.spec.ts`：登录后进入 `/paws`，覆盖空状态、创建（含一次照片上传）、列表展示、整卡点击打开详情、弹窗内编辑、删除确认与删除后的空状态。
- [x] 4.2 运行 `npx tsc --noEmit -p apps/web/tsconfig.json`，修复类型错误。
- [x] 4.3 运行 `npm run build`（根目录），确认前端构建通过。
- [x] 4.4 运行 `npm test -w apps/web`（或 `cd apps/web && npm test`），确认单元测试通过。
- [x] 4.5 运行 `npm run test:e2e`，确认新 E2E 与既有认证 E2E 全部通过。
- [x] 4.6 启动前后端在浏览器手动验证：创建带照片/无照片宠物、卡片动画与键盘操作、详情编辑取消与保存、删除取消与确认、列表顺序、空状态与加载状态。

## 5. 文档与收尾

- [x] 5.1 更新 `docs/knowledge/architecture/README.md` 中“`/paws` 内容为空”的描述为宠物管理页，并补充宠物照片 MIME 处理约定。
- [x] 5.2 检查 `openspec/specs/paws-page/spec.md` 的 Purpose 文案，在归档阶段同步为宠物管理页面描述。
- [x] 5.3 确认未修改后端代码、数据库迁移或 `package.json` 运行时依赖；若出现额外改动，回退并单独评估。