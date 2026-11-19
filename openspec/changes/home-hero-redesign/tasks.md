## 1. 组件与素材

- [x] 1.1 从 git 历史 `9f743bb~1` 恢复 `apps/web/src/components/ui/tilted-card.tsx`（vendored 源码，零新增依赖）
- [x] 1.2 确认 `assets/home-title.png` 与 `assets/home-photos/` 5 张照片按设计稿顺序引用（阳光房狗床、房车狗猫、车窗柴犬、猫与食碗、草地玩耍）

## 2. 首页重写

- [x] 2.1 重写 `apps/web/src/routes/_authenticated/index.tsx`：删除问候语查询与展示，保留伙伴提示逻辑不变
- [x] 2.2 实现 hero：标题图（完整 alt、响应式宽度、入场动画）、居中按钮排（复用 buttonVariants：outline 白 pill「创建宠物档案」→ `/paws`，default 黑 pill「开始旅程」→ `/trips`，各带 CircleArrowRight 图标）
- [x] 2.3 实现照片行：5 张 TiltedCard（圆角、整屏宽行容器、窄视口横向滚动 + 主题化滚动条、大屏居中）
- [x] 2.4 视觉修订：标题图放大一倍（max-w 1120）、照片间距 gap-10、行容器整屏宽、min-[1330px] 居中，确保各视口无页面级横向溢出
- [x] 2.5 移除照片卡片 hover 描边（用户反馈悬停不需要边框），同步 spec 与 proposal
- [x] 2.6 「开始旅程」条件跳转：有激活行程 → `/attractions`，无激活行程 → `/cities`（复用现有 useActiveTrip）
- [x] 2.7 行程入口按钮文案随激活行程切换：有激活行程显示「继续旅程」，否则「开始旅程」
- [x] 2.8 标题内嵌图片：TiltedCard children 渲染渐变遮罩 + 标题（Pet Friendly Hotel / Park / Traffic / Canteen / Play），左对齐、text-lg、Constantia，仅悬停时淡入显示
- [x] 2.9 切换进入首页时 5 张卡片从左到右依次渐显（挂载级入场动画，延迟 index×150ms，TiltedCard intro 关闭）
- [x] 2.10 回滚图片溢出 hack：`tilted-card.tsx` 恢复 vendored 原版（保留尺寸钳制），卡片与图片统一 220×220

## 3. 契约同步

- [x] 3.1 移除 `e2e/authentication.spec.ts` 中的首页内容断言（首页不承载任何测试断言，会话与 URL 断言保留）

## 4. 浏览器验收

- [x] 4.1 桌面视口验收：标题图/按钮/5 卡片渲染、悬停显示内嵌标题与 tilt 生效、两按钮跳转正确、各宽度无页面级横向溢出
- [x] 4.2 移动视口验收：照片行横向滚动且滚动后卡片完整可见、标题与按钮不溢出不重叠、进入页面卡片左→右渐显