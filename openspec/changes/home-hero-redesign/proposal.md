## Why

首页目前只有一张问候语卡片，而问候语接口是项目脚手架阶段的产物，已无产品价值。设计稿确定了新的品牌首页：标题素材图、两个入口按钮与一排宠物照片倾斜卡片，需要落地以建立产品第一印象。

## What Changes

- **BREAKING** 移除首页对 `/api/greeting` 问候语文本的展示（后端接口与 `greeting` spec 保留不动）。
- 首页改为品牌 hero 布局：`home-title.png` 标题图（含副标题，宽度约为原问候页视觉的两倍）、居中入口按钮排、整屏宽的照片行（5 张 220×220 宠物照片，间距 40px，窄视口横向滚动）。
- 每张照片卡片在图片内部渲染标题（Pet Friendly Hotel / Pet Friendly Park / Pet Traffic / Pet Canteen / Pet Play，左对齐、Constantia 字体），标题与底部渐变遮罩仅在悬停卡片时显示。
- 切换进入首页时，5 张照片卡片从左到右依次渐显。
- 「创建宠物档案」按钮跳转 `/paws`；行程入口按钮有激活行程时显示「继续旅程」并跳转 `/attractions`，无激活行程时显示「开始旅程」并跳转 `/cities`；均复用现有 Button 样式组件。
- 恢复曾在 `9f743bb` 中删除的 vendored 组件 `apps/web/src/components/ui/tilted-card.tsx`（React Bits TiltedCard TS+TW 变体，零运行时依赖），用于照片行。
- 照片卡片悬停不附加任何描边/边框；窄视口下照片行横向滚动，大屏整行居中。
- 伙伴提示气泡逻辑保持不变。
- 移除 `e2e/authentication.spec.ts` 中的首页内容断言：首页不承载任何测试断言，会话与 URL 断言保留。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `home-page`: 删除「首页展示问候语」要求；保留未登录跳转 `/login` 的访问控制；新增首页品牌展示与入口导航要求。

## Impact

- 前端：`apps/web/src/routes/_authenticated/index.tsx` 重写；恢复 `apps/web/src/components/ui/tilted-card.tsx`（vendored 原版，未做本地修改）；新增素材引用 `assets/home-title.png`、`assets/home-photos/*`（已在工作区）。
- 测试：`e2e/authentication.spec.ts` 首页断言替换；`home-page` spec 场景更新。
- 后端与 `greeting` spec：不受影响，接口继续提供。
- 依赖：无新增。