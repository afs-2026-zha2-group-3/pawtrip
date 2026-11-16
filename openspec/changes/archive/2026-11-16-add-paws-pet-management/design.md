## Context

`/paws` 当前由 `apps/web/src/routes/_authenticated/paws.tsx` 渲染空内容，`paws-page` 规格也定义为空页面。后端已完成宠物能力：`GET/POST/PUT/DELETE /api/pets`、`GET /api/pets/{id}` 与 `GET /api/dog-breeds`；`pet` 表包含 `name`、`pet_type`、`weight_kg`、`shoulder_height_cm`、`has_leash`、`has_vaccination_proof` 与 `photo`（BLOB，返回时 base64，≤5MB）。宠物没有品种字段，品种目录用于城市/地点限养规则。

前端已有统一 `request` 层、`ApiError`、按请求创建的 `QueryClient`、集中 query options 约定，以及 shadcn/ui（Base UI）组件。`ui-foundation` 要求交互与展示基础来自 `src/components/ui/`，禁止自定义 CSS 类选择器。

本次只改前端，不改后端接口、数据库或数据模型。

## Goals / Non-Goals

**Goals:**

- 让 Paws 页面成为可用的宠物管理入口：列表、详情、编辑、新增、删除。
- 用 Tilted Card 提供与 React Bits gallery 一致的卡片观感，同时保持键盘可访问与移动端可用。
- 复用现有请求层、错误处理与 query 约定，不新增运行时依赖。
- 正确处理无 content type 的 base64 照片。

**Non-Goals:**

- 不新增宠物品种字段、城市限养校验或行程可行性计算。
- 不修改后端接口、迁移或数据库 schema。
- 不实现分页、搜索、排序切换或缩略图服务。
- 不引入 toast、form 库或状态管理库。

## Decisions

### 1. 整卡点击打开详情，不使用翻面

`TiltedCard` 不传 `backContent`，通过 `onClick` 打开详情弹窗。传入 `onClick` 后组件会把 `figure` 渲染为 `role="button"`、可聚焦，并处理 Enter/Space，键盘可访问性由组件本身提供。`aria-label` 使用 `altText`（包含宠物名字与类型）。

关闭 `gyroscope`，避免用户第一次点击卡片时触发 iOS 运动权限请求；不设置 `captionText`，避免悬浮标签与卡片文字重复。

备选：翻面卡片。视觉更接近演示，但背面按钮会嵌套在 `role="button"` 容器内，ARIA 与事件冒泡都更复杂，因此不采用。

### 2. 一个详情弹窗同时承担查看与编辑，创建使用同一组件的创建模式

页面状态：

```text
dialog: { open: false } | { open: true; pet: Pet | null }   // pet=null 表示创建
pendingDelete: Pet | null
```

- 打开已有的宠物：弹窗初始为查看模式，展示照片、名字、类型、体重、肩高、牵引绳、免疫证明。
- 点击“编辑”：切换为编辑表单。
- 保存成功：使用 `PUT` 响应更新弹窗内的宠物对象并回到查看模式，同时使 `["pets"]` 失效。
- 取消编辑：丢弃草稿，回到查看模式，不发请求。
- 创建成功：关闭弹窗并使列表失效；新宠物按 id 升序出现在末尾。

详情数据直接使用列表项，不额外请求 `GET /api/pets/{id}`，因为列表响应已包含全部字段。

备选：查看与编辑分成两个弹窗。状态更多、切换时容易丢失上下文，不采用。

### 3. 删除确认放在页面级，避免嵌套模态框

详情弹窗点击“删除”后关闭详情并设置 `pendingDelete`，由页面级 `AlertDialog` 二次确认。取消不发送请求；确认调用 `DELETE /api/pets/{id}`，成功后使列表失效。

备选：在详情弹窗内再叠加 `AlertDialog`。Base UI 的嵌套浮层缺少明确文档保证，焦点与层级风险高于收益，不采用。备选：删除后保持详情打开并展示错误。确认失败时保留 `pendingDelete` 或允许重试，同时列表不变。

### 4. Tilted Card 采用 React Bits TS + Tailwind 变体并以源码纳入 `components/ui`

使用 `npx shadcn@latest add @react-bits/TiltedCard-TS-TW`，将生成的 `src/components/TiltedCard.tsx` 移动到 `apps/web/src/components/ui/tilted-card.tsx`，去掉 Next.js 专用的 `'use client'`，保留默认导出 `TiltedCard` 与命名导出 `TiltedCardLayer`。

该变体零运行时依赖，仅使用 React 与 Tailwind 类；不使用 `-JS-CSS` 变体，因为它会引入自定义 CSS 类，与 `ui-foundation` 冲突。React Bits 是源码分发而非 npm 运行时依赖，放入 `components/ui/` 符合现有目录约束。

卡片网格使用 `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`，每张卡片外层由合法布局元素约束尺寸，内部传入 `containerWidth/Height` 与 `imageWidth/Height` 为 `100%`；`introDelay={index * 80}` 做依次入场。

### 5. 照片：上传只发 base64，展示靠魔数推断 MIME

新增 `apps/web/src/lib/pet-photo.ts`：

