## Why

`/paws` 目前是受保护的空页面，而后端已提供完整的宠物增删改查接口和照片存储能力。用户需要在 Paws 页面看到自己的宠物并完成日常维护，当前没有任何前端入口，宠物能力处于不可用状态。

## What Changes

- 将 `/paws` 从空页面改造为宠物画廊：以 React Bits Tilted Card 网格展示当前用户自己的宠物，保持后端返回的 id 升序。
- 整张卡片可点击（支持 Tab + Enter/Space）打开宠物详情弹窗；详情弹窗展示全部字段，并可在同一弹窗内切换到编辑模式完成修改。
- 页面提供“添加宠物”入口，使用弹窗表单创建宠物；详情弹窗中提供删除入口，删除前使用 AlertDialog 二次确认。
- 新增前端宠物数据访问模块，复用现有 `request` 层与 TanStack Query：列表查询、创建、更新、删除，变更成功后使宠物列表失效。
- 宠物照片支持上传、预览与移除；展示时根据 base64 魔数推断 MIME 类型，避免后端返回的字节缺少 content type 导致图片无法渲染。无照片时显示占位样式。
- 表单在客户端镜像后端校验规则（名称非空、类型为猫/狗、体重与肩高大于 0、牵引绳与免疫证明必选、照片不超过 5MB），并展示可读的保存失败提示。
- 增加 shadcn Checkbox 组件源码，用于牵引绳与免疫证明开关。
- 明确 `ui-foundation` 对“以源码形式纳入、零运行时依赖的动效展示组件”的允许范围，避免 React Bits 组件与现有“仅使用 shadcn/ui”要求冲突。
- 不修改后端接口、数据库或宠物数据模型；不引入品种字段，宠物顺序保持 id 升序。
- 补充 Paws 页面 CRUD 的端到端测试，并更新知识库中“`/paws` 内容为空”的描述。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `paws-page`：将“Paws 页面内容为空”的要求替换为宠物画廊展示、详情查看、弹窗内编辑、新增、删除确认、照片处理以及空/加载/错误状态等行为要求。
- `ui-foundation`：补充允许零依赖、以源码纳入 `src/components/ui/` 的展示型动效组件；明确该允许范围不包含替代 shadcn 表单、导航与反馈控件。

## Impact

- 前端代码：`apps/web/src/routes/_authenticated/paws.tsx` 重写；新增宠物卡片与弹窗组件、`src/queries/pets.ts`、照片 MIME 辅助模块，以及 `src/components/ui/tilted-card.tsx`、`src/components/ui/checkbox.tsx`。
- 依赖：无新增运行时依赖；Tilted Card 以源码形式引入 React Bits TS + Tailwind 变体；Checkbox 通过 shadcn CLI 添加。
- 后端与数据库：无改动，复用 `GET/POST/PUT/DELETE /api/pets`。
- 测试：新增 Paws 宠物管理 E2E；现有认证与后端宠物接口测试不受影响。
- 文档：更新 `docs/knowledge/architecture/README.md` 中 `/paws` 空页面的描述。