- `photoDataUrl(base64: string | null): string | null`：解析 JPEG `FF D8 FF`、PNG `89 50 4E 47`、GIF `47 49 46 38`、WebP `RIFF....WEBP` 头部，返回带正确 MIME 的 data URL；无法识别返回 `null`。
- `readPhotoFile(file: File)`：校验图片类型与 5MB 上限，用 `FileReader` 生成预览 data URL，并返回提交所需的 base64。

提交时只发送 base64；移除照片时发送 `photo: null`。无照片、格式未知或读取失败时，卡片与详情展示占位（渐变底色 + 爪印图标），不渲染 `<img>`，避免破图。

备选：后端增加 content type 字段或独立图片接口。需要迁移与接口变更，超出本次范围。

### 6. 数据层集中到 `src/queries/pets.ts`

```text
PetType = "CAT" | "DOG"
Pet, SavePetInput
petQueryKeys = { all: ["pets"] }
petsQueryOptions()                         // GET /api/pets
createPetMutationOptions()                 // POST /api/pets
updatePetMutationOptions()                 // PUT /api/pets/{id}
deletePetMutationOptions()                 // DELETE /api/pets/{id}
```

所有调用经过 `request`；变更成功后 `invalidateQueries({ queryKey: ["pets"] })`。列表首次加载失败沿用 `throwOnError` 进入根路由错误页；后台刷新失败保留缓存。不做乐观更新，保持实现简单。

### 7. 表单与校验

表单使用 `Dialog`、`Field`、`Input`、`Select`、`Checkbox`、`Button`。需要新增 shadcn `Checkbox` 组件源码。

- 名字：`Input`，trim 后非空。
- 类型：`Select`，选项为猫 `CAT` / 狗 `DOG`。
- 体重、肩高：`Input type="number"`，必须为大于 0 的有限数值。
- 牵引绳、免疫证明：`Checkbox`，创建时默认未勾选。
- 照片：`Input type="file"`，接受 JPEG/PNG/WebP/GIF，展示预览并提供移除。

客户端校验失败不发送请求，错误通过 `FieldError` 展示。服务端 `400` 展示通用“保存失败，请检查填写内容”；网络或 5xx 展示可重试提示；弹窗保持打开并保留输入。

### 8. 文件布局

```text
apps/web/src/routes/_authenticated/paws.tsx          页面、查询与弹窗状态编排
apps/web/src/routes/_authenticated/-pet-card.tsx     Tilted Card 宠物卡片
apps/web/src/routes/_authenticated/-pet-dialogs.tsx  详情/编辑/创建弹窗与删除确认
apps/web/src/queries/pets.ts                         类型、query key、query/mutation options
apps/web/src/lib/pet-photo.ts                        照片 MIME 推断与文件读取
apps/web/src/components/ui/tilted-card.tsx           React Bits Tilted Card 源码
apps/web/src/components/ui/checkbox.tsx              shadcn Checkbox
```

`-` 前缀文件沿用管理员地点页面的就近组织方式，不会被 TanStack Router 识别为路由。

### 9. 状态与可访问性

- 列表 `isPending`：展示加载占位卡片，不展示空状态。
- 列表为空：展示空状态与添加入口。
- 初始加载失败：沿用根路由错误页与重试。
- 弹窗均有标题与描述；卡片通过 `role="button"` 与键盘操作可达。
- Tilted Card 内部已尊重 `prefers-reduced-motion`。

### 10. 验证策略

- 单元测试：`pet-photo` 的 MIME 推断、非图片/超大文件拒绝；表单校验函数（如抽出纯函数）。
- E2E：登录后进入 `/paws`，创建（含一次照片上传）、列表展示、整卡点击打开详情、弹窗内编辑、删除确认与空状态；断言请求顺序与 URL。
- 后端无改动，现有 `PetApiTest` 继续覆盖接口契约。

## Risks / Trade-offs

- **列表荷载**：多只带 5MB 照片的宠物会让 `GET /api/pets` 响应显著变大。→ 本次接受；后续可增加缩略图或独立图片接口。
- **格式识别**：魔数只能覆盖常见图片格式，HEIC 等格式会退化为占位。→ 上传端限制为 JPEG/PNG/WebP/GIF，并在提示中说明。
- **嵌套模态风险规避**：删除确认放在页面级，用户确认前详情弹窗已关闭。→ 取消后需重新打开详情，属于可接受的交互成本。
- **源码组件漂移**：React Bits 组件以源码纳入，后续上游更新不会自动同步。→ 在文件头记录来源与变体，必要时手动比对。
- **动画与测试稳定性**：3D 变换和入场动画可能影响 Playwright 点击。→ 使用 `getByRole("button", { name })` 定位，必要时等待 `intro` 结束后再点击。
- **规格 Purpose 残留**：`openspec/specs/paws-page/spec.md` 的 Purpose 仍描述“空页面”。→ 归档时检查并更新 Purpose 文案。

## Migration Plan

纯前端替换，无数据迁移。上线后 `/paws` 立即从空页面变为宠物管理页；回滚只需还原前端提交。知识库 `docs/knowledge/architecture/README.md` 中“`/paws` 内容为空”的描述随实现更新。

## Open Questions

无。未指定项采用以下默认值：创建时两个布尔字段默认未勾选；照片允许 JPEG/PNG/WebP/GIF 且不超过 5MB；删除确认采用页面级弹窗